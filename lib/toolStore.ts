/**
 * Zustand store — one instance per tool page (created via createToolStore).
 * Manages the full state machine:
 *   idle → validating → ready → preparing → converting → done | failed | cancelled.
 */
'use client';
import { create } from 'zustand';
import type { Tool } from '@/registry/schema';
import type { JobError, JobProgress } from '@/engines/types';
import { detectFormat } from '@/engines/shared/detect';
import { memoryGuard } from '@/engines/shared/memory';
import { getRecommendedToolForFormat } from '@/engines/shared/browser';
import {
  track,
  reportError,
  getSizeBucket,
  getDurationBucket,
  getBrowserInfo,
} from '@/lib/analytics';

// ─── State types ──────────────────────────────────────────────────────────────

export type FileStatus = 'queued' | 'working' | 'done' | 'failed' | 'cancelled';

export type FileItem = {
  id: string;
  file: File;
  name: string;
  bytes: number;
  detectedFormat?: string | undefined;
  status: FileStatus;
  progress: number;
  /** Stage text (e.g. "Converting…", "Encoding video…") */
  stage?: string | undefined;
  result?: {
    blob: Blob;
    fileName: string;
    bytes: number;
    url: string; // object URL — revoked on clear / unmount
    notes?: string[] | undefined;
  } | undefined;
  error?: JobError | undefined;
  /** Memory, format or size warning */
  warning?: string | undefined;
};

export type ToolPhase =
  | 'idle'
  | 'validating'
  | 'ready'
  | 'preparing'
  | 'converting'
  | 'done'
  | 'failed'
  | 'cancelled';

export type ToolState = {
  phase: ToolPhase;
  files: FileItem[];
  options: Record<string, string | number | boolean>;
  engineReady: boolean;
  /** Overall progress 0–1 */
  overall: number;
  /** Engine loading progress 0–1 */
  engineProgress: number;
  /** Estimated time remaining in seconds */
  etaSeconds?: number | undefined;
  /** Formatted ETA string (e.g. "~12s left") */
  etaText?: string | undefined;
  /** Global error (engine load failure etc.) */
  globalError?: JobError | undefined;
  /** Abort controller for the current batch */
  abortController?: AbortController | undefined;
};

export type ToolActions = {
  addFiles: (files: File[], tool: Tool) => Promise<void>;
  removeFile: (id: string) => void;
  setOption: (key: string, value: string | number | boolean) => void;
  start: (tool: Tool) => void;
  cancel: () => void;
  clear: () => void;
  retry: () => void;
  /** Internal: update a specific file */
  _updateFile: (id: string, patch: Partial<FileItem>) => void;
  _setPhase: (phase: ToolPhase) => void;
  _setEngineProgress: (p: number) => void;
  _setGlobalError: (err: JobError) => void;
  _setEngineReady: (ready: boolean) => void;
  _recalcOverall: () => void;
};

export type ToolStore = ToolState & ToolActions;

// ─── Default options builder ──────────────────────────────────────────────────

function buildDefaultOptions(tool: Tool): Record<string, string | number | boolean> {
  const opts: Record<string, string | number | boolean> = {};
  for (const opt of tool.options) {
    opts[opt.id] = opt.default;
  }
  return opts;
}

// ─── ID generator ─────────────────────────────────────────────────────────────

let idCounter = 0;
function nextId(): string {
  return `f-${Date.now()}-${++idCounter}`;
}

function announce(msg: string) {
  if (typeof document !== 'undefined') {
    const el = document.getElementById('live-announcer');
    if (el) el.textContent = msg;
  }
}

// ─── Store factory ────────────────────────────────────────────────────────────

