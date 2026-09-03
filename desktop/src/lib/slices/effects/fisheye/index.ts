/**
 * Effect slice: fisheye
 * @see manifest.json
 */
import type { EffectDefinition } from "../../types";
import {
  percent,
  t,
} from "../../shared";

const definition: EffectDefinition = {
    id: "fisheye",
    get label() { return t("effects.fisheye.label"); },
    category: "distort",
    get blurb() { return t("effects.fisheye.blurb"); },
    swatch: "radial-gradient(circle at 50% 50%, #d0bfff 0%, #9775fa 55%, #5f3dc4 100%)",
    params: [
      { key: "strength", get label() { return t("effects.fisheye.param.strength"); }, min: 5, max: 100, step: 1, default: 50, format: percent },
    ],
    // Negative correction coefficients produce barrel distortion - the bulge.
    chain: ({ strength = 50 }) => {
      const k = strength / 100;
      return `lenscorrection=k1=${(-0.55 * k).toFixed(3)}:k2=${(-0.2 * k).toFixed(3)}:i=bilinear`;
    },
    preview: { kind: "fisheye" },
};

export default definition;
