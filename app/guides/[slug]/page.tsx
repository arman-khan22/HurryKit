import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import * as fs from 'fs/promises';
import * as path from 'path';
import matter from 'gray-matter';
import { marked } from 'marked';
import { Breadcrumbs } from '@/components/seo/Breadcrumbs';
import { JsonLd } from '@/components/seo/JsonLd';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://hurrykit.com';
const GUIDES_DIR = path.join(process.cwd(), 'content', 'guides');

export const dynamicParams = false;

type GuideMeta = {
  title: string;
  description: string;
  date: string;
  relatedTool?: string;
};

export async function generateStaticParams() {
  try {
    const files = await fs.readdir(GUIDES_DIR);
    return files
      .filter((f) => f.endsWith('.md'))
      .map((f) => ({ slug: f.replace(/\.md$/, '') }));
  } catch {
    return [
      { slug: 'how-to-convert-heic-on-windows' },
      { slug: 'whatsapp-voice-notes-to-mp3' },
    ];
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const guide = await loadGuide(slug);
  if (!guide) return {};

  const canonical = `${SITE_URL}/guides/${slug}`;
  return {
    title: `${guide.data.title} | Hurrykit Guides`,
    description: guide.data.description,
    alternates: { canonical },
    openGraph: {
      url: canonical,
      title: guide.data.title,
      description: guide.data.description,
      type: 'article',
    },
  };
}

async function loadGuide(slug: string) {
  try {
    const filePath = path.join(GUIDES_DIR, `${slug}.md`);
    const raw = await fs.readFile(filePath, 'utf-8');
    const { data, content } = matter(raw);
    const html = await marked(content);
    return { data: data as GuideMeta, html };
  } catch {
    // Built-in fallback guides for Wave 1
    if (slug === 'how-to-convert-heic-on-windows') {
      return {
        data: {
          title: 'How to Convert HEIC Photos to JPG on Windows Without Installing Software',
          description:
            'A step-by-step guide to opening and converting iPhone HEIC photos on Windows 10 and 11 completely offline and in your browser.',
          date: '2026-10-23',
          relatedTool: 'heic-to-jpg',
        },
        html: `
<p>If you take photos on an iPhone, they are saved by default in Apple's high-efficiency HEIC format. While this cuts storage in half, Windows PC applications often cannot open them without paid codecs.</p>
<h2>The Solution: 100% In-Browser Conversion</h2>
<p>Instead of downloading paid codecs from the Microsoft Store or uploading personal photos to random cloud servers, you can use Hurrykit to decode and convert HEIC photos directly inside your web browser.</p>
<h2>Step-by-Step Instructions</h2>
<ol>
  <li>Open <a href="/heic-to-jpg">Hurrykit HEIC to JPG</a> in Chrome, Edge, or Firefox.</li>
  <li>Drag and drop your .heic or .heif photos into the drop zone.</li>
  <li>Select your preferred JPG output quality (default is 90%).</li>
  <li>Click <strong>Convert All</strong>. The conversion executes entirely on your device using WebAssembly.</li>
  <li>Download your JPG photos individually or click <strong>Download All (ZIP)</strong>.</li>
</ol>
        `,
      };
    }
    if (slug === 'whatsapp-voice-notes-to-mp3') {
      return {
        data: {
          title: 'How to Convert WhatsApp Opus Voice Notes to MP3',
          description:
            'Learn how to convert WhatsApp .opus audio recordings and voice notes into universal MP3 files privately in your browser.',
          date: '2026-10-23',
          relatedTool: 'opus-to-mp3',
        },
        html: `
<p>WhatsApp records audio voice messages in the OPUS format, which provides crystal clear compression at low bitrates. However, many car stereos, media players, and video editors cannot play raw OPUS files.</p>
<h2>Why Convert In Your Browser?</h2>
<p>Voice notes often contain intimate conversations, family messages, or confidential work details. Uploading them to a remote server exposes your private audio. Hurrykit's audio engine runs FFmpeg inside your browser via WebAssembly, guaranteeing that not a single byte of your voice note ever leaves your device.</p>
<h2>Steps to Convert</h2>
<ol>
  <li>Export the voice note (.opus) from WhatsApp to your files or computer.</li>
  <li>Visit <a href="/opus-to-mp3">Hurrykit OPUS to MP3</a>.</li>
  <li>Drop your audio file and select your desired MP3 bitrate (e.g. 192k or 320k).</li>
  <li>Click <strong>Convert</strong>. Download your compatible MP3 audio file immediately.</li>
</ol>
        `,
      };
    }
    return null;
  }
}

export default async function GuidePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const guide = await loadGuide(slug);
  if (!guide) notFound();

  const breadcrumbs = [
    { name: 'Home', item: SITE_URL },
    { name: 'Guides', item: `${SITE_URL}/guides/${slug}` },
    { name: guide.data.title, item: `${SITE_URL}/guides/${slug}` },
  ];

  const ldData = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: guide.data.title,
    description: guide.data.description,
    datePublished: guide.data.date,
    url: `${SITE_URL}/guides/${slug}`,
  };

  return (
    <>
      <JsonLd data={ldData} />
      <div className="container py-8 max-w-3xl">
        <Breadcrumbs items={breadcrumbs} />

        <article className="prose mt-6">
          <div className="inline-block px-2.5 py-1 text-xs font-semibold uppercase tracking-wider rounded-full bg-[var(--surface-raised)] border border-[var(--border)] text-[var(--muted)] mb-3">
            Hurrykit Guide
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[var(--text)] mb-3">
            {guide.data.title}
          </h1>
          <p className="text-sm text-[var(--muted)] mb-6">Published on {guide.data.date}</p>

          {guide.data.relatedTool && (
            <div className="card p-4 not-prose mb-8 flex items-center justify-between gap-4 bg-[var(--surface-raised)]">
              <div>
                <p className="text-xs uppercase font-bold tracking-wide text-[var(--video)]">
                  Recommended Tool
                </p>
                <p className="text-sm font-semibold text-[var(--text)]">
                  Ready to convert your file right now?
                </p>
              </div>
              <Link href={`/${guide.data.relatedTool}`} className="btn btn-primary text-xs shrink-0">
                Open Converter →
              </Link>
            </div>
          )}

          {/* eslint-disable-next-line react/no-danger */}
          <div dangerouslySetInnerHTML={{ __html: guide.html }} />
        </article>
      </div>
    </>
  );
}
