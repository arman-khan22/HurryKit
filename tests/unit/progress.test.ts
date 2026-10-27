import { describe, it, expect } from 'vitest';
import { ProgressNormalizer, createProgressNormalizer } from '../../engines/shared/progress';

describe('ProgressNormalizer (0-1 fraction + ETA)', () => {
  it('maps stages to fractional progress smoothly and monotonically', () => {
    const normalizer = createProgressNormalizer();

    const p1 = normalizer.update('loading-engine', 0.5);
    expect(p1.stage).toBe('loading-engine');
    expect(p1.fraction).toBeGreaterThan(0);
    expect(p1.fraction).toBeLessThan(0.15);

    const p2 = normalizer.update('reading', 0.5);
    expect(p2.stage).toBe('reading');
    expect(p2.fraction).toBeGreaterThan(p1.fraction);

    const p3 = normalizer.update('converting', 0.5);
    expect(p3.stage).toBe('converting');
    expect(p3.fraction).toBeGreaterThan(p2.fraction);

    const p4 = normalizer.update('finishing', 1.0);
    expect(p4.stage).toBe('finishing');
    expect(p4.fraction).toBe(1.0);
  });

  it('guarantees progress never moves backwards', () => {
    const normalizer = createProgressNormalizer();

    const p1 = normalizer.update('converting', 0.8);
    const p2 = normalizer.update('converting', 0.2); // An erratic worker progress update

    expect(p2.fraction).toBeGreaterThanOrEqual(p1.fraction);
  });

  it('resets tracking state when reset() is called', () => {
    const normalizer = createProgressNormalizer();
    normalizer.update('finishing', 1.0);
    normalizer.reset();

    const initial = normalizer.update('loading-engine', 0.1);
    expect(initial.fraction).toBeLessThan(0.1);
  });
});
