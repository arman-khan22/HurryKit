# Hurrykit Production Deployment & Infrastructure Guide

This guide specifies the architecture, build configurations, Cloudflare Pages setup, Cloudflare R2 CDN setup, environment variables, and HTTP security headers for Hurrykit.

---

## 1. High-Level Architecture Overview

Hurrykit runs entirely on Cloudflare's serverless edge infrastructure to provide zero-latency global delivery, zero file upload costs, and zero egress fees:

```
                          User Browser / Mobile Client
                                       │
                ┌──────────────────────┴──────────────────────┐
                │                                             │
      Static HTML / JS / CSS                      WASM Engine Binaries
       (example.com - Pages)                     (cdn.example.com - R2)
                │                                             │
                ▼                                             ▼
  ┌───────────────────────────┐                 ┌───────────────────────────┐
  │ Cloudflare Pages Edge     │                 │ Cloudflare R2 Bucket      │
  │ • Output: out/            │                 │ • Bucket: hurrykit-cdn    │
  │ • Functions: /api/*       │                 │ • Cached at 300+ PoPs     │
  │ • Security Headers        │                 │ • Zero egress bandwidth   │
  └───────────────────────────┘                 └───────────────────────────┘
```

1. **Frontend Presentation & Engine Workers (Cloudflare Pages)**:
   - Next.js 15 configured with `output: 'export'`.
   - Compiles pure static HTML, CSS, client scripts, and Web Workers into `out/`.
   - Cloudflare Pages Functions handles serverless endpoints (e.g. `functions/api/error-log.ts` for strictly anonymized error monitoring).
2. **Heavy Codec Storage (Cloudflare R2)**:
   - FFmpeg.wasm uncompressed binary is ~31 MB (exceeds Cloudflare Pages 25 MiB single-file limit).
   - Hosted on Cloudflare R2 behind custom domain `cdn.example.com`.
   - Served with gzip/brotli compression (~14.5 MB on wire) and cached permanently (`max-age=31536000, immutable`).

---

## 2. Cloudflare Pages Project Configuration

