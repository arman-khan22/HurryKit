'use client';
import Script from 'next/script';

/**
 * Cookie-free, privacy-friendly analytics loader.
 * Loads asynchronously after interactive; never blocks UI or engine operations.
 * If blocked by ad-blockers or privacy extensions, all converters run identically.
 */
export function Analytics() {
  const analyticsId = process.env.NEXT_PUBLIC_ANALYTICS_ID;
  if (!analyticsId) return null;

  // Cloudflare Web Analytics token or Plausible domain
  const isCloudflare = analyticsId.length === 32;

  if (isCloudflare) {
    return (
      <Script
        defer
        src="https://static.cloudflareinsights.com/beacon.min.js"
        data-cf-beacon={JSON.stringify({ token: analyticsId })}
        strategy="afterInteractive"
      />
    );
  }

  // Plausible-class cookie-free script
  return (
    <Script
      defer
      data-domain={analyticsId}
      src="https://plausible.io/js/script.tagged-events.js"
      strategy="afterInteractive"
    />
  );
}
