# Hurrykit Error Codes & User-Facing Messages

This document defines every error code in the Hurrykit engine layer, its underlying cause, the exact user-facing message displayed by the UI, whether the error is recoverable, and the recommended user mitigation step.

---

## Error Code Mapping Table

| Error Code | Meaning / Cause | User-Facing Message | Recoverable | Recommended User Action |
| :--- | :--- | :--- | :---: | :--- |
| `UNSUPPORTED_INPUT` | The file format, container, or internal codec cannot be decoded by this tool. | *"This file type is not supported by this tool."* | No | Check the file format against the tool's supported inputs list, or use an alternative converter. |
| `CORRUPT_FILE` | The decoder failed because the file data is incomplete, truncated, or invalid. | *"This file looks damaged."* | No | Try re-exporting or re-downloading the original file before attempting conversion again. |
| `TOO_LARGE` | The input file size exceeds the tool's defined limit (e.g. >100MB for images, >500MB for video). | *"This file is bigger than this tool can handle on your device."* | No | Select a smaller file or convert the file on a desktop computer with more RAM. |
| `OUT_OF_MEMORY` | WebAssembly or the Web Worker exhausted available browser memory during decoding/encoding. | *"Your device ran out of memory. Try a smaller file."* | No | Close unused browser tabs, try a smaller file, or reduce output dimensions/quality. |
| `ENGINE_LOAD_FAILED` | Network or cache failure while loading engine code or WebAssembly core binaries. | *"Could not load the converter. Check your connection and try again."* | Yes | Verify internet connectivity, disable aggressive ad-blockers, and reload the page. |
| `ENCODE_FAILED` | Encoding or remuxing failed due to invalid encoder parameters or unsupported codec settings. | *"Conversion failed. Try a different setting."* | Yes | Try lowering the quality setting, choosing an alternative bitrate, or disabling custom options. |
| `UNSUPPORTED_BROWSER` | The browser lacks critical APIs (WebAssembly, Web Workers, or OffscreenCanvas). | *"Your browser cannot run this tool. Try Chrome or Safari."* | No | Switch to a modern version of Google Chrome, Apple Safari, Mozilla Firefox, or Microsoft Edge. |
| `CANCELLED` | The user intentionally cancelled the conversion while it was in progress. | *No error banner shown (or "Conversion was cancelled.")* | Yes | The file can be re-queued and restarted whenever the user wishes. |
| `UNKNOWN` | An unexpected runtime exception occurred that does not match standard failure categories. | *"Something went wrong. Nothing was uploaded."* | Yes | Retry the conversion. If the issue persists, report the bug with file details. |

---

## Architectural Principles

1. **Zero Data Leakage**: Even on unexpected errors, no file bytes, stack traces containing file paths, or private contents are ever sent to remote servers.
2. **Actionable Feedback**: Error messages avoid technical jargon (such as "SIGSEGV", "OOM in linear memory", or "demuxer eof") and provide clear guidance on what the user can do next.
3. **Graceful Worker Isolation**: Engine crashes in dedicated Web Workers are caught by `BaseWorkerWrapper`. The failed worker is terminated and a clean instance is spawned for subsequent jobs without requiring a page refresh.
