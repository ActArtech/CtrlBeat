/**
 * Effect slice: gaussian-blur
 * @see manifest.json
 */
import type { EffectDefinition } from "../../types";
import {
  pixels,
  t,
} from "../../shared";

const definition: EffectDefinition = {
    id: "gaussian-blur",
    get label() { return t("effects.gaussian-blur.label"); },
    category: "blur",
    get blurb() { return t("effects.gaussian-blur.blurb"); },
    swatch: "linear-gradient(135deg, #b3c7f9 0%, #7f9cf5 55%, #4c6ef5 100%)",
    params: [
      { key: "radius", get label() { return t("effects.gaussian-blur.param.radius"); }, min: 1, max: 50, step: 1, default: 10, format: pixels },
    ],
    chain: ({ radius = 10 }) => `gblur=sigma=${radius.toFixed(1)}`,
    preview: { kind: "css", filter: ({ radius = 10 }, scale) => `blur(${(radius * scale).toFixed(2)}px)` },
};

export default definition;
