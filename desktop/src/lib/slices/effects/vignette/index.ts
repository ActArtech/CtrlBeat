/**
 * Effect slice: vignette
 * @see manifest.json
 */
import type { EffectDefinition } from "../../types";
import {
  percent,
  t,
} from "../../shared";

const definition: EffectDefinition = {
    id: "vignette",
    get label() { return t("effects.vignette.label"); },
    category: "stylize",
    get blurb() { return t("effects.vignette.blurb"); },
    swatch: "radial-gradient(circle at 50% 50%, #ced4da 0%, #495057 60%, #16191c 100%)",
    params: [
      { key: "strength", get label() { return t("effects.vignette.param.strength"); }, min: 10, max: 100, step: 1, default: 50, format: percent },
    ],
    // The filter's angle runs 0..PI/2, wider being darker corners; the slider
    // maps into the range that reads as a vignette rather than a tunnel.
    chain: ({ strength = 50 }) =>
      `vignette=angle=${(0.25 + (strength / 100) * 1.05).toFixed(3)}`,
    preview: {
      kind: "overlay",
      style: ({ strength = 50 }) => ({
        background: `radial-gradient(ellipse at center, transparent ${Math.round(
          72 - strength * 0.45,
        )}%, rgba(0,0,0,${(0.35 + strength * 0.006).toFixed(3)}) 100%)`,
      }),
    },
};

export default definition;
