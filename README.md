# Hurrykit — Private In-Browser File Converter

> **The Privacy Promise:**
> **Your files never leave your device.**
> All file conversions execute entirely within your browser using WebAssembly and Web Workers. Zero file bytes are ever uploaded to any server. No accounts, no subscriptions, no tracking, and no watermarks.

---

## Overview

Hurrykit is a client-side file conversion suite designed for maximum privacy, speed, and simplicity. Phase 1 provides 50+ converters across image, audio, and video formats, including high-demand workflows like HEIC to JPG, MP4 to MP3, MOV to MP4, and WAV to MP3.

## Tech Stack

- **Framework:** Next.js 15 (App Router) with static export (`output: 'export'`)
- **Runtime / UI:** React 19, TypeScript (strict mode + `exactOptionalPropertyTypes`)
- **Styling:** Tailwind CSS with CSS Variables design tokens & `next-themes`
- **Engines:**
  - **Audio & Video:** `@ffmpeg/ffmpeg` (pinned `0.12.15`) & `@ffmpeg/util` (pinned `0.12.2`) via WebAssembly Web Workers
  - **Image:** Native `OffscreenCanvas`, `@jsquash/avif`, `heic2any`, and `utif`
- **Validation & State:** Zod (`zod`), Zustand (`zustand`)
- **Testing:** Vitest for unit tests, Playwright for cross-browser end-to-end and zero-upload security verification
- **Deployment:** Cloudflare Pages (static HTML/JS/CSS/WASM) with secure HTTP headers in `public/_headers`

---

## Getting Started

### Prerequisites

- **Node.js:** `>= 20.0.0`
- **Package Manager:** `pnpm` (v11+ recommended)

### Installation

```bash
# Clone repository and install dependencies
pnpm install
```

### Development

```bash
# Start local development server on http://localhost:3000
pnpm dev
```

### Production Build & Verification

```bash
# Build static export into out/
pnpm build

# Run TypeScript typecheck
pnpm typecheck

# Run ESLint checks
pnpm lint

# Run unit tests
pnpm test

# Run Playwright end-to-end tests
pnpm test:e2e

# Run SEO verification script
pnpm seo-check
```

---

## Environment Variables

Copy `.env.example` to `.env.local` to configure environment settings:

```bash
cp .env.example .env.local
```

| Variable | Description | Default |
|---|---|---|
| `SITE_URL` | Canonical site URL (server/build context) | `""` |
| `NEXT_PUBLIC_SITE_URL` | Public site URL available in browser client bundle | `""` |
| `NEXT_PUBLIC_ANALYTICS_ID` | Privacy-friendly analytics ID (optional) | `""` |
| `NEXT_PUBLIC_ENV` | Environment (`development`, `preview`, `production`) | `development` |
| `NEXT_PUBLIC_FFMPEG_BASE_URL` | CDN base URL for WebAssembly FFmpeg core | `https://unpkg.com/@ffmpeg/core@0.12.10/dist/esm` |
| `NEXT_PUBLIC_FFMPEG_VERSION` | Version of FFmpeg core in CDN storage | `0.12.10` |

---

## Repository Structure

```
hurrykit/
├── app/                      # Next.js App Router static pages
│   ├── page.tsx              # Home page shell
│   ├── [slug]/page.tsx       # Dynamic conversion pages generated via generateStaticParams
│   ├── formats/[format]/     # Format specification pages
│   ├── guides/[slug]/        # Step-by-step guides
│   ├── image-converter/      # Department hub
│   ├── audio-converter/      # Department hub
│   ├── video-converter/      # Department hub
│   ├── privacy-promise/      # Privacy promise page
│   └── layout.tsx            # Root layout with ThemeProvider, Header, and Footer
├── components/
│   ├── layout/               # Header, Footer, SearchBox, ThemeToggle, ThemeProvider
│   ├── tool/                 # DropZone, OptionsPanel, FileQueue, ProgressBar, ResultCard
│   └── content/              # Faq, HowItWorks, RelatedTools, Breadcrumbs
├── engines/
│   ├── types.ts              # Common engine interfaces & progress contracts
│   ├── factory.ts            # Dynamic engine instantiation
│   ├── image/                # ImageEngine with WebAssembly & Canvas codecs
│   ├── ffmpeg/               # FfmpegEngine with Web Worker command dispatch
│   └── shared/               # Progress tracking, memory guards, and naming
├── registry/
│   ├── schema.ts             # Zod schema definitions for tools and formats
│   ├── formats.ts            # Canonical format catalog
│   ├── tools/                # Department tool registry (image, audio, video)
│   └── index.ts              # Registry loader and validation exports
├── content/
│   ├── tools/                # Markdown copy per tool
│   ├── formats/              # Technical format notes
│   └── guides/               # Guide articles
├── lib/                      # Zustand tool store and content loaders
├── public/
│   ├── _headers              # Security CSP & cache rules for Cloudflare Pages
│   ├── _redirects            # Edge redirect rules
│   └── samples/              # Tiny test files for drag-and-drop verification
├── tests/
│   ├── unit/                 # Vitest unit test suites
│   ├── e2e/                  # Playwright zero-upload & UI test suites
│   └── fixtures/             # Test fixtures
├── scripts/                  # seo-check, sitemap, and registry validation scripts
└── docs/                     # Architectural decisions log & specifications
```

---

## License

All Hurrykit source code is proprietary. Bundled open-source libraries (FFmpeg, jSquash, Zod, etc.) retain their respective open-source licenses (MIT, Apache 2.0, LGPL 2.1+). See `/licences` for detailed attribution.
