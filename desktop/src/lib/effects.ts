/**
 * The video effect and transition catalogues.
 *
 * Phase 1 slice architecture: each effect/transition lives under
 * `lib/slices/{effects|transitions}/<id>/` and is discovered via
 * `lib/slices/registry.ts`. This module keeps the public API stable for
 * MediaBin, EffectsPanel, Preview, and tests.
 *
 * Export FFmpeg truth is still mirrored in `wolfcut-export` `chains.rs`
 * until Phase 2 codegen. See `lib/slices/README.md`.
 */

import { t } from "./i18n";
import { EFFECT_SLICES, TRANSITION_SLICES } from "./slices/registry";
import type {
  AppliedEffect,
  EffectCategory,
  EffectDefinition,
  PreviewLook,
  TransitionCategory,
  TransitionDefinition,
} from "./slices/types";

export type {
  AppliedEffect,
  CanvasOp,
  ClipTransition,
  EffectCategory,
  EffectDefinition,
  EffectPreview,
  PreviewLook,
  TransitionCategory,
  TransitionDefinition,
} from "./slices/types";

/** The categories under the "Video Effects" dropdown, in display order. */
export const EFFECT_CATEGORIES: { id: EffectCategory; label: string }[] = [
  { id: "basic", get label() { return t("effects.category.basic"); } },
  { id: "blur", get label() { return t("effects.category.blur"); } },
  { id: "color", get label() { return t("effects.category.color"); } },
  { id: "stylize", get label() { return t("effects.category.stylize"); } },
  { id: "distort", get label() { return t("effects.category.distort"); } },
];

/** Discoverable effect catalogue (slice registry). */
export const EFFECTS: EffectDefinition[] = EFFECT_SLICES;

export function findEffect(id: string): EffectDefinition | null {
  return EFFECTS.find((effect) => effect.id === id) ?? null;
}

/** Fills in any parameter the clip did not set. */
export function resolveEffectParams(
  definition: EffectDefinition,
  params: Record<string, number>,
): Record<string, number> {
  const resolved: Record<string, number> = {};
  for (const param of definition.params) {
    resolved[param.key] = params[param.key] ?? param.default;
  }
  return resolved;
}

/**
 * The complete FFmpeg video filter string for a clip, or null if it has none.
 * Effects apply in the order they were added, exactly like audio filters.
 */
export function buildEffectChain(effects: readonly AppliedEffect[] | undefined): string | null {
  if (!effects) return null;
  const fragments: string[] = [];
  for (const applied of effects) {
    if (applied.enabled === false) continue;
    const definition = findEffect(applied.id);
    if (!definition) continue;
    // The emitted position, not the list position: labels stay stable when
    // a bypassed effect sits earlier in the list.
    fragments.push(
      definition.chain(resolveEffectParams(definition, applied.params), fragments.length),
    );
  }
  return fragments.length > 0 ? fragments.join(",") : null;
}

/**
 * Everything the monitor needs to draw a clip's effects live, assembled from
 * each effect's `preview` in applied order.
 *
 * `scale` is preview pixels per export pixel. CSS/SVG filters keep their
 * relative order inside the one `filter` property (CSS applies the list in
 * sequence); overlays, canvas geometry and jitter compose on top in their own
 * layers - close enough that the export only ever reads as a sharper version
 * of the monitor, never a different picture.
 */
export function buildPreviewLook(
  effects: readonly AppliedEffect[] | undefined,
  scale: number,
): PreviewLook {
  const look: PreviewLook = {
    filter: null,
    svgFilters: [],
    overlays: [],
    canvas: [],
    jitter: null,
  };
  if (!effects || effects.length === 0) return look;

  const filterParts: string[] = [];
  effects.forEach((applied, index) => {
    if (applied.enabled === false) return;
    const definition = findEffect(applied.id);
    if (!definition) return;
    const params = resolveEffectParams(definition, applied.params);
    const preview = definition.preview;

    switch (preview.kind) {
      case "css":
        filterParts.push(preview.filter(params, scale));
        break;
      case "svg": {
        const id = `wolffx-${index}-${definition.id}`;
        look.svgFilters.push({ id, content: preview.build(params, scale) });
        filterParts.push(`url(#${id})`);
        break;
      }
      case "overlay":
        look.overlays.push({ style: preview.style(params), grain: preview.grain });
        break;
      case "pixelate":
        look.canvas.push({ kind: "pixelate", size: Math.max(2, params.size ?? 16) });
        break;
      case "mirror":
        look.canvas.push({ kind: "mirror" });
        break;
      case "fisheye":
        look.canvas.push({ kind: "fisheye", strength: (params.strength ?? 50) / 100 });
        break;
      case "jitter":
        // Several shakes do not add up to a bigger shake; the strongest wins.
        if (!look.jitter || (params.amount ?? 12) > look.jitter.amount) {
          look.jitter = { amount: params.amount ?? 12, speed: params.speed ?? 13 };
        }
        break;
    }
  });

  look.filter = filterParts.length > 0 ? filterParts.join(" ") : null;
  return look;
}

/** The categories under the "Transitions" dropdown, in display order. */
export const TRANSITION_CATEGORIES: { id: TransitionCategory; label: string }[] = [
  { id: "basic", get label() { return t("transitions.category.basic"); } },
  { id: "motion", get label() { return t("transitions.category.motion"); } },
];

/** Discoverable transition catalogue (slice registry). */
export const TRANSITIONS: TransitionDefinition[] = TRANSITION_SLICES;

export function findTransition(id: string): TransitionDefinition | null {
  return TRANSITIONS.find((transition) => transition.id === id) ?? null;
}
