/**
 * Utility to create ZIP archives off the main UI thread using a dedicated Web Worker.
 * Falls back to main-thread JSZip in test/Node environments.
 */

export interface ZipFileInput {
  name: string;
  blob: Blob;
}

export async function createZipInWorker(
  files: ZipFileInput[],
  onProgress?: (percent: number) => void,
): Promise<Blob> {
  if (typeof Worker !== 'undefined') {
    return new Promise(async (resolve, reject) => {
      try {
        const worker = new Worker(new URL('./zip.worker.ts', import.meta.url), {
          type: 'module',
        });

        // Convert blobs to ArrayBuffers for zero-copy Transferable transfer
        const fileBuffers = await Promise.all(
          files.map(async (f) => ({
            name: f.name,
            buffer: await f.blob.arrayBuffer(),
          })),
        );

        const transferList = fileBuffers.map((f) => f.buffer);

        worker.onmessage = (e: MessageEvent) => {
          const data = e.data;
          if (data.type === 'ZIP_PROGRESS') {
            onProgress?.(data.percent);
          } else if (data.type === 'ZIP_SUCCESS') {
            worker.terminate();
            resolve(new Blob([data.buffer], { type: 'application/zip' }));
          } else if (data.type === 'ZIP_ERROR') {
            worker.terminate();
            reject(new Error(data.message));
          }
        };

        worker.onerror = (err) => {
          worker.terminate();
          // Fall back if worker fails
          fallbackZip(files, onProgress).then(resolve).catch(reject);
        };

        worker.postMessage({ type: 'ZIP_REQUEST', files: fileBuffers }, transferList);
      } catch {
        // Fallback to in-thread generation if worker construction fails
        fallbackZip(files, onProgress).then(resolve).catch(reject);
      }
    });
  }

  return fallbackZip(files, onProgress);
}

async function fallbackZip(
  files: ZipFileInput[],
  onProgress?: (percent: number) => void,
): Promise<Blob> {
  const { default: JSZip } = await import('jszip');
  const zip = new JSZip();
  for (const f of files) {
    zip.file(f.name, f.blob);
  }
  return zip.generateAsync(
    { type: 'blob', compression: 'DEFLATE', compressionOptions: { level: 6 } },
    (metadata) => onProgress?.(metadata.percent),
  );
}
