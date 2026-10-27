import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

describe('Layout bundle engine isolation guard', () => {
  const layoutFiles = [
    'app/layout.tsx',
    'app/page.tsx',
    'app/not-found.tsx',
    'components/layout/Header.tsx',
    'components/layout/Footer.tsx',
    'components/layout/SearchBox.tsx',
    'components/layout/ThemeToggle.tsx',
    'components/layout/ThemeToggleButton.tsx',
    'components/layout/ThemeProvider.tsx',
    'components/hub/HubView.tsx',
  ];

  it.each(layoutFiles)('ensures %s contains zero imports from @/engines', (relativePath) => {
    const fullPath = path.join(process.cwd(), relativePath);
    expect(fs.existsSync(fullPath)).toBe(true);

    const source = fs.readFileSync(fullPath, 'utf-8');

    // Must not import engines
    expect(source).not.toMatch(/from\s+['"]@\/engines/);
    expect(source).not.toMatch(/from\s+['"]\.\.\/engines/);
    expect(source).not.toMatch(/import\s*\(\s*['"]@\/engines/);

    // Must not directly import ffmpeg or wasm codecs in layout shell
    expect(source).not.toMatch(/@ffmpeg\/ffmpeg/);
    expect(source).not.toMatch(/@jsquash/);
    expect(source).not.toMatch(/heic2any/);
  });
});