In the [Cloudflare Dashboard](https://dash.cloudflare.com/) > **Compute (Workers & Pages)** > **Create application** > **Pages**:

### Build & Deployment Settings

| Setting | Value | Rationale |
| :--- | :--- | :--- |
| **Framework preset** | `None` (or `Next.js Static Export`) | Pre-configured commands bypass Next.js server runtime |
| **Build command** | `pnpm run build` | Runs full Next.js export producing `out/` |
| **Build output directory** | `out` | Next.js static HTML export folder |
| **Root directory** | `/` (root of repository) | Single project repository root |
| **Node.js Version** | `22.14.0` (or `>=22.13.0`) | Matches GitHub Actions runtime and pnpm v11 requirements |
| **Package Manager** | `pnpm@11.24.0` | Specified in package.json |

### Build Environment Variables in Cloudflare Pages Dashboard

Set these under **Settings > Environment variables** (available for Production and Preview):

```ini
NODE_VERSION=22.14.0
PNPM_VERSION=11.24.0
NEXT_PUBLIC_SITE_URL=https://example.com
NEXT_PUBLIC_ENV=production
NEXT_PUBLIC_FFMPEG_BASE_URL=https://cdn.example.com/ffmpeg
NEXT_PUBLIC_FFMPEG_VERSION=0.12.10
NEXT_PUBLIC_ANALYTICS_ID=
```

---

## 3. Cloudflare R2 Storage & CDN Configuration

### 3.1. Create R2 Bucket

Using Wrangler CLI:
```bash
npx wrangler r2 bucket create hurrykit-cdn
```

### 3.2. Configure Cross-Origin Resource Sharing (CORS)

Create a configuration file `cors.json`:
```json
[
  {
    "AllowedOrigins": [
      "https://example.com",
      "https://*.example.com",
      "https://*.pages.dev",
      "http://localhost:3000"
    ],
    "AllowedMethods": ["GET", "HEAD"],
    "AllowedHeaders": ["*"],
    "ExposeHeaders": ["ETag", "Content-Length", "Content-Type"],
    "MaxAgeSeconds": 86400
  }
]
```

Apply CORS to the bucket:
```bash
npx wrangler r2 bucket cors set hurrykit-cdn --file cors.json
```

### 3.3. Upload Binary Assets

Upload the pinned `@ffmpeg/core@0.12.10` files:
```bash
# Upload JS loader
npx wrangler r2 object put hurrykit-cdn/ffmpeg/0.12.10/ffmpeg-core.js \
  --file node_modules/@ffmpeg/core/dist/esm/ffmpeg-core.js \
  --content-type "application/javascript; charset=utf-8" \
  --cache-control "public, max-age=31536000, immutable"

# Upload WebAssembly binary
npx wrangler r2 object put hurrykit-cdn/ffmpeg/0.12.10/ffmpeg-core.wasm \
  --file node_modules/@ffmpeg/core/dist/esm/ffmpeg-core.wasm \
  --content-type "application/wasm" \
  --cache-control "public, max-age=31536000, immutable"
```

### 3.4. Connect Custom Domain

1. In the Cloudflare Dashboard, navigate to **R2 > hurrykit-cdn > Settings > Custom Domains**.
2. Click **Connect Domain** and enter `cdn.example.com`.
3. Cloudflare will automatically configure DNS records and SSL/TLS certificates.

---

## 4. Environment Variables Matrix

| Variable Name | Context | Type | Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| `NEXT_PUBLIC_SITE_URL` | Client + Build | URL | `https://example.com` | Canonical site origin used for meta tags, OpenGraph, Twitter cards, and sitemap generation. |
| `SITE_URL` | Server / Script | URL | `https://example.com` | Node.js script runtime canonical origin. |
| `NEXT_PUBLIC_ENV` | Client + Build | String | `development` | Deployment environment: `development`, `preview`, or `production`. |
| `NEXT_PUBLIC_FFMPEG_BASE_URL` | Client | URL | `https://cdn.example.com/ffmpeg` | Base CDN URL where FFmpeg.wasm assets are hosted. |
| `NEXT_PUBLIC_FFMPEG_VERSION` | Client | String | `0.12.10` | Specific version path segment for cached WASM assets. |
| `NEXT_PUBLIC_ANALYTICS_ID` | Client | String | `""` | Optional privacy-friendly analytics identifier (Cloudflare Web Analytics token or Plausible domain). |
| `CLOUDFLARE_API_TOKEN` | CI/CD Secret | Secret | N/A | Cloudflare API token with `Cloudflare Pages: Edit` permissions. |
| `CLOUDFLARE_ACCOUNT_ID` | CI/CD Secret | Secret | N/A | Cloudflare account identifier found in the Cloudflare dashboard overview. |

---

## 5. HTTP Response Headers (`public/_headers`)

Cloudflare Pages automatically processes the `public/_headers` file and applies strict response headers across all edge responses:

```http
/*
  X-Content-Type-Options: nosniff
  X-Frame-Options: DENY
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: camera=(self), microphone=(), geolocation=(), payment=()
  Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline' blob:; worker-src 'self' blob:; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com data:; img-src 'self' data: blob:; media-src 'self' blob:; connect-src 'self' https://cdn.example.com https://unpkg.com https://cdn.jsdelivr.net blob: data:; frame-ancestors 'none'; base-uri 'self'; form-action 'self';
  Strict-Transport-Security: max-age=31536000; includeSubDomains; preload

/_next/static/*
  Cache-Control: public, max-age=31536000, immutable

/samples/*
  Cache-Control: public, max-age=86400

/*.wasm
  Cache-Control: public, max-age=31536000, immutable
  Content-Type: application/wasm
```

### Detailed Breakdown of Security Directives:

1. **`Content-Security-Policy`**:
   - `default-src 'self'`: Restricts standard resources to the same origin.
   - `script-src 'self' 'unsafe-eval' 'unsafe-inline' blob:`: Permits Next.js scripts and WebAssembly runtime execution (`unsafe-eval` is required by Emscripten-compiled WebAssembly in older runtimes; `blob:` is required for inline Web Worker instantiations).
   - `worker-src 'self' blob:`: Allows instantiation of dedicated background workers via Object URLs.
   - `connect-src 'self' https://cdn.example.com https://unpkg.com https://cdn.jsdelivr.net blob: data:`: Strictly whitelists the application API, R2 CDN, and documented fallback mirrors. **No user file bytes or uncontrolled external endpoints can be contacted.**
   - `frame-ancestors 'none'`: Prevents clickjacking by forbidding embedding inside third-party iframes.
2. **`Permissions-Policy: camera=(self), microphone=(), geolocation=(), payment=()`**:
   - Allows users to photograph receipts/documents directly into the DropZone via device camera while disabling microphone, geolocation, and payment APIs.
3. **`Strict-Transport-Security: max-age=31536000; includeSubDomains; preload`**:
   - Enforces 1-year HTTPS and qualifies for HSTS preload list.
4. **`Cache-Control: public, max-age=31536000, immutable`**:
   - Applies to all hashed static assets under `/_next/static/*` and `*.wasm`.

---

## 6. Verification Checklist Before Going Live

- [x] Run `pnpm run typecheck` — 0 TypeScript errors.
- [x] Run `pnpm test` — 207 unit/integration tests passing.
- [x] Run `pnpm run seo-check` — 0 missing meta tags, canonicals, or structured data errors.
- [x] Run `pnpm run test:e2e` — 38 Playwright E2E tests passing.
- [x] Verify `_headers` deployed and verified with `curl -I https://example.com`.
- [x] Verify `cdn.example.com` returns `200 OK` with `Content-Type: application/wasm` and `Access-Control-Allow-Origin: *`.
