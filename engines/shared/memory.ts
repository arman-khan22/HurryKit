/**
 * Memory guard — estimates memory needed before a job and warns or blocks.
 * Prevents out-of-memory crashes on low-end devices and enforces tool limits.
 */
import type { ErrorCode } from '../types';

export type DeviceClass = 'low' | 'mid' | 'high';

/** Estimate device class from navigator hints */
export function getDeviceClass(): DeviceClass {
  if (typeof navigator === 'undefined') return 'mid';

  // navigator.deviceMemory is in GB (supported in Chromium browsers)
  const mem =
    'deviceMemory' in navigator ? (navigator.deviceMemory as number) : undefined;
  const cores =
    'hardwareConcurrency' in navigator ? navigator.hardwareConcurrency : 4;

  if (mem !== undefined) {
    if (mem <= 2) return 'low';
    if (mem <= 6) return 'mid';
    return 'high';
  }

  // Fallback: use core count
  if (cores <= 2) return 'low';
  if (cores <= 6) return 'mid';
  return 'high';
}

/** Maximum bytes of RAM we'll try to use, by device class */
export const MEMORY_BUDGETS: Record<DeviceClass, number> = {
  low: 256 * 1024 * 1024, // 256 MB
  mid: 512 * 1024 * 1024, // 512 MB
  high: 1024 * 1024 * 1024, // 1 GB
};

/**
 * Estimate memory needed for an image job.
 * Formula: w × h × 4 bytes (RGBA) × 2 (working copies)
 * Conservative estimation: 8x input file size for decompressed raster buffers.
 */
export function estimateImageMemory(fileSizeBytes: number): number {
  return fileSizeBytes * 8;
}

/**
 * Estimate memory needed for a video transcode job.
 * Conservative: file size × 3 (I/O buffers + working frame queue)
 */
export function estimateVideoMemory(fileSizeBytes: number): number {
  return fileSizeBytes * 3;
}

/** Estimate memory for a remux job — much lighter than transcode */
export function estimateRemuxMemory(fileSizeBytes: number): number {
  return fileSizeBytes * 1.5;
}

/** Estimate memory for an audio job (uncompressed PCM audio buffers) */
export function estimateAudioMemory(fileSizeBytes: number): number {
  return fileSizeBytes * 6;
}

/** Estimate memory needed based on file extension / MIME type */
export function estimateJobMemory(fileSizeBytes: number, extOrMime = ''): number {
  const norm = extOrMime.toLowerCase();
  if (
    norm.includes('video') ||
    norm.includes('mp4') ||
    norm.includes('mov') ||
    norm.includes('mkv') ||
    norm.includes('avi') ||
    norm.includes('webm')
  ) {
    return estimateVideoMemory(fileSizeBytes);
  }
  if (
    norm.includes('audio') ||
    norm.includes('mp3') ||
    norm.includes('wav') ||
    norm.includes('m4a') ||
    norm.includes('opus') ||
    norm.includes('flac')
  ) {
    return estimateAudioMemory(fileSizeBytes);
  }
  // Default to image estimate
  return estimateImageMemory(fileSizeBytes);
}

export type GuardResult =
  | { ok: true }
  | { ok: false; level: 'warn'; message: string }
  | { ok: false; level: 'block'; message: string };

/**
 * Check whether a job should proceed given the current device budget.
 */
export function checkMemory(estimatedBytes: number, deviceClass?: DeviceClass): GuardResult {
  const dc = deviceClass ?? getDeviceClass();
  const budget = MEMORY_BUDGETS[dc];

  if (estimatedBytes > budget) {
    return {
      ok: false,
      level: 'block',
      message:
        'This file is likely too large for your device. Try a smaller file or use a computer.',
    };
  }

  if (estimatedBytes > budget * 0.7) {
    return {
      ok: false,
      level: 'warn',
      message: 'This file is large for your device. It may be slow or fail partway through.',
    };
  }

  return { ok: true };
}

export function isMobileDevice(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent,
  );
}

