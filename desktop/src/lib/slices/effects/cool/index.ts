/**
 * Effect slice: cool
 * @see manifest.json
 */
import type { EffectDefinition } from "../../types";
import {
  kelvin,
  temperatureMatrix,
  t,
} from "../../shared";

const definition: EffectDefinition = {
    id: "cool",
    get label() { return t("effects.cool.label"); },
    category: "color",
    get blurb() { return t("effects.cool.blurb"); },
    swatch: "linear-gradient(135deg, #99e9f2 0%, #22b8cf 55%, #0b7285 100%)",
    params: [
      {
        key: "temperature",
        get label() { return t("effects.cool.param.temperature"); },
        min: 7000,
        max: 11000,
        step: 100,
        default: 8500,
        format: kelvin,
      },
    ],
    chain: ({ temperature = 8500 }) =>
      `colortemperature=temperature=${Math.round(temperature)}`,
    preview: { kind: "svg", build: ({ temperature = 8500 }) => temperatureMatrix(temperature) },
};

export default definition;
