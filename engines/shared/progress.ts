/**
 * Progress normalizer.
 * Normalizes multi-stage conversion pipelines into a smooth 0.0 → 1.0 fraction
 * and computes estimated seconds remaining (ETA).
 */
import type { ProgressStage, JobProgress } from '../types';

export interface StageWeightMap {
  [stage: string]: number;
}

export const DEFAULT_STAGE_WEIGHTS: Record<ProgressStage, number> = {
  'loading-engine': 0.1,
  reading: 0.05,
  detecting: 0.05,
  converting: 0.7,
  encoding: 0.05,
  finishing: 0.05,
};

export class ProgressNormalizer {
  private weights: Record<string, number>;
  private stageOffsets: Record<string, number> = {};
  private startTime: number = Date.now();
  private lastFraction = 0;
  private samples: { time: number; fraction: number }[] = [];

  constructor(customWeights?: Partial<Record<ProgressStage, number>>) {
    this.weights = { ...DEFAULT_STAGE_WEIGHTS, ...customWeights };

    // Calculate cumulative offsets for each stage
    const totalWeight = Object.values(this.weights).reduce((a, b) => a + b, 0);
    let accum = 0;
    for (const [stage, weight] of Object.entries(this.weights)) {
      this.stageOffsets[stage] = accum / totalWeight;
      accum += weight;
    }
  }

  /** Reset internal timer and progress tracking */
  public reset(): void {
    this.startTime = Date.now();
    this.lastFraction = 0;
    this.samples = [];
  }

  /**
   * Update progress for a given stage.
   * @param stage Current pipeline stage
   * @param stageFraction Progress within this stage (0.0 to 1.0)
   * @param message Optional status message
   */
  public update(
    stage: ProgressStage,
    stageFraction: number,
    message?: string,
  ): JobProgress {
    const clampedStageFraction = Math.max(0, Math.min(1, stageFraction));
    const offset = this.stageOffsets[stage] ?? 0;
    const totalWeight = Object.values(this.weights).reduce((a, b) => a + b, 0);
    const stagePortion = (this.weights[stage] ?? 0) / totalWeight;

    const rawFraction = offset + clampedStageFraction * stagePortion;
    // Ensure monotonicity (never go backwards)
    const fraction = Math.max(this.lastFraction, Math.min(1, rawFraction));
    this.lastFraction = fraction;

    const now = Date.now();
    this.samples.push({ time: now, fraction });
    if (this.samples.length > 20) {
      this.samples.shift();
    }

    const secondsRemaining = this.calculateEta(now, fraction);

    return {
      stage,
      fraction: Number(fraction.toFixed(3)),
      message,
      secondsRemaining,
    };
  }

  /**
   * Compute ETA based on elapsed time and progress speed.
   */
  private calculateEta(now: number, fraction: number): number | undefined {
    if (fraction <= 0.05 || fraction >= 0.99) return undefined;

    const elapsedSeconds = (now - this.startTime) / 1000;
    if (elapsedSeconds < 0.5) return undefined;

    // Moving average estimation
    const rate = fraction / elapsedSeconds;
    if (rate <= 0) return undefined;

    const remainingFraction = 1 - fraction;
    const eta = remainingFraction / rate;

    return Math.max(1, Math.round(eta));
  }
}

/** Convenience creator for a ProgressNormalizer */
export function createProgressNormalizer(
  customWeights?: Partial<Record<ProgressStage, number>>,
): ProgressNormalizer {
  return new ProgressNormalizer(customWeights);
}
