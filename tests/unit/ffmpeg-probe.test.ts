import { describe, it, expect } from 'vitest';
import {
  parseProbe,
  canRemux,
  emptyProbe,
  formatDuration,
} from '../../engines/ffmpeg/probe';

describe('FFmpeg probe parser & remux analyzer', () => {
  const h264AacLog = `
Input #0, mov,mp4,m4a,3gp,3g2,mj2, from 'input.mp4':
  Metadata:
    major_brand     : isom
    minor_version   : 512
    compatible_brands: isomiso2avc1mp41
    encoder         : Lavf58.76.100
  Duration: 00:01:23.45, start: 0.000000, bitrate: 1542 kb/s
  Stream #0:0[0x1](und): Video: h264 (High) (avc1 / 0x31637661), yuv420p(tv, bt709, progressive), 1920x1080 [SAR 1:1 DAR 16:9], 1400 kb/s, 29.97 fps, 30 tbr, 15360 tbn (default)
    Metadata:
      handler_name    : VideoHandler
      vendor_id       : [0][0][0][0]
    Side data:
      displaymatrix: rotation of -90.00 degrees
  Stream #0:1[0x2](eng): Audio: aac (LC) (mp4a / 0x6134706D), 48000 Hz, stereo, fltp, 128 kb/s (default)
`;

  it('correctly parses H.264 video with AAC audio stream metadata', () => {
    const probe = parseProbe(h264AacLog);
    expect(probe.hasVideo).toBe(true);
    expect(probe.videoCodec).toBe('h264');
    expect(probe.hasAudio).toBe(true);
    expect(probe.audioCodec).toBe('aac');
    expect(probe.width).toBe(1920);
    expect(probe.height).toBe(1080);
    expect(probe.fps).toBe(29.97);
    expect(probe.duration).toBe(83.45);
    expect(probe.bitrateKbps).toBe(1542);
    expect(probe.pixFmt).toBe('yuv420p');
    expect(probe.rotation).toBe(-90);
    expect(probe.isInterlaced).toBe(false);
  });

  it('detects interlaced video correctly (tff / bff)', () => {
    const interlacedLog = `
  Duration: 00:00:10.00, start: 0.000000, bitrate: 5000 kb/s
  Stream #0:0: Video: mpeg2video (Main), yuv420p(tv, top first, tff), 720x576 [SAR 16:15 DAR 4:3], 25 fps
`;
    const probe = parseProbe(interlacedLog);
    expect(probe.hasVideo).toBe(true);
    expect(probe.videoCodec).toBe('mpeg2video');
    expect(probe.isInterlaced).toBe(true);
  });

  it('detects variable framerate (VFR) correctly', () => {
    const vfrLog = `
  Duration: 00:00:15.00, start: 0.000000, bitrate: 2000 kb/s
  Stream #0:0: Video: h264 (High), yuv420p, 1280x720, VFR, 60 fps
`;
    const probe = parseProbe(vfrLog);
    expect(probe.isVariableFrameRate).toBe(true);
  });

  it('parses audio-only file metadata', () => {
    const audioLog = `
Input #0, mp3, from 'input.mp3':
  Duration: 00:03:45.12, start: 0.000000, bitrate: 320 kb/s
  Stream #0:0: Audio: mp3, 44100 Hz, stereo, fltp, 320 kb/s
`;
    const probe = parseProbe(audioLog);
    expect(probe.hasVideo).toBe(false);
    expect(probe.videoCodec).toBeNull();
    expect(probe.hasAudio).toBe(true);
    expect(probe.audioCodec).toBe('mp3');
    expect(probe.duration).toBe(225.12);
  });

  it('evaluates remux eligibility for MP4 container', () => {
    const goodProbe = parseProbe(h264AacLog);
    expect(canRemux(goodProbe, 'mp4')).toBe(true);

    const vp9Probe = {
      ...emptyProbe(),
      hasVideo: true,
      videoCodec: 'vp9',
      hasAudio: true,
      audioCodec: 'opus',
      pixFmt: 'yuv420p',
    };
    expect(canRemux(vp9Probe, 'mp4')).toBe(false);

    const interlacedProbe = {
      ...goodProbe,
      isInterlaced: true,
    };
    expect(canRemux(interlacedProbe, 'mp4')).toBe(false);

    const hdrProbe = {
      ...goodProbe,
      pixFmt: 'yuv420p10le', // 10-bit color requires transcode to 8-bit yuv420p
    };
    expect(canRemux(hdrProbe, 'mp4')).toBe(false);
  });

  it('formats duration into human-readable strings', () => {
    expect(formatDuration(null)).toBe('0:00');
    expect(formatDuration(45)).toBe('0:45');
    expect(formatDuration(83.45)).toBe('1:23');
    expect(formatDuration(3665)).toBe('1:01:05');
  });
});
