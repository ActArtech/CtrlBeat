/**
 * Effect slice: posterize
 * @see manifest.json
 */
import type { EffectDefinition } from "../../types";
import {
  t,
} from "../../shared";

const definition: EffectDefinition = {
    id: "posterize",
    get label() { return t("effects.posterize.label"); },
    category: "stylize",
    get blurb() { return t("effects.posterize.blurb"); },
    swatch:
      "linear-gradient(135deg, #e64980 0%, #e64980 33%, #7950f2 33%, #7950f2 66%, #1098ad 66%, #1098ad 100%)",
    params: [
      { key: "levels", get label() { return t("effects.posterize.param.levels"); }, min: 2, max: 8, step: 1, default: 4, format: (v) => String(Math.round(v)) },
    ],
    chain: ({ levels = 4 }) => {
      const size = Math.round(256 / Math.max(2, Math.round(levels)));
      const band = `trunc(val/${size})*${size}`;
      return `lutrgb=r=${band}:g=${band}:b=${band}`;
    },
    preview: {
      kind: "svg",
      // Discrete transfer with the same band values the lut produces.
      build: ({ levels = 4 }) => {
        const count = Math.max(2, Math.round(levels));
        const size = Math.round(256 / count);
        const table = Array.from({ length: count }, (_, index) =>
          ((index * size) / 255).toFixed(4),
        ).join(" ");
        return (
          `<feComponentTransfer>` +
          `<feFuncR type="discrete" tableValues="${table}"/>` +
          `<feFuncG type="discrete" tableValues="${table}"/>` +
          `<feFuncB type="discrete" tableValues="${table}"/>` +
          `</feComponentTransfer>`
        );
      },
    },
};

export default definition;
