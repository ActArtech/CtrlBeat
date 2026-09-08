/**
 * Effect slice: contrast-pop
 * @see manifest.json
 */
import type { EffectDefinition } from "../../types";
import {
  times,
  t,
} from "../../shared";

const definition: EffectDefinition = {
    id: "contrast-pop",
    get label() { return t("effects.contrast-pop.label"); },
    category: "color",
    get blurb() { return t("effects.contrast-pop.blurb"); },
    swatch: "linear-gradient(135deg, #f8f9fa 0%, #868e96 45%, #212529 100%)",
    params: [
      { key: "contrast", get label() { return t("effects.contrast-pop.param.contrast"); }, min: 1, max: 2, step: 0.05, default: 1.25, format: times },
    ],
    chain: ({ contrast = 1.25 }) => `eq=contrast=${contrast.toFixed(2)}`,
    preview: { kind: "css", filter: ({ contrast = 1.25 }) => `contrast(${contrast.toFixed(2)})` },
};

export default definition;
