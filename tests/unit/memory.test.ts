import { describe, it, expect } from 'vitest';
import {
  checkMemory,
  memoryGuard,
  estimateImageMemory,
  estimateVideoMemory,
  estimateAudioMemory,
  MEMORY_BUDGETS,
} from '../../engines/shared/memory';

describe('Memory estimates, budgets, and memoryGuard', () => {
  it('estimates image, video and audio memory conservatively', () => {
    const size = 10 * 1024 * 1024; // 10 MB
    expect(estimateImageMemory(size)).toBe(80 * 1024 * 1024);
    expect(estimateVideoMemory(size)).toBe(30 * 1024 * 1024);
    expect(estimateAudioMemory(size)).toBe(60 * 1024 * 1024);
  });

  it('allows jobs within memory budget', () => {
    const smallEst = 50 * 1024 * 1024; // 50 MB
    const res = checkMemory(smallEst, 'low');
    expect(res.ok).toBe(true);
  });

  it('warns on jobs approaching memory threshold', () => {
    const warnEst = 200 * 1024 * 1024; // 200 MB on 256MB budget
    const res = checkMemory(warnEst, 'low');
    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.level).toBe('warn');
    }
  });

  it('blocks jobs that exceed device budget', () => {
    const hugeEst = 300 * 1024 * 1024; // 300 MB > 256MB budget
    const res = checkMemory(hugeEst, 'low');
    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.level).toBe('block');
    }
  });

  describe('memoryGuard() utility', () => {
    it('blocks files exceeding registry maxBytes with TOO_LARGE code', () => {
      const file = { size: 120 * 1024 * 1024, name: 'large_image.png' }; // 120MB
      const limits = { maxBytes: 100 * 1024 * 1024 }; // 100MB limit

      const guard = memoryGuard(file, limits, 'high');
      expect(guard.ok).toBe(false);
      expect(guard.status).toBe('block');
      expect(guard.code).toBe('TOO_LARGE');
    });

    it('blocks jobs exceeding device RAM limits with OUT_OF_MEMORY code', () => {
      // 40MB input image estimated at 40MB * 8 = 320MB > 256MB (low device budget)
      const file = { size: 40 * 1024 * 1024, name: 'photo.jpg' };
      const limits = { maxBytes: 100 * 1024 * 1024 };

      const guard = memoryGuard(file, limits, 'low');
      expect(guard.ok).toBe(false);
      expect(guard.status).toBe('block');
      expect(guard.code).toBe('OUT_OF_MEMORY');
    });

    it('warns when file exceeds warnBytes limit', () => {
      const file = { size: 60 * 1024 * 1024, name: 'clip.mp4' };
      const limits = { maxBytes: 100 * 1024 * 1024, warnBytes: 50 * 1024 * 1024 };

      const guard = memoryGuard(file, limits, 'high');
      expect(guard.ok).toBe(true);
      expect(guard.status).toBe('warn');
      expect(guard.message).toBeDefined();
    });

    it('approves standard jobs well within memory boundaries', () => {
      const file = { size: 2 * 1024 * 1024, name: 'icon.png' }; // 2MB
      const limits = { maxBytes: 50 * 1024 * 1024 };

      const guard = memoryGuard(file, limits, 'mid');
      expect(guard.ok).toBe(true);
      expect(guard.status).toBe('ok');
    });

    it('blocks video files exceeding practical limits for a phone with clear messaging', () => {
      // 180MB video transcode on modern phone (limit 150MB)
      const file = { size: 180 * 1024 * 1024, name: 'clip.mp4' };
      const limits = { maxBytes: 500 * 1024 * 1024 }; // desktop tool limit is 500MB

      const guard = memoryGuard(file, limits, 'mid', true);
      expect(guard.ok).toBe(false);
      expect(guard.status).toBe('block');
      expect(guard.code).toBe('TOO_LARGE');
      expect(guard.message).toContain('too large for a typical phone');
    });

    it('warns for videos that approach phone memory thresholds', () => {
      // 120MB video transcode on modern phone (warn threshold is ~105MB)
      const file = { size: 120 * 1024 * 1024, name: 'movie.mp4' };
      const limits = { maxBytes: 500 * 1024 * 1024 };

      const guard = memoryGuard(file, limits, 'mid', true);
      expect(guard.ok).toBe(true);
      expect(guard.status).toBe('warn');
      expect(guard.message).toContain('mobile device');
    });
  });
});
