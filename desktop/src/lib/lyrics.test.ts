/**
 * Pins for the lyrics-on-beats planner: word splitting, grouping, the beat
 * step, and the edges - last group's hold, words left over, empty inputs.
 */

import { describe, expect, test } from "vitest";

import { planLyricsOnBeats, splitLyricWords } from "./lyrics";

describe("splitLyricWords", () => {
  test("breaks on any whitespace, dropping empties", () => {
    expect(splitLyricWords("  one   two\nthree\tfour  ")).toEqual([
      "one",
      "two",
      "three",
      "four",
    ]);
  });

  test("a lyric sheet pasted with line breaks is just words", () => {
    expect(splitLyricWords("la la la\nla la la\n\nla")).toHaveLength(7);
  });

  test("empty and blank-only text is no words", () => {
    expect(splitLyricWords("")).toEqual([]);
    expect(splitLyricWords(" \n\t ")).toEqual([]);
  });
});

describe("planLyricsOnBeats", () => {
  const beats = [0, 1, 2, 3, 4, 5];

  test("one word per beat, each holding to the next", () => {
    const placements = planLyricsOnBeats("a b c", beats);
    expect(placements).toEqual([
      { text: "a", start: 0, duration: 1 },
      { text: "b", start: 1, duration: 1 },
      { text: "c", start: 2, duration: 1 },
    ]);
  });

  test("couples: two words land on each beat together", () => {
    const placements = planLyricsOnBeats("one two three four", beats, { wordsPerGroup: 2 });
    expect(placements.map((clip) => clip.text)).toEqual(["one two", "three four"]);
    expect(placements[1]).toEqual({ text: "three four", start: 1, duration: 1 });
  });

  test("a beat step spreads groups every N-th beat", () => {
    const placements = planLyricsOnBeats("a b c", beats, { beatsPerGroup: 2 });
    expect(placements.map((clip) => clip.start)).toEqual([0, 2, 4]);
    // Each group holds across the beat it skipped, not just its own.
    expect(placements[0]!.duration).toBeCloseTo(2, 10);
  });

  test("a group on the last beat holds to the song end when given", () => {
    const placements = planLyricsOnBeats("a b c d e f", beats, { endTime: 10 });
    expect(placements.at(-1)).toEqual({ text: "f", start: 5, duration: 5 });
  });

  test("a short lyric still holds its beat gap, not a tail", () => {
    const placements = planLyricsOnBeats("a b", beats);
    expect(placements.at(-1)).toEqual({ text: "b", start: 1, duration: 1 });
  });

  test("without a song end, a group on the last beat holds a short tail", () => {
    const placements = planLyricsOnBeats("a b c d e f", beats);
    expect(placements.at(-1)!.duration).toBeCloseTo(2, 10);
  });

  test("more words than beats stops at the last beat", () => {
    const placements = planLyricsOnBeats("a b c d e f g h", [0, 1, 2]);
    expect(placements).toHaveLength(3);
    expect(placements.at(-1)!.text).toBe("c");
  });

  test("fewer words than beats leaves the later beats alone", () => {
    const placements = planLyricsOnBeats("a", beats);
    expect(placements).toEqual([{ text: "a", start: 0, duration: 1 }]);
  });

  test("no words or no beats plans nothing", () => {
    expect(planLyricsOnBeats("", beats)).toEqual([]);
    expect(planLyricsOnBeats("a b", [])).toEqual([]);
  });
});
