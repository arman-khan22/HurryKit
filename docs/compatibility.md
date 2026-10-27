# Browser & Device Compatibility Matrix and Edge Cases Catalogue

Hurrykit is built on a client-side execution architecture: zero user file bytes are ever uploaded to any server. This document defines the compatibility tiers, memory budgets, feature-detection fallbacks, and the complete 54-case Edge Cases Catalogue (Section 16).

---

## 1. Browser Support Matrix

| Platform / Browser | Engine: Image (Native + WASM) | Engine: Audio (FFmpeg WASM) | Engine: Video (FFmpeg WASM) | ZIP Generation (Worker) | Minimum Version | Notes |
| :--- | :---: | :---: | :---: | :---: | :---: | :--- |
| **Desktop Chrome / Chromium** | ✅ Full | ✅ Full | ✅ Full | ✅ Full | 110+ | Primary target; full WebAssembly & Worker support. |
| **Desktop Microsoft Edge** | ✅ Full | ✅ Full | ✅ Full | ✅ Full | 110+ | Parity with Chrome; full hardware acceleration. |
| **Desktop Mozilla Firefox** | ✅ Full | ✅ Full | ✅ Full | ✅ Full | 115+ | Standards-compliant WASM execution. |
| **Desktop Apple Safari** | ✅ Full | ✅ Full | ✅ Full | ✅ Full | 16.4+ | Requires Safari 16.4+ for OffscreenCanvas in Worker. |
| **Android Chrome** | ✅ Full | ✅ Full | ⚠️ Guarded | ✅ Full | 110+ | Memory guard limits phone video transcodes to 150MB. |
| **Android Firefox / Opera** | ✅ Full | ✅ Full | ⚠️ Guarded | ✅ Full | 115+ | Mobile memory guard active. |
| **iOS Safari (iPhone & iPad)** | ✅ Full | ✅ Full | ⚠️ Guarded | ✅ Full | 16.4+ | Web Share API fallback for file downloads; 256MB memory budget. |
| **In-App Browsers (IG, FB, WhatsApp)** | ⚠️ Notice | ⚠️ Notice | ⚠️ Notice | ⚠️ Notice | Any | Displays guidance banner recommending Chrome/Safari. |

### Verified Engine Versions & Codec Stack

| Component | Pinned Version | Scope / Engine | Verified Status |
| :--- | :---: | :--- | :---: |
| **`@ffmpeg/ffmpeg`** | `0.12.15` | FFmpeg Worker Wrapper | ✅ Verified |
| **`@ffmpeg/util`** | `0.12.2` | FS & Buffer Utilities | ✅ Verified |
| **`@ffmpeg/core`** | `0.12.10` | Single-Thread WASM Binary | ✅ Verified |
| **`heic2any` (libheif)** | `0.0.4` | HEIC/HEIF Decoder Worker | ✅ Verified |
| **`@jsquash/avif`** | `2.1.1` | AVIF Codec Worker | ✅ Verified |
| **`utif`** | `3.1.0` | TIFF First-Frame Parser | ✅ Verified |
| **`jszip`** | `3.10.1` | Multi-File Archive Worker | ✅ Verified |

### Real Device Verification Notes (Mobile Pass)

1. **Chrome for Android (v120+, Pixel 7 / Galaxy S23)**:
   - File input and camera triggers (`capture="environment"`) open native media chooser.
   - Initial navigation uses 0 WASM bytes; memory guard blocks transcode jobs > 150 MB before OOM.
   - Direct download via `<a download>` saves directly to Downloads directory without navigation.
2. **Apple Safari for iOS (v16.4+, iPhone 14/15 / iPad Air)**:
   - Touch interactions on DropZone and quality sliders are fluid with 0 horizontal viewport shifts.
   - Direct downloads trigger native iOS download prompt or Web Share fallback (`navigator.share`).
   - HEIC files exported from Camera roll preserve EXIF orientation upon conversion to JPG.


## 2. Hardware Memory Budgets & Device Classifications

Device memory budgets prevent browser tab crashes (OOM):

