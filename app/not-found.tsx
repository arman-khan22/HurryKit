import Link from 'next/link';
import { HUBS } from '@/registry';

export default function NotFound() {
  return (
    <div className="container py-20 text-center max-w-2xl mx-auto">
      <div className="inline-block px-3 py-1 text-xs font-semibold uppercase tracking-wider rounded-full bg-[var(--surface-raised)] border border-[var(--border)] text-[var(--muted)] mb-4">
        404 — Not Found
      </div>
      <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-[var(--text)] mb-4">
        Page Not Found
      </h1>
      <p className="text-lg text-[var(--muted)] mb-8">
        The tool or page you are looking for doesn&apos;t exist, was moved, or hasn&apos;t launched yet in Phase 1.
      </p>

      <div className="card p-6 mb-8 text-left">
        <h2 className="text-base font-semibold text-[var(--text)] mb-3">Popular Converters</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <Link href="/heic-to-jpg" className="p-2.5 rounded bg-[var(--surface-raised)] text-sm font-medium hover:text-[var(--image)] transition-colors">
            HEIC to JPG →
          </Link>
          <Link href="/png-to-jpg" className="p-2.5 rounded bg-[var(--surface-raised)] text-sm font-medium hover:text-[var(--image)] transition-colors">
            PNG to JPG →
          </Link>
          <Link href="/jpg-to-png" className="p-2.5 rounded bg-[var(--surface-raised)] text-sm font-medium hover:text-[var(--image)] transition-colors">
            JPG to PNG →
          </Link>
          <Link href="/mp4-to-mp3" className="p-2.5 rounded bg-[var(--surface-raised)] text-sm font-medium hover:text-[var(--audio)] transition-colors">
            MP4 to MP3 →
          </Link>
          <Link href="/wav-to-mp3" className="p-2.5 rounded bg-[var(--surface-raised)] text-sm font-medium hover:text-[var(--audio)] transition-colors">
            WAV to MP3 →
          </Link>
          <Link href="/mp4-to-gif" className="p-2.5 rounded bg-[var(--surface-raised)] text-sm font-medium hover:text-[var(--video)] transition-colors">
            MP4 to GIF →
          </Link>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-4">
        <Link href="/" className="btn btn-primary">
          Return Home
        </Link>
        <Link href={`/${HUBS.image.slug}`} className="btn btn-secondary">
          Browse Image Tools
        </Link>
        <Link href={`/${HUBS.audio.slug}`} className="btn btn-secondary">
          Browse Audio Tools
        </Link>
        <Link href={`/${HUBS.video.slug}`} className="btn btn-secondary">
          Browse Video Tools
        </Link>
      </div>
    </div>
  );
}
