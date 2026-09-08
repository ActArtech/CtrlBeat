import { describe, expect, test } from "vitest";

import { detectBeatsFromPcm, syntheticPulsePcm } from "./beatDetection";

describe("detectBeatsFromPcm", () => {
  test("returns ordered beat times at synthetic pulse locations", () => {
    const sampleRate = 44100;
    const pulses = [0.5, 1.0, 1.5, 2.0, 2.5];
    const pcm = syntheticPulsePcm(pulses, sampleRate, 3.0, 0.04);

    const beats = detectBeatsFromPcm(pcm, sampleRate, {
      sensitivity: 1,
      energyThreshold: 0.2,
      minBeatInterval: 0.2,
      windowSeconds: 0.05,
      strategy: "all-frequencies",
    });

    expect(beats.length).toBeGreaterThanOrEqual(pulses.length);
    for (const pulse of pulses) {
      const nearest = beats.reduce(
        (best, beat) =>
          Math.abs(beat.time - pulse) < Math.abs(best - pulse) ? beat.time : best,
        beats[0].time,
      );
      expect(Math.abs(nearest - pulse)).toBeLessThan(0.06);
    }

    for (let i = 1; i < beats.length; i++) {
      expect(beats[i].time).toBeGreaterThanOrEqual(beats[i - 1].time);
    }
  });

  test("is deterministic for the same buffer and settings", () => {
    const sampleRate = 22050;
    const pcm = syntheticPulsePcm([0.4, 0.8, 1.2], sampleRate, 2.0);
    const settings = {
      sensitivity: 1.2,
      energyThreshold: 0.1,
      minBeatInterval: 0.2,
      strategy: "all-frequencies" as const,
    };
    const a = detectBeatsFromPcm(pcm, sampleRate, settings);
    const b = detectBeatsFromPcm(pcm, sampleRate, settings);
    expect(a).toEqual(b);
  });

  test("empty or invalid input yields no beats", () => {
    expect(detectBeatsFromPcm(new Float32Array(0), 44100)).toEqual([]);
    expect(detectBeatsFromPcm(new Float32Array(1000), 0)).toEqual([]);
  });
});
