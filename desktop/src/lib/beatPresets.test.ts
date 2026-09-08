import { describe, expect, test } from "vitest";

import { detectBeatsFromPcm, syntheticPulsePcm } from "./beatDetection";
import { BEAT_PRESETS, beatPresetById } from "./beatPresets";

describe("beat presets", () => {
  test("exposes four selectable presets", () => {
    expect(BEAT_PRESETS.map((preset) => preset.id)).toEqual([
      "balanced",
      "bass",
      "piano",
      "dense",
    ]);
  });

  test("dense finds at least as many pulses as piano on the same fixture", () => {
    const sampleRate = 22050;
    const pulses = [0.3, 0.6, 0.9, 1.2, 1.5, 1.8, 2.1, 2.4];
    const pcm = syntheticPulsePcm(pulses, sampleRate, 3.0, 0.03);
    const dense = detectBeatsFromPcm(pcm, sampleRate, beatPresetById("dense").settings);
    const piano = detectBeatsFromPcm(pcm, sampleRate, beatPresetById("piano").settings);
    expect(dense.length).toBeGreaterThanOrEqual(piano.length);
  });

  test("detection walks a long buffer past the first 8 seconds", () => {
    const sampleRate = 8000;
    // Pulses only in the later half of a 20s buffer - the old smoother /
    // absolute gate combo often stopped around the loud intro.
    const pulses = [10, 11, 12, 13, 14, 15, 16, 17, 18];
    const pcm = syntheticPulsePcm(pulses, sampleRate, 20, 0.04);
    const beats = detectBeatsFromPcm(pcm, sampleRate, beatPresetById("piano").settings);
    expect(beats.length).toBeGreaterThanOrEqual(6);
    expect(beats[beats.length - 1].time).toBeGreaterThan(15);
  });

  test("beatPresetById falls back to balanced", () => {
    expect(beatPresetById("balanced").id).toBe("balanced");
    expect(beatPresetById("nope" as never).id).toBe("balanced");
  });
});
