import * as fs from 'fs';
import * as path from 'path';
import { liveTools, allFormats, HUBS } from '../registry';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://hurrykit.com';
const outPath = path.join(process.cwd(), 'public', 'sitemap.xml');

console.log('--- Generating Standalone sitemap.xml ---');

const urls: { loc: string; lastmod: string; changefreq: string; priority: string }[] = [];
const today = new Date().toISOString().split('T')[0]!;

// Home
urls.push({ loc: SITE_URL, lastmod: today, changefreq: 'daily', priority: '1.0' });

// Hubs
for (const hub of Object.values(HUBS)) {
  urls.push({ loc: `${SITE_URL}/${hub.slug}`, lastmod: today, changefreq: 'weekly', priority: '0.9' });
}

// Live Tools
for (const tool of liveTools()) {
  urls.push({
    loc: `${SITE_URL}/${tool.slug}`,
    lastmod: today,
    changefreq: 'weekly',
    priority: tool.wave === 1 ? '0.9' : '0.8',
  });
}

// Formats
for (const f of allFormats()) {
  urls.push({ loc: `${SITE_URL}/formats/${f.id}`, lastmod: today, changefreq: 'monthly', priority: '0.7' });
}

// Guides
const guides = [
  'how-to-convert-heic-on-windows',
  'how-to-convert-mov-to-mp4',
  'whatsapp-voice-notes-to-mp3',
];
for (const slug of guides) {
  urls.push({ loc: `${SITE_URL}/guides/${slug}`, lastmod: today, changefreq: 'monthly', priority: '0.6' });
}

// Static pages
const staticPages = [
  'privacy-promise',
  'about',
  'contact',
  'privacy',
  'terms',
  'cookies',
  'licences',
];
for (const p of staticPages) {
  urls.push({
    loc: `${SITE_URL}/${p}`,
    lastmod: today,
    changefreq: 'monthly',
    priority: p === 'privacy-promise' ? '0.8' : '0.5',
  });
}

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (u) => `  <url>
    <loc>${u.loc}</loc>
    <lastmod>${u.lastmod}</lastmod>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`,
  )
  .join('\n')}
</urlset>
`;

fs.writeFileSync(outPath, xml, 'utf-8');
console.log(`✓ sitemap.xml written to ${outPath} with ${urls.length} URLs.`);
