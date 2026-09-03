/**
 * Effect slice: sepia
 * @see manifest.json
 */
import type { EffectDefinition } from "../../types";
import {
  t,
} from "../../shared";

const definition: EffectDefinition = {
    id: "sepia",
    get label() { return t("effects.sepia.label"); },
    category: "basic",
    get blurb() { return t("effects.sepia.blurb"); },
    swatch: "linear-gradient(135deg, #e9d3ae 0%, #a9773f 60%, #513a1c 100%)",
    params: [],
    // The standard sepia matrix, the same one the CSS filter defines.
    chain: () =>
      "colorchannelmixer=.393:.769:.189:0:.349:.686:.168:0:.272:.534:.131",
    preview: { kind: "css", filter: () => "sepia(1)" },
};

export default definition;
