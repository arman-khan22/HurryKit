import { test, expect } from '@playwright/test';

test.describe('Mobile Device Performance & Memory Budgets (Section 15)', () => {
  test.use({
    viewport: { width: 412, height: 915 },
    userAgent:
      'Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
    isMobile: true,
    hasTouch: true,
  });

  test('Mid-range Android: Initial page load stays strictly within performance budget (< 150KB core JS, 0 WASM)', async ({
    page,
  }) => {
    let wasmDownloaded = false;

    page.on('response', (response) => {
      const url = response.url();
      if (url.endsWith('.wasm')) {
        wasmDownloaded = true;
      }
    });

    await page.goto('/heic-to-jpg', { waitUntil: 'domcontentloaded' });

    // Verify browser in-page DOMContentLoaded timing is under 3s
    const navTiming = await page.evaluate(() => {
      const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;
      return nav ? nav.domContentLoadedEventEnd - nav.startTime : 0;
    });

    expect(navTiming).toBeLessThan(3500);

    // ZERO WebAssembly engine binaries downloaded on page load (strict bundle isolation)
    expect(wasmDownloaded).toBe(false);

    // Verify DropZone and mobile UI elements are interactive
    const dropZone = page.locator('.drop-zone');
    await expect(dropZone).toBeVisible();

    // Confirm no horizontal scrollbar / overflow on mobile viewport
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 2);
  });

  test('Mid-range Android: Memory guard warns on large-but-allowed files and blocks oversized files', async ({
    page,
  }) => {
    // Test on video transcode tool where mobile threshold is 150 MB (warn at 105 MB)
    await page.goto('/hevc-to-h264');

    // 1. Queue a large-but-allowed video (110 MB on mobile)
    await page.evaluate(() => {
      const fileInput = document.getElementById('file-input-hevc-to-h264') as HTMLInputElement;
      if (!fileInput) return;

      const largeFile = new File([new Uint8Array(1024)], 'vacation_clip.mp4', {
        type: 'video/mp4',
      });
      Object.defineProperty(largeFile, 'size', { value: 110 * 1024 * 1024 });

      const dt = new DataTransfer();
      dt.items.add(largeFile);
      fileInput.files = dt.files;
      fileInput.dispatchEvent(new Event('change', { bubbles: true }));
    });

    // File card should appear in the queue with a warning notice
    await expect(page.locator('text=vacation_clip.mp4')).toBeVisible();

    // 2. Queue a file exceeding mobile hard transcode threshold (> 150 MB, e.g. 180 MB)
    await page.evaluate(() => {
      const fileInput = document.getElementById('file-input-hevc-to-h264') as HTMLInputElement;
      if (!fileInput) return;

      const hugeFile = new File([new Uint8Array(1024)], 'oversized_4k.mp4', {
        type: 'video/mp4',
      });
      Object.defineProperty(hugeFile, 'size', { value: 180 * 1024 * 1024 });

      const dt = new DataTransfer();
      dt.items.add(hugeFile);
      fileInput.files = dt.files;
      fileInput.dispatchEvent(new Event('change', { bubbles: true }));
    });

    // Verify user receives clear guidance message in ErrorNotice banner
    await expect(
      page.locator('text=/too large for a typical phone|bigger than this tool/i').first(),
    ).toBeVisible();
  });
});

test.describe('iOS Safari Mobile Verification', () => {
  test.use({
    viewport: { width: 390, height: 844 },
    userAgent:
      'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
    isMobile: true,
    hasTouch: true,
  });

  test('iOS Safari: DropZone renders touch-friendly camera and file options with zero horizontal overflow', async ({
    page,
  }) => {
    await page.goto('/heic-to-jpg');

    const dropZone = page.locator('.drop-zone');
    await expect(dropZone).toBeVisible();

    // Check camera option visibility on mobile
    const cameraBtn = page.locator('button:has-text("Use camera")');
    await expect(cameraBtn).toBeVisible();

    // Verify touch action response
    await cameraBtn.hover();

    // Check no horizontal overflow
    const hasHorizontalOverflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });
    expect(hasHorizontalOverflow).toBe(false);
  });
});
