import type { Metadata } from 'next';
import Link from 'next/link';
import { Breadcrumbs } from '@/components/seo/Breadcrumbs';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? '';

export const metadata: Metadata = {
  title: 'About Hurrykit — Fast, Private, In-Browser File Tools',
  description:
    'Hurrykit is a suite of modern file conversion tools designed for speed and uncompromising privacy. All processing runs directly in your browser.',
  alternates: { canonical: SITE_URL ? `${SITE_URL}/about` : '/about' },
};

export default function AboutPage() {
  const breadcrumbs = [
    { name: 'Home', item: SITE_URL || '/' },
    { name: 'About', item: SITE_URL ? `${SITE_URL}/about` : '/about' },
  ];

  return (
    <div className="container py-8 max-w-3xl">
      <Breadcrumbs items={breadcrumbs} />

      <article className="prose mt-6">
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[var(--text)] mb-4">
          About Hurrykit
        </h1>
        <p className="text-xl text-[var(--muted)] leading-relaxed font-normal">
          We believe routine file conversions should be instant, free, and completely private.
        </p>

        <hr className="my-8 border-[var(--border)]" />

        <h2 className="text-2xl font-bold text-[var(--text)] mb-3">The Problem With Traditional Converters</h2>
        <p className="text-[var(--muted)] leading-relaxed">
          For years, converting a simple HEIC photo or an audio clip meant uploading your personal files to mysterious third-party servers. In exchange, users endured queue wait times, intrusive popups, file size walls, and lingering privacy doubts.
        </p>

        <h2 className="text-2xl font-bold text-[var(--text)] mt-8 mb-3">Modern Web Capabilities</h2>
        <p className="text-[var(--muted)] leading-relaxed">
          Modern web browsers now support WebAssembly, SIMD, and multi-threaded background workers. Desktop-grade media engines (like FFmpeg and advanced image codecs) can run directly on your smartphone, tablet, or laptop.
        </p>
        <p className="text-[var(--muted)] leading-relaxed mt-3">
          Hurrykit harnesses these standards to deliver a suite of converters where files are processed entirely on your local machine. No upload queues, no server costs passed to you, and zero exposure of your personal media.
        </p>

        <h2 className="text-2xl font-bold text-[var(--text)] mt-8 mb-3">Built For Speed and Simplicity</h2>
        <ul className="list-disc list-inside space-y-2 text-[var(--muted)] pl-2">
          <li><strong>Instant Start:</strong> Drop a file and convert immediately. No registration or sign-in walls.</li>
          <li><strong>Mobile First:</strong> Tuned for smooth performance on Android and iOS devices.</li>
          <li><strong>Batch Processing:</strong> Convert multiple files simultaneously and download them individually or as a single ZIP.</li>
          <li><strong>Zero Watermarks:</strong> Your files remain clean and untampered with.</li>
        </ul>

        <div className="card p-6 mt-10 not-prose">
          <h3 className="text-lg font-semibold text-[var(--text)] mb-2">Explore Hurrykit Converters</h3>
          <p className="text-sm text-[var(--muted)] mb-4">
            Browse our image, audio, and video conversion tools:
          </p>
          <div className="flex flex-wrap gap-3">
            <Link href="/image-converter" className="btn btn-secondary text-sm">
              Image Converter →
            </Link>
            <Link href="/audio-converter" className="btn btn-secondary text-sm">
              Audio Converter →
            </Link>
            <Link href="/video-converter" className="btn btn-secondary text-sm">
              Video Converter →
            </Link>
          </div>
        </div>
      </article>
    </div>
  );
}
