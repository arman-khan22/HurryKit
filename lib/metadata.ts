import type { Metadata } from 'next';
import type { Tool, Format, Department } from '@/registry';
import { HUBS } from '@/registry';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? '';

export interface PageMetadataOptions {
  title: string;
  description: string;
  path?: string;
  keywords?: readonly string[];
  type?: 'website' | 'article';
}

/**
 * Generate standardized, SEO-compliant metadata for any page.
 */
export function createPageMetadata({
  title,
  description,
  path = '',
  keywords = [],
  type = 'website',
}: PageMetadataOptions): Metadata {
  const cleanPath = path.startsWith('/') ? path : path ? `/${path}` : '';
  const canonical = SITE_URL ? `${SITE_URL}${cleanPath}` : cleanPath;

  return {
    title: title.includes('Hurrykit') ? title : `${title} | Hurrykit`,
    description,
    keywords: Array.from(new Set(['hurrykit', 'file converter', ...keywords])),
    alternates: {
      canonical,
    },
    openGraph: {
      title,
      description,
      url: canonical,
      siteName: 'Hurrykit',
      locale: 'en_US',
      type,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  };
}

/**
 * Metadata helper for tool conversion pages.
 */
export function createToolMetadata(tool: Tool): Metadata {
  return createPageMetadata({
    title: tool.seo.title,
    description: tool.seo.description,
    path: `/${tool.slug}`,
    keywords: [tool.seo.primary, ...(tool.seo.related ?? [])],
  });
}

/**
 * Metadata helper for department hub pages.
 */
export function createHubMetadata(dept: Department): Metadata {
  const hub = HUBS[dept];
  return createPageMetadata({
    title: `${hub.name} — Free, Private & In-Browser`,
    description: hub.description,
    path: `/${hub.slug}`,
    keywords: [hub.name.toLowerCase(), `${dept} converter`, 'private file converter'],
  });
}

/**
 * Metadata helper for technical format pages.
 */
export function createFormatMetadata(format: Format): Metadata {
  return createPageMetadata({
    title: `${format.name} Format — Specifications, Compatibility & Converters`,
    description: `Detailed technical specifications for ${format.name} (${format.extensions.join(', ')}). Convert ${format.name} files 100% locally in your browser with zero upload.`,
    path: `/formats/${format.id}`,
    keywords: [format.name, format.id, ...format.extensions, `${format.name} converter`],
  });
}
