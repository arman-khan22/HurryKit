import type { Metadata } from 'next';
import { Breadcrumbs } from '@/components/seo/Breadcrumbs';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://hurrykit.com';

export const metadata: Metadata = {
  title: 'Cookie Policy | Hurrykit',
  description:
    'Hurrykit Cookie Policy. We do not use tracking or advertising cookies. Learn how local browser storage is used.',
  alternates: { canonical: `${SITE_URL}/cookies` },
};

export default function CookiesPage() {
  const breadcrumbs = [
    { name: 'Home', item: SITE_URL },
    { name: 'Cookie Policy', item: `${SITE_URL}/cookies` },
  ];

  return (
    <div className="container py-8 max-w-3xl">
      <Breadcrumbs items={breadcrumbs} />

      <article className="prose mt-6">
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[var(--text)] mb-4">
          Cookie Policy
        </h1>
        <p className="text-sm text-[var(--muted)]">Last updated: October 2026</p>

        <hr className="my-8 border-[var(--border)]" />

        <h2 className="text-2xl font-bold text-[var(--text)] mb-3">1. No Tracking or Advertising Cookies</h2>
        <p className="text-[var(--muted)] leading-relaxed">
          Hurrykit is built on privacy-first principles. <strong>We do not use tracking cookies, advertising cookies, or third-party behavioral profiling trackers.</strong>
        </p>

        <h2 className="text-2xl font-bold text-[var(--text)] mt-8 mb-3">2. Essential Local Storage We Use</h2>
        <p className="text-[var(--muted)] leading-relaxed">
          Instead of persistent server cookies, our site uses standard HTML5 client storage features solely to provide essential user interface functionality:
        </p>
        <div className="overflow-x-auto not-prose my-4">
          <table className="w-full text-left text-sm border-collapse border border-[var(--border)]">
            <thead>
              <tr className="bg-[var(--surface-raised)]">
                <th className="p-3 border border-[var(--border)] font-semibold text-[var(--text)]">Storage Mechanism</th>
                <th className="p-3 border border-[var(--border)] font-semibold text-[var(--text)]">Purpose</th>
                <th className="p-3 border border-[var(--border)] font-semibold text-[var(--text)]">Lifespan</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="p-3 border border-[var(--border)] font-mono text-xs">localStorage: theme</td>
                <td className="p-3 border border-[var(--border)] text-[var(--muted)]">Remembers whether you selected Light or Dark theme.</td>
                <td className="p-3 border border-[var(--border)] text-[var(--muted)]">Persistent until cleared</td>
              </tr>
              <tr>
                <td className="p-3 border border-[var(--border)] font-mono text-xs">caches: hurrykit-ffmpeg-*</td>
                <td className="p-3 border border-[var(--border)] text-[var(--muted)]">Caches WebAssembly engine files so repeat visits load instantly without re-downloading.</td>
                <td className="p-3 border border-[var(--border)] text-[var(--muted)]">Persistent until browser cache is cleared</td>
              </tr>
              <tr>
                <td className="p-3 border border-[var(--border)] font-mono text-xs">Blob URLs (in-memory)</td>
                <td className="p-3 border border-[var(--border)] text-[var(--muted)]">Holds converted output bytes temporarily so you can download them.</td>
                <td className="p-3 border border-[var(--border)] text-[var(--muted)]">Cleared upon page navigation or clear</td>
              </tr>
            </tbody>
          </table>
        </div>

        <h2 className="text-2xl font-bold text-[var(--text)] mt-8 mb-3">3. Managing Local Data</h2>
        <p className="text-[var(--muted)] leading-relaxed">
          You can delete or reset stored data at any time through your browser settings by clearing site data and cache for Hurrykit. Because we do not rely on server sessions or tracking cookies, clearing this data will simply reset your theme preference to the system default.
        </p>
      </article>
    </div>
  );
}
