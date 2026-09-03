import { describe, expect, test } from "vitest";

import { beatPulseIntensity, pulsedDensity, pulsedGridSize } from "./beatPulse";

describe("beatPulseIntensity", () => {
  test("peaks on a beat and falls off", () => {
    const beats = [0, 1, 2];
    expect(beatPulseIntensity(1, beats, 0.12)).toBeCloseTo(1, 5);
    expect(beatPulseIntensity(1.12, beats, 0.12)).toBeLessThan(0.6);
    expect(beatPulseIntensity(1.5, beats, 0.12)).toBeLessThan(0.05);
  });

  test("empty beats yield zero", () => {
    expect(beatPulseIntensity(1, [], 0.12)).toBe(0);
  });
});

describe("pulse helpers", () => {
  test("grid shrinks and density rises on the beat", () => {
    expect(pulsedGridSize(14, 1)).toBeLessThan(pulsedGridSize(14, 0));
    expect(pulsedDensity(0.35, 1)).toBeGreaterThan(pulsedDensity(0.35, 0));
  });
});
