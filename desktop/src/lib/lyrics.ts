/**
 * Pure planner: pasted lyrics + a beat grid -> one text clip per beat gap.
 *
 * The karaoke flow behind "Lyrics on beats" - the text twin of
 * `planMediaOnBeats`, which tiles images across the same grid. Words are
 * bundled into groups, groups step across the used beats exactly the way
 * placed images do (every N-th beat), and each group becomes one clip that
 * holds until the next used beat.
 */

import { selectBeatTimes } from "./beatPlacement";

/** One lyric group, already placed on the timeline. */
export interface LyricPlacement {
  /** The words of this group, joined with single spaces. */
  text: string;
  start: number;
  duration: number;
}

export interface LyricOptions {
  /**
   * Words bundled onto each beat group. 1 is karaoke-strict; 2-3 is the
   * "couple of words" read. Default 1.
   */
  wordsPerGroup?: number;
  /**
   * The beat step between groups - `beatsPerImage` semantics, so 2 means a
   * group every second beat. Default 1.
   */
  beatsPerGroup?: number;
  /**
   * Clip length for the final group when no following beat and no song end
   * is known. Short: an orphaned lyric should not hold the screen.
   */
  lastDuration?: number;
  /** Song / audio end in seconds; with it the final group holds to the end. */
  endTime?: number;
}

/** How long a lyric with nothing after it holds, when even the song end is unknown. */
const DEFAULT_LAST_DURATION = 2.0;
/** Floor for every clip duration (matches engine MIN_CLIP_DURATION). */
const MIN_DURATION = 1 / 60;

/**
 * Splits pasted text into words: any run of whitespace is a break, empties
 * drop out, and newlines count as whitespace - a lyric sheet pasted whole
 * works the same as one pasted per line.
 */
export function splitLyricWords(text: string): string[] {
  return text.split(/\s+/).filter((word) => word.length > 0);
}

/**
 * Groups words and tiles them across the used beats.
 *
 * Words run out before beats: the later beats simply get nothing - lyrics
 * are not looped the way a short image list is. Beats run out before words:
 * the leftover words are the caller's to report (see `splitLyricWords` for
 * the count).
 */
export function planLyricsOnBeats(
  text: string,
  beatTimes: readonly number[],
  options: LyricOptions = {},
): LyricPlacement[] {
  const wordsPerGroup = Math.max(1, Math.floor(options.wordsPerGroup ?? 1));
  const beatsPerGroup = Math.max(1, Math.floor(options.beatsPerGroup ?? 1));
  const lastDuration = options.lastDuration ?? DEFAULT_LAST_DURATION;

  const words = splitLyricWords(text);
  if (words.length === 0) return [];

  const groups: string[] = [];
  for (let index = 0; index < words.length; index += wordsPerGroup) {
    groups.push(words.slice(index, index + wordsPerGroup).join(" "));
  }

  const beats = selectBeatTimes(beatTimes, { beatsPerImage: beatsPerGroup });
  const count = Math.min(groups.length, beats.length);

  const placements: LyricPlacement[] = [];
  for (let index = 0; index < count; index += 1) {
    const start = beats[index]!;
    // To the next used beat whenever one exists - even one no group lands
    // on - so a short lyric still holds its gap and not a tail.
    const next = index + 1 < beats.length ? beats[index + 1] : undefined;
    const fallbackEnd = options.endTime ?? start + lastDuration;
    const duration = Math.max(MIN_DURATION, (next ?? fallbackEnd) - start);
    placements.push({ text: groups[index]!, start, duration });
  }
  return placements;
}
