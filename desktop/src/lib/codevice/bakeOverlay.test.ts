/**
 * Planner pins for the overlay bake: the span edges, the frame-rate budget
 * and the frame tiling. These are the numbers a bake commits to before any
 * rendering starts, so a regression here costs minutes, not milliseconds.
 */

import { describe, expect, test } from "vitest";

import {
  BAKE_FRAME_BUDGET,
  MIN_BAKE_FPS,
  bakeFileKey,
  bakeFrameCount,
  bakeFrameRate,
  bakeFrameTimes,
  bakeSize,
  bakeSpan,
  estimateBakeSeconds,
} from "./bakeOverlay";

describe("bakeSpan", () => {
  test("runs from the first used beat to the audio end", () => {
    expect(bakeSpan([1, 2, 3, 4], 6)).toEqual({ start: 1, end: 6 });
  });

  test("falls back to a tail past the last beat when there is no end cap", () => {
    expect(bakeSpan([2, 4], undefined)).toEqual({ start: 2, end: 9 });
    expect(bakeSpan([2, 4], Number.POSITIVE_INFINITY)).toEqual({ start: 2, end: 9 });
  });

  test("ignores an end cap at or before the start", () => {
    expect(bakeSpan([3, 4], 3)).toEqual({ start: 3, end: 9 });
    expect(bakeSpan([3, 4], 1)).toEqual({ start: 3, end: 9 });
  });

  test("refuses an empty beat list or a degenerate span", () => {
    expect(bakeSpan([], 10)).toBeNull();
  });
});

describe("bakeFrameRate", () => {
  test("gives each kind its full rate inside the budget", () => {
    // 3000 frames at 30fps, 1200 at 12: both well under the budget.
    expect(bakeFrameRate("visualizer", 100)).toBe(30);
    expect(bakeFrameRate("symbols", 100)).toBe(30);
    expect(bakeFrameRate("asciiVideo", 100)).toBe(12);
  });

  test("spends the budget down on long spans but never below the floor", () => {
    // Budget: 12000 / 600 = 20fps for a ten-minute mix.
    expect(bakeFrameRate("visualizer", 600)).toBe(20);
    // An hour-long set clamps to the floor rather than a slideshow.
    expect(bakeFrameRate("visualizer", 3600)).toBe(MIN_BAKE_FPS);
  });

  test("never exceeds the budget even for ascii-on-video", () => {
    expect(bakeFrameRate("asciiVideo", 600)).toBe(12);
  });

  test("treats a requested rate as a ceiling, never an override", () => {
    // Asking 30 on ASCII-on-video means its own 12.
    expect(bakeFrameRate("asciiVideo", 100, 30)).toBe(12);
    // Asking less than the kind's ceiling is honoured inside the budget.
    expect(bakeFrameRate("visualizer", 100, 24)).toBe(24);
    expect(bakeFrameRate("visualizer", 100, 12)).toBe(12);
    // The budget still clips a request on a long span.
    expect(bakeFrameRate("visualizer", 600, 30)).toBe(20);
  });
});

describe("bakeFrameCount + estimateBakeSeconds", () => {
  test("counts frames without materialising times", () => {
    expect(bakeFrameCount({ start: 0, end: 10 }, 30)).toBe(300);
    expect(bakeFrameCount({ start: 2, end: 2.5 }, 12)).toBe(6);
    expect(bakeFrameCount({ start: 0, end: 0.01 }, 30)).toBe(1);
  });

  test("estimates grow with frames and are honest per kind", () => {
    // Same span costs more as ASCII-on-video than as pure visualizer.
    expect(estimateBakeSeconds("asciiVideo", 100)).toBeGreaterThan(
      estimateBakeSeconds("visualizer", 100),
    );
    // A three-minute visualizer at 30fps lands in minutes, not hours.
    expect(estimateBakeSeconds("visualizer", 5400)).toBeGreaterThanOrEqual(60);
    expect(estimateBakeSeconds("visualizer", 5400)).toBeLessThan(600);
    expect(estimateBakeSeconds("symbols", 0)).toBe(1);
  });
});

describe("bakeFrameTimes", () => {
  test("tiles the span, ending strictly before the end", () => {
    const times = bakeFrameTimes(1, 2, 10);
    expect(times).toHaveLength(10);
    expect(times[0]).toBeCloseTo(1);
    expect(times.at(-1)).toBeCloseTo(1.9);
  });

  test("always renders at least one frame", () => {
    expect(bakeFrameTimes(0, 0.01, 30)).toHaveLength(1);
  });

  test("frames a full-rate three-minute bake within the budget", () => {
    expect(bakeFrameTimes(0, 180, 30).length).toBeLessThanOrEqual(BAKE_FRAME_BUDGET);
  });
});

describe("bakeSize", () => {
  test("keeps an even frame size the encoder accepts", () => {
    expect(bakeSize(1919, 1079)).toEqual({ width: 1918, height: 1078 });
    expect(bakeSize(1920, 1080)).toEqual({ width: 1920, height: 1080 });
  });

  test("caps the long edge but never upscales", () => {
    expect(bakeSize(3840, 2160)).toEqual({ width: 1920, height: 1080 });
    expect(bakeSize(640, 360)).toEqual({ width: 640, height: 360 });
  });

  test("clamps a degenerate frame to something drawable", () => {
    expect(bakeSize(0, 0)).toEqual({ width: 2, height: 2 });
  });
});

describe("bakeFileKey", () => {
  test("is a flat cache filename that follows its settings", () => {
    const key = bakeFileKey("viz", "preset|layout|1|0");
    expect(key).toMatch(/^bake-viz-[0-9a-f]{8}\.mp4$/);
    expect(bakeFileKey("viz", "preset|layout|1|1")).not.toBe(key);
  });
});
