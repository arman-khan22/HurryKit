import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FfmpegEngine } from '../../engines/ffmpeg/FfmpegEngine';
import type { JobInput } from '../../engines/types';

describe('FfmpegEngine lifecycle & execution guard', () => {
  let engine: FfmpegEngine;

  beforeEach(() => {
    vi.restoreAllMocks();
    engine = new FfmpegEngine();
  });

  it('canHandle accurately identifies supported audio and video formats', () => {
    const validInputs: Array<{ from: string; to: string }> = [
      { from: 'mp4', to: 'mp3' },
      { from: 'wav', to: 'mp3' },
      { from: 'm4a', to: 'mp3' },
      { from: 'opus', to: 'mp3' },
      { from: 'mov', to: 'mp4' },
      { from: 'mkv', to: 'mp4' },
      { from: 'avi', to: 'mp4' },
      { from: 'webm', to: 'mp4' },
      { from: 'mp4', to: 'gif' },
      { from: 'gif', to: 'mp4' },
      { from: 'flac', to: 'wav' },
    ];

    for (const { from, to } of validInputs) {
      const input: JobInput = {
        file: new File([''], `test.${from}`, { type: 'video/mp4' }),
        toolId: `${from}-to-${to}`,
        from,
        to,
        options: {},
      };
      expect(engine.canHandle(input)).toBe(true);
    }

    const invalidInput: JobInput = {
      file: new File([''], 'test.png', { type: 'image/png' }),
      toolId: 'png-to-jpg',
      from: 'png',
      to: 'jpg',
      options: {},
    };
    expect(engine.canHandle(invalidInput)).toBe(false);
  });

  it('blocks files that exceed the maximum memory limit before loading engine', async () => {
    // 600 MB file (exceeds 500 MB hard limit)
    const largeFile = {
      name: 'large.mp4',
      size: 600 * 1024 * 1024,
      type: 'video/mp4',
    } as unknown as File;

    const input: JobInput = {
      file: largeFile,
      toolId: 'mp4-to-mp3',
      from: 'mp4',
      to: 'mp3',
      options: {},
    };

    const controller = new AbortController();
    await expect(engine.run(input, () => {}, controller.signal)).rejects.toMatchObject({
      code: 'TOO_LARGE',
    });
  });

  it('aborts immediately when signal is cancelled prior to execution', async () => {
    const file = new File(['mock content'], 'sample.wav', { type: 'audio/wav' });
    const input: JobInput = {
      file,
      toolId: 'wav-to-mp3',
      from: 'wav',
      to: 'mp3',
      options: {},
    };

    const controller = new AbortController();
    controller.abort(); // Pre-aborted

    await expect(engine.run(input, () => {}, controller.signal)).rejects.toMatchObject({
      code: 'CANCELLED',
    });
  });

  it('disposes cleanly and resets state', () => {
    expect(() => engine.dispose()).not.toThrow();
  });
});
