import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FfmpegEngine } from '../../engines/ffmpeg/FfmpegEngine';
import {
  buildVideoArgs,
  buildGifPass2Args,
  buildHevcArgs,
  canRemux,
  parseProbe,
  emptyProbe,
  type ProbeResult,
} from '../../engines/ffmpeg/commands';
import { memoryGuard } from '../../engines/shared/memory';
import videoTools from '../../registry/tools/video';
import type { JobInput, JobProgress } from '../../engines/types';

describe('Video Engine specification & command validation', () => {
  let engine: FfmpegEngine;

  beforeEach(() => {
    vi.restoreAllMocks();
    engine = new FfmpegEngine();
  });

  describe('Phase 1 video tool coverage', () => {
    const expectedVideoSlugs = [
      'mov-to-mp4',
      'mkv-to-mp4',
      'avi-to-mp4',
      'webm-to-mp4',
      'hevc-to-h264',
      'mp4-to-gif',
      'gif-to-mp4',
      'wmv-to-mp4',
      'flv-to-mp4',
      '3gp-to-mp4',
      'm4v-to-mp4',
      'mpeg-to-mp4',
      'mp4-to-mov',
      'mp4-to-webm',
      'webm-to-gif',
      'mov-to-gif',
      'mov-to-mp3',
    ];

    it.each(expectedVideoSlugs)(
      'validates video tool "%s" is registered and handled by engine',
      (slug) => {
        const tool = videoTools.find((t) => t.slug === slug);
        expect(tool).toBeDefined();
        expect(tool?.department).toBe('video');
        expect(tool?.engine).toBe('ffmpeg');

        const mockInput: JobInput = {
          file: new File(['mock content'], `sample.${tool!.from[0]}`, { type: 'video/mp4' }),
          toolId: tool!.id,
          from: tool!.from[0]!,
          to: tool!.to,
          options: {},
          limits: tool!.limits,
        };

        expect(engine.canHandle(mockInput)).toBe(true);
      },
    );
  });

  describe('Two-path decision logic (Remux vs. Transcode)', () => {
    const compatibleProbe: ProbeResult = {
      ...emptyProbe(),
      hasVideo: true,
      hasAudio: true,
      videoCodec: 'h264',
      audioCodec: 'aac',
      pixFmt: 'yuv420p',
      width: 1920,
      height: 1080,
      fps: 30,
      duration: 60,
      isInterlaced: false,
    };

    it('chooses fast remux (stream copy) when codecs are compatible with MP4 container', () => {
      expect(canRemux(compatibleProbe, 'mp4')).toBe(true);

      const args = buildVideoArgs('input.mov', 'output.mp4', 'mp4', {}, compatibleProbe);
      expect(args).toContain('-c');
      expect(args).toContain('copy');
      expect(args).toContain('-movflags');
      expect(args).toContain('+faststart');
      expect(args).not.toContain('libx264');
    });

    it('forces transcode when user checks "force-reencode" toggle option', () => {
      const args = buildVideoArgs(
        'input.mov',
        'output.mp4',
        'mp4',
        { 'force-reencode': true },
        compatibleProbe,
      );
      expect(args).toContain('-c:v');
      expect(args).toContain('libx264');
      expect(args).not.toContain('copy');
    });

    it('forces transcode when source video is HEVC / H.265 going to standard MP4', () => {
      const hevcProbe: ProbeResult = {
        ...compatibleProbe,
        videoCodec: 'hevc',
      };
      expect(canRemux(hevcProbe, 'mp4')).toBe(false);

      const args = buildVideoArgs('input.mov', 'output.mp4', 'mp4', {}, hevcProbe);
      expect(args).toContain('-c:v');
      expect(args).toContain('libx264');
    });

    it('forces transcode when source is VP9 in MKV going to MP4', () => {
      const vp9Probe: ProbeResult = {
        ...compatibleProbe,
        videoCodec: 'vp9',
      };
      expect(canRemux(vp9Probe, 'mp4')).toBe(false);

      const args = buildVideoArgs('input.mkv', 'output.mp4', 'mp4', {}, vp9Probe);
      expect(args).toContain('-c:v');
      expect(args).toContain('libx264');
    });

    it('forces transcode and applies yadif filter when source video is interlaced', () => {
      const interlacedProbe: ProbeResult = {
        ...compatibleProbe,
        isInterlaced: true,
      };
      expect(canRemux(interlacedProbe, 'mp4')).toBe(false);

      const args = buildVideoArgs('input.mov', 'output.mp4', 'mp4', {}, interlacedProbe);
      expect(args).toContain('-vf');
      const vfIndex = args.indexOf('-vf');
      expect(args[vfIndex + 1]).toContain('yadif');
      expect(args).toContain('libx264');
    });

    it('forces transcode when pixel format is not yuv420p (e.g. 10-bit or yuv422p)', () => {
      const nonStandardPixFmtProbe: ProbeResult = {
        ...compatibleProbe,
        pixFmt: 'yuv422p',
      };
      expect(canRemux(nonStandardPixFmtProbe, 'mp4')).toBe(false);
    });
  });

  describe('Edge-case catalogue behaviours', () => {
    it('handles silent video without audio track (-an, no audio codec)', () => {
      const silentProbe: ProbeResult = {
        ...emptyProbe(),
        hasVideo: true,
        hasAudio: false,
        videoCodec: 'h264',
        audioCodec: null,
        pixFmt: 'yuv420p',
        width: 1280,
        height: 720,
      };

      const transcodeArgs = buildVideoArgs(
        'input.mp4',
        'output.mp4',
        'mp4',
        { 'force-reencode': true },
        silentProbe,
      );
      expect(transcodeArgs).toContain('-an');
      expect(transcodeArgs).not.toContain('aac');

      const remuxArgs = buildVideoArgs('input.mov', 'output.mp4', 'mp4', {}, silentProbe);
      expect(remuxArgs).toContain('-an');
    });

    it('removes audio when user selects audio: "remove"', () => {
      const probe: ProbeResult = {
        ...emptyProbe(),
        hasVideo: true,
        hasAudio: true,
        videoCodec: 'h264',
        audioCodec: 'aac',
        pixFmt: 'yuv420p',
      };

      const args = buildVideoArgs(
        'input.mov',
        'output.mp4',
        'mp4',
        { audio: 'remove', 'force-reencode': true },
        probe,
      );
      expect(args).toContain('-an');
      expect(args).not.toContain('aac');
    });

    it('enforces constant frame rate (-fps_mode cfr) to fix variable frame rate phone clips', () => {
      const vfrProbe: ProbeResult = {
        ...emptyProbe(),
        hasVideo: true,
        hasAudio: true,
        videoCodec: 'h264',
        audioCodec: 'aac',
        isVariableFrameRate: true,
      };

      const args = buildVideoArgs(
        'input.mov',
        'output.mp4',
        'mp4',
        { 'force-reencode': true },
        vfrProbe,
      );
      expect(args).toContain('-fps_mode');
      expect(args).toContain('cfr');
    });

    it('rounds odd dimensions to even numbers with trunc(iw/2)*2:trunc(ih/2)*2', () => {
      const oddProbe: ProbeResult = {
        ...emptyProbe(),
        hasVideo: true,
        width: 1081,
        height: 1921,
      };

      const args = buildVideoArgs('input.mov', 'output.mp4', 'mp4', {}, oddProbe);
      const vfIndex = args.indexOf('-vf');
      expect(vfIndex).toBeGreaterThan(-1);
      expect(args[vfIndex + 1]).toContain('scale=trunc(iw/2)*2:trunc(ih/2)*2');
    });

    it('applies resolution downscaling presets (1080, 720, 480)', () => {
      const probe: ProbeResult = {
        ...emptyProbe(),
        hasVideo: true,
        width: 3840,
        height: 2160,
      };

      const args720 = buildVideoArgs('input.mp4', 'output.mp4', 'mp4', { resolution: '720' }, probe);
      const vf720 = args720[args720.indexOf('-vf') + 1];
      expect(vf720).toContain('scale=-2:720');

      const args480 = buildVideoArgs('input.mp4', 'output.mp4', 'mp4', { resolution: '480' }, probe);
      const vf480 = args480[args480.indexOf('-vf') + 1];
      expect(vf480).toContain('scale=-2:480');
    });

    it('applies quality presets to H.264 CRF (high: 20, balanced: 23, small: 28)', () => {
      const probe = emptyProbe();
      const highArgs = buildVideoArgs('in.mp4', 'out.mp4', 'mp4', { quality: 'high' }, probe);
      expect(highArgs).toContain('-crf');
      expect(highArgs[highArgs.indexOf('-crf') + 1]).toBe('20');

      const balancedArgs = buildVideoArgs('in.mp4', 'out.mp4', 'mp4', { quality: 'balanced' }, probe);
      expect(balancedArgs[balancedArgs.indexOf('-crf') + 1]).toBe('23');

      const smallArgs = buildVideoArgs('in.mp4', 'out.mp4', 'mp4', { quality: 'small' }, probe);
      expect(smallArgs[smallArgs.indexOf('-crf') + 1]).toBe('28');
    });

    it('maps primary streams only (-map 0:v:0 and -map 0:a:0?) to ignore extra tracks/subtitles', () => {
      const multiTrackProbe: ProbeResult = {
        ...emptyProbe(),
        hasVideo: true,
        hasAudio: true,
        videoCodec: 'h264',
        audioCodec: 'aac',
        pixFmt: 'yuv420p',
      };

      const remuxArgs = buildVideoArgs('input.mkv', 'output.mp4', 'mp4', {}, multiTrackProbe);
      expect(remuxArgs).toContain('-map');
      expect(remuxArgs).toContain('0:v:0');
      expect(remuxArgs).toContain('0:a:0?');

      const transcodeArgs = buildVideoArgs(
        'input.mkv',
        'output.mp4',
        'mp4',
        { 'force-reencode': true },
        multiTrackProbe,
      );
      expect(transcodeArgs).toContain('-map');
      expect(transcodeArgs).toContain('0:v:0');
      expect(transcodeArgs).toContain('0:a:0?');
    });

    it('builds two-pass GIF command with palettegen and paletteuse', () => {
      const probe: ProbeResult = {
        ...emptyProbe(),
        hasVideo: true,
        width: 1920,
        height: 1080,
      };

      // Pass 1: palettegen
      const pass1 = buildVideoArgs('clip.mp4', 'palette.png', 'gif', { width: 480, fps: 12 }, probe);
      expect(pass1).toContain('palette.png');
      expect(pass1).toContain('-vf');
      expect(pass1[pass1.indexOf('-vf') + 1]).toContain('palettegen');
      expect(pass1[pass1.indexOf('-vf') + 1]).toContain('fps=12,scale=480:-1:flags=lanczos');

      // Pass 2: paletteuse
      const pass2 = buildGifPass2Args('clip.mp4', 'clip.gif', { width: 480, fps: 12 });
      expect(pass2).toContain('palette.png');
      expect(pass2).toContain('-lavfi');
      expect(pass2[pass2.indexOf('-lavfi') + 1]).toContain('paletteuse');
      expect(pass2).toContain('clip.gif');
    });

    it('builds GIF to MP4 command with libx264, yuv420p, and even dimensions', () => {
      const gifProbe: ProbeResult = {
        ...emptyProbe(),
        hasVideo: true,
        videoCodec: 'gif',
      };

      const args = buildVideoArgs('anim.gif', 'anim.mp4', 'mp4', {}, gifProbe);
      expect(args).toContain('-c:v');
      expect(args).toContain('libx264');
      expect(args).toContain('-pix_fmt');
      expect(args).toContain('yuv420p');
      expect(args).toContain('-vf');
      expect(args).toContain('scale=trunc(iw/2)*2:trunc(ih/2)*2');
      expect(args).toContain('-an');
    });

    it('builds HEVC to H.264 command with CRF, AAC, and even dimensions', () => {
      const hevcProbe: ProbeResult = {
        ...emptyProbe(),
        hasVideo: true,
        hasAudio: true,
        videoCodec: 'hevc',
      };

      const args = buildHevcArgs('iphone.mov', 'iphone.mp4', { quality: 'balanced' }, hevcProbe);
      expect(args).toContain('libx264');
      expect(args).toContain('-crf');
      expect(args).toContain('23');
      expect(args).toContain('aac');
      expect(args).toContain('-fps_mode');
      expect(args).toContain('cfr');
    });
  });

  describe('Probe stderr parsing (resolution, duration, rotation, interlacing)', () => {
    it('parses typical iPhone 4K portrait video with rotation metadata', () => {
      const sampleLog = `
Input #0, mov,mp4,m4a,3gp,3g2,mj2, from 'input.mov':
  Metadata:
    major_brand     : qt
    minor_version   : 0
    compatible_brands: qt
  Duration: 00:00:15.30, start: 0.000000, bitrate: 45230 kb/s
  Stream #0:0[0x1](und): Video: hevc (Main) (hvc1 / 0x31637668), yuv420p(tv, bt709), 3840x2160, 45100 kb/s, 29.97 fps, 29.97 tbr
    Metadata:
      rotate          : 90
      creation_time   : 2026-10-25T10:15:00.000000Z
    Side data:
      displaymatrix: rotation of -90.00 degrees
  Stream #0:1[0x2](und): Audio: aac (LC) (mp4a / 0x6134706D), 48000 Hz, stereo, fltp, 128 kb/s
      `;

      const result = parseProbe(sampleLog);
      expect(result.hasVideo).toBe(true);
      expect(result.videoCodec).toBe('hevc');
      expect(result.pixFmt).toBe('yuv420p');
      expect(result.width).toBe(3840);
      expect(result.height).toBe(2160);
      expect(result.duration).toBe(15.3);
      expect(result.fps).toBe(29.97);
      expect(result.rotation).toBe(-90);
      expect(result.hasAudio).toBe(true);
      expect(result.audioCodec).toBe('aac');
      expect(result.sampleRate).toBe(48000);
      expect(result.channelLayout).toBe('stereo');
    });

    it('parses interlaced source indicator', () => {
      const interlacedLog = `
Stream #0:0: Video: mpeg2video (Main), yuv420p(tv, top first), 720x480 [SAR 8:9 DAR 4:3], 29.97 fps, tff
      `;
      const result = parseProbe(interlacedLog);
      expect(result.isInterlaced).toBe(true);
    });
  });

  describe('Device memory & practical phone size limits', () => {
    it('blocks video file exceeding phone limit (150MB for transcode) with clear guidance', () => {
      const file = { size: 160 * 1024 * 1024, name: 'large_transcode.avi' };
      const limits = { maxBytes: 500 * 1024 * 1024, maxFiles: 3 };

      const guard = memoryGuard(file, limits, 'mid', true);
      expect(guard.ok).toBe(false);
      expect(guard.status).toBe('block');
      expect(guard.code).toBe('TOO_LARGE');
      expect(guard.message).toContain('too large for a typical phone');
    });

    it('allows up to 500MB video for remux path on modern phone', () => {
      const file = { size: 400 * 1024 * 1024, name: 'remux_clip.mov' };
      const remuxLimits = { maxBytes: 2 * 1024 * 1024 * 1024, maxFiles: 5 };

      const guard = memoryGuard(file, remuxLimits, 'mid', true);
      expect(guard.ok).toBe(true);
    });

    it('blocks video exceeding 500MB for remux on phone', () => {
      const file = { size: 600 * 1024 * 1024, name: 'huge_remux.mov' };
      const remuxLimits = { maxBytes: 2 * 1024 * 1024 * 1024, maxFiles: 5 };

      const guard = memoryGuard(file, remuxLimits, 'mid', true);
      expect(guard.ok).toBe(false);
      expect(guard.status).toBe('block');
      expect(guard.code).toBe('TOO_LARGE');
      expect(guard.message).toContain('too large for a typical phone');
    });
  });

  describe('Engine run execution with notes & progress stages', () => {
    it('returns fast stream copy notes when remux succeeds', async () => {
      const progressEvents: JobProgress[] = [];

      vi.spyOn(engine as any, 'prepare').mockResolvedValue(undefined);
      (engine as any).ff = {
        writeFile: vi.fn().mockResolvedValue(undefined),
        readFile: vi.fn().mockResolvedValue(new Uint8Array([1, 2, 3, 4])),
        deleteFile: vi.fn().mockResolvedValue(undefined),
        exec: vi.fn().mockResolvedValue(0),
        on: vi.fn((event: string, handler: any) => {
          if (event === 'log') {
            handler({
              message:
                'Stream #0:0: Video: h264 (High), yuv420p, 1920x1080, 30 fps\nStream #0:1: Audio: aac, 48000 Hz, stereo',
            });
          }
        }),
        off: vi.fn(),
      };

      const result = await engine.run(
        {
          file: new File(['mock content'], 'test.mov', { type: 'video/quicktime' }),
          toolId: 'mov-to-mp4',
          from: 'mov',
          to: 'mp4',
          options: {},
          limits: { maxBytes: 2 * 1024 * 1024 * 1024 },
        },
        (p) => progressEvents.push(p),
        new AbortController().signal,
      );

      expect(result.notes).toBeDefined();
      expect(result.notes).toContain('Fast stream copy — no quality loss');

      const stages = progressEvents.map((p) => p.stage);
      expect(stages).toContain('reading');
      expect(stages).toContain('detecting');
      expect(stages).toContain('converting');
      expect(stages).toContain('finishing');
    });

    it('automatically falls back to transcode when remux execution fails (Case 39)', async () => {
      vi.spyOn(engine as any, 'prepare').mockResolvedValue(undefined);

      let execCallCount = 0;
      (engine as any).ff = {
        writeFile: vi.fn().mockResolvedValue(undefined),
        readFile: vi.fn().mockResolvedValue(new Uint8Array([1, 2, 3, 4])),
        deleteFile: vi.fn().mockResolvedValue(undefined),
        exec: vi.fn().mockImplementation(async (args: string[]) => {
          execCallCount++;
          if (args.includes('-f') && args.includes('null')) {
            // Probe call
            return 0;
          }
          if (args.includes('-c') && args.includes('copy')) {
            // First conversion attempt: Remux fails with non-zero exit code
            return 1;
          }
          // Second conversion attempt: Transcode succeeds
          return 0;
        }),
        on: vi.fn((event: string, handler: any) => {
          if (event === 'log') {
            handler({
              message:
                'Stream #0:0: Video: h264, yuv420p, 1280x720, 30 fps\nStream #0:1: Audio: aac, 44100 Hz, stereo',
            });
          }
        }),
        off: vi.fn(),
      };

      const result = await engine.run(
        {
          file: new File(['mock content'], 'test.mkv', { type: 'video/x-matroska' }),
          toolId: 'mkv-to-mp4',
          from: 'mkv',
          to: 'mp4',
          options: {},
        },
        () => {},
        new AbortController().signal,
      );

      expect(execCallCount).toBe(3); // 1 probe + 1 remux (failed) + 1 transcode (fallback)
      expect(result.notes).toContain('Fast copy was incompatible; re-encoded with H.264');
    });

    it('throws UNSUPPORTED_INPUT when extracting audio from silent video', async () => {
      vi.spyOn(engine as any, 'prepare').mockResolvedValue(undefined);
      (engine as any).ff = {
        writeFile: vi.fn().mockResolvedValue(undefined),
        readFile: vi.fn(),
        deleteFile: vi.fn().mockResolvedValue(undefined),
        exec: vi.fn().mockResolvedValue(0),
        on: vi.fn((event: string, handler: any) => {
          if (event === 'log') {
            handler({ message: 'Stream #0:0: Video: h264, yuv420p, 1920x1080, 30 fps' }); // No audio stream!
          }
        }),
        off: vi.fn(),
      };

      await expect(
        engine.run(
          {
            file: new File(['mock content'], 'silent.mp4', { type: 'video/mp4' }),
            toolId: 'mp4-to-mp3',
            from: 'mp4',
            to: 'mp3',
            options: {},
          },
          () => {},
          new AbortController().signal,
        ),
      ).rejects.toMatchObject({
        code: 'UNSUPPORTED_INPUT',
        detail: 'This video file does not contain an audio track to extract.',
      });
    });

    it('ensures video arguments include -map_metadata 0 to preserve rotation tags and orientation', () => {
      const remuxArgs = buildVideoArgs('input.mov', 'output.mp4', 'mp4', {}, {
        ...emptyProbe(),
        hasVideo: true,
        videoCodec: 'h264',
        hasAudio: true,
        audioCodec: 'aac',
      });
      expect(remuxArgs).toContain('-map_metadata');
      expect(remuxArgs).toContain('0');

      const transcodeArgs = buildVideoArgs(
        'input.mov',
        'output.mp4',
        'mp4',
        { 'force-reencode': true },
        {
          ...emptyProbe(),
          hasVideo: true,
          videoCodec: 'hevc',
          hasAudio: true,
          audioCodec: 'aac',
        },
      );
      expect(transcodeArgs).toContain('-map_metadata');
      expect(transcodeArgs).toContain('0');
    });
  });
});
