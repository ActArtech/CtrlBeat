/**
 * Effect slice: invert
 * @see manifest.json
 */
import type { EffectDefinition } from "../../types";
import {
  t,
} from "../../shared";

const definition: EffectDefinition = {
    id: "invert",
    get label() { return t("effects.invert.label"); },
    category: "basic",
    get blurb() { return t("effects.invert.blurb"); },
    swatch: "linear-gradient(135deg, #00d0ff 0%, #7a00c8 55%, #ffe600 100%)",
    params: [],
    chain: () => "negate",
    preview: { kind: "css", filter: () => "invert(1)" },
};

export default definition;
