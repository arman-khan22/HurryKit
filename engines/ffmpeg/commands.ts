/**
 * FFmpeg command builders for audio and video conversions.
 * Generates exact, deterministic FFmpeg argument arrays for every Phase 1 strategy.
 */
import {
  canRemux,
  emptyProbe,
  parseProbe,
  type ProbeResult,
} from './probe';

export { canRemux, emptyProbe, parseProbe, type ProbeResult };

export type Options = Record<string, string | number | boolean>;

// ─── Audio command builder ────────────────────────────────────────────────────

export function buildAudioArgs(
  inName: string,
  outName: string,
  to: string,
  options: Options,
  probe?: ProbeResult | null,
): string[] {
  const base = ['-i', inName, '-vn', '-map_metadata', '0'];
  const bitrate = Number(options['bitrate'] ?? 192);
  const quality = Number(options['quality'] ?? 5);
  const bitdepth = String(options['bitdepth'] ?? 'pcm_s16le');
  const compression = Number(options['compression'] ?? 5);

  const extraArgs: string[] = [];

  // Channel configuration (Stereo vs Mono)
  if (options['channels'] === 'mono') {
    extraArgs.push('-ac', '1');
  } else if (options['channels'] === 'stereo') {
    extraArgs.push('-ac', '2');
  }

  // Sample rate configuration
  const customSampleRate = options['sample-rate'] ?? options['sampleRate'];
  if (customSampleRate && customSampleRate !== 'original') {
    extraArgs.push('-ar', String(customSampleRate));
  } else if (to.toLowerCase() === 'mp3' && probe?.sampleRate && probe.sampleRate > 48000) {
    // libmp3lame (MPEG Layer III) only supports sample rates up to 48000 Hz.
    // Clamp high sample rate inputs (e.g. 96 kHz, 192 kHz) to 48 kHz so encoding succeeds.
    extraArgs.push('-ar', '48000');
  }

  switch (to.toLowerCase()) {
    case 'mp3':
      return [
        ...base,
        '-c:a',
        'libmp3lame',
        '-b:a',
        `${bitrate}k`,
        ...extraArgs,
        outName,
      ];
    case 'm4a':
      return [
        ...base,
        '-c:a',
        'aac',
        '-b:a',
        `${bitrate}k`,
        '-movflags',
        '+faststart',
        ...extraArgs,
        outName,
      ];
    case 'wav':
      return [...base, '-c:a', bitdepth, ...extraArgs, outName];
    case 'flac':
      return [
        ...base,
        '-c:a',
        'flac',
        '-compression_level',
        String(compression),
        ...extraArgs,
        outName,
      ];
    case 'ogg':
      return [
        ...base,
        '-c:a',
        'libvorbis',
        '-q:a',
        String(quality),
        ...extraArgs,
        outName,
      ];
    case 'opus':
      return [
        ...base,
        '-c:a',
        'libopus',
        '-b:a',
        `${bitrate}k`,
        ...extraArgs,
        outName,
      ];
    case 'aiff':
      return [...base, '-c:a', 'pcm_s16be', ...extraArgs, outName];
    default:
      throw new Error(`Unsupported audio output format: ${to}`);
  }
}

/** Audio extraction from video files (mp4-to-mp3, mov-to-mp3, etc.) */
export function buildExtractAudioArgs(
  inName: string,
  outName: string,
  to: string,
  options: Options,
  probe?: ProbeResult | null,
): string[] {
  const bitrate = Number(options['bitrate'] ?? 192);
  const extraArgs: string[] = [];

  // Channel configuration
  if (options['channels'] === 'mono') {
    extraArgs.push('-ac', '1');
  } else if (options['channels'] === 'stereo') {
    extraArgs.push('-ac', '2');
  }

  // Sample rate configuration
  const customSampleRate = options['sample-rate'] ?? options['sampleRate'];
  if (customSampleRate && customSampleRate !== 'original') {
    extraArgs.push('-ar', String(customSampleRate));
  } else if (to.toLowerCase() === 'mp3' && probe?.sampleRate && probe.sampleRate > 48000) {
    extraArgs.push('-ar', '48000');
  }

  const base = ['-i', inName, '-vn', '-map', '0:a:0', '-map_metadata', '0'];

  switch (to.toLowerCase()) {
    case 'mp3':
      return [
        ...base,
        '-c:a',
        'libmp3lame',
        '-b:a',
        `${bitrate}k`,
        ...extraArgs,
        outName,
      ];
    case 'wav':
      return [...base, '-c:a', 'pcm_s16le', ...extraArgs, outName];
    case 'm4a':
      return [
        ...base,
        '-c:a',
        'aac',
        '-b:a',
        `${bitrate}k`,
        '-movflags',
        '+faststart',
        ...extraArgs,
        outName,
      ];
    default:
      return buildAudioArgs(inName, outName, to, options, probe);
  }
}

// ─── Video options & filters ──────────────────────────────────────────────────

const CRF_MAP: Record<string, number> = {
  high: 20,
  balanced: 23,
  small: 28,
};

function qualityCrf(options: Options): number {
  const q = String(options['quality'] ?? 'balanced').toLowerCase();
  return CRF_MAP[q] ?? 23;
}

function buildVideoFilter(options: Options, isInterlaced: boolean): string[] {
  const filters: string[] = [];

  // Deinterlace if source interlaced
  if (isInterlaced) {
    filters.push('yadif');
  }

  // Resolution downscaling
  const res = String(options['resolution'] ?? 'original');
  if (res !== 'original') {
    filters.push(`scale=-2:${res}`);
  }

  // Ensure dimensions are divisible by 2 (mandatory for H.264 / yuv420p)
  filters.push('scale=trunc(iw/2)*2:trunc(ih/2)*2');

  return ['-vf', filters.join(',')];
}

