/**
 * Effect slice: mirror
 * @see manifest.json
 */
import type { EffectDefinition } from "../../types";
import {
  t,
} from "../../shared";

const definition: EffectDefinition = {
    id: "mirror",
    get label() { return t("effects.mirror.label"); },
    category: "distort",
    get blurb() { return t("effects.mirror.blurb"); },
    swatch: "linear-gradient(90deg, #63e6be 0%, #0ca678 50%, #63e6be 100%)",
    params: [],
    chain: (_params, index) =>
      `crop=iw/2:ih:0:0,split[mirl${index}][mirr${index}];[mirr${index}]hflip[mirf${index}];` +
      `[mirl${index}][mirf${index}]hstack`,
    preview: { kind: "mirror" },
};

export default definition;
