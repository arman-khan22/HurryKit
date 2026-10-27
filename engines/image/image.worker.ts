/**
 * Dedicated Web Worker for the Image Engine.
 * Executes all image decoding, transformation, and encoding in the background
 * to ensure the main UI thread never stutters or drops frames.
 */
import type {
  MainToWorkerMessage,
  WorkerToMainMessage,
  WorkerJobData,
} from '../shared/worker-protocol';
import { detectFormat } from '../shared/detect';
import { outputFileName } from '../shared/naming';
import { classifyError, makeJobError } from '../types';

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

// Maximum canvas pixel limit (protects memory on mobile devices e.g. iOS Safari 16.7M limit)
const MAX_CANVAS_PIXELS = 16_777_216; // ~4096 x 4096

// Helper for posting messages with or without transferable buffers
function postWorkerMessage(msg: WorkerToMainMessage, transfer?: Transferable[]): void {
  if (transfer) {
    (self as unknown as { postMessage: (m: unknown, t: Transferable[]) => void }).postMessage(
      msg,
      transfer,
    );
  } else {
    self.postMessage(msg);
  }
}

// Listen for messages from the main thread
self.addEventListener('message', async (e: MessageEvent<MainToWorkerMessage>) => {
  const msg = e.data;
  if (!msg) return;

  if (msg.type === 'prepare') {
    const readyRes: WorkerToMainMessage = { type: 'ready', id: msg.id };
    postWorkerMessage(readyRes);
    return;
  }

  if (msg.type === 'start' || msg.type === 'run') {
    const { id, job, buffer } = msg;

    try {
      await processImageJob(id, job, buffer);
    } catch (err) {
      const jobErr =
        err && typeof err === 'object' && 'code' in err
          ? (err as import('../types').JobError)
          : classifyError(err);

      const errRes: WorkerToMainMessage = {
        type: 'error',
        id,
        error: jobErr,
      };
      postWorkerMessage(errRes);
    }
  }
});

/**
 * Process a single image job in the worker.
 */
async function processImageJob(
  id: string,
  job: WorkerJobData,
  buffer: ArrayBuffer,
): Promise<void> {
  const postProgress = (
    stage: 'reading' | 'detecting' | 'converting' | 'encoding' | 'finishing',
    fraction: number,
    message?: string,
  ) => {
    const progRes: WorkerToMainMessage = {
      type: 'progress',
      id,
      stage,
      fraction,
      ...(message !== undefined ? { message } : {}),
    };
    postWorkerMessage(progRes);
  };

  postProgress('reading', 0.1, 'Reading file buffer…');

  const notes: string[] = [];
  const inBytes = new Uint8Array(buffer);

  // 1. Detect real format from magic bytes
  postProgress('detecting', 0.2, 'Verifying format…');
  const detected = await detectFormat(inBytes, job.fileName);
  const realFrom = detected?.id ?? job.from;

  // 2. Decode to ImageBitmap or ImageData
  postProgress('converting', 0.4, 'Decoding image…');
  let bitmap: ImageBitmap;

  try {
    if (['heic', 'heif'].includes(realFrom)) {
      bitmap = await decodeHeic(buffer);
      notes.push('Decoded with WebAssembly HEIC decoder.');
    } else if (realFrom === 'avif') {
      bitmap = await decodeAvif(buffer);
    } else if (realFrom === 'tiff') {
      bitmap = await decodeTiff(buffer);
      notes.push('First page extracted from TIFF.');
    } else if (realFrom === 'svg') {
      bitmap = await decodeSvg(buffer, job.options);
    } else {
      // Standard browser-supported formats: JPEG, PNG, WebP, GIF, BMP (respects EXIF orientation)
      const inputBlob = new Blob([buffer], { type: job.mimeType || MIME_MAP[realFrom] || 'image/png' });
      try {
        bitmap = await createImageBitmap(inputBlob, { imageOrientation: 'from-image' });
      } catch {
        bitmap = await createImageBitmap(inputBlob);
      }
    }
  } catch (decodeErr) {
    throw makeJobError(
      'CORRUPT_FILE',
      `Failed to decode ${realFrom.toUpperCase()} image: ${(decodeErr as Error).message}`,
      false,
    );
  }

  // 3. Inspect dimensions and calculate scaling if canvas limits exceeded
  let targetWidth = bitmap.width;
  let targetHeight = bitmap.height;
  const totalPixels = targetWidth * targetHeight;

  if (totalPixels > MAX_CANVAS_PIXELS) {
    const scale = Math.sqrt(MAX_CANVAS_PIXELS / totalPixels);
    targetWidth = Math.max(1, Math.round(targetWidth * scale));
    targetHeight = Math.max(1, Math.round(targetHeight * scale));
    notes.push(`Image was resized to fit browser memory limits (${targetWidth}×${targetHeight}).`);
  }

  // Case 13: Input already in target format
  if (realFrom === job.to.toLowerCase()) {
    notes.push('File is already in the target format. Re-encoding will create a new copy.');
  }

  // Case 15: Transparent format to non-transparent target (JPEG/JFIF)
  const needsBg = ['jpg', 'jpeg', 'jfif'].includes(job.to.toLowerCase());
  if (needsBg && ['png', 'webp', 'svg', 'gif'].includes(realFrom)) {
    notes.push('Transparency replaced with white background.');
  }

  // Case 18: Extract first frame from animated formats
  if (['gif'].includes(realFrom) && ['jpg', 'jpeg', 'png', 'webp', 'avif'].includes(job.to.toLowerCase())) {
    notes.push('First frame extracted from animation.');
  }

  // Case 20: Converted to standard sRGB colour space
  if (['tiff'].includes(realFrom)) {
    notes.push('Converted to standard sRGB colour space.');
  }

  // 4. Encode to target format
  postProgress('encoding', 0.7, `Encoding to ${job.to.toUpperCase()}…`);

  const qualityOption =
    typeof job.options['quality'] === 'number' ? job.options['quality'] / 100 : 0.9;
  const bgColor =
    typeof job.options['background'] === 'string' ? job.options['background'] : '#ffffff';

  let resultBlob: Blob;

  try {
    if (job.to === 'ico') {
      resultBlob = await encodeIco(bitmap);
    } else if (job.to === 'avif') {
      resultBlob = await encodeAvif(bitmap, qualityOption);
      notes.push('AVIF encoding uses WebAssembly compression.');
    } else {
      resultBlob = await encodeCanvas(
        bitmap,
        job.to,
        qualityOption,
        bgColor,
        targetWidth,
        targetHeight,
      );
    }
  } finally {
    // Guaranteed cleanup: close ImageBitmap to prevent heap leakage
    bitmap.close();
  }

  postProgress('finishing', 1.0, 'Finalizing result…');

  // Convert output Blob to transferable ArrayBuffer
  const outBuffer = await resultBlob.arrayBuffer();
  const outFileName = outputFileName(job.fileName, job.to);
  const outMime = MIME_MAP[job.to] ?? 'application/octet-stream';

  const resMsg: WorkerToMainMessage = {
    type: 'result',
    id,
    result: {
      fileName: outFileName,
      mime: outMime,
      bytes: outBuffer.byteLength,
      ...(notes.length > 0 ? { notes } : {}),
    },
    buffer: outBuffer,
  };

  // Transfer ArrayBuffer back to main thread
  postWorkerMessage(resMsg, [outBuffer]);
}

