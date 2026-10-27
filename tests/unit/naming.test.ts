import { describe, it, expect } from 'vitest';
import {
  baseName,
  stripPath,
  outputFileName,
  getSafeOutputName,
  deduplicateNames,
  safeTruncate,
  sanitizeBase,
  formatBytes,
  formatTimeRemaining,
} from '../../engines/shared/naming';

describe('Naming and formatting utilities (Edge Cases & Unicode)', () => {
  it('extracts base name without extension', () => {
    expect(baseName('photo.jpg')).toBe('photo');
    expect(baseName('my.file.name.png')).toBe('my.file.name');
    expect(baseName('noextension')).toBe('noextension');
  });

  it('strips directory paths with stripPath and neutralizes slashes in outputFileName', () => {
    expect(stripPath('../../etc/passwd.jpg')).toBe('passwd.jpg');
    expect(stripPath('C:\\Users\\Arman\\Desktop\\image.png')).toBe('image.png');
    expect(outputFileName('folder/data.heic', 'jpg')).toBe('folder_data.jpg');
  });

  it('builds standard output filenames correctly', () => {
    expect(outputFileName('IMG_001.HEIC', 'jpg')).toBe('IMG_001.jpg');
    expect(outputFileName('clip.mov', '.mp4')).toBe('clip.mp4');
    expect(outputFileName('document.pdf', 'PNG')).toBe('document.png');
  });

  it('preserves Hindi / Devanagari characters cleanly', () => {
    // Hindi photo name: फ़ोटो_२०२६.png
    expect(outputFileName('फ़ोटो_२०२६.png', 'jpg')).toBe('फ़ोटो_२०२६.jpg');
    // Hindi document: दस्तावेज़.pdf
    expect(outputFileName('दस्तावेज़.pdf', 'png')).toBe('दस्तावेज़.png');
    // Hindi audio: गाना.wav
    expect(outputFileName('गाना.wav', 'mp3')).toBe('गाना.mp3');
  });

  it('preserves international Unicode characters (Japanese, Arabic, Accents)', () => {
    expect(outputFileName('写真_東京.heic', 'webp')).toBe('写真_東京.webp');
    expect(outputFileName('ملف_صوتي.opus', 'mp3')).toBe('ملف_صوتي.mp3');
    expect(outputFileName('résumé_café.jpg', 'png')).toBe('résumé_café.png');
  });

  it('replaces dangerous OS characters with safe underscore', () => {
    expect(outputFileName('bad:name/test?.png', 'webp')).toBe('bad_name_test_.webp');
    expect(outputFileName('<secret|pipe*>.jpg', 'png')).toBe('_secret_pipe__.png');
  });

  it('safely truncates excessively long names (>100 chars) preserving Unicode', () => {
    // 120 character name with Hindi characters
    const longBase = 'अ'.repeat(120);
    const truncated = safeTruncate(longBase, 100);
    expect(Array.from(truncated).length).toBe(100);
    expect(outputFileName(`${longBase}.png`, 'jpg')).toBe(`${'अ'.repeat(100)}.jpg`);
  });

  it('deduplicates filenames in a batch', () => {
    const input = ['photo.jpg', 'photo.jpg', 'other.jpg', 'photo.jpg'];
    const result = deduplicateNames(input);
    expect(result).toEqual(['photo.jpg', 'photo_1.jpg', 'other.jpg', 'photo_2.jpg']);
  });

  it('generates safe unique output names avoiding collision with existing batch', () => {
    const existing = new Set(['image.jpg', 'image_1.jpg']);
    const result = getSafeOutputName('image.png', 'jpg', existing);
    expect(result).toBe('image_2.jpg');
  });

  it('formats byte sizes gracefully', () => {
    expect(formatBytes(500)).toBe('500 B');
    expect(formatBytes(1024 * 50)).toBe('50 KB');
    expect(formatBytes(1024 * 1024 * 2.5)).toBe('2.5 MB');
  });

  it('formats estimated time remaining human-readably', () => {
    expect(formatTimeRemaining(5)).toBe('a few seconds');
    expect(formatTimeRemaining(42)).toBe('42 seconds');
    expect(formatTimeRemaining(60)).toBe('1 minute');
    expect(formatTimeRemaining(180)).toBe('3 minutes');
  });
});
