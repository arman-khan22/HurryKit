import type { Metadata } from 'next';
import { Breadcrumbs } from '@/components/seo/Breadcrumbs';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? '';

export const metadata: Metadata = {
  title: 'Terms of Service | Hurrykit',
  description:
    'Hurrykit Terms of Service. Guidelines for using our browser-based file conversion tools and disclaimer of warranties.',
  alternates: { canonical: SITE_URL ? `${SITE_URL}/terms` : '/terms' },
};

export default function TermsPage() {
  const breadcrumbs = [
    { name: 'Home', item: SITE_URL || '/' },
    { name: 'Terms of Service', item: SITE_URL ? `${SITE_URL}/terms` : '/terms' },
  ];

  return (
    <div className="container py-8 max-w-3xl">
      <Breadcrumbs items={breadcrumbs} />

      <article className="prose mt-6">
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[var(--text)] mb-4">
          Terms of Service
        </h1>
        <p className="text-sm text-[var(--muted)]">Last updated: October 2026</p>

        <hr className="my-8 border-[var(--border)]" />

        <h2 className="text-2xl font-bold text-[var(--text)] mb-3">1. Acceptance of Terms</h2>
        <p className="text-[var(--muted)] leading-relaxed">
          By accessing or using Hurrykit (the &quot;Service&quot;), you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use the Service.
        </p>

        <h2 className="text-2xl font-bold text-[var(--text)] mt-8 mb-3">2. Permitted Use & User Responsibility</h2>
        <p className="text-[var(--muted)] leading-relaxed">
          You may use Hurrykit for personal, academic, or commercial purposes. You represent and warrant that you own or have obtained all necessary rights, licenses, and permissions to convert and manipulate any files you process through the Service.
        </p>

        <h2 className="text-2xl font-bold text-[var(--text)] mt-8 mb-3">3. Client-Side Execution</h2>
        <p className="text-[var(--muted)] leading-relaxed">
          All file processing is performed locally inside your device&apos;s web browser. Because no file bytes are sent to our servers, Hurrykit does not monitor, review, store, or take possession of your files. You are solely responsible for retaining original copies of your files.
        </p>

        <h2 className="text-2xl font-bold text-[var(--text)] mt-8 mb-3">4. Disclaimer of Warranties</h2>
        <p className="text-[var(--muted)] leading-relaxed">
          The Service is provided on an &quot;AS IS&quot; and &quot;AS AVAILABLE&quot; basis, without warranties of any kind, whether express or implied, including but not limited to implied warranties of merchantability, fitness for a particular purpose, or non-infringement.
        </p>
        <p className="text-[var(--muted)] leading-relaxed mt-2">
          File conversion between disparate formats is inherently subject to technical differences (such as compression loss, color space mapping, audio frequency re-sampling, and metadata omission). We do not guarantee that output files will be identical in fidelity to input files.
        </p>

        <h2 className="text-2xl font-bold text-[var(--text)] mt-8 mb-3">5. Limitation of Liability</h2>
        <p className="text-[var(--muted)] leading-relaxed">
          To the maximum extent permitted by applicable law, in no event shall Hurrykit, its operators, or contributors be liable for any direct, indirect, incidental, special, consequential, or punitive damages resulting from your use of or inability to use the Service.
        </p>

        <h2 className="text-2xl font-bold text-[var(--text)] mt-8 mb-3">6. Changes to Terms</h2>
        <p className="text-[var(--muted)] leading-relaxed">
          We reserve the right to revise or update these Terms at any time by updating this page. Continued use of the Service after any modifications constitutes acceptance of the new terms.
        </p>
      </article>
    </div>
  );
}
