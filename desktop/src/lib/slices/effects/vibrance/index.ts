/**
 * Effect slice: vibrance
 * @see manifest.json
 */
import type { EffectDefinition } from "../../types";
import {
  times,
  t,
} from "../../shared";

const definition: EffectDefinition = {
    id: "vibrance",
    get label() { return t("effects.vibrance.label"); },
    category: "color",
    get blurb() { return t("effects.vibrance.blurb"); },
    swatch: "linear-gradient(135deg, #ff6b6b 0%, #fcc419 40%, #51cf66 70%, #339af0 100%)",
    params: [
      { key: "intensity", get label() { return t("effects.vibrance.param.intensity"); }, min: 0.1, max: 2, step: 0.05, default: 0.7, format: times },
    ],
    chain: ({ intensity = 0.7 }) => `vibrance=intensity=${intensity.toFixed(2)}`,
    preview: { kind: "css", filter: ({ intensity = 0.7 }) => `saturate(${(1 + intensity * 0.45).toFixed(2)})` },
};

export default definition;
