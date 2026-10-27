'use client';
import type { FileItem } from '@/lib/toolStore';
import { formatBytes } from '@/engines/shared/naming';

type Props = {
  files: FileItem[];
  onRemove: (id: string) => void;
  disabled?: boolean;
};

const STATUS_ICONS: Record<string, string> = {
  queued: '○',
  working: '◌',
  done: '✓',
  failed: '✕',
  cancelled: '⊘',
};

const STATUS_COLORS: Record<string, string> = {
  queued: 'var(--muted)',
  working: 'var(--video)',
  done: 'var(--ok)',
  failed: 'var(--error)',
  cancelled: 'var(--muted)',
};

export function FileQueue({ files, onRemove, disabled }: Props) {
  if (files.length === 0) return null;

  return (
    <div
      role="list"
      aria-label="Files to convert"
      className="space-y-2.5"
    >
      {files.map((f) => {
        const pct = Math.round(f.progress * 100);

        return (
          <div
            key={f.id}
            role="listitem"
            className="card py-3 px-4 transition-all duration-150 animate-fade-in flex flex-col sm:flex-row sm:items-center justify-between gap-3 border border-[var(--border)]"
          >
            {/* Left section: Status icon, name, details */}
            <div className="flex items-start sm:items-center gap-3 min-w-0 flex-1">
              {/* Status icon / spinner */}
              <span
                aria-label={`Status: ${f.status}`}
                className="text-base font-bold flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-full text-center mt-0.5 sm:mt-0"
                style={{
                  color: STATUS_COLORS[f.status] ?? 'var(--muted)',
                  background:
                    f.status === 'done'
                      ? 'color-mix(in srgb, var(--ok) 12%, transparent)'
                      : f.status === 'failed'
                        ? 'color-mix(in srgb, var(--error) 12%, transparent)'
                        : 'var(--surface-2)',
                }}
              >
                {f.status === 'working' ? (
                  <span className="inline-block animate-spin text-sm" aria-hidden="true">
                    ◌
                  </span>
                ) : (
                  <span aria-hidden="true" className="text-sm">
                    {STATUS_ICONS[f.status] ?? '○'}
                  </span>
                )}
              </span>

              {/* File details */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p
                    className="text-sm font-semibold text-[var(--text)] truncate"
                    title={f.name}
                  >
                    {f.name}
                  </p>
                  {f.detectedFormat && (
                    <span
                      className="text-[10px] font-mono font-medium px-1.5 py-0.5 rounded uppercase tracking-wider flex-shrink-0"
                      style={{
                        background: 'var(--surface-2)',
                        color: 'var(--muted)',
                        border: '1px solid var(--border)',
                      }}
                    >
                      {f.detectedFormat}
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-[var(--muted)] mt-0.5">
                  <span>{formatBytes(f.bytes)}</span>

                  {f.status === 'working' && f.stage && (
                    <span className="text-[var(--video)] font-medium">· {f.stage}</span>
                  )}

                  {f.status === 'cancelled' && (
                    <span className="text-[var(--muted)] italic">· Cancelled</span>
                  )}
                </div>

                {/* Soft warning badge */}
                {f.warning && (
                  <div className="flex items-center gap-1.5 mt-1.5 text-xs text-[var(--warn)]">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      <path
                        d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <line x1="12" y1="9" x2="12" y2="13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                      <circle cx="12" cy="17" r="1" fill="currentColor" />
                    </svg>
                    <span>{f.warning}</span>
                  </div>
                )}

                {/* File error message */}
                {f.error && (
                  <p className="text-xs text-[var(--error)] mt-1 font-medium">
                    {f.error.message}
                  </p>
                )}
              </div>
            </div>

            {/* Right section: Progress bar or Done summary or Remove button */}
            <div className="flex items-center gap-3 sm:flex-shrink-0 justify-end mt-2 sm:mt-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-[var(--border)]">
              {/* Working progress indicator */}
              {f.status === 'working' && (
                <div
                  className="w-28 sm:w-36 flex flex-col gap-1"
                  role="progressbar"
                  aria-valuenow={pct}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label={`Converting ${f.name}: ${pct}%`}
                >
                  <div className="progress-track h-2">
                    <div
                      className="progress-fill transition-all duration-150"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="text-[11px] text-[var(--muted)] text-right font-medium">
                    {pct}%
                  </span>
                </div>
              )}

              {/* Done size comparison */}
              {f.status === 'done' && f.result && (
                <div className="text-right flex-shrink-0">
                  <p className="text-xs font-semibold text-[var(--ok)]">
                    {formatBytes(f.result.bytes)}
                  </p>
                  {f.bytes > 0 && f.result.bytes !== f.bytes && (
                    <p className="text-[11px] text-[var(--muted)]">
                      {f.result.bytes < f.bytes
                        ? `−${Math.round((1 - f.result.bytes / f.bytes) * 100)}%`
                        : `+${Math.round((f.result.bytes / f.bytes - 1) * 100)}%`}
                    </p>
                  )}
                </div>
              )}

              {/* Remove button */}
              {!disabled && f.status !== 'working' && (
                <button
                  type="button"
                  onClick={() => onRemove(f.id)}
                  aria-label={`Remove ${f.name} from conversion list`}
                  className="btn btn-ghost p-2 rounded-full text-[var(--muted)] hover:text-[var(--error)] hover:bg-[color-mix(in_srgb,var(--error)_10%,transparent)] transition-colors"
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <line x1="18" y1="6" x2="6" y2="18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    <line x1="6" y1="6" x2="18" y2="18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
