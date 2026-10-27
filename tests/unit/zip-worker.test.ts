import { describe, it, expect } from 'vitest';
import { createZipInWorker } from '@/lib/zipWorker';
import JSZip from 'jszip';

describe('ZIP generation service', () => {
  it('generates a valid ZIP archive containing all provided files', async () => {
    const file1 = {
      name: 'hello.txt',
      blob: new Blob(['Hello World'], { type: 'text/plain' }),
    };
    const file2 = {
      name: 'nested/doc.txt',
      blob: new Blob(['Another file content'], { type: 'text/plain' }),
    };

    const zipBlob = await createZipInWorker([file1, file2]);
    expect(zipBlob).toBeDefined();
    expect(zipBlob.type).toBe('application/zip');
    expect(zipBlob.size).toBeGreaterThan(0);

    // Verify ZIP contents using JSZip reader
    const zip = await JSZip.loadAsync(zipBlob);
    const names = Object.keys(zip.files);
    expect(names).toContain('hello.txt');
    expect(names).toContain('nested/doc.txt');

    const helloContent = await zip.file('hello.txt')?.async('string');
    expect(helloContent).toBe('Hello World');
  });

  it('tracks progress during generation if onProgress callback is supplied', async () => {
    let progressCalled = false;
    const file = {
      name: 'test.bin',
      blob: new Blob([new Uint8Array(5000)]),
    };

    const zipBlob = await createZipInWorker([file], (percent) => {
      progressCalled = true;
      expect(percent).toBeGreaterThanOrEqual(0);
      expect(percent).toBeLessThanOrEqual(100);
    });

    expect(zipBlob.size).toBeGreaterThan(0);
    expect(progressCalled).toBe(true);
  });
});