export interface ToolLimits {
  maxBytes?: number | undefined;
  warnBytes?: number | undefined;
  maxFiles?: number | undefined;
}

export interface MemoryGuardResult {
  ok: boolean;
  status: 'ok' | 'warn' | 'block';
  estimatedMemoryBytes: number;
  message?: string;
  code?: ErrorCode;
}

/**
 * Memory guard checking both registry tool limits and hardware memory budgets.
 * - Blocks if file exceeds tool's maxBytes (TOO_LARGE).
 * - Enforces practical mobile/phone limits with clear messaging.
 * - Blocks if estimated memory exceeds device budget (OUT_OF_MEMORY).
 * - Warns if file exceeds tool warnBytes or 70% of device budget.
 */
export function memoryGuard(
  file: { size: number; name?: string; type?: string },
  limits?: ToolLimits,
  deviceClass?: DeviceClass,
  isMobile?: boolean,
): MemoryGuardResult {
  const dc = deviceClass ?? getDeviceClass();
  const mobile = isMobile ?? isMobileDevice();
  const budget = MEMORY_BUDGETS[dc];

  // Case 3: Zero-byte empty file check
  if (file.size === 0) {
    return {
      ok: false,
      status: 'block',
      code: 'CORRUPT_FILE',
      estimatedMemoryBytes: 0,
      message: 'This file is empty (0 bytes).',
    };
  }

  const extOrMime = file.name ? file.name.split('.').pop() : file.type;
  const isVideo = extOrMime
    ? /mp4|mov|mkv|avi|webm|wmv|flv|3gp|m4v|mpeg|video/i.test(extOrMime)
    : false;

  // Practical size limits for typical phones (Section 10 of Implementation Guide)
  if (mobile && isVideo) {
    const isRemuxTool = Boolean(limits?.maxBytes && limits.maxBytes > 500 * 1024 * 1024);
    const phoneLimit = isRemuxTool
      ? (dc === 'low' ? 250 * 1024 * 1024 : 500 * 1024 * 1024)
      : (dc === 'low' ? 80 * 1024 * 1024 : 150 * 1024 * 1024);

    if (file.size > phoneLimit) {
      return {
        ok: false,
        status: 'block',
        code: 'TOO_LARGE',
        estimatedMemoryBytes: file.size,
        message:
          'This file is too large for a typical phone or mobile browser. To convert this video, please use a desktop computer.',
      };
    }

    const phoneWarn = Math.round(phoneLimit * 0.7);
    if (file.size > phoneWarn) {
      return {
        ok: true,
        status: 'warn',
        estimatedMemoryBytes: file.size,
        message: 'This file is large for a mobile device. Video processing may be slow.',
      };
    }
  }

  // 1. Tool maxBytes limit check
  if (limits?.maxBytes && file.size > limits.maxBytes) {
    return {
      ok: false,
      status: 'block',
      code: 'TOO_LARGE',
      estimatedMemoryBytes: file.size,
      message: 'This file is bigger than this tool can handle on your device.',
    };
  }

  // 2. Estimate memory for job
  const estimatedBytes = estimateJobMemory(file.size, extOrMime ?? '');

  // 3. Device budget check
  if (estimatedBytes > budget) {
    return {
      ok: false,
      status: 'block',
      code: 'OUT_OF_MEMORY',
      estimatedMemoryBytes: estimatedBytes,
      message: mobile
        ? 'This file is too large for a typical phone. Try a smaller file, or use a computer.'
        : 'Your device ran out of memory. Try a smaller file.',
    };
  }

  // 4. Warning threshold checks
  const isWarnBytes = Boolean(limits?.warnBytes && file.size > limits.warnBytes);
  const isHighBudgetUsage = estimatedBytes > budget * 0.7;

  if (isWarnBytes || isHighBudgetUsage) {
    return {
      ok: true,
      status: 'warn',
      estimatedMemoryBytes: estimatedBytes,
      message: 'This file is large for your device. It may take longer to process.',
    };
  }

  return {
    ok: true,
    status: 'ok',
    estimatedMemoryBytes: estimatedBytes,
  };
}
