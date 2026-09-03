/**
 * Scale helpers for "fit to frame" / "match size" on picture clips.
 *
 * Concat's scale is a multiplier over the contain-fitted size (scale 1 =
 * entire picture visible, aspect preserved). Fit-to-height / fit-to-width
 * push one axis flush with the output frame; match uses another clip's
 * displayed size as the target.
 */

export interface MediaSize {
  width: number;
  height: number;
}

export interface FittedSize {
  /** Picture width at scale 1, in frame pixels. */
  fittedWidth: number;
  /** Picture height at scale 1, in frame pixels. */
  fittedHeight: number;
}

/** Contain-fitted size inside the output frame (scale = 1). */
export function fittedSize(
  media: MediaSize,
  frame: MediaSize,
): FittedSize | null {
  if (media.width <= 0 || media.height <= 0 || frame.width <= 0 || frame.height <= 0) {
    return null;
  }
  const fit = Math.min(frame.width / media.width, frame.height / media.height);
  return {
    fittedWidth: media.width * fit,
    fittedHeight: media.height * fit,
  };
}

/** Scale so the picture's height equals the frame height. */
export function scaleToFitHeight(media: MediaSize, frame: MediaSize): number | null {
  const fitted = fittedSize(media, frame);
  if (!fitted || fitted.fittedHeight <= 0) return null;
  return frame.height / fitted.fittedHeight;
}

/** Scale so the picture's width equals the frame width. */
export function scaleToFitWidth(media: MediaSize, frame: MediaSize): number | null {
  const fitted = fittedSize(media, frame);
  if (!fitted || fitted.fittedWidth <= 0) return null;
  return frame.width / fitted.fittedWidth;
}

/** Scale so displayed width equals `targetWidth` (frame pixels). */
export function scaleToMatchWidth(
  media: MediaSize,
  frame: MediaSize,
  targetWidth: number,
): number | null {
  const fitted = fittedSize(media, frame);
  if (!fitted || fitted.fittedWidth <= 0 || targetWidth <= 0) return null;
  return targetWidth / fitted.fittedWidth;
}

/** Scale so displayed height equals `targetHeight` (frame pixels). */
export function scaleToMatchHeight(
  media: MediaSize,
  frame: MediaSize,
  targetHeight: number,
): number | null {
  const fitted = fittedSize(media, frame);
  if (!fitted || fitted.fittedHeight <= 0 || targetHeight <= 0) return null;
  return targetHeight / fitted.fittedHeight;
}

/** Displayed size at the given scale. */
export function displayedSize(
  media: MediaSize,
  frame: MediaSize,
  scale: number,
): FittedSize | null {
  const fitted = fittedSize(media, frame);
  if (!fitted) return null;
  return {
    fittedWidth: fitted.fittedWidth * scale,
    fittedHeight: fitted.fittedHeight * scale,
  };
}

/** Matches the engine SetClipTransform clamp. */
const MIN_SCALE = 0.05;
const MAX_SCALE = 8;

export function clampScale(scale: number): number {
  if (!Number.isFinite(scale)) return 1;
  return Math.min(MAX_SCALE, Math.max(MIN_SCALE, scale));
}
