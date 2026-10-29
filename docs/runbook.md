# Hurrykit Production Operations Runbook

This runbook defines operational workflows, incident response procedures, diagnostics, and recovery playbooks for common failure modes in Hurrykit.

---

## 1. Quick Reference & System Topology

- **Production Domain**: `https://example.com`
- **Binary CDN Domain**: `https://cdn.example.com`
- **Hosting Platform**: Cloudflare Pages (Static Edge Export)
- **Binary Storage**: Cloudflare R2 (`hurrykit-cdn`)
- **Monitoring & Error Logging**: Cloudflare Pages Function (`/api/error-log`)
- **Zero-Upload Invariant**: **P0 Critical Guarantee**. No file bytes or file names ever leave the user's browser.

---

## 2. Common Failure Modes & Response Protocols

### Failure Mode 1: FFmpeg WASM Core Download Failure / Hang
- **Severity**: P1 (Affects Audio & Video conversion tools)
- **Error Codes**: `ENGINE_LOAD_FAILED`, `ERR_NETWORK_OFFLINE`, `ERR_FETCH_TIMEOUT`
- **Symptoms**:
  - User opens video/audio converter and conversion hangs at *"Loading converter..."* or displays *"Failed to load conversion engine"*.
  - Browser console logs: `Failed to fetch https://cdn.example.com/ffmpeg/0.12.10/ffmpeg-core.wasm` or CORS error.
- **Automated Fallback**:
  - Hurrykit's `assets.ts` loader automatically cascades:
    1. Primary: `https://cdn.example.com/ffmpeg/0.12.10/`
    2. Fallback Mirror 1: `https://unpkg.com/@ffmpeg/core@0.12.10/dist/esm/`
    3. Fallback Mirror 2: `https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.10/dist/esm/`
- **Diagnostics**:
  ```bash
  # Check if primary CDN is serving binary with CORS headers
  curl -I -H "Origin: https://example.com" https://cdn.example.com/ffmpeg/0.12.10/ffmpeg-core.wasm
  ```
  Expected headers:
  - `HTTP/2 200`
  - `access-control-allow-origin: *`
  - `content-type: application/wasm`
- **Remediation**:
  1. If `cdn.example.com` returns 404 or 403: Verify Cloudflare R2 bucket `hurrykit-cdn` status and CORS policy (`docs/deployment.md`).
  2. If custom domain SSL is degraded: Update `NEXT_PUBLIC_FFMPEG_BASE_URL` in Cloudflare Pages environment variables to `https://unpkg.com/@ffmpeg/core` and trigger an instant deployment.
  3. If user is offline without cached engine: User will see the offline banner. Ask user to reconnect once to seed cache.

---

### Failure Mode 2: Browser Out of Memory (OOM) on Large Media Files
- **Severity**: P2 (Client-side localized crash)
- **Error Codes**: `OUT_OF_MEMORY`, `WORKER_CRASHED`, `ERR_BUFFER_OVERFLOW`
- **Symptoms**:
  - On low-end mobile devices (<3 GB RAM) or when converting 4K video clips, the Web Worker terminates unexpectedly.
  - Browser displays: *"The browser ran out of memory processing this file."*
- **Preventative Guard**:
  - Hurrykit's `memoryGuard()` estimates required allocation before initiating decode. If estimated memory exceeds 40% of device RAM (or 250 MB ceiling on mobile), user is warned before conversion begins.
- **Remediation & User Guidance**:
  1. Instruct the user to convert one file at a time rather than large multi-file batches.
  2. For video, select a lower resolution preset (e.g. 720p instead of Original 4K).
  3. Close background browser tabs to free system RAM.
  4. Verify that worker instances terminate cleanly after job completion via `engine.destroy()` / `worker.terminate()`.

---

### Failure Mode 3: Corrupt, Truncated or Misnamed Files
- **Severity**: P3 (User input error)
- **Error Codes**: `FILE_CORRUPT`, `UNSUPPORTED_FORMAT`, `DECODE_ERROR`
- **Symptoms**:
  - File displays error badge in file queue immediately upon drop or during preparation.
