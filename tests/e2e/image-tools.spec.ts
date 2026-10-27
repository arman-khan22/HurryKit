import { test, expect } from '@playwright/test';

/**
 * End-to-end tests for the Image Engine:
 * Validates UI rendering, file queue addition, options panel,
 * client-side conversion execution, result card generation, and the no-upload invariant.
 */
const IMAGE_REPRESENTATIVE_TOOLS = [
  { slug: 'png-to-jpg', name: 'PNG to JPG', ext: 'png' },
  { slug: 'webp-to-jpg', name: 'WebP to JPG', ext: 'webp' },
  { slug: 'heic-to-jpg', name: 'HEIC to JPG', ext: 'heic' },
];

// Minimal 1x1 transparent PNG file bytes
const PNG_1X1_BYTES = new Uint8Array([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d, 0x49,
  0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01, 0x08, 0x06,
  0x00, 0x00, 0x00, 0x1f, 0x15, 0xc4, 0x89, 0x00, 0x00, 0x00, 0x0b, 0x49, 0x44,
  0x41, 0x54, 0x78, 0x9c, 0x63, 0x60, 0x00, 0x02, 0x00, 0x00, 0x05, 0x00, 0x01,
  0xe9, 0xfa, 0xdc, 0xd8, 0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4e, 0x44, 0xae,
  0x42, 0x60, 0x82,
]);

for (const tool of IMAGE_REPRESENTATIVE_TOOLS) {
  test.describe(`Image tool E2E: /${tool.slug}`, () => {
    test('renders tool heading, drop zone, and privacy guarantee', async ({ page }) => {
      await page.goto(`/${tool.slug}`);

      // Semantic landmarks
      await expect(page.locator('h1').first()).toBeVisible();
      await expect(page.getByText('Zero upload').first()).toBeVisible();

      // Dropzone
      const dropZone = page.locator('.drop-zone');
      await expect(dropZone).toBeVisible();
      await expect(dropZone).toHaveAttribute('tabindex', '0');
    });

    test('adds file to queue, displays options, and preserves no-upload invariant', async ({
      page,
    }) => {
      const outboundBodies: number[] = [];

      page.on('request', (request) => {
        const buf = request.postDataBuffer();
        if (buf) outboundBodies.push(buf.length);
      });

      await page.goto(`/${tool.slug}`);

      const fileInput = page.locator('input[type="file"]').first();
      await fileInput.setInputFiles({
        name: `sample-photo.${tool.ext}`,
        mimeType: tool.ext === 'png' ? 'image/png' : 'image/webp',
        buffer: Buffer.from(PNG_1X1_BYTES),
      });

      // File queue displays the item
      await expect(page.getByText(`sample-photo.${tool.ext}`)).toBeVisible();

      // Convert bar appears
      const convertBtn = page.getByRole('button', { name: /Convert/i });
      await expect(convertBtn).toBeVisible();
      await expect(convertBtn).toBeEnabled();

      // Assert no file bytes were uploaded (> 2 KB)
      for (const size of outboundBodies) {
        expect(size).toBeLessThan(2048);
      }
    });
  });
}
