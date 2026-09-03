/**
 * Effect slice: box-blur
 * @see manifest.json
 */
import type { EffectDefinition } from "../../types";
import {
  pixels,
  t,
} from "../../shared";

const definition: EffectDefinition = {
    id: "box-blur",
    get label() { return t("effects.box-blur.label"); },
    category: "blur",
    get blurb() { return t("effects.box-blur.blurb"); },
    swatch: "linear-gradient(135deg, #a5d8ff 0%, #4dabf7 55%, #1971c2 100%)",
    params: [
      { key: "radius", get label() { return t("effects.box-blur.param.radius"); }, min: 1, max: 30, step: 1, default: 6, format: pixels },
    ],
    chain: ({ radius = 6 }) => `boxblur=${Math.round(radius)}:1`,
    preview: { kind: "css", filter: ({ radius = 6 }, scale) => `blur(${(radius * 0.7 * scale).toFixed(2)}px)` },
};

export default definition;
