import Link from 'next/link';
import { JsonLd } from './JsonLd';

type BreadcrumbItem = { name: string; item: string };

type Props = { items: BreadcrumbItem[] };

export function Breadcrumbs({ items }: Props) {
  const ld = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: item.item,
    })),
  };

  return (
    <>
      <JsonLd data={ld} />
      <nav aria-label="Breadcrumb">
        <ol className="flex flex-wrap items-center gap-1 text-xs text-[var(--muted)]" role="list">
          {items.map((item, i) => (
            <li key={item.item} className="flex items-center gap-1">
              {i < items.length - 1 ? (
                <>
                  <Link href={item.item} className="hover:text-[var(--text)] transition-colors no-underline">
                    {item.name}
                  </Link>
                  <span aria-hidden="true">/</span>
                </>
              ) : (
                <span aria-current="page" className="text-[var(--text)]">{item.name}</span>
              )}
            </li>
          ))}
        </ol>
      </nav>
    </>
  );
}
