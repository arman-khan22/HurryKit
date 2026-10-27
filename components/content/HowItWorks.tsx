interface Step {
  step: number;
  title: string;
  description: string;
}

interface HowItWorksProps {
  title?: string;
  steps?: readonly Step[];
}

const DEFAULT_STEPS: Step[] = [
  {
    step: 1,
    title: 'Choose or Drop Files',
    description: 'Select your files or drag and drop them directly into your browser window.',
  },
  {
    step: 2,
    title: 'In-Browser Conversion',
    description: 'Files are processed locally on your device via WebAssembly. Zero bytes leave your machine.',
  },
  {
    step: 3,
    title: 'Download Results',
    description: 'Instantly download individual converted files or grab them all in a single ZIP archive.',
  },
];

export function HowItWorks({ title = 'How It Works', steps = DEFAULT_STEPS }: HowItWorksProps) {
  return (
    <section className="mt-12 pt-8 border-t border-[var(--border)]" aria-labelledby="how-it-works-heading">
      <h2 id="how-it-works-heading" className="text-xl font-bold text-[var(--text)] mb-6">
        {title}
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {steps.map((s) => (
          <div
            key={s.step}
            className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)] p-6 flex flex-col"
          >
            <div className="w-8 h-8 rounded-full bg-[var(--video)] text-white font-bold flex items-center justify-center text-sm mb-4">
              {s.step}
            </div>
            <h3 className="text-base font-semibold text-[var(--text)] mb-2">{s.title}</h3>
            <p className="text-sm text-[var(--muted)] leading-relaxed">{s.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