export function createToolStore(tool: Tool) {
  return create<ToolStore>((set, get) => ({
    // ── Initial state ──────────────────────────────────────────────────────
    phase: 'idle',
    files: [],
    options: buildDefaultOptions(tool),
    engineReady: false,
    overall: 0,
    engineProgress: 0,
    etaSeconds: undefined,
    etaText: undefined,

    // ── Actions ────────────────────────────────────────────────────────────

    addFiles: async (newFiles, t) => {
      const current = get().files;
      set({ phase: 'validating', globalError: undefined });

      // Enforce batch limits
      const remainingSlots = Math.max(0, t.limits.maxFiles - current.length);
      const toAdd = newFiles.slice(0, remainingSlots);
      const skipped = newFiles.length - toAdd.length;

      if (skipped > 0) {
        announce(
          `Skipped ${skipped} file${skipped !== 1 ? 's' : ''}. Maximum batch size is ${t.limits.maxFiles} files.`,
        );
      }

      if (toAdd.length === 0) {
        set({ phase: current.length > 0 ? 'ready' : 'idle' });
        return;
      }

      const items: FileItem[] = [];
      let blockedCount = 0;
      let firstBlockMessage: string | undefined;

      for (const file of toAdd) {
        // Case 3: Zero-byte file
        if (file.size === 0) {
          blockedCount++;
          const zeroMsg = 'This file is empty (0 bytes).';
          if (!firstBlockMessage) firstBlockMessage = zeroMsg;
          items.push({
            id: nextId(),
            file,
            name: file.name,
            bytes: 0,
            status: 'failed',
            progress: 0,
            error: {
              code: 'CORRUPT_FILE',
              message: zeroMsg,
              recoverable: false,
            },
          });
          continue;
        }

        // 1. Detect format by magic bytes (Cases 1 & 2)
        const detected = await detectFormat(file);
        const formatId = detected?.id;

        // 2. Memory guard & size check (Cases 5, 6, 40)
        const guard = memoryGuard(file, t.limits);

        const isBlocked = guard.status === 'block';
        if (isBlocked) {
          blockedCount++;
          if (!firstBlockMessage) firstBlockMessage = guard.message;
        }

        // Format warnings & cross-tool recommendations (Cases 13 & 14)
        let formatWarning: string | undefined;
        if (formatId) {
          if (formatId === t.to) {
            // Case 13: Input already in target format
            formatWarning = 'File is already in the target format. Re-encoding will create a new copy.';
          } else if (!t.from.includes(formatId)) {
            // Case 14: Wrong format / wrong department
            const rec = getRecommendedToolForFormat(formatId);
            if (rec) {
              formatWarning = `This looks like a ${formatId.toUpperCase()} file. Visit our ${rec.title} for dedicated tools.`;
            } else {
              formatWarning = `Detected as ${formatId.toUpperCase()}, which may not match this converter.`;
            }
          }
        }

        items.push({
          id: nextId(),
          file,
          name: file.name,
          bytes: file.size,
          detectedFormat: formatId,
          status: isBlocked ? 'failed' : 'queued',
          progress: 0,
          warning: guard.status === 'warn' ? guard.message : formatWarning,
          error: isBlocked
            ? {
                code: guard.code ?? 'TOO_LARGE',
                message: guard.message ?? 'File exceeds size limits for this device.',
                recoverable: false,
              }
            : undefined,
        });
      }

      const validNew = items.filter((i) => i.status === 'queued');
      const allFiles = [...current, ...items];

      if (validNew.length > 0) {
        set({
          files: allFiles,
          phase: 'ready',
          globalError: undefined,
        });
        announce(
          `${validNew.length} file${validNew.length !== 1 ? 's' : ''} added. Ready to convert.`,
        );
      } else {
        // All dropped files were blocked/rejected
        // Transition Validating -> Idle with clear message
        set({
          files: allFiles.filter((f) => f.status !== 'failed'),
          phase: current.length > 0 ? 'ready' : 'idle',
          globalError: {
            code: 'TOO_LARGE',
            message:
              firstBlockMessage ??
              `All ${blockedCount} selected file(s) exceeded the size limit for this converter.`,
            recoverable: false,
          },
        });
        announce(`Files rejected: ${firstBlockMessage ?? 'exceeds size limit.'}`);
      }
    },

    removeFile: (id) => {
      set((s) => {
        const files = s.files.filter((f) => f.id !== id);
        // Revoke result URL
        const removed = s.files.find((f) => f.id === id);
        if (removed?.result?.url) URL.revokeObjectURL(removed.result.url);
        return {
          files,
          phase: files.length === 0 ? 'idle' : s.phase === 'done' && files.some((f) => f.status === 'queued') ? 'ready' : s.phase,
        };
      });
      announce('File removed.');
    },

    setOption: (key, value) => {
      set((s) => {
        const nextOptions = { ...s.options, [key]: value };
        // Keep the user's place: changing an option after results re-enables Convert without clearing files
        if (s.phase === 'done' || s.phase === 'failed' || s.phase === 'cancelled') {
          return {
            options: nextOptions,
            phase: 'ready',
            files: s.files.map((f) => ({
              ...f,
              status: f.status === 'cancelled' || f.status === 'failed' || f.status === 'done' ? 'queued' : f.status,
              progress: 0,
              stage: undefined,
              error: undefined,
            })),
            etaText: undefined,
            etaSeconds: undefined,
          };
        }
        return { options: nextOptions };
      });
    },

    start: (t) => {
      set({
        phase: 'preparing',
        engineProgress: 0,
        globalError: undefined,
        etaText: undefined,
        etaSeconds: undefined,
      });
      void runConversions(t, get, set);
    },

    cancel: () => {
      get().abortController?.abort();
      set((s) => ({
        phase: 'cancelled',
        files: s.files.map((f) =>
          f.status === 'queued' || f.status === 'working'
            ? { ...f, status: 'cancelled', progress: 0, stage: undefined }
            : f,
        ),
        abortController: undefined,
        etaText: undefined,
        etaSeconds: undefined,
      }));
      announce('Conversion cancelled.');
    },

    clear: () => {
      // Revoke all result object URLs
      get().files.forEach((f) => {
        if (f.result?.url) URL.revokeObjectURL(f.result.url);
      });
      set({
        phase: 'idle',
        files: [],
        overall: 0,
        engineProgress: 0,
        etaSeconds: undefined,
        etaText: undefined,
        globalError: undefined,
        abortController: undefined,
      });
      announce('All files cleared.');
    },

    retry: () => {
      set((s) => ({
        phase: 'ready',
        globalError: undefined,
        files: s.files.map((f) =>
          f.status === 'failed' || f.status === 'cancelled'
            ? { ...f, status: 'queued', progress: 0, error: undefined, stage: undefined }
            : f,
        ),
        etaText: undefined,
        etaSeconds: undefined,
      }));
      announce('Ready to retry conversion.');
    },

    _updateFile: (id, patch) =>
      set((s) => ({
        files: s.files.map((f) => (f.id === id ? { ...f, ...patch } : f)),
      })),

    _setPhase: (phase) => set({ phase }),
    _setEngineProgress: (engineProgress) => set({ engineProgress }),
    _setGlobalError: (globalError) => set({ globalError, phase: 'failed' }),
    _setEngineReady: (engineReady) => set({ engineReady }),

    _recalcOverall: () => {
      const { files } = get();
      if (!files.length) return;
      const total = files.reduce((acc, f) => acc + f.progress, 0);
      set({ overall: total / files.length });
    },
  }));
}