// ── Decode Helpers ────────────────────────────────────────────────────────────

async function decodeHeic(buffer: ArrayBuffer): Promise<ImageBitmap> {
  const heic2any = (await import('heic2any')).default;
  const blob = new Blob([buffer]);
  const result = await heic2any({
    blob,
    toType: 'image/png',
    quality: 1,
  });
  const outBlob = Array.isArray(result) ? result[0] : result;
  if (!outBlob) throw new Error('HEIC decoding produced no output');
  try {
    return await createImageBitmap(outBlob, { imageOrientation: 'from-image' });
  } catch {
    return await createImageBitmap(outBlob);
  }
}

async function decodeAvif(buffer: ArrayBuffer): Promise<ImageBitmap> {
  try {
    const blob = new Blob([buffer], { type: 'image/avif' });
    return await createImageBitmap(blob);
  } catch {
    const { decode } = await import('@jsquash/avif');
    const imageData = await decode(buffer);
    return createImageBitmap(imageData);
  }
}

async function decodeTiff(buffer: ArrayBuffer): Promise<ImageBitmap> {
  const UTIF = (await import('utif')).default ?? (await import('utif'));
  const ifds = UTIF.decode(buffer);
  if (!ifds || !ifds.length) throw new Error('No pages found in TIFF');
  const firstPage = ifds[0];
  if (!firstPage) throw new Error('Invalid TIFF page');
  UTIF.decodeImage(buffer, firstPage);

  const { width, height, data } = firstPage as { width: number; height: number; data: Uint8Array };
  const rgba = new Uint8ClampedArray(
    (UTIF as unknown as { toRGBA8: (ifd: unknown) => Uint8Array }).toRGBA8 !== undefined
      ? (UTIF as unknown as { toRGBA8: (ifd: unknown) => Uint8Array }).toRGBA8(firstPage)
      : data,
  );
  const imgData = new ImageData(rgba, width || 1, height || 1);
  return createImageBitmap(imgData);
}

