/**
 * Browser environment and capability detection.
 * Handles Edge Cases:
 *  - 43: Browser lacks Web Worker, WebAssembly, or required APIs (UNSUPPORTED_BROWSER).
 *  - 44: In-app browsers (Instagram, Facebook, WhatsApp, TikTok) that restrict downloads.
 *  - 45: Private mode with blocked Cache/IndexedDB.
 *  - 52: Metered or slow data saver connection.
 */

export interface BrowserSupportResult {
  supported: boolean;
  missingFeatures: string[];
}

/** Check if the current environment supports modern in-browser conversion */
export function isBrowserSupported(): BrowserSupportResult {
  if (typeof window === 'undefined') {
    return { supported: true, missingFeatures: [] };
  }

  const missing: string[] = [];

  if (typeof Worker === 'undefined') missing.push('Web Workers');
  if (typeof WebAssembly === 'undefined') missing.push('WebAssembly');
  if (typeof Blob === 'undefined') missing.push('Blob API');
  if (typeof URL === 'undefined' || typeof URL.createObjectURL !== 'function') {
    missing.push('URL.createObjectURL');
  }

  return {
    supported: missing.length === 0,
    missingFeatures: missing,
  };
}

/**
 * Detect in-app webviews (Instagram, Facebook, WhatsApp, TikTok, WeChat, Messenger).
 * These browsers often block file downloads or synthetic clicks.
 */
export function detectInAppBrowser(): boolean {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent || navigator.vendor || '';

  return (
    /FBAN|FBAV|Instagram|WhatsApp|TikTok|musical_ly|Snapchat|Line\/|MicroMessenger|musical_ly|Baidu/i.test(
      ua,
    )
  );
}

/**
 * Check if the user is on a metered connection or has enabled Data Saver.
 */
export function isMeteredConnection(): boolean {
  if (typeof navigator === 'undefined') return false;

  interface NetworkInformation {
    saveData?: boolean;
    effectiveType?: string;
  }

  const conn = (navigator as unknown as { connection?: NetworkInformation }).connection;
  if (!conn) return false;

  if (conn.saveData === true) return true;
  if (conn.effectiveType === 'slow-2g' || conn.effectiveType === '2g') return true;

  return false;
}

/**
 * Check if client-side storage (Cache API or IndexedDB) is restricted (e.g. strict private mode).
 */
export async function isStorageRestricted(): Promise<boolean> {
  if (typeof window === 'undefined') return false;

  try {
    if ('caches' in window) {
      const testCache = await caches.open('hurrykit-test-storage');
      await caches.delete('hurrykit-test-storage');
      return false;
    }
    return false;
  } catch {
    return true;
  }
}

/**
 * Recommend an alternate tool or department when the wrong file type is uploaded (Case 14).
 */
export function getRecommendedToolForFormat(
  detectedFormatId: string,
): { title: string; href: string } | null {
  const norm = detectedFormatId.toLowerCase();

  const videoFormats = ['mp4', 'mov', 'mkv', 'avi', 'webm', 'wmv', 'flv', '3gp', 'm4v'];
  const audioFormats = ['mp3', 'wav', 'aac', 'm4a', 'flac', 'ogg', 'opus', 'wma', 'amr', 'aiff'];
  const imageFormats = ['jpg', 'jpeg', 'png', 'webp', 'heic', 'heif', 'avif', 'gif', 'bmp', 'tiff', 'svg', 'ico'];

  if (videoFormats.includes(norm)) {
    return {
      title: 'Video Converter Hub',
      href: '/video-converter',
    };
  }

  if (audioFormats.includes(norm)) {
    return {
      title: 'Audio Converter Hub',
      href: '/audio-converter',
    };
  }

  if (imageFormats.includes(norm)) {
    return {
      title: 'Image Converter Hub',
      href: '/image-converter',
    };
  }

  return null;
}
