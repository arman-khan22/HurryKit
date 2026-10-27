import type { Tool } from '../schema';

const VIDEO_LIMITS_REMUX = {
  maxBytes: 2 * 1024 * 1024 * 1024, // 2 GB (remux is fast)
  warnBytes: 500 * 1024 * 1024,
  maxFiles: 5,
};

const VIDEO_LIMITS_TRANSCODE = {
  maxBytes: 500 * 1024 * 1024, // 500 MB (transcode is heavy)
  warnBytes: 150 * 1024 * 1024,
  maxFiles: 3,
};

const QUALITY_OPTION = {
  id: 'quality',
  label: 'Quality',
  type: 'select' as const,
  choices: [
    { value: 'high', label: 'High quality — larger file' },
    { value: 'balanced', label: 'Balanced (recommended)' },
    { value: 'small', label: 'Smaller file — lower quality' },
  ],
  default: 'balanced',
  help: 'Applies only when re-encoding is required.',
  advanced: false,
};

const RESOLUTION_OPTION = {
  id: 'resolution',
  label: 'Resolution',
  type: 'select' as const,
  choices: [
    { value: 'original', label: 'Original' },
    { value: '1080', label: '1080p' },
    { value: '720', label: '720p' },
    { value: '480', label: '480p' },
  ],
  default: 'original',
  help: 'Downscale for smaller file size. Only applies when re-encoding.',
  advanced: false,
};

const AUDIO_OPTION = {
  id: 'audio',
  label: 'Audio',
  type: 'select' as const,
  choices: [
    { value: 'keep', label: 'Keep audio' },
    { value: 'remove', label: 'Remove audio (silent video)' },
  ],
  default: 'keep',
  advanced: false,
};

const FORCE_REENCODE_OPTION = {
  id: 'force-reencode',
  label: 'Force re-encode',
  type: 'toggle' as const,
  default: false,
  help: 'Re-encode with H.264 even if fast copy is possible. Useful to fix playback bugs or reduce file size.',
  advanced: true,
};

