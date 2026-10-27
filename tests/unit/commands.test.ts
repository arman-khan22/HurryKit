import { describe, it, expect } from 'vitest';
import {
  buildAudioArgs,
  buildExtractAudioArgs,
  buildVideoArgs,
  buildGifPass2Args,
  buildHevcArgs,
} from '../../engines/ffmpeg/commands';
import { emptyProbe, type ProbeResult } from '../../engines/ffmpeg/probe';

describe('FFmpeg command builders', () => {
  describe('Audio conversions', () => {
    it('builds MP3 command with bitrate', () => {
      const args = buildAudioArgs('input.wav', 'output.mp3', 'mp3', { bitrate: 256 });
      expect(args).toContain('libmp3lame');
      expect(args).toContain('-b:a');
      expect(args).toContain('256k');
      expect(args).toContain('-vn');
      expect(args[args.length - 1]).toBe('output.mp3');
    });

    it('builds M4A command with AAC and faststart', () => {
      const args = buildAudioArgs('input.mp3', 'output.m4a', 'm4a', { bitrate: 192 });
      expect(args).toContain('aac');
      expect(args).toContain('-movflags');
      expect(args).toContain('+faststart');
      expect(args).toContain('192k');
    });

    it('builds WAV command with custom bitdepth', () => {
      const args = buildAudioArgs('input.flac', 'output.wav', 'wav', { bitdepth: 'pcm_s24le' });
      expect(args).toContain('pcm_s24le');
    });

    it('builds FLAC command with compression level', () => {
      const args = buildAudioArgs('input.wav', 'output.flac', 'flac', { compression: 8 });
      expect(args).toContain('flac');
      expect(args).toContain('-compression_level');
      expect(args).toContain('8');
    });

    it('builds OGG command with Vorbis quality', () => {
      const args = buildAudioArgs('input.mp3', 'output.ogg', 'ogg', { quality: 7 });
      expect(args).toContain('libvorbis');
      expect(args).toContain('-q:a');
      expect(args).toContain('7');
    });

    it('builds OPUS command with bitrate', () => {
      const args = buildAudioArgs('input.wav', 'output.opus', 'opus', { bitrate: 128 });
      expect(args).toContain('libopus');
      expect(args).toContain('128k');
    });

    it('builds AIFF command with 16-bit big-endian PCM', () => {
      const args = buildAudioArgs('input.wav', 'output.aiff', 'aiff', {});
      expect(args).toContain('pcm_s16be');
    });
  });

  describe('Audio extraction', () => {
    it('extracts MP3 audio track from video with -vn', () => {
      const args = buildExtractAudioArgs('input.mp4', 'output.mp3', 'mp3', { bitrate: 320 });
      expect(args).toContain('-vn');
      expect(args).toContain('libmp3lame');
      expect(args).toContain('320k');
    });

    it('extracts WAV audio track from video', () => {
      const args = buildExtractAudioArgs('input.mov', 'output.wav', 'wav', {});
      expect(args).toContain('-vn');
      expect(args).toContain('pcm_s16le');
    });
  });

  describe('Video strategies', () => {
    const probeH264: ProbeResult = {
      ...emptyProbe(),
      hasVideo: true,
      videoCodec: 'h264',
      hasAudio: true,
      audioCodec: 'aac',
      pixFmt: 'yuv420p',
      width: 1920,
      height: 1080,
    };

    it('uses stream-copy remux for compatible H.264/AAC input into MP4', () => {
      const args = buildVideoArgs('input.mkv', 'output.mp4', 'mp4', {}, probeH264);
      expect(args).toContain('-c');
      expect(args).toContain('copy');
      expect(args).toContain('+faststart');
      expect(args).not.toContain('libx264');
    });

    it('forces re-encode when forceReencode option is enabled', () => {
      const args = buildVideoArgs('input.mkv', 'output.mp4', 'mp4', { forceReencode: true }, probeH264);
      expect(args).toContain('libx264');
      expect(args).toContain('-preset');
      expect(args).toContain('veryfast');
      expect(args).toContain('yuv420p');
    });

    it('strips audio when audio option is set to remove', () => {
      const args = buildVideoArgs('input.mov', 'output.mp4', 'mp4', { audio: 'remove' }, probeH264);
      expect(args).toContain('-an');
    });

    it('applies yadif deinterlacing filter for interlaced video', () => {
      const interlacedProbe: ProbeResult = {
        ...probeH264,
        isInterlaced: true,
      };
      const args = buildVideoArgs('input.avi', 'output.mp4', 'mp4', {}, interlacedProbe);
      expect(args).toContain('-vf');
      const vfIndex = args.indexOf('-vf');
      expect(args[vfIndex + 1]).toContain('yadif');
    });

    it('builds WebM command with VP9 and Opus', () => {
      const args = buildVideoArgs('input.mp4', 'output.webm', 'webm', { quality: 'high' }, probeH264);
      expect(args).toContain('libvpx-vp9');
      expect(args).toContain('libopus');
      expect(args).toContain('-row-mt');
    });

    it('builds two-pass GIF palette generation and application commands', () => {
      const pass1 = buildVideoArgs('input.mp4', 'output.gif', 'gif', { width: 360, fps: 15 }, probeH264);
      expect(pass1.join(' ')).toContain('palettegen');
      expect(pass1).toContain('palette.png');

      const pass2 = buildGifPass2Args('input.mp4', 'output.gif', { width: 360, fps: 15 });
      expect(pass2.join(' ')).toContain('paletteuse');
      expect(pass2).toContain('palette.png');
      expect(pass2[pass2.length - 1]).toBe('output.gif');
    });

    it('builds HEVC to H.264 transcode command', () => {
      const args = buildHevcArgs('input.mp4', 'output.mp4', { quality: 'small' });
      expect(args).toContain('libx264');
      expect(args).toContain('-crf');
      expect(args).toContain('28');
      expect(args).toContain('+faststart');
    });
  });
});
