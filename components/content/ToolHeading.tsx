import type { Tool } from '@/registry';

interface ToolHeadingProps {
  tool: Tool;
  title?: string | undefined;
  intro?: string | undefined;
}

export function ToolHeading({ tool, title, intro }: ToolHeadingProps) {
  const accent =
    tool.department === 'image'
      ? 'var(--image)'
      : tool.department === 'audio'
      ? 'var(--audio)'
      : 'var(--video)';

  const headingText =
    title ?? `${tool.seo.primary.charAt(0).toUpperCase() + tool.seo.primary.slice(1)} — Free, Private`;

  const introText = intro ?? tool.seo.description;

  return (
    <header className="mb-6">
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <span
          className="text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border border-[var(--border)] bg-[var(--surface)]"
          style={{ color: accent }}
        >
          {tool.department.toUpperCase()} CONVERTER
        </span>
        <span className="inline-flex items-center gap-1.5 text-xs text-[var(--muted)] px-2.5 py-0.5 rounded-full bg-[var(--surface-2)]">
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--ok)]" aria-hidden="true" />
          Zero upload • In-browser
        </span>
      </div>

      <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[var(--text)]">
        {headingText}
      </h1>

      {introText && (
        <p className="mt-2 text-base sm:text-lg text-[var(--muted)] leading-relaxed max-w-3xl">
          {introText}
        </p>
      )}
    </header>
  );
}
