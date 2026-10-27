import type { Metadata } from 'next';
import { Breadcrumbs } from '@/components/seo/Breadcrumbs';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://hurrykit.com';

export const metadata: Metadata = {
  title: 'Contact Us | Hurrykit',
  description:
    'Get in touch with the Hurrykit team. Provide feedback, report bugs, suggest new format conversions, or send legal inquiries.',
  alternates: { canonical: `${SITE_URL}/contact` },
};

export default function ContactPage() {
  const breadcrumbs = [
    { name: 'Home', item: SITE_URL },
    { name: 'Contact', item: `${SITE_URL}/contact` },
  ];

  return (
    <div className="container py-8 max-w-2xl">
      <Breadcrumbs items={breadcrumbs} />

      <div className="mt-6">
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[var(--text)] mb-4">
          Contact Hurrykit
        </h1>
        <p className="text-lg text-[var(--muted)] mb-8">
          Have questions, bug reports, format suggestions, or inquiries? We would love to hear from you.
        </p>

        <div className="grid gap-6">
          <div className="card p-6">
            <h2 className="text-lg font-semibold text-[var(--text)] mb-2">Technical Support & Feedback</h2>
            <p className="text-sm text-[var(--muted)] leading-relaxed mb-4">
              If a file failed to convert on your browser, please include your device model, browser version, and file extension so we can reproduce and fix it.
            </p>
            <a
              href="mailto:support@hurrykit.com"
              className="inline-flex items-center gap-2 font-medium text-[var(--image)] hover:underline"
            >
              support@hurrykit.com →
            </a>
          </div>

          <div className="card p-6">
            <h2 className="text-lg font-semibold text-[var(--text)] mb-2">Feature & Format Requests</h2>
            <p className="text-sm text-[var(--muted)] leading-relaxed mb-4">
              Need a conversion pair that is not currently listed in our registry? Let us know what formats you work with.
            </p>
            <a
              href="mailto:features@hurrykit.com"
              className="inline-flex items-center gap-2 font-medium text-[var(--audio)] hover:underline"
            >
              features@hurrykit.com →
            </a>
          </div>

          <div className="card p-6">
            <h2 className="text-lg font-semibold text-[var(--text)] mb-2">Legal & Licensing Inquiries</h2>
            <p className="text-sm text-[var(--muted)] leading-relaxed mb-4">
              For trademark, licensing, or legal correspondence regarding our open-source codec usage and attribution.
            </p>
            <a
              href="mailto:legal@hurrykit.com"
              className="inline-flex items-center gap-2 font-medium text-[var(--video)] hover:underline"
            >
              legal@hurrykit.com →
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
