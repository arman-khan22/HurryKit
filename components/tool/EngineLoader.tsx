'use client';

export function EngineLoader({ progress }: { progress: number }) {
  const normalized = progress > 1 ? progress : progress * 100;
  const pct = Math.min(100, Math.max(0, Math.round(normalized)));

  return (
    <div
      className="card border border-[var(--border)] p-4 sm:p-5 shadow-sm animate-fade-in"
      role="status"
      aria-live="polite"
      aria-label="Loading conversion engine"
    >
      <div className="flex items-start sm:items-center gap-3.5">
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ background: 'color-mix(in srgb, var(--video) 12%, transparent)', color: 'var(--video)' }}
          aria-hidden="true"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="animate-spin motion-reduce:animate-none">
            <line x1="12" y1="2" x2="12" y2="6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <line x1="12" y1="18" x2="12" y2="22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <line x1="4.93" y1="4.93" x2="7.76" y2="7.76" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <line x1="16.24" y1="16.24" x2="19.07" y2="19.07" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <line x1="2" y1="12" x2="6" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <line x1="18" y1="12" x2="22" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <line x1="4.93" y1="19.07" x2="7.76" y2="16.24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <line x1="16.24" y1="7.76" x2="19.07" y2="4.93" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-semibold text-[var(--text)]">
              Loading converter {pct < 100 ? '— first visit only' : '…'}
            </p>
            <span className="text-xs font-mono font-medium text-[var(--muted)]">
              {pct}%
            </span>
          </div>

          <div
            className="w-full h-2 rounded-full bg-[var(--surface-2)] overflow-hidden border border-[var(--border)]"
            role="progressbar"
            aria-valuenow={pct}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`Converter loading: ${pct}%`}
          >
            <div
              className="h-full bg-[var(--video)] rounded-full transition-all duration-150 motion-reduce:transition-none"
              style={{ width: `${pct}%` }}
            />
          </div>

          <p className="text-xs text-[var(--muted)] mt-1.5">
            This module runs entirely in your browser and is cached for instant future visits.
          </p>
        </div>
      </div>
    </div>
  );
}
