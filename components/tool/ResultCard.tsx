'use client';
import { useState, useEffect } from 'react';
import type { FileItem } from '@/lib/toolStore';
import { formatBytes } from '@/engines/shared/naming';
import { track } from '@/lib/analytics';

type Props = { file: FileItem };

export function ResultCard({ file }: Props) {
  const [isIOS, setIsIOS] = useState(false);
  const [canShare, setCanShare] = useState(false);
  const { result } = file;

  useEffect(() => {
    if (typeof navigator !== 'undefined') {
      const ios =
        /iPad|iPhone|iPod/.test(navigator.userAgent) ||
        (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
      setIsIOS(ios);
      setCanShare('share' in navigator && typeof navigator.share === 'function');
    }
  }, []);

  if (!result) return null;

  const fileNameLower = result.fileName.toLowerCase();
  const isImage = /\.(jpg|jpeg|png|webp|avif|gif|bmp|ico|svg)$/i.test(fileNameLower);
  const isAudio = /\.(mp3|wav|ogg|opus|flac|aac|m4a|wma|aiff|amr)$/i.test(fileNameLower);
  const isVideo = /\.(mp4|webm|mov|mkv)$/i.test(fileNameLower);

  const handleDownload = () => {
    track('download_clicked', { toolId: 'single-file' });
    const a = document.createElement('a');
    a.href = result.url;
    a.download = result.fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleShare = async () => {
    if (canShare && navigator.share) {
      try {
        const fileObj = new File([result.blob], result.fileName, {
          type: result.blob.type || 'application/octet-stream',
        });
        if (navigator.canShare && navigator.canShare({ files: [fileObj] })) {
          await navigator.share({
            files: [fileObj],
            title: result.fileName,
          });
          return;
        }
      } catch (err) {
        // Fall back to direct download if user cancelled or share failed
        if ((err as Error)?.name === 'AbortError') return;
      }
    }
    handleDownload();
  };

  const isSmaller = file.bytes > 0 && result.bytes < file.bytes;
  const isLarger = file.bytes > 0 && result.bytes > file.bytes;
  const pctDiff =
    file.bytes > 0
      ? Math.abs(Math.round(((result.bytes - file.bytes) / file.bytes) * 100))
      : 0;

  return (
    <div className="card border border-[var(--border)] p-4 sm:p-5 transition-all duration-200 animate-fade-in space-y-3.5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Left: Thumbnail & details */}
        <div className="flex items-start sm:items-center gap-3.5 min-w-0 flex-1">
          {/* Image preview thumbnail */}
          {isImage && result.url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={result.url}
              alt={`Preview of converted ${result.fileName}`}
              className="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded-[var(--radius-sm)] flex-shrink-0 border border-[var(--border)] bg-[var(--surface-2)] shadow-sm"
              loading="lazy"
            />
          )}

          {/* Audio icon thumbnail */}
          {isAudio && (
            <div
              className="w-14 h-14 rounded-[var(--radius-sm)] flex items-center justify-center flex-shrink-0 border border-[var(--border)]"
              style={{ background: 'color-mix(in srgb, var(--audio) 12%, transparent)', color: 'var(--audio)' }}
              aria-hidden="true"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M9 18V5l12-2v13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <circle cx="6" cy="18" r="3" stroke="currentColor" strokeWidth="2" />
                <circle cx="18" cy="16" r="3" stroke="currentColor" strokeWidth="2" />
              </svg>
            </div>
          )}

          {/* Video icon thumbnail (if no video element shown yet) */}
          {isVideo && !isImage && (
            <div
              className="w-14 h-14 rounded-[var(--radius-sm)] flex items-center justify-center flex-shrink-0 border border-[var(--border)]"
              style={{ background: 'color-mix(in srgb, var(--video) 12%, transparent)', color: 'var(--video)' }}
              aria-hidden="true"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <polygon points="23 7 16 12 23 17 23 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <rect x="1" y="5" width="15" height="14" rx="2" ry="2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          )}

          {/* Text metadata */}
          <div className="flex-1 min-w-0">
            <p
              className="text-sm sm:text-base font-semibold text-[var(--text)] truncate"
              title={result.fileName}
            >
              {result.fileName}
            </p>

            <div className="flex flex-wrap items-center gap-2 mt-1 text-xs sm:text-sm">
              <span className="font-semibold text-[var(--text)]">
                {formatBytes(result.bytes)}
              </span>

              {isSmaller && (
                <span className="text-xs font-semibold text-[var(--ok)] bg-[color-mix(in_srgb,var(--ok)_12%,transparent)] px-1.5 py-0.5 rounded">
                  −{pctDiff}% smaller ({formatBytes(file.bytes - result.bytes)} saved)
                </span>
              )}

              {isLarger && (
                <span className="text-xs text-[var(--muted)]">
                  (+{pctDiff}%)
                </span>
              )}
            </div>

            {/* Note badges */}
            {result.notes && result.notes.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {result.notes.map((note, idx) => (
                  <span
                    key={idx}
                    className="text-[11px] px-2 py-0.5 rounded font-medium bg-[var(--surface-2)] text-[var(--muted)] border border-[var(--border)]"
                  >
                    {note}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2 flex-shrink-0 self-end sm:self-center">
          {/* Web Share button (primary recommendation on iOS) */}
          {canShare && (
            <button
              type="button"
              onClick={() => void handleShare()}
              className="btn btn-ghost border border-[var(--border)] py-2.5 px-3.5 text-xs sm:text-sm font-medium hover:border-[var(--text)]"
              aria-label={`Share ${result.fileName}`}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <circle cx="18" cy="5" r="3" stroke="currentColor" strokeWidth="2" />
                <circle cx="6" cy="12" r="3" stroke="currentColor" strokeWidth="2" />
                <circle cx="18" cy="19" r="3" stroke="currentColor" strokeWidth="2" />
                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" stroke="currentColor" strokeWidth="2" />
                <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" stroke="currentColor" strokeWidth="2" />
              </svg>
              Share
            </button>
          )}

          {/* Download button */}
          <button
            type="button"
            onClick={handleDownload}
            className="btn btn-primary py-2.5 px-4 text-xs sm:text-sm font-semibold shadow-sm"
            aria-label={`Download ${result.fileName}`}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <polyline
                points="7 10 12 15 17 10"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <line x1="12" y1="15" x2="12" y2="3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            Download
          </button>
        </div>
      </div>

      {/* Audio player preview */}
      {isAudio && result.url && (
        <div className="pt-1">
          <audio
            controls
            src={result.url}
            preload="metadata"
            className="w-full h-10 rounded-[var(--radius-sm)]"
            aria-label={`Listen to converted audio ${result.fileName}`}
          />
        </div>
      )}

      {/* Video player preview */}
      {isVideo && result.url && (
        <div className="pt-1">
          <video
            controls
            playsInline
            preload="metadata"
            src={result.url}
            className="w-full max-h-56 rounded-[var(--radius-sm)] border border-[var(--border)] bg-black"
            aria-label={`Preview converted video ${result.fileName}`}
          />
        </div>
      )}

      {/* Platform-specific helper guidance */}
      {isIOS && (
        <p className="text-[11px] text-[var(--muted)] flex items-center gap-1.5 pt-1 border-t border-[var(--border)]">
          <span>💡</span>
          <span>
            <strong>Tip on iPhone:</strong> Tap <strong>Share</strong> → <strong>Save to Files</strong> (or Save Image) to keep this on your device.
          </span>
        </p>
      )}
    </div>
  );
}
