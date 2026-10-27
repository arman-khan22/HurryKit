/**
 * Probe utilities for inspecting media containers, streams, and codecs
 * via FFmpeg stderr/log output without external binaries.
 */

export type ProbeResult = {
  videoCodec: string | null;
  audioCodec: string | null;
  sampleRate: number | null; // e.g. 44100, 48000, 96000
  channels: number | null; // e.g. 1, 2, 6
  channelLayout: string | null; // e.g. 'mono', 'stereo', '5.1'
  width: number | null;
  height: number | null;
  duration: number | null; // in seconds
  fps: number | null;
  rotation: number | null; // degrees: 90, 180, 270, -90, etc.
  pixFmt: string | null;
  bitrateKbps: number | null;
  hasVideo: boolean;
  hasAudio: boolean;
  isInterlaced: boolean;
  isVariableFrameRate: boolean;
};

/** Return an empty probe result for unprobed / audio-only files */
export function emptyProbe(): ProbeResult {
  return {
    videoCodec: null,
    audioCodec: null,
    sampleRate: null,
    channels: null,
    channelLayout: null,
    width: null,
    height: null,
    duration: null,
    fps: null,
    rotation: null,
    pixFmt: null,
    bitrateKbps: null,
    hasVideo: false,
    hasAudio: false,
    isInterlaced: false,
    isVariableFrameRate: false,
  };
}

/**
 * Parse FFmpeg stderr log output from an inspection run (`-i input -f null -`).
 */
export function parseProbe(log: string): ProbeResult {
  const probe = emptyProbe();
  if (!log) return probe;

  // 1. Duration & Overall Bitrate
  // e.g. "Duration: 00:01:23.45, start: 0.000000, bitrate: 1542 kb/s"
  const durMatch = log.match(/Duration:\s+(\d+):(\d+):(\d+(?:\.\d+)?)/i);
  if (durMatch?.[1] && durMatch[2] && durMatch[3]) {
    const hours = parseInt(durMatch[1], 10);
    const mins = parseInt(durMatch[2], 10);
    const secs = parseFloat(durMatch[3]);
    probe.duration = Math.round((hours * 3600 + mins * 60 + secs) * 100) / 100;
  }

  const bitMatch = log.match(/bitrate:\s+(\d+)\s+kb\/s/i);
  if (bitMatch?.[1]) {
    probe.bitrateKbps = parseInt(bitMatch[1], 10);
  }

  // 2. Video Stream Details
  // e.g. "Stream #0:0: Video: h264 (High) (avc1 / 0x31637661), yuv420p(tv), 1920x1080 [SAR 1:1 DAR 16:9], 29.97 fps"
  const videoStreamMatch = log.match(
    /Stream\s+#\d+:\d+(?:\[[^\]]+\])?(?:\([^)]+\))?:\s+Video:\s+([a-zA-Z0-9_-]+)(?:[^\n]*)/i,
  );

  if (videoStreamMatch?.[1]) {
    probe.hasVideo = true;
    probe.videoCodec = videoStreamMatch[1].toLowerCase();
    const videoLine = videoStreamMatch[0];

    // Pixel format (e.g. yuv420p, yuv422p, nv12)
    const pixFmtMatch = videoLine.match(/,\s+([a-zA-Z0-9]+)(?:\([^)]+\))?,\s+\d{2,5}x\d{2,5}/i);
    if (pixFmtMatch?.[1]) {
      probe.pixFmt = pixFmtMatch[1].toLowerCase();
    }

    // Dimensions (e.g. 1920x1080)
    const dimMatch = videoLine.match(/(\d{2,5})x(\d{2,5})/);
    if (dimMatch?.[1] && dimMatch[2]) {
      probe.width = parseInt(dimMatch[1], 10);
      probe.height = parseInt(dimMatch[2], 10);
    }

    // FPS (e.g. 30 fps, 29.97 fps)
    const fpsMatch = videoLine.match(/(\d+(?:\.\d+)?)\s+fps/i);
    if (fpsMatch?.[1]) {
      probe.fps = parseFloat(fpsMatch[1]);
    }
  }

  // 3. Audio Stream Details
  // e.g. "Stream #0:1: Audio: aac (LC) (mp4a / 0x6134706D), 48000 Hz, stereo, fltp, 128 kb/s"
  // or "Stream #0:0: Audio: flac, 96000 Hz, stereo, s32 (24 bit)"
  // or "Stream #0:0: Audio: opus, 48000 Hz, mono, fltp"
  const audioStreamMatch = log.match(
    /Stream\s+#\d+:\d+(?:\[[^\]]+\])?(?:\([^)]+\))?:\s+Audio:\s+([a-zA-Z0-9_-]+)(?:[^\n]*)/i,
  );

  if (audioStreamMatch?.[1]) {
    probe.hasAudio = true;
    probe.audioCodec = audioStreamMatch[1].toLowerCase();
    const audioLine = audioStreamMatch[0];

    const hzMatch = audioLine.match(/(\d{4,6})\s+Hz/i);
    if (hzMatch?.[1]) {
      probe.sampleRate = parseInt(hzMatch[1], 10);
    }

    if (/\bmono\b/i.test(audioLine)) {
      probe.channels = 1;
      probe.channelLayout = 'mono';
    } else if (/\bstereo\b/i.test(audioLine)) {
      probe.channels = 2;
      probe.channelLayout = 'stereo';
    } else if (/\b5\.1\b/i.test(audioLine)) {
      probe.channels = 6;
      probe.channelLayout = '5.1';
    } else {
      const chMatch = audioLine.match(/(\d+)\s+channels?/i);
      if (chMatch?.[1]) {
        probe.channels = parseInt(chMatch[1], 10);
      }
    }
  }

  // 4. Rotation Detection (Metadata tags or side data)
  // e.g. "displaymatrix: rotation of -90.00 degrees" or "rotate : 90"
  const sideDataRotMatch = log.match(/rotation of\s+(-?\d+(?:\.\d+)?)\s+degrees/i);
  const tagRotMatch = log.match(/rotate\s*:\s*(-?\d+)/i);

  if (sideDataRotMatch?.[1]) {
    probe.rotation = Math.round(parseFloat(sideDataRotMatch[1]));
  } else if (tagRotMatch?.[1]) {
    probe.rotation = parseInt(tagRotMatch[1], 10);
  }

  // 5. Interlacing Detection
  // Look for top-field-first (tff) or bottom-field-first (bff) indicators
  probe.isInterlaced =
    /\b(tff|bff|interlaced)\b/i.test(log) && !/\bprogressive\b/i.test(log);

  // 6. Variable Frame Rate (VFR) Detection
  probe.isVariableFrameRate = /\b(vfr|variable)\b/i.test(log);

  return probe;
}

