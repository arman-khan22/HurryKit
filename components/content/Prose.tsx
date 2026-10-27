interface ProseProps {
  html: string;
  className?: string;
  label?: string;
}

export function Prose({ html, className = '', label = 'About this converter' }: ProseProps) {
  if (!html) return null;

  return (
    <section className={`mt-10 prose ${className}`} aria-label={label}>
      <div
        dangerouslySetInnerHTML={{ __html: html }}
        className="space-y-4 text-[var(--text)] leading-relaxed [&_h2]:text-xl [&_h2]:font-bold [&_h2]:mt-8 [&_h2]:mb-3 [&_h2]:text-[var(--text)] [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:mt-6 [&_h3]:mb-2 [&_h3]:text-[var(--text)] [&_p]:text-sm sm:[&_p]:text-base [&_p]:text-[var(--muted)] [&_p]:leading-relaxed [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1.5 [&_ul]:text-sm sm:[&_ul]:text-base [&_ul]:text-[var(--muted)] [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:space-y-1.5 [&_ol]:text-sm sm:[&_ol]:text-base [&_ol]:text-[var(--muted)] [&_strong]:text-[var(--text)] [&_strong]:font-semibold [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:bg-[var(--surface-2)] [&_code]:font-mono [&_code]:text-xs"
      />
    </section>
  );
}
