import type { Tool } from '@/registry';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? '';

export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

/**
 * Creates Schema.org SoftwareApplication JSON-LD object for a tool converter.
 */
export function createSoftwareApplicationLd(tool: Tool): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: tool.seo.title,
    description: tool.seo.description,
    url: SITE_URL ? `${SITE_URL}/${tool.slug}` : `/${tool.slug}`,
    applicationCategory: 'UtilitiesApplication',
    operatingSystem: 'Any (web browser with WebAssembly support)',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
    browserRequirements: 'Requires modern web browser with WebAssembly support.',
    featureList: [
      '100% In-Browser Private Conversion',
      'Zero Server File Uploads',
      'No Signup or Account Required',
      'No Watermarks on Output Files',
    ],
  };
}

/**
 * Renders SoftwareApplication Schema.org JSON-LD script tag.
 */
export function SoftwareAppJsonLd({ tool }: { tool: Tool }) {
  return <JsonLd data={createSoftwareApplicationLd(tool)} />;
}

export type FaqItemInput =
  | { q: string; a: string }
  | { question: string; answer: string };

/**
 * Creates Schema.org FAQPage JSON-LD object.
 */
export function createFaqPageLd(faqs: readonly FaqItemInput[]): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => {
      const question = 'q' in faq ? faq.q : faq.question;
      const answer = 'a' in faq ? faq.a : faq.answer;
      return {
        '@type': 'Question',
        name: question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: answer,
        },
      };
    }),
  };
}

/**
 * Renders FAQPage Schema.org JSON-LD script tag.
 */
export function FaqJsonLd({ faqs }: { faqs: readonly FaqItemInput[] }) {
  if (!faqs || faqs.length === 0) return null;
  return <JsonLd data={createFaqPageLd(faqs)} />;
}

/**
 * Creates Schema.org WebSite & Organization JSON-LD object for the root site.
 */
export function createWebSiteLd(): Record<string, unknown> {
  const base = SITE_URL || '';
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': `${base}/#organization`,
        name: 'Hurrykit',
        url: base || '/',
        logo: `${base}/icon.svg`,
        description: 'Private in-browser file conversion tools with zero server file uploads.',
      },
      {
        '@type': 'WebSite',
        '@id': `${base}/#website`,
        url: base || '/',
        name: 'Hurrykit',
        description: 'Instant, private in-browser image, audio, and video converter.',
        publisher: { '@id': `${base}/#organization` },
      },
    ],
  };
}
