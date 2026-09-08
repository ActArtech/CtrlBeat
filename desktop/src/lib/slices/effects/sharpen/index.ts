/**
 * Effect slice: sharpen
 * @see manifest.json
 */
import type { EffectDefinition } from "../../types";
import {
  times,
  t,
} from "../../shared";

const definition: EffectDefinition = {
    id: "sharpen",
    get label() { return t("effects.sharpen.label"); },
    category: "basic",
    get blurb() { return t("effects.sharpen.blurb"); },
    swatch: "linear-gradient(135deg, #cfd8dc 0%, #607d8b 55%, #263238 100%)",
    params: [
      { key: "amount", get label() { return t("effects.sharpen.param.amount"); }, min: 0.2, max: 3, step: 0.1, default: 1, format: times },
    ],
    chain: ({ amount = 1 }) => `unsharp=5:5:${amount.toFixed(2)}:5:5:0`,
    preview: {
      kind: "svg",
      // An unsharp kernel: edges subtract, the centre compensates, sum one.
      build: ({ amount = 1 }) => {
        const a = (amount * 0.55).toFixed(3);
        const c = (1 + amount * 0.55 * 4).toFixed(3);
        return `<feConvolveMatrix order="3" divisor="1" preserveAlpha="true" kernelMatrix="0 -${a} 0 -${a} ${c} -${a} 0 -${a} 0"/>`;
      },
    },
};

export default definition;
