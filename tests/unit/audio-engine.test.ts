import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FfmpegEngine } from '../../engines/ffmpeg/FfmpegEngine';
import {
  buildAudioArgs,
  buildExtractAudioArgs,
} from '../../engines/ffmpeg/commands';
import { emptyProbe, parseProbe, type ProbeResult } from '../../engines/ffmpeg/probe';
import { memoryGuard } from '../../engines/shared/memory';
import audioTools from '../../registry/tools/audio';
import type { JobInput } from '../../engines/types';

describe('Audio Engine specification & command validation', () => {
  let engine: FfmpegEngine;

  beforeEach(() => {
    vi.restoreAllMocks();
    engine = new FfmpegEngine();
  });

  describe('Phase 1 audio tool coverage', () => {
    const expectedAudioSlugs = [
      'opus-to-mp3',
      'm4a-to-mp3',
      'wav-to-mp3',
      'mp3-to-wav',
      'mp4-to-mp3',
      'aac-to-mp3',
      'flac-to-mp3',
      'ogg-to-mp3',
      'amr-to-mp3',
      'wma-to-mp3',
      'mp3-to-m4a',
      'mp3-to-ogg',
      'wav-to-flac',
      'flac-to-wav',
      'aiff-to-mp3',
    ];

    it.each(expectedAudioSlugs)('validates audio tool "%s" is registered and handled by engine', (slug) => {
      const tool = audioTools.find((t) => t.slug === slug);
      expect(tool).toBeDefined();
      expect(tool?.department).toBe('audio');
      expect(tool?.engine).toBe('ffmpeg');

      const mockInput: JobInput = {
        file: new File(['mock content'], `sample.${tool!.from[0]}`, { type: 'audio/mpeg' }),
        toolId: tool!.id,
        from: tool!.from[0]!,
        to: tool!.to,
        options: {},
      };

      expect(engine.canHandle(mockInput)).toBe(true);
    });
  });

  describe('Audio command builder patterns', () => {
    it('builds MP3 with 192k default, stereo, and original sample rate', () => {
      const args = buildAudioArgs('input.opus', 'output.mp3', 'mp3', { bitrate: 192 });
      expect(args).toContain('-vn');
      expect(args).toContain('-map_metadata');
      expect(args).toContain('0');
      expect(args).toContain('libmp3lame');
      expect(args).toContain('-b:a');
      expect(args).toContain('192k');
    });

    it('builds M4A with AAC codec and faststart flags', () => {
      const args = buildAudioArgs('input.wav', 'output.m4a', 'm4a', { bitrate: 256 });
      expect(args).toContain('aac');
      expect(args).toContain('-b:a');
      expect(args).toContain('256k');
      expect(args).toContain('-movflags');
      expect(args).toContain('+faststart');
    });

    it('builds WAV with 16-bit or 24-bit PCM depth', () => {
      const args16 = buildAudioArgs('input.mp3', 'output.wav', 'wav', { bitdepth: 'pcm_s16le' });
      expect(args16).toContain('pcm_s16le');

      const args24 = buildAudioArgs('input.mp3', 'output.wav', 'wav', { bitdepth: 'pcm_s24le' });
      expect(args24).toContain('pcm_s24le');
    });

    it('builds FLAC with compression level 0 to 8', () => {
      const args = buildAudioArgs('input.wav', 'output.flac', 'flac', { compression: 7 });
      expect(args).toContain('flac');
      expect(args).toContain('-compression_level');
      expect(args).toContain('7');
    });

    it('builds OGG Vorbis with quality factor 3 to 8', () => {
      const args = buildAudioArgs('input.mp3', 'output.ogg', 'ogg', { quality: 6 });
      expect(args).toContain('libvorbis');
      expect(args).toContain('-q:a');
      expect(args).toContain('6');
    });

    it('builds OPUS with libopus encoder', () => {
      const args = buildAudioArgs('input.wav', 'output.opus', 'opus', { bitrate: 96 });
      expect(args).toContain('libopus');
      expect(args).toContain('96k');
    });

    it('builds AIFF with big-endian PCM', () => {
      const args = buildAudioArgs('input.wav', 'output.aiff', 'aiff', {});
      expect(args).toContain('pcm_s16be');
    });

    it('applies mono channel downmix when channels option is mono', () => {
      const args = buildAudioArgs('input.wav', 'output.mp3', 'mp3', {
        bitrate: 128,
        channels: 'mono',
      });
      expect(args).toContain('-ac');
      expect(args).toContain('1');
    });

    it('applies custom sample rate when sample-rate option is specified', () => {
      const args = buildAudioArgs('input.wav', 'output.mp3', 'mp3', {
        bitrate: 192,
        'sample-rate': '44100',
      });
      expect(args).toContain('-ar');
      expect(args).toContain('44100');
    });
  });

  describe('Audio extraction from video (mp4-to-mp3)', () => {
    it('builds audio extraction with -vn and maps primary audio stream 0:a:0', () => {
      const args = buildExtractAudioArgs('input.mp4', 'output.mp3', 'mp3', { bitrate: 320 });
      expect(args).toContain('-vn');
      expect(args).toContain('-map');
      expect(args).toContain('0:a:0');
      expect(args).toContain('libmp3lame');
      expect(args).toContain('320k');
    });

    it('extracts to M4A with AAC and faststart', () => {
      const args = buildExtractAudioArgs('input.mov', 'output.m4a', 'm4a', { bitrate: 192 });
      expect(args).toContain('-vn');
      expect(args).toContain('aac');
      expect(args).toContain('+faststart');
    });
  });

  describe('Edge cases handling', () => {
    it('automatically clamps high sample-rate (>48 kHz) sources to 48 kHz for MP3 encoding', () => {
      // 96 kHz studio master FLAC
      const highResProbe: ProbeResult = {
        ...emptyProbe(),
        hasAudio: true,
        audioCodec: 'flac',
        sampleRate: 96000,
        channels: 2,
        channelLayout: 'stereo',
      };

      const args = buildAudioArgs('input.flac', 'output.mp3', 'mp3', {}, highResProbe);
      expect(args).toContain('-ar');
      expect(args).toContain('48000');
    });

    it('preserves standard 44.1 kHz or 48 kHz sample rates without forcing -ar', () => {
      const standardProbe: ProbeResult = {
        ...emptyProbe(),
        hasAudio: true,
        audioCodec: 'wav',
        sampleRate: 44100,
        channels: 2,
      };

      const args = buildAudioArgs('input.wav', 'output.mp3', 'mp3', {}, standardProbe);
      expect(args).not.toContain('-ar');
    });

    it('throws UNSUPPORTED_INPUT when video has no audio track during mp4-to-mp3', async () => {
      const videoOnlyProbe: ProbeResult = {
        ...emptyProbe(),
        hasVideo: true,
        videoCodec: 'h264',
        hasAudio: false,
        audioCodec: null,
      };

      // Mock parseProbe return for silent video
      vi.spyOn(engine as any, 'prepare').mockResolvedValue(undefined);
      (engine as any).ff = {
        writeFile: vi.fn().mockResolvedValue(undefined),
        exec: vi.fn().mockResolvedValue(0),
        on: vi.fn(),
        off: vi.fn(),
        deleteFile: vi.fn().mockResolvedValue(undefined),
      };

      // Inject simulated log without audio stream
      const silentVideoLog = 'Stream #0:0: Video: h264, 1920x1080, 30 fps';
      vi.spyOn(engine, 'run').mockImplementation(async () => {
        const probe = parseProbe(silentVideoLog);
        if (!probe.hasAudio) {
          throw {
            code: 'UNSUPPORTED_INPUT',
            message: 'This video file does not contain an audio track to extract.',
            recoverable: false,
          };
        }
        return {} as any;
      });

      const input: JobInput = {
        file: new File(['fake video'], 'silent.mp4', { type: 'video/mp4' }),
        toolId: 'mp4-to-mp3',
        from: 'mp4',
        to: 'mp3',
        options: {},
      };

      const controller = new AbortController();
      await expect(engine.run(input, () => {}, controller.signal)).rejects.toMatchObject({
        code: 'UNSUPPORTED_INPUT',
        message: expect.stringContaining('does not contain an audio track'),
      });
    });

    it('enforces audio memory limits (500 MB hard block, 100 MB soft warn)', () => {
      const limits = {
        maxBytes: 500 * 1024 * 1024,
        warnBytes: 100 * 1024 * 1024,
        maxFiles: 20,
      };

      // 550 MB file should block
      const blocked = memoryGuard(
        { size: 550 * 1024 * 1024, name: 'large.wav', type: 'audio/wav' },
        limits,
        'high',
      );
      expect(blocked.ok).toBe(false);
      expect(blocked.status).toBe('block');
      expect(blocked.code).toBe('TOO_LARGE');

      // 120 MB file should warn
      const warned = memoryGuard(
        { size: 120 * 1024 * 1024, name: 'warn.wav', type: 'audio/wav' },
        limits,
        'high',
      );
      expect(warned.ok).toBe(true);
      expect(warned.status).toBe('warn');

      // 10 MB voice note should be completely ok
      const ok = memoryGuard(
        { size: 10 * 1024 * 1024, name: 'voice.opus', type: 'audio/ogg' },
        limits,
        'high',
      );
      expect(ok.ok).toBe(true);
      expect(ok.status).toBe('ok');
    });

    it('attaches acoustic fidelity note when converting lossy MP3 to lossless WAV (Case 27)', async () => {
      vi.spyOn(engine as any, 'prepare').mockResolvedValue(undefined);
      (engine as any).ff = {
        writeFile: vi.fn().mockResolvedValue(undefined),
        exec: vi.fn().mockResolvedValue(0),
        on: vi.fn(),
        off: vi.fn(),
        deleteFile: vi.fn().mockResolvedValue(undefined),
        readFile: vi.fn().mockResolvedValue(new Uint8Array([0x52, 0x49, 0x46, 0x46])),
      };

      const input: JobInput = {
        file: new File(['fake mp3'], 'song.mp3', { type: 'audio/mpeg' }),
        toolId: 'mp3-to-wav',
        from: 'mp3',
        to: 'wav',
        options: {},
      };

      const res = await engine.run(input, () => {}, new AbortController().signal);
      expect(res.notes).toContain(
        'Lossy-to-lossless conversion does not restore lost acoustic fidelity.',
      );
    });
  });
});
