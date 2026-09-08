import { describe, expect, test } from "vitest";

import { beatIndexNear, mediaBeatsToTimeline, snapToNearest } from "./beatTimeline";

describe("mediaBeatsToTimeline", () => {
  test("offsets media beats by the clip start and sourceStart", () => {
    const times = mediaBeatsToTimeline([0, 1, 2], {
      start: 5,
      sourceStart: 0,
      speed: 1,
      duration: 10,
    });
    expect(times).toEqual([5, 6, 7]);
  });

  test("accounts for sourceStart and speed", () => {
    const times = mediaBeatsToTimeline([2, 4], {
      start: 1,
      sourceStart: 2,
      speed: 2,
      duration: 5,
    });
    // (2-2)/2 = 0 -> 1; (4-2)/2 = 1 -> 2
    expect(times).toEqual([1, 2]);
  });

  test("drops beats outside the clip span without mediaDuration", () => {
    const times = mediaBeatsToTimeline([0, 5, 20], {
      start: 0,
      sourceStart: 0,
      speed: 1,
      duration: 10,
    });
    expect(times).toEqual([0, 5]);
  });

  test("keeps full-media beats when mediaDuration exceeds a short trim", () => {
    const times = mediaBeatsToTimeline([0, 5, 12, 20], {
      start: 2,
      sourceStart: 0,
      speed: 1,
      duration: 8,
    }, 25);
    expect(times).toEqual([2, 7, 14, 22]);
  });
});

describe("snapToNearest", () => {
  test("snaps within threshold", () => {
    expect(snapToNearest(1.04, [0, 1, 2], 0.1)).toBe(1);
    expect(snapToNearest(1.2, [0, 1, 2], 0.1)).toBe(1.2);
  });
});

describe("beatIndexNear", () => {
  test("finds the nearest beat in pixel space", () => {
    expect(beatIndexNear(1.01, [0, 1, 2], 0.01, 6)).toBe(1);
    expect(beatIndexNear(5, [0, 1, 2], 0.01, 6)).toBe(-1);
  });
});
