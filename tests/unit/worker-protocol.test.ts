import { describe, it, expect } from 'vitest';
import {
  ERROR_CODES,
  ERROR_MESSAGES,
  makeJobError,
  classifyError,
} from '../../engines/types';
import { assertNotAborted, isCancellation, CancelledError } from '../../engines/shared/cancellation';

describe('Worker Protocol, Errors, and Cancellation', () => {
  it('defines all 9 ErrorCodes specified in Section 7', () => {
    const expectedCodes = [
      'UNSUPPORTED_INPUT',
      'CORRUPT_FILE',
      'TOO_LARGE',
      'OUT_OF_MEMORY',
      'ENGINE_LOAD_FAILED',
      'ENCODE_FAILED',
      'UNSUPPORTED_BROWSER',
      'CANCELLED',
      'UNKNOWN',
    ];

    for (const code of expectedCodes) {
      expect(ERROR_CODES).toContain(code);
      expect(typeof ERROR_MESSAGES[code as keyof typeof ERROR_MESSAGES]).toBe('string');
    }
  });

  it('classifies caught runtime errors appropriately', () => {
    const oom = new Error('Out of memory allocation failed');
    expect(classifyError(oom).code).toBe('OUT_OF_MEMORY');

    const abort = new Error('The operation was aborted by user');
    expect(classifyError(abort).code).toBe('CANCELLED');

    const corrupt = new Error('Invalid decode stream: data is corrupt');
    expect(classifyError(corrupt).code).toBe('CORRUPT_FILE');

    const network = new Error('Failed to fetch wasm binary');
    expect(classifyError(network).code).toBe('ENGINE_LOAD_FAILED');

    const generic = new Error('Random mystery exception');
    expect(classifyError(generic).code).toBe('UNKNOWN');
  });

  it('assertNotAborted throws CancelledError when signal is aborted', () => {
    const controller = new AbortController();
    expect(() => assertNotAborted(controller.signal)).not.toThrow();

    controller.abort('User clicked cancel');
    expect(() => assertNotAborted(controller.signal)).toThrowError(CancelledError);
  });

  it('identifies cancellation errors correctly', () => {
    expect(isCancellation(new CancelledError())).toBe(true);
    expect(isCancellation(new Error('Operation was cancelled'))).toBe(true);
    expect(isCancellation(new Error('SyntaxError'))).toBe(false);
  });
});
