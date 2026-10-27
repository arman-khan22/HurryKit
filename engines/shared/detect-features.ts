/**
 * Browser feature detection.
 * Checked once at startup; results cached.
 */

export type FeatureReport = {
  webWorker: boolean;
  webAssembly: boolean;
  offscreenCanvas: boolean;
  sharedArrayBuffer: boolean;
  /** Whether the browser can *encode* WebP via canvas.toBlob */
  canvasWebpEncode: boolean;
  /** Whether the browser can decode AVIF natively */
  nativeAvifDecode: boolean;
  screenWakeLock: boolean;
  fileSystemAccess: boolean;
  webShare: boolean;
};

let cached: FeatureReport | undefined;

export function getFeatures(): FeatureReport {
  if (cached) return cached;

  cached = {
    webWorker: typeof Worker !== 'undefined',
    webAssembly: typeof WebAssembly !== 'undefined',
    offscreenCanvas: typeof OffscreenCanvas !== 'undefined',
    sharedArrayBuffer: typeof SharedArrayBuffer !== 'undefined',
    canvasWebpEncode: false, // will be set asynchronously
    nativeAvifDecode: false, // will be set asynchronously
    screenWakeLock: 'wakeLock' in navigator,
    fileSystemAccess: 'showSaveFilePicker' in window,
    webShare: 'share' in navigator,
  };

  return cached;
}

/** Detect WebP *encoding* support (async — needs a canvas round-trip) */
export async function detectWebpEncode(): Promise<boolean> {
  if (typeof document === 'undefined') return false;
  const canvas = document.createElement('canvas');
  canvas.width = 1;
  canvas.height = 1;
  const dataUrl = canvas.toDataURL('image/webp');
  const supported = dataUrl.startsWith('data:image/webp');
  if (cached) cached.canvasWebpEncode = supported;
  return supported;
}

/** Detect native AVIF decode support (async — needs a tiny AVIF image) */
export async function detectNativeAvifDecode(): Promise<boolean> {
  // 1×1 AVIF (minimal valid file)
  const AVIF_PROBE =
    'data:image/avif;base64,AAAAIGZ0eXBhdmlmAAAAAGF2aWZtaWYxbWlhZk1BMUEAAADybWV0YQAAAAAAAAAoaGRscgAAAAAAAAAAcGljdAAAAAAAAAAAAAAAAGxpYmF2aWYAAAAADnBpdG0AAAAAAAEAAAAeaWxvYwAAAABEAAABAAEAAAABAAAADwAAABQAAAAoaWluZgAAAAAAAQAAABppbmZlAgAAAAABAABhdjAxQ29sb3IAAAAAamlwcnAAAABLaXBjbwAAABRpc3BlAAAAAAAAAAEAAAABAAAAEHBhc3AAAAAAAAAAAAAAAA9jb2xybm5jbHgAAAACAAAABAAFBAAAAAAXaXBtYQAAAAAAAAABAAEEAQKDBAAAAAAgbWRhdA==';
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const ok = img.width > 0;
      if (cached) cached.nativeAvifDecode = ok;
      resolve(ok);
    };
    img.onerror = () => resolve(false);
    img.src = AVIF_PROBE;
  });
}

/** Returns true if the minimum requirements for any tool are met */
export function meetsMinimumRequirements(): boolean {
  const f = getFeatures();
  return f.webWorker && f.webAssembly;
}

/** Detect if running inside an in-app browser (Instagram, WhatsApp, Facebook) */
export function isInAppBrowser(): boolean {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent;
  return (
    ua.includes('Instagram') ||
    ua.includes('FBAN') ||
    ua.includes('FBAV') ||
    ua.includes('WhatsApp') ||
    ua.includes('LinkedInApp') ||
    ua.includes('Line/')
  );
}
