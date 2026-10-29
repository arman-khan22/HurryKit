'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { HUBS } from '@/registry';
import { SearchBox } from './SearchBox';
import { ThemeToggleButton } from './ThemeToggleButton';

export function Header() {
  const pathname = usePathname();

  // On the homepage, the Liquid Sculpture Hero has its own integrated navigation bar
  if (pathname === '/') {
    return null;
  }

  return (
    <header className="sticky top-0 z-50 w-full bg-[var(--surface)]/90 backdrop-blur-md border-b border-[var(--border)] transition-colors">
      <div className="container">
        <div className="flex items-center justify-between gap-4 h-16">
          {/* Logo & Privacy Indicator */}
          <div className="flex items-center gap-3 flex-shrink-0">
            <Link
              href="/"
              aria-label="Hurrykit — Instant in-browser converter"
              className="inline-flex items-center gap-1.5 text-xl font-extrabold tracking-tight text-[var(--text)] hover:opacity-90 transition-opacity"
            >
              <span className="text-[var(--accent)]">Hurry</span>kit
            </Link>
            <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[var(--ok-bg)] text-[var(--ok)] border border-[var(--ok-border)]">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--ok)] animate-pulse" aria-hidden="true" />
              100% In-Browser
            </span>
          </div>

          {/* Search box (desktop) */}
          <div className="hidden md:block flex-1 max-w-md mx-2">
            <SearchBox />
          </div>

          {/* Navigation Hubs & Theme Toggle */}
          <div className="flex items-center gap-1.5">
            <nav aria-label="Main navigation" className="hidden lg:flex items-center gap-1">
              {Object.values(HUBS).map((hub) => (
                <Link
                  key={hub.slug}
                  href={`/${hub.slug}`}
                  className="px-3 py-1.5 text-xs font-semibold rounded-md text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--surface-2)] transition-colors"
                >
                  {hub.name}
                </Link>
              ))}
              <Link
                href="/privacy-promise"
                className="px-3 py-1.5 text-xs font-semibold rounded-md text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--surface-2)] transition-colors"
              >
                Privacy
              </Link>
            </nav>

            <div className="h-5 w-px bg-[var(--border)] hidden lg:block mx-1" aria-hidden="true" />

            <ThemeToggleButton />
          </div>
        </div>

        {/* Mobile search bar */}
        <div className="md:hidden pb-3">
          <SearchBox />
        </div>
      </div>
    </header>
  );
}
