import { describe, it, expect } from 'vitest';
import { ImageEngine } from '../../engines/image/ImageEngine';
import type { ConvertJob, ProgressEvent } from '../../engines/types';
import JSZip from 'jszip';

describe('ImageEngine (Phase 1 Still Image Conversions)', () => {
  const engine = new ImageEngine();

  it('canHandle returns true for all Phase 1 image formats', () => {
    const formats = ['heic', 'heif', 'jpg', 'jpeg', 'png', 'webp', 'avif', 'gif', 'bmp', 'tiff', 'svg'];
    for (const fmt of formats) {
      expect(
        engine.canHandle({
          file: new File([], `test.${fmt}`),
          toolId: `${fmt}-to-jpg`,
          from: fmt,
          to: 'jpg',
          options: {},
        }),
      ).toBe(true);
    }
  });

  it('canHandle returns false for audio and video formats', () => {
    const nonImage = ['mp3', 'wav', 'mp4', 'mov', 'mkv', 'avi'];
    for (const fmt of nonImage) {
      expect(
        engine.canHandle({
          file: new File([], `media.${fmt}`),
          toolId: `${fmt}-to-mp3`,
          from: fmt,
          to: 'mp3',
          options: {},
        }),
      ).toBe(false);
    }
  });

  it('executes conversion and produces correctly named result', async () => {
    const rawData = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    const job: ConvertJob = {
      file: new File([rawData], 'photo.png', { type: 'image/png' }),
      toolId: 'png-to-jpg',
      from: 'png',
      to: 'jpg',
      options: { quality: 90, background: '#ffffff' },
    };

    const progressReports: ProgressEvent[] = [];
    const controller = new AbortController();

    const result = await engine.run(
      job,
      (p) => progressReports.push(p),
      controller.signal,
    );

    expect(result).toBeDefined();
    expect(result.fileName).toBe('photo.jpg');
    expect(result.mime).toBe('image/jpeg');
    expect(result.bytes).toBeGreaterThan(0);
    expect(progressReports.length).toBeGreaterThan(0);
  });

  it('honors AbortSignal and aborts immediately when cancelled', async () => {
    const rawData = new Uint8Array([0x01, 0x02, 0x03]);
    const job: ConvertJob = {
      file: new File([rawData], 'cancel_test.png'),
      toolId: 'png-to-jpg',
      from: 'png',
      to: 'jpg',
      options: {},
    };

    const controller = new AbortController();
    controller.abort('User cancelled');

    await expect(
      engine.run(job, () => {}, controller.signal),
    ).rejects.toMatchObject({ code: 'CANCELLED' });
  });

  it('blocks oversized files exceeding device memory budget with TOO_LARGE or OUT_OF_MEMORY', async () => {
    // 500 MB mock file (exceeds standard 100MB image limits)
    const oversizedFile = {
      name: 'giant_wallpaper.png',
      size: 500 * 1024 * 1024,
      type: 'image/png',
      slice: () => new Blob(),
      arrayBuffer: async () => new ArrayBuffer(0),
    } as unknown as File;

    const job: ConvertJob = {
      file: oversizedFile,
      toolId: 'png-to-jpg',
      from: 'png',
      to: 'jpg',
      options: {},
    };

    const controller = new AbortController();

    await expect(
      engine.run(job, () => {}, controller.signal),
    ).rejects.toMatchObject({
      code: expect.stringMatching(/^(TOO_LARGE|OUT_OF_MEMORY)$/),
    });
  });

  it('handles multi-file batch execution and creates valid ZIP packaging', async () => {
    const files = [
      new File([new Uint8Array([1, 2])], 'IMG_0001.heic'),
      new File([new Uint8Array([3, 4])], 'IMG_0002.heic'),
      new File([new Uint8Array([5, 6])], 'IMG_0003.heic'),
    ];

    const results = [];
    for (const file of files) {
      const job: ConvertJob = {
        file,
        toolId: 'heic-to-jpg',
        from: 'heic',
        to: 'jpg',
        options: { quality: 90 },
      };
      const res = await engine.run(job, () => {}, new AbortController().signal);
      results.push(res);
    }

    expect(results).toHaveLength(3);
    expect(results[0]?.fileName).toBe('IMG_0001.jpg');
    expect(results[1]?.fileName).toBe('IMG_0002.jpg');
    expect(results[2]?.fileName).toBe('IMG_0003.jpg');

    // Verify ZIP generation with JSZip
    const zip = new JSZip();
    for (const res of results) {
      zip.file(res.fileName, res.blob);
    }

    const zipBlob = await zip.generateAsync({ type: 'blob' });
    expect(zipBlob.size).toBeGreaterThan(0);
  });

  it('attaches transparency note when converting transparent format to JPEG', async () => {
    const rawData = new Uint8Array([0x89, 0x50, 0x4e, 0x47]);
    const job: ConvertJob = {
      file: new File([rawData], 'logo.png', { type: 'image/png' }),
      toolId: 'png-to-jpg',
      from: 'png',
      to: 'jpg',
      options: {},
    };

    const res = await engine.run(job, () => {}, new AbortController().signal);
    expect(res.notes).toContain('Transparency replaced with white background.');
  });

  it('attaches note when input format matches target format', async () => {
    const rawData = new Uint8Array([0xff, 0xd8, 0xff]);
    const job: ConvertJob = {
      file: new File([rawData], 'photo.jpg', { type: 'image/jpeg' }),
      toolId: 'jpg-to-jpg',
      from: 'jpg',
      to: 'jpg',
      options: {},
    };

    const res = await engine.run(job, () => {}, new AbortController().signal);
    expect(res.notes).toContain(
      'File is already in the target format. Re-encoding will create a new copy.',
    );
  });

  it('cleans up worker resources when engine is disposed', () => {
    expect(() => engine.dispose()).not.toThrow();
  });
});
