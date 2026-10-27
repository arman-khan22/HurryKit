import { JsonLd } from '@/components/seo/JsonLd';

export type FaqPropItem =
  | { question: string; answer: string }
  | { q: string; a: string };

interface FaqProps {
  items: readonly FaqPropItem[];
  title?: string;
}

export function Faq({ items, title = 'Frequently Asked Questions' }: FaqProps) {
  if (!items || items.length === 0) return null;

  const normalized = items.map((item) => ({
    question: 'question' in item ? item.question : item.q,
    answer: 'answer' in item ? item.answer : item.a,
  }));

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: normalized.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  };

  return (
    <section className="mt-12 pt-8 border-t border-[var(--border)]" aria-labelledby="faq-heading">
      <JsonLd data={jsonLd} />
      <h2 id="faq-heading" className="text-xl font-bold text-[var(--text)] mb-6">
        {title}
      </h2>
      <div className="space-y-4">
        {normalized.map((item, index) => (
          <details
            key={index}
            className="group rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface)] p-4 transition-colors"
            open={index === 0}
          >
            <summary className="flex cursor-pointer items-center justify-between font-medium text-[var(--text)] select-none">
              <span>{item.question}</span>
              <span className="ml-4 transition-transform group-open:rotate-180 text-[var(--muted)]" aria-hidden="true">
                ▾
              </span>
            </summary>
            <p className="mt-3 text-sm text-[var(--muted)] leading-relaxed">{item.answer}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
