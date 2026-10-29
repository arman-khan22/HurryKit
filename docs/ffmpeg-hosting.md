# FFmpeg.wasm Delivery, Hosting and Caching Specification

This document defines the production hosting architecture, object-store configuration, CORS headers, client-side caching hierarchy, and fallback mechanisms for Hurrykit's WebAssembly engine binaries.

---

## 1. Problem & Constraint Analysis

### The Cloudflare Pages 25 MiB File Limit
Cloudflare Pages imposes a hard **25 MiB per-file upload limit** on static site deployments across both free and paid plans. 

- `ffmpeg-core.wasm` is **31,004,115 bytes (~29.56 MiB / 31.0 MB uncompressed)**.
- Storing `ffmpeg-core.wasm` in Next.js `public/` causes Cloudflare Pages preview and production builds to immediately fail with:
  ```
  Error: Failed to upload asset: file size (31004115 bytes) exceeds maximum allowed size of 26214400 bytes (25 MiB).
  ```
- Additionally, bundling 31 MB of binaries into Git repositories and static site builds slows deployments, inflates git clones, and breaches zero-bundle-bloat rules.

---

## 2. Pinned Version & Binary Sizing Matrix

All FFmpeg dependencies are strictly pinned to eliminate runtime regressions:

| Package | Version | Artifact | Raw Size | Wire Size (Brotli / Gzip) | MIME Content-Type | SHA-256 Checksum |
| :--- | :---: | :--- | :---: | :---: | :--- | :--- |
| `@ffmpeg/ffmpeg` | `0.12.15` | Main Thread / Worker wrapper | ~24 KB | ~7 KB | `application/javascript` | — |
| `@ffmpeg/util` | `0.12.2` | FS buffer utilities | ~12 KB | ~4 KB | `application/javascript` | — |
| `@ffmpeg/core` | `0.12.10` | `ffmpeg-core.js` | 111,804 B (~112 KB) | ~32 KB | `application/javascript; charset=utf-8` | `67a48f11645f85439f3fde4f2119042c16b374b910206b7a7a24f342e28dcae3` |
| `@ffmpeg/core` | `0.12.10` | `ffmpeg-core.wasm` | 32,232,419 B (~32.2 MB) | ~14,580,000 B (~14.5 MB) | `application/wasm` | `9f57947a5bd530d8f00c5b3f2cb2a3492faa7e5d823315342d6a8656d0a6b7b7` |
| **Total Engine Core** | — | — | **~32.34 MB** | **~14.61 MB** | — | — |

### Why Single-Thread Core?
Hurrykit Phase 1 deliberately uses the single-thread core:
1. **Universal Browser Compatibility**: Multi-thread core requires `SharedArrayBuffer`, which mandates `Cross-Origin-Opener-Policy: same-origin` (COOP) and `Cross-Origin-Embedder-Policy: require-corp` (COEP) headers across the entire website.
2. **Third-Party Integration**: COOP/COEP headers break third-party iframes, future privacy-friendly analytics, and potential monetization/ad networks.
3. **Mobile Stability**: Single-thread core avoids Web Worker pool thread starvation on low-end dual-core Android phones.

---

## 3. Object-Store Architecture: Cloudflare R2

The binary files are hosted on **Cloudflare R2** behind a custom CDN subdomain (`cdn.example.com`).

### Cloudflare R2 Free-Tier Economics
- **Storage**: 10 GB/month included free (Hurrykit requires <100 MB for all versions).
- **Class B Operations (Read)**: 10,000,000 requests/month included free.
- **Egress Fees**: **$0.00 / GB forever** (Cloudflare does not charge data transfer fees for R2).
- **Edge Caching**: Assets routed through `cdn.example.com` are cached at 300+ Cloudflare edge data centers globally.

### Storage Directory Structure
Assets are organized in immutable, version-partitioned folders:
```
https://cdn.example.com/ffmpeg/
└── 0.12.10/
    ├── ffmpeg-core.js
    └── ffmpeg-core.wasm
```

---

## 4. Required Object-Store Response Headers

The storage bucket and CDN edge must serve the following HTTP response headers for all requests under `/ffmpeg/*`:

```http
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, HEAD, OPTIONS
Access-Control-Max-Age: 86400
Cache-Control: public, max-age=31536000, immutable
Content-Type: application/javascript; charset=utf-8 (for ffmpeg-core.js)
Content-Type: application/wasm (for ffmpeg-core.wasm)
```

### Technical Rationale for Each Header:

1. **`Access-Control-Allow-Origin: *`**:
   WebAssembly binary instantiation and Web Worker scripts created via `Blob` and `URL.createObjectURL` require cross-origin read authorization. Without this header, `fetch()` fails with a CORS security exception.

2. **`Cache-Control: public, max-age=31536000, immutable`**:
   Because every release is folder-versioned (`/0.12.10/`), these files will never change in place. Telling both Cloudflare Edge and the user's browser to cache the file for 1 year (`31536000` seconds) ensures near 100% cache hit ratios for repeat visits.

3. **`Content-Type: application/wasm`**:
   The browser's WebAssembly engine requires the correct MIME type for streaming compilation via `WebAssembly.instantiateStreaming()`.

4. **`Content-Encoding: br` or `gzip`**:
   Cloudflare R2 and CDN proxy compress the 31 MB WASM binary down to ~14.5 MB during transfer, saving more than 50% bandwidth and reducing download duration on 4G/5G mobile connections.

