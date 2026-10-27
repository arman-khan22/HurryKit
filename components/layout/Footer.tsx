import Link from 'next/link';
import { HUBS, liveTools } from '@/registry';

export function Footer() {
  const popularTools = liveTools()
    .filter((t) => t.wave === 1)
    .slice(0, 8);

  const imageTools = liveTools().filter(t => t.department === 'image').slice(0, 5);
  const audioTools = liveTools().filter(t => t.department === 'audio').slice(0, 5);
  const videoTools = liveTools().filter(t => t.department === 'video').slice(0, 5);

  return (
    <footer className="w-full bg-[var(--surface-2)] border-t border-[var(--border)] transition-colors">
      <div className="container py-14">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 mb-12">
          {/* Brand Info */}
          <div className="lg:col-span-2 space-y-4">
            <Link
              href="/"
              aria-label="Hurrykit Home"
              className="inline-flex items-center gap-1 text-xl font-extrabold tracking-tight text-[var(--text)]"
            >
              <span className="text-[var(--accent)]">Hurry</span>kit
            </Link>
            <p className="text-sm text-[var(--muted)] leading-relaxed max-w-sm">
              The high-speed, 100% private file conversion suite. Every single file is processed locally on your hardware using modern WebAssembly.
            </p>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-[var(--ok-bg)] text-[var(--ok)] border border-[var(--ok-border)]">
              <span className="w-2 h-2 rounded-full bg-[var(--ok)]" aria-hidden="true" />
              Zero bytes ever uploaded to any server
            </div>
          </div>

          {/* Image Converters */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text)] mb-3">
              Image Tools
            </h3>
            <ul className="space-y-2 text-sm text-[var(--muted)]">
              {imageTools.map((t) => (
                <li key={t.id}>
                  <Link href={`/${t.slug}`} className="hover:text-[var(--text)] transition-colors">
                    {t.seo.primary}
                  </Link>
                </li>
              ))}
              <li>
                <Link href="/image-converter" className="text-xs font-semibold text-[var(--accent)] hover:underline">
                  All Image Tools →
                </Link>
              </li>
            </ul>
          </div>

          {/* Audio & Video */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text)] mb-3">
              Audio & Video
            </h3>
            <ul className="space-y-2 text-sm text-[var(--muted)]">
              {audioTools.slice(0, 3).map((t) => (
                <li key={t.id}>
                  <Link href={`/${t.slug}`} className="hover:text-[var(--text)] transition-colors">
                    {t.seo.primary}
                  </Link>
                </li>
              ))}
              {videoTools.slice(0, 3).map((t) => (
                <li key={t.id}>
                  <Link href={`/${t.slug}`} className="hover:text-[var(--text)] transition-colors">
                    {t.seo.primary}
                  </Link>
                </li>
              ))}
              <li>
                <Link href="/video-converter" className="text-xs font-semibold text-[var(--accent)] hover:underline">
                  All Media Tools →
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal & Trust */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text)] mb-3">
              Trust & Transparency
            </h3>
            <ul className="space-y-2 text-sm text-[var(--muted)]">
              <li>
                <Link href="/privacy-promise" className="hover:text-[var(--text)] transition-colors font-medium text-[var(--ok)]">
                  Privacy Promise
                </Link>
              </li>
              <li>
                <Link href="/about" className="hover:text-[var(--text)] transition-colors">
                  About Hurrykit
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-[var(--text)] transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-[var(--text)] transition-colors">
                  Contact & Support
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Footer Bottom Bar */}
        <div className="pt-8 border-t border-[var(--border)] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[var(--muted)]">
          <p>© {new Date().getFullYear()} Hurrykit. Free forever. No watermarks. No tracking.</p>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--ok)]" /> Client-Side WASM
            </span>
            <span>•</span>
            <span>Edge Hosted</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
