import type { Tool } from '../schema';

const AUDIO_LIMITS = {
  maxBytes: 500 * 1024 * 1024, // 500 MB hard block
  warnBytes: 100 * 1024 * 1024, // 100 MB soft warn
  maxFiles: 20,
};

const BITRATE_OPTION = {
  id: 'bitrate',
  label: 'Bitrate',
  type: 'select' as const,
  choices: [
    { value: 128, label: '128 kbps — smaller file' },
    { value: 192, label: '192 kbps — balanced (recommended)' },
    { value: 256, label: '256 kbps — higher quality' },
    { value: 320, label: '320 kbps — maximum quality' },
  ],
  default: 192,
  help: 'Higher bitrate = better quality, larger file.',
  advanced: false,
};

const CHANNELS_OPTION = {
  id: 'channels',
  label: 'Channels',
  type: 'select' as const,
  choices: [
    { value: 'original', label: 'Keep source channels (recommended)' },
    { value: 'stereo', label: 'Stereo (2 channels)' },
    { value: 'mono', label: 'Mono (1 channel — smaller file)' },
  ],
  default: 'original',
  help: 'Mono reduces voice note and speech file sizes.',
  advanced: true,
};

const SAMPLE_RATE_OPTION = {
  id: 'sample-rate',
  label: 'Sample rate',
  type: 'select' as const,
  choices: [
    { value: 'original', label: 'Keep source rate (recommended)' },
    { value: '44100', label: '44.1 kHz (CD quality)' },
    { value: '48000', label: '48 kHz (standard)' },
  ],
  default: 'original',
  help: 'Audio sample frequency.',
  advanced: true,
};

