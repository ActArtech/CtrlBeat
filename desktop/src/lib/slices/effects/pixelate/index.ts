/**
 * Effect slice: pixelate
 * @see manifest.json
 */
import type { EffectDefinition } from "../../types";
import {
  pixels,
  t,
} from "../../shared";

const definition: EffectDefinition = {
    id: "pixelate",
    get label() { return t("effects.pixelate.label"); },
    category: "distort",
    get blurb() { return t("effects.pixelate.blurb"); },
    swatch:
      "repeating-linear-gradient(0deg, #74c0fc 0 6px, #4dabf7 6px 12px), repeating-linear-gradient(90deg, #74c0fc80 0 6px, #4dabf780 6px 12px)",
    params: [
      { key: "size", get label() { return t("effects.pixelate.param.size"); }, min: 2, max: 64, step: 1, default: 16, format: pixels },
    ],
    chain: ({ size = 16 }) =>
      `pixelize=width=${Math.round(size)}:height=${Math.round(size)}`,
    preview: { kind: "pixelate" },
};

export default definition;
