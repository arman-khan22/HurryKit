/**
 * FFmpeg asset loader — handles on-demand loading, two-tier caching
 * (Cache Storage + IndexedDB fallback), CDN mirror fallbacks, metered
 * connection detection, and streaming download progress.
 */
import { makeJobError } from '../types';

export const FFMPEG_CORE_VERSION =
  process.env.NEXT_PUBLIC_FFMPEG_VERSION ?? '0.12.10';

export const FFMPEG_PRIMARY_BASE_URL =
  process.env.NEXT_PUBLIC_FFMPEG_BASE_URL ??
  `https://unpkg.com/@ffmpeg/core@${FFMPEG_CORE_VERSION}/dist/esm`;

export const FFMPEG_MIRROR_URLS = [
  `https://unpkg.com/@ffmpeg/core@${FFMPEG_CORE_VERSION}/dist/esm`,
  `https://cdn.jsdelivr.net/npm/@ffmpeg/core@${FFMPEG_CORE_VERSION}/dist/esm`,
] as const;

/** Pinned SHA-256 integrity checksums for FFmpeg core binaries */
export const FFMPEG_CORE_HASHES = {
  'ffmpeg-core.js':
    process.env.NEXT_PUBLIC_FFMPEG_CORE_JS_SHA256 ??
    '67a48f11645f85439f3fde4f2119042c16b374b910206b7a7a24f342e28dcae3',
  'ffmpeg-core.wasm':
    process.env.NEXT_PUBLIC_FFMPEG_CORE_WASM_SHA256 ??
    '9f57947a5bd530d8f00c5b3f2cb2a3492faa7e5d823315342d6a8656d0a6b7b7',
} as const;

/** Known file sizes for progress scaling (uncompressed / wire estimates) */
export const ASSET_SIZES = {
  js: 111_804, // ~112 KB (ESM core wrapper)
  wasm: 32_232_419, // ~32.2 MB (WASM core binary)
  total: 32_344_223,
} as const;

export const CACHE_NAME = `hurrykit-ffmpeg-v${FFMPEG_CORE_VERSION}`;
const IDB_NAME = 'hurrykit-ffmpeg-cache';
const IDB_STORE = 'binaries';

export type AssetUrls = {
  coreURL: string;
  wasmURL: string;
};

export interface AssetProgress {
  stage: 'loading-engine';
  fraction: number;
  message: string;
  bytesReceived?: number | undefined;
  bytesTotal?: number | undefined;
}

export interface AssetLoadOptions {
  bypassCache?: boolean | undefined;
  allowMetered?: boolean | undefined;
  verifyIntegrity?: boolean | undefined;
  verifyCacheIntegrity?: boolean | undefined;
}

/**
 * Compute the SHA-256 hex digest of an ArrayBuffer.
 * Uses Web Crypto API (SubtleCrypto) in browser and modern Node environments.
 */
export async function computeSha256(buffer: ArrayBuffer): Promise<string> {
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    const hashBuf = await crypto.subtle.digest('SHA-256', buffer);
    const hashArray = Array.from(new Uint8Array(hashBuf));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  }
  return '';
}

// ─── Metered Connection & Network Status ──────────────────────────────────────

interface NetworkInformation {
  saveData?: boolean;
  effectiveType?: string;
  type?: string;
}

/** Check if current browser connection is metered or on data-saver mode */
export function isMeteredConnection(): boolean {
  if (typeof navigator === 'undefined') return false;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const nav = navigator as any;
  const conn: NetworkInformation | undefined =
    nav.connection || nav.mozConnection || nav.webkitConnection;

  if (!conn) return false;
  if (conn.saveData === true) return true;
  if (conn.type === 'cellular') return true;
  if (conn.effectiveType === 'slow-2g' || conn.effectiveType === '2g') return true;

  return false;
}

/** Get network connectivity details */
export function getNetworkStatus(): {
  isOnline: boolean;
  isMetered: boolean;
  saveData: boolean;
  effectiveType?: string | undefined;
} {
  const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const nav = typeof navigator !== 'undefined' ? (navigator as any) : null;
  const conn: NetworkInformation | undefined =
    nav?.connection || nav?.mozConnection || nav?.webkitConnection;

  return {
    isOnline,
    isMetered: isMeteredConnection(),
    saveData: Boolean(conn?.saveData),
    effectiveType: conn?.effectiveType,
  };
}

