/**
 * FFmpeg Engine — handles all in-browser audio and video conversions.
 * Uses @ffmpeg/ffmpeg single-thread core (universal compatibility, no SharedArrayBuffer).
 */
import type { Engine, JobError, JobInput, JobProgress, JobResult } from '../types';
import { classifyError, makeJobError } from '../types';
import { memoryGuard } from '../shared/memory';
import { outputFileName } from '../shared/naming';
import { loadEngineAssets, revokeAssetUrls, type AssetUrls } from './assets';
import {
  buildAudioArgs,
  buildExtractAudioArgs,
  buildVideoArgs,
  buildGifPass2Args,
  buildHevcArgs,
  canRemux,
  emptyProbe,
  parseProbe,
  type ProbeResult,
} from './commands';

const IDLE_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes

export class FfmpegEngine implements Engine {
  readonly id = 'ffmpeg' as const;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private ff: any = null;
  private loaded = false;
  private idleTimer: ReturnType<typeof setTimeout> | null = null;
  private assetUrls: AssetUrls | null = null;

  canHandle(input: JobInput): boolean {
    const audioFormats = [
      'mp3',
      'wav',
      'aac',
      'm4a',
      'flac',
      'ogg',
      'opus',
      'wma',
      'aiff',
      'amr',
    ];
    const videoFormats = [
      'mp4',
      'mov',
      'mkv',
      'avi',
      'webm',
      'wmv',
      'flv',
      '3gp',
      'm4v',
      'mpeg',
      'gif',
    ];

    const from = input.from.toLowerCase();
    const to = input.to.toLowerCase();

    return (
      audioFormats.includes(to) ||
      videoFormats.includes(to) ||
      audioFormats.includes(from) ||
      videoFormats.includes(from)
    );
  }

  /**
   * Lazily loads the FFmpeg engine binaries on demand with download progress.
   * If already loaded, returns immediately.
   */
  async prepare(onProgress?: (p: JobProgress) => void): Promise<void> {
    if (this.loaded && this.ff) return;

    try {
      onProgress?.({
        stage: 'loading-engine',
        fraction: 0,
        message: 'Initializing converter engine…',
      });

      const urls = await loadEngineAssets((p) => {
        onProgress?.({
          stage: 'loading-engine',
          fraction: p.fraction * 0.9,
          message: p.message,
        });
      });
      this.assetUrls = urls;

      // Dynamic import to prevent @ffmpeg/ffmpeg from bloating initial bundle
      const { FFmpeg } = await import('@ffmpeg/ffmpeg');
      this.ff = new FFmpeg();

      await this.ff.load({
        coreURL: urls.coreURL,
        wasmURL: urls.wasmURL,
      });

      this.loaded = true;
      onProgress?.({
        stage: 'loading-engine',
        fraction: 1,
        message: 'Converter ready',
      });
    } catch (err) {
      this.loaded = false;
      this.ff = null;
      if (err && typeof err === 'object' && 'code' in err) throw err;
      throw makeJobError(
        'ENGINE_LOAD_FAILED',
        err instanceof Error ? err.message : String(err),
        true,
      );
    }
  }

