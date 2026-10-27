/**
 * Engine factory — returns singletons, created on demand.
 * The UI never imports engines directly; it always goes through getEngine().
 */
import type { Engine } from './types';

const cache = new Map<string, Engine>();

/**
 * Get (or lazily create) an engine singleton.
 * Engine code is dynamically imported to ensure it never lands in the shared bundle.
 */
export async function getEngine(id: 'image' | 'ffmpeg'): Promise<Engine> {
  const existing = cache.get(id);
  if (existing) return existing;

  let engine: Engine;

  if (id === 'image') {
    const { ImageEngine } = await import('./image/ImageEngine');
    engine = new ImageEngine();
  } else if (id === 'ffmpeg') {
    const { FfmpegEngine } = await import('./ffmpeg/FfmpegEngine');
    engine = new FfmpegEngine();
  } else {
    throw new Error(`Unknown engine ID: ${String(id)}`);
  }

  cache.set(id, engine);
  return engine;
}

/** Check if an engine singleton is currently instantiated */
export function hasEngine(id: 'image' | 'ffmpeg'): boolean {
  return cache.has(id);
}

/**
 * Dispose an engine and remove it from the cache.
 * Call this when the user leaves a tool page or on idle timeout.
 */
export function disposeEngine(id: 'image' | 'ffmpeg'): void {
  const engine = cache.get(id);
  if (engine) {
    engine.dispose();
    cache.delete(id);
  }
}

/** Dispose all cached engines */
export function disposeAllEngines(): void {
  for (const engine of cache.values()) {
    try {
      engine.dispose();
    } catch {
      // Ignore disposal errors
    }
  }
  cache.clear();
}
