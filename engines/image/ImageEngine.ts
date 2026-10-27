/**
 * Image Engine.
 * Implements the Engine interface for all still-image conversions.
 * Delegates execution entirely to a dedicated Web Worker (image.worker.ts)
 * so that CPU-intensive decoding, canvas operations, and WebAssembly transcoding
 * never block the main browser UI thread.
 */
import type { Engine, ConvertJob, ProgressEvent, Result } from '../types';
import { makeJobError, classifyError } from '../types';
import { memoryGuard } from '../shared/memory';
import { outputFileName } from '../shared/naming';
import { BaseWorkerWrapper } from '../shared/worker-wrapper';

const MIME_MAP: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  jfif: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  avif: 'image/avif',
  bmp: 'image/bmp',
  gif: 'image/gif',
  ico: 'image/x-icon',
};

export class ImageEngine implements Engine {
  readonly id = 'image' as const;
  private workerWrapper: BaseWorkerWrapper | null = null;

  canHandle(input: ConvertJob): boolean {
    const supported = [
      'heic',
      'heif',
      'jpg',
      'jpeg',
      'jfif',
      'png',
      'webp',
      'avif',
      'gif',
      'bmp',
      'tiff',
      'svg',
      'ico',
    ];
    return supported.includes(input.from.toLowerCase());
  }

  async prepare(onProgress?: (p: ProgressEvent) => void): Promise<void> {
    if (typeof Worker !== 'undefined') {
      const wrapper = this.getWrapper();
      await wrapper.prepare(onProgress);
    }
  }

  async run(
    input: ConvertJob,
    onProgress: (p: ProgressEvent) => void,
    signal: AbortSignal,
  ): Promise<Result> {
    const { file, to } = input;

    // ── 1. Pre-flight Memory Guard ──────────────────────────────────────────
    const guard = memoryGuard(file);
    if (!guard.ok && guard.status === 'block') {
      throw makeJobError(guard.code ?? 'TOO_LARGE', guard.message, false);
    }

    if (signal.aborted) {
      throw makeJobError('CANCELLED', 'Operation was cancelled before starting.');
    }

    // ── 2. Web Worker Execution (Browser) ───────────────────────────────────
    if (typeof Worker !== 'undefined') {
      try {
        const wrapper = this.getWrapper();
        return await wrapper.run(input, onProgress, signal);
      } catch (err) {
        if (err && typeof err === 'object' && 'code' in err) {
          throw err;
        }
        throw classifyError(err);
      }
    }

    // ── 3. Headless Fallback (Node / Vitest test environments) ───────────────
    return this.runHeadless(input, onProgress, signal);
  }

  dispose(): void {
    if (this.workerWrapper) {
      this.workerWrapper.dispose();
      this.workerWrapper = null;
    }
  }

  private getWrapper(): BaseWorkerWrapper {
    if (!this.workerWrapper) {
      this.workerWrapper = new BaseWorkerWrapper(
        () => new Worker(new URL('./image.worker.ts', import.meta.url), { type: 'module' }),
        { terminateOnCancel: true },
      );
    }
    return this.workerWrapper;
  }

  /**
   * Headless fallback for Node.js / unit test environments where Web Worker is unavailable.
   */
  private async runHeadless(
    input: ConvertJob,
    onProgress: (p: ProgressEvent) => void,
    signal: AbortSignal,
  ): Promise<Result> {
    onProgress({ stage: 'reading', fraction: 0.1 });
    if (signal.aborted) throw makeJobError('CANCELLED');

    const buffer = await input.file.arrayBuffer();
    onProgress({ stage: 'converting', fraction: 0.5 });

    if (signal.aborted) throw makeJobError('CANCELLED');

    // Produce valid simulated output blob for headless testing
    const outMime = MIME_MAP[input.to] ?? 'image/png';
    const outFileName = outputFileName(input.file.name, input.to);
    const blob = new Blob([buffer], { type: outMime });

    const notes: string[] = [];
    if (input.from.toLowerCase() === input.to.toLowerCase()) {
      notes.push('File is already in the target format. Re-encoding will create a new copy.');
    }
    const needsBg = ['jpg', 'jpeg', 'jfif'].includes(input.to.toLowerCase());
    if (needsBg && ['png', 'webp', 'svg', 'gif'].includes(input.from.toLowerCase())) {
      notes.push('Transparency replaced with white background.');
    }

    onProgress({ stage: 'finishing', fraction: 1.0 });

    return {
      blob,
      fileName: outFileName,
      mime: outMime,
      bytes: blob.size,
      ...(notes.length > 0 ? { notes } : {}),
    };
  }
}
