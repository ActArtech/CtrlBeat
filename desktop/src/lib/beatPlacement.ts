/**
 * Pure planner: ordered bin media (images and/or videos) + beat times ->
 * clip placements for `placeImageClips`.
 *
 * Video clips always occupy exactly the beat gap on the timeline (never
 * longer), so they abut instead of stacking. Source in-point defaults to 0;
 * a per-clip slider can move which window of the file plays inside the gap.
 */

export interface BeatPlacement {
  mediaId: string;
  start: number;
  duration: number;
  /** Video in-point; omitted for stills. */
  sourceStart?: number;
}

/** One selected bin item with enough facts to plan video gaps. */
export interface BeatMediaItem {
  mediaId: string;
  kind: "image" | "video";
  /** Usable media length in seconds. Stills may omit. */
  mediaDuration?: number | null;
}

export interface BeatPlacementOptions {
  /**
   * Place a media item every N beats. 1 = every beat, 3 = every third beat.
   * Prefer this over `beatSkip`. Values below 1 are treated as 1.
   */
  beatsPerImage?: number;
  /**
   * Legacy alias: beats skipped between placements.
   * `beatSkip: 2` matches `beatsPerImage: 3`. Ignored when `beatsPerImage` is set.
   */
  beatSkip?: number;
  /**
   * When true, cycle through media until beats (or `endTime`) run out
   * so a short list fills the whole song.
   */
  loopImages?: boolean;
  /**
   * Song / audio end in seconds. With `loopImages`, placement stops at the
   * last selected beat that is still before this time. Without loop, only
   * used as a fallback end for the final clip duration.
   */
  endTime?: number;
  /** Duration for the final still when there is no following beat. */
  lastDuration?: number;
  /** Floor for every clip duration (matches engine MIN_CLIP_DURATION). */
  minDuration?: number;
  /**
   * When true, repeated uses of the same video advance `sourceStart`.
   * Default false: every slot starts at source 0; the Adjust slider moves it.
   */
  progressVideos?: boolean;
}

const DEFAULT_LAST_DURATION = 5.0;
const DEFAULT_MIN_DURATION = 1 / 60;

/** Resolves the step between used beats (at least 1). */
export function beatsPerImageStep(options: BeatPlacementOptions): number {
  if (options.beatsPerImage !== undefined) {
    return Math.max(1, Math.floor(options.beatsPerImage));
  }
  return Math.max(0, Math.floor(options.beatSkip ?? 0)) + 1;
}

/**
 * Selects beat times after applying the every-N-beats step.
 */
export function selectBeatTimes(
  beatTimes: readonly number[],
  beatSkipOrOptions: number | BeatPlacementOptions = 0,
): number[] {
  const step =
    typeof beatSkipOrOptions === "number"
      ? Math.max(0, Math.floor(beatSkipOrOptions)) + 1
      : beatsPerImageStep(beatSkipOrOptions);
  const ordered = [...beatTimes].filter((t) => Number.isFinite(t) && t >= 0).sort((a, b) => a - b);
  const selected: number[] = [];
  for (let i = 0; i < ordered.length; i += step) {
    selected.push(ordered[i]!);
  }
  return selected;
}

/**
 * Plans clip placements on a beat grid from plain media ids (legacy).
 * Prefer {@link planMediaOnBeats} when kinds/durations are known.
 */
export function planBeatPlacement(
  mediaIds: readonly string[],
  beatTimes: readonly number[],
  options: BeatPlacementOptions = {},
): BeatPlacement[] {
  return planMediaOnBeats(
    mediaIds.map((mediaId) => ({ mediaId, kind: "image" as const })),
    beatTimes,
    options,
  );
}

/**
 * Plans image + video placements on a beat grid.
 *
 * Timeline duration is always the beat gap (never longer than the gap), so
 * clips abut on one track instead of overlapping. Videos default to
 * `sourceStart: 0`; enable `progressVideos` to walk through the file.
 */
export function planMediaOnBeats(
  items: readonly BeatMediaItem[],
  beatTimes: readonly number[],
  options: BeatPlacementOptions = {},
): BeatPlacement[] {
  if (items.length === 0) return [];

  const lastDuration = options.lastDuration ?? DEFAULT_LAST_DURATION;
  const minDuration = options.minDuration ?? DEFAULT_MIN_DURATION;
  const loopImages = options.loopImages === true;
  const progressVideos = options.progressVideos === true;
  const endTime =
    options.endTime !== undefined && Number.isFinite(options.endTime)
      ? Math.max(0, options.endTime)
      : undefined;

  let beats = selectBeatTimes(beatTimes, options);
  if (endTime !== undefined) {
    beats = beats.filter((time) => time < endTime);
  }
  if (beats.length === 0) return [];

  const slotCount = loopImages ? beats.length : Math.min(items.length, beats.length);
  const placements: BeatPlacement[] = [];
  const cursor = new Map<string, number>();

  for (let i = 0; i < slotCount; i++) {
    const item = items[i % items.length]!;
    const start = beats[i]!;
    const nextBeat = i + 1 < beats.length ? beats[i + 1]! : undefined;
    const fallbackEnd = endTime ?? start + lastDuration;
    // Hard rule: timeline length is the beat gap (or song end), never longer.
    const gap = Math.max(minDuration, (nextBeat ?? fallbackEnd) - start);

    let sourceStart = 0;
    let duration = gap;

    if (item.kind === "video") {
      const mediaLen =
        item.mediaDuration && item.mediaDuration > 0 ? item.mediaDuration : Number.POSITIVE_INFINITY;
      if (progressVideos) {
        sourceStart = cursor.get(item.mediaId) ?? 0;
        if (sourceStart >= mediaLen - minDuration) {
          sourceStart = 0;
        }
        const remaining = Math.max(minDuration, mediaLen - sourceStart);
        // Still never exceed the beat gap on the timeline.
        duration = Math.min(gap, remaining);
        cursor.set(item.mediaId, sourceStart + duration);
      } else {
        // Window always starts at 0; clamp only if the file is shorter than the gap.
        duration = Math.min(gap, mediaLen);
        sourceStart = 0;
      }
    }

    placements.push({
      mediaId: item.mediaId,
      start,
      duration,
      ...(item.kind === "video" ? { sourceStart } : {}),
    });
  }

  return placements;
}

/**
 * Max source in-point so a clip of `timelineDuration` still fits in the media.
 */
export function maxSourceStart(
  mediaDuration: number | null | undefined,
  timelineDuration: number,
  speed = 1,
): number {
  if (!mediaDuration || mediaDuration <= 0 || timelineDuration <= 0) return 0;
  const needed = timelineDuration * (speed > 0 ? speed : 1);
  return Math.max(0, mediaDuration - needed);
}
