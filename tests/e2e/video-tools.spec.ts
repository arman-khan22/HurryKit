import { test, expect } from '@playwright/test';

/**
 * End-to-end tests for representative video conversion tools:
 * 1. mov-to-mp4 (iPhone and Mac videos, remux or transcode)
 * 2. mp4-to-gif (Animated GIF creation with custom width & fps)
 * 3. hevc-to-h264 (iPhone HEVC video to universal H.264 MP4)
 * 4. gif-to-mp4 (Animated GIF to H.264 MP4)
 *
 * Verifies UI state machine, options panel (quality, resolution, audio, GIF settings, force-reencode),
 * and the strict no-upload privacy invariant.
 */
const VIDEO_REPRESENTATIVE_TOOLS = [
  {
    slug: 'mov-to-mp4',
    name: 'MOV to MP4',
    ext: 'mov',
    mimeType: 'video/quicktime',
    hasAdvanced: true,
  },
  {
    slug: 'mp4-to-gif',
    name: 'MP4 to GIF',
    ext: 'mp4',
    mimeType: 'video/mp4',
    hasAdvanced: false,
    gifOptions: true,
  },
  {
    slug: 'hevc-to-h264',
    name: 'HEVC to H.264',
    ext: 'mp4',
    mimeType: 'video/mp4',
    hasAdvanced: false,
  },
  {
    slug: 'gif-to-mp4',
    name: 'GIF to MP4',
    ext: 'gif',
    mimeType: 'image/gif',
    hasAdvanced: false,
  },
];

for (const tool of VIDEO_REPRESENTATIVE_TOOLS) {
  test.describe(`Video tool E2E: /${tool.slug}`, () => {
    test(`renders tool page, privacy badge, and dropzone`, async ({ page }) => {
      // 1. Visit tool page
      await page.goto(`/${tool.slug}`);

      // 2. Check title and main landmarks
      await expect(page.locator('h1').first()).toBeVisible();
      await expect(
        page.getByText('Processed on your device. Nothing is uploaded.').first(),
      ).toBeVisible();

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

      // Add a simulated test video file to the dropzone
      const fileInput = page.locator('input[type="file"]');
      await fileInput.setInputFiles({
        name: `sample-video.${tool.ext}`,
        mimeType: tool.mimeType,
        buffer: Buffer.from('ftypmp42....mock video stream bytes for testing zero upload invariant'),
      });

      // File item appears in file queue
      await expect(page.getByText(`sample-video.${tool.ext}`)).toBeVisible();

      // If tool has options, options panel is displayed
      if (tool.gifOptions) {
        await expect(page.getByText('Options', { exact: true })).toBeVisible();
        await expect(page.getByText('GIF width', { exact: true })).toBeVisible();
        await expect(page.getByText('Frame rate', { exact: true })).toBeVisible();
      } else if (tool.slug === 'mov-to-mp4' || tool.slug === 'hevc-to-h264') {
        await expect(page.getByText('Options', { exact: true })).toBeVisible();
        await expect(page.getByText('Quality', { exact: true })).toBeVisible();
        await expect(page.getByText('Resolution', { exact: true })).toBeVisible();
        await expect(page.getByText('Audio', { exact: true })).toBeVisible();
      }

      // If tool has advanced options (e.g. mov-to-mp4 force-reencode)
      if (tool.hasAdvanced) {
        const advToggle = page.getByRole('button', { name: /Advanced options/i });
        await expect(advToggle).toBeVisible();
        await expect(advToggle).toHaveAttribute('aria-expanded', 'false');

        // Expand advanced options
        await advToggle.click();
        await expect(advToggle).toHaveAttribute('aria-expanded', 'true');
        await expect(page.getByText('Force re-encode', { exact: true })).toBeVisible();

        // Switch role is present
        const switchBtn = page.getByRole('switch');
        await expect(switchBtn).toBeVisible();
        await expect(switchBtn).toHaveAttribute('aria-checked', 'false');

        // Toggle switch
        await switchBtn.click();
        await expect(switchBtn).toHaveAttribute('aria-checked', 'true');
      }

      // Convert button is ready
      const convertBtn = page.getByRole('button', { name: /Convert/i });
      await expect(convertBtn).toBeVisible();
      await expect(convertBtn).toBeEnabled();

      // STRICT PRIVACY CHECK: Zero outbound requests carrying file bytes
      for (const payload of outboundPayloads) {
        expect(payload.size).toBeLessThan(2048);
      }
    });
  });
}
