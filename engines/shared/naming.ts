/**
 * Output file naming utilities.
 * Keeps the original base name, changes the extension, de-duplicates batch names,
 * and ensures filenames are safe across Windows, macOS, and Linux while preserving
 * international Unicode characters (Hindi, Arabic, Chinese, accented characters, etc.).
 */

/** Strip directory path segments from a filename */
export function stripPath(path: string): string {
  return path.replace(/^.*[\\/]/, '');
}

/** Strip the extension from a filename */
export function baseName(fileName: string): string {
  const dot = fileName.lastIndexOf('.');
  return dot > 0 ? fileName.slice(0, dot) : fileName;
}

/**
 * Sanitizes a filename base to eliminate dangerous characters
 * (<, >, :, ", /, \, |, ?, *, control chars) while fully preserving
 * international Unicode characters (Devanagari/Hindi, CJK, Arabic, etc.).
 */
export function sanitizeBase(name: string): string {
  const safe = name.replace(/[<>:"/\\|?*\x00-\x1f]/g, '_').trim();
  return safe || 'file';
}

/**
 * Safely truncate a filename base if it exceeds length limits.
 * Uses Array.from to prevent splitting multi-byte Unicode code points.
 */
export function safeTruncate(name: string, maxLength = 100): string {
  const safe = sanitizeBase(name);
  const chars = Array.from(safe);
  if (chars.length <= maxLength) return safe;
  return chars.slice(0, maxLength).join('');
}

/**
 * Build the safe output filename.
 * Example: IMG_0012.HEIC + 'jpg' → IMG_0012.jpg
 * Example: फ़ोटो_२०२६.png + 'jpg' → फ़ोटो_२०२६.jpg
 */
export function outputFileName(inputName: string, toExt: string): string {
  const base = safeTruncate(baseName(inputName));
  const ext = toExt.startsWith('.') ? toExt.slice(1).toLowerCase() : toExt.toLowerCase();
  return `${base}.${ext}`;
}

/**
 * Generate a unique safe output name that does not collide with existing names in a batch.
 */
export function getSafeOutputName(
  inputName: string,
  toExt: string,
  existingNames?: Set<string> | readonly string[],
): string {
  const candidate = outputFileName(inputName, toExt);
  if (!existingNames) return candidate;

  const namesSet =
    existingNames instanceof Set
      ? existingNames
      : new Set(existingNames.map((n) => n.toLowerCase()));

  if (!namesSet.has(candidate.toLowerCase())) {
    return candidate;
  }

  const base = safeTruncate(baseName(inputName));
  const ext = toExt.startsWith('.') ? toExt.slice(1).toLowerCase() : toExt.toLowerCase();

  let counter = 1;
  while (namesSet.has(`${base}_${counter}.${ext}`.toLowerCase())) {
    counter++;
  }

  return `${base}_${counter}.${ext}`;
}

/**
 * De-duplicate names in a batch by appending a numeric suffix.
 * Returns a new array of unique names in the same order.
 */
export function deduplicateNames(names: readonly string[]): string[] {
  const seen = new Map<string, number>();
  return names.map((name) => {
    const lower = name.toLowerCase();
    const count = seen.get(lower) ?? 0;
    seen.set(lower, count + 1);
    if (count === 0) return name;

    const dot = name.lastIndexOf('.');
    if (dot > 0) {
      return `${name.slice(0, dot)}_${count}${name.slice(dot)}`;
    }
    return `${name}_${count}`;
  });
}

/**
 * Format a byte count for display: "3.2 MB", "428 KB", "12 B"
 */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Format seconds into a human-readable estimate: "2 minutes", "45 seconds"
 */
export function formatTimeRemaining(seconds: number): string {
  if (seconds < 10) return 'a few seconds';
  if (seconds < 60) return `${Math.round(seconds)} seconds`;
  const mins = Math.round(seconds / 60);
  return `${mins} minute${mins !== 1 ? 's' : ''}`;
}

/** Alias for sanitizeBase for full filename sanitization */
export const sanitizeFileName = sanitizeBase;

/** Helper to generate a unique filename against an existing list */
export function uniqueName(fileName: string, existing: readonly string[] | Set<string>): string {
  const dot = fileName.lastIndexOf('.');
  const base = dot > 0 ? fileName.slice(0, dot) : fileName;
  const ext = dot > 0 ? fileName.slice(dot + 1) : '';
  return getSafeOutputName(base, ext, existing);
}

