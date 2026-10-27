import Link from 'next/link';

export function PrivacyBadge() {
  return (
    <div className="flex items-center gap-2 text-xs text-[var(--muted)]">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true" style={{ color: 'var(--ok)', flexShrink: 0 }}>
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
      <span>
        Processed on your device. Nothing is uploaded.{' '}
        <Link href="/privacy-promise" className="underline underline-offset-2 hover:text-[var(--text)]">
          See proof
        </Link>
      </span>
    </div>
  );
}