const videoTools: Tool[] = [
  // mov-to-mp4 — iPhone and Mac videos
  {
    id: 'mov-to-mp4',
    slug: 'mov-to-mp4',
    kind: 'convert',
    department: 'video',
    from: ['mov'],
    to: 'mp4',
    engine: 'ffmpeg',
    strategy: 'ffmpeg-remux-or-transcode',
    options: [QUALITY_OPTION, RESOLUTION_OPTION, AUDIO_OPTION, FORCE_REENCODE_OPTION],
    limits: VIDEO_LIMITS_REMUX,
    seo: {
      primary: 'mov to mp4',
      title: 'MOV to MP4 Converter — Free, Private, No Upload',
      description:
        'Convert MOV videos (iPhone, Mac screen recordings) to MP4 in your browser. Fast copy mode when possible. No upload.',
      related: ['convert mov to mp4 online', 'iphone video to mp4'],
    },
    contentRef: 'tools/mov-to-mp4.md',
    related: ['mkv-to-mp4', 'hevc-to-h264', 'mp4-to-mov'],
    wave: 1,
    status: 'live',
  },
  // mkv-to-mp4
  {
    id: 'mkv-to-mp4',
    slug: 'mkv-to-mp4',
    kind: 'convert',
    department: 'video',
    from: ['mkv'],
    to: 'mp4',
    engine: 'ffmpeg',
    strategy: 'ffmpeg-remux-or-transcode',
    options: [QUALITY_OPTION, RESOLUTION_OPTION, AUDIO_OPTION, FORCE_REENCODE_OPTION],
    limits: VIDEO_LIMITS_REMUX,
    seo: {
      primary: 'mkv to mp4',
      title: 'MKV to MP4 Converter — Free, Private, No Upload',
      description:
        'Convert MKV to MP4 in your browser. Fast stream copy when possible, full transcode when needed. No upload.',
    },
    contentRef: 'tools/mkv-to-mp4.md',
    related: ['mov-to-mp4', 'avi-to-mp4', 'webm-to-mp4'],
    wave: 1,
    status: 'live',
  },
  // avi-to-mp4
  {
    id: 'avi-to-mp4',
    slug: 'avi-to-mp4',
    kind: 'convert',
    department: 'video',
    from: ['avi'],
    to: 'mp4',
    engine: 'ffmpeg',
    strategy: 'ffmpeg-transcode',
    options: [QUALITY_OPTION, RESOLUTION_OPTION, AUDIO_OPTION],
    limits: VIDEO_LIMITS_TRANSCODE,
    seo: {
      primary: 'avi to mp4',
      title: 'AVI to MP4 Converter — Free, Private, No Upload',
      description:
        'Convert AVI to MP4 in your browser. Re-encodes for universal compatibility. Nothing uploaded.',
    },
    contentRef: 'tools/avi-to-mp4.md',
    related: ['mkv-to-mp4', 'mov-to-mp4', 'wmv-to-mp4'],
    wave: 1,
    status: 'live',
  },
  // webm-to-mp4
  {
    id: 'webm-to-mp4',
    slug: 'webm-to-mp4',
    kind: 'convert',
    department: 'video',
    from: ['webm'],
    to: 'mp4',
    engine: 'ffmpeg',
    strategy: 'ffmpeg-transcode',
    options: [QUALITY_OPTION, RESOLUTION_OPTION, AUDIO_OPTION],
    limits: VIDEO_LIMITS_TRANSCODE,
    seo: {
      primary: 'webm to mp4',
      title: 'WebM to MP4 Converter — Free, Private',
      description:
        'Convert WebM to MP4 in your browser. Works with VP8, VP9 and AV1 sources. No upload.',
    },
    contentRef: 'tools/webm-to-mp4.md',
    related: ['mov-to-mp4', 'mkv-to-mp4', 'mp4-to-webm'],
    wave: 1,
    status: 'live',
  },
  // wmv-to-mp4
  {
    id: 'wmv-to-mp4',
    slug: 'wmv-to-mp4',
    kind: 'convert',
    department: 'video',
    from: ['wmv'],
    to: 'mp4',
    engine: 'ffmpeg',
    strategy: 'ffmpeg-transcode',
    options: [QUALITY_OPTION, RESOLUTION_OPTION, AUDIO_OPTION],
    limits: VIDEO_LIMITS_TRANSCODE,
    seo: {
      primary: 'wmv to mp4',
      title: 'WMV to MP4 Converter — Free, Private',
      description:
        'Convert WMV Windows Media Video to MP4 in your browser. Legacy format support. No upload.',
    },
    contentRef: 'tools/wmv-to-mp4.md',
    related: ['avi-to-mp4', 'mov-to-mp4', 'mkv-to-mp4'],
    wave: 2,
    status: 'draft',
  },
  // flv-to-mp4
  {
    id: 'flv-to-mp4',
    slug: 'flv-to-mp4',
    kind: 'convert',
    department: 'video',
    from: ['flv'],
    to: 'mp4',
    engine: 'ffmpeg',
    strategy: 'ffmpeg-remux-or-transcode',
    options: [QUALITY_OPTION, RESOLUTION_OPTION, FORCE_REENCODE_OPTION],
    limits: VIDEO_LIMITS_TRANSCODE,
    seo: {
      primary: 'flv to mp4',
      title: 'FLV to MP4 Converter — Free, Private',
      description:
        'Convert Flash FLV videos to MP4 in your browser. Works with old downloaded videos. No upload.',
    },
    contentRef: 'tools/flv-to-mp4.md',
    related: ['avi-to-mp4', 'wmv-to-mp4', 'mkv-to-mp4'],
    wave: 2,
    status: 'draft',
  },
  // 3gp-to-mp4
  {
    id: '3gp-to-mp4',
    slug: '3gp-to-mp4',
    kind: 'convert',
    department: 'video',
    from: ['3gp'],
    to: 'mp4',
    engine: 'ffmpeg',
    strategy: 'ffmpeg-transcode',
    options: [QUALITY_OPTION, RESOLUTION_OPTION],
    limits: { ...VIDEO_LIMITS_TRANSCODE, maxBytes: 200 * 1024 * 1024 },
    seo: {
      primary: '3gp to mp4',
      title: '3GP to MP4 Converter — Old Phone Videos, Free',
      description:
        'Convert 3GP videos from old Nokia or Samsung phones to MP4 in your browser. No upload required.',
      related: ['3gp video converter', '3gp to mp4 online'],
    },
    contentRef: 'tools/3gp-to-mp4.md',
    related: ['avi-to-mp4', 'flv-to-mp4', 'mov-to-mp4'],
    wave: 2,
    status: 'draft',
  },
  // m4v-to-mp4
  {
    id: 'm4v-to-mp4',
    slug: 'm4v-to-mp4',
    kind: 'convert',
    department: 'video',
    from: ['m4v'],
    to: 'mp4',
    engine: 'ffmpeg',
    strategy: 'ffmpeg-remux',
    options: [FORCE_REENCODE_OPTION],
    limits: VIDEO_LIMITS_REMUX,
    seo: {
      primary: 'm4v to mp4',
      title: 'M4V to MP4 Converter — Free, Private',
      description:
        'Convert M4V to MP4 in your browser. Fast stream copy, no re-encoding needed. Nothing uploaded.',
    },
    contentRef: 'tools/m4v-to-mp4.md',
    related: ['mov-to-mp4', 'mkv-to-mp4', 'avi-to-mp4'],
    wave: 2,
    status: 'draft',
  },
  // mpeg-to-mp4
  {
    id: 'mpeg-to-mp4',
    slug: 'mpeg-to-mp4',
    kind: 'convert',
    department: 'video',
    from: ['mpeg'],
    to: 'mp4',
    engine: 'ffmpeg',
    strategy: 'ffmpeg-transcode',
    options: [QUALITY_OPTION, RESOLUTION_OPTION],
    limits: VIDEO_LIMITS_TRANSCODE,
    seo: {
      primary: 'mpeg to mp4',
      title: 'MPEG to MP4 Converter — Free, Private',
      description:
        'Convert MPEG/MPG to MP4 in your browser. Legacy MPEG-1/2 format. Re-encodes for compatibility. No upload.',
    },
    contentRef: 'tools/mpeg-to-mp4.md',
    related: ['avi-to-mp4', 'wmv-to-mp4', 'flv-to-mp4'],
    wave: 3,
    status: 'draft',
  },
  // hevc-to-h264 — iPhone HEVC sharing
  {
    id: 'hevc-to-h264',
    slug: 'hevc-to-h264',
    kind: 'convert',
    department: 'video',
    from: ['mp4', 'mov', 'mkv'],
    to: 'mp4',
    engine: 'ffmpeg',
    strategy: 'ffmpeg-hevc-transcode',
    options: [QUALITY_OPTION, RESOLUTION_OPTION, AUDIO_OPTION],
    limits: { ...VIDEO_LIMITS_TRANSCODE, maxBytes: 300 * 1024 * 1024 },
    seo: {
      primary: 'hevc to h264',
      title: 'HEVC (H.265) to H.264 Converter — iPhone Video, Free',
      description:
        'Convert HEVC H.265 iPhone videos to H.264 MP4 in your browser. Works on any device. No upload.',
      related: ['h265 to h264', 'iphone hevc video converter', 'hevc video converter'],
    },
    contentRef: 'tools/hevc-to-h264.md',
    related: ['mov-to-mp4', 'mkv-to-mp4', 'heic-to-jpg'],
    wave: 1,
    status: 'live',
    notes:
      '4K HEVC is very slow in WebAssembly. Show resolution and speed warnings. Limit to 300 MB.',
  },
  // mp4-to-mov
  {
    id: 'mp4-to-mov',
    slug: 'mp4-to-mov',
    kind: 'convert',
    department: 'video',
    from: ['mp4'],
    to: 'mov',
    engine: 'ffmpeg',
    strategy: 'ffmpeg-remux',
    options: [FORCE_REENCODE_OPTION],
    limits: VIDEO_LIMITS_REMUX,
    seo: {
      primary: 'mp4 to mov',
      title: 'MP4 to MOV Converter — Free, Private',
      description:
        'Convert MP4 to MOV in your browser. Fast stream copy, no re-encoding. Works for iMovie and Final Cut Pro.',
    },
    contentRef: 'tools/mp4-to-mov.md',
    related: ['mov-to-mp4', 'mp4-to-webm', 'mkv-to-mp4'],
    wave: 2,
    status: 'draft',
  },
  // mp4-to-webm
  {
    id: 'mp4-to-webm',
    slug: 'mp4-to-webm',
    kind: 'convert',
    department: 'video',
    from: ['mp4'],
    to: 'webm',
    engine: 'ffmpeg',
    strategy: 'ffmpeg-transcode-webm',
    options: [QUALITY_OPTION, RESOLUTION_OPTION],
    limits: VIDEO_LIMITS_TRANSCODE,
    seo: {
      primary: 'mp4 to webm',
      title: 'MP4 to WebM Converter — Free, Private',
      description:
        'Convert MP4 to WebM in your browser. Open format for web video. VP9 + Opus output. No upload.',
    },
    contentRef: 'tools/mp4-to-webm.md',
    related: ['webm-to-mp4', 'mp4-to-mov', 'mov-to-mp4'],
    wave: 2,
    status: 'draft',
  },
  // mp4-to-gif — popular conversion
  {
    id: 'mp4-to-gif',
    slug: 'mp4-to-gif',
    kind: 'convert',
    department: 'video',
    from: ['mp4', 'mov', 'webm'],
    to: 'gif',
    engine: 'ffmpeg',
    strategy: 'ffmpeg-palette-gif',
    options: [
      {
        id: 'width',
        label: 'GIF width',
        type: 'select',
        choices: [
          { value: 320, label: '320 px — small' },
          { value: 480, label: '480 px — medium (recommended)' },
          { value: 640, label: '640 px — large' },
        ],
        default: 480,
        help: 'Wider GIFs are much larger. 480 px is a good balance.',
        advanced: false,
      },
      {
        id: 'fps',
        label: 'Frame rate',
        type: 'select',
        choices: [
          { value: 8, label: '8 fps — smaller' },
          { value: 12, label: '12 fps (recommended)' },
          { value: 15, label: '15 fps — smoother' },
        ],
        default: 12,
        help: 'Lower frame rate = smaller file. 12 fps looks smooth for most clips.',
        advanced: false,
      },
    ],
    limits: { maxBytes: 200 * 1024 * 1024, warnBytes: 80 * 1024 * 1024, maxFiles: 3 },
    seo: {
      primary: 'mp4 to gif',
      title: 'MP4 to GIF Converter — Free, Private, No Upload',
      description:
        'Convert MP4 video clips to animated GIF in your browser. Choose width and frame rate. Nothing uploaded.',
      related: ['video to gif', 'make gif from video online'],
    },
    contentRef: 'tools/mp4-to-gif.md',
    related: ['gif-to-mp4', 'mov-to-mp4', 'mp4-to-mp3'],
    wave: 1,
    status: 'live',
  },
  // gif-to-mp4
  {
    id: 'gif-to-mp4',
    slug: 'gif-to-mp4',
    kind: 'convert',
    department: 'video',
    from: ['gif'],
    to: 'mp4',
    engine: 'ffmpeg',
    strategy: 'ffmpeg-gif-to-mp4',
    options: [],
    limits: { maxBytes: 50 * 1024 * 1024, warnBytes: 20 * 1024 * 1024, maxFiles: 5 },
    seo: {
      primary: 'gif to mp4',
      title: 'GIF to MP4 Converter — Free, Private',
      description:
        'Convert animated GIF to MP4 in your browser. Much smaller file size. No upload, no signup.',
    },
    contentRef: 'tools/gif-to-mp4.md',
    related: ['mp4-to-gif', 'mov-to-mp4', 'webm-to-mp4'],
    wave: 1,
    status: 'live',
  },
  // webm-to-gif
  {
    id: 'webm-to-gif',
    slug: 'webm-to-gif',
    kind: 'convert',
    department: 'video',
    from: ['webm'],
    to: 'gif',
    engine: 'ffmpeg',
    strategy: 'ffmpeg-palette-gif',
    options: [
      {
        id: 'width',
        label: 'GIF width',
        type: 'select',
        choices: [
          { value: 320, label: '320 px' },
          { value: 480, label: '480 px (recommended)' },
          { value: 640, label: '640 px' },
        ],
        default: 480,
        advanced: false,
      },
    ],
    limits: { maxBytes: 100 * 1024 * 1024, warnBytes: 40 * 1024 * 1024, maxFiles: 3 },
    seo: {
      primary: 'webm to gif',
      title: 'WebM to GIF Converter — Free, Private',
      description:
        'Convert WebM video to animated GIF in your browser. Choose output width. Nothing uploaded.',
    },
    contentRef: 'tools/webm-to-gif.md',
    related: ['mp4-to-gif', 'gif-to-mp4', 'webm-to-mp4'],
    wave: 3,
    status: 'draft',
  },
  // mov-to-gif
  {
    id: 'mov-to-gif',
    slug: 'mov-to-gif',
    kind: 'convert',
    department: 'video',
    from: ['mov'],
    to: 'gif',
    engine: 'ffmpeg',
    strategy: 'ffmpeg-palette-gif',
    options: [
      {
        id: 'width',
        label: 'GIF width',
        type: 'select',
        choices: [
          { value: 320, label: '320 px' },
          { value: 480, label: '480 px (recommended)' },
          { value: 640, label: '640 px' },
        ],
        default: 480,
        advanced: false,
      },
    ],
    limits: { maxBytes: 200 * 1024 * 1024, warnBytes: 80 * 1024 * 1024, maxFiles: 3 },
    seo: {
      primary: 'mov to gif',
      title: 'MOV to GIF Converter — Free, Private',
      description:
        'Convert MOV video (iPhone, screen recording) to animated GIF in your browser. No upload.',
    },
    contentRef: 'tools/mov-to-gif.md',
    related: ['mp4-to-gif', 'mov-to-mp4', 'gif-to-mp4'],
    wave: 3,
    status: 'draft',
  },
  // mov-to-mp3
  {
    id: 'mov-to-mp3',
    slug: 'mov-to-mp3',
    kind: 'convert',
    department: 'video',
    from: ['mov'],
    to: 'mp3',
    engine: 'ffmpeg',
    strategy: 'ffmpeg-extract-audio',
    options: [
      {
        id: 'bitrate',
        label: 'Bitrate',
        type: 'select',
        choices: [
          { value: 128, label: '128 kbps' },
          { value: 192, label: '192 kbps (recommended)' },
          { value: 256, label: '256 kbps' },
        ],
        default: 192,
        advanced: false,
      },
    ],
    limits: { maxBytes: 500 * 1024 * 1024, warnBytes: 150 * 1024 * 1024, maxFiles: 5 },
    seo: {
      primary: 'mov to mp3',
      title: 'MOV to MP3 Converter — Extract Audio, Free',
      description:
        'Extract audio from MOV video files to MP3 in your browser. Works for iPhone videos. Nothing uploaded.',
    },
    contentRef: 'tools/mov-to-mp3.md',
    related: ['mp4-to-mp3', 'mov-to-mp4', 'opus-to-mp3'],
    wave: 3,
    status: 'draft',
  },
];

export default videoTools;
