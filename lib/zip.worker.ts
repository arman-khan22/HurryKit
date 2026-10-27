/// <reference lib="webworker" />
import JSZip from 'jszip';

export interface ZipWorkerMessage {
  type: 'ZIP_REQUEST';
  files: Array<{ name: string; buffer: ArrayBuffer }>;
}

export interface ZipWorkerSuccess {
  type: 'ZIP_SUCCESS';
  buffer: ArrayBuffer;
}

export interface ZipWorkerProgress {
  type: 'ZIP_PROGRESS';
  percent: number;
}

export interface ZipWorkerError {
  type: 'ZIP_ERROR';
  message: string;
}

self.onmessage = async (e: MessageEvent<ZipWorkerMessage>) => {
  if (e.data && e.data.type === 'ZIP_REQUEST') {
    try {
      const zip = new JSZip();
      for (const file of e.data.files) {
        zip.file(file.name, file.buffer);
      }

      const zipArrayBuffer = await zip.generateAsync(
        { type: 'arraybuffer', compression: 'DEFLATE', compressionOptions: { level: 6 } },
        (metadata) => {
          self.postMessage({
            type: 'ZIP_PROGRESS',
            percent: metadata.percent,
          } as ZipWorkerProgress);
        },
      );

      self.postMessage(
        { type: 'ZIP_SUCCESS', buffer: zipArrayBuffer } as ZipWorkerSuccess,
        [zipArrayBuffer],
      );
    } catch (err) {
      self.postMessage({
        type: 'ZIP_ERROR',
        message: err instanceof Error ? err.message : String(err),
      } as ZipWorkerError);
    }
  }
};