---

## 5. Client-Side Two-Tier Caching Architecture

To guarantee the user never downloads the ~14.5 MB engine more than once, Hurrykit implements a resilient two-tier client-side cache in `engines/ffmpeg/assets.ts`:

```
User Starts Conversion
          │
          ▼
┌─────────────────────────────────┐
│ Check Cache Storage API         │
│ (hurrykit-ffmpeg-v0.12.10)      │
└─────────────────────────────────┘
     │                    │
  [Found]             [Not Found]
     │                    │
     ▼                    ▼
Return Blobs     ┌─────────────────────────────────┐
(0 ms latency)   │ Check IndexedDB Fallback        │
                 │ (hurrykit-ffmpeg-cache)         │
                 └─────────────────────────────────┘
                      │                    │
                   [Found]             [Not Found]
                      │                    │
                      ▼                    ▼
                 Return Blobs     ┌─────────────────────────────────┐
                 (0 ms latency)   │ Fetch with Streaming Progress   │
                                  │ Primary: cdn.example.com       │
                                  └─────────────────────────────────┘
                                       │                    │
                                   [Success]             [Failed]
                                       │                    │
                                       ▼                    ▼
                                  Write to Cache     ┌─────────────────────────────────┐
                                  & Return Blobs     │ Fallback to Mirror 1: unpkg     │
                                                     │ (or Mirror 2: jsdelivr)         │
                                                     └─────────────────────────────────┘
```

1. **Tier 1 (Cache Storage API)**:
   The primary cache mechanism using `caches.open('hurrykit-ffmpeg-v0.12.10')`. Stores the `Response` objects directly. Fast and native.
2. **Tier 2 (IndexedDB Durable Fallback)**:
   If Cache Storage is restricted (e.g. certain private browsing modes or third-party web views), the engine falls back to IndexedDB (`hurrykit-ffmpeg-cache`).
3. **In-Memory Fallback**:
   If both storage APIs are disabled, the engine loads into memory for the active browser session.

---

## 6. Multi-CDN Mirror Fallback Matrix

If `cdn.example.com` is unreachable (e.g., DNS propagation, network glitch, or localized outage), `engines/ffmpeg/assets.ts` automatically steps down through secondary CDN mirrors:

1. **Primary**: `https://cdn.example.com/ffmpeg/0.12.10/`
2. **Mirror 1**: `https://unpkg.com/@ffmpeg/core@0.12.10/dist/esm/`
3. **Mirror 2**: `https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.10/dist/esm/`

### SHA-256 Binary Integrity Verification
Every downloaded asset is checked against pinned SHA-256 digests (`computeSha256(buffer)`) before being written to `CacheStorage` or `IndexedDB`. If a CDN distribution returns a corrupted, truncated, or tampered payload (or an HTML error page with a 200 OK header):
1. The corrupted payload is immediately discarded and its memory released.
2. A warning is logged to console.
3. The engine automatically steps down to the next CDN mirror.
4. The engine will only throw `ENGINE_LOAD_FAILED` if all three independent CDN distributions fail network requests or fail SHA-256 integrity checks.

---

## 7. Metered Connection & Mobile Safeguards

On mobile devices, a ~14.5 MB download can consume cellular data. Hurrykit integrates network connection awareness:
- Uses `navigator.connection` (`saveData === true`, `type === 'cellular'`, `effectiveType === 'slow-2g' | '2g' | '3g'`).
- Detects offline status via `navigator.onLine`.
- If the converter is already cached, it runs offline with zero network requests.
- If offline and not yet cached, displays clear guidance: *"You appear to be offline and the converter is not yet cached. Please connect to the internet once to download it."*

---

## 8. Deployment Runbook: Cloudflare R2 Setup

### Step 1: Create R2 Bucket
```bash
# Using Wrangler CLI
npx wrangler r2 bucket create hurrykit-cdn
```

### Step 2: Configure CORS Policy on Bucket
Create `cors.json`:
```json
[
  {
    "AllowedOrigins": [
      "https://example.com",
      "https://*.example.com",
      "https://*.pages.dev",
      "http://localhost:3000",
      "http://localhost:3001"
    ],
    "AllowedMethods": ["GET", "HEAD"],
    "AllowedHeaders": ["*"],
    "ExposeHeaders": ["ETag", "Content-Length", "Content-Type"],
    "MaxAgeSeconds": 86400
  }
]
```
Apply CORS:
```bash
npx wrangler r2 bucket cors set hurrykit-cdn --file cors.json
```

### Step 3: Upload Core Binaries
```bash
# Upload JS Core
npx wrangler r2 object put hurrykit-cdn/ffmpeg/0.12.10/ffmpeg-core.js \
  --file node_modules/@ffmpeg/core/dist/esm/ffmpeg-core.js \
  --content-type "application/javascript; charset=utf-8" \
  --cache-control "public, max-age=31536000, immutable"

# Upload WASM Core
npx wrangler r2 object put hurrykit-cdn/ffmpeg/0.12.10/ffmpeg-core.wasm \
  --file node_modules/@ffmpeg/core/dist/esm/ffmpeg-core.wasm \
  --content-type "application/wasm" \
  --cache-control "public, max-age=31536000, immutable"
```

### Step 4: Connect Custom Domain in Cloudflare Dashboard
In the Cloudflare Dashboard: **R2 > hurrykit-cdn > Settings > Custom Domains > Add Custom Domain (`cdn.example.com`)**.
