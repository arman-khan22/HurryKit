# Hurrykit Architectural Decisions Log

All architectural and engineering decisions are recorded here with date, status, exact versions, and technical rationale.

---

### DEC-001: 100% Client-Side In-Browser Execution
- **Date:** 2026-10-15
- **Status:** Adopted (Core Privacy Architecture)
- **Version:** N/A (Architecture)
- **Decision:** All file conversions execute entirely within the user's browser via WebAssembly and Web Workers. Zero file bytes are ever uploaded to any server.
- **Why:** Delivers an unassailable privacy guarantee (essential for IDs, signatures, personal voice notes, medical photos) and reduces server/infrastructure operational costs to near zero.

---

### DEC-002: Framework Selection — Next.js App Router with Static Export (`output: 'export'`)
- **Date:** 2026-10-16
- **Status:** Adopted
- **Version:** `next@15.1.0` / `react@19.0.0`
- **Decision:** Use Next.js 15 App Router with React 19 in static export mode (`output: 'export'`).
- **Why:** File-based routing and build-time `generateStaticParams()` generate high-performance static HTML pages for all tools, hubs, guides, and format pages. Plain static assets can be deployed to Cloudflare Pages or any CDN host with zero server runtime overhead.

---

### DEC-003: Language & Type Safety — TypeScript Strict Mode
- **Date:** 2026-10-16
- **Status:** Adopted
- **Version:** `typescript@5.7.0`
- **Decision:** Full TypeScript configuration with `strict: true` and `exactOptionalPropertyTypes: true`.
- **Why:** The tool registry schema and engine execution interfaces require rigorous type guarantees to prevent subtle undefined property and type coercion bugs across 50+ conversion tools.

---

### DEC-004: Styling & Tokens — Tailwind CSS with CSS Variables
- **Date:** 2026-10-17
- **Status:** Adopted
- **Version:** `tailwindcss@3.4.17`, `clsx@2.1.1`, `tailwind-merge@2.6.0`
- **Decision:** Tailwind CSS combined with theme tokens mapped to CSS custom variables (`--bg`, `--surface`, `--text`, `--muted`, `--image`, `--audio`, `--video`, `--border`, `--ok`, `--warn`, `--error`). Utility merging via `clsx` and `tailwind-merge`.
- **Why:** Rapid development of responsive UI with zero runtime CSS-in-JS overhead, seamless dark/light theme switching, and strict design token consistency across departments.

---

### DEC-005: Theme Management — next-themes
- **Date:** 2026-10-17
- **Status:** Adopted
- **Version:** `next-themes@0.4.6`
- **Decision:** Use `next-themes` with `attribute="data-theme"` and system preference detection.
- **Why:** Standardized theme abstraction for Next.js App Router that eliminates Flash of Unstyled Content (FOUC), persists theme preference, and automatically tracks system dark/light mode changes.

---

### DEC-006: Audio & Video Engine — FFmpeg WebAssembly (Pinned Core)
- **Date:** 2026-10-18
- **Status:** Adopted
- **Version:** `@ffmpeg/ffmpeg@0.12.15` (pinned), `@ffmpeg/util@0.12.2` (pinned)
- **Decision:** Use `@ffmpeg/ffmpeg` 0.12 single-thread core loaded on-demand from CDN with Cache Storage persistence. Exact versions are strictly pinned without floating carets.
- **Why:** The single-thread core avoids requiring `SharedArrayBuffer` and `Cross-Origin-Isolation` headers, ensuring universal browser compatibility on mobile and desktop without restricting third-party integrations.

---

### DEC-007: Image Codecs — Hybrid OffscreenCanvas & WASM Decoders
- **Date:** 2026-10-19
- **Status:** Adopted
- **Version:** `@jsquash/avif@2.1.1`, `heic2any@0.0.4`, `utif@3.1.0`
- **Decision:** Native `createImageBitmap` and `OffscreenCanvas` for standard web formats (JPG, PNG, WebP); `heic2any` for iOS HEIC files, `utif` for TIFF, and `@jsquash/avif` for AVIF.
- **Why:** Maximizes native GPU hardware performance for common formats while providing full format coverage for newer or legacy formats in isolated Web Worker threads.

---

### DEC-008: Schema & Content Validation — Zod
- **Date:** 2026-10-19
- **Status:** Adopted
- **Version:** `zod@3.24.0`
- **Decision:** Centralized registry validation for all tool records, formats, limits, and SEO parameters using Zod schemas.
- **Why:** Validates every conversion record at build time. Build fails immediately if any tool configuration, MIME type mapping, or SEO field is missing or invalid.

---

### DEC-009: State Management — Zustand per Tool Instance
- **Date:** 2026-10-20
- **Status:** Adopted
- **Version:** `zustand@5.0.0`
- **Decision:** Zustand store factory (`createToolStore(tool)`) instantiated per tool shell.
- **Why:** Ultra-lightweight (under 2 KB), zero boilerplate, decoupled from React component lifecycle, clean cleanup of blob URLs on component unmount.

