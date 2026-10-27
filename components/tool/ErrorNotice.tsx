'use client';
import type { JobError } from '@/engines/types';

type Props = {
  error: JobError;
  onRetry?: () => void;
};

function getActionableGuidance(code: string): string {
  switch (code) {
    case 'UNSUPPORTED_INPUT':
      return 'This file type is not supported by this tool. Check if another Hurrykit converter matches your format.';
    case 'CORRUPT_FILE':
      return 'The file appears damaged, empty, or incomplete. Try re-saving or exporting it from your source app and upload again.';
    case 'TOO_LARGE':
      return 'This file exceeds the in-browser memory budget for your device. Try converting a smaller file or use a desktop computer.';
    case 'OUT_OF_MEMORY':
      return 'Your device ran out of available memory. Try closing background tabs or converting on a computer with more RAM.';
    case 'UNSUPPORTED_FORMAT':
      return 'The format could not be decoded. Ensure the file extension matches its real contents.';
    case 'ENGINE_LOAD_FAILED':
      return 'Could not download the conversion engine. Please check your internet connection and try again.';
    case 'ENCODE_FAILED':
      return 'Encoding failed for this specific file. Try adjusting the quality or preset settings and convert again.';
    case 'UNSUPPORTED_BROWSER':
      return 'Your browser lacks required WebAssembly or Web Worker features. Please open this page in modern Chrome, Safari, Edge, or Firefox.';
    case 'NO_AUDIO_STREAM':
      return 'No audio track was found in this file. Ensure the video or recording contains audible sound.';
    case 'TIMEOUT':
      return 'The conversion took longer than the time limit. Try converting a shorter clip or smaller file.';
    case 'CANCELLED':
      return 'The conversion was cancelled.';
    default:
      return 'An unexpected issue occurred. You can retry the conversion or try a different file.';
  }
}

export function ErrorNotice({ error, onRetry }: Props) {
  const guidance = getActionableGuidance(error.code);

  return (
    <div
      role="alert"
      className="card border border-[var(--error)] bg-[color-mix(in_srgb,var(--error)_8%,transparent)] p-4 sm:p-5 shadow-sm animate-fade-in"
    >
      <div className="flex items-start gap-3.5">
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
          style={{
            background: 'color-mix(in srgb, var(--error) 15%, transparent)',
            color: 'var(--error)',
          }}
          aria-hidden="true"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
            <line x1="12" y1="8" x2="12" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <circle cx="12" cy="16" r="1" fill="currentColor" />
          </svg>
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-bold text-[var(--error)]">
            {error.message}
          </h3>

          <p className="text-xs text-[var(--text)] mt-1.5 leading-relaxed">
            {guidance}
          </p>

          {error.detail && (
            <p className="text-[11px] font-mono text-[var(--muted)] mt-2 bg-[var(--surface-2)] p-2 rounded border border-[var(--border)] break-all">
              Details: {error.detail}
            </p>
          )}

          {error.recoverable && onRetry && (
            <div className="mt-3">
              <button
                type="button"
                onClick={onRetry}
                className="btn btn-primary text-xs sm:text-sm py-2 px-4 shadow-sm"
              >
                Try again
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
