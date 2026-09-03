import { describe, expect, test } from "vitest";

import {
  clampScale,
  displayedSize,
  fittedSize,
  scaleToFitHeight,
  scaleToFitWidth,
  scaleToMatchHeight,
  scaleToMatchWidth,
} from "./clipFit";

describe("clipFit", () => {
  const frame = { width: 1920, height: 1080 };

  test("landscape photo contain-fits to height at scale 1", () => {
    const media = { width: 4000, height: 2000 };
    const fitted = fittedSize(media, frame)!;
    // fit = min(1920/4000, 1080/2000) = min(0.48, 0.54) = 0.48
    expect(fitted.fittedWidth).toBeCloseTo(1920, 5);
    expect(fitted.fittedHeight).toBeCloseTo(960, 5);
    expect(scaleToFitWidth(media, frame)).toBeCloseTo(1, 5);
    expect(scaleToFitHeight(media, frame)).toBeCloseTo(1080 / 960, 5);
  });

  test("portrait photo contain-fits to width at scale 1", () => {
    const media = { width: 1000, height: 2000 };
    const fitted = fittedSize(media, frame)!;
    // fit = min(1.92, 0.54) = 0.54
    expect(fitted.fittedWidth).toBeCloseTo(540, 5);
    expect(fitted.fittedHeight).toBeCloseTo(1080, 5);
    expect(scaleToFitHeight(media, frame)).toBeCloseTo(1, 5);
    expect(scaleToFitWidth(media, frame)).toBeCloseTo(1920 / 540, 5);
  });

  test("match width/height uses a target display size", () => {
    const media = { width: 1000, height: 2000 };
    const scaleW = scaleToMatchWidth(media, frame, 800)!;
    const shown = displayedSize(media, frame, scaleW)!;
    expect(shown.fittedWidth).toBeCloseTo(800, 5);

    const scaleH = scaleToMatchHeight(media, frame, 900)!;
    const shownH = displayedSize(media, frame, scaleH)!;
    expect(shownH.fittedHeight).toBeCloseTo(900, 5);
  });

  test("clampScale floors and caps", () => {
    expect(clampScale(0)).toBe(0.05);
    expect(clampScale(100)).toBe(8);
    expect(clampScale(1.5)).toBe(1.5);
  });
});