// ─── IndexedDB Fallback Cache ─────────────────────────────────────────────────

function openIdb(): Promise<IDBDatabase | null> {
  if (typeof indexedDB === 'undefined') return Promise.resolve(null);
  return new Promise((resolve) => {
    try {
      const request = indexedDB.open(IDB_NAME, 1);
      request.onupgradeneeded = () => {
        if (!request.result.objectStoreNames.contains(IDB_STORE)) {
          request.result.createObjectStore(IDB_STORE);
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

async function getIdbItem(key: string): Promise<ArrayBuffer | null> {
  const db = await openIdb();
  if (!db) return null;
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(IDB_STORE, 'readonly');
      const store = tx.objectStore(IDB_STORE);
      const req = store.get(key);
      req.onsuccess = () => resolve((req.result as ArrayBuffer) || null);
      req.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

async function setIdbItem(key: string, value: ArrayBuffer): Promise<void> {
  const db = await openIdb();
  if (!db) return;
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(IDB_STORE, 'readwrite');
      const store = tx.objectStore(IDB_STORE);
      store.put(value, key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    } catch {
      resolve();
    }
  });
}

// ─── Cache Storage Helpers ───────────────────────────────────────────────────

async function getFromCache(cache: Cache | null, url: string): Promise<ArrayBuffer | null> {
  if (cache) {
    try {
      const resp = await cache.match(url);
      if (resp && resp.ok) return await resp.arrayBuffer();
    } catch {
      // Cache read failed — fall through
    }
  }

  // Fallback to IndexedDB
  return await getIdbItem(url);
}

async function saveToCache(
  cache: Cache | null,
  url: string,
  buffer: ArrayBuffer,
  mime: string,
): Promise<void> {
  if (cache) {
    try {
      await cache.put(
        url,
        new Response(buffer.slice(0), {
          headers: {
            'content-type': mime,
            'cache-control': 'public, max-age=31536000, immutable',
          },
        }),
      );
    } catch {
      // Non-fatal if Cache Storage fails
    }
  }

  // Also save to IndexedDB as durable fallback
  await setIdbItem(url, buffer.slice(0));
}

// ─── Streaming Fetch with Progress ────────────────────────────────────────────

async function fetchWithProgress(
  url: string,
  onProgress: (received: number, total: number) => void,
): Promise<ArrayBuffer> {
  const response = await fetch(url, { mode: 'cors' });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status} ${response.statusText} for ${url}`);
  }

  const contentLength = response.headers.get('content-length');
  const total = contentLength ? parseInt(contentLength, 10) : 0;

  if (!response.body) {
    const buf = await response.arrayBuffer();
    onProgress(buf.byteLength, total || buf.byteLength);
    return buf;
  }

  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let received = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (value) {
      chunks.push(value);
      received += value.byteLength;
      onProgress(received, total || Math.max(received, total));
    }
  }

  // Flatten chunks into a single ArrayBuffer
  const totalLength = chunks.reduce((acc, c) => acc + c.byteLength, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;
  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.byteLength;
  }

  onProgress(totalLength, totalLength);
  return result.buffer;
}

// ─── Multi-Mirror Downloader ──────────────────────────────────────────────────

/**
 * Download a binary file trying the primary URL first, followed by mirror fallbacks.
 * Verifies SHA-256 integrity after download before writing to cache or returning.
 * Discards corrupt/tampered files and falls back to the next mirror.
 */
export async function fetchWithMirrors(
  fileName: 'ffmpeg-core.js' | 'ffmpeg-core.wasm',
  onProgress: (received: number, total: number) => void,
  options?: { verifyIntegrity?: boolean | undefined },
): Promise<ArrayBuffer> {
  const urls = [
    `${FFMPEG_PRIMARY_BASE_URL}/${FFMPEG_CORE_VERSION}/${fileName}`,
    ...FFMPEG_MIRROR_URLS.map((mirror) => `${mirror}/${fileName}`),
  ];

  let lastError: Error | null = null;

  for (const url of urls) {
    try {
      let buffer: ArrayBuffer | null = await fetchWithProgress(url, onProgress);

      // Verify SHA-256 checksum unless explicitly bypassed
      if (options?.verifyIntegrity !== false) {
        const expectedHash = FFMPEG_CORE_HASHES[fileName];
        if (expectedHash) {
          const actualHash = await computeSha256(buffer);
          if (actualHash && actualHash.toLowerCase() !== expectedHash.toLowerCase()) {
            buffer = null; // Explicitly discard corrupt buffer for GC
            throw new Error(
              `Integrity verification failed for ${fileName} from ${url} (checksum mismatch: expected ${expectedHash}, got ${actualHash})`,
            );
          }
        }
      }

      return buffer;
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      // Log warning and continue to next mirror fallback
      console.warn(`[Hurrykit FFmpeg] Mirror failed (${url}): ${lastError.message}. Trying next mirror...`);
    }
  }

  throw new Error(
    `Failed to download ${fileName} from all mirrors (primary + ${FFMPEG_MIRROR_URLS.length} fallbacks). Last error: ${lastError?.message}`,
  );
}

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * Check whether the FFmpeg core files are already cached locally.
 */
export async function isEngineCached(): Promise<boolean> {
  const cacheKeyCore = `ffmpeg-core-${FFMPEG_CORE_VERSION}.js`;
  const cacheKeyWasm = `ffmpeg-core-${FFMPEG_CORE_VERSION}.wasm`;

  try {
    if (typeof caches !== 'undefined') {
      const cache = await caches.open(CACHE_NAME);
      const matchCore = await cache.match(cacheKeyCore);
      const matchWasm = await cache.match(cacheKeyWasm);
      if (matchCore && matchWasm) return true;
    }
  } catch {
    // Proceed to check IDB
  }

  const idbCore = await getIdbItem(cacheKeyCore);
  const idbWasm = await getIdbItem(cacheKeyWasm);
  return Boolean(idbCore && idbWasm);
}

/**
 * Clear cached FFmpeg assets from both Cache Storage and IndexedDB.
 */
export async function clearEngineCache(): Promise<void> {
  try {
    if (typeof caches !== 'undefined') {
      await caches.delete(CACHE_NAME);
    }
  } catch {
    // Non-fatal
  }

  try {
    if (typeof indexedDB !== 'undefined') {
      indexedDB.deleteDatabase(IDB_NAME);
    }
  } catch {
    // Non-fatal
  }
}

/**
 * Load the FFmpeg engine assets on demand.
 * - Checks Cache Storage and IndexedDB first.
 * - Streams download with progress reporting.
 * - Verifies SHA-256 integrity before caching.
 * - Falls back to unpkg/jsdelivr mirrors on error.
 * - Caches downloads for instant repeat visits.
 * - Provides blob URLs for @ffmpeg/ffmpeg.
 */
export async function loadEngineAssets(
  onProgress: (p: AssetProgress) => void,
  options?: AssetLoadOptions,
): Promise<AssetUrls> {
  const netStatus = getNetworkStatus();

  // If offline and not cached, fail fast with a friendly message
  if (!netStatus.isOnline) {
    const cached = await isEngineCached();
    if (!cached) {
      throw makeJobError(
        'ENGINE_LOAD_FAILED',
        'You appear to be offline and the converter is not yet cached. Please connect to the internet once to download it.',
        true,
      );
    }
  }

  // Check metered connection warning requirement
  if (options?.allowMetered === false && isMeteredConnection()) {
    throw makeJobError(
      'ENGINE_LOAD_FAILED',
      'Download paused because a metered connection or Data Saver was detected (~31 MB required). Please confirm to proceed.',
      true,
    );
  }

  let cache: Cache | null = null;
  if (!options?.bypassCache && typeof caches !== 'undefined') {
    try {
      cache = await caches.open(CACHE_NAME);
    } catch {
      cache = null;
    }
  }

  const cacheKeyCore = `ffmpeg-core-${FFMPEG_CORE_VERSION}.js`;
  const cacheKeyWasm = `ffmpeg-core-${FFMPEG_CORE_VERSION}.wasm`;

  let coreBuffer: ArrayBuffer | null = null;
  let wasmBuffer: ArrayBuffer | null = null;

  // 1. Check cache first
  if (!options?.bypassCache) {
    coreBuffer = await getFromCache(cache, cacheKeyCore);
    wasmBuffer = await getFromCache(cache, cacheKeyWasm);

    if (coreBuffer && wasmBuffer) {
      if (options?.verifyCacheIntegrity) {
        const coreHash = await computeSha256(coreBuffer);
        const wasmHash = await computeSha256(wasmBuffer);
        if (
          coreHash.toLowerCase() !== FFMPEG_CORE_HASHES['ffmpeg-core.js'].toLowerCase() ||
          wasmHash.toLowerCase() !== FFMPEG_CORE_HASHES['ffmpeg-core.wasm'].toLowerCase()
        ) {
          coreBuffer = null;
          wasmBuffer = null;
          await clearEngineCache();
        }
      }
    }

    if (coreBuffer && wasmBuffer) {
      onProgress({
        stage: 'loading-engine',
        fraction: 1,
        message: 'Loaded converter from local cache',
        bytesReceived: coreBuffer.byteLength + wasmBuffer.byteLength,
        bytesTotal: coreBuffer.byteLength + wasmBuffer.byteLength,
      });

      const coreBlob = new Blob([coreBuffer], { type: 'application/javascript' });
      const wasmBlob = new Blob([wasmBuffer], { type: 'application/wasm' });
      return {
        coreURL: URL.createObjectURL(coreBlob),
        wasmURL: URL.createObjectURL(wasmBlob),
      };
    }
  }

  // 2. Download files with weighted streaming progress
  let coreBytes = 0;
  let wasmBytes = 0;

  const emitProgress = () => {
    const totalReceived = coreBytes + wasmBytes;
    const fraction = Math.min(0.98, totalReceived / ASSET_SIZES.total);
    const percent = Math.round(fraction * 100);
    onProgress({
      stage: 'loading-engine',
      fraction,
      message: `Loading converter (first time only)… ${percent}%`,
      bytesReceived: totalReceived,
      bytesTotal: ASSET_SIZES.total,
    });
  };

  try {
    // Load JS core wrapper (~112 KB)
    if (!coreBuffer) {
      coreBuffer = await fetchWithMirrors(
        'ffmpeg-core.js',
        (received) => {
          coreBytes = received;
          emitProgress();
        },
        { verifyIntegrity: options?.verifyIntegrity },
      );
      await saveToCache(cache, cacheKeyCore, coreBuffer, 'application/javascript');
    }

    // Load WASM core (~32 MB)
    if (!wasmBuffer) {
      wasmBuffer = await fetchWithMirrors(
        'ffmpeg-core.wasm',
        (received) => {
          wasmBytes = received;
          emitProgress();
        },
        { verifyIntegrity: options?.verifyIntegrity },
      );
      await saveToCache(cache, cacheKeyWasm, wasmBuffer, 'application/wasm');
    }

    onProgress({
      stage: 'loading-engine',
      fraction: 1,
      message: 'Converter engine ready',
      bytesReceived: ASSET_SIZES.total,
      bytesTotal: ASSET_SIZES.total,
    });

    const coreBlob = new Blob([coreBuffer], { type: 'application/javascript' });
    const wasmBlob = new Blob([wasmBuffer], { type: 'application/wasm' });

    return {
      coreURL: URL.createObjectURL(coreBlob),
      wasmURL: URL.createObjectURL(wasmBlob),
    };
  } catch (err) {
    throw makeJobError(
      'ENGINE_LOAD_FAILED',
      `Failed to load FFmpeg WebAssembly engine: ${err instanceof Error ? err.message : String(err)}`,
      true,
    );
  }
}

/**
 * Revoke blob URLs created by loadEngineAssets to free memory.
 */
export function revokeAssetUrls(urls: AssetUrls | null | undefined): void {
  if (!urls) return;
  try {
    if (typeof URL !== 'undefined' && URL.revokeObjectURL) {
      URL.revokeObjectURL(urls.coreURL);
      URL.revokeObjectURL(urls.wasmURL);
    }
  } catch {
    // Non-fatal
  }
}