- **Handling**:
  - Hurrykit never trusts file extensions alone; `detectFormat()` inspects magic bytes (first 32 bytes).
  - If a user renames an MP4 file to `.mp3`, the system detects `video/mp4` and routes it to the audio extraction pipeline or displays clear guidance.
  - If the file has 0 bytes or truncated headers: System displays friendly error: *"The file appears to be damaged or truncated."*
- **Remediation**:
  - Ask user to inspect the source file or export it again from their recording app/camera.

---

### Failure Mode 4: Incognito / Private Browsing Storage Quota Restrictions
- **Severity**: P3 (Browser limitation)
- **Error Codes**: `STORAGE_RESTRICTED`
- **Symptoms**:
  - Repeat visits in Incognito mode re-download the ~14.5 MB engine instead of instant 0 ms cache load.
- **Root Cause**:
  - Safari Private Browsing and Chrome Incognito cap Cache Storage / IndexedDB quotas strictly per session and clear them on tab close.
- **Mitigation**:
  - Hurrykit detects Cache API / IndexedDB unavailability and falls back to ephemeral in-memory Blobs for the duration of the open tab.
  - No user data is broken; performance will simply reflect fresh fetch for that session.

---

### Failure Mode 5: Zero-Upload Invariant Alarm (P0 CRITICAL)
- **Severity**: **P0 EMERGENCY**
- **Trigger**:
  - Any network request from the browser transmits file binary bytes or user file names to an external server.
  - Automated CI test `tests/e2e/no-upload.spec.ts` fails on PR or main branch.
- **Immediate Response Plan**:
  1. **Stop Deployments**: Immediately freeze pipeline and halt active releases.
  2. **Audit Network Requests**:
     - The ONLY permitted outbound requests are:
       - Static asset downloads (`example.com/_next/*`)
       - WASM engine downloads from R2/mirrors (`cdn.example.com/ffmpeg/*`)
       - Anonymized error logging (`/api/error-log`) with payload < 2 KB containing ONLY: `{ errorClass, toolId, browser, version, deviceClass }`.
  3. **Inspect Dependency Updates**:
     - Check git diff for any newly added npm packages or script tags.
  4. **Execute Rollback**:
     - Roll back Cloudflare Pages to the last certified zero-upload build immediately.

---

### Failure Mode 6: SEO Indexation Drops / Broken Links
- **Severity**: P2 (SEO / Traffic impact)
- **Symptoms**:
  - Google Search Console reports 404s or canonical mismatches.
- **Automated Validation**:
  - `pnpm run seo-check` audits all 20 tools, 3 hubs, guides, and static pages before every deployment.
- **Remediation**:
  1. Run `pnpm run seo-check` locally to identify missing meta tags, descriptions, or broken internal links.
  2. Verify `public/sitemap.xml` and `public/robots.txt` list only active, live canonical URLs.
  3. If a tool slug changes, add a permanent 301 redirect in `public/_redirects`.

---

## 3. Rollback Procedure

Cloudflare Pages provides instant atomic rollback across all edge points of presence:

1. Log into **[Cloudflare Dashboard](https://dash.cloudflare.com/)**.
2. Select **Compute (Workers & Pages) > Pages > hurrykit**.
3. Click on the **Deployments** tab.
4. Locate the last known good deployment (marked with passing commit hash).
5. Click the three dots `...` next to the deployment and click **Rollback to this deployment**.
6. **Propagation time**: Global edge rollback completes in **< 5 seconds**.

---

## 4. Routine Maintenance & Health Checks

### Weekly Audit Script
```bash
# 1. Typecheck the codebase
pnpm run typecheck

# 2. Run unit and integration tests
pnpm test

# 3. Run SEO invariant check
pnpm run seo-check

# 4. Run end-to-end suite including no-upload and a11y
pnpm run test:e2e
```

### CDN Binary Health Check
```bash
# Verify JS loader
curl -sI https://cdn.example.com/ffmpeg/0.12.10/ffmpeg-core.js | grep -E "HTTP|content-type|access-control"

# Verify WASM binary
curl -sI https://cdn.example.com/ffmpeg/0.12.10/ffmpeg-core.wasm | grep -E "HTTP|content-type|access-control"
```