  async run(
    input: JobInput,
    onProgress: (p: JobProgress) => void,
    signal: AbortSignal,
  ): Promise<JobResult> {
    this.resetIdleTimer();

    // 1. Pre-flight memory guard check with tool-specific limits & phone limits
    const toolLimits = input.limits ?? { maxBytes: 500 * 1024 * 1024, warnBytes: 150 * 1024 * 1024 };
    const memCheck = memoryGuard(input.file, toolLimits);
    if (!memCheck.ok && memCheck.status === 'block') {
      throw makeJobError(
        memCheck.code ?? 'TOO_LARGE',
        memCheck.message ?? 'This file is too large for your device.',
        false,
      );
    }

    if (signal.aborted) throw makeJobError('CANCELLED');

    // 2. Prepare engine if not already loaded
    await this.prepare(onProgress);
    if (signal.aborted) throw makeJobError('CANCELLED');

    // Screen Wake Lock (prevents mobile phone screen lock from killing conversion tab)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let wakeLock: any = null;
    if (typeof navigator !== 'undefined' && 'wakeLock' in navigator) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        wakeLock = await (navigator as any).wakeLock.request('screen');
      } catch {
        // Best-effort; continue if rejected
      }
    }

    const { file, from, to, options, toolId } = input;

    // 3. Register abort listener to terminate FFmpeg instance immediately
    const onAbort = () => {
      try {
        this.ff?.terminate();
      } catch {
        // Ignore termination error
      }
      this.loaded = false;
      this.ff = null;
    };
    signal.addEventListener('abort', onAbort, { once: true });

    const inExt = from === 'jfif' ? 'jpg' : from;
    const inName = `input.${inExt}`;
    const outName = `output.${to}`;

    const logLines: string[] = [];
    const logHandler = ({ message }: { message: string }) => {
      logLines.push(message);
    };

    let currentAction = 'Converting';

    try {
      onProgress({ stage: 'reading', fraction: 0.05, message: 'Reading input file…' });

      // 4. Write input file to virtual filesystem
      // Note: Scoped and immediately released so GC can reclaim JS heap memory before probe/encode
      {
        let fileData: Uint8Array | null =
          typeof file.arrayBuffer === 'function'
            ? new Uint8Array(await file.arrayBuffer())
            : await (async () => {
                const { fetchFile } = await import('@ffmpeg/util');
                return fetchFile(file);
              })();
        await this.ff.writeFile(inName, fileData);
        fileData = null; // Release reference
      }

      if (signal.aborted) throw makeJobError('CANCELLED');

      // 5. Attach log and progress listeners
      this.ff.on('log', logHandler);

      const progressHandler = ({ progress }: { progress: number }) => {
        const fraction = Math.min(0.95, 0.2 + Math.max(0, Math.min(1, progress)) * 0.7);
        onProgress({
          stage: 'converting',
          fraction,
          message: `${currentAction}… ${Math.round(fraction * 100)}%`,
        });
      };
      this.ff.on('progress', progressHandler);

      // 6. Probe media streams for video and audio jobs
      let probe: ProbeResult | null = null;
      const isVideo =
        [
          'mp4',
          'mov',
          'mkv',
          'avi',
          'webm',
          'wmv',
          'flv',
          '3gp',
          'm4v',
          'mpeg',
          'gif',
        ].includes(from) ||
        ['mp4', 'mov', 'mkv', 'webm', 'gif'].includes(to);

      const isAudio =
        [
          'mp3',
          'wav',
          'aac',
          'm4a',
          'flac',
          'ogg',
          'opus',
          'wma',
          'aiff',
          'amr',
        ].includes(from);

      if (isVideo || isAudio) {
        onProgress({ stage: 'detecting', fraction: 0.1, message: 'Analyzing stream codecs & resolution…' });
        await this.ff.exec(['-i', inName, '-f', 'null', '-']);
        probe = parseProbe(logLines.join('\n'));
      }

      if (signal.aborted) throw makeJobError('CANCELLED');

      const isExtract =
        toolId === 'mp4-to-mp3' ||
        toolId === 'mov-to-mp3' ||
        toolId === 'webm-to-mp3' ||
        (isVideo && ['mp3', 'wav', 'm4a', 'flac', 'ogg', 'opus'].includes(to));

      // Edge case: extracting audio from a video that has no audio track
      if (isExtract && probe && !probe.hasAudio) {
        throw makeJobError(
          'UNSUPPORTED_INPUT',
          'This video file does not contain an audio track to extract.',
          false,
        );
      }

      // Edge case: corrupt audio input file with no audio streams
      if (isAudio && probe && !probe.hasAudio && logLines.length > 0) {
        const fullLog = logLines.join('\n').toLowerCase();
        if (
          fullLog.includes('invalid data found') ||
          fullLog.includes('could not find codec parameters') ||
          fullLog.includes('header missing')
        ) {
          throw makeJobError('CORRUPT_FILE', 'The audio file appears to be damaged or incomplete.', false);
        }
      }

      // 7. Determine conversion strategy & build commands
      let args: string[];
      const notes: string[] = [];
      const isGifOutput = to === 'gif';
      const isHevc = toolId === 'hevc-to-h264';
      const isGifToMp4 = to === 'mp4' && (from === 'gif' || probe?.videoCodec === 'gif');

      if (isExtract) {
        currentAction = 'Extracting audio';
        onProgress({ stage: 'converting', fraction: 0.18, message: 'Extracting audio track…' });
        args = buildExtractAudioArgs(inName, outName, to, options, probe);
        notes.push('Extracted primary audio track');
      } else if (isHevc) {
        currentAction = 'Re-encoding HEVC';
        onProgress({ stage: 'converting', fraction: 0.18, message: 'Re-encoding HEVC to H.264…' });
        args = buildHevcArgs(inName, outName, options, probe);
        notes.push('Re-encoded from HEVC (H.265) to standard H.264 MP4');
      } else if (isGifOutput) {
        currentAction = 'Rendering GIF';
        // Two-pass GIF: Pass 1 generates palette.png
        onProgress({ stage: 'converting', fraction: 0.15, message: 'Generating colour palette…' });
        const pass1Args = buildVideoArgs(inName, 'palette.png', 'gif', options, probe ?? emptyProbe());
        const pass1Code = await this.ff.exec(pass1Args);
        if (pass1Code !== 0) {
          throw this.diagnoseExitFailure(pass1Code, logLines);
        }
        if (signal.aborted) throw makeJobError('CANCELLED');

        onProgress({ stage: 'converting', fraction: 0.4, message: 'Rendering GIF frames…' });
        // Pass 2 uses palette
        args = buildGifPass2Args(inName, outName, options);
        notes.push('Generated animated GIF with custom 2-pass palette');
      } else if (isGifToMp4) {
        currentAction = 'Converting GIF to MP4';
        onProgress({ stage: 'converting', fraction: 0.18, message: 'Converting GIF to H.264 MP4…' });
        args = buildVideoArgs(inName, outName, to, options, probe ?? emptyProbe());
        notes.push('Converted animated GIF to H.264 MP4');
      } else if (isVideo && probe) {
        const canStreamCopy =
          (to === 'mp4' || to === 'mov' || to === 'mkv') &&
          canRemux(probe, to) &&
          !options['force-reencode'] &&
          !options['forceReencode'];

        if (canStreamCopy) {
          currentAction = 'Fast stream copy';
          onProgress({ stage: 'converting', fraction: 0.18, message: 'Fast copy (no quality loss)…' });
          notes.push('Fast stream copy — no quality loss');
          args = buildVideoArgs(inName, outName, to, options, probe);
        } else {
          currentAction = 'Re-encoding video';
          onProgress({ stage: 'converting', fraction: 0.18, message: 'Re-encoding video (H.264)…' });
          notes.push('Re-encoded with H.264 for universal compatibility');
          args = buildVideoArgs(inName, outName, to, options, probe);
        }
      } else {
        currentAction = 'Converting audio';
        args = buildAudioArgs(inName, outName, to, options, probe);
      }

      // 8. Execute conversion command with automatic remux -> transcode fallback (Case 39)
      onProgress({ stage: 'converting', fraction: 0.2, message: `${currentAction}…` });
      let exitCode = await this.ff.exec(args);

      if (exitCode !== 0 && currentAction === 'Fast stream copy' && isVideo && probe) {
        // Case 39: Remux failed because of container incompatibility -> retry as transcode
        onProgress({
          stage: 'converting',
          fraction: 0.25,
          message: 'Fast copy incompatible, re-encoding video…',
        });
        currentAction = 'Re-encoding video';
        const transcodeOptions = { ...options, 'force-reencode': true };
        args = buildVideoArgs(inName, outName, to, transcodeOptions, probe);
        exitCode = await this.ff.exec(args);

        // Update note to inform user of the fallback
        notes.length = 0;
        notes.push('Fast copy was incompatible; re-encoded with H.264');
      }

      this.ff.off('progress', progressHandler);

      if (exitCode !== 0) {
        throw this.diagnoseExitFailure(exitCode, logLines);
      }

      if (signal.aborted) throw makeJobError('CANCELLED');

      // 9. Inspect probe to attach informative metadata notes
      if (probe?.width && (probe.width >= 3840 || (probe.height && probe.height >= 2160))) {
        notes.push('4K video source');
      }
      if (probe?.isInterlaced) {
        notes.push('Deinterlaced source video');
      }
      if (isVideo && !isExtract && !isGifOutput && !isGifToMp4) {
        if (!probe?.hasAudio || options['audio'] === 'remove') {
          notes.push('Silent video (no audio track)');
        }
      }
      if (probe?.isVariableFrameRate && currentAction.includes('Re-encoding')) {
        notes.push('Normalized to constant frame rate (CFR)');
      }

      // Case 27: Lossy source to lossless target (e.g. mp3 -> wav)
      const lossyAudioFormats = ['mp3', 'm4a', 'aac', 'ogg', 'opus', 'wma', 'amr'];
      const losslessAudioFormats = ['wav', 'flac', 'aiff'];
      if (lossyAudioFormats.includes(from.toLowerCase()) && losslessAudioFormats.includes(to.toLowerCase())) {
        notes.push('Lossy-to-lossless conversion does not restore lost acoustic fidelity.');
      }

      // Case 13: Input already in target format
      if (from.toLowerCase() === to.toLowerCase()) {
        notes.push('File is already in the target format. Re-encoding will create a new copy.');
      }

      onProgress({ stage: 'finishing', fraction: 0.95, message: 'Finalizing file…' });

      // 10. Read output from virtual filesystem
      const mime = toMime(to);
      let blob: Blob;
      {
        const outputData = (await this.ff.readFile(outName)) as Uint8Array;
        if (!outputData || outputData.byteLength === 0) {
          throw makeJobError('ENCODE_FAILED', 'Conversion produced an empty file. Try adjusting settings.', true);
        }
        blob = new Blob([outputData as unknown as BlobPart], { type: mime });
      }

      onProgress({ stage: 'finishing', fraction: 1, message: 'Done' });

      return {
        blob,
        fileName: outputFileName(file.name, to),
        mime,
        bytes: blob.size,
        notes: notes.length > 0 ? notes : undefined,
      };
    } catch (err) {
      if (err && typeof err === 'object' && 'code' in err) throw err;
      throw classifyError(err);
    } finally {
      this.ff?.off('log', logHandler);
      signal.removeEventListener('abort', onAbort);

      try {
        await wakeLock?.release();
      } catch {
        // WakeLock release is best effort
      }

      // Clean up virtual filesystem to prevent WebAssembly heap memory leakage
      try {
        await this.ff?.deleteFile(inName);
        await this.ff?.deleteFile(outName);
        await this.ff?.deleteFile('palette.png');
      } catch {
        // Non-fatal virtual filesystem cleanup
      }

      this.resetIdleTimer();
    }
  }

  /** Free memory, abort active workers, and revoke asset blob URLs */
  dispose(): void {
    if (this.idleTimer) {
      clearTimeout(this.idleTimer);
      this.idleTimer = null;
    }
    try {
      this.ff?.terminate();
    } catch {
      // Ignore termination error
    }
    this.ff = null;
    this.loaded = false;

    if (this.assetUrls) {
      revokeAssetUrls(this.assetUrls);
      this.assetUrls = null;
    }
  }

  /** Diagnose non-zero exit code based on FFmpeg log messages */
  private diagnoseExitFailure(exitCode: number, logLines: string[]): JobError {
    const fullLog = logLines.join('\n').toLowerCase();

    if (
      fullLog.includes('invalid data found') ||
      fullLog.includes('corrupt') ||
      fullLog.includes('could not find codec parameters') ||
      fullLog.includes('header missing')
    ) {
      return makeJobError(
        'CORRUPT_FILE',
        `FFmpeg demux error (exit code ${exitCode})`,
        false,
      );
    }

    if (
      fullLog.includes('out of memory') ||
      fullLog.includes('cannot allocate memory') ||
      fullLog.includes('allocation failed')
    ) {
      return makeJobError(
        'OUT_OF_MEMORY',
        `FFmpeg memory allocation error (exit code ${exitCode})`,
        false,
      );
    }

    if (
      fullLog.includes('unknown encoder') ||
      fullLog.includes('unsupported codec') ||
      fullLog.includes('unsupported input')
    ) {
      return makeJobError(
        'UNSUPPORTED_INPUT',
        `Unsupported codec in input (exit code ${exitCode})`,
        false,
      );
    }

    return makeJobError(
      'ENCODE_FAILED',
      `FFmpeg conversion error (exit code ${exitCode})`,
      true,
    );
  }

  private resetIdleTimer(): void {
    if (this.idleTimer) clearTimeout(this.idleTimer);
    this.idleTimer = setTimeout(() => this.dispose(), IDLE_TIMEOUT_MS);
  }
}

function toMime(ext: string): string {
  const map: Record<string, string> = {
    mp3: 'audio/mpeg',
    wav: 'audio/wav',
    aac: 'audio/aac',
    m4a: 'audio/mp4',
    flac: 'audio/flac',
    ogg: 'audio/ogg',
    opus: 'audio/opus',
    aiff: 'audio/aiff',
    wma: 'audio/x-ms-wma',
    amr: 'audio/amr',
    mp4: 'video/mp4',
    mov: 'video/quicktime',
    mkv: 'video/x-matroska',
    webm: 'video/webm',
    gif: 'image/gif',
    avi: 'video/x-msvideo',
    wmv: 'video/x-ms-wmv',
    flv: 'video/x-flv',
    '3gp': 'video/3gpp',
    m4v: 'video/x-m4v',
    mpeg: 'video/mpeg',
  };
  return map[ext.toLowerCase()] ?? 'application/octet-stream';
}
