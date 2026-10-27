/**
 * Engine abstraction layer — the only interface the UI ever touches.
 * All engines (image, ffmpeg) implement this contract.
 */

// ─── Error codes ──────────────────────────────────────────────────────────────

export const ERROR_CODES = [
  'UNSUPPORTED_INPUT',
  'CORRUPT_FILE',
  'TOO_LARGE',
  'OUT_OF_MEMORY',
  'ENGINE_LOAD_FAILED',
  'ENCODE_FAILED',
  'UNSUPPORTED_BROWSER',
  'CANCELLED',
  'TIMEOUT',
  'NO_AUDIO_STREAM',
  'UNKNOWN',
] as const;

export type ErrorCode = (typeof ERROR_CODES)[number];

export const ErrorCodeEnum = {
  UNSUPPORTED_INPUT: 'UNSUPPORTED_INPUT',
  CORRUPT_FILE: 'CORRUPT_FILE',
  TOO_LARGE: 'TOO_LARGE',
  OUT_OF_MEMORY: 'OUT_OF_MEMORY',
  ENGINE_LOAD_FAILED: 'ENGINE_LOAD_FAILED',
  ENCODE_FAILED: 'ENCODE_FAILED',
  UNSUPPORTED_BROWSER: 'UNSUPPORTED_BROWSER',
  CANCELLED: 'CANCELLED',
  TIMEOUT: 'TIMEOUT',
  NO_AUDIO_STREAM: 'NO_AUDIO_STREAM',
  UNKNOWN: 'UNKNOWN',
} as const;

export const ERROR_MESSAGES: Record<ErrorCode, string> = {
  UNSUPPORTED_INPUT: 'This file type is not supported by this tool.',
  CORRUPT_FILE: 'This file looks damaged.',
  TOO_LARGE: 'This file is bigger than this tool can handle on your device.',
  OUT_OF_MEMORY: 'Your device ran out of memory. Try a smaller file.',
  ENGINE_LOAD_FAILED: 'Could not load the converter. Check your connection and try again.',
  ENCODE_FAILED: 'Conversion failed. Try a different setting.',
  UNSUPPORTED_BROWSER: 'Your browser cannot run this tool. Try Chrome or Safari.',
  CANCELLED: 'Conversion was cancelled.',
  TIMEOUT: 'The conversion timed out. Try a shorter clip or smaller file.',
  NO_AUDIO_STREAM: 'No audio stream was found in this file.',
  UNKNOWN: 'Something went wrong. Nothing was uploaded.',
};

// ─── Job & Progress types ─────────────────────────────────────────────────────

export type JobInput = {
  file: File;
  toolId: string;
  /** Detected real input format ID (from magic bytes) */
  from: string;
  /** Target output format ID */
  to: string;
  options: Record<string, string | number | boolean>;
  limits?: {
    maxBytes?: number | undefined;
    warnBytes?: number | undefined;
    maxFiles?: number | undefined;
  } | undefined;
};

/** Alias for JobInput as specified in Section 7 */
export type ConvertJob = JobInput;

export type ProgressStage =
  | 'loading-engine'
  | 'reading'
  | 'detecting'
  | 'converting'
  | 'encoding'
  | 'finishing';

export type JobProgress = {
  stage: ProgressStage;
  /** 0.0 to 1.0 */
  fraction: number;
  message?: string | undefined;
  /** Estimated seconds remaining — available once enough data exists */
  secondsRemaining?: number | undefined;
};

/** Engine progress event representation */
export type ProgressEvent = JobProgress;

export type JobResult = {
  blob: Blob;
  fileName: string;
  mime: string;
  bytes: number;
  /** Optional informational notes (e.g. "First frame extracted", "Downscaled to 8k px") */
  notes?: string[] | undefined;
};

/** Alias for JobResult as specified in Section 7 */
export type Result = JobResult;

export type JobError = {
  code: ErrorCode;
  message: string;
  detail?: string | undefined;
  recoverable: boolean;
};

// ─── Engine interface ─────────────────────────────────────────────────────────

export interface Engine {
  readonly id: 'image' | 'ffmpeg';

  /** Returns true if this engine can handle the given input */
  canHandle(input: ConvertJob): boolean;

  /**
   * Load engine code and warm up.
   * Called lazily the first time a job is started.
   * onProgress receives loading-engine fractions (0 → 1).
   */
  prepare(onProgress?: (p: ProgressEvent) => void): Promise<void>;

  /**
   * Run a conversion job.
   * @param input — Job specifications
   * @param onProgress — Progress callback receiving normalized progress events
   * @param signal — AbortSignal for cancellation
   */
  run(
    input: ConvertJob,
    onProgress: (p: ProgressEvent) => void,
    signal: AbortSignal,
  ): Promise<Result>;

  /** Free memory and terminate any workers */
  dispose(): void;
}

// ─── Helper: build a JobError ─────────────────────────────────────────────────

export function makeJobError(
  code: ErrorCode,
  detail?: string,
  recoverable = true,
): JobError {
  return {
    code,
    message: ERROR_MESSAGES[code],
    detail,
    recoverable,
  };
}

/** Classify a caught error into a JobError */
export function classifyError(err: unknown): JobError {
  if (err instanceof Error) {
    const msg = err.message.toLowerCase();
    if (msg.includes('out of memory') || msg.includes('oom') || msg.includes('allocation')) {
      return makeJobError('OUT_OF_MEMORY', err.message, false);
    }
    if (msg.includes('aborted') || msg.includes('abort') || msg.includes('cancel')) {
      return makeJobError('CANCELLED', err.message, true);
    }
    if (msg.includes('corrupt') || msg.includes('invalid data') || msg.includes('decode')) {
      return makeJobError('CORRUPT_FILE', err.message, false);
    }
    if (msg.includes('encode') || msg.includes('mux')) {
      return makeJobError('ENCODE_FAILED', err.message, true);
    }
    if (msg.includes('network') || msg.includes('fetch') || msg.includes('failed to load')) {
      return makeJobError('ENGINE_LOAD_FAILED', err.message, true);
    }
    if (msg.includes('not supported') || msg.includes('unsupported input')) {
      return makeJobError('UNSUPPORTED_INPUT', err.message, false);
    }
  }
  return makeJobError('UNKNOWN', String(err), true);
}
