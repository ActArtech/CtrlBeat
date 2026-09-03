/**
 * Effect slice: black-white
 * @see manifest.json
 */
import type { EffectDefinition } from "../../types";
import {
  t,
} from "../../shared";

const definition: EffectDefinition = {
    id: "black-white",
    get label() { return t("effects.black-white.label"); },
    category: "basic",
    get blurb() { return t("effects.black-white.blurb"); },
    swatch: "linear-gradient(135deg, #e8e8e8 0%, #6b6b6b 55%, #1c1c1c 100%)",
    params: [],
    chain: () => "hue=s=0",
    preview: { kind: "css", filter: () => "grayscale(1)" },
};

export default definition;