// ─── Async batch runner ───────────────────────────────────────────────────────

async function runConversions(
  tool: Tool,
  get: () => ToolStore,
  set: (patch: Partial<ToolStore> | ((s: ToolStore) => Partial<ToolStore>)) => void,
) {
  const abortController = new AbortController();
  set({ abortController, phase: 'preparing' });
  const startTime = Date.now();
  track('tool_started', { toolId: tool.id });

  try {
    // 1. Load engine
    const engineStart = Date.now();
    const { getEngine } = await import('@/engines/factory');
    const engine = await getEngine(tool.engine);

    announce('Loading conversion engine…');
    await engine.prepare((p: JobProgress) => {
      set({ engineProgress: p.fraction, phase: 'preparing' });
    });

    track('engine_load', {
      status: 'success',
      timeBucket: getDurationBucket(Date.now() - engineStart),
    });

    set({ engineReady: true, phase: 'converting' });
    announce('Engine ready. Starting conversion…');

    const queued = get().files.filter((f) => f.status === 'queued');
    const totalFiles = get().files.length;
    let completedCount = get().files.filter((f) => f.status === 'done').length;

    for (const fileItem of queued) {
      if (abortController.signal.aborted) break;

      get()._updateFile(fileItem.id, {
        status: 'working',
        progress: 0,
        stage: 'Reading file…',
      });

      try {
        const from = fileItem.detectedFormat ?? tool.from[0] ?? 'unknown';

        const result = await engine.run(
          {
            file: fileItem.file,
            toolId: tool.id,
            from,
            to: tool.to,
            options: get().options,
            limits: tool.limits,
          },
          (progress: JobProgress) => {
            const fileProgress = progress.fraction;
            get()._updateFile(fileItem.id, {
              progress: fileProgress,
              stage: stageLabel(progress.stage),
            });

            // Calculate overall progress & ETA
            const currentOverall = (completedCount + fileProgress) / Math.max(1, totalFiles);
            const elapsedSeconds = (Date.now() - startTime) / 1000;

            let etaSeconds: number | undefined;
            let etaText: string | undefined;

            if (currentOverall > 0.04 && currentOverall < 0.99) {
              const estimatedTotal = elapsedSeconds / currentOverall;
              etaSeconds = Math.max(1, Math.round(estimatedTotal - elapsedSeconds));
              if (etaSeconds < 60) {
                etaText = `~${etaSeconds}s left`;
              } else {
                etaText = `~${Math.ceil(etaSeconds / 60)}m left`;
              }
            } else if (currentOverall <= 0.04) {
              etaText = 'Estimating…';
            }

            set({ overall: currentOverall, etaSeconds, etaText });
          },
          abortController.signal,
        );

        completedCount++;
        const url = URL.createObjectURL(result.blob);

        get()._updateFile(fileItem.id, {
          status: 'done',
          progress: 1,
          stage: undefined,
          result: {
            blob: result.blob,
            fileName: result.fileName,
            bytes: result.bytes,
            url,
            notes: result.notes,
          },
        });

        announce(`Converted ${fileItem.name} (${completedCount} of ${totalFiles})`);

        const durationMs = Date.now() - startTime;
        track('conversion_finished', {
          toolId: tool.id,
          from: fileItem.detectedFormat ?? tool.from[0] ?? 'unknown',
          to: tool.to,
          sizeBucket: getSizeBucket(fileItem.bytes),
          durationBucket: getDurationBucket(durationMs),
          enginePath: tool.strategy,
        });
      } catch (err) {
        if (abortController.signal.aborted) {
          get()._updateFile(fileItem.id, {
            status: 'cancelled',
            progress: 0,
            stage: undefined,
          });
          break;
        }

        const jobErr =
          err && typeof err === 'object' && 'code' in err
            ? (err as JobError)
            : { code: 'UNKNOWN' as const, message: String(err), recoverable: true };

        get()._updateFile(fileItem.id, {
          status: jobErr.code === 'CANCELLED' ? 'cancelled' : 'failed',
          progress: 0,
          stage: undefined,
          error: jobErr,
        });

        if (jobErr.code !== 'CANCELLED') {
          const bInfo = getBrowserInfo();
          track('conversion_failed', {
            toolId: tool.id,
            errorCode: jobErr.code,
            browser: bInfo.browser,
            version: bInfo.version,
          });
          reportError(jobErr.code, tool.id);
        }

        announce(`Failed to convert ${fileItem.name}: ${jobErr.message}`);
      }

      get()._recalcOverall();
    }

    if (abortController.signal.aborted) {
      set({
        phase: 'cancelled',
        abortController: undefined,
        etaText: undefined,
        etaSeconds: undefined,
      });
      return;
    }

    // Final outcome evaluation
    const { files: finalFiles } = get();
    const anyDone = finalFiles.some((f) => f.status === 'done');
    const anyFailed = finalFiles.some((f) => f.status === 'failed');
    const allCancelled = finalFiles.every((f) => f.status === 'cancelled');

    set({
      phase: allCancelled ? 'cancelled' : anyDone ? 'done' : anyFailed ? 'failed' : 'ready',
      abortController: undefined,
      etaText: undefined,
      etaSeconds: undefined,
    });

    const doneCount = finalFiles.filter((f) => f.status === 'done').length;
    if (doneCount > 0) {
      announce(
        `Conversion complete! ${doneCount} file${doneCount !== 1 ? 's' : ''} ready to download.`,
      );
    }
  } catch (err) {
    const jobErr =
      err && typeof err === 'object' && 'code' in err
        ? (err as JobError)
        : {
            code: 'ENGINE_LOAD_FAILED' as const,
            message:
              'Could not load the conversion engine. Please check your connection and try again.',
            recoverable: true,
          };

    track('engine_load', {
      status: 'failure',
      timeBucket: getDurationBucket(Date.now() - startTime),
    });
    reportError(jobErr.code, tool.id);

    set({
      globalError: jobErr,
      phase: 'failed',
      abortController: undefined,
      etaText: undefined,
      etaSeconds: undefined,
    });
    announce(`Error: ${jobErr.message}`);
  }
}

function stageLabel(stage: string): string {
  const labels: Record<string, string> = {
    'loading-engine': 'Loading converter…',
    reading: 'Reading file…',
    detecting: 'Detecting format…',
    converting: 'Converting…',
    encoding: 'Encoding…',
    finishing: 'Finishing…',
  };
  return labels[stage] ?? 'Working…';
}
