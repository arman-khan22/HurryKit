/**
 * Base Worker Wrapper.
 * Encapsulates the Web Worker lifecycle, transferable ArrayBuffer dispatching,
 * message protocol handling, progress streaming, error classification, and cancellation.
 */
import type {
  ConvertJob,
  ProgressEvent,
  Result,
  JobError,
  JobProgress,
} from '../types';
import { makeJobError, classifyError } from '../types';
import type {
  MainToWorkerMessage,
  WorkerToMainMessage,
  WorkerJobData,
} from './worker-protocol';

export type WorkerFactory = () => Worker;

export interface WorkerWrapperOptions {
  terminateOnCancel?: boolean;
  timeoutMs?: number;
}

export class BaseWorkerWrapper {
  private worker: Worker | null = null;
  private workerFactory: WorkerFactory;
  private options: WorkerWrapperOptions;
  private activeJobId: string | null = null;
  private isPrepared = false;

  constructor(workerFactory: WorkerFactory, options: WorkerWrapperOptions = {}) {
    this.workerFactory = workerFactory;
    this.options = {
      terminateOnCancel: false,
      timeoutMs: 120_000, // 2-minute safety timeout
      ...options,
    };
  }

  /**
   * Ensure worker instance is running.
   */
  public getWorker(): Worker {
    if (!this.worker) {
      this.worker = this.workerFactory();
      this.worker.onerror = (err) => {
        console.error('[WorkerWrapper] Uncaught error in worker:', err);
      };
    }
    return this.worker;
  }

  /**
   * Warm up and prepare the worker engine.
   */
  public async prepare(onProgress?: (p: ProgressEvent) => void): Promise<void> {
    if (this.isPrepared) return;

    const worker = this.getWorker();
    const id = `prepare_${Date.now()}`;

    return new Promise<void>((resolve, reject) => {
      const handleMessage = (e: MessageEvent<WorkerToMainMessage>) => {
        const msg = e.data;
        if (!msg || msg.id !== id) return;

        if (msg.type === 'progress') {
          onProgress?.({
            stage: msg.stage,
            fraction: msg.fraction,
            message: msg.message,
            secondsRemaining: msg.secondsRemaining,
          });
        } else if (msg.type === 'ready') {
          worker.removeEventListener('message', handleMessage);
          this.isPrepared = true;
          resolve();
        } else if (msg.type === 'error') {
          worker.removeEventListener('message', handleMessage);
          reject(new Error(msg.error.message));
        }
      };

      worker.addEventListener('message', handleMessage);

      const req: MainToWorkerMessage = { type: 'prepare', id };
      worker.postMessage(req);
    });
  }

  /**
   * Execute a conversion job through the worker.
   */
  public async run(
    input: ConvertJob,
    onProgress: (p: ProgressEvent) => void,
    signal: AbortSignal,
  ): Promise<Result> {
    if (signal.aborted) {
      throw makeJobError('CANCELLED', 'Operation was aborted before starting.');
    }

    const worker = this.getWorker();
    const id = `job_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    this.activeJobId = id;

    // Read input file into transferable ArrayBuffer
    let arrayBuffer: ArrayBuffer;
    try {
      arrayBuffer = await input.file.arrayBuffer();
    } catch (readErr) {
      throw makeJobError('CORRUPT_FILE', `Failed to read file: ${(readErr as Error).message}`);
    }

    const jobData: WorkerJobData = {
      toolId: input.toolId,
      from: input.from,
      to: input.to,
      fileName: input.file.name,
      mimeType: input.file.type,
      options: input.options,
    };

    return new Promise<Result>((resolve, reject) => {
      let timeoutTimer: ReturnType<typeof setTimeout> | undefined;

      const cleanup = () => {
        if (timeoutTimer) clearTimeout(timeoutTimer);
        worker.removeEventListener('message', onMessage);
        worker.removeEventListener('error', onError);
        signal.removeEventListener('abort', onAbort);
        if (this.activeJobId === id) {
          this.activeJobId = null;
        }
      };

      const onAbort = () => {
        if (this.options.terminateOnCancel) {
          // Hard termination for engines that cannot interrupt synchronous execution
          this.dispose();
          cleanup();
          reject(makeJobError('CANCELLED', 'Conversion was aborted.'));
        } else {
          // Soft cancellation message
          const cancelMsg: MainToWorkerMessage = { type: 'cancel', id };
          try {
            worker.postMessage(cancelMsg);
          } catch {
            // Worker may have already shut down
          }
          cleanup();
          reject(makeJobError('CANCELLED', 'Conversion was aborted.'));
        }
      };

      signal.addEventListener('abort', onAbort);

      const onError = (e: ErrorEvent) => {
        cleanup();
        reject(classifyError(e.error ?? e.message));
      };
      worker.addEventListener('error', onError);

      const onMessage = (e: MessageEvent<WorkerToMainMessage>) => {
        const msg = e.data;
        if (!msg || msg.id !== id) return;

        if (msg.type === 'progress') {
          const progress: JobProgress = {
            stage: msg.stage,
            fraction: msg.fraction,
            message: msg.message,
            secondsRemaining: msg.secondsRemaining,
          };
          onProgress(progress);
        } else if (msg.type === 'result') {
          cleanup();
          const blob = new Blob([msg.buffer], { type: msg.result.mime });
          resolve({
            blob,
            fileName: msg.result.fileName,
            mime: msg.result.mime,
            bytes: msg.result.bytes || blob.size,
            notes: msg.result.notes,
          });
        } else if (msg.type === 'error') {
          cleanup();
          reject(msg.error);
        }
      };
      worker.addEventListener('message', onMessage);

      // Start timeout timer if configured
      if (this.options.timeoutMs && this.options.timeoutMs > 0) {
        timeoutTimer = setTimeout(() => {
          cleanup();
          reject(makeJobError('UNKNOWN', 'Operation timed out.'));
        }, this.options.timeoutMs);
      }

      // Dispatch start request with transferable ArrayBuffer
      const startReq: MainToWorkerMessage = {
        type: 'start',
        id,
        job: jobData,
        buffer: arrayBuffer,
      };

      try {
        worker.postMessage(startReq, [arrayBuffer]);
      } catch (postErr) {
        cleanup();
        reject(classifyError(postErr));
      }
    });
  }

  /**
   * Terminate worker and reset instance.
   */
  public dispose(): void {
    if (this.worker) {
      try {
        this.worker.terminate();
      } catch {
        // Ignore termination errors
      }
      this.worker = null;
    }
    this.activeJobId = null;
    this.isPrepared = false;
  }
}