const audioTools: Tool[] = [
  // opus-to-mp3 — WhatsApp voice notes
  {
    id: 'opus-to-mp3',
    slug: 'opus-to-mp3',
    kind: 'convert',
    department: 'audio',
    from: ['opus', 'ogg'],
    to: 'mp3',
    engine: 'ffmpeg',
    strategy: 'ffmpeg-transcode',
    options: [BITRATE_OPTION, CHANNELS_OPTION, SAMPLE_RATE_OPTION],
    limits: AUDIO_LIMITS,
    seo: {
      primary: 'opus to mp3',
      title: 'OPUS to MP3 Converter — WhatsApp Voice Notes, Free',
      description:
        'Convert OPUS or OGG audio to MP3 in your browser. Perfect for WhatsApp voice notes. No upload.',
      related: ['whatsapp voice note to mp3', 'ogg to mp3', 'opus converter'],
    },
    contentRef: 'tools/opus-to-mp3.md',
    related: ['m4a-to-mp3', 'wav-to-mp3', 'mp4-to-mp3'],
    wave: 1,
    status: 'live',
  },
  // m4a-to-mp3
  {
    id: 'm4a-to-mp3',
    slug: 'm4a-to-mp3',
    kind: 'convert',
    department: 'audio',
    from: ['m4a'],
    to: 'mp3',
    engine: 'ffmpeg',
    strategy: 'ffmpeg-transcode',
    options: [BITRATE_OPTION, CHANNELS_OPTION, SAMPLE_RATE_OPTION],
    limits: AUDIO_LIMITS,
    seo: {
      primary: 'm4a to mp3',
      title: 'M4A to MP3 Converter — Free, Private, No Upload',
      description:
        'Convert M4A audio files to MP3 in your browser. iPhone voice memos, iTunes recordings. Nothing uploaded.',
    },
    contentRef: 'tools/m4a-to-mp3.md',
    related: ['opus-to-mp3', 'wav-to-mp3', 'aac-to-mp3'],
    wave: 1,
    status: 'live',
  },
  // wav-to-mp3
  {
    id: 'wav-to-mp3',
    slug: 'wav-to-mp3',
    kind: 'convert',
    department: 'audio',
    from: ['wav'],
    to: 'mp3',
    engine: 'ffmpeg',
    strategy: 'ffmpeg-transcode',
    options: [BITRATE_OPTION, CHANNELS_OPTION, SAMPLE_RATE_OPTION],
    limits: AUDIO_LIMITS,
    seo: {
      primary: 'wav to mp3',
      title: 'WAV to MP3 Converter — Free, Private',
      description:
        'Convert WAV audio to MP3 in your browser. Reduce file size without uploading. Batch supported.',
    },
    contentRef: 'tools/wav-to-mp3.md',
    related: ['mp3-to-wav', 'wav-to-flac', 'opus-to-mp3'],
    wave: 1,
    status: 'live',
  },
  // mp3-to-wav
  {
    id: 'mp3-to-wav',
    slug: 'mp3-to-wav',
    kind: 'convert',
    department: 'audio',
    from: ['mp3'],
    to: 'wav',
    engine: 'ffmpeg',
    strategy: 'ffmpeg-transcode',
    options: [
      {
        id: 'bitdepth',
        label: 'Bit depth',
        type: 'select',
        choices: [
          { value: 'pcm_s16le', label: '16-bit (standard)' },
          { value: 'pcm_s24le', label: '24-bit (high quality)' },
        ],
        default: 'pcm_s16le',
        help: 'WAV stores uncompressed audio. Converting from MP3 does not restore lost quality.',
        advanced: false,
      },
      CHANNELS_OPTION,
      SAMPLE_RATE_OPTION,
    ],
    limits: AUDIO_LIMITS,
    seo: {
      primary: 'mp3 to wav',
      title: 'MP3 to WAV Converter — Free, Private',
      description:
        'Convert MP3 to WAV in your browser. Uncompressed output for audio editing. No upload.',
    },
    contentRef: 'tools/mp3-to-wav.md',
    related: ['wav-to-mp3', 'wav-to-flac', 'flac-to-wav'],
    wave: 1,
    status: 'live',
  },
  // mp4-to-mp3
  {
    id: 'mp4-to-mp3',
    slug: 'mp4-to-mp3',
    kind: 'convert',
    department: 'audio',
    from: ['mp4', 'mov', 'mkv', 'webm', 'avi'],
    to: 'mp3',
    engine: 'ffmpeg',
    strategy: 'ffmpeg-extract-audio',
    options: [BITRATE_OPTION, CHANNELS_OPTION, SAMPLE_RATE_OPTION],
    limits: {
      maxBytes: 500 * 1024 * 1024,
      warnBytes: 150 * 1024 * 1024,
      maxFiles: 10,
    },
    seo: {
      primary: 'mp4 to mp3',
      title: 'MP4 to MP3 Converter — Extract Audio Free, Private',
      description:
        'Extract audio from MP4, MOV, MKV and other videos to MP3 in your browser. No upload, no size cap.',
    },
    contentRef: 'tools/mp4-to-mp3.md',
    related: ['opus-to-mp3', 'wav-to-mp3', 'mov-to-mp4'],
    wave: 1,
    status: 'live',
  },
  // aac-to-mp3
  {
    id: 'aac-to-mp3',
    slug: 'aac-to-mp3',
    kind: 'convert',
    department: 'audio',
    from: ['aac'],
    to: 'mp3',
    engine: 'ffmpeg',
    strategy: 'ffmpeg-transcode',
    options: [BITRATE_OPTION, CHANNELS_OPTION, SAMPLE_RATE_OPTION],
    limits: AUDIO_LIMITS,
    seo: {
      primary: 'aac to mp3',
      title: 'AAC to MP3 Converter — Free, Private',
      description:
        'Convert AAC audio to MP3 in your browser. Works with .aac files from any source. Nothing uploaded.',
    },
    contentRef: 'tools/aac-to-mp3.md',
    related: ['m4a-to-mp3', 'wav-to-mp3', 'opus-to-mp3'],
    wave: 2,
    status: 'draft',
  },
  // flac-to-mp3
  {
    id: 'flac-to-mp3',
    slug: 'flac-to-mp3',
    kind: 'convert',
    department: 'audio',
    from: ['flac'],
    to: 'mp3',
    engine: 'ffmpeg',
    strategy: 'ffmpeg-transcode',
    options: [BITRATE_OPTION, CHANNELS_OPTION, SAMPLE_RATE_OPTION],
    limits: AUDIO_LIMITS,
    seo: {
      primary: 'flac to mp3',
      title: 'FLAC to MP3 Converter — Free, Private',
      description:
        'Convert FLAC lossless audio to MP3 in your browser. Great for music libraries. Nothing uploaded.',
    },
    contentRef: 'tools/flac-to-mp3.md',
    related: ['wav-to-mp3', 'flac-to-wav', 'mp3-to-wav'],
    wave: 2,
    status: 'draft',
  },
  // ogg-to-mp3
  {
    id: 'ogg-to-mp3',
    slug: 'ogg-to-mp3',
    kind: 'convert',
    department: 'audio',
    from: ['ogg'],
    to: 'mp3',
    engine: 'ffmpeg',
    strategy: 'ffmpeg-transcode',
    options: [BITRATE_OPTION, CHANNELS_OPTION, SAMPLE_RATE_OPTION],
    limits: AUDIO_LIMITS,
    seo: {
      primary: 'ogg to mp3',
      title: 'OGG to MP3 Converter — Free, Private',
      description:
        'Convert OGG Vorbis audio to MP3 in your browser. Fast, no upload, no signup.',
    },
    contentRef: 'tools/ogg-to-mp3.md',
    related: ['opus-to-mp3', 'wav-to-mp3', 'flac-to-mp3'],
    wave: 2,
    status: 'draft',
  },
  // amr-to-mp3
  {
    id: 'amr-to-mp3',
    slug: 'amr-to-mp3',
    kind: 'convert',
    department: 'audio',
    from: ['amr'],
    to: 'mp3',
    engine: 'ffmpeg',
    strategy: 'ffmpeg-transcode',
    options: [BITRATE_OPTION, CHANNELS_OPTION, SAMPLE_RATE_OPTION],
    limits: { ...AUDIO_LIMITS, maxBytes: 50 * 1024 * 1024 },
    seo: {
      primary: 'amr to mp3',
      title: 'AMR to MP3 Converter — Old Phone Voice Recordings, Free',
      description:
        'Convert AMR voice recordings from old phones to MP3 in your browser. No upload, free, instant.',
      related: ['amr voice note to mp3'],
    },
    contentRef: 'tools/amr-to-mp3.md',
    related: ['opus-to-mp3', 'wav-to-mp3', 'm4a-to-mp3'],
    wave: 2,
    status: 'draft',
  },
  // wma-to-mp3
  {
    id: 'wma-to-mp3',
    slug: 'wma-to-mp3',
    kind: 'convert',
    department: 'audio',
    from: ['wma'],
    to: 'mp3',
    engine: 'ffmpeg',
    strategy: 'ffmpeg-transcode',
    options: [BITRATE_OPTION, CHANNELS_OPTION, SAMPLE_RATE_OPTION],
    limits: AUDIO_LIMITS,
    seo: {
      primary: 'wma to mp3',
      title: 'WMA to MP3 Converter — Free, Private',
      description:
        'Convert WMA Windows Media Audio files to MP3 in your browser. No upload required.',
    },
    contentRef: 'tools/wma-to-mp3.md',
    related: ['wav-to-mp3', 'flac-to-mp3', 'aac-to-mp3'],
    wave: 3,
    status: 'draft',
  },
  // mp3-to-m4a
  {
    id: 'mp3-to-m4a',
    slug: 'mp3-to-m4a',
    kind: 'convert',
    department: 'audio',
    from: ['mp3'],
    to: 'm4a',
    engine: 'ffmpeg',
    strategy: 'ffmpeg-transcode',
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
        help: 'M4A uses AAC codec, which is more efficient than MP3 at the same bitrate.',
        advanced: false,
      },
      CHANNELS_OPTION,
      SAMPLE_RATE_OPTION,
    ],
    limits: AUDIO_LIMITS,
    seo: {
      primary: 'mp3 to m4a',
      title: 'MP3 to M4A Converter — Free, Private',
      description:
        'Convert MP3 audio to M4A in your browser. AAC codec, iPhone compatible. No upload.',
    },
    contentRef: 'tools/mp3-to-m4a.md',
    related: ['m4a-to-mp3', 'wav-to-mp3', 'mp3-to-wav'],
    wave: 2,
    status: 'draft',
  },
  // mp3-to-ogg
  {
    id: 'mp3-to-ogg',
    slug: 'mp3-to-ogg',
    kind: 'convert',
    department: 'audio',
    from: ['mp3'],
    to: 'ogg',
    engine: 'ffmpeg',
    strategy: 'ffmpeg-transcode',
    options: [
      {
        id: 'quality',
        label: 'Quality',
        type: 'slider',
        min: 3,
        max: 8,
        step: 1,
        default: 5,
        help: 'OGG quality scale 0–10. 5 is balanced.',
        advanced: false,
      },
      CHANNELS_OPTION,
      SAMPLE_RATE_OPTION,
    ],
    limits: AUDIO_LIMITS,
    seo: {
      primary: 'mp3 to ogg',
      title: 'MP3 to OGG Converter — Free, Private',
      description:
        'Convert MP3 to OGG Vorbis in your browser. Open, patent-free format. Nothing uploaded.',
    },
    contentRef: 'tools/mp3-to-ogg.md',
    related: ['ogg-to-mp3', 'opus-to-mp3', 'wav-to-mp3'],
    wave: 3,
    status: 'draft',
  },
  // wav-to-flac
  {
    id: 'wav-to-flac',
    slug: 'wav-to-flac',
    kind: 'convert',
    department: 'audio',
    from: ['wav'],
    to: 'flac',
    engine: 'ffmpeg',
    strategy: 'ffmpeg-transcode',
    options: [
      {
        id: 'compression',
        label: 'Compression level',
        type: 'slider',
        min: 0,
        max: 8,
        step: 1,
        default: 5,
        help: 'Higher compression = smaller file, slower encoding. Audio quality is always lossless.',
        advanced: false,
      },
      CHANNELS_OPTION,
      SAMPLE_RATE_OPTION,
    ],
    limits: AUDIO_LIMITS,
    seo: {
      primary: 'wav to flac',
      title: 'WAV to FLAC Converter — Free, Lossless, Private',
      description:
        'Convert WAV to FLAC lossless in your browser. Smaller than WAV, same quality. Nothing uploaded.',
    },
    contentRef: 'tools/wav-to-flac.md',
    related: ['flac-to-wav', 'flac-to-mp3', 'wav-to-mp3'],
    wave: 3,
    status: 'draft',
  },
  // flac-to-wav
  {
    id: 'flac-to-wav',
    slug: 'flac-to-wav',
    kind: 'convert',
    department: 'audio',
    from: ['flac'],
    to: 'wav',
    engine: 'ffmpeg',
    strategy: 'ffmpeg-transcode',
    options: [CHANNELS_OPTION, SAMPLE_RATE_OPTION],
    limits: AUDIO_LIMITS,
    seo: {
      primary: 'flac to wav',
      title: 'FLAC to WAV Converter — Free, Private',
      description:
        'Convert FLAC lossless audio to WAV in your browser. Perfect for audio editing software. No upload.',
    },
    contentRef: 'tools/flac-to-wav.md',
    related: ['wav-to-flac', 'flac-to-mp3', 'mp3-to-wav'],
    wave: 3,
    status: 'draft',
  },
  // aiff-to-mp3
  {
    id: 'aiff-to-mp3',
    slug: 'aiff-to-mp3',
    kind: 'convert',
    department: 'audio',
    from: ['aiff'],
    to: 'mp3',
    engine: 'ffmpeg',
    strategy: 'ffmpeg-transcode',
    options: [BITRATE_OPTION, CHANNELS_OPTION, SAMPLE_RATE_OPTION],
    limits: AUDIO_LIMITS,
    seo: {
      primary: 'aiff to mp3',
      title: 'AIFF to MP3 Converter — Free, Private',
      description:
        'Convert AIFF Apple audio files to MP3 in your browser. No upload, free, works offline after first use.',
    },
    contentRef: 'tools/aiff-to-mp3.md',
    related: ['wav-to-mp3', 'flac-to-mp3', 'm4a-to-mp3'],
    wave: 3,
    status: 'draft',
  },
];

export default audioTools;
