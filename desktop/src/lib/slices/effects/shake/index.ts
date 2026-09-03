/**
 * Effect slice: shake
 * @see manifest.json
 */
import type { EffectDefinition } from "../../types";
import {
  pixels,
  times,
  t,
} from "../../shared";

const definition: EffectDefinition = {
    id: "shake",
    get label() { return t("effects.shake.label"); },
    category: "distort",
    get blurb() { return t("effects.shake.blurb"); },
    swatch: "linear-gradient(105deg, #ffc9c9 0%, #ff8787 40%, #fa5252 60%, #ffc9c9 100%)",
    params: [
      { key: "amount", get label() { return t("effects.shake.param.amount"); }, min: 2, max: 40, step: 1, default: 12, format: pixels },
      { key: "speed", get label() { return t("effects.shake.param.speed"); }, min: 2, max: 30, step: 1, default: 13, format: times },
    ],
    // A jittering crop window; the decoder's guard scale stretches the
    // slightly smaller window back to full size afterwards.
    chain: ({ amount = 12, speed = 13 }) => {
      const a = Math.round(amount);
      const f = Math.round(speed);
      return (
        `crop=iw-${2 * a}:ih-${2 * a}` +
        `:${a}+${a}*sin(t*${f}):${a}+${a}*cos(t*${Math.round(f * 1.3)})`
      );
    },
    preview: { kind: "jitter" },
};

export default definition;
