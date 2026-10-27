# Third-Party Open Source Software Licences & Compliance Matrix

Hurrykit is built on open-source software and open standards. Because Hurrykit compiles code into client-side WebAssembly and JavaScript running locally in the user's browser, strict adherence to open-source licenses (specifically MIT, Apache-2.0, MPL-2.0, and LGPL) is maintained.

---

## 1. Runtime Production Dependencies

| Package | Version | Licence | Purpose / Component | Copyright Holder / Origin |
| :--- | :---: | :---: | :--- | :--- |
| **`next`** | `15.1.0` | **MIT** | App Router & Static Site Generation framework | Vercel, Inc. |
| **`react`** | `19.0.0` | **MIT** | Core UI rendering library | Meta Platforms, Inc. |
| **`react-dom`** | `19.0.0` | **MIT** | DOM renderer for React | Meta Platforms, Inc. |
| **`zustand`** | `5.0.0` | **MIT** | Client-side reactive tool state machine | Paul Henschel & Zustand contributors |
| **`@ffmpeg/ffmpeg`** | `0.12.15` | **MIT** | Web Worker wrapper for FFmpeg.wasm | Jerome Wu & FFmpeg.wasm contributors |
| **`@ffmpeg/util`** | `0.12.2` | **MIT** | Binary buffer and memory utilities | Jerome Wu & FFmpeg.wasm contributors |
| **`@ffmpeg/core`** | `0.12.10` | **LGPL-2.1-or-later** | Compiled WebAssembly FFmpeg core binary | FFmpeg project & Jerome Wu |
| **`heic2any`** | `0.0.4` | **MIT / LGPL-3.0** | HEIC/HEIF decoding via libheif WASM | Alex Corvi (JS wrapper) & struktur AG (libheif) |
| **`@jsquash/avif`** | `2.1.1` | **Apache-2.0** | High-performance AVIF encoder/decoder | Google Chrome Labs / jSquash contributors |
| **`utif`** | `3.1.0` | **MIT** | Fast TIFF image decoder | Ivan Kuckir |
| **`jszip`** | `3.10.1` | **MIT** | In-browser multi-file ZIP archive generator | Stuart Knightley & JSZip contributors |
| **`minisearch`** | `7.1.0` | **MIT** | In-memory client-side tool search index | Luca Ongaro |
| **`zod`** | `3.24.0` | **MIT** | Runtime schema and API payload validator | Colin McDonnell |
| **`marked`** | `15.0.0` | **MIT** | Markdown parser for educational guides | Christopher Jeffrey & Marked contributors |
| **`gray-matter`** | `4.0.3` | **MIT** | Frontmatter parser for markdown files | Jon Schlinkert |
| **`clsx`** | `2.1.1` | **MIT** | Conditional CSS class constructor | Luke Edwards |
| **`tailwind-merge`**| `2.6.0` | **MIT** | Tailwind utility deduplication | Dany Castillo |
| **`next-themes`** | `0.4.6` | **MIT** | Theme switching and dark mode persistence | Paco Coursey |

---

## 2. Development & Quality Assurance Dependencies

| Package | Version | Licence | Purpose |
| :--- | :---: | :---: | :--- |
| **`@playwright/test`** | `1.50.0` | **Apache-2.0** | Cross-browser End-to-End testing runner |
| **`@axe-core/playwright`** | `4.10.0` | **MPL-2.0** | Automated WCAG 2.1 accessibility auditing |
| **`vitest`** | `3.0.0` | **MIT** | Fast unit and integration testing engine |
| **`typescript`** | `5.7.0` | **Apache-2.0** | Static typing and compiler |
| **`tailwindcss`** | `3.4.17` | **MIT** | Utility-first CSS styling engine |
| **`postcss`** | `8.4.49` | **MIT** | CSS transformation tool |
| **`autoprefixer`** | `10.4.20` | **MIT** | CSS vendor prefix automation |
| **`eslint`** | `8.57.1` | **MIT** | JavaScript / TypeScript static linter |
| **`prettier`** | `3.4.2` | **MIT** | Code formatting rules |

---

## 3. LGPL Compliance & Binary Distribution Terms

### 3.1. FFmpeg (LGPL v2.1 or later)
- **Source Code**: FFmpeg is licensed under the GNU Lesser General Public License version 2.1 or later. The underlying FFmpeg source code used to compile `@ffmpeg/core@0.12.10` is available at [https://github.com/ffmpegwasm/ffmpeg.wasm-core](https://github.com/ffmpegwasm/ffmpeg.wasm-core) and upstream at [https://ffmpeg.org](https://ffmpeg.org).
- **Dynamic Linking / WASM Boundary**: The FFmpeg core (`ffmpeg-core.wasm`) is distributed as an independent, unbundled WebAssembly module loaded over network boundaries (`fetch()`). It is not statically compiled or merged into Hurrykit's proprietary application code. Users or developers can substitute an alternative compiled `ffmpeg-core.wasm` build by specifying custom base URLs via standard browser development tools or proxy configurations.

### 3.2. libheif (LGPL v3.0)
- **Source Code**: libheif is an ISO/IEC 23008-12:2017 HEIF file format decoder and encoder developed by struktur AG, licensed under the GNU Lesser General Public License version 3.0. Source code is accessible at [https://github.com/strukturag/libheif](https://github.com/strukturag/libheif).
- **Separation**: The libheif WebAssembly binary is loaded dynamically on-demand inside an isolated Web Worker only when HEIC/HEIF files are queued for decoding.

---

## 4. Full Licence Texts

### MIT Licence
```text
Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

### Apache Licence Version 2.0
```text
Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
```
