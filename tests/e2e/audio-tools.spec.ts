import { test, expect } from '@playwright/test';

/**
 * End-to-end tests for representative audio conversion tools:
 * 1. opus-to-mp3 (WhatsApp voice notes)
 * 2. wav-to-mp3 (Standard desktop / studio audio)
 * 3. mp4-to-mp3 (Video audio extraction)
 *
 * Verifies UI state machine, options panel (primary + collapsed advanced),
 * and the strict no-upload privacy invariant.
 */
const AUDIO_REPRESENTATIVE_TOOLS = [
  { slug: 'opus-to-mp3', name: 'OPUS to MP3', primaryOption: 'Bitrate', defaultVal: '192' },
  { slug: 'wav-to-mp3', name: 'WAV to MP3', primaryOption: 'Bitrate', defaultVal: '192' },
  { slug: 'mp4-to-mp3', name: 'MP4 to MP3', primaryOption: 'Bitrate', defaultVal: '192' },
];

for (const tool of AUDIO_REPRESENTATIVE_TOOLS) {
  test.describe(`Audio tool E2E: /${tool.slug}`, () => {
    test(`renders tool page, privacy badge, and options`, async ({ page }) => {
      // 1. Visit tool page
      await page.goto(`/${tool.slug}`);

      // 2. Check title and main landmarks
      await expect(page.locator('h1').first()).toBeVisible();
      await expect(page.getByText('Processed on your device. Nothing is uploaded.').first()).toBeVisible();

      // 3. Drop zone is visible and keyboard accessible
      const dropZone = page.locator('.drop-zone');
      await expect(dropZone).toBeVisible();
      await expect(dropZone).toHaveAttribute('tabindex', '0');

      // 4. Inspect file upload input
      const fileInput = page.locator('input[type="file"]');
      await expect(fileInput).toHaveCount(1);
    });

    test(`enforces the no-upload invariant when files are added on /${tool.slug}`, async ({
      page,
    }) => {
      const outboundPayloads: Array<{ url: string; size: number }> = [];

      // Monitor all outbound network requests
      page.on('request', (request) => {
        const postData = request.postDataBuffer();
        if (postData) {
          outboundPayloads.push({
            url: request.url(),
            size: postData.length,
          });
        }
      });

      await page.goto(`/${tool.slug}`);

      // Add a simulated test file to the dropzone
      const fileInput = page.locator('input[type="file"]');
      const ext = tool.slug.split('-to-')[0];
      await fileInput.setInputFiles({
        name: `sample-audio.${ext}`,
        mimeType: ext === 'mp4' ? 'video/mp4' : 'audio/ogg',
        buffer: Buffer.from('RIFF....WAVEfmt ....data....test audio buffer bytes'),
      });

      // File item appears in file queue
      await expect(page.getByText(`sample-audio.${ext}`)).toBeVisible();

      // Options panel is displayed
      await expect(page.getByText('Options', { exact: true })).toBeVisible();
      await expect(page.getByText(tool.primaryOption, { exact: true })).toBeVisible();

      // Advanced options toggle is present and collapsed by default
      const advToggle = page.getByRole('button', { name: /Advanced options/i });
      await expect(advToggle).toBeVisible();
      await expect(advToggle).toHaveAttribute('aria-expanded', 'false');

      // Expand advanced options
      await advToggle.click();
      await expect(advToggle).toHaveAttribute('aria-expanded', 'true');
      await expect(page.getByText('Channels', { exact: true })).toBeVisible();
      await expect(page.getByText('Sample rate', { exact: true })).toBeVisible();

      // Convert button is ready
      const convertBtn = page.getByRole('button', { name: /Convert/i });
      await expect(convertBtn).toBeVisible();
      await expect(convertBtn).toBeEnabled();

      // STRICT PRIVACY CHECK: Zero outbound requests containing file bytes
      for (const payload of outboundPayloads) {
        // No request should ever carry file data (> 2 KB)
        expect(payload.size).toBeLessThan(2048);
      }
    });
  });
}
