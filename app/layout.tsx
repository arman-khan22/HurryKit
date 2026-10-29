import type { Metadata } from 'next';
import './globals.css';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { ThemeProvider } from '@/components/layout/ThemeProvider';
import { Analytics } from '@/components/layout/Analytics';
import { JsonLd, createWebSiteLd } from '@/components/seo/JsonLd';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL;

export const metadata: Metadata = {
  metadataBase: SITE_URL ? new URL(SITE_URL) : undefined,
  title: {
    default: 'Hurrykit — Free File Converter, No Upload',
    template: '%s | Hurrykit',
  },
  description:
    'Convert images, audio and video files instantly in your browser. Free, no signup, nothing uploaded. HEIC to JPG, MP4 to MP3, MOV to MP4 and 50+ more.',
  keywords: ['file converter', 'image converter', 'audio converter', 'video converter', 'heic to jpg', 'free online converter'],
  authors: [{ name: 'Hurrykit' }],
  creator: 'Hurrykit',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: SITE_URL || '/',
    siteName: 'Hurrykit',
    title: 'Hurrykit — Free File Converter, No Upload',
    description:
      'Convert images, audio and video in your browser. Free, no signup, nothing uploaded.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Hurrykit — Free File Converter, No Upload',
    description: 'Convert files in your browser. Nothing uploaded.',
  },
  robots: {
    index: process.env.NEXT_PUBLIC_ENV === 'production',
    follow: true,
  },
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <JsonLd data={createWebSiteLd()} />
        <ThemeProvider attribute="data-theme" defaultTheme="light" enableSystem={false} disableTransitionOnChange>
          {/* Skip link for keyboard users */}
          <a href="#main-content" className="skip-link">
            Skip to main content
          </a>
          {/* Screen-reader live announcer */}
          <div id="live-announcer" aria-live="polite" aria-atomic="true" role="status" />
          <Header />
          <main id="main-content" tabIndex={-1}>
            {children}
          </main>
          <Footer />
          <Analytics />
        </ThemeProvider>
      </body>
    </html>
  );
}
