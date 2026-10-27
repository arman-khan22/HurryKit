/**
 * Format detection from magic bytes.
 * Never trusts the file extension alone — always validates against file content.
 */

export type DetectedFormat = {
  id: string;
  confident: boolean; // false = fell back to extension
};

const ascii = (b: Uint8Array, start: number, end: number): string => {
  let str = '';
  const max = Math.min(b.length, end);
  for (let i = start; i < max; i++) {
    const code = b[i];
    if (code !== undefined) {
      str += String.fromCharCode(code);
    }
  }
  return str;
};

/**
 * Extracts the file extension (lowercased without dot) from a filename.
 */
export function extractExtension(filename?: string): string | null {
  if (!filename) return null;
  const lastDot = filename.lastIndexOf('.');
  if (lastDot <= 0 || lastDot === filename.length - 1) return null;
  return filename.slice(lastDot + 1).trim().toLowerCase();
}

/**
 * Detect the real format of a file from its first 64 bytes.
 * Accepts a File, Blob, or Uint8Array.
 * Returns null if the format is completely unknown or the file is zero bytes.
 */
export async function detectFormat(
  input: File | Blob | Uint8Array,
  hintFilename?: string,
): Promise<DetectedFormat | null> {
  let b: Uint8Array;
  let filename = hintFilename ?? (input instanceof File ? input.name : undefined);

  if (input instanceof Uint8Array) {
    if (input.length === 0) return null;
    b = input.subarray(0, 64);
  } else {
    if (input.size === 0) return null;
    if (typeof (input as unknown as { bytes?: () => Promise<Uint8Array> }).bytes === 'function') {
      try {
        const full = await (input as unknown as { bytes: () => Promise<Uint8Array> }).bytes();
        b = full.subarray(0, 64);
      } catch {
        const buf = await input.slice(0, 64).arrayBuffer();
        b = new Uint8Array(buf);
      }
    } else {
      let buf: ArrayBuffer;
      try {
        buf = await input.slice(0, 64).arrayBuffer();
      } catch {
        buf = (await input.arrayBuffer()).slice(0, 64);
      }
      b = new Uint8Array(buf);
    }
  }

  const ext = extractExtension(filename);

  // 1. JPEG / JFIF (FF D8 FF)
  if (b.length >= 2 && b[0] === 0xff && b[1] === 0xd8) {
    if (b.length >= 10 && b[6] === 0x4a && b[7] === 0x46 && b[8] === 0x49 && b[9] === 0x46) {
      return { id: ext === 'jfif' ? 'jfif' : 'jpg', confident: true };
    }
    return { id: 'jpg', confident: true };
  }

  // 2. PNG (89 50 4E 47 0D 0A 1A 0A)
  if (
    b.length >= 8 &&
    b[0] === 0x89 &&
    b[1] === 0x50 &&
    b[2] === 0x4e &&
    b[3] === 0x47 &&
    b[4] === 0x0d &&
    b[5] === 0x0a &&
    b[6] === 0x1a &&
    b[7] === 0x0a
  ) {
    return { id: 'png', confident: true };
  }

  // 3. WebP (RIFF .... WEBP)
  if (b.length >= 12 && ascii(b, 0, 4) === 'RIFF' && ascii(b, 8, 12) === 'WEBP') {
    return { id: 'webp', confident: true };
  }

  // 4. GIF (GIF87a or GIF89a)
  if (b.length >= 6 && ascii(b, 0, 3) === 'GIF') {
    return { id: 'gif', confident: true };
  }

  // 5. BMP (BM)
  if (b.length >= 2 && b[0] === 0x42 && b[1] === 0x4d) {
    return { id: 'bmp', confident: true };
  }

  // 6. TIFF (II*\0 or MM\0*)
  if (
    b.length >= 4 &&
    ((b[0] === 0x49 && b[1] === 0x49 && b[2] === 0x2a && b[3] === 0x00) ||
      (b[0] === 0x4d && b[1] === 0x4d && b[2] === 0x00 && b[3] === 0x2a))
  ) {
    return { id: 'tiff', confident: true };
  }

  // 7. ICO (00 00 01 00)
  if (b.length >= 4 && b[0] === 0x00 && b[1] === 0x00 && b[2] === 0x01 && b[3] === 0x00) {
    return { id: 'ico', confident: true };
  }

  // 8. SVG (check for XML or SVG opening tags)
  if (b.length >= 4) {
    const head = ascii(b, 0, 32).trim().toLowerCase();
    if (
      head.startsWith('<?xml') ||
      head.startsWith('<svg') ||
      head.startsWith('<!doctype svg')
    ) {
      return { id: 'svg', confident: true };
    }
  }

  // 9. ISO Base Media / ftyp box (HEIC, AVIF, MP4, MOV, M4A, 3GP)
  if (b.length >= 12 && ascii(b, 4, 8) === 'ftyp') {
    const brand = ascii(b, 8, 12);
    const compat = b.length >= 20 ? ascii(b, 16, 20) : '';

    if (['heic', 'heix', 'mif1', 'msf1', 'hevc', 'hevx'].includes(brand)) {
      return { id: 'heic', confident: true };
    }
    if (brand === 'avif' || compat === 'avif') {
      return { id: 'avif', confident: true };
    }
    if (brand === 'qt  ') {
      return { id: 'mov', confident: true };
    }
    if (brand === 'M4A ' || brand === 'M4B ') {
      return { id: 'm4a', confident: true };
    }
    if (brand === 'M4V ' || brand === 'M4VH' || brand === 'M4VP') {
      return { id: 'm4v', confident: true };
    }
    if (brand.startsWith('3g')) {
      return { id: '3gp', confident: true };
    }
    return { id: 'mp4', confident: true };
  }

  // 10. Matroska MKV / WebM (EBML 1A 45 DF A3)
  if (b.length >= 4 && b[0] === 0x1a && b[1] === 0x45 && b[2] === 0xdf && b[3] === 0xa3) {
    const sliceStr = ascii(b, 4, 48).toLowerCase();
    if (sliceStr.includes('webm')) {
      return { id: 'webm', confident: true };
    }
    return { id: 'mkv', confident: true };
  }

  // 11. AVI (RIFF .... AVI )
  if (b.length >= 12 && ascii(b, 0, 4) === 'RIFF' && ascii(b, 8, 12) === 'AVI ') {
    return { id: 'avi', confident: true };
  }

  // 12. WAV (RIFF .... WAVE)
  if (b.length >= 12 && ascii(b, 0, 4) === 'RIFF' && ascii(b, 8, 12) === 'WAVE') {
    return { id: 'wav', confident: true };
  }

  // 13. FLAC (fLaC)
  if (b.length >= 4 && ascii(b, 0, 4) === 'fLaC') {
    return { id: 'flac', confident: true };
  }

  // 14. OGG / OPUS / Vorbis (OggS)
  if (b.length >= 4 && ascii(b, 0, 4) === 'OggS') {
    const oggBody = ascii(b, 20, 48);
    if (oggBody.includes('OpusHead') || oggBody.includes('Opus')) {
      return { id: 'opus', confident: true };
    }
    return { id: 'ogg', confident: true };
  }

  // 15. MP3 (ID3v1/ID3v2 header or MPEG audio frame sync)
  if (
    (b.length >= 3 && ascii(b, 0, 3) === 'ID3') ||
    (b.length >= 2 && b[0] === 0xff && (b[1]! & 0xe0) === 0xe0 && (b[1]! & 0x18) !== 0x08)
  ) {
    return { id: 'mp3', confident: true };
  }

  // 16. AIFF (FORM .... AIFF / AIFC)
  if (
    b.length >= 12 &&
    ascii(b, 0, 4) === 'FORM' &&
    (ascii(b, 8, 12) === 'AIFF' || ascii(b, 8, 12) === 'AIFC')
  ) {
    return { id: 'aiff', confident: true };
  }

  // 17. WMV / WMA (ASF GUID header 30 26 B2 75 8E 66)
  if (
    b.length >= 6 &&
    b[0] === 0x30 &&
    b[1] === 0x26 &&
    b[2] === 0xb2 &&
    b[3] === 0x75 &&
    b[4] === 0x8e &&
    b[5] === 0x66
  ) {
    return { id: ext === 'wma' ? 'wma' : 'wmv', confident: true };
  }

  // 18. FLV
  if (b.length >= 3 && b[0] === 0x46 && b[1] === 0x4c && b[2] === 0x56) {
    return { id: 'flv', confident: true };
  }

  // 19. AMR
  if (b.length >= 6 && (ascii(b, 0, 6) === '#!AMR\n' || ascii(b, 0, 8) === '#!AMR-WB')) {
    return { id: 'amr', confident: true };
  }

  // 20. Fallback: Extension hint (never completely trusted, confident: false)
  if (ext) {
    return { id: ext, confident: false };
  }

  return null;
}
