import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createToolStore } from '@/lib/toolStore';
import type { Tool } from '@/registry/schema';

// Mock tool for testing
const mockTool: Tool = {
  id: 'test-heic-to-jpg',
  slug: 'heic-to-jpg',
  kind: 'convert',
  department: 'image',
  from: ['heic'],
  to: 'jpg',
  engine: 'image',
  strategy: 'transcode',
  options: [
    {
      id: 'quality',
      label: 'Quality',
      type: 'slider',
      min: 10,
      max: 100,
      step: 5,
      default: 85,
      advanced: false,
    },
    {
      id: 'force-reencode',
      label: 'Force re-encode',
      type: 'toggle',
      default: false,
      advanced: true,
    },
  ],
  limits: {
    maxBytes: 50 * 1024 * 1024, // 50 MB
    warnBytes: 25 * 1024 * 1024,
    maxFiles: 3,
  },
  seo: {
    title: 'HEIC to JPG Converter',
    description: 'Convert HEIC to JPG in browser',
    primary: 'HEIC to JPG',
  },
  contentRef: 'image/heic-to-jpg',
  related: [],
  wave: 1,
  status: 'ready',
};

describe('Tool State Machine & Store (Section 13)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('initializes in idle phase with default options and zero files', () => {
    const useStore = createToolStore(mockTool);
    const state = useStore.getState();

    expect(state.phase).toBe('idle');
    expect(state.files).toHaveLength(0);
    expect(state.overall).toBe(0);
    expect(state.options).toEqual({
      quality: 85,
      'force-reencode': false,
    });
  });

  it('enforces batch limits: accepts up to maxFiles and skips excess files', async () => {
    const useStore = createToolStore(mockTool);

    // Create 5 mock files (maxFiles is 3)
    const files = [
      new File([new Uint8Array(100)], 'test1.heic', { type: 'image/heic' }),
      new File([new Uint8Array(100)], 'test2.heic', { type: 'image/heic' }),
      new File([new Uint8Array(100)], 'test3.heic', { type: 'image/heic' }),
      new File([new Uint8Array(100)], 'test4.heic', { type: 'image/heic' }),
      new File([new Uint8Array(100)], 'test5.heic', { type: 'image/heic' }),
    ];

    await useStore.getState().addFiles(files, mockTool);

    const state = useStore.getState();
    expect(state.phase).toBe('ready');
    expect(state.files).toHaveLength(3);
    expect(state.files[0]?.name).toBe('test1.heic');
    expect(state.files[2]?.name).toBe('test3.heic');
  });

  it('transitions validating -> idle when file exceeds hard size limits', async () => {
    const useStore = createToolStore(mockTool);

    // Create a 60 MB file (exceeds 50 MB maxBytes limit)
    const oversizedFile = new File(
      [new Uint8Array(10)], // mock file with artificially large size property
      'giant.heic',
      { type: 'image/heic' },
    );
    Object.defineProperty(oversizedFile, 'size', { value: 60 * 1024 * 1024 });

    await useStore.getState().addFiles([oversizedFile], mockTool);

    const state = useStore.getState();
    expect(state.phase).toBe('idle');
    expect(state.files).toHaveLength(0);
    expect(state.globalError).toBeDefined();
    expect(state.globalError?.code).toBe('TOO_LARGE');
  });

  it('preserves user place: changing an option after done re-enables Convert', () => {
    const useStore = createToolStore(mockTool);

    // Simulate done state with 1 file
    useStore.setState({
      phase: 'done',
      files: [
        {
          id: 'f-1',
          file: new File([''], 'photo.heic'),
          name: 'photo.heic',
          bytes: 1000,
          status: 'done',
          progress: 1,
          result: {
            blob: new Blob(['result']),
            fileName: 'photo.jpg',
            bytes: 800,
            url: 'blob:test',
          },
        },
      ],
    });

    // Change an option
    useStore.getState().setOption('quality', 95);

    const state = useStore.getState();
    expect(state.options['quality']).toBe(95);
    expect(state.phase).toBe('ready');
    expect(state.files[0]?.status).toBe('queued');
    expect(state.files[0]?.progress).toBe(0);
  });

  it('cancel() transitions phase to cancelled and halts jobs', () => {
    const useStore = createToolStore(mockTool);
    const abortSpy = vi.fn();

    useStore.setState({
      phase: 'converting',
      abortController: { abort: abortSpy } as unknown as AbortController,
      files: [
        {
          id: 'f-1',
          file: new File([''], 'file1.heic'),
          name: 'file1.heic',
          bytes: 500,
          status: 'working',
          progress: 0.5,
        },
      ],
    });

    useStore.getState().cancel();

    const state = useStore.getState();
    expect(abortSpy).toHaveBeenCalled();
    expect(state.phase).toBe('cancelled');
    expect(state.files[0]?.status).toBe('cancelled');
    expect(state.files[0]?.progress).toBe(0);
  });

  it('retry() resets failed files to queued and transitions to ready', () => {
    const useStore = createToolStore(mockTool);

    useStore.setState({
      phase: 'failed',
      globalError: { code: 'ENCODE_FAILED', message: 'Failed', recoverable: true },
      files: [
        {
          id: 'f-1',
          file: new File([''], 'file1.heic'),
          name: 'file1.heic',
          bytes: 500,
          status: 'failed',
          progress: 0,
          error: { code: 'ENCODE_FAILED', message: 'Failed', recoverable: true },
        },
      ],
    });

    useStore.getState().retry();

    const state = useStore.getState();
    expect(state.phase).toBe('ready');
    expect(state.globalError).toBeUndefined();
    expect(state.files[0]?.status).toBe('queued');
    expect(state.files[0]?.error).toBeUndefined();
  });

  it('clear() revokes blob URLs and resets store to initial idle state', () => {
    const revokeSpy = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
    const useStore = createToolStore(mockTool);

    useStore.setState({
      phase: 'done',
      files: [
        {
          id: 'f-1',
          file: new File([''], 'file1.heic'),
          name: 'file1.heic',
          bytes: 500,
          status: 'done',
          progress: 1,
          result: {
            blob: new Blob(['']),
            fileName: 'file1.jpg',
            bytes: 400,
            url: 'blob:mock-url-1',
          },
        },
      ],
    });

    useStore.getState().clear();

    const state = useStore.getState();
    expect(revokeSpy).toHaveBeenCalledWith('blob:mock-url-1');
    expect(state.phase).toBe('idle');
    expect(state.files).toHaveLength(0);
    expect(state.overall).toBe(0);
  });
});
