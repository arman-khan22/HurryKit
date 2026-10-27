'use client';
import { useRef, useCallback, useState, useEffect } from 'react';
import type { Tool } from '@/registry/schema';

type Props = {
  tool: Tool;
  onFiles: (files: File[]) => void;
  disabled?: boolean;
};

/** Build the accept string from the tool's "from" format list */
function buildAccept(tool: Tool): string {
  const extMap: Record<string, string[]> = {
    heic: ['.heic', '.heif'],
    jpg: ['.jpg', '.jpeg'],
    png: ['.png'],
    webp: ['.webp'],
    avif: ['.avif'],
    gif: ['.gif'],
    bmp: ['.bmp'],
    tiff: ['.tif', '.tiff'],
    svg: ['.svg'],
    jfif: ['.jfif'],
    mp3: ['.mp3'],
    wav: ['.wav'],
    aac: ['.aac'],
    m4a: ['.m4a'],
    flac: ['.flac'],
    ogg: ['.ogg'],
    opus: ['.opus'],
    wma: ['.wma'],
    aiff: ['.aiff', '.aif'],
    amr: ['.amr'],
    mp4: ['.mp4'],
    mov: ['.mov'],
    mkv: ['.mkv'],
    avi: ['.avi'],
    webm: ['.webm'],
    wmv: ['.wmv'],
    flv: ['.flv'],
    '3gp': ['.3gp'],
    m4v: ['.m4v'],
    mpeg: ['.mpeg', '.mpg'],
  };

  const exts = tool.from.flatMap((fid) => extMap[fid] ?? []);
  return exts.length > 0 ? exts.join(',') : '*/*';
}

function formatLabel(fromIds: string[]): string {
  const labels = fromIds.map((id) => id.toUpperCase());
  if (labels.length === 1) return labels[0] ?? '';
  const last = labels.pop();
  return `${labels.join(', ')} or ${last}`;
}

export function DropZone({ tool, onFiles, disabled }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const handleFiles = useCallback(
    (fileList: FileList | null | File[]) => {
      if (!fileList) return;
      const files = Array.from(fileList);
      if (files.length === 0) return;
      onFiles(files);
    },
    [onFiles],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      if (disabled) return;

      // Case 10: Check if a folder was dropped
      const items = e.dataTransfer.items;
      if (items && items.length > 0) {
        for (let i = 0; i < items.length; i++) {
          const item = items[i];
          const entry = (item as unknown as { webkitGetAsEntry?: () => { isDirectory?: boolean } }).webkitGetAsEntry?.();
          if (entry?.isDirectory) {
            const el = document.getElementById('live-announcer');
            if (el) el.textContent = 'Folders cannot be converted directly. Please select or drop individual files.';
          }
        }
      }

      handleFiles(e.dataTransfer.files);
    },
    [disabled, handleFiles],
  );

  // Global window paste listener for ease of use (e.g. Snipping tool screenshots)
  useEffect(() => {
    if (disabled) return;

    const handleWindowPaste = (e: ClipboardEvent) => {
      // Don't intercept paste inside active input/textarea elements
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) {
        return;
      }

      const items = e.clipboardData?.items;
      if (!items) return;

      const files: File[] = [];
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item && item.kind === 'file') {
          const file = item.getAsFile();
          if (file) files.push(file);
        }
      }

      if (files.length > 0) {
        handleFiles(files);
      }
    };

    window.addEventListener('paste', handleWindowPaste);
    return () => window.removeEventListener('paste', handleWindowPaste);
  }, [disabled, handleFiles]);

  const deptAccentVar =
    tool.department === 'image'
      ? 'var(--image)'
      : tool.department === 'audio'
        ? 'var(--audio)'
        : 'var(--video)';

  const fromLabel = formatLabel(tool.from);
  const maxSizeMB = Math.round(tool.limits.maxBytes / (1024 * 1024));
  const isImageDept = tool.department === 'image';

  return (
    <div
      className={`drop-zone group relative cursor-pointer select-none transition-all duration-200 ${
        dragging ? 'dragging ring-4 ring-offset-2' : ''
      } ${disabled ? 'opacity-50 pointer-events-none' : ''}`}
      style={{
        borderColor: dragging ? deptAccentVar : undefined,
      }}
      onClick={(e) => {
        // Prevent clicking sub-buttons from double-opening default input
        const target = e.target as HTMLElement;
        if (target.closest('button')) return;
        inputRef.current?.click();
      }}
      onDrop={handleDrop}
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      role="region"
      tabIndex={0}
      aria-label={`File upload area. Drop ${fromLabel} files here.`}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          inputRef.current?.click();
        }
      }}
    >
      {/* Standard hidden file input */}
      <input
        ref={inputRef}
        type="file"
        accept={buildAccept(tool)}
        multiple={tool.limits.maxFiles > 1}
        onChange={(e) => {
          handleFiles(e.target.files);
          // Reset input value so re-selecting same file triggers onChange
          e.target.value = '';
        }}
        tabIndex={-1}
        aria-hidden="true"
        className="sr-only"
        id={`file-input-${tool.id}`}
      />

      {/* Hidden camera input for mobile image capture */}
      {isImageDept && (
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={(e) => {
            handleFiles(e.target.files);
            e.target.value = '';
          }}
          tabIndex={-1}
          aria-hidden="true"
          className="sr-only"
          id={`camera-input-${tool.id}`}
        />
      )}

      {/* Central upload icon */}
      <div
        className="w-16 h-16 rounded-full flex items-center justify-center mb-3 transition-transform duration-200 group-hover:scale-105"
        style={{ background: `color-mix(in srgb, ${deptAccentVar} 12%, transparent)` }}
        aria-hidden="true"
      >
        <svg
          width="30"
          height="30"
          viewBox="0 0 24 24"
          fill="none"
          style={{ color: deptAccentVar }}
        >
          <path
            d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <polyline
            points="17 8 12 3 7 8"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <line
            x1="12"
            y1="3"
            x2="12"
            y2="15"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      </div>

      <p className="text-base sm:text-lg font-semibold text-[var(--text)] text-center">
        {dragging ? 'Drop your files here' : 'Drop files here or click to choose'}
      </p>

      <p className="text-xs sm:text-sm text-[var(--muted)] mt-1.5 text-center">
        {fromLabel} · Up to {tool.limits.maxFiles} file{tool.limits.maxFiles !== 1 ? 's' : ''} · Max {maxSizeMB} MB each
      </p>

      {/* Action buttons (Choose files & Camera capture) */}
      <div className="flex flex-wrap items-center justify-center gap-2 mt-4">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            inputRef.current?.click();
          }}
          className="btn btn-primary text-xs sm:text-sm py-2 px-4 shadow-sm"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="M3 7v10a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-6l-2-2H5a2 2 0 0 0-2 2z"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Choose files
        </button>

        {isImageDept && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              cameraInputRef.current?.click();
            }}
            className="btn btn-ghost border border-[var(--border)] text-xs sm:text-sm py-2 px-3 hover:border-[var(--text)]"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <circle cx="12" cy="13" r="4" stroke="currentColor" strokeWidth="2" />
            </svg>
            Use camera
          </button>
        )}
      </div>

      <p className="text-[11px] text-[var(--muted)] mt-3 text-center">
        Tip: You can also paste an image directly from your clipboard (<kbd className="font-mono text-[10px] bg-[var(--surface-2)] px-1 py-0.5 rounded border border-[var(--border)]">Ctrl+V</kbd>)
      </p>
    </div>
  );
}
