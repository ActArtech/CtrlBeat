/**
 * Build-time registry of effect / transition slices.
 *
 * Each package lives under `slices/effects/<id>` or `slices/transitions/<id>`.
 * Adding a catalogue entry = add a folder + import it here (and mirror the
 * FFmpeg chain in wolfcut-export chains.rs until Phase 2 codegen).
 *
 * A filesystem test asserts every folder is listed below.
 */
import type { EffectDefinition, TransitionDefinition } from "./types";

import black_white from "./effects/black-white";
import sepia from "./effects/sepia";
import invert from "./effects/invert";
import sharpen from "./effects/sharpen";
import gaussian_blur from "./effects/gaussian-blur";
import box_blur from "./effects/box-blur";
import motion_blur from "./effects/motion-blur";
import warm from "./effects/warm";
import cool from "./effects/cool";
import vibrance from "./effects/vibrance";
import contrast_pop from "./effects/contrast-pop";
import vignette from "./effects/vignette";
import film_grain from "./effects/film-grain";
import glow from "./effects/glow";
import posterize from "./effects/posterize";
import pixelate from "./effects/pixelate";
import mirror from "./effects/mirror";
import fisheye from "./effects/fisheye";
import shake from "./effects/shake";

import t_cross_fade from "./transitions/cross-fade";
import t_fade_black from "./transitions/fade-black";
import t_fade_white from "./transitions/fade-white";
import t_wipe_left from "./transitions/wipe-left";
import t_wipe_right from "./transitions/wipe-right";
import t_push from "./transitions/push";
import t_zoom from "./transitions/zoom";

export const EFFECT_SLICES: EffectDefinition[] = [
  black_white,
  sepia,
  invert,
  sharpen,
  gaussian_blur,
  box_blur,
  motion_blur,
  warm,
  cool,
  vibrance,
  contrast_pop,
  vignette,
  film_grain,
  glow,
  posterize,
  pixelate,
  mirror,
  fisheye,
  shake,
];

export const TRANSITION_SLICES: TransitionDefinition[] = [
  t_cross_fade,
  t_fade_black,
  t_fade_white,
  t_wipe_left,
  t_wipe_right,
  t_push,
  t_zoom,
];

export function registeredEffectIds(): string[] {
  return EFFECT_SLICES.map((effect) => effect.id);
}

export function registeredTransitionIds(): string[] {
  return TRANSITION_SLICES.map((transition) => transition.id);
}
