import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import {
  allTools,
  liveTools,
  readyTools,
  draftTools,
  allFormats,
  getTool,
  getLiveTool,
  getFormat,
  requireFormat,
  getToolsByDepartment,
  getRelatedTools,
} from '../../registry';

describe('Tool and format registry', () => {
  it('loads all tools without error', () => {
    const tools = allTools();
    expect(tools.length).toBe(55);
  });

  it('validates every live tool has a unique slug, valid engine, and valid contentRef path', () => {
    const live = liveTools();
    expect(live.length).toBeGreaterThan(0);

    const slugs = new Set<string>();
    const formatIds = new Set(allFormats().map((f) => f.id));

    for (const tool of live) {
      // 1. Unique slug
      expect(slugs.has(tool.slug)).toBe(false);
      slugs.add(tool.slug);

      // 2. Valid engine
      expect(['image', 'ffmpeg']).toContain(tool.engine);

      // 3. Valid contentRef path and file existence
      expect(typeof tool.contentRef).toBe('string');
      expect(tool.contentRef.startsWith('tools/')).toBe(true);
      expect(tool.contentRef.endsWith('.md')).toBe(true);
      const contentPath = path.join(process.cwd(), 'content', tool.contentRef);
      expect(fs.existsSync(contentPath)).toBe(true);

      // 4. Formats exist
      for (const from of tool.from) {
        expect(formatIds.has(from)).toBe(true);
      }
      expect(formatIds.has(tool.to)).toBe(true);
    }
  });

  it('marks wave-1 tools as live and later waves as draft', () => {
    const live = liveTools();
    const draft = draftTools();

    expect(live.length).toBe(20);
    expect(draft.length).toBe(35);

    for (const tool of live) {
      expect(tool.wave).toBe(1);
      expect(tool.status).toBe('live');
    }

    for (const tool of draft) {
      expect(tool.wave).toBeGreaterThan(1);
      expect(tool.status).toBe('draft');
    }
  });

  it('can look up tools by slug (any status and live)', () => {
    const heic = getTool('heic-to-jpg');
    expect(heic).toBeDefined();
    expect(heic?.department).toBe('image');
    expect(heic?.from).toContain('heic');
    expect(heic?.to).toBe('jpg');

    const liveHeic = getLiveTool('heic-to-jpg');
    expect(liveHeic).toBeDefined();
    expect(liveHeic?.slug).toBe('heic-to-jpg');
  });

  it('can look up tools by department', () => {
    const imageLive = getToolsByDepartment('image', true);
    const audioLive = getToolsByDepartment('audio', true);
    const videoLive = getToolsByDepartment('video', true);

    expect(imageLive.length).toBe(8);
    expect(audioLive.length).toBe(5);
    expect(videoLive.length).toBe(7);

    const allImage = getToolsByDepartment('image', false);
    expect(allImage.length).toBe(23);
  });

  it('can resolve related tools properly', () => {
    const heic = getTool('heic-to-jpg');
    expect(heic).toBeDefined();
    if (!heic) return;

    const related = getRelatedTools(heic);
    expect(related.length).toBeGreaterThan(0);
    for (const rel of related) {
      expect(rel.id).toBeDefined();
      expect(rel.slug).toBeDefined();
    }
  });

  it('can look up formats by id and throw on unknown formats', () => {
    const jpg = getFormat('jpg');
    expect(jpg).toBeDefined();
    expect(jpg?.name).toBe('JPG');
    expect(jpg?.lossy).toBe(true);

    const required = requireFormat('png');
    expect(required.id).toBe('png');

    expect(() => requireFormat('non-existent-format')).toThrow();
  });
});
