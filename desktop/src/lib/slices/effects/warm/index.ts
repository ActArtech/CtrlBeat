/**
 * Effect slice: warm
 * @see manifest.json
 */
import type { EffectDefinition } from "../../types";
import {
  kelvin,
  temperatureMatrix,
  t,
} from "../../shared";

const definition: EffectDefinition = {
    id: "warm",
    get label() { return t("effects.warm.label"); },
    category: "color",
    get blurb() { return t("effects.warm.blurb"); },
    swatch: "linear-gradient(135deg, #ffd8a8 0%, #ff922b 55%, #d9480f 100%)",
    params: [
      {
        key: "temperature",
        get label() { return t("effects.warm.param.temperature"); },
        min: 3000,
        max: 6000,
        step: 100,
        default: 4600,
        format: kelvin,
      },
    ],
    chain: ({ temperature = 4600 }) =>
      `colortemperature=temperature=${Math.round(temperature)}`,
    preview: { kind: "svg", build: ({ temperature = 4600 }) => temperatureMatrix(temperature) },
};

export default definition;
