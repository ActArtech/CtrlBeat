import { describe, expect, test } from "vitest";

import {
  beatsPerImageStep,
  maxSourceStart,
  planBeatPlacement,
  planMediaOnBeats,
  selectBeatTimes,
} from "./beatPlacement";

describe("planBeatPlacement", () => {
  test("aligns clip starts to successive beats with gap durations", () => {
    const placements = planBeatPlacement(
      ["m1", "m2", "m3"],
      [0, 1, 2, 3.5],
      { lastDuration: 5 },
    );
    expect(placements).toEqual([
      { mediaId: "m1", start: 0, duration: 1 },
      { mediaId: "m2", start: 1, duration: 1 },
      { mediaId: "m3", start: 2, duration: 1.5 },
    ]);
  });

  test("beatsPerImage 3 places on every third beat", () => {
    const placements = planBeatPlacement(
      ["a", "b"],
      [0, 0.5, 1, 1.5, 2, 2.5, 3],
      { beatsPerImage: 3, lastDuration: 4 },
    );
    expect(placements.map((p) => p.start)).toEqual([0, 1.5]);
    expect(placements[0]?.mediaId).toBe("a");
    expect(placements[1]?.mediaId).toBe("b");
  });

  test("legacy beatSkip still works", () => {
    const placements = planBeatPlacement(
      ["a", "b", "c"],
      [0, 0.5, 1, 1.5, 2, 2.5],
      { beatSkip: 1, lastDuration: 4 },
    );
    expect(placements.map((p) => p.start)).toEqual([0, 1, 2]);
    expect(placements[2]?.duration).toBe(4);
  });

  test("loopImages cycles media until beats run out", () => {
    const placements = planBeatPlacement(
      ["a", "b"],
      [0, 1, 2, 3, 4],
      { beatsPerImage: 1, loopImages: true, lastDuration: 1 },
    );
    expect(placements.map((p) => p.mediaId)).toEqual(["a", "b", "a", "b", "a"]);
    expect(placements.map((p) => p.start)).toEqual([0, 1, 2, 3, 4]);
    expect(placements[4]?.duration).toBe(1);
  });

  test("loopImages respects endTime so the song length caps the run", () => {
    const placements = planBeatPlacement(
      ["a", "b"],
      [0, 1, 2, 3, 4, 5],
      { loopImages: true, endTime: 3.5, lastDuration: 5 },
    );
    expect(placements.map((p) => p.start)).toEqual([0, 1, 2, 3]);
    expect(placements[3]?.duration).toBeCloseTo(0.5, 5);
  });

  test("stops at the shorter of images or beats without loop", () => {
    expect(planBeatPlacement(["m1"], [0, 1, 2])).toEqual([
      { mediaId: "m1", start: 0, duration: 1 },
    ]);
    expect(planBeatPlacement(["m1", "m2", "m3"], [0, 1])).toHaveLength(2);
  });

  test("empty selection or no beats is a no-op plan", () => {
    expect(planBeatPlacement([], [0, 1])).toEqual([]);
    expect(planBeatPlacement(["m1"], [])).toEqual([]);
  });
});

describe("selectBeatTimes", () => {
  test("sorts and steps with beatsPerImage options", () => {
    expect(selectBeatTimes([2, 0, 1], 0)).toEqual([0, 1, 2]);
    expect(selectBeatTimes([0, 1, 2, 3], { beatsPerImage: 3 })).toEqual([0, 3]);
    expect(beatsPerImageStep({ beatsPerImage: 3 })).toBe(3);
    expect(beatsPerImageStep({ beatSkip: 2 })).toBe(3);
  });
});

describe("planMediaOnBeats", () => {
  test("video slots never exceed the beat gap (no overlap)", () => {
    const placements = planMediaOnBeats(
      [{ mediaId: "v1", kind: "video", mediaDuration: 120 }],
      [0, 1, 2, 3],
      { loopImages: true, progressVideos: false, lastDuration: 1 },
    );
    expect(placements.every((p) => p.duration === 1)).toBe(true);
    expect(placements.every((p) => p.sourceStart === 0)).toBe(true);
    // Abutting, not overlapping.
    for (let i = 1; i < placements.length; i++) {
      expect(placements[i]!.start).toBe(
        placements[i - 1]!.start + placements[i - 1]!.duration,
      );
    }
  });

  test("progressVideos advances sourceStart across gaps", () => {
    const placements = planMediaOnBeats(
      [{ mediaId: "v1", kind: "video", mediaDuration: 10 }],
      [0, 1, 2, 3],
      { loopImages: true, progressVideos: true, lastDuration: 1 },
    );
    expect(placements).toEqual([
      { mediaId: "v1", start: 0, duration: 1, sourceStart: 0 },
      { mediaId: "v1", start: 1, duration: 1, sourceStart: 1 },
      { mediaId: "v1", start: 2, duration: 1, sourceStart: 2 },
      { mediaId: "v1", start: 3, duration: 1, sourceStart: 3 },
    ]);
  });

  test("clamps video duration when file is shorter than the gap", () => {
    const placements = planMediaOnBeats(
      [{ mediaId: "v1", kind: "video", mediaDuration: 0.5 }],
      [0, 2],
      { lastDuration: 5 },
    );
    expect(placements[0]).toEqual({
      mediaId: "v1",
      start: 0,
      duration: 0.5,
      sourceStart: 0,
    });
  });

  test("maxSourceStart leaves room for the beat-gap window", () => {
    expect(maxSourceStart(10, 2)).toBe(8);
    expect(maxSourceStart(1, 2)).toBe(0);
    expect(maxSourceStart(null, 2)).toBe(0);
  });
});
