import type { Metadata } from 'next';
import Link from 'next/link';
import { Breadcrumbs } from '@/components/seo/Breadcrumbs';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://hurrykit.com';

export const metadata: Metadata = {
  title: 'Privacy Policy | Hurrykit',
  description:
    'Hurrykit Privacy Policy. Understand our zero-upload architecture, minimal privacy-first analytics, and strict data protection practices.',
  alternates: { canonical: `${SITE_URL}/privacy` },
};

export default function PrivacyPage() {
  const breadcrumbs = [
    { name: 'Home', item: SITE_URL },
    { name: 'Privacy Policy', item: `${SITE_URL}/privacy` },
  ];

  return (
    <div className="container py-8 max-w-3xl">
      <Breadcrumbs items={breadcrumbs} />

      <article className="prose mt-6">
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[var(--text)] mb-4">
          Privacy Policy
        </h1>
        <p className="text-sm text-[var(--muted)]">Last updated: October 2026</p>

        <hr className="my-8 border-[var(--border)]" />

        <h2 className="text-2xl font-bold text-[var(--text)] mb-3">1. Overview and Core Principle</h2>
        <p className="text-[var(--muted)] leading-relaxed">
          Hurrykit (&quot;we&quot;, &quot;us&quot;, or &quot;our&quot;) provides fast, browser-based media conversion tools. Our architecture is designed from the ground up to protect your privacy: <strong>your files are processed locally on your device and are never transmitted to our servers</strong>.
        </p>

        <h2 className="text-2xl font-bold text-[var(--text)] mt-8 mb-3">2. Your Files and Conversion Data</h2>
        <p className="text-[var(--muted)] leading-relaxed">
          When you select or drop a file into Hurrykit:
        </p>
        <ul className="list-disc list-inside space-y-2 text-[var(--muted)] pl-2">
          <li>The file remains in your browser&apos;s sandbox memory.</li>
          <li>All decoding, rendering, and re-encoding are executed locally by WebAssembly and browser Web Workers.</li>
          <li>We cannot view, store, copy, or index your file contents or file names.</li>
          <li>Once you close the browser tab or click &quot;Clear&quot;, the in-memory blob URLs are immediately revoked and garbage collected.</li>
        </ul>
        <p className="text-[var(--muted)] leading-relaxed mt-3">
          For technical details and verification steps, please read our dedicated <Link href="/privacy-promise" className="text-[var(--image)] underline">Privacy Promise</Link>.
        </p>

        <h2 className="text-2xl font-bold text-[var(--text)] mt-8 mb-3">3. Minimal Anonymous Analytics</h2>
        <p className="text-[var(--muted)] leading-relaxed">
          To maintain server uptime, understand which tool pages are most useful, and identify browser incompatibilities, we collect aggregated, non-personally identifiable metrics (such as page views, country-level geography, and browser type).
        </p>
        <p className="text-[var(--muted)] leading-relaxed mt-2">
          We do not use tracking cookies, cross-site trackers, or advertising IDs. Our analytics never receive your file names, file sizes, or conversion inputs.
        </p>

        <h2 className="text-2xl font-bold text-[var(--text)] mt-8 mb-3">4. Cookies and Local Storage</h2>
        <p className="text-[var(--muted)] leading-relaxed">
          Hurrykit does not set advertising or tracking cookies. We use browser Local Storage solely to remember user preferences (such as light or dark theme selection) and Cache Storage to avoid re-downloading large WebAssembly engine files on subsequent visits.
        </p>

        <h2 className="text-2xl font-bold text-[var(--text)] mt-8 mb-3">5. Third-Party Services and CDNs</h2>
        <p className="text-[var(--muted)] leading-relaxed">
          Static website assets (HTML, CSS, JavaScript, and compiled WebAssembly binaries) are served via globally distributed Content Delivery Networks (CDNs) for high availability and low latency. Standard technical connection logs (IP address, user agent) are handled according to the CDN provider&apos;s security policies.
        </p>

        <h2 className="text-2xl font-bold text-[var(--text)] mt-8 mb-3">6. Contact</h2>
        <p className="text-[var(--muted)] leading-relaxed">
          If you have questions or concerns about this privacy policy, please contact us at <a href="mailto:privacy@hurrykit.com" className="text-[var(--image)] underline">privacy@hurrykit.com</a>.
        </p>
      </article>
    </div>
  );
}
