import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  isMeteredConnection,
  getNetworkStatus,
  isEngineCached,
  clearEngineCache,
  loadEngineAssets,
  fetchWithMirrors,
  computeSha256,
  FFMPEG_CORE_VERSION,
  FFMPEG_MIRROR_URLS,
  FFMPEG_CORE_HASHES,
  ASSET_SIZES,
  type AssetProgress,
} from '../../engines/ffmpeg/assets';

describe('FFmpeg asset loader & network utilities', () => {
  const originalNavigator = globalThis.navigator;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    Object.defineProperty(globalThis, 'navigator', {
      value: originalNavigator,
      configurable: true,
      writable: true,
    });
  });

  it('exposes pinned version and mirror constants', () => {
    expect(FFMPEG_CORE_VERSION).toBe('0.12.10');
    expect(FFMPEG_MIRROR_URLS.length).toBeGreaterThanOrEqual(2);
    expect(FFMPEG_MIRROR_URLS[0]).toContain('unpkg.com');
    expect(FFMPEG_MIRROR_URLS[1]).toContain('jsdelivr.net');
    expect(ASSET_SIZES.wasm).toBeGreaterThan(25 * 1024 * 1024); // Exceeds Cloudflare Pages 25MB limit
  });

  it('detects metered connection when saveData is enabled', () => {
    Object.defineProperty(globalThis, 'navigator', {
      value: {
        connection: { saveData: true, type: 'wifi', effectiveType: '4g' },
        onLine: true,
      },
      configurable: true,
      writable: true,
    });

    expect(isMeteredConnection()).toBe(true);
    const status = getNetworkStatus();
    expect(status.saveData).toBe(true);
    expect(status.isMetered).toBe(true);
    expect(status.isOnline).toBe(true);
  });

  it('detects metered connection on cellular networks', () => {
    Object.defineProperty(globalThis, 'navigator', {
      value: {
        connection: { saveData: false, type: 'cellular', effectiveType: '4g' },
        onLine: true,
      },
      configurable: true,
      writable: true,
    });

    expect(isMeteredConnection()).toBe(true);
  });

  it('detects unmetered broadband connection', () => {
    Object.defineProperty(globalThis, 'navigator', {
      value: {
        connection: { saveData: false, type: 'wifi', effectiveType: '4g' },
        onLine: true,
      },
      configurable: true,
      writable: true,
    });

    expect(isMeteredConnection()).toBe(false);
  });

  it('fails fast when offline and assets are not cached', async () => {
    Object.defineProperty(globalThis, 'navigator', {
      value: { onLine: false },
      configurable: true,
      writable: true,
    });

    const progressLogs: AssetProgress[] = [];
    await expect(
      loadEngineAssets((p) => progressLogs.push(p)),
    ).rejects.toMatchObject({
      code: 'ENGINE_LOAD_FAILED',
    });
  });

  it('pauses and throws when allowMetered is false on metered connection', async () => {
    Object.defineProperty(globalThis, 'navigator', {
      value: {
        connection: { saveData: true },
        onLine: true,
      },
      configurable: true,
      writable: true,
    });

    await expect(
      loadEngineAssets(() => {}, { allowMetered: false }),
    ).rejects.toMatchObject({
      code: 'ENGINE_LOAD_FAILED',
      detail: expect.stringContaining('metered connection'),
    });
  });

  it('loads successfully from cache mock without network requests', async () => {
    const mockCoreBuf = new ArrayBuffer(1024);
    const mockWasmBuf = new ArrayBuffer(2048);

    const mockCache = {
      match: vi.fn().mockImplementation((key: string) => {
        if (key.includes('.js')) return Promise.resolve(new Response(mockCoreBuf));
        if (key.includes('.wasm')) return Promise.resolve(new Response(mockWasmBuf));
        return Promise.resolve(null);
      }),
      put: vi.fn().mockResolvedValue(undefined),
    };

    const mockCaches = {
      open: vi.fn().mockResolvedValue(mockCache),
      delete: vi.fn().mockResolvedValue(true),
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (globalThis as any).caches = mockCaches;

    const progress: AssetProgress[] = [];
    const urls = await loadEngineAssets((p) => progress.push(p));

    expect(urls.coreURL).toBeDefined();
    expect(urls.wasmURL).toBeDefined();
    expect(progress.some((p) => p.fraction === 1)).toBe(true);

    const isCached = await isEngineCached();
    expect(isCached).toBe(true);

    await clearEngineCache();
    expect(mockCaches.delete).toHaveBeenCalled();

    // Clean up global mock
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (globalThis as any).caches;
  });

  describe('SHA-256 integrity verification', () => {
    it('defines valid 64-character SHA-256 integrity hashes for both core files', () => {
      expect(FFMPEG_CORE_HASHES['ffmpeg-core.js']).toMatch(/^[0-9a-f]{64}$/);
      expect(FFMPEG_CORE_HASHES['ffmpeg-core.wasm']).toMatch(/^[0-9a-f]{64}$/);
    });

    it('computes correct SHA-256 hex digest using Web Crypto API', async () => {
      const data = new TextEncoder().encode('hello world');
      const hash = await computeSha256(data.buffer);
      // SHA-256 of "hello world"
      expect(hash).toBe('b94d27b9934d3e08a52e52d7da7dabfac484efe37a5380ee9088f7ace2efcde9');
    });

    it('discards corrupt download on checksum mismatch and falls back to next mirror', async () => {
      const corruptBuf = new TextEncoder().encode('corrupt payload').buffer;
      const validData = new TextEncoder().encode('valid payload');
      const validHash = await computeSha256(validData.buffer);

      // Temporarily override hash in module
      const originalHash = FFMPEG_CORE_HASHES['ffmpeg-core.js'];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (FFMPEG_CORE_HASHES as any)['ffmpeg-core.js'] = validHash;

      const originalFetch = globalThis.fetch;
      let attempt = 0;
      globalThis.fetch = vi.fn().mockImplementation(() => {
        attempt++;
        if (attempt === 1) {
          // Mirror 1 serves corrupt binary
          return Promise.resolve(new Response(corruptBuf, { status: 200 }));
        }
        // Mirror 2 serves verified binary
        return Promise.resolve(new Response(validData.buffer, { status: 200 }));
      });

      try {
        const res = await fetchWithMirrors('ffmpeg-core.js', () => {});
        expect(attempt).toBe(2);
        expect(res.byteLength).toBe(validData.byteLength);
      } finally {
        globalThis.fetch = originalFetch;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (FFMPEG_CORE_HASHES as any)['ffmpeg-core.js'] = originalHash;
      }
    });

    it('throws when all mirrors fail integrity checks', async () => {
      const originalFetch = globalThis.fetch;
      globalThis.fetch = vi.fn().mockImplementation(() =>
        Promise.resolve(new Response(new TextEncoder().encode('corrupt payload').buffer, { status: 200 })),
      );

      try {
        await expect(
          fetchWithMirrors('ffmpeg-core.js', () => {}),
        ).rejects.toThrow(/Failed to download.*all mirrors/i);
      } finally {
        globalThis.fetch = originalFetch;
      }
    });
  });
});

