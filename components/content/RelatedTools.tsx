import Link from 'next/link';
import type { Tool } from '@/registry/schema';

interface RelatedToolsProps {
  tools: readonly Tool[];
  title?: string;
}

export function RelatedTools({ tools, title = 'Related Converters' }: RelatedToolsProps) {
  if (!tools || tools.length === 0) return null;

  return (
    <section className="mt-12 pt-8 border-t border-[var(--border)]" aria-labelledby="related-tools-heading">
      <h2 id="related-tools-heading" className="text-xl font-bold text-[var(--text)] mb-6">
        {title}
      </h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {tools.map((tool) => {
          const accent =
            tool.department === 'image'
              ? 'var(--image)'
              : tool.department === 'audio'
              ? 'var(--audio)'
              : 'var(--video)';

          return (
            <Link
              key={tool.id}
              href={`/${tool.slug}`}
              className="card hover:shadow-[var(--shadow)] transition-shadow no-underline group p-4 border border-[var(--border)] rounded-[var(--radius)] bg-[var(--surface)] block"
            >
              <div className="text-xs font-semibold mb-1" style={{ color: accent }}>
                {tool.department.toUpperCase()}
              </div>
              <p className="text-sm font-medium text-[var(--text)] group-hover:text-[var(--video)] transition-colors">
                {tool.seo.primary.replace(/ /g, ' → ').toUpperCase()}
              </p>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
