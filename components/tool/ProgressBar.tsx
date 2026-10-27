'use client';

interface ProgressBarProps {
  progress: number; // 0 to 1 or 0 to 100
  label?: string | undefined;
  stageText?: string | undefined;
  etaText?: string | undefined;
  indeterminate?: boolean | undefined;
  className?: string | undefined;
}

export function ProgressBar({
  progress,
  label,
  stageText,
  etaText,
  indeterminate = false,
  className = '',
}: ProgressBarProps) {
  // Normalize progress to 0-100 range
  const normalized = progress > 1 ? progress : progress * 100;
  const clamped = Math.min(100, Math.max(0, normalized));
  const rounded = Math.round(clamped);

  return (
    <div
      className={`w-full space-y-1.5 ${className}`}
      role="progressbar"
      aria-valuenow={indeterminate ? undefined : rounded}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label ?? (stageText ? `${stageText} (${rounded}%)` : 'Progress')}
    >
      <div className="flex justify-between items-center text-xs text-[var(--muted)]">
        <span className="font-medium text-[var(--text)] truncate max-w-[65%]">
          {stageText ?? label ?? 'Processing…'}
        </span>
        <div className="flex items-center gap-2 flex-shrink-0">
          {etaText && (
            <span className="text-[11px] font-mono text-[var(--muted)] bg-[var(--surface-2)] px-1.5 py-0.5 rounded border border-[var(--border)]">
              {etaText}
            </span>
          )}
          <span className="font-semibold text-[var(--text)]">
            {indeterminate ? '…' : `${rounded}%`}
          </span>
        </div>
      </div>

      <div className="w-full h-2.5 rounded-full bg-[var(--surface-2)] overflow-hidden border border-[var(--border)]">
        <div
          className={`h-full bg-[var(--video)] rounded-full transition-all duration-150 motion-reduce:transition-none ${
            indeterminate ? 'animate-pulse w-full motion-reduce:animate-none' : ''
          }`}
          style={{ width: indeterminate ? '100%' : `${clamped}%` }}
        />
      </div>
    </div>
  );
}
