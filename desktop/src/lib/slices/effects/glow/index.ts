/**
 * Effect slice: glow
 * @see manifest.json
 */
import type { EffectDefinition } from "../../types";
import {
  percent,
  t,
} from "../../shared";

const definition: EffectDefinition = {
    id: "glow",
    get label() { return t("effects.glow.label"); },
    category: "stylize",
    get blurb() { return t("effects.glow.blurb"); },
    swatch: "radial-gradient(circle at 50% 40%, #fff9db 0%, #ffe066 45%, #e8590c 100%)",
    params: [
      { key: "amount", get label() { return t("effects.glow.param.amount"); }, min: 10, max: 100, step: 1, default: 45, format: percent },
    ],
    // Screen-blend a blurred copy over itself - the classic bloom. Labels
    // carry the chain index so two glows cannot collide in one graph.
    chain: ({ amount = 45 }, index) =>
      `split[glowa${index}][glowb${index}];[glowb${index}]gblur=sigma=18[glowg${index}];` +
      `[glowa${index}][glowg${index}]blend=all_mode=screen:all_opacity=${(amount / 100).toFixed(2)}`,
    preview: {
      kind: "svg",
      // The same bloom: blur a copy, weight it, screen it over the source.
      build: ({ amount = 45 }, scale) => {
        const weight = (amount / 100).toFixed(3);
        return (
          `<feGaussianBlur in="SourceGraphic" stdDeviation="${(18 * scale).toFixed(2)}" result="wolfglow-blur"/>` +
          `<feColorMatrix in="wolfglow-blur" type="matrix" values="${weight} 0 0 0 0  0 ${weight} 0 0 0  0 0 ${weight} 0 0  0 0 0 1 0" result="wolfglow-dim"/>` +
          `<feBlend in="SourceGraphic" in2="wolfglow-dim" mode="screen"/>`
        );
      },
    },
};

export default definition;
