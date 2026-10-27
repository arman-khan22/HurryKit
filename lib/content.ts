import matter from 'gray-matter';
import { marked } from 'marked';
import * as fs from 'fs/promises';
import * as path from 'path';
import type { Tool } from '@/registry/schema';

const CONTENT_DIR = path.join(process.cwd(), 'content');

export type FaqItem = { q: string; a: string };

export type ToolContent = {
  title?: string | undefined;
  intro: string;
  html: string;
  rawMarkdown: string;
  wordCount: number;
  faqs: FaqItem[];
};

/**
 * Load and parse a Markdown content file by its contentRef relative path.
 * Extracts frontmatter, body HTML, raw markdown, word count, and FAQ items.
 */
export async function loadContent(contentRef: string): Promise<ToolContent> {
  const filePath = path.join(CONTENT_DIR, contentRef);

  let raw: string;
  try {
    raw = await fs.readFile(filePath, 'utf-8');
  } catch (err) {
    throw new Error(`Failed to load content file at "${contentRef}": ${(err as Error).message}`);
  }

  const { data, content } = matter(raw);

  // Extract H1 title if present
  const h1Match = content.match(/^#\s+(.+)$/m);
  const title = typeof data['title'] === 'string' ? data['title'] : h1Match?.[1]?.trim();

  // Extract FAQ section: look for ## FAQ or ## Frequently asked questions heading
  const faqRegex = /^## (?:FAQ|Frequently asked questions)[\s\S]*?(?=^## |\Z)/im;
  const faqSection = content.match(faqRegex)?.[0] ?? '';
  const bodyWithoutFaq = content.replace(faqRegex, '').trim();

  const faqs: FaqItem[] = [];

  // 1. Extract from YAML frontmatter if present
  if (Array.isArray(data['faqs'])) {
    for (const item of data['faqs']) {
      if (item && typeof item === 'object' && 'q' in item && 'a' in item) {
        faqs.push({ q: String(item.q), a: String(item.a) });
      }
    }
  }

  // 2. Extract from markdown ### questions in FAQ section
  const qRegex = /^### (.+)\n+([\s\S]*?)(?=^### |\Z)/gim;
  let match;
  while ((match = qRegex.exec(faqSection)) !== null) {
    const q = match[1]?.trim() ?? '';
    const a = match[2]?.trim() ?? '';
    if (!faqs.some((existing) => existing.q === q)) {
      faqs.push({ q, a });
    }
  }

  const html = await marked(bodyWithoutFaq);
  const words = content.trim().split(/\s+/).filter(Boolean);

  return {
    title,
    intro: typeof data['intro'] === 'string' ? data['intro'] : '',
    html,
    rawMarkdown: content,
    wordCount: words.length,
    faqs,
  };
}

/**
 * Load tool content with fallback to placeholder generation for draft tools.
 */
export async function loadToolContent(tool: Tool): Promise<ToolContent> {
  try {
    const content = await loadContent(tool.contentRef);
    if (!content.intro) {
      content.intro = tool.seo.description;
    }
    return content;
  } catch {
    return generatePlaceholder(tool);
  }
}

/**
 * Generate placeholder content for tools that don't have a content file yet.
 */
function generatePlaceholder(tool: Tool): ToolContent {
  const from = tool.from.map((f) => f.toUpperCase()).join(' or ');
  const to = tool.to.toUpperCase();

  const html = `<p>This free ${from} to ${to} converter runs entirely in your browser. Your files are never uploaded to any server — everything happens on your device, in real time.</p>
<h2>How does it work?</h2>
<p>When you drop a ${from} file into the tool above, Hurrykit reads the file locally and converts it using WebAssembly — a technology that lets high-performance code run directly in the browser. The converted file is available to download instantly.</p>
<h2>Is it really private?</h2>
<p>Yes. Open your browser's Network tab, convert a file, and you will see that no file bytes are sent to any server. The only network requests are the page itself and an anonymous usage count.</p>
<h2>What ${from} files can I convert?</h2>
<p>Any valid ${from} file should work. Files with the wrong extension are detected by their actual content, not just the name. If your file is corrupted or incomplete, you will see a clear error message.</p>`;

  const faqs: FaqItem[] = [
    {
      q: `Is ${from} to ${to} conversion really free?`,
      a: `Yes. There is no charge, no signup and no watermark on the converted file. The tool runs locally so there are no server costs to pass on.`,
    },
    {
      q: `How large a file can I convert?`,
      a: `The limit is ${Math.round(tool.limits.maxBytes / (1024 * 1024))} MB per file and ${tool.limits.maxFiles} files per batch. Files approaching the limit show a warning so you can decide whether to continue.`,
    },
    {
      q: `Can I convert multiple files at once?`,
      a: `Yes — you can add up to ${tool.limits.maxFiles} files in one batch. They convert in sequence and you can download them individually or as a ZIP.`,
    },
  ];

  return {
    title: `Convert ${from} to ${to}`,
    intro: tool.seo.description,
    html,
    rawMarkdown: html,
    wordCount: 260,
    faqs,
  };
}
