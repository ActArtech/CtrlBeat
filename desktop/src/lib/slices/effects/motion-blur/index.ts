/**
 * Effect slice: motion-blur
 * @see manifest.json
 */
import type { EffectDefinition } from "../../types";
import {
  pixels,
  t,
} from "../../shared";

const definition: EffectDefinition = {
    id: "motion-blur",
    get label() { return t("effects.motion-blur.label"); },
    category: "blur",
    get blurb() { return t("effects.motion-blur.blurb"); },
    swatch: "linear-gradient(90deg, #91a7ff 0%, #5c7cfa 45%, #91a7ff 100%)",
    params: [
      { key: "length", get label() { return t("effects.motion-blur.param.length"); }, min: 2, max: 60, step: 1, default: 18, format: pixels },
    ],
    // Gaussian in one axis only is the streak; the tiny vertical sigma keeps
    // the filter happy without visibly blurring that axis.
    chain: ({ length = 18 }) => `gblur=sigma=${length.toFixed(1)}:sigmaV=0.1`,
    preview: {
      kind: "svg",
      // The same one-axis gaussian, which SVG spells as two deviations.
      build: ({ length = 18 }, scale) =>
        `<feGaussianBlur stdDeviation="${(length * scale).toFixed(2)} 0.01"/>`,
    },
};

export default definition;
