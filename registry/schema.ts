import { z } from 'zod';

// ─── Option schemas ───────────────────────────────────────────────────────────

const ChoiceSchema = z.object({
  value: z.union([z.string(), z.number()]),
  label: z.string(),
});

export const OptionSchema = z.object({
  id: z.string().regex(/^[a-z][a-z0-9-]*$/),
  label: z.string().min(1),
  type: z.enum(['select', 'slider', 'toggle']),
  choices: z.array(ChoiceSchema).optional(),
  min: z.number().optional(),
  max: z.number().optional(),
  step: z.number().optional(),
  default: z.union([z.string(), z.number(), z.boolean()]),
  help: z.string().optional(),
  advanced: z.boolean().default(false),
  /** Applies only to these output formats; omit to apply to all */
  appliesTo: z.array(z.string()).optional(),
});

// ─── Limits ───────────────────────────────────────────────────────────────────

export const LimitsSchema = z.object({
  /** Hard block: file cannot be processed */
  maxBytes: z.number().int().positive(),
  /** Soft warn: allow but show a warning */
  warnBytes: z.number().int().positive(),
  /** Maximum files in one batch */
  maxFiles: z.number().int().positive(),
});

// ─── SEO ──────────────────────────────────────────────────────────────────────

export const SeoSchema = z.object({
  /** Primary search phrase (lowercase, as typed) */
  primary: z.string().min(1),
  /** Page <title> — target ~60 chars */
  title: z.string().min(10).max(70),
  /** Meta description — target ~155 chars */
  description: z.string().min(50).max(165),
  /** Additional related phrases for the search index */
  related: z.array(z.string()).optional(),
});

// ─── Tool record ──────────────────────────────────────────────────────────────

export const ToolSchema = z.object({
  /** Stable internal ID — never changes once live */
  id: z.string().regex(/^[a-z0-9-]+$/),
  /** URL path segment: /heic-to-jpg */
  slug: z.string().regex(/^[a-z0-9-]+$/),
  kind: z.literal('convert'),
  department: z.enum(['image', 'audio', 'video']),
  /** Accepted input format IDs */
  from: z.array(z.string()).min(1),
  /** Target output format ID */
  to: z.string().min(1),
  engine: z.enum(['image', 'ffmpeg']),
  /** Named strategy inside the engine */
  strategy: z.string().min(1),
  options: z.array(OptionSchema),
  limits: LimitsSchema,
  seo: SeoSchema,
  /** Path to the Markdown content file (relative to content/) */
  contentRef: z.string().min(1),
  /** Hand-picked related tool IDs */
  related: z.array(z.string()),
  /** SEO release wave: 1 = first release */
  wave: z.number().int().min(1).max(3),
  status: z.enum(['draft', 'ready', 'live']),
  /** Developer notes: browser quirks, known issues */
  notes: z.string().optional(),
});

// ─── Format record ────────────────────────────────────────────────────────────

export const FormatSchema = z.object({
  id: z.string().regex(/^[a-z0-9]+$/),
  name: z.string(),
  extensions: z.array(z.string()),
  mime: z.array(z.string()),
  kind: z.enum(['image', 'audio', 'video']),
  lossy: z.boolean(),
  /** Which engines can read this format */
  canRead: z.array(z.enum(['image', 'ffmpeg', 'browser'])),
  /** Which engines can write this format */
  canWrite: z.array(z.enum(['image', 'ffmpeg', 'browser'])),
  notes: z.string().optional(),
  /** Path to the format page Markdown content */
  contentRef: z.string().optional(),
});

// ─── Inferred types ───────────────────────────────────────────────────────────

export type Option = z.infer<typeof OptionSchema>;
export type Limits = z.infer<typeof LimitsSchema>;
export type Seo = z.infer<typeof SeoSchema>;
export type Tool = z.infer<typeof ToolSchema>;
export type Format = z.infer<typeof FormatSchema>;

// Aliases matching specification naming
export const ToolRecordSchema = ToolSchema;
export const FormatRecordSchema = FormatSchema;
export const OptionRecordSchema = OptionSchema;

export type ToolRecord = Tool;
export type FormatRecord = Format;
export type OptionRecord = Option;

