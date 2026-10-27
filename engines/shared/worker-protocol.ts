/**
 * Worker message protocol.
 * Defines all message contracts between the main thread and dedicated Web Workers.
 * Supports transferable ArrayBuffers to avoid copying large files in memory.
 */
import type { JobProgress, JobError, ProgressStage } from '../types';

export interface WorkerJobData {
  toolId: string;
  from: string;
  to: string;
  fileName: string;
  mimeType?: string;
  options: Record<string, string | number | boolean>;
}

// ─── Main → Worker (Requests) ─────────────────────────────────────────────────

export interface WorkerPrepareRequest {
  type: 'prepare';
  id: string;
}

export interface WorkerStartRequest {
  type: 'start' | 'run';
  id: string;
  job: WorkerJobData;
  buffer: ArrayBuffer;
}

export interface WorkerCancelRequest {
  type: 'cancel';
  id: string;
}

export type MainToWorkerMessage =
  | WorkerPrepareRequest
  | WorkerStartRequest
  | WorkerCancelRequest;

// ─── Worker → Main (Responses) ─────────────────────────────────────────────────

export interface WorkerReadyResponse {
  type: 'ready';
  id: string;
}

export interface WorkerProgressResponse {
  type: 'progress';
  id: string;
  stage: ProgressStage;
  fraction: number;
  message?: string | undefined;
  secondsRemaining?: number | undefined;
}

export interface WorkerResultData {
  fileName: string;
  mime: string;
  bytes: number;
  notes?: string[] | undefined;
}

export interface WorkerResultResponse {
  type: 'result';
  id: string;
  result: WorkerResultData;
  buffer: ArrayBuffer;
}

export interface WorkerErrorResponse {
  type: 'error';
  id: string;
  error: JobError;
}

export type WorkerToMainMessage =
  | WorkerReadyResponse
  | WorkerProgressResponse
  | WorkerResultResponse
  | WorkerErrorResponse;
