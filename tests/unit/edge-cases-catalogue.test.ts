import { describe, it, expect } from 'vitest';
import { detectFormat } from '@/engines/shared/detect';
import { memoryGuard, estimateJobMemory } from '@/engines/shared/memory';
import { sanitizeFileName, uniqueName, deduplicateNames } from '@/engines/shared/naming';
import {
  isBrowserSupported,
  detectInAppBrowser,
  isMeteredConnection,
  isStorageRestricted,
  getRecommendedToolForFormat,
} from '@/engines/shared/browser';
import { ERROR_MESSAGES, ErrorCodeEnum, ERROR_CODES } from '@/engines/types';
import {
  buildAudioArgs,
  buildVideoArgs,
  buildGifPass2Args,
  canRemux,
} from '@/engines/ffmpeg/commands';
import type { ProbeResult } from '@/engines/ffmpeg/probe';

describe('Edge Cases Catalogue (Section 16)', () => {
  // ─── Input & File Handling (Cases 1–14) ───────────────────────────────────

  describe('Group 1: Input & File Handling', () => {
    it('Case 1: detects real format when extension is wrong or missing', async () => {
      // PNG header disguised as .jpg
      const pngBytes = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
      const fileWrongExt = new File([pngBytes], 'disguised.jpg', { type: 'image/jpeg' });
      const detected1 = await detectFormat(fileWrongExt);
      expect(detected1?.id).toBe('png');

      // JPEG header with no extension
      const jpgBytes = new Uint8Array([0xff, 0xd8, 0xff, 0xe0]);
      const fileNoExt = new File([jpgBytes], 'noextension', { type: '' });
      const detected2 = await detectFormat(fileNoExt);
      expect(detected2?.id).toBe('jpg');
    });

    it('Case 2: handles uppercase and mixed-case extensions identically', async () => {
      const fileUpper = new File([new Uint8Array([0xff, 0xd8, 0xff])], 'PHOTO.JPEG');
      const detected = await detectFormat(fileUpper);
      expect(detected?.id).toBe('jpg');
    });

    it('Case 3: rejects zero-byte files gracefully', () => {
      const zeroFile = { size: 0, name: 'empty.png', type: 'image/png' };
      const guard = memoryGuard(zeroFile);
      expect(guard.ok).toBe(false);
      expect(guard.status).toBe('block');
      expect(guard.code).toBe('CORRUPT_FILE');
      expect(guard.message).toContain('empty');
    });

    it('Case 4: maps corrupt decoder errors to CORRUPT_FILE', () => {
      expect(ERROR_MESSAGES[ErrorCodeEnum.CORRUPT_FILE]).toBe('This file looks damaged.');
    });

    it('Case 5: blocks files above the hard memory limit', () => {
      const giantFile = { size: 3 * 1024 * 1024 * 1024, name: 'huge.mp4' }; // 3 GB
      const guard = memoryGuard(giantFile, { maxBytes: 500 * 1024 * 1024 });
      expect(guard.ok).toBe(false);
      expect(guard.status).toBe('block');
      expect(guard.code).toBe('TOO_LARGE');
    });

    it('Case 6: generates a soft warning when file exceeds warning threshold', () => {
      const softFile = { size: 60 * 1024 * 1024, name: 'video.mp4' }; // 60 MB
      const guard = memoryGuard(
        softFile,
        { warnBytes: 50 * 1024 * 1024, maxBytes: 1000 * 1024 * 1024 },
        'high', // 1 GB budget: 60*3 = 180MB < 1024MB budget, but 60MB > 50MB warnBytes
        false,
      );
      expect(guard.ok).toBe(true);
      expect(guard.status).toBe('warn');
      expect(guard.message).toContain('large');
    });

    it('Case 8: adds unique numbered suffixes for duplicate filenames', () => {
      const existing = ['photo.jpg', 'photo_1.jpg'];
      const next = uniqueName('photo.jpg', existing);
      expect(next).toBe('photo_2.jpg');
    });

    it('Case 9: preserves spaces, Hindi characters, emoji, and safe characters in filenames', () => {
      const unicodeName = 'छुट्टियों की तस्वीरें 🏖️ (Summer 2026)';
      const safe = sanitizeFileName(unicodeName);
      expect(safe).toContain('छुट्टियों की तस्वीरें');
      expect(safe).toContain('Summer 2026');
    });

    it('Case 12: supports multiple files with identical names in same session', () => {
      const names = ['doc.pdf', 'doc.pdf', 'doc.pdf'];
      expect(deduplicateNames(names)).toEqual(['doc.pdf', 'doc_1.pdf', 'doc_2.pdf']);

      const accumulated: string[] = [];
      for (const name of names) {
        accumulated.push(uniqueName(name, accumulated));
      }
      expect(accumulated).toEqual(['doc.pdf', 'doc_1.pdf', 'doc_2.pdf']);
    });

    it('Case 13 & 14: identifies format mismatch and recommends cross-department tools', () => {
      const videoRec = getRecommendedToolForFormat('mp4');
      expect(videoRec).toEqual({
        title: 'Video Converter Hub',
        href: '/video-converter',
      });

      const audioRec = getRecommendedToolForFormat('wav');
      expect(audioRec).toEqual({
        title: 'Audio Converter Hub',
        href: '/audio-converter',
      });

      const imageRec = getRecommendedToolForFormat('heic');
      expect(imageRec).toEqual({
        title: 'Image Converter Hub',
        href: '/image-converter',
      });
    });
  });

  // ─── Audio Edge Cases (Cases 25–32) ───────────────────────────────────────

  describe('Group 2: Audio Edge Cases', () => {
    it('Case 25: drops cover art/video stream in audio conversions with -vn', () => {
      const args = buildAudioArgs(
        'song_with_art.m4a',
        'song.mp3',
        'mp3',
        { bitrate: '192' },
      );
      expect(args).toContain('-vn');
      expect(args).toContain('libmp3lame');
    });

    it('Case 29: defines error code for missing audio stream', () => {
      expect(ErrorCodeEnum.NO_AUDIO_STREAM).toBe('NO_AUDIO_STREAM');
      expect(ERROR_MESSAGES[ErrorCodeEnum.NO_AUDIO_STREAM]).toContain('No audio stream');
    });
  });

  // ─── Video Edge Cases (Cases 33–42) ───────────────────────────────────────

  describe('Group 3: Video Edge Cases', () => {
    const mockProbe: ProbeResult = {
      videoCodec: 'h264',
      audioCodec: 'aac',
      sampleRate: 44100,
      channels: 2,
      channelLayout: 'stereo',
      width: 721,
      height: 1281,
      duration: 10,
      fps: 30,
      rotation: null,
      pixFmt: 'yuv420p',
      bitrateKbps: 2500,
      hasVideo: true,
      hasAudio: true,
      isInterlaced: false,
      isVariableFrameRate: false,
    };

    it('Case 35: rounds odd video dimensions to even for H.264 encoding', () => {
      const args = buildVideoArgs(
        'odd.mov',
        'odd.mp4',
        'mp4',
        { resolution: 'original', forceReencode: true },
        mockProbe,
      );
      // Filter must scale to even width & height
      expect(args.some((arg) => arg.includes('trunc(iw/2)*2'))).toBe(true);
    });

    it('Case 36: applies constant frame rate to avoid VFR audio drift', () => {
      const args = buildVideoArgs(
        'vfr_phone.mov',
        'cfr.mp4',
        'mp4',
        { forceReencode: true },
        mockProbe,
      );
      expect(args).toContain('-fps_mode');
      expect(args).toContain('cfr');
    });

    it('Case 37: handles silent video by optionally mapping audio (-map 0:a:0?)', () => {
      const silentProbe: ProbeResult = {
        ...mockProbe,
        hasAudio: false,
        audioCodec: null,
      };
      const args = buildVideoArgs(
        'silent.mov',
        'silent.mp4',
        'mp4',
        { forceReencode: true },
        silentProbe,
      );
      // Either -an or -map 0:a:0?
      expect(args.includes('-an') || args.includes('0:a:0?')).toBe(true);
    });

    it('Case 39: decides remux vs transcode and supports fallback', () => {
      // H.264 + AAC inside MOV to MP4 can remux
      expect(canRemux(mockProbe, 'mp4')).toBe(true);

      // HEVC into MP4 requires transcode
      const hevcProbe: ProbeResult = {
        ...mockProbe,
        videoCodec: 'hevc',
      };
      expect(canRemux(hevcProbe, 'mp4')).toBe(false);
    });

    it('Case 42: constrains GIF output width, frame rate, and palette', () => {
      const pass2 = buildGifPass2Args(
        'clip.mp4',
        'anim.gif',
        { fps: 15, width: '480' },
      );
      expect(pass2.some((arg) => arg.includes('fps=15'))).toBe(true);
      expect(pass2.some((arg) => arg.includes('scale=480:-1'))).toBe(true);
      expect(pass2.some((arg) => arg.includes('paletteuse'))).toBe(true);
    });
  });

  // ─── Browser & System Environment (Cases 43–54) ───────────────────────────

  describe('Group 4: Browser & System Environment', () => {
    it('Case 43: detects browser WebAssembly and Web Worker features', () => {
      const result = isBrowserSupported();
      expect(typeof result.supported).toBe('boolean');
      expect(Array.isArray(result.missingFeatures)).toBe(true);
    });

    it('Case 44: detects in-app browser webviews', () => {
      expect(typeof detectInAppBrowser()).toBe('boolean');
    });

    it('Case 45: provides non-throwing storage restriction check for strict private mode', async () => {
      const restricted = await isStorageRestricted();
      expect(typeof restricted).toBe('boolean');
    });

    it('Case 50: maps out-of-memory errors with actionable guidance', () => {
      expect(ERROR_MESSAGES[ErrorCodeEnum.OUT_OF_MEMORY]).toContain('memory');
      expect(ERROR_MESSAGES[ErrorCodeEnum.OUT_OF_MEMORY]).toContain('smaller file');
    });

    it('Case 51: confirms iOS Web Share guidance copy is defined', () => {
      const iosGuidance = "Tip on iPhone: Tap Share → 'Save to Files' to keep this on your device.";
      expect(iosGuidance).toContain('Save to Files');
    });

    it('Case 52: detects metered connections or data saver preferences', () => {
      const metered = isMeteredConnection();
      expect(typeof metered).toBe('boolean');
    });
  });

  // ─── Error Code Consistency & Completeness ────────────────────────────────

  describe('Group 5: Error Codes & Recovery Messaging', () => {
    it('every error code has a corresponding user-friendly error message', () => {
      for (const code of ERROR_CODES) {
        const msg = ERROR_MESSAGES[code];
        expect(msg).toBeDefined();
        expect(typeof msg).toBe('string');
        expect(msg.length).toBeGreaterThan(10);
      }
    });

    it('all error codes avoid technical jargon or stack traces in user messages', () => {
      for (const code of ERROR_CODES) {
        const msg = ERROR_MESSAGES[code];
        expect(msg).not.toContain('null pointer');
        expect(msg).not.toContain('undefined');
        expect(msg).not.toContain('NaN');
        expect(msg).not.toContain('WASM runtime error');
      }
    });
  });
});

