import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { liveTools, getLiveTool, getFormat, toolsByDepartment, getRelatedTools } from '@/registry';
import { ToolShell } from '@/components/tool/ToolShell';
import { loadToolContent } from '@/lib/content';
import { createToolMetadata } from '@/lib/metadata';
import { SoftwareAppJsonLd, FaqJsonLd } from '@/components/seo/JsonLd';
import { Breadcrumbs } from '@/components/seo/Breadcrumbs';
import { ToolHeading, HowItWorks, Prose, Faq, RelatedTools } from '@/components/content';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://hurrykit.com';

export const dynamicParams = false;

export function generateStaticParams() {
  return liveTools().map((t) => ({ slug: t.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const tool = getLiveTool(slug);
  if (!tool) return {};

  return createToolMetadata(tool);
}

export default async function ToolPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const tool = getLiveTool(slug);
  if (!tool) notFound();

  const content = await loadToolContent(tool);
  const relatedToolsList = getRelatedTools(tool);
  const fromFormat = tool.from[0] ? getFormat(tool.from[0]) : undefined;
  const toFormat = getFormat(tool.to);

  const deptName =
    tool.department === 'image'
      ? 'Image Converter'
      : tool.department === 'audio'
      ? 'Audio Converter'
      : 'Video Converter';

  const breadcrumbs = [
    { name: 'Home', item: SITE_URL },
    { name: deptName, item: `${SITE_URL}/${tool.department}-converter` },
    { name: tool.seo.primary.toUpperCase(), item: `${SITE_URL}/${tool.slug}` },
  ];

  return (
    <>
      {/* JSON-LD: SoftwareApplication & FAQPage */}
      <SoftwareAppJsonLd tool={tool} />
      <FaqJsonLd faqs={content.faqs} />

      <div className="container py-8">
        {/* 1. Breadcrumbs */}
        <Breadcrumbs items={breadcrumbs} />

        <div className="lg:grid lg:grid-cols-[1fr_320px] lg:gap-10 mt-6">
          <div className="min-w-0">
            {/* 2. ToolHeading */}
            <ToolHeading tool={tool} title={content.title} intro={content.intro} />

            {/* 3. ToolShell (interactive converter shell) */}
            <ToolShell tool={tool} />

            {/* 4. HowItWorks */}
            <HowItWorks />

            {/* 5. Prose content */}
            <Prose html={content.html} />

            {/* 6. Faq */}
            <Faq items={content.faqs} />

            {/* 7. RelatedTools */}
            <RelatedTools tools={relatedToolsList} />
          </div>

          {/* Sidebar */}
          <aside className="hidden lg:block space-y-6 mt-0" aria-label="Format information and quick links">
            {(fromFormat ?? toFormat) && (
              <div className="card">
                <h2 className="text-sm font-semibold text-[var(--text)] mb-3">Format Specifications</h2>
                {fromFormat && (
                  <div className="mb-4">
                    <p className="text-xs font-bold text-[var(--muted)] uppercase tracking-wide">
                      {fromFormat.name} (input)
                    </p>
                    <p className="text-sm text-[var(--muted)] mt-1">{fromFormat.notes}</p>
                    <Link
                      href={`/formats/${fromFormat.id}`}
                      className="text-xs text-[var(--video)] hover:underline mt-1 inline-block"
                    >
                      {fromFormat.name} specs →
                    </Link>
                  </div>
                )}
                {toFormat && (
                  <div>
                    <p className="text-xs font-bold text-[var(--muted)] uppercase tracking-wide">
                      {toFormat.name} (output)
                    </p>
                    <p className="text-sm text-[var(--muted)] mt-1">{toFormat.notes}</p>
                    <Link
                      href={`/formats/${toFormat.id}`}
                      className="text-xs text-[var(--video)] hover:underline mt-1 inline-block"
                    >
                      {toFormat.name} specs →
                    </Link>
                  </div>
                )}
              </div>
            )}

            {/* More tools in this department */}
            <div className="card">
              <h2 className="text-sm font-semibold text-[var(--text)] mb-3">
                More {tool.department} converters
              </h2>
              <div className="flex flex-wrap gap-2">
                {toolsByDepartment(tool.department)
                  .filter((t) => t.id !== tool.id)
                  .slice(0, 6)
                  .map((t) => (
                    <Link
                      key={t.id}
                      href={`/${t.slug}`}
                      className="px-2.5 py-1 rounded-full text-xs font-medium no-underline hover:opacity-85 transition-opacity"
                      style={{
                        background:
                          tool.department === 'image'
                            ? 'var(--image-bg)'
                            : tool.department === 'audio'
                            ? 'var(--audio-bg)'
                            : 'var(--video-bg)',
                        color:
                          tool.department === 'image'
                            ? 'var(--image)'
                            : tool.department === 'audio'
                            ? 'var(--audio)'
                            : 'var(--video)',
                        border: `1px solid ${
                          tool.department === 'image'
                            ? 'var(--image)'
                            : tool.department === 'audio'
                            ? 'var(--audio)'
                            : 'var(--video)'
                        }`,
                      }}
                    >
                      {t.seo.primary.replace(/ /g, ' → ').toUpperCase()}
                    </Link>
                  ))}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </>
  );
}