---

### DEC-010: Testing Strategy — Vitest for Unit & Playwright for E2E
- **Date:** 2026-10-20
- **Status:** Adopted
- **Version:** `vitest@3.0.0`, `@playwright/test@1.50.0`
- **Decision:** Vitest for lightning-fast unit tests and registry validations; Playwright for cross-browser end-to-end tests and the zero-network-upload security regression test.
- **Why:** Vitest shares Vite tooling for instant feedback; Playwright provides real Chromium/Firefox/WebKit automation to verify offline processing and privacy compliance.

---

### DEC-011: Package Manager — pnpm
- **Date:** 2026-10-21
- **Status:** Adopted
- **Version:** `pnpm@11.24.0`
- **Decision:** Standardize repository package management on `pnpm`.
- **Why:** Fast installation times, hardlink/symlink disk efficiency, and strict dependency isolation that prevents phantom dependency imports.

---

### DEC-012: Hosting & Security — Cloudflare Pages with `_headers`
- **Date:** 2026-10-21
- **Status:** Adopted
- **Version:** Cloudflare Pages Static Deploy
- **Decision:** Host exported static assets on Cloudflare Pages, configured with `public/_headers` for strict Content Security Policy (CSP), frame denial (`X-Frame-Options: DENY`), and long-term immutable caching for static assets and WASM binaries.
- **Why:** Free tier global edge network with zero server maintenance, fast TTFB worldwide, and rock-solid baseline security policies.

---

### DEC-013: Continuous Integration — GitHub Actions
- **Date:** 2026-10-22
- **Status:** Adopted
- **Version:** GitHub Actions (`actions/checkout@v4`, `pnpm/action-setup@v4`, `actions/setup-node@v4`)
- **Decision:** GitHub Actions workflow executing `lint`, `typecheck`, `build`, and `test` on every pull request and push to main.
- **Why:** Automates verification to ensure no broken types, lint violations, or build failures can be merged into production.

---

### DEC-014: Tool Phasing & Release Waves (Wave 1 vs Wave 2 & 3)
- **Date:** 2026-10-23
- **Status:** Adopted
- **Decision:** Categorize the 54 Phase 1 conversion tools into three distinct implementation and SEO waves. Wave 1 tools are marked with `status: "ready"`, while Wave 2 and Wave 3 tools are marked with `status: "draft"`.
- **Tool Classification:**
  - **Wave 1 (20 tools, Status: `ready` — Launch Priority):**
    - **Image (8 tools):** `heic-to-jpg`, `heic-to-png`, `webp-to-jpg`, `webp-to-png`, `jpg-to-png`, `png-to-jpg`, `avif-to-jpg`, `svg-to-png`
    - **Audio (5 tools):** `opus-to-mp3`, `m4a-to-mp3`, `wav-to-mp3`, `mp3-to-wav`, `mp4-to-mp3`
    - **Video (7 tools):** `mov-to-mp4`, `mkv-to-mp4`, `avi-to-mp4`, `webm-to-mp4`, `hevc-to-h264`, `mp4-to-gif`, `gif-to-mp4`
  - **Wave 2 (21 tools, Status: `draft`):**
    - **Image (10 tools):** `heic-to-webp`, `jpg-to-webp`, `png-to-webp`, `avif-to-png`, `gif-to-jpg`, `gif-to-png`, `tiff-to-jpg`, `svg-to-jpg`, `png-to-ico`, `jfif-to-jpg`
    - **Audio (5 tools):** `aac-to-mp3`, `flac-to-mp3`, `ogg-to-mp3`, `amr-to-mp3`, `mp3-to-m4a`
    - **Video (6 tools):** `wmv-to-mp4`, `flv-to-mp4`, `3gp-to-mp4`, `m4v-to-mp4`, `mp4-to-mov`, `mp4-to-webm`
  - **Wave 3 (13 tools, Status: `draft`):**
    - **Image (4 tools):** `jpg-to-avif`, `bmp-to-jpg`, `bmp-to-png`, `tiff-to-png`
    - **Audio (5 tools):** `wma-to-mp3`, `mp3-to-ogg`, `wav-to-flac`, `flac-to-wav`, `aiff-to-mp3`
    - **Video (4 tools):** `mpeg-to-mp4`, `webm-to-gif`, `mov-to-gif`, `mov-to-mp3`
