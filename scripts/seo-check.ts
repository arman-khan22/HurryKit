import * as fs from 'fs';
import * as path from 'path';
import matter from 'gray-matter';
import { liveTools, HUBS } from '../registry';

console.log('--- Running Hurrykit Comprehensive SEO & Content Audit ---');

let errors = 0;
let warnings = 0;

const tools = liveTools();
const titles = new Set<string>();
const descriptions = new Set<string>();
const h1s = new Set<string>();

const CONTENT_DIR = path.join(process.cwd(), 'content');
const GUIDES_DIR = path.join(process.cwd(), 'content', 'guides');

// ─── 1. Tool Pages Audit ──────────────────────────────────────────────────────

console.log(`\nAuditing ${tools.length} live tool pages...`);

for (const tool of tools) {
  // Title uniqueness & length
  if (titles.has(tool.seo.title)) {
    console.error(`[ERROR] Duplicate SEO title: "${tool.seo.title}" (Tool: ${tool.id})`);
    errors++;
  }
  titles.add(tool.seo.title);

  if (tool.seo.title.length < 15 || tool.seo.title.length > 75) {
    console.warn(`[WARN] Title length (${tool.seo.title.length}) out of ideal range [15-75]: "${tool.seo.title}"`);
    warnings++;
  }

  // Description uniqueness & length
  if (descriptions.has(tool.seo.description)) {
    console.error(`[ERROR] Duplicate SEO description in tool "${tool.id}"`);
    errors++;
  }
  descriptions.add(tool.seo.description);

  if (tool.seo.description.length < 50 || tool.seo.description.length > 175) {
    console.warn(`[WARN] Description length (${tool.seo.description.length}) out of ideal range [50-175]: Tool ${tool.id}`);
    warnings++;
  }

  // Primary keyword
  if (!tool.seo.primary) {
    console.error(`[ERROR] Missing primary keyword for tool: ${tool.id}`);
    errors++;
  }

  // Content file existence
  const filePath = path.join(CONTENT_DIR, tool.contentRef);
  if (!fs.existsSync(filePath)) {
    console.error(`[ERROR] Missing content file "${tool.contentRef}" for tool: ${tool.id}`);
    errors++;
    continue;
  }

  const raw = fs.readFileSync(filePath, 'utf-8');
  const { data, content } = matter(raw);

  // Unique H1 heading check
  const h1Match = content.match(/^#\s+(.+)$/m);
  if (!h1Match || !h1Match[1]?.trim()) {
    console.error(`[ERROR] Missing H1 heading in "${tool.contentRef}" for tool: ${tool.id}`);
    errors++;
  } else {
    const h1 = h1Match[1].trim();
    if (h1s.has(h1)) {
      console.error(`[ERROR] Duplicate H1 heading: "${h1}" in "${tool.contentRef}"`);
      errors++;
    }
    h1s.add(h1);
  }

  // Thin content check (≥ 250 words)
  const words = content.trim().split(/\s+/).filter(Boolean);
  if (words.length < 250) {
    console.error(
      `[ERROR] Thin content detected: "${tool.contentRef}" has ${words.length} words (minimum required: 250 words).`
    );
    errors++;
  }

  // FAQ section check
  const hasFaq = Boolean(
    (Array.isArray(data['faqs']) && data['faqs'].length > 0) ||
      content.match(/^##\s*(?:FAQ|Frequently asked questions)/im)
  );
  if (!hasFaq) {
    console.error(`[ERROR] Missing FAQ section in "${tool.contentRef}" for tool: ${tool.id}`);
    errors++;
  }
}

// ─── 2. Department Hub Pages Audit ────────────────────────────────────────────

console.log('\nAuditing Department Hub pages...');

for (const hub of Object.values(HUBS)) {
  const hubTitle = `${hub.name} — Free, No Upload | Hurrykit`;
  if (titles.has(hubTitle)) {
    console.error(`[ERROR] Duplicate Hub SEO title: "${hubTitle}"`);
    errors++;
  }
  titles.add(hubTitle);

  if (descriptions.has(hub.description)) {
    console.error(`[ERROR] Duplicate Hub SEO description: "${hub.description}"`);
    errors++;
  }
  descriptions.add(hub.description);

  if (h1s.has(hub.name)) {
    console.error(`[ERROR] Duplicate Hub H1: "${hub.name}"`);
    errors++;
  }
  h1s.add(hub.name);
}

// ─── 3. Static Trust & Legal Pages Audit ──────────────────────────────────────

console.log('\nAuditing Static Trust & Legal pages...');

const staticPages = [
  { name: 'Home', path: 'app/page.tsx', defaultH1: 'Free In-Browser File Converter' },
  { name: 'Privacy Promise', path: 'app/privacy-promise/page.tsx', defaultH1: 'Our Privacy Promise' },
  { name: 'About', path: 'app/about/page.tsx', defaultH1: 'About Hurrykit' },
  { name: 'Terms of Service', path: 'app/terms/page.tsx', defaultH1: 'Terms of Service' },
  { name: 'Contact', path: 'app/contact/page.tsx', defaultH1: 'Contact Hurrykit' },
  { name: 'Privacy Policy', path: 'app/privacy/page.tsx', defaultH1: 'Privacy Policy' },
  { name: 'Cookies', path: 'app/cookies/page.tsx', defaultH1: 'Cookie Policy' },
  { name: 'Licences', path: 'app/licences/page.tsx', defaultH1: 'Open Source Licences' },
];

for (const sp of staticPages) {
  const fullPath = path.join(process.cwd(), sp.path);
  if (!fs.existsSync(fullPath)) {
    console.error(`[ERROR] Missing page file for ${sp.name}: ${sp.path}`);
    errors++;
    continue;
  }

  const src = fs.readFileSync(fullPath, 'utf-8');

  // Verify H1 presence
  const hasH1 = src.includes('<h1') || src.includes('# ');
  if (!hasH1) {
    console.error(`[ERROR] Missing <h1> in static page: ${sp.name} (${sp.path})`);
    errors++;
  }

  if (h1s.has(sp.defaultH1)) {
    console.error(`[ERROR] Duplicate static H1: "${sp.defaultH1}"`);
    errors++;
  }
  h1s.add(sp.defaultH1);
}

// ─── 4. Guides Audit ──────────────────────────────────────────────────────────

console.log('\nAuditing Guides...');

if (fs.existsSync(GUIDES_DIR)) {
  const guideFiles = fs.readdirSync(GUIDES_DIR).filter((f) => f.endsWith('.md'));
  for (const gf of guideFiles) {
    const raw = fs.readFileSync(path.join(GUIDES_DIR, gf), 'utf-8');
    const { data, content } = matter(raw);

    const title = data['title'];
    if (!title || typeof title !== 'string') {
      console.error(`[ERROR] Missing title in frontmatter of guide: ${gf}`);
      errors++;
    } else {
      if (titles.has(title)) {
        console.error(`[ERROR] Duplicate guide title: "${title}" in ${gf}`);
        errors++;
      }
      titles.add(title);
    }

    const desc = data['description'];
    if (!desc || typeof desc !== 'string') {
      console.error(`[ERROR] Missing description in frontmatter of guide: ${gf}`);
      errors++;
    } else {
      if (descriptions.has(desc)) {
        console.error(`[ERROR] Duplicate guide description in ${gf}`);
        errors++;
      }
      descriptions.add(desc);
    }

    // Word count check on guides
    const words = content.trim().split(/\s+/).filter(Boolean);
    if (words.length < 200) {
      console.error(`[ERROR] Thin guide detected: "${gf}" has only ${words.length} words.`);
      errors++;
    }
  }
}

// ─── 5. Summary ───────────────────────────────────────────────────────────────

console.log('\n========================================');
console.log(`Audited: ${tools.length} tools, 3 hubs, 8 static pages, guides`);
console.log(`Unique SEO Titles tracked: ${titles.size}`);
console.log(`Unique Meta Descriptions tracked: ${descriptions.size}`);
console.log(`Unique H1 Headings tracked: ${h1s.size}`);
console.log(`Errors: ${errors}, Warnings: ${warnings}`);
console.log('========================================');

if (errors > 0) {
  console.error('\n❌ SEO Check FAILED with errors.');
  process.exit(1);
} else {
  console.log('\n✓ Every live page passed all SEO, uniqueness, H1, and content checks successfully!');
}
