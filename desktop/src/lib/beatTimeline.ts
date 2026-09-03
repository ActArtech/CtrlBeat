/**
 * Maps media-relative beat times onto the timeline for a placed audio clip,
 * and helpers for snap / edit.
 */

import type { Clip } from "./generated/Clip";

/**
 * Converts beat times measured in the media file into timeline seconds for
 * the clip that carries that media.
 *
 * `timeline = clip.start + (mediaTime - sourceStart) / speed`
 *
 * When `mediaDuration` is provided, beats are kept for the full remaining
 * media from `sourceStart`, not only the current clip trim - so a short
 * timeline clip still gets marks for the whole song once you extend it, and
 * analyze is never silently capped by an 8s trim.
 */
export function mediaBeatsToTimeline(
  mediaBeatTimes: readonly number[],
  clip: Pick<Clip, "start" | "sourceStart" | "speed" | "duration">,
  mediaDuration?: number | null,
): number[] {
  const speed = clip.speed > 0 ? clip.speed : 1;
  const mediaRemain =
    mediaDuration && mediaDuration > 0
      ? Math.max(clip.duration * speed, mediaDuration - clip.sourceStart)
      : clip.duration * speed;
  const timelineSpan = mediaRemain / speed;
  const out: number[] = [];
  for (const mediaTime of mediaBeatTimes) {
    if (!Number.isFinite(mediaTime)) continue;
    if (mediaTime < clip.sourceStart - 1e-6) continue;
    const timeline = clip.start + (mediaTime - clip.sourceStart) / speed;
    if (timeline < clip.start - 1e-6) continue;
    if (timeline > clip.start + timelineSpan + 1e-6) continue;
    out.push(timeline);
  }
  return out;
}

/** Snaps `time` to the nearest point when within `threshold` seconds. */
export function snapToNearest(
  time: number,
  points: readonly number[],
  threshold: number,
): number {
  if (points.length === 0 || threshold <= 0) return time;
  let best = time;
  let bestDist = threshold;
  for (const point of points) {
    const dist = Math.abs(point - time);
    if (dist < bestDist) {
      bestDist = dist;
      best = point;
    }
  }
  return best;
}

/** Beat hit-test on the ruler: nearest beat within pixelThreshold. */
export function beatIndexNear(
  time: number,
  beatTimes: readonly number[],
  secondsPerPixel: number,
  pixelThreshold = 6,
): number {
  if (beatTimes.length === 0) return -1;
  const threshold = pixelThreshold * secondsPerPixel;
  let best = -1;
  let bestDist = threshold;
  for (let i = 0; i < beatTimes.length; i++) {
    const dist = Math.abs(beatTimes[i] - time);
    if (dist <= bestDist) {
      bestDist = dist;
      best = i;
    }
  }
  return best;
}
