import type { Metadata } from 'next';
import Link from 'next/link';
import { Breadcrumbs } from '@/components/seo/Breadcrumbs';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://hurrykit.com';

export const metadata: Metadata = {
  title: 'Our Privacy Promise — Zero Upload, 100% In-Browser | Hurrykit',
  description:
    'How Hurrykit guarantees your privacy: your files never leave your device. Zero upload, no accounts, no tracking. Learn how to verify it yourself.',
  alternates: { canonical: `${SITE_URL}/privacy-promise` },
};

export default function PrivacyPromisePage() {
  const breadcrumbs = [
    { name: 'Home', item: SITE_URL },
    { name: 'Privacy Promise', item: `${SITE_URL}/privacy-promise` },
  ];

  return (
    <div className="container py-8 max-w-3xl">
      <Breadcrumbs items={breadcrumbs} />

      <article className="prose mt-6">
        <div className="inline-block px-3 py-1 text-xs font-semibold uppercase tracking-wider rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 mb-4">
          Non-Negotiable Architecture
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[var(--text)] mb-4">
          Our Privacy Promise
        </h1>
        <p className="text-xl text-[var(--muted)] leading-relaxed font-normal">
          Zero file bytes ever leave your phone or computer. File processing happens 100% client-side in your web browser.
        </p>

        <hr className="my-8 border-[var(--border)]" />

        <section className="mb-10">
          <h2 className="text-2xl font-bold text-[var(--text)] mb-3">Why This Matters</h2>
          <p className="text-[var(--muted)] leading-relaxed">
            Most online file converters quietly upload your files to remote cloud servers, run scripts there, and tell you that your files will be deleted in a few hours. When you are converting sensitive files — such as national ID cards, passport scans, tax documents, medical forms, personal voice notes, or family videos — trusting a remote server&apos;s deletion policy is an unnecessary risk.
          </p>
          <p className="text-[var(--muted)] leading-relaxed mt-3">
            Hurrykit is built on a simple premise: <strong>the safest file server is no server at all</strong>.
          </p>
        </section>

        <section className="mb-10">
          <h2 className="text-2xl font-bold text-[var(--text)] mb-3">How Hurrykit Works</h2>
          <div className="grid gap-4 sm:grid-cols-2 not-prose mt-4">
            <div className="card p-5">
              <div className="text-2xl mb-2">⚡</div>
              <h3 className="font-semibold text-[var(--text)] mb-1">WebAssembly Codecs</h3>
              <p className="text-xs text-[var(--muted)] leading-relaxed">
                The conversion engines (like FFmpeg and image codecs) run directly inside your browser via WebAssembly, just like a native desktop app.
              </p>
            </div>
            <div className="card p-5">
              <div className="text-2xl mb-2">🛡️</div>
              <h3 className="font-semibold text-[var(--text)] mb-1">Background Web Workers</h3>
              <p className="text-xs text-[var(--muted)] leading-relaxed">
                Conversions run in isolated Web Workers off the main thread so your phone or computer stays smooth and responsive.
              </p>
            </div>
            <div className="card p-5">
              <div className="text-2xl mb-2">💾</div>
              <h3 className="font-semibold text-[var(--text)] mb-1">In-Memory Results</h3>
              <p className="text-xs text-[var(--muted)] leading-relaxed">
                Converted files are held in local browser memory (Blob URLs) and immediately freed when you close the tab or clear the queue.
              </p>
            </div>
            <div className="card p-5">
              <div className="text-2xl mb-2">🚫</div>
              <h3 className="font-semibold text-[var(--text)] mb-1">No Storage, No Tracking</h3>
              <p className="text-xs text-[var(--muted)] leading-relaxed">
                We have no file storage buckets, no user accounts, no watermarks, and no third-party ad networks tracking your activity.
              </p>
            </div>
          </div>
        </section>

        <section className="mb-10">
          <h2 className="text-2xl font-bold text-[var(--text)] mb-3">How You Can Verify It (In 30 Seconds)</h2>
          <p className="text-[var(--muted)] leading-relaxed mb-4">
            You do not have to take our word for it. You can independently verify that zero file bytes leave your browser:
          </p>
          <ol className="list-decimal list-inside space-y-2 text-[var(--muted)] pl-2">
            <li>Open any Hurrykit tool, such as <Link href="/heic-to-jpg" className="text-[var(--image)] underline font-medium">HEIC to JPG</Link>.</li>
            <li>Open your browser Developer Tools (press <kbd className="px-1.5 py-0.5 rounded bg-[var(--surface-raised)] border border-[var(--border)] text-xs">F12</kbd> or right-click and select <em>Inspect</em>).</li>
            <li>Switch to the <strong>Network</strong> tab.</li>
            <li>Select or drop a file to convert.</li>
            <li>Observe that during conversion, no POST or PUT requests carrying your file data are sent anywhere. The conversion completes entirely offline!</li>
            <li>You can even disconnect your internet Wi-Fi after opening the tool, and the conversion still works.</li>
          </ol>
        </section>

        <section className="mb-10">
          <h2 className="text-2xl font-bold text-[var(--text)] mb-3">Transparent Network Disclosure</h2>
          <p className="text-[var(--muted)] leading-relaxed mb-4">
            We believe in total transparency. Here is the complete list of what is transmitted over the network and what is never transmitted:
          </p>

          <div className="overflow-x-auto not-prose mb-6">
            <table className="w-full text-left text-sm border-collapse border border-[var(--border)] rounded-lg">
              <thead>
                <tr className="bg-[var(--surface-raised)] border-b border-[var(--border)]">
                  <th className="p-3 text-[var(--text)] font-semibold">Category</th>
                  <th className="p-3 text-[var(--text)] font-semibold">What Is Sent</th>
                  <th className="p-3 text-[var(--text)] font-semibold">What Is NEVER Sent</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)] text-xs text-[var(--muted)]">
                <tr>
                  <td className="p-3 font-semibold text-[var(--text)]">User Files</td>
                  <td className="p-3 text-emerald-600 dark:text-emerald-400 font-medium">Nothing (0 bytes).</td>
                  <td className="p-3">File contents, file names, file metadata (such as photo GPS/EXIF locations), and user text.</td>
                </tr>
                <tr>
                  <td className="p-3 font-semibold text-[var(--text)]">Static Assets</td>
                  <td className="p-3">HTML, CSS, JavaScript, and fonts needed to display the page in your browser.</td>
                  <td className="p-3">No user-identifying tracking cookies.</td>
                </tr>
                <tr>
                  <td className="p-3 font-semibold text-[var(--text)]">Conversion Engine</td>
                  <td className="p-3">One-time WebAssembly binary download (e.g. FFmpeg WASM core), cached in your browser for repeat visits.</td>
                  <td className="p-3">The engine executes locally in a Web Worker; it never transmits your files back.</td>
                </tr>
                <tr>
                  <td className="p-3 font-semibold text-[var(--text)]">Analytics & Telemetry</td>
                  <td className="p-3">Anonymous counts: tool visited, coarse file size bucket (e.g. &ldquo;1-5 MB&rdquo;), duration bucket, anonymous error codes.</td>
                  <td className="p-3">No exact file sizes, no file names, no IP addresses stored by us, and no cross-site advertising IDs.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section className="mb-10">
          <h2 className="text-2xl font-bold text-[var(--text)] mb-3">Third-Party Scripts &amp; Sandboxing</h2>
          <p className="text-[var(--muted)] leading-relaxed">
            All conversions run in sandboxed Web Workers and WebAssembly instances completely isolated from external scripts. We load zero marketing pixels, zero tracking cookies, and zero social media trackers. Any privacy-friendly analytics script runs after interactive and has strictly zero access to your file queue, worker memory, or file buffers.
          </p>
        </section>

        <section className="mb-10">
          <h2 className="text-2xl font-bold text-[var(--text)] mb-3">Our 5 Core Commitments</h2>
          <ul className="list-disc list-inside space-y-2 text-[var(--muted)] pl-2">
            <li><strong>Zero file uploads:</strong> Files are processed locally on your device.</li>
            <li><strong>No accounts:</strong> No registration, login, or email collection required.</li>
            <li><strong>No watermarks:</strong> Converted output is clean and unaltered.</li>
            <li><strong>No intrusive ads:</strong> Clean, uncluttered interface focused purely on getting your task done.</li>
            <li><strong>Open licensing compliance:</strong> All bundled open-source codecs and libraries are attributed with exact licenses on our <Link href="/licences" className="text-[var(--video)] underline font-medium">Licences</Link> page.</li>
          </ul>
        </section>
      </article>
    </div>
  );
}