/**
 * Check if the input streams can be directly remuxed (stream-copied) into the target container.
 * Remuxing is 10x-50x faster than transcoding and avoids quality loss.
 */
export function canRemux(probe: ProbeResult, toFormat: string): boolean {
  if (!probe.hasVideo && !probe.hasAudio) return false;

  const target = toFormat.toLowerCase();

  if (target === 'mp4') {
    // MP4 container requires H.264 / AVC video and AAC / MP3 audio
    const compatVideoCodecs = ['h264', 'avc', 'avc1'];
    const compatAudioCodecs = ['aac', 'mp3', 'mp4a'];

    const videoOk = !probe.hasVideo || (probe.videoCodec !== null && compatVideoCodecs.includes(probe.videoCodec));
    const audioOk = !probe.hasAudio || (probe.audioCodec !== null && compatAudioCodecs.includes(probe.audioCodec));

    // Interlaced video requires deinterlacing; cannot copy directly
    if (probe.isInterlaced) return false;

    // Non-standard pixel formats (e.g. 10-bit or 4:4:4) might not play in web browsers if remuxed
    if (probe.pixFmt && probe.pixFmt !== 'yuv420p') return false;

    return videoOk && audioOk;
  }

  if (target === 'mov') {
    // QuickTime MOV container is very flexible (supports H.264, ProRes, HEVC, AAC, PCM)
    const compatVideoCodecs = ['h264', 'avc', 'avc1', 'prores', 'hevc', 'h265'];
    const compatAudioCodecs = ['aac', 'mp3', 'pcm_s16le', 'pcm_s24le'];

    const videoOk = !probe.hasVideo || (probe.videoCodec !== null && compatVideoCodecs.includes(probe.videoCodec));
    const audioOk = !probe.hasAudio || (probe.audioCodec !== null && compatAudioCodecs.includes(probe.audioCodec));

    return videoOk && audioOk && !probe.isInterlaced;
  }

  if (target === 'mkv') {
    // Matroska supports virtually all codecs via stream copy
    return true;
  }

  return false;
}

/** Format seconds into a human-readable duration string (e.g. "01:23" or "01:12:45") */
export function formatDuration(seconds: number | null): string {
  if (seconds === null || isNaN(seconds) || seconds < 0) return '0:00';
  const totalSec = Math.floor(seconds);
  const hrs = Math.floor(totalSec / 3600);
  const mins = Math.floor((totalSec % 3600) / 60);
  const secs = totalSec % 60;

  const secStr = secs.toString().padStart(2, '0');
  if (hrs > 0) {
    const minStr = mins.toString().padStart(2, '0');
    return `${hrs}:${minStr}:${secStr}`;
  }
  return `${mins}:${secStr}`;
}
