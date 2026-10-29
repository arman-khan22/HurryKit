import type { Metadata } from 'next';
import Link from 'next/link';
import { liveTools, HUBS } from '@/registry';
import type { Tool } from '@/registry/schema';
import { HeroQuickConverter } from '@/components/home/HeroQuickConverter';
import SculptureHero from '@/components/ui/liquid-sculpture-hero';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? '';

export const metadata: Metadata = {
  title: 'Hurrykit — Fast, Private File Converter. No Uploads.',
  description:
    'Convert HEIC to JPG, MOV to MP4, WAV to MP3, and 50+ formats directly in your browser. Fast, private, zero server uploads.',
  alternates: { canonical: SITE_URL || '/' },
  openGraph: {
    url: SITE_URL || '/',
    title: 'Hurrykit — Fast, Private File Converter. No Uploads.',
    description: 'Convert images, audio, and video in your browser. Nothing uploaded.',
  },
};

const DEPARTMENTS = [
  {
    key: 'image' as const,
    slug: 'image-converter',
    name: 'Image Converter',
    desc: 'High-fidelity raster, vector, and modern image formats.',
    formats: ['HEIC', 'JPG', 'PNG', 'WebP', 'AVIF', 'SVG'],
    color: 'var(--image)',
    bg: 'var(--image-bg)',
    border: 'var(--image-border)',
    text: 'var(--image-text)',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <circle cx="8.5" cy="8.5" r="1.5" />
        <path d="m21 15-5-5L5 21" />
      </svg>
    ),
  },
  {
    key: 'audio' as const,
    slug: 'audio-converter',
    name: 'Audio Converter',
    desc: 'Lossless compression, bitrate control, and format transcoding.',
    formats: ['MP3', 'WAV', 'FLAC', 'M4A', 'OGG', 'OPUS'],
    color: 'var(--audio)',
    bg: 'var(--audio-bg)',
    border: 'var(--audio-border)',
    text: 'var(--audio-text)',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 18V5l12-2v13" />
        <circle cx="6" cy="18" r="3" />
        <circle cx="18" cy="16" r="3" />
      </svg>
    ),
  },
  {
    key: 'video' as const,
    slug: 'video-converter',
    name: 'Video Converter',
    desc: 'Stream copy, re-encoding, resolution scaling, and audio extraction.',
    formats: ['MP4', 'MOV', 'MKV', 'AVI', 'WebM', 'GIF'],
    color: 'var(--video)',
    bg: 'var(--video-bg)',
    border: 'var(--video-border)',
    text: 'var(--video-text)',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="m22 8-6 4 6 4V8z" />
        <rect x="2" y="6" width="14" height="12" rx="2" />
      </svg>
    ),
  },
];

function ToolCard({ tool }: { tool: Tool }) {
  const deptColor =
    tool.department === 'image'
      ? 'var(--image)'
      : tool.department === 'audio'
      ? 'var(--audio)'
      : 'var(--video)';
  const deptBg =
    tool.department === 'image'
      ? 'var(--image-bg)'
      : tool.department === 'audio'
      ? 'var(--audio-bg)'
      : 'var(--video-bg)';

  const parts = tool.seo.primary.split(' to ');
  const from = parts[0]?.trim();
  const to = parts[1]?.trim();

  return (
    <Link
      href={`/${tool.slug}`}
      className="group flex items-center justify-between p-3.5 rounded-xl border border-[var(--border)] bg-[var(--surface)] hover:border-[var(--border-2)] hover:shadow-sm transition-all duration-150"
    >
      <div className="flex items-center gap-3 truncate">
        <span
          className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-xs font-bold font-mono"
          style={{ background: deptBg, color: deptColor }}
        >
          {tool.department === 'image' ? 'IMG' : tool.department === 'audio' ? 'AUD' : 'VID'}
        </span>
        <div className="truncate">
          <p className="text-sm font-semibold text-[var(--text)] group-hover:text-[var(--accent)] transition-colors truncate">
            {from && to ? (
              <>
                <span>{from}</span> <span className="text-[var(--muted)] font-normal">→</span> <span>{to}</span>
              </>
            ) : (
              tool.seo.primary
            )}
          </p>
          <p className="text-xs text-[var(--muted)] truncate">{tool.seo.description}</p>
        </div>
      </div>
      <span className="text-[var(--muted)] group-hover:text-[var(--text)] group-hover:translate-x-0.5 transition-all pl-2">
        →
      </span>
    </Link>
  );
}