| Device Class | Detection Heuristic | RAM Memory Budget | Single Image Max Area | Max Video Transcode | Max Video Remux |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Low-End Phone** | `cores <= 2` or `deviceMemory <= 2GB` | 256 MB | 16.7 MP (4096×4096) | 75 MB | 250 MB |
| **Mid-Range Phone / Tablet** | `cores <= 6` or `deviceMemory <= 6GB` | 512 MB | 25 MP (5000×5000) | 150 MB | 500 MB |
| **High-End Desktop / Laptop** | `cores > 6` or `deviceMemory > 6GB` | 1024 MB (1 GB) | 50 MP (8000×6000) | 500 MB | 2000 MB (2 GB) |

---

## 3. Complete 54-Row Edge Cases Catalogue (Section 16)

### Input & File Handling

| # | Case | Expected Behaviour | User-Facing Message / Notice | Automated Test / Verification Step |
| :-: | :--- | :--- | :--- | :--- |
| **1** | Wrong or missing extension (e.g. PNG named `.jpg`) | Detect real format from magic bytes (`detectFormat`); convert accurately. | Detected as real format badge; converts seamlessly. | `tests/unit/detect.test.ts` & `tests/unit/edge-cases-catalogue.test.ts` |
| **2** | Uppercase or mixed-case extensions (`.HEIC`, `.Jpeg`) | Case-insensitive normalisation. | Standard format badge (`HEIC`, `JPG`). | `tests/unit/detect.test.ts` |
| **3** | Zero-byte file | Reject immediately before worker allocation. | `"This file is empty (0 bytes)."` | `tests/unit/tool-state-machine.test.ts` |
| **4** | Corrupt or truncated file | Decoder fails gracefully; flags `CORRUPT_FILE`; remaining files continue. | `"This file looks damaged."` | `tests/unit/image-engine.test.ts` |
| **5** | File above hard limit | Block before work in `memoryGuard`. | `"This file is bigger than this tool can handle on your device."` | `tests/unit/memory.test.ts` |
| **6** | File between soft and hard limits | Attach warning badge; allow user to proceed. | `"This file is large for your device. It may be slow."` | `tests/unit/memory.test.ts` |
| **7** | Files over batch limit (`maxFiles`) | Accept up to limit; skip remainder; polite announcement. | `"Skipped X files. Maximum batch size is Y."` | `tests/unit/tool-state-machine.test.ts` |
| **8** | Duplicate filenames in batch | Numbered suffix on output files and inside ZIP. | `image_1.jpg`, `image_2.jpg`. | `tests/unit/naming.test.ts` & `zip-worker.test.ts` |
| **9** | Unicode, spaces, Hindi characters, emoji in names | Preserve UTF-8 characters; sanitize control chars; truncate safely. | Original name preserved in output. | `tests/unit/naming.test.ts` |
| **10** | Folder dropped instead of files | Catch directory entries; notify user. | `"Folders cannot be converted directly. Please select individual files."` | Verified in DropZone directory check |
| **11** | File deleted/locked after being chosen | Catch read error; ask user to re-select. | `"The file could not be read. Please choose it again."` | Handled via file read try/catch |
| **12** | Same file added twice | Unique ID assigned to each queue item; unique output names. | Handled gracefully as distinct jobs. | `tests/unit/edge-cases-catalogue.test.ts` |
| **13** | Input already in target format (JPG to JPG) | Re-encode with note that size/quality may change slightly. | `"File is already in the target format. Re-encoding will create a new copy."` | `tests/unit/edge-cases-catalogue.test.ts` |
| **14** | Wrong department format (e.g. video on image tool) | Detect mismatch; offer direct link to appropriate hub/tool. | `"This looks like a VIDEO file. Visit our Video Converter Hub for dedicated tools."` | `tests/unit/edge-cases-catalogue.test.ts` |

---

### Image Department

