/**
 * Cancellation utilities for engine workers and long-running pipelines.
 */
import { makeJobError, type JobError } from '../types';

export class CancelledError extends Error {
  constructor(message = 'Conversion was cancelled.') {
    super(message);
    this.name = 'CancelledError';
  }
}

/**
 * Checks if the signal is aborted and throws a CancelledError if so.
 */
export function assertNotAborted(signal?: AbortSignal): void {
  if (signal?.aborted) {
    throw new CancelledError(
      typeof signal.reason === 'string' ? signal.reason : 'Conversion was cancelled.',
    );
  }
}

/**
 * Determines whether an error was caused by job cancellation.
 */
export function isCancellation(err: unknown): boolean {
  if (err instanceof CancelledError) return true;
  if (err instanceof Error) {
    const msg = err.message.toLowerCase();
    return (
      err.name === 'AbortError' ||
      err.name === 'CancelledError' ||
      msg.includes('abort') ||
      msg.includes('cancel')
    );
  }
  return false;
}

/**
 * Creates a standard JobError for cancellation.
 */
export function makeCancelledError(detail?: string): JobError {
  return makeJobError('CANCELLED', detail, true);
}
