import { describe, expect, test } from "vitest";

import { SYMBOL_SETS, symbolSetById } from "./symbolSets";

describe("SYMBOL_SETS", () => {
  test("exposes all 13 codeviceanim presets", () => {
    expect(SYMBOL_SETS).toHaveLength(13);
    expect(SYMBOL_SETS.map((set) => set.id)).toEqual([
      "techMap",
      "greekRunic",
      "mathSymbols",
      "katakanaGlitch",
      "arrowsVectors",
      "emojiGlyphs",
      "boxDrawing",
      "hexCode",
      "classicAscii",
      "matrixBinary",
      "blocksShades",
      "brailleDots",
      "dotsOnly",
    ]);
  });

  test("tech map and greek sets match codeviceanim glyphs", () => {
    expect(symbolSetById("techMap").chars).toContain("●");
    expect(symbolSetById("techMap").chars).toContain("┼");
    expect(symbolSetById("greekRunic").chars).toEqual(
      expect.arrayContaining(["Ω", "Ψ", "Σ", "Δ", "Θ", "λ", "π"]),
    );
    expect(symbolSetById("mathSymbols").chars).toEqual(
      expect.arrayContaining(["∫", "∑", "√", "∞", "≈", "≠", "±"]),
    );
  });
});
