/**
 * Registry index — the single source of truth.
 * All pages, hubs, sitemap entries, and SEO metadata are generated from here.
 */
import { ToolSchema, FormatSchema } from './schema';
import type { Tool, Format } from './schema';
export type { Tool, Format, ToolRecord, FormatRecord, OptionRecord } from './schema';
import { FORMATS } from './formats';
import imageTools from './tools/image';
import audioTools from './tools/audio';
import videoTools from './tools/video';

// ─── Build & validate all tools ───────────────────────────────────────────────

const ALL_TOOLS_RAW: Tool[] = [...imageTools, ...audioTools, ...videoTools];

function validateRegistry(tools: Tool[]): void {
  const slugs = new Set<string>();
  const ids = new Set<string>();
  const formatIds = new Set(FORMATS.map((f) => f.id));

  // Reserved paths that tool slugs cannot use
  const RESERVED = new Set([
    'image-converter',
    'audio-converter',
    'video-converter',
    'formats',
    'guides',
    'privacy-promise',
    'about',
    'terms',
    'contact',
    'privacy',
    'cookies',
    'sitemap.xml',
    'robots.txt',
    'licences',
    'not-found',
  ]);

  for (const tool of tools) {
    // Zod validation
    const result = ToolSchema.safeParse(tool);
    if (!result.success) {
      throw new Error(
        `Registry validation failed for tool "${tool.id}":\n${result.error.toString()}`,
      );
    }

    // Duplicate checks
    if (ids.has(tool.id)) throw new Error(`Duplicate tool ID: "${tool.id}"`);
    if (slugs.has(tool.slug)) throw new Error(`Duplicate slug: "${tool.slug}"`);
    ids.add(tool.id);
    slugs.add(tool.slug);

    // Reserved path collision
    if (RESERVED.has(tool.slug))
      throw new Error(`Tool slug "${tool.slug}" collides with a reserved path.`);

    // Format existence checks
    for (const fId of tool.from) {
      if (!formatIds.has(fId))
        throw new Error(`Tool "${tool.id}" references unknown "from" format: "${fId}"`);
    }
    if (!formatIds.has(tool.to))
      throw new Error(`Tool "${tool.id}" references unknown "to" format: "${tool.to}"`);
  }

  // Related ID existence
  for (const tool of tools) {
    for (const relId of tool.related) {
      if (!ids.has(relId))
        throw new Error(
          `Tool "${tool.id}" references unknown related tool: "${relId}"`,
        );
    }
  }
}

// Run validation at module load time — build fails on errors
validateRegistry(ALL_TOOLS_RAW);

// ─── Public API ───────────────────────────────────────────────────────────────

/** All tools regardless of status */
export const allTools = (): readonly Tool[] => ALL_TOOLS_RAW;

/**
 * Live tools — used for sitemap, navigation, and static params.
 * Only tools marked 'live' are published and indexed.
 */
export const liveTools = (): readonly Tool[] =>
  ALL_TOOLS_RAW.filter((t) => t.status === 'live');

/** Tools marked ready (verified, candidate for live promotion) */
export const readyTools = (): readonly Tool[] =>
  ALL_TOOLS_RAW.filter((t) => t.status === 'ready');

/** Draft tools scheduled for subsequent waves */
export const draftTools = (): readonly Tool[] =>
  ALL_TOOLS_RAW.filter((t) => t.status === 'draft');

/** Look up a single tool by slug (any status) */
export const getTool = (slug: string): Tool | undefined =>
  ALL_TOOLS_RAW.find((t) => t.slug === slug);

/** Get a live or ready tool by slug or undefined */
export const getLiveTool = (slug: string): Tool | undefined =>
  liveTools().find((t) => t.slug === slug);

/** Live tools for a given department */
export const getToolsByDepartment = (
  dept: 'image' | 'audio' | 'video',
  onlyLive = true,
): readonly Tool[] =>
  (onlyLive ? liveTools() : allTools()).filter((t) => t.department === dept);

/** Helper alias matching existing code */
export const toolsByDepartment = getToolsByDepartment;

/** Live tools for a given wave */
export const toolsByWave = (wave: number): readonly Tool[] =>
  liveTools().filter((t) => t.wave === wave);

/** Get related tools for a given tool or tool ID */
export const getRelatedTools = (toolOrId: Tool | string): readonly Tool[] => {
  const tool = typeof toolOrId === 'string' ? getTool(toolOrId) : toolOrId;
  if (!tool) return [];
  return tool.related
    .map((relId) => getTool(relId))
    .filter((t): t is Tool => t !== undefined);
};

// ─── Format access ────────────────────────────────────────────────────────────

/** Validate formats at load time */
for (const f of FORMATS) {
  const result = FormatSchema.safeParse(f);
  if (!result.success) {
    throw new Error(`Format validation failed for "${f.id}":\n${result.error.toString()}`);
  }
}

export const allFormats = (): readonly Format[] => FORMATS;

export const getFormat = (id: string): Format | undefined =>
  FORMATS.find((f) => f.id === id);

export const requireFormat = (id: string): Format => {
  const f = FORMATS.find((format) => format.id === id);
  if (!f) throw new Error(`Unknown format ID: "${id}"`);
  return f;
};

/** All conversion tools that involve a given format (as input or output) */
export const toolsForFormat = (formatId: string): readonly Tool[] =>
  liveTools().filter((t) => t.from.includes(formatId) || t.to === formatId);

// ─── Hub metadata ─────────────────────────────────────────────────────────────

export type Department = 'image' | 'audio' | 'video';

export const HUBS: Record<
  Department,
  { slug: string; name: string; tagline: string; description: string }
> = {
  image: {
    slug: 'image-converter',
    name: 'Image Converter',
    tagline: 'Convert any image format, free and private.',
    description:
      'Convert HEIC, JPG, PNG, WebP, AVIF, SVG and more — right in your browser. No upload, no signup, no watermark.',
  },
  audio: {
    slug: 'audio-converter',
    name: 'Audio Converter',
    tagline: 'Convert audio files in your browser. Nothing uploaded.',
    description:
      'Convert MP3, WAV, FLAC, OPUS, M4A, OGG and more. Perfect for WhatsApp voice notes, iPhone recordings and music libraries.',
  },
  video: {
    slug: 'video-converter',
    name: 'Video Converter',
    tagline: 'Convert video files privately, no upload needed.',
    description:
      'Convert MOV, MKV, AVI, WebM and more to MP4. Fast stream copy when possible, full transcode when needed. Works on your device.',
  },
};

// ─── Search index entry (built at build time) ─────────────────────────────────

export type SearchEntry = {
  id: string;
  slug: string;
  title: string;
  primary: string;
  related: readonly string[];
  department: string;
};

export const searchIndex = (): SearchEntry[] =>
  liveTools().map((t) => ({
    id: t.id,
    slug: t.slug,
    title: t.seo.title,
    primary: t.seo.primary,
    related: t.seo.related ?? [],
    department: t.department,
  }));