// ─── Video command builders ───────────────────────────────────────────────────

export function buildVideoArgs(
  inName: string,
  outName: string,
  to: string,
  options: Options,
  probe: ProbeResult,
): string[] {
  const removeAudio = options['audio'] === 'remove';
  const forceReencode =
    options['force-reencode'] === true || options['forceReencode'] === true;
  const target = to.toLowerCase();

  // 1. Remux (Stream copy fast path)
  if (target === 'mp4' && canRemux(probe, 'mp4') && !forceReencode) {
    const args = ['-i', inName, '-map_metadata', '0', '-map', '0:v:0'];
    if (probe.hasAudio && !removeAudio) {
      args.push('-map', '0:a:0?', '-c', 'copy');
    } else {
      args.push('-c:v', 'copy', '-an');
    }
    args.push('-movflags', '+faststart', outName);
    return args;
  }

  if (target === 'mov' && canRemux(probe, 'mov') && !forceReencode) {
    const args = ['-i', inName, '-map_metadata', '0', '-map', '0:v:0'];
    if (probe.hasAudio && !removeAudio) {
      args.push('-map', '0:a:0?', '-c', 'copy');
    } else {
      args.push('-c:v', 'copy', '-an');
    }
    args.push(outName);
    return args;
  }

  if (target === 'mkv' && canRemux(probe, 'mkv') && !forceReencode) {
    const args = ['-i', inName, '-map_metadata', '0', '-map', '0:v:0'];
    if (probe.hasAudio && !removeAudio) {
      args.push('-map', '0:a:0?', '-c', 'copy');
    } else {
      args.push('-c:v', 'copy', '-an');
    }
    args.push(outName);
    return args;
  }

  // 2. WebM (VP9 + Opus)
  if (target === 'webm') {
    const crf = qualityCrf(options);
    const filter = buildVideoFilter(options, probe.isInterlaced);
    const args = [
      '-i',
      inName,
      '-map_metadata',
      '0',
      '-map',
      '0:v:0',
      ...filter,
      '-c:v',
      'libvpx-vp9',
      '-crf',
      String(crf),
      '-b:v',
      '0',
      '-row-mt',
      '1',
    ];

    if (removeAudio || !probe.hasAudio) {
      args.push('-an');
    } else {
      args.push('-map', '0:a:0?', '-c:a', 'libopus', '-b:a', '96k');
    }

    args.push(outName);
    return args;
  }

  // 3. GIF (Pass 1: Palette Generation)
  if (target === 'gif') {
    const width = Number(options['width'] ?? 480);
    const fps = Number(options['fps'] ?? 12);
    return [
      '-i',
      inName,
      '-vf',
      `fps=${fps},scale=${width}:-1:flags=lanczos,palettegen`,
      'palette.png',
    ];
  }

  // 4. GIF to MP4
  if (target === 'mp4' && probe.videoCodec === 'gif') {
    return [
      '-i',
      inName,
      '-c:v',
      'libx264',
      '-preset',
      'veryfast',
      '-crf',
      '23',
      '-movflags',
      '+faststart',
      '-pix_fmt',
      'yuv420p',
      '-vf',
      'scale=trunc(iw/2)*2:trunc(ih/2)*2',
      '-an',
      outName,
    ];
  }

  // 5. General Transcode to MP4 (H.264 + AAC)
  const crf = qualityCrf(options);
  const filter = buildVideoFilter(options, probe.isInterlaced);

  const args = [
    '-i',
    inName,
    '-map_metadata',
    '0',
    '-map',
    '0:v:0',
    ...filter,
    '-c:v',
    'libx264',
    '-preset',
    'veryfast',
    '-crf',
    String(crf),
    '-pix_fmt',
    'yuv420p',
    '-fps_mode',
    'cfr',
  ];

  if (!removeAudio && probe.hasAudio) {
    args.push('-map', '0:a:0?', '-c:a', 'aac', '-b:a', '128k');
  } else {
    args.push('-an');
  }

  args.push('-movflags', '+faststart', outName);
  return args;
}

/** Build the second pass of a GIF conversion (after palette.png is generated) */
export function buildGifPass2Args(
  inName: string,
  outName: string,
  options: Options,
): string[] {
  const width = Number(options['width'] ?? 480);
  const fps = Number(options['fps'] ?? 12);
  return [
    '-i',
    inName,
    '-i',
    'palette.png',
    '-lavfi',
    `fps=${fps},scale=${width}:-1:flags=lanczos[x];[x][1:v]paletteuse`,
    outName,
  ];
}

/** HEVC to H.264 (universal compatibility transcode) */
export function buildHevcArgs(
  inName: string,
  outName: string,
  options: Options,
  probe?: ProbeResult | null,
): string[] {
  const crf = qualityCrf(options);
  const removeAudio = options['audio'] === 'remove';
  const filter = buildVideoFilter(options, probe?.isInterlaced ?? false);

  const args = [
    '-i',
    inName,
    '-map_metadata',
    '0',
    '-map',
    '0:v:0',
    ...filter,
    '-c:v',
    'libx264',
    '-preset',
    'veryfast',
    '-crf',
    String(crf),
    '-pix_fmt',
    'yuv420p',
    '-fps_mode',
    'cfr',
  ];

  if (!removeAudio && probe?.hasAudio !== false) {
    args.push('-map', '0:a:0?', '-c:a', 'aac', '-b:a', '128k');
  } else {
    args.push('-an');
  }

  args.push('-movflags', '+faststart', outName);
  return args;
}