export default function HomePage() {
  const allLive = liveTools();
  const wave1 = allLive.filter((t) => t.wave === 1);

  return (
    <div className="min-h-screen">
      {/* Accessible semantic heading for static SEO crawlers and screen readers */}
      <h1 className="sr-only">Files that never leave — Hurrykit In-Browser File Converter</h1>

      {/* 1. LIQUID SCULPTURE HERO */}
      <SculptureHero />

      {/* QUICK CONVERT / TOOL SELECTION */}
      <section id="convert" className="py-14 sm:py-18 bg-[var(--surface)] border-b border-[var(--border)] scroll-mt-6">
        <div className="container max-w-4xl text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-[var(--ok-bg)] text-[var(--ok)] border border-[var(--ok-border)] mb-4">
            <span className="w-2 h-2 rounded-full bg-[var(--ok)] animate-pulse" aria-hidden="true" />
            Zero Server Uploads · 100% In-Browser WebAssembly
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[var(--text)] mb-3">
            Instant In-Browser Conversion
          </h2>
          <p className="text-sm sm:text-base text-[var(--muted)] max-w-xl mx-auto mb-8">
            Drop your files below to start converting immediately. No data ever leaves your device.
          </p>
          <HeroQuickConverter />

          {/* Stats Bar */}
          <div className="mt-12 pt-8 border-t border-[var(--border)] max-w-2xl mx-auto grid grid-cols-3 gap-6 text-center">
            <div>
              <p className="text-2xl sm:text-3xl font-extrabold text-[var(--text)]">{allLive.length}+</p>
              <p className="text-xs sm:text-sm font-medium text-[var(--muted)] mt-0.5">Live Converters</p>
            </div>
            <div>
              <p className="text-2xl sm:text-3xl font-extrabold text-[var(--text)]">0 KB</p>
              <p className="text-xs sm:text-sm font-medium text-[var(--muted)] mt-0.5">Uploaded to Server</p>
            </div>
            <div>
              <p className="text-2xl sm:text-3xl font-extrabold text-[var(--text)]">100%</p>
              <p className="text-xs sm:text-sm font-medium text-[var(--muted)] mt-0.5">Client-Side Private</p>
            </div>
          </div>
        </div>
      </section>

      {/* 2. HUBS / DEPARTMENTS */}
      <section className="py-14 sm:py-18 bg-[var(--surface)] border-b border-[var(--border)]">
        <div className="container">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--text)]">
                Explore by Category
              </h2>
              <p className="text-sm text-[var(--muted)] mt-1">
                Optimized conversion engines tailored for each media type.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {DEPARTMENTS.map((dept) => {
              const count = allLive.filter((t) => t.department === dept.key).length;
              return (
                <Link
                  key={dept.key}
                  href={`/${dept.slug}`}
                  className="group relative p-6 rounded-2xl border border-[var(--border)] bg-[var(--surface-2)] hover:border-[var(--border-2)] hover:bg-[var(--surface)] hover:shadow-md transition-all duration-200 flex flex-col justify-between"
                >
                  <div>
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center mb-5 transition-transform group-hover:scale-105"
                      style={{ background: dept.bg, color: dept.color }}
                    >
                      {dept.icon}
                    </div>
                    <h3 className="text-lg font-bold text-[var(--text)] group-hover:text-[var(--accent)] transition-colors">
                      {dept.name}
                    </h3>
                    <p className="text-sm text-[var(--muted)] mt-1.5 mb-4 leading-relaxed">
                      {dept.desc}
                    </p>
                    <div className="flex flex-wrap gap-1.5 mb-6">
                      {dept.formats.map((fmt) => (
                        <span
                          key={fmt}
                          className="px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-[var(--surface)] border border-[var(--border)] text-[var(--text-2)]"
                        >
                          {fmt}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-4 border-t border-[var(--border)]/60 text-xs font-semibold text-[var(--muted)] group-hover:text-[var(--text)]">
                    <span>{count} Tools Available</span>
                    <span className="text-[var(--accent)] font-bold">Browse →</span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* 3. POPULAR CONVERTERS (WAVE 1) */}
      <section className="py-14 sm:py-18 bg-[var(--bg)] border-b border-[var(--border)]">
        <div className="container">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--text)]">
                Popular Converters
              </h2>
              <p className="text-sm text-[var(--muted)] mt-1">
                Frequently used by creators, photographers, and developers.
              </p>
            </div>
            <Link
              href="/image-converter"
              className="text-xs font-semibold text-[var(--accent)] hover:underline"
            >
              View all tools →
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {wave1.map((tool) => (
              <ToolCard key={tool.id} tool={tool} />
            ))}
          </div>
        </div>
      </section>

      {/* 4. THE INVARIANT GUARANTEE / WHY HURRYKIT */}
      <section id="how-it-works" className="py-16 sm:py-20 bg-[var(--surface)] border-b border-[var(--border)]">
        <div className="container max-w-5xl">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[var(--text)]">
              Designed for Absolute Privacy & Speed
            </h2>
            <p className="text-sm sm:text-base text-[var(--muted)] mt-2">
              Unlike traditional converters that upload your photos, documents, and videos to cloud servers, Hurrykit executes everything inside your browser.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-5 rounded-xl border border-[var(--border)] bg-[var(--surface-2)]">
              <div className="w-10 h-10 rounded-lg bg-[var(--ok-bg)] text-[var(--ok)] border border-[var(--ok-border)] flex items-center justify-center mb-4">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
              </div>
              <h3 className="text-sm font-bold text-[var(--text)] mb-1.5">No Uploads</h3>
              <p className="text-xs text-[var(--muted)] leading-relaxed">
                Zero network requests transfer file data. Check your browser DevTools Network tab — pure 0 bytes.
              </p>
            </div>

            <div className="p-5 rounded-xl border border-[var(--border)] bg-[var(--surface-2)]">
              <div className="w-10 h-10 rounded-lg bg-[var(--accent-light)] text-[var(--accent)] border border-[var(--border)] flex items-center justify-center mb-4">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
              </div>
              <h3 className="text-sm font-bold text-[var(--text)] mb-1.5">Zero Wait Queues</h3>
              <p className="text-xs text-[var(--muted)] leading-relaxed">
                No server bottlenecks or queues. Processing runs immediately at the full speed of your local CPU & GPU.
              </p>
            </div>

            <div className="p-5 rounded-xl border border-[var(--border)] bg-[var(--surface-2)]">
              <div className="w-10 h-10 rounded-lg bg-[var(--image-bg)] text-[var(--image)] border border-[var(--image-border)] flex items-center justify-center mb-4">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>
              </div>
              <h3 className="text-sm font-bold text-[var(--text)] mb-1.5">Batch & ZIP</h3>
              <p className="text-xs text-[var(--muted)] leading-relaxed">
                Drop multiple files at once. Multithreaded Web Workers process files in parallel and package a clean ZIP download.
              </p>
            </div>

            <div className="p-5 rounded-xl border border-[var(--border)] bg-[var(--surface-2)]">
              <div className="w-10 h-10 rounded-lg bg-[var(--audio-bg)] text-[var(--audio)] border border-[var(--audio-border)] flex items-center justify-center mb-4">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
              </div>
              <h3 className="text-sm font-bold text-[var(--text)] mb-1.5">No Signups / Free</h3>
              <p className="text-xs text-[var(--muted)] leading-relaxed">
                No subscription gates, watermarks, or email captures. Fully functional and completely free forever.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. ALL TOOLS DIRECTORY */}
      <section className="py-14 sm:py-18 bg-[var(--bg)]">
        <div className="container">
          <div className="mb-8">
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--text)]">
              All {allLive.length} Converters
            </h2>
            <p className="text-sm text-[var(--muted)] mt-1">
              Browse our complete library of supported browser-side conversions.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {allLive.map((tool) => (
              <ToolCard key={tool.id} tool={tool} />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
