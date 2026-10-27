/**
 * Privacy-friendly, cookie-free analytics and telemetry.
 * Conforms strictly to Section 18 of the Hurrykit specification:
 *  - Zero file contents, file names, or file metadata are ever collected.
 *  - Zero cookies or cross-site tracking identifiers.
 *  - Only broad buckets for size and duration (never exact bytes or ms).
 *  - If blocked by ad-blockers or privacy extensions, all tools continue functioning identically.
 */

export type SizeBucket = '< 1 MB' | '1 - 5 MB' | '5 - 25 MB' | '25 - 100 MB' | '> 100 MB';
export type DurationBucket = '< 2s' | '2 - 10s' | '10 - 30s' | '> 30s';

export function getSizeBucket(bytes: number): SizeBucket {
  const mb = bytes / (1024 * 1024);
  if (mb < 1) return '< 1 MB';
  if (mb <= 5) return '1 - 5 MB';
  if (mb <= 25) return '5 - 25 MB';
  if (mb <= 100) return '25 - 100 MB';
  return '> 100 MB';
}

export function getDurationBucket(durationMs: number): DurationBucket {
  const s = durationMs / 1000;
  if (s < 2) return '< 2s';
  if (s <= 10) return '2 - 10s';
  if (s <= 30) return '10 - 30s';
  return '> 30s';
}

export function getBrowserInfo(): { browser: string; version: string } {
  if (typeof navigator === 'undefined') {
    return { browser: 'unknown', version: '0' };
  }
  const ua = navigator.userAgent;
  let browser = 'other';
  let version = '0';

  if (/Edg\/([0-9]+)/.test(ua)) {
    browser = 'edge';
    version = RegExp.$1 || '0';
  } else if (/Chrome\/([0-9]+)/.test(ua)) {
    browser = 'chrome';
    version = RegExp.$1 || '0';
  } else if (/Firefox\/([0-9]+)/.test(ua)) {
    browser = 'firefox';
    version = RegExp.$1 || '0';
  } else if (/Safari\/([0-9]+)/.test(ua) && !/Chrome/.test(ua)) {
    browser = 'safari';
    const verMatch = ua.match(/Version\/([0-9]+)/);
    version = verMatch?.[1] || '0';
  }

  return { browser, version };
}

export type AnalyticsEvent =
  | { name: 'pageview'; props?: { path: string } }
  | { name: 'tool_started'; props: { toolId: string } }
  | {
      name: 'conversion_finished';
      props: {
        toolId: string;
        from: string;
        to: string;
        sizeBucket: SizeBucket;
        durationBucket: DurationBucket;
        enginePath: string;
      };
    }
  | {
      name: 'conversion_failed';
      props: {
        toolId: string;
        errorCode: string;
        browser: string;
        version: string;
        deviceClass?: string;
      };
    }
  | { name: 'engine_load'; props: { status: 'success' | 'failure'; timeBucket: string } }
  | { name: 'download_clicked'; props: { toolId: string } };

declare global {
  interface Window {
    plausible?: (event: string, options?: { props?: Record<string, string | number | boolean> }) => void;
  }
}

/**
 * Single, audited track() function for all privacy-friendly analytics events.
 * Safe no-op in server-side, test, or ad-blocked environments.
 */
export function track<E extends AnalyticsEvent>(name: E['name'], props?: E['props']): void {
  if (typeof window === 'undefined') return;

  try {
    // 1. Plausible Analytics custom event support
    if (typeof window.plausible === 'function') {
      window.plausible(name, props ? { props: props as Record<string, string | number | boolean> } : undefined);
      return;
    }

    // 2. Dispatch custom DOM event for custom integrations / testing
    window.dispatchEvent(
      new CustomEvent('hurrykit:analytics', {
        detail: { name, props },
      }),
    );
  } catch {
    // Analytics failures must never interrupt user operations
  }
}

/**
 * Error reporting payload specification.
 * Strictly limited to anonymous error telemetry; never contains file data.
 */
export type ErrorLogPayload = {
  errorClass: string;
  toolId: string;
  browser: string;
  version: string;
  deviceClass?: 'low' | 'mid' | 'high';
};

/**
 * Report an error to the /api/error-log endpoint.
 * Transmits exclusively the allowed telemetry fields via navigator.sendBeacon or fetch.
 */
export function reportError(errorClass: string, toolId: string, deviceClass?: 'low' | 'mid' | 'high'): void {
  if (typeof window === 'undefined') return;

  const { browser, version } = getBrowserInfo();
  const payload: ErrorLogPayload = {
    errorClass: errorClass.slice(0, 64),
    toolId: toolId.slice(0, 64),
    browser,
    version,
    ...(deviceClass ? { deviceClass } : {}),
  };

  const body = JSON.stringify(payload);

  try {
    if (typeof navigator.sendBeacon === 'function') {
      const blob = new Blob([body], { type: 'application/json' });
      navigator.sendBeacon('/api/error-log', blob);
      return;
    }

    fetch('/api/error-log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
      keepalive: true,
    }).catch(() => {});
  } catch {
    // Logging failures must never impact user experience
  }
}
