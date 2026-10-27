import type { Metadata } from 'next';
import Link from 'next/link';
import { HUBS, toolsByDepartment } from '@/registry';
import type { Department } from '@/registry';
import { Breadcrumbs } from '@/components/seo/Breadcrumbs';
import { JsonLd } from '@/components/seo/JsonLd';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://hurrykit.com';

const DEPT_ACCENT: Record<Department, string> = {
  image: 'var(--image)',
  audio: 'var(--audio)',
  video: 'var(--video)',
};

export function getHubMetadata(dept: Department): Metadata {
  const hub = HUBS[dept];
  const canonical = `${SITE_URL}/${hub.slug}`;
  return {
    title: `${hub.name} — Free, No Upload | Hurrykit`,
    description: hub.description,
    alternates: { canonical },
    openGraph: {
      url: canonical,
      title: `${hub.name} — Free, No Upload | Hurrykit`,
      description: hub.description,
      type: 'website',
    },
  };
}

export function HubView({ dept }: { dept: Department }) {
  const hub = HUBS[dept];
  const tools = toolsByDepartment(dept);
  const accent = DEPT_ACCENT[dept];

  const breadcrumbs = [
    { name: 'Home', item: SITE_URL },
    { name: hub.name, item: `${SITE_URL}/${hub.slug}` },
  ];

  const collectionLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: hub.name,
    description: hub.description,
    url: `${SITE_URL}/${hub.slug}`,
    numberOfItems: tools.length,
    itemListElement: tools.map((t, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      url: `${SITE_URL}/${t.slug}`,
      name: t.seo.title,
    })),
  };

  return (
    <>
      <JsonLd data={collectionLd} />
      <div className="container py-8">
        <Breadcrumbs items={breadcrumbs} />

        <header className="mt-6 mb-10">
          <div className="inline-block text-xs font-semibold px-2.5 py-1 rounded-full uppercase tracking-wider mb-3 bg-[var(--surface-raised)] border border-[var(--border)]" style={{ color: accent }}>
            Department Hub
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[var(--text)]">
            {hub.name}
          </h1>
          <p className="mt-2 text-lg text-[var(--muted)] max-w-2xl">{hub.tagline}</p>
          <p className="mt-2 text-sm text-[var(--muted)] max-w-2xl">{hub.description}</p>
        </header>

        <section aria-label={`${hub.name} tools`}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {tools.map((tool) => (
              <Link
                key={tool.id}
                href={`/${tool.slug}`}
                className="card hover:shadow-[var(--shadow)] transition-all no-underline group block"
              >
                <div
                  className="text-xs font-bold uppercase tracking-wide mb-2"
                  style={{ color: accent }}
                >
                  {tool.from.map((f) => f.toUpperCase()).join(' / ')} → {tool.to.toUpperCase()}
                </div>
                <p className="text-base font-semibold text-[var(--text)] group-hover:text-[var(--video)] transition-colors">
                  {tool.seo.primary.charAt(0).toUpperCase() + tool.seo.primary.slice(1)}
                </p>
                <p className="text-xs text-[var(--muted)] mt-1.5 line-clamp-2 leading-relaxed">
                  {tool.seo.description}
                </p>
                <div className="mt-3 flex items-center justify-between text-xs text-[var(--muted)]">
                  <span>Wave {tool.wave}</span>
                  <span className="font-medium text-[var(--text)] group-hover:underline">Open tool →</span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}
