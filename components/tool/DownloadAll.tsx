'use client';
import { useState } from 'react';
import type { FileItem } from '@/lib/toolStore';
import { createZipInWorker, type ZipFileInput } from '@/lib/zipWorker';
import { track } from '@/lib/analytics';

type Props = {
  files: FileItem[];
  toolSlug: string;
};

export function DownloadAll({ files, toolSlug }: Props) {
  const [loading, setLoading] = useState(false);
  const [progressPct, setProgressPct] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const handleDownloadAll = async () => {
    if (loading) return;
    track('download_clicked', { toolId: toolSlug });
    setLoading(true);
    setProgressPct(0);
    setError(null);

    try {
      const names = new Set<string>();
      const inputs: ZipFileInput[] = [];

      for (const f of files) {
        if (!f.result) continue;
        let name = f.result.fileName;

        // De-duplicate names within ZIP
        if (names.has(name)) {
          const dot = name.lastIndexOf('.');
          const base = dot > 0 ? name.slice(0, dot) : name;
          const ext = dot > 0 ? name.slice(dot) : '';
          let i = 1;
          while (names.has(`${base}_${i}${ext}`)) i++;
          name = `${base}_${i}${ext}`;
        }
        names.add(name);

        inputs.push({
          name,
          blob: f.result.blob,
        });
      }

      if (inputs.length === 0) return;

      // Create ZIP off the main UI thread in a Web Worker
      const zipBlob = await createZipInWorker(inputs, (percent) => {
        setProgressPct(Math.round(percent));
      });

      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `hurrykit-${toolSlug}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      setTimeout(() => URL.revokeObjectURL(url), 10000);
    } catch (err) {
      console.error('Failed to create ZIP in worker:', err);
      setError('Failed to generate ZIP archive. You can still download files individually below.');
    } finally {
      setLoading(false);
      setProgressPct(0);
    }
  };

  return (
    <div className="flex flex-col gap-2 w-full">
      <button
        type="button"
        onClick={() => void handleDownloadAll()}
        disabled={loading}
        className="btn btn-ghost w-full justify-center min-h-[44px] py-3 text-sm font-semibold border border-[var(--border)] bg-[var(--surface)] hover:border-[var(--text)] transition-colors shadow-sm"
        aria-label={`Download all ${files.length} converted files as a ZIP archive`}
      >
        {loading ? (
          <span className="flex items-center gap-2">
            <span className="inline-block animate-spin" aria-hidden="true">
              ◌
            </span>
            <span>Creating ZIP archive {progressPct > 0 ? `(${progressPct}%)` : '…'}</span>
          </span>
        ) : (
          <span className="flex items-center gap-2">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
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
            Download all as ZIP ({files.length} files)
          </span>
        )}
      </button>
      {error && (
        <p role="alert" className="text-xs text-[var(--accent)] text-center py-1">
          {error}
        </p>
      )}
    </div>
  );
}