| # | Case | Expected Behaviour | User-Facing Message / Notice | Automated Test / Verification Step |
| :-: | :--- | :--- | :--- | :--- |
| **15** | Transparent PNG/WebP to JPG | Canvas fills background with white (or custom colour). | Note: `"Transparency replaced with white background."` | `tests/unit/image-engine.test.ts` |
| **16** | EXIF orientation flags | Read EXIF tag; draw upright to canvas/ImageBitmap. | Output image upright in all viewports. | `tests/unit/image-engine.test.ts` |
| **17** | Huge pixel dimensions (>16.7MP) | Downscale proportionally to fit within browser canvas limits. | Note: `"Image was resized to fit browser memory limits."` | `tests/unit/image-engine.test.ts` |
| **18** | Animated GIF/WebP/AVIF to still format | Extract first frame cleanly without throwing parser errors. | Note: `"First frame extracted from animation."` | `tests/unit/image-engine.test.ts` |
| **19** | Multi-page TIFF | Decode first page using UTIF reader. | Note: `"First page extracted from multi-page document."` | `tests/unit/image-engine.test.ts` |
| **20** | CMYK or 16-bit images | Converted to standard sRGB 8-bit RGBA. | Note: `"Converted to standard sRGB colour space."` | `tests/unit/image-engine.test.ts` |
| **21** | HEIC with depth map / Live Photo | Extract primary still image; discard aux tracks. | Clean primary photo exported. | `tests/unit/image-engine.test.ts` |
| **22** | HDR or wide-gamut HEIC | Tone-mapped to standard dynamic range (SDR) sRGB. | Note: `"Converted to standard dynamic range (SDR)."` | `tests/unit/image-engine.test.ts` |
| **23** | SVG without explicit dimensions | Default to viewBox or 800×600 canvas; block external network calls. | Rendered safely without external requests. | `tests/unit/image-engine.test.ts` |
| **24** | Browser lacks native WebP/AVIF encoder | Fallback to WebAssembly encoder (`@jsquash/avif` or WASM WebP). | Transparently uses WebAssembly. | Fallback pipeline in ImageEngine |

---

### Audio Department

| # | Case | Expected Behaviour | User-Facing Message / Notice | Automated Test / Verification Step |
| :-: | :--- | :--- | :--- | :--- |
| **25** | Input has embedded album art | Audio command includes `-vn` flag to drop image stream. | Conversion succeeds without album art crash. | `tests/unit/commands.test.ts` |
| **26** | Mono or low-bitrate source (e.g. AMR) | Converts without artificial high-frequency claims. | Note: `"Source is low-bitrate mono audio."` | `tests/unit/audio-engine.test.ts` |
| **27** | Lossy to lossless (MP3 to WAV/FLAC) | Allowed; informational note clarifying acoustic fidelity. | Note: `"Lossy-to-lossless conversion does not restore lost acoustic fidelity."` | `tests/unit/audio-engine.test.ts` |
| **28** | Very long audio (> 1 hour) | Estimate duration and RAM usage; prompt before starting. | Warning: `"This long recording may take several minutes."` | `tests/unit/audio-engine.test.ts` |
| **29** | File with no audio track | Probe detects 0 audio streams; fails early with clear error. | Error: `"No audio stream found in this file."` (`NO_AUDIO_STREAM`) | `tests/unit/audio-engine.test.ts` |
| **30** | Multiple audio tracks in container | Map first stream (`-map 0:a:0`); note in results. | Note: `"Converted first audio track."` | `tests/unit/audio-engine.test.ts` |
| **31** | Silent or ultra-short audio (< 0.5s) | Process normally without division-by-zero progress errors. | Clean output generated. | `tests/unit/audio-engine.test.ts` |
| **32** | Unusual sample rates (22050, 96000 Hz) | Resample smoothly to standard rates (44100 / 48000 Hz). | Supported without distortion. | `tests/unit/audio-engine.test.ts` |

---

### Video Department

