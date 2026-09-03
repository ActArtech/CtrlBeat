/**
 * How strongly the playhead (or a bake time) should "hit" the beat grid.
 */

import { snapToNearest } from "../beatTimeline";

/**
 * Returns 0..1 intensity. Peaks at 1 exactly on a beat, falls off over
 * `halfLife` seconds on either side.
 */
export function beatPulseIntensity(
  time: number,
  beatTimes: readonly number[],
  halfLife = 0.12,
): number {
  if (beatTimes.length === 0 || halfLife <= 0) return 0;
  const nearest = snapToNearest(time, beatTimes, Number.POSITIVE_INFINITY);
  const dist = Math.abs(time - nearest);
  if (dist >= halfLife * 3) return 0;
  // Smooth falloff: 1 at center, ~0.5 at halfLife, near 0 at 3x.
  return Math.exp(-0.693 * (dist / halfLife));
}

/**
 * Grid size in pixels, pulsing smaller (denser glyphs) on the beat.
 */
export function pulsedGridSize(base: number, intensity: number): number {
  const clamped = Math.max(0, Math.min(1, intensity));
  return Math.max(6, Math.round(base * (1 - clamped * 0.35)));
}

/**
 * Glyph density 0..1 used to decide how many cells draw a symbol.
 */
export function pulsedDensity(base: number, intensity: number): number {
  return Math.max(0, Math.min(1, base + intensity * 0.45));
}
