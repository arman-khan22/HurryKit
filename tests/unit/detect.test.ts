import { describe, it, expect } from 'vitest';
import { detectFormat } from '../../engines/shared/detect';

describe('Format detection from magic bytes & extension fallback', () => {
  it('detects PNG from magic bytes even if extension is wrong (.jpg)', async () => {
    // 89 50 4E 47 0D 0A 1A 0A
    const bytes = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    // Named deliberately as photo.jpg
    const file = new File([bytes], 'photo.jpg', { type: 'image/jpeg' });
    const result = await detectFormat(file);

    expect(result).not.toBeNull();
    expect(result?.id).toBe('png');
    expect(result?.confident).toBe(true);
  });

  it('detects JPEG from magic bytes even if extension is wrong (.png)', async () => {
    // FF D8 FF
    const bytes = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]);
    const file = new File([bytes], 'wrong_extension.png', { type: 'image/png' });
    const result = await detectFormat(file);

    expect(result).not.toBeNull();
    expect(result?.id).toBe('jpg');
    expect(result?.confident).toBe(true);
  });

  it('detects MP3 with ID3 header even if named video.mp4', async () => {
    const bytes = new TextEncoder().encode('ID3\x04\x00\x00\x00\x00\x00\x00');
    const file = new File([bytes], 'audio_disguised.mp4');
    const result = await detectFormat(file);

    expect(result).not.toBeNull();
    expect(result?.id).toBe('mp3');
    expect(result?.confident).toBe(true);
  });

  it('detects WebP from RIFF ... WEBP header', async () => {
    const header = new Uint8Array(16);
    // 'RIFF'
    header.set(new TextEncoder().encode('RIFF'), 0);
    // 'WEBP' at offset 8
    header.set(new TextEncoder().encode('WEBP'), 8);
    const file = new File([header], 'graphic.webp', { type: 'image/webp' });
    const result = await detectFormat(file);

    expect(result).not.toBeNull();
    expect(result?.id).toBe('webp');
    expect(result?.confident).toBe(true);
  });

  it('detects GIF89a header', async () => {
    const bytes = new TextEncoder().encode('GIF89a...');
    const file = new File([bytes], 'animation.gif');
    const result = await detectFormat(file);

    expect(result?.id).toBe('gif');
    expect(result?.confident).toBe(true);
  });

  it('detects HEIC from ftyp box', async () => {
    const header = new Uint8Array(32);
    // offset 4: 'ftyp', offset 8: 'heic'
    header.set(new TextEncoder().encode('ftypheic'), 4);
    const file = new File([header], 'IMG_2026.heic');
    const result = await detectFormat(file);

    expect(result?.id).toBe('heic');
    expect(result?.confident).toBe(true);
  });

  it('detects AVIF from ftyp box', async () => {
    const header = new Uint8Array(32);
    header.set(new TextEncoder().encode('ftypavif'), 4);
    const file = new File([header], 'photo.avif');
    const result = await detectFormat(file);

    expect(result?.id).toBe('avif');
    expect(result?.confident).toBe(true);
  });

  it('detects WAV from RIFF ... WAVE', async () => {
    const header = new Uint8Array(16);
    header.set(new TextEncoder().encode('RIFF'), 0);
    header.set(new TextEncoder().encode('WAVE'), 8);
    const file = new File([header], 'recording.wav');
    const result = await detectFormat(file);

    expect(result?.id).toBe('wav');
    expect(result?.confident).toBe(true);
  });

  it('detects MKV vs WebM from EBML header', async () => {
    // 1A 45 DF A3
    const mkvHeader = new Uint8Array([0x1a, 0x45, 0xdf, 0xa3, 0x00, 0x00]);
    const mkvFile = new File([mkvHeader], 'movie.mkv');
    const mkvResult = await detectFormat(mkvFile);
    expect(mkvResult?.id).toBe('mkv');

    const webmHeader = new Uint8Array(32);
    webmHeader.set([0x1a, 0x45, 0xdf, 0xa3], 0);
    webmHeader.set(new TextEncoder().encode('webm'), 20);
    const webmFile = new File([webmHeader], 'clip.webm');
    const webmResult = await detectFormat(webmFile);
    expect(webmResult?.id).toBe('webm');
  });

  it('detects SVG from opening XML/SVG tag', async () => {
    const svgBytes = new TextEncoder().encode('<svg xmlns="http://www.w3.org/2000/svg"></svg>');
    const file = new File([svgBytes], 'icon.svg');
    const result = await detectFormat(file);

    expect(result?.id).toBe('svg');
    expect(result?.confident).toBe(true);
  });

  it('handles uppercase file extension gracefully', async () => {
    const bytes = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    const file = new File([bytes], 'SCREENSHOT.PNG');
    const result = await detectFormat(file);

    expect(result?.id).toBe('png');
    expect(result?.confident).toBe(true);
  });

  it('falls back to extension with confident=false when magic bytes are unknown', async () => {
    const randomBytes = new Uint8Array([0x01, 0x02, 0x03, 0x04, 0x05]);
    const file = new File([randomBytes], 'archive.custom');
    const result = await detectFormat(file);

    expect(result).not.toBeNull();
    expect(result?.id).toBe('custom');
    expect(result?.confident).toBe(false);
  });

  it('returns null for zero-byte empty files', async () => {
    const file = new File([], 'empty.dat');
    const result = await detectFormat(file);
    expect(result).toBeNull();
  });

  it('returns null when format is unknown and has no extension', async () => {
    const randomBytes = new Uint8Array([0x01, 0x02, 0x03, 0x04]);
    const file = new File([randomBytes], 'unknown_binary_without_ext');
    const result = await detectFormat(file);
    expect(result).toBeNull();
  });
});
