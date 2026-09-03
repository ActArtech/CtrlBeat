/**
 * Effect slice: film-grain
 * @see manifest.json
 */
import type { EffectDefinition } from "../../types";
import {
  grainDataUri,
  percent,
  t,
} from "../../shared";

const definition: EffectDefinition = {
    id: "film-grain",
    get label() { return t("effects.film-grain.label"); },
    category: "stylize",
    get blurb() { return t("effects.film-grain.blurb"); },
    swatch: "linear-gradient(135deg, #dee2e6 0%, #adb5bd 50%, #495057 100%)",
    params: [
      { key: "amount", get label() { return t("effects.film-grain.param.amount"); }, min: 2, max: 40, step: 1, default: 12, format: percent },
    ],
    // Temporal (t) so the grain dances like film instead of sitting still.
    chain: ({ amount = 12 }) => `noise=alls=${Math.round(amount)}:allf=t+u`,
    preview: {
      kind: "overlay",
      grain: true,
      style: ({ amount = 12 }) => ({
        backgroundImage: `url(${grainDataUri()})`,
        backgroundRepeat: "repeat",
        mixBlendMode: "overlay",
        opacity: Math.min(1, amount / 40),
      }),
    },
};

export default definition;
