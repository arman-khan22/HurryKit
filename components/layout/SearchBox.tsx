'use client';
import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { searchIndex, type SearchEntry } from '@/registry';
import MiniSearch from 'minisearch';

let miniSearch: MiniSearch<SearchEntry> | null = null;

function getSearch(): MiniSearch<SearchEntry> {
  if (miniSearch) return miniSearch;
  miniSearch = new MiniSearch<SearchEntry>({
    fields: ['title', 'primary', 'related'],
    storeFields: ['id', 'slug', 'title', 'department'],
    searchOptions: { prefix: true, fuzzy: 0.2, boost: { primary: 2 } },
  });
  miniSearch.addAll(searchIndex());
  return miniSearch;
}

export function SearchBox() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchEntry[]>([]);
  const [open, setOpen] = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const search = useCallback((q: string) => {
    if (!q.trim()) { setResults([]); setOpen(false); return; }
    const hits = getSearch().search(q).slice(0, 8) as unknown as SearchEntry[];
    setResults(hits);
    setOpen(hits.length > 0);
    setActiveIdx(-1);
  }, []);

  useEffect(() => { search(query); }, [query, search]);

  const navigate = useCallback((slug: string) => {
    setQuery('');
    setOpen(false);
    router.push(`/${slug}`);
  }, [router]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!open) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIdx((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIdx((i) => Math.max(i - 1, -1));
    } else if (e.key === 'Enter' && activeIdx >= 0) {
      const hit = results[activeIdx];
      if (hit) navigate(hit.slug);
    } else if (e.key === 'Escape') {
      setOpen(false);
      inputRef.current?.blur();
    }
  };

  // Keyboard shortcut: / focuses search
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === '/' && e.target === document.body) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  const deptColor = (dept: string) =>
    dept === 'image' ? 'var(--image)' : dept === 'audio' ? 'var(--audio)' : 'var(--video)';

  return (
    <div className="relative w-full" role="search">
      <label htmlFor="site-search" className="sr-only">Search tools</label>
      <input
        id="site-search"
        ref={inputRef}
        type="search"
        role="combobox"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        onFocus={() => query && results.length > 0 && setOpen(true)}
        placeholder="Search tools… (press /)"
        aria-autocomplete="list"
        aria-controls={open ? 'search-results' : undefined}
        aria-activedescendant={activeIdx >= 0 ? `sr-${activeIdx}` : undefined}
        aria-expanded={open}
        autoComplete="off"
        className="w-full h-10 pl-9 pr-4 rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] text-sm placeholder:text-[var(--muted)] focus:outline-none focus:ring-2 focus:ring-[var(--border-focus)] transition-shadow"
      />
      {/* Search icon */}
      <svg
        className="absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--muted)]"
        width="16" height="16" viewBox="0 0 20 20" fill="none" aria-hidden="true"
      >
        <circle cx="9" cy="9" r="6" stroke="currentColor" strokeWidth="1.75"/>
        <path d="M15 15l-3-3" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round"/>
      </svg>

      {/* Results dropdown */}
      {open && (
        <ul
          id="search-results"
          ref={listRef}
          role="listbox"
          aria-label="Search results"
          className="absolute top-full left-0 right-0 mt-1 bg-[var(--bg)] border border-[var(--border)] rounded-[var(--radius)] shadow-[var(--shadow-lg)] z-50 overflow-hidden animate-fade-in"
        >
          {results.map((r, i) => (
            <li
              key={r.id}
              id={`sr-${i}`}
              role="option"
              aria-selected={i === activeIdx}
              onClick={() => navigate(r.slug)}
              className={`flex items-center gap-3 px-3 py-2.5 cursor-pointer text-sm transition-colors ${
                i === activeIdx ? 'bg-[var(--surface-2)]' : 'hover:bg-[var(--surface)]'
              }`}
            >
              <span
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{ background: deptColor(r.department) }}
                aria-hidden="true"
              />
              <span className="text-[var(--text)]">{r.title}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
