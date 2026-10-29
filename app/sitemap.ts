import type { MetadataRoute } from 'next';
import { liveTools, allFormats, HUBS } from '@/registry';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? '';

export const dynamic = 'force-static';

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  // Home
  const routes: MetadataRoute.Sitemap = [
    {
      url: SITE_URL || '/',
      lastModified: now,
      changeFrequency: 'daily',
      priority: 1.0,
    },
  ];

  // Hubs
  for (const hub of Object.values(HUBS)) {
    routes.push({
      url: `${SITE_URL}/${hub.slug}`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.9,
    });
  }

  // Live Tools
  for (const tool of liveTools()) {
    routes.push({
      url: `${SITE_URL}/${tool.slug}`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: tool.wave === 1 ? 0.9 : 0.8,
    });
  }

  // Formats
  for (const format of allFormats()) {
    routes.push({
      url: `${SITE_URL}/formats/${format.id}`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.7,
    });
  }

  // Guides
  const guides = [
    'how-to-convert-heic-on-windows',
    'how-to-convert-mov-to-mp4',
    'whatsapp-voice-notes-to-mp3',
  ];
  for (const slug of guides) {
    routes.push({
      url: `${SITE_URL}/guides/${slug}`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.6,
    });
  }

  // Static trust and legal pages
  const staticPages = [
    'privacy-promise',
    'about',
    'contact',
    'privacy',
    'terms',
    'cookies',
    'licences',
  ];
  for (const page of staticPages) {
    routes.push({
      url: `${SITE_URL}/${page}`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: page === 'privacy-promise' ? 0.8 : 0.5,
    });
  }

  return routes;
}
