/**
 * Planning helpers for the overlay bake: one animated clip instead of one
 * still per beat.
 *
 * The bake renders the overlay in the webview at a steady frame rate over the
 * beat span - the same draws the live overlay performs - and streams each
 * frame to the host, which encodes them into a single MP4. Everything here is
 * pure except the hidden-video helpers at the bottom; the planner is what
 * tests pin.
 */

import { convertFileSrc } from "@tauri-apps/api/core";

/** What a bake renders, decided by surface + whether a video source exists. */
export type BakeKind = "visualizer" | "asciiVideo" | "symbols";

export interface BakeSpan {
  start: number;
  end: number;
}

/**
 * Where the baked clip sits on the timeline.
 *
 * Same edges the per-beat stills had: it starts at the first used beat and
 * runs to the beat audio's end, or a short tail past the last used beat when
 * the audio's end is unknown.
 */
export function bakeSpan(
  usedBeats: readonly number[],
  endCap: number | undefined,
  tailSeconds = 5,
): BakeSpan | null {
  if (usedBeats.length === 0) return null;
  const start = usedBeats[0]!;
  const last = usedBeats[usedBeats.length - 1]!;
  const end =
    endCap !== undefined && Number.isFinite(endCap) && endCap > start ? endCap : last + tailSeconds;
  return end > start ? { start, end } : null;
}

/** Full-rate targets. ASCII-on-video is lower: every frame costs a seek. */
const BASE_FPS: Record<BakeKind, number> = {
  visualizer: 30,
  symbols: 30,
  asciiVideo: 12,
};

/**
 * The frame budget: a span up to this length bakes at the kind's full rate,
 * longer spans spend the budget down to the floor rate. Beyond the floor,
 * bake time simply grows with the song - the frames have to come from
 * somewhere, and 8 fps is where the motion stops reading as motion.
 */
export const BAKE_FRAME_BUDGET = 12_000;
/** Below this an animated overlay is a slideshow again; never go under it. */
export const MIN_BAKE_FPS = 8;

export function bakeFrameRate(kind: BakeKind, spanSeconds: number, requested?: number): number {
  const span = Math.max(1, spanSeconds);
  // A requested rate is a ceiling, not an override: the kind's own ceiling and
  // the budget still apply, so "30 fps" on ASCII-on-video means its 12.
  const ceiling =
    requested === undefined ? BASE_FPS[kind] : Math.min(BASE_FPS[kind], Math.max(1, Math.floor(requested)));
  const budgeted = Math.floor(BAKE_FRAME_BUDGET / span);
  return Math.max(MIN_BAKE_FPS, Math.min(ceiling, budgeted));
}

/** The smoothness choices the bake dialog offers, slowest to smoothest. */
export const BAKE_FPS_CHOICES = [12, 24, 30] as const;

/**
 * What the user agrees to in the bake dialog. Everything else (span, size,
 * palette) is decided by the planner, not negotiated.
 */
export interface BakeConfig {
  /** Requested frames per second; clamped by `bakeFrameRate`. */
  fps: number;
  /** Remove a previous bake before placing this one. */
  replace: boolean;
}

/**
 * Rough wall-clock estimate for the frame loop alone, from per-frame costs
 * measured on this path (canvas draw + JPEG + IPC; ASCII adds a source seek).
 * The point is the order of magnitude, not the second.
 */
const MS_PER_FRAME: Record<BakeKind, number> = {
  visualizer: 16,
  symbols: 14,
  asciiVideo: 50,
};

export function estimateBakeSeconds(kind: BakeKind, frames: number): number {
  return Math.max(1, Math.round((Math.max(0, frames) * MS_PER_FRAME[kind]) / 1000));
}

/** The frame count a span bakes to at `fps`, without materialising the times. */
export function bakeFrameCount(span: BakeSpan, fps: number): number {
  return Math.max(1, Math.ceil((span.end - span.start) * Math.max(1, fps)));
}

/**
 * The sample times, first inclusive and last strictly before the end - each
 * one holds for 1/fps seconds, so together they tile the span.
 */
export function bakeFrameTimes(start: number, end: number, fps: number): number[] {
  const count = Math.max(1, Math.ceil((end - start) * fps));
  const times: number[] = [];
  for (let index = 0; index < count; index += 1) {
    times.push(start + index / fps);
  }
  return times;
}

/**
 * Output dimensions: even (yuv420p requires it) and long-edge capped, because
 * an overlay of flat glyphs and particles does not need 4K to survive one
 * encode-and-decode round trip.
 */
export function bakeSize(
  width: number,
  height: number,
  maxLongEdge = 1920,
): { width: number; height: number } {
  const scale = Math.min(1, maxLongEdge / Math.max(1, width, height));
  return {
    width: Math.max(2, 2 * Math.floor((width * scale) / 2)),
    height: Math.max(2, 2 * Math.floor((height * scale) / 2)),
  };
}

/**
 * A short cache filename for the baked MP4, derived from the same settings
 * string that decides whether a re-bake can be skipped.
 */
export function bakeFileKey(kind: string, settingsKey: string): string {
  // FNV-1a, like the artwork key in assets.ts: collisions are astronomically
  // unlikely at bake frequency, and the worst case is reusing a stale clip.
  let hash = 0x811c9dc5;
  for (let index = 0; index < settingsKey.length; index += 1) {
    hash ^= settingsKey.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return `bake-${kind}-${hash.toString(16).padStart(8, "0")}.mp4`;
}

// ── hidden-video sampling ───────────────────────────────────────────────────
// ASCII-on-video needs the source frame under each baked frame. A detached,
// muted video element parked at exact timestamps is the webview's decoder;
// extract_still would spawn one ffmpeg per frame.

/** A hidden `<video>` that parks at exact frames. Attach before use. */
export function createBakeVideo(path: string): HTMLVideoElement {
  const video = document.createElement("video");
  video.muted = true;
  video.preload = "auto";
  video.src = convertFileSrc(path);
  video.style.display = "none";
  return video;
}

/** Resolves once the first frame is decodable, or false on timeout. */
export function waitBakeVideoReady(
  video: HTMLVideoElement,
  timeoutMs = 8000,
): Promise<boolean> {
  if (video.readyState >= 2) return Promise.resolve(true);
  return new Promise((resolve) => {
    const finish = (ok: boolean) => {
      video.removeEventListener("loadeddata", onData);
      clearTimeout(timer);
      resolve(ok);
    };
    const onData = () => finish(true);
    const timer = setTimeout(() => finish(false), timeoutMs);
    video.addEventListener("loadeddata", onData);
  });
}

/**
 * Parks the element at `time` seconds; resolves false on timeout so the
 * caller can keep the previous frame rather than abort a long bake.
 */
export function seekBakeVideo(
  video: HTMLVideoElement,
  time: number,
  timeoutMs = 2000,
): Promise<boolean> {
  if (Math.abs(video.currentTime - time) < 1e-4) return Promise.resolve(true);
  return new Promise((resolve) => {
    const finish = (ok: boolean) => {
      video.removeEventListener("seeked", onSeeked);
      clearTimeout(timer);
      resolve(ok);
    };
    const onSeeked = () => finish(true);
    const timer = setTimeout(() => finish(false), timeoutMs);
    video.addEventListener("seeked", onSeeked);
    video.currentTime = time;
  });
}
