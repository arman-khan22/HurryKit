'use client';

import { useState, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { liveTools } from '@/registry';

const POPULAR_PRESETS = [
  { from: 'HEIC', to: 'JPG', slug: 'heic-to-jpg', dept: 'image' },
  { from: 'MP4', to: 'MP3', slug: 'mp4-to-mp3', dept: 'audio' },
  { from: 'MOV', to: 'MP4', slug: 'mov-to-mp4', dept: 'video' },
  { from: 'PNG', to: 'WebP', slug: 'png-to-webp', dept: 'image' },
  { from: 'WAV', to: 'MP3', slug: 'wav-to-mp3', dept: 'audio' },
  { from: 'WebP', to: 'PNG', slug: 'webp-to-png', dept: 'image' },
];

export function HeroQuickConverter() {
  const [isDragging, setIsDragging] = useState(false);
  const [detectedFile, setDetectedFile] = useState<{ name: string; size: string; ext: string } | null>(null);
  const [matchingTools, setMatchingTools] = useState<Array<{ id: string; slug: string; to: string; title: string }>>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const handleFiles = useCallback((files: FileList | File[]) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    if (!file) return;

    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    const sizeStr = (file.size / (1024 * 1024)).toFixed(1) + ' MB';

    setDetectedFile({
      name: file.name,
      size: sizeStr,
      ext: ext.toUpperCase(),
    });

    // Find all live tools that accept this format
    const all = liveTools();
    const matched = all.filter((t) => t.from.includes(ext)).map((t) => ({
      id: t.id,
      slug: t.slug,
      to: t.to.toUpperCase(),
      title: t.seo.primary,
    }));

    setMatchingTools(matched);
  }, []);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      if (e.dataTransfer.files) {
        handleFiles(e.dataTransfer.files);
      }
    },
    [handleFiles]
  );

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Drop area card */}
      <div
        className={`relative rounded-2xl border-2 transition-all duration-200 bg-[var(--surface)] p-6 sm:p-8 text-center cursor-pointer shadow-sm hover:shadow-md ${
          isDragging
            ? 'border-[var(--accent)] bg-[var(--accent-light)]/40 scale-[1.01]'
            : 'border-[var(--border)] hover:border-[var(--border-2)]'
        }`}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={onDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={(e) => e.target.files && handleFiles(e.target.files)}
        />

        {!detectedFile ? (
          <div className="space-y-4">
            <div className="w-14 h-14 mx-auto rounded-full bg-[var(--surface-2)] border border-[var(--border)] flex items-center justify-center text-[var(--accent)]">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
            </div>

            <div>
              <p className="text-base sm:text-lg font-bold text-[var(--text)]">
                Drop your file here, or <span className="text-[var(--accent)] underline underline-offset-4 decoration-1">browse</span>
              </p>
              <p className="text-xs sm:text-sm text-[var(--muted)] mt-1">
                Images, Audio, and Video. Converted client-side via WebAssembly.
              </p>
            </div>

            <div className="pt-2 flex items-center justify-center gap-4 text-xs font-medium text-[var(--muted)]">
              <span className="flex items-center gap-1.5">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--ok)" strokeWidth="2.5"><path d="M20 6L9 17l-5-5"/></svg>
                100% In-Browser
              </span>
              <span className="flex items-center gap-1.5">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--ok)" strokeWidth="2.5"><path d="M20 6L9 17l-5-5"/></svg>
                Zero Upload
              </span>
              <span className="flex items-center gap-1.5">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--ok)" strokeWidth="2.5"><path d="M20 6L9 17l-5-5"/></svg>
                Unlimited Size
              </span>
            </div>
          </div>
        ) : (
          <div className="space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-3 rounded-lg bg-[var(--surface-2)] border border-[var(--border)] text-left">
              <div className="flex items-center gap-3 truncate">
                <div className="px-2 py-1 rounded bg-[var(--accent)] text-white font-mono text-xs font-bold">
                  {detectedFile.ext}
                </div>
                <div className="truncate">
                  <p className="text-sm font-semibold text-[var(--text)] truncate">{detectedFile.name}</p>
                  <p className="text-xs text-[var(--muted)]">{detectedFile.size}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setDetectedFile(null)}
                className="text-xs text-[var(--muted)] hover:text-[var(--text)] px-2 py-1"
              >
                Clear
              </button>
            </div>

            {matchingTools.length > 0 ? (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wider text-left">
                  Convert to:
                </p>
                <div className="flex flex-wrap gap-2">
                  {matchingTools.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => router.push(`/${t.slug}`)}
                      className="px-3.5 py-1.5 rounded-md text-xs font-semibold bg-[var(--surface-3)] hover:bg-[var(--accent)] hover:text-white border border-[var(--border)] transition-colors"
                    >
                      → {t.to}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-xs text-[var(--muted)]">
                No direct preset found for .{detectedFile.ext.toLowerCase()}. Check our full catalog below!
              </p>
            )}
          </div>
        )}
      </div>

      {/* Quick preset chips */}
      <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
        <span className="text-xs font-semibold text-[var(--muted)] mr-1">Popular:</span>
        {POPULAR_PRESETS.map((p) => (
          <Link
            key={p.slug}
            href={`/${p.slug}`}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[var(--surface)] hover:bg-[var(--surface-2)] border border-[var(--border)] hover:border-[var(--border-2)] text-[var(--text)] shadow-xs hover:shadow-sm transition-all"
          >
            <span>{p.from}</span>
            <span className="text-[var(--muted)]">→</span>
            <span className="text-[var(--accent)]">{p.to}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