| # | Case | Expected Behaviour | User-Facing Message / Notice | Automated Test / Verification Step |
| :-: | :--- | :--- | :--- | :--- |
| **33** | HEVC / 10-bit / HDR source | Transcode to H.264 8-bit SDR with BT.709 tone mapping. | Note: `"Converted from HDR/HEVC to standard H.264."` | `tests/unit/video-engine.test.ts` |
| **34** | Portrait phone video (rotation metadata) | MP4 container preserves display matrix and orientation tags. | Orientation preserved upright. | `tests/unit/video-engine.test.ts` |
| **35** | Odd pixel dimensions (e.g. 721×1281) | Scale filter rounds to even dimensions (`scale=trunc(iw/2)*2:trunc(ih/2)*2`). | Valid H.264 stream produced. | `tests/unit/commands.test.ts` |
| **36** | Variable frame rate (VFR) | Apply `-vsync cfr` to ensure constant frame rate and eliminate A/V drift. | Audio and video remain synchronised. | `tests/unit/commands.test.ts` |
| **37** | Silent video (no audio track) | Map audio stream optionally (`-map 0:a:0?` or `-an`). | Clean video output without audio error. | `tests/unit/video-engine.test.ts` |
| **38** | Multiple video/audio tracks & subtitles | Map primary video and audio streams (`-map 0:v:0`, `-map 0:a:0?`). | Note: `"First video and audio tracks converted."` | `tests/unit/video-engine.test.ts` |
| **39** | Remux fails due to incompatible codec | Automatic fallback: catch non-zero exit code and re-encode as H.264 transcode. | Note: `"Direct remux was incompatible; re-encoded as H.264."` | `tests/unit/video-engine.test.ts` |
| **40** | Output video exceeds RAM budget | Pre-flight memory estimation guards against out-of-memory crash. | `"This video is too large to transcode in browser on this phone."` | `tests/unit/memory.test.ts` |
| **41** | Long conversion on phone | Screen Wake Lock (`navigator.wakeLock`) requested; background notice. | Live announcer update when tab backgrounded. | `tests/unit/video-engine.test.ts` |
| **42** | GIF output too large | Cap resolution (default 480p), frame rate (15fps), and palette to 256 colors. | Controlled file size. | `tests/unit/commands.test.ts` |

---

### Browser & System Environment

| # | Case | Expected Behaviour | User-Facing Message / Notice | Automated Test / Verification Step |
| :-: | :--- | :--- | :--- | :--- |
| **43** | Missing WebAssembly or Workers | Feature check runs on mount; blocks with actionable guide. | Error: `"Your browser cannot run this tool. Try Chrome or Safari."` | `tests/unit/edge-cases-catalogue.test.ts` |
| **44** | In-app browser (IG, FB, WhatsApp) | UserAgent detector shows friendly guidance banner. | Banner: `"In-app browser detected. Tap ⋯ to open in Chrome or Safari."` | `tests/unit/edge-cases-catalogue.test.ts` |
| **45** | Private mode with blocked Cache/IndexedDB | Catch storage exception; execute entirely in memory. | Operates without cache persistence. | Fallback handled in `FfmpegLoader` |
| **46** | Offline visit after first load | Serves cached engine and static pages without network. | Instant local execution. | Handled via CacheStorage & Service Worker |
| **47** | Engine download interrupted | Catch fetch failures; provide instant Retry with mirror fallback. | `"Could not load the converter. Check your connection and try again."` | `tests/unit/ffmpeg-engine.test.ts` |
| **48** | User navigates/reloads during conversion | `beforeunload` event handler prompts confirmation dialog. | Browser prompt: *"A file conversion is currently in progress."* | Tested via ToolShell beforeunload hook |
| **49** | Tab backgrounded on phone | `visibilitychange` listener notifies user to keep tab active. | Live announcer: `"Conversion running in background tab."` | Tested via ToolShell visibility hook |
| **50** | Out of memory (OOM) | Catch allocation errors; map to `OUT_OF_MEMORY`. | `"Your device ran out of memory. Try a smaller file."` | `tests/unit/memory.test.ts` |
| **51** | iOS Safari download restrictions | Detect iOS; offer native Web Share API with "Save to Files" guide. | `"Tip on iPhone: Tap Share → 'Save to Files' to keep this on your device."` | `tests/unit/edge-cases-catalogue.test.ts` |
| **52** | Slow / metered connection | Detect `saveData` or slow connection before downloading 30MB WASM core. | Progress percentage clearly indicated during download. | Handled in EngineLoader |
| **53** | Script blockers / Privacy extensions | Zero external third-party requests; all assets local or R2-hosted. | 100% functionality under strict blockers. | Verified in `tests/e2e/no-upload.spec.ts` |
| **54** | Small mobile viewports (320px) | Layout designed mobile-first; touch targets $\ge 44\times 44\text{px}$; no horizontal overflow. | Responsive and accessible on small screens. | CSS tokens & mobile viewport verification |
