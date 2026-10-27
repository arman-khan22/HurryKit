'use client';
import { useRef, useMemo, useEffect, useState } from 'react';
import type { Tool } from '@/registry/schema';
import { createToolStore, type ToolStore } from '@/lib/toolStore';
import { DropZone } from './DropZone';
import { FileQueue } from './FileQueue';
import { OptionsPanel } from './OptionsPanel';
import { ConvertBar } from './ConvertBar';
import { EngineLoader } from './EngineLoader';
import { ErrorNotice } from './ErrorNotice';
import { PrivacyBadge } from './PrivacyBadge';
import { ResultCard } from './ResultCard';
import { DownloadAll } from './DownloadAll';

type Props = { tool: Tool };

/**
 * The main interactive area of every tool page.
 * Client-side only with complete state machine orchestration:
 * Idle → Validating → Ready → Preparing → Converting → Done / Failed / Cancelled.
 */
export function ToolShell({ tool }: Props) {
  // Create one Zustand store per tool instance
  const storeRef = useRef<ReturnType<typeof createToolStore> | null>(null);
  if (!storeRef.current) {
    storeRef.current = createToolStore(tool);
  }
  const useStore = storeRef.current;

  const phase = useStore((s: ToolStore) => s.phase);
  const files = useStore((s: ToolStore) => s.files);
  const options = useStore((s: ToolStore) => s.options);
  const globalError = useStore((s: ToolStore) => s.globalError);
  const engineProgress = useStore((s: ToolStore) => s.engineProgress);
  const overall = useStore((s: ToolStore) => s.overall);
  const etaText = useStore((s: ToolStore) => s.etaText);

  const addFiles = useStore((s: ToolStore) => s.addFiles);
  const removeFile = useStore((s: ToolStore) => s.removeFile);
  const setOption = useStore((s: ToolStore) => s.setOption);
  const start = useStore((s: ToolStore) => s.start);
  const cancel = useStore((s: ToolStore) => s.cancel);
  const clear = useStore((s: ToolStore) => s.clear);
  const retry = useStore((s: ToolStore) => s.retry);

  const [inAppBrowser, setInAppBrowser] = useState(false);
  const [browserError, setBrowserError] = useState<string | null>(null);

  // Clean up blob URLs on page unmount
  useEffect(() => {
    return () => {
      clear();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Edge Case 43 & 44: Browser capability and in-app browser detection
  useEffect(() => {
    import('@/engines/shared/browser').then(({ isBrowserSupported, detectInAppBrowser }) => {
      const res = isBrowserSupported();
      if (!res.supported) {
        setBrowserError(
          `Your browser is missing required capabilities (${res.missingFeatures.join(', ')}). Please use a modern browser such as Chrome, Safari, Edge, or Firefox.`,
        );
      }
      setInAppBrowser(detectInAppBrowser());
    });
  }, []);

  const doneFiles = useMemo(() => files.filter((f) => f.status === 'done'), [files]);
  const hasFiles = files.length > 0;
  const isWorking = phase === 'preparing' || phase === 'converting';
  const hasFailed = phase === 'failed';

  // Edge Case 48: Warn user before leaving or reloading during conversion
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isWorking) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isWorking]);

  // Edge Case 49: Handle tab visibility change on mobile
  useEffect(() => {
    const handleVisibility = () => {
      if (document.hidden && isWorking) {
        const el = document.getElementById('live-announcer');
        if (el) {
          el.textContent =
            'Conversion running in background tab. Keep Hurrykit open to prevent mobile OS sleep.';
        }
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [isWorking]);

  // Calculate total saved bytes across done files
  const totalSavedBytes = useMemo(() => {
    return doneFiles.reduce((acc, f) => {
      if (f.result && f.bytes > f.result.bytes) {
        return acc + (f.bytes - f.result.bytes);
      }
      return acc;
    }, 0);
  }, [doneFiles]);

  const deptClass = `dept-${tool.department}`;

  return (
    <section className={deptClass} aria-label={`${tool.seo.primary} converter`}>
      <div className="space-y-4">
        {/* Edge Case 44: In-app browser guidance banner */}
        {inAppBrowser && (
          <div
            className="card bg-[color-mix(in_srgb,var(--warn)_12%,transparent)] border border-[var(--warn)] p-3.5 text-xs flex items-center justify-between gap-3 text-[var(--text)] animate-fade-in"
            role="status"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="text-base flex-shrink-0" aria-hidden="true">
                📱
              </span>
              <span>
                In-app browser detected. For fastest processing and direct downloads, tap <strong>⋯</strong> or <strong>⋮</strong> and choose <strong>Open in Chrome / Safari</strong>.
              </span>
            </div>
            <button
              type="button"
              onClick={() => setInAppBrowser(false)}
              aria-label="Dismiss browser tip"
              className="btn btn-ghost p-1 text-[var(--muted)] hover:text-[var(--text)] flex-shrink-0"
            >
              ✕
            </button>
          </div>
        )}

        {/* Edge Case 43: Unsupported browser error notice */}
        {browserError && (
          <ErrorNotice
            error={{
              code: 'UNSUPPORTED_BROWSER',
              message: browserError,
              recoverable: false,
            }}
          />
        )}

        {/* Privacy badge — permanent reassurance */}
        <PrivacyBadge />

        {/* Engine loading progress during preparation */}
        {phase === 'preparing' && (
          <EngineLoader progress={engineProgress} />
        )}

        {/* Global error notice (engine load failure, batch rejection, etc.) */}
        {globalError && (
          <ErrorNotice error={globalError} onRetry={retry} />
        )}

        {/* Drop zone — visible unless actively converting */}
        {!isWorking && (
          <DropZone
            tool={tool}
            onFiles={(newFiles) => {
              void addFiles(newFiles, tool);
            }}
            disabled={isWorking}
          />
        )}

        {/* Selected file queue with status and format badges */}
        {hasFiles && (
          <FileQueue
            files={files}
            onRemove={removeFile}
            disabled={isWorking}
          />
        )}

        {/* Conversion settings driven purely from registry */}
        {hasFiles && tool.options.length > 0 && (
          <OptionsPanel
            tool={tool}
            options={options}
            onChange={setOption}
            disabled={isWorking}
          />
        )}

        {/* Primary Convert / Progress / Cancel / Done Bar */}
        {hasFiles && (
          <ConvertBar
            phase={phase}
            overall={overall}
            fileCount={files.length}
            doneCount={doneFiles.length}
            etaText={etaText}
            savedBytes={totalSavedBytes}
            onStart={() => start(tool)}
            onCancel={cancel}
            onClear={clear}
            onRetry={retry}
          />
        )}

        {/* Results section with individual previews and DownloadAll ZIP */}
        {doneFiles.length > 0 && (
          <div
            className="space-y-3.5 pt-2 animate-slide-up"
            role="region"
            aria-label="Conversion results"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-base sm:text-lg font-bold text-[var(--text)]">
                Ready to Download ({doneFiles.length})
              </h2>
            </div>

            <div className="space-y-3">
              {doneFiles.map((f) => (
                <ResultCard key={f.id} file={f} />
              ))}
            </div>

            {doneFiles.length >= 2 && (
              <div className="pt-2">
                <DownloadAll files={doneFiles} toolSlug={tool.slug} />
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