async function decodeSvg(
  buffer: ArrayBuffer,
  options: Record<string, string | number | boolean>,
): Promise<ImageBitmap> {
  let text = new TextDecoder().decode(buffer);

  // Security & Edge Case Hardening:
  // 1. Strip script tags and on* event handlers (SVG sanitization / privacy)
  text = text.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  text = text.replace(/\son\w+\s*=\s*(['"]).*?\1/gi, '');
  text = text.replace(/\son\w+\s*=\s*[^\s>]+/gi, '');

  // 2. Case 23: SVG without viewBox or width/height
  const svgMatch = text.match(/<svg\b([^>]*)>/i);
  if (svgMatch) {
    const attrs = svgMatch[1] || '';
    const hasWidth = /\bwidth\s*=/i.test(attrs);
    const hasHeight = /\bheight\s*=/i.test(attrs);
    const hasViewBox = /\bviewBox\s*=/i.test(attrs);

    if (!hasViewBox && (!hasWidth || !hasHeight)) {
      const injected = attrs + ' viewBox="0 0 800 600" width="800" height="600"';
      text = text.replace(svgMatch[0], `<svg ${injected}>`);
    }
  }

  const blob = new Blob([text], { type: 'image/svg+xml' });
  const scale = typeof options['scale'] === 'number' ? options['scale'] : 1;
  const width = typeof options['width'] === 'number' ? options['width'] * scale : 1024;

  if (typeof OffscreenCanvas !== 'undefined') {
    // In workers with OffscreenCanvas
    return createImageBitmap(blob, { resizeWidth: width });
  }
  return createImageBitmap(blob);
}

// ── Encode Helpers ────────────────────────────────────────────────────────────

async function encodeCanvas(
  bitmap: ImageBitmap,
  to: string,
  quality: number,
  bgColor: string,
  width: number,
  height: number,
): Promise<Blob> {
  const canvas = new OffscreenCanvas(width, height);
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Unable to create 2D canvas context in worker');

  // If target format lacks transparency (JPEG / JFIF), fill background
  const needsBg = ['jpg', 'jpeg', 'jfif'].includes(to.toLowerCase());
  if (needsBg) {
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, width, height);
  }

  ctx.drawImage(bitmap, 0, 0, width, height);

  const mime = MIME_MAP[to] ?? 'image/png';
  const qualityArg = needsBg || to === 'webp' ? quality : undefined;

  return canvas.convertToBlob({
    type: mime,
    ...(qualityArg !== undefined ? { quality: qualityArg } : {}),
  });
}

async function encodeAvif(bitmap: ImageBitmap, quality: number): Promise<Blob> {
  const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(bitmap, 0, 0);
  const imageData = ctx.getImageData(0, 0, bitmap.width, bitmap.height);

  const { encode } = await import('@jsquash/avif');
  const encoded = await encode(imageData, { quality: Math.round(quality * 100) });
  return new Blob([encoded], { type: 'image/avif' });
}

async function encodeIco(bitmap: ImageBitmap): Promise<Blob> {
  const SIZES = [16, 32, 48, 64, 128, 256];
  const pngBlobs: ArrayBuffer[] = [];

  for (const size of SIZES) {
    const canvas = new OffscreenCanvas(size, size);
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(bitmap, 0, 0, size, size);
    const png = await canvas.convertToBlob({ type: 'image/png' });
    pngBlobs.push(await png.arrayBuffer());
  }

  const ICO_HEADER = 6;
  const ICO_ENTRY = 16;
  const totalHeader = ICO_HEADER + ICO_ENTRY * SIZES.length;
  const totalSize = totalHeader + pngBlobs.reduce((acc, b) => acc + b.byteLength, 0);
  const ico = new DataView(new ArrayBuffer(totalSize));

  // Type: 1 = ICO
  ico.setUint16(2, 1, true);
  ico.setUint16(4, SIZES.length, true);

  let offset = totalHeader;
  for (let i = 0; i < SIZES.length; i++) {
    const size = SIZES[i] ?? 16;
    const png = pngBlobs[i] ?? new ArrayBuffer(0);
    const entry = ICO_HEADER + i * ICO_ENTRY;
    ico.setUint8(entry, size === 256 ? 0 : size);
    ico.setUint8(entry + 1, size === 256 ? 0 : size);
    ico.setUint8(entry + 2, 0); // palette colors
    ico.setUint8(entry + 3, 0); // reserved
    ico.setUint16(entry + 4, 1, true); // color planes
    ico.setUint16(entry + 6, 32, true); // bits per pixel
    ico.setUint32(entry + 8, png.byteLength, true); // size of image data
    ico.setUint32(entry + 12, offset, true); // offset of image data

    new Uint8Array(ico.buffer).set(new Uint8Array(png), offset);
    offset += png.byteLength;
  }

  return new Blob([ico.buffer], { type: 'image/x-icon' });
}
