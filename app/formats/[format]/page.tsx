import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import * as fs from 'fs';
import * as path from 'path';
import matter from 'gray-matter';
import { marked } from 'marked';
import { allFormats, getFormat, toolsForFormat, liveTools } from '@/registry';
import { Breadcrumbs } from '@/components/seo/Breadcrumbs';
import { JsonLd } from '@/components/seo/JsonLd';
import { Prose } from '@/components/content/Prose';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? '';

export const dynamicParams = false;

export function generateStaticParams() {
  return allFormats().map((f) => ({ format: f.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ format: string }>;
}): Promise<Metadata> {
  const { format: formatId } = await params;
  const format = getFormat(formatId);
  if (!format) return {};

  const title = `${format.name} Format — Features, Compatibility & Converters | Hurrykit`;
  const description = `Technical specifications for ${format.name} (${format.extensions.join(', ')}). Convert ${format.name} files 100% locally in your browser with zero upload.`;
  const canonical = SITE_URL ? `${SITE_URL}/formats/${format.id}` : `/formats/${format.id}`;

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      url: canonical,
      title,
      description,
      type: 'website',
    },
  };
}

export default async function FormatPage({
  params,
}: {
  params: Promise<{ format: string }>;
}) {
  const { format: formatId } = await params;
  const format = getFormat(formatId);
  if (!format) notFound();

  const allTools = liveTools();
  const fromTools = allTools.filter((t) => t.from.includes(format.id));
  const toTools = allTools.filter((t) => t.to === format.id);

  const formatMdPath = path.join(process.cwd(), 'content', 'formats', `${format.id}.md`);
  let contentHtml = '';
  if (fs.existsSync(formatMdPath)) {
    const raw = fs.readFileSync(formatMdPath, 'utf-8');
    const { content } = matter(raw);
    const cleanedContent = content.replace(/^#\s+.+$/m, '').trim();
    contentHtml = (await marked.parse(cleanedContent)) as string;
  }

  const breadcrumbs = [
    { name: 'Home', item: SITE_URL || '/' },
    { name: 'Formats', item: SITE_URL ? `${SITE_URL}/formats/${format.id}` : `/formats/${format.id}` },
    { name: format.name, item: SITE_URL ? `${SITE_URL}/formats/${format.id}` : `/formats/${format.id}` },
  ];

  const ldData = {
    '@context': 'https://schema.org',
    '@type': 'TechArticle',
    headline: `${format.name} Format Overview and Converters`,
    description: format.notes ?? `Everything about the ${format.name} file format.`,
    url: SITE_URL ? `${SITE_URL}/formats/${format.id}` : `/formats/${format.id}`,
  };

  const kindColors: Record<string, string> = {
    image: 'var(--image)',
    audio: 'var(--audio)',
    video: 'var(--video)',
  };
  const accent = kindColors[format.kind] ?? 'var(--text)';

  return (
    <>
      <JsonLd data={ldData} />
      <div className="container py-8 max-w-4xl">
        <Breadcrumbs items={breadcrumbs} />

        <header className="mt-6 mb-8">
          <div
            className="inline-block text-xs font-semibold px-2.5 py-1 rounded-full uppercase tracking-wider mb-3 bg-[var(--surface-raised)] border border-[var(--border)]"
            style={{ color: accent }}
          >
            {format.kind} format
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[var(--text)]">
            {format.name} File Format
          </h1>
          <p className="mt-2 text-lg text-[var(--muted)]">
            Technical facts, extensions, MIME types, and fast in-browser converters.
          </p>
        </header>

        {/* Fact Card */}
        <div className="card p-6 mb-10">
          <h2 className="text-lg font-bold text-[var(--text)] mb-4">Format Specifications</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="block text-xs text-[var(--muted)]">Extensions</span>
              <span className="font-mono font-medium text-[var(--text)]">
                {format.extensions.join(', ')}
              </span>
            </div>
            <div>
              <span className="block text-xs text-[var(--muted)]">MIME Type</span>
              <span className="font-mono font-medium text-[var(--text)] text-xs break-all">
                {format.mime.join(', ')}
              </span>
            </div>
            <div>
              <span className="block text-xs text-[var(--muted)]">Compression</span>
              <span className="font-medium text-[var(--text)]">
                {format.lossy ? 'Lossy' : 'Lossless'}
              </span>
            </div>
            <div>
              <span className="block text-xs text-[var(--muted)]">Hurrykit Support</span>
              <span className="font-medium text-[var(--text)] capitalize">
                Read: {format.canRead.join(', ') || 'None'}
              </span>
            </div>
          </div>
          {format.notes && (
            <div className="mt-4 pt-4 border-t border-[var(--border)] text-sm text-[var(--muted)]">
              <strong>Notes:</strong> {format.notes}
            </div>
          )}
        </div>

        {/* Detailed Format Information */}
        {contentHtml && (
          <div className="card p-6 mb-10">
            <Prose html={contentHtml} label={`Detailed guide to ${format.name}`} />
          </div>
        )}

        {/* Convert from this format */}
        {fromTools.length > 0 && (
          <section className="mb-10">
            <h2 className="text-xl font-bold text-[var(--text)] mb-4">
              Convert {format.name} to Other Formats
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {fromTools.map((t) => (
                <Link
                  key={t.id}
                  href={`/${t.slug}`}
                  className="card hover:shadow-[var(--shadow)] transition-all no-underline group p-4"
                >
                  <div className="text-xs font-bold uppercase mb-1" style={{ color: accent }}>
                    {format.name} → {t.to.toUpperCase()}
                  </div>
                  <div className="text-sm font-semibold text-[var(--text)] group-hover:text-[var(--video)] transition-colors">
                    {t.seo.primary}
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Convert to this format */}
        {toTools.length > 0 && (
          <section className="mb-10">
            <h2 className="text-xl font-bold text-[var(--text)] mb-4">
              Convert Other Formats to {format.name}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {toTools.map((t) => (
                <Link
                  key={t.id}
                  href={`/${t.slug}`}
                  className="card hover:shadow-[var(--shadow)] transition-all no-underline group p-4"
                >
                  <div className="text-xs font-bold uppercase mb-1" style={{ color: accent }}>
                    {t.from.map((f) => f.toUpperCase()).join(' / ')} → {format.name}
                  </div>
                  <div className="text-sm font-semibold text-[var(--text)] group-hover:text-[var(--video)] transition-colors">
                    {t.seo.primary}
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* All formats navigation */}
        <section className="mt-12 pt-8 border-t border-[var(--border)]">
          <h2 className="text-base font-semibold text-[var(--text)] mb-4">Explore All Formats</h2>
          <div className="flex flex-wrap gap-2">
            {allFormats().map((f) => (
              <Link
                key={f.id}
                href={`/formats/${f.id}`}
                className={`px-3 py-1 text-xs rounded-full border transition-colors ${
                  f.id === format.id
                    ? 'bg-[var(--text)] text-[var(--bg)] font-bold border-transparent'
                    : 'bg-[var(--surface-raised)] border-[var(--border)] text-[var(--muted)] hover:text-[var(--text)]'
                }`}
              >
                {f.name}
              </Link>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}
