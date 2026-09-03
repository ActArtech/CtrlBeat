import { describe, expect, test } from "vitest";

import { detectBeatsFromPcm, syntheticPulsePcm } from "./beatDetection";
import { planBeatPlacement } from "./beatPlacement";
import type { Command } from "./generated/Command";

/**
 * End-to-end of the shipped planning path the UI uses before dispatch:
 * PCM -> beats -> placements -> placeImageClips command payload.
 */
describe("beat slideshow workflow", () => {
  test("builds a placeImageClips command from detected beats and image ids", () => {
    const sampleRate = 22050;
    const pulses = [0, 1, 2, 3];
    const pcm = syntheticPulsePcm(pulses, sampleRate, 4.0, 0.04);
    const beats = detectBeatsFromPcm(pcm, sampleRate, {
      strategy: "all-frequencies",
      energyThreshold: 0.2,
      minBeatInterval: 0.2,
      windowSeconds: 0.05,
    });
    const times = beats.map((beat) => beat.time);
    const mediaIds = ["m-img-1", "m-img-2", "m-img-3"];
    const placements = planBeatPlacement(mediaIds, times, {
      beatsPerImage: 1,
      loopImages: false,
      lastDuration: 5,
    });

    expect(placements.length).toBe(3);
    expect(placements[0]?.mediaId).toBe("m-img-1");
    expect(placements[0]?.start).toBeLessThan(0.1);

    const command: Command = {
      op: "placeImageClips",
      placements,
      trackId: null,
    };
    expect(command.op).toBe("placeImageClips");
    if (command.op === "placeImageClips") {
      expect(command.placements).toEqual(placements);
      expect(command.placements.every((p) => p.duration > 0)).toBe(true);
    }
  });

  test("no beats or no images yields no command work", () => {
    expect(planBeatPlacement(["m1"], [])).toEqual([]);
    expect(planBeatPlacement([], [0, 1])).toEqual([]);
  });
});