- **Why:**
  1. **Demand Prioritization:** Wave 1 targets the highest volume consumer conversion pain points (iPhone camera photos, WhatsApp voice memos, universal MP4 web video).
  2. **Device Performance & Battery:** Wave 1 focuses on GPU-assisted Canvas rendering and stream-copy or single-pass FFmpeg pipelines that run without lag on mid-range smartphones.
  3. **Quality & Stability Gate:** Heavy encoders (such as slow AVIF compression and large GIF palette quantization) are held in Wave 3 until memory management and WebAssembly web worker thread limits are benchmarked on constrained devices.
  4. **Publishing Control:** Status gates sitemap publishing so that only verified, ready tools are submitted to search indexers.

---

### DEC-015: Engine Abstraction Layer & Worker Message Protocol
- **Date:** 2026-10-25
- **Status:** Adopted
- **Decision:** All conversion engines (`image`, `ffmpeg`) sit behind the unified `Engine` interface defined in `engines/types.ts`. Engines are managed as on-demand singletons via `engines/factory.ts` (`getEngine(id)`). Communication with Web Workers utilizes a typed message protocol (`engines/shared/worker-protocol.ts`) with transferable `ArrayBuffer` objects to eliminate memory duplication.
- **Why:** Keeps the UI layer completely decoupled from underlying WebAssembly / FFmpeg implementations. Enables soft or hard cancellation without memory leaks, enforces conservative pre-flight memory guards, and provides standardized format detection via magic bytes.

---

### DEC-016: FFmpeg.wasm Delivery, Hosting and Two-Tier Client Caching
- **Date:** 2026-10-25
- **Status:** Adopted
- **Version:** `@ffmpeg/ffmpeg@0.12.15`, `@ffmpeg/util@0.12.2`, `@ffmpeg/core@0.12.10` (single-thread)
- **Decision:**
  1. **External Object Store Hosting**: The 31 MB single-thread `ffmpeg-core.wasm` binary cannot be hosted inside the Cloudflare Pages repository due to Pages' 25 MiB file size limit. It is hosted on Cloudflare R2 behind custom domain `cdn.hurrykit.com` with $0 egress fees and edge caching.
  2. **Strict Lazy Loading**: Never download the core until a user actually starts or preheats an audio/video conversion.
  3. **Two-Tier Client Caching**: Downloaded core binaries are saved into the browser's Cache Storage API (`caches.open('hurrykit-ffmpeg-v0.12.10')`) with durable fallback to IndexedDB, enabling instant 0 ms repeat visits and offline execution.
  4. **CDN Multi-Mirror Resilience**: Automatic runtime fallback to public ESM CDN mirrors (`unpkg.com`, `jsdelivr.net`) if the primary object store is unreachable.
  5. **Single-Thread Isolation**: Uses the single-thread core to eliminate `SharedArrayBuffer` requirements and allow running on any origin without COOP/COEP isolation headers.
- **Why:** Delivers universal mobile/desktop compatibility, eliminates file-size build failures, prevents duplicate 31 MB downloads, and maintains client privacy with 100% in-browser processing.

---

### DEC-017: Privacy-Preserving Analytics & Anonymized Zero-PII Error Telemetry
- **Date:** 2026-10-25
- **Status:** Adopted
- **Decision:** All analytics tracking is cookie-free and strictly client-side via `lib/analytics.ts` and `components/layout/Analytics.tsx`. For error monitoring, the serverless handler (`functions/api/error-log.ts`) validates schemas with Zod and accepts only `{ errorClass, toolId, browser, version, deviceClass }`. Payloads containing file names, binary contents, or query strings are strictly blocked.
- **Why:** Complies with GDPR/CCPA without cookie consent banners and reinforces the core privacy guarantee: no user file data ever reaches our servers.

---

### DEC-018: CI/CD Pipeline & Dual-Branch Deployment Architecture
- **Date:** 2026-10-25
- **Status:** Adopted
- **Decision:** GitHub Actions split into PR verification (`.github/workflows/pr.yml`) and Main production deployment (`.github/workflows/main.yml`). PR workflow runs lint, typecheck, unit tests, SEO check, static build, and deploys a preview instance. Main workflow runs the full test suite including the 38-spec Playwright E2E suite and deploys `out/` to Cloudflare Pages production.
- **Why:** Prevents regressions, guarantees zero-upload invariant testing before every production release, and enables atomic rollbacks in < 5 seconds.

---

### DEC-019: Mobile Performance Budgets & Hardware Memory Ceilings (Section 15)
- **Date:** 2026-10-25
- **Status:** Adopted
- **Decision:** Hardware-aware memory guards (`engines/shared/memory.ts`) partition devices into low, mid, and high tiers. On mobile devices, video transcodes are capped at 150 MB (with warnings above 105 MB), and video remuxing is capped at 500 MB. Initial page loads strictly isolate engine binaries, loading 0 WASM bytes on initial navigation.
- **Why:** Prevents browser tab crashes (OOM) on mobile operating systems with aggressive memory termination policies (iOS WebKit 300 MB jetpack and Android low-RAM thresholds).



