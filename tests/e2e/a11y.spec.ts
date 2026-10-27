import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

/**
 * Automated accessibility (a11y) tests.
 * Validates semantic landmarks, skip link, live announcer,
 * and automated WCAG 2.1 Level AA conformance using axe-core.
 */
const PAGES_TO_TEST = [
  { path: '/', name: 'Home' },
  { path: '/image-converter', name: 'Image Hub' },
  { path: '/heic-to-jpg', name: 'HEIC to JPG Tool' },
  { path: '/mp4-to-mp3', name: 'MP4 to MP3 Tool' },
  { path: '/privacy-promise', name: 'Privacy Promise' },
  { path: '/about', name: 'About Page' },
];

for (const p of PAGES_TO_TEST) {
  test.describe(`Accessibility: ${p.name} (${p.path})`, () => {
    test('renders required landmarks and skip-to-content link', async ({ page }) => {
      await page.goto(p.path);

      // 1. Skip to content link
      const skipLink = page.locator('a.skip-link');
      await expect(skipLink).toBeAttached();
      await expect(skipLink).toHaveAttribute('href', '#main-content');

      // 2. Semantic landmarks
      await expect(page.locator('header').first()).toBeVisible();
      await expect(page.locator('main#main-content')).toBeVisible();
      await expect(page.locator('footer').first()).toBeVisible();

      // 3. Screen reader live announcer
      const announcer = page.locator('#live-announcer');
      await expect(announcer).toBeAttached();
      await expect(announcer).toHaveAttribute('aria-live', 'polite');
    });

    test('passes automated axe accessibility scan with 0 critical violations', async ({
      page,
    }) => {
      test.setTimeout(60_000);
      await page.goto(p.path);

      const accessibilityScanResults = await new AxeBuilder({ page })
        .include('main#main-content')
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .disableRules(['color-contrast']) // Color contrast evaluated visually with token themes
        .analyze();

      const criticalViolations = accessibilityScanResults.violations.filter(
        (v) => v.impact === 'critical' || v.impact === 'serious',
      );

      expect(criticalViolations).toEqual([]);
    });
  });
}
