import { describe, expect, test } from "vitest";

import { VISUALIZER_LAYOUTS, VISUALIZER_PRESETS } from "./musicVisualizer";

describe("musicVisualizer", () => {
  test("exposes particle / kaleidoscope presets and adaptive layouts", () => {
    expect(VISUALIZER_PRESETS.map((p) => p.id)).toEqual([
      "particles",
      "radialPulse",
      "kaleidoscope",
      "lissajous",
      "orbit",
    ]);
    expect(VISUALIZER_LAYOUTS.map((l) => l.id)).toEqual([
      "center",
      "corners",
      "fractal",
    ]);
  });

  test("every preset has a label key and description", () => {
    for (const preset of VISUALIZER_PRESETS) {
      expect(preset.labelKey.startsWith("beatsPanel.")).toBe(true);
      expect(preset.description.length).toBeGreaterThan(8);
    }
    for (const layout of VISUALIZER_LAYOUTS) {
      expect(layout.labelKey.startsWith("beatsPanel.")).toBe(true);
    }
  });
});
