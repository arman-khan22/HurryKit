'use client';
import type { ToolPhase } from '@/lib/toolStore';
import { ProgressBar } from './ProgressBar';
import { formatBytes } from '@/engines/shared/naming';

type Props = {
  phase: ToolPhase;
  overall: number;
  fileCount: number;
  doneCount: number;
  etaText?: string | undefined;
  savedBytes?: number | undefined;
  onStart: () => void;
  onCancel: () => void;
  onClear: () => void;
  onRetry: () => void;
};

export function ConvertBar({
  phase,
  overall,
  fileCount,
  doneCount,
  etaText,
  savedBytes,
  onStart,
  onCancel,
  onClear,
  onRetry,
}: Props) {
  const isWorking = phase === 'preparing' || phase === 'converting';
  const isValidating = phase === 'validating';
  const isDone = phase === 'done';
  const isFailed = phase === 'failed';
  const isCancelled = phase === 'cancelled';
  const isReady = phase === 'ready';

  return (
    <div
      className="card border border-[var(--border)] p-4 sm:p-5 flex flex-col gap-4 shadow-sm"
      role="group"
      aria-label="Conversion controls"
    >
      {/* ── Working state: Progress bar + ETA + Cancel ──────────────────────── */}
      {isWorking && (
        <div className="space-y-3">
          <ProgressBar
            progress={overall}
            stageText={`Converting file ${Math.min(doneCount + 1, fileCount)} of ${fileCount}`}
            etaText={etaText}
            label="Overall conversion progress"
          />
          <div className="flex justify-between items-center pt-1">
            <span className="text-xs text-[var(--muted)]">
              {doneCount} of {fileCount} finished
            </span>
            <button
              type="button"
              onClick={onCancel}
              className="btn btn-ghost text-xs sm:text-sm py-1.5 px-3 text-[var(--muted)] hover:text-[var(--error)] border border-[var(--border)]"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
                <line x1="15" y1="9" x2="9" y2="15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                <line x1="9" y1="9" x2="15" y2="15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
              Cancel conversion
            </button>
          </div>
        </div>
      )}

      {/* ── Validating state ─────────────────────────────────────────────────── */}
      {isValidating && (
        <div className="flex items-center gap-3 py-1">
          <span className="inline-block animate-spin text-[var(--video)]" aria-hidden="true">
            ◌
          </span>
          <span className="text-sm font-medium text-[var(--text)]">
            Validating files and memory budget…
          </span>
        </div>
      )}

      {/* ── Ready state: Primary Convert button + Clear ─────────────────────── */}
      {isReady && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={onStart}
            disabled={fileCount === 0}
            className="btn btn-primary min-h-[48px] px-8 py-3.5 text-base font-semibold shadow-md flex-1 sm:flex-initial justify-center"
            id="convert-btn"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <polygon points="5 3 19 12 5 21 5 3" fill="currentColor" />
            </svg>
            Convert {fileCount > 1 ? `${fileCount} files` : 'now'}
          </button>

          <button
            type="button"
            onClick={onClear}
            className="btn btn-ghost text-sm py-2 px-3 text-[var(--muted)] hover:text-[var(--text)]"
          >
            Clear list
          </button>
        </div>
      )}

      {/* ── Done state: Summary + Convert again + Clear ──────────────────────── */}
      {isDone && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span
              className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ background: 'color-mix(in srgb, var(--ok) 15%, transparent)', color: 'var(--ok)' }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <polyline points="20 6 9 17 4 12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
            <div>
              <p className="text-sm font-bold text-[var(--text)]">
                Done · {doneCount} file{doneCount !== 1 ? 's' : ''} converted
              </p>
              {savedBytes !== undefined && savedBytes > 0 && (
                <p className="text-xs text-[var(--ok)] font-medium">
                  Total saved: {formatBytes(savedBytes)}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onStart}
              className="btn btn-primary text-sm py-2 px-4 shadow-sm"
            >
              Convert again
            </button>
            <button
              type="button"
              onClick={onClear}
              className="btn btn-ghost text-sm py-2 px-3 text-[var(--muted)]"
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {/* ── Cancelled state ──────────────────────────────────────────────────── */}
      {isCancelled && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-[var(--muted)] flex items-center gap-2">
            <span className="text-base">⊘</span> Conversion cancelled. You can change options or try again.
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onRetry}
              className="btn btn-primary text-sm py-2 px-4"
            >
              Resume / Try again
            </button>
            <button
              type="button"
              onClick={onClear}
              className="btn btn-ghost text-sm py-2 px-3 text-[var(--muted)]"
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {/* ── Failed state: Retry + Clear ──────────────────────────────────────── */}
      {isFailed && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-[var(--error)] font-medium flex items-center gap-2">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
              <line x1="12" y1="8" x2="12" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              <circle cx="12" cy="16" r="1" fill="currentColor" />
            </svg>
            Some files could not be converted.
          </p>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onRetry}
              className="btn btn-primary text-sm py-2 px-4"
            >
              Retry failed
            </button>
            <button
              type="button"
              onClick={onClear}
              className="btn btn-ghost text-sm py-2 px-3 text-[var(--muted)]"
            >
              Clear all
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
