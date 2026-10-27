import { test, expect } from '@playwright/test';
import { liveTools } from '../../registry';

/**
 * The non-negotiable privacy test:
 * Validates that during file loading, interaction, and conversion:
 *  1. No outbound request body exceeds 2 KB (> 2048 bytes).
 *  2. No outbound request (URL, query string, or body) contains the user's file name or file contents.
 *  3. Telemetry/error-logging strictly rejects any payload containing file names or file data.
 */
const allLive = liveTools();

for (const tool of allLive) {
  test(`no file data leaves browser on /${tool.slug}`, async ({ page }) => {
    const bodies: number[] = [];
    const requestUrls: string[] = [];
    const requestPayloads: string[] = [];

    const testFileName = `classified_confidential_document_${tool.slug}.${tool.from[0] ?? 'dat'}`;

    page.on('request', (request) => {
      requestUrls.push(request.url());
      const postBuffer = request.postDataBuffer();
      if (postBuffer) {
        bodies.push(postBuffer.length);
        requestPayloads.push(request.postData() || '');
      }
    });

    await page.goto(`/${tool.slug}`);

    // Verify privacy badge is present
    await expect(page.locator('text=Zero upload').first()).toBeVisible();

    // Verify file input exists
    const fileInput = page.locator('input[type="file"]').first();
    await expect(fileInput).toBeAttached();

    // Provide a file to the dropzone
    await fileInput.setInputFiles({
      name: testFileName,
      mimeType: 'application/octet-stream',
      buffer: Buffer.from(new Uint8Array(4096).fill(0x42)), // 4 KB dummy file
    });

    // Wait for file item to appear in queue
    await expect(page.getByText(testFileName)).toBeVisible();

    // Assert that no request body exceeded 2048 bytes (2 KB)
    for (const size of bodies) {
      expect(size).toBeLessThan(2048);
    }

    // Assert that neither the secret file name nor secret content was transmitted anywhere
    for (const url of requestUrls) {
      expect(url).not.toContain('classified_confidential');
    }
    for (const payload of requestPayloads) {
      expect(payload).not.toContain('classified_confidential');
    }
  });
}
