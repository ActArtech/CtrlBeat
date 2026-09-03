/**
 * Slice catalogue types (effects + transitions).
 *
 * Kept stable so MediaBin / EffectsPanel / project JSON ids do not churn.
 */

import type { FilterParam } from "../filters";
import type { EffectCategory, TransitionCategory } from "./shared";

export type { EffectCategory, TransitionCategory };

/**
 * How one effect draws itself in the monitor.
 *
 * `scale` on the builders is preview pixels per export pixel, so a 10px blur
 * looks the same on a small monitor as in the file.
 */
export type EffectPreview =
  | { kind: "css"; filter: (params: Record<string, number>, scale: number) => string }
  | {
      /** The inner content of an SVG `<filter>`, referenced via `url(#id)`. */
      kind: "svg";
      build: (params: Record<string, number>, scale: number) => string;
    }
  | {
      /** A full-frame layer composited over the picture. */
      kind: "overlay";
      style: (params: Record<string, number>) => Record<string, string | number>;
      /** Marks the animated grain layer, which carries its own CSS class. */
      grain?: boolean;
    }
  | { kind: "pixelate" }
  | { kind: "mirror" }
  | { kind: "fisheye" }
  | { kind: "jitter" };

/** One geometry redraw the preview's canvas pass performs, in order. */
export type CanvasOp =
  | { kind: "pixelate"; size: number }
  | { kind: "mirror" }
  | { kind: "fisheye"; strength: number };

/** Everything the monitor needs to draw a clip's effects live. */
export interface PreviewLook {
  /** The CSS `filter` property: functions and `url(#id)` refs, in order. */
  filter: string | null;
  /** SVG `<filter>` elements to mount, matching the `url()` refs above. */
  svgFilters: { id: string; content: string }[];
  /** Layers composited over the picture, in effect order. */
  overlays: { style: Record<string, string | number>; grain?: boolean }[];
  /** Geometry redraws the canvas pass performs, in order. */
  canvas: CanvasOp[];
  /** Position jitter, evaluated from the playhead clock. Null for none. */
  jitter: { amount: number; speed: number } | null;
}

/** An effect applied to a clip, with whatever parameters were set. */
export interface AppliedEffect {
  id: string;
  params: Record<string, number>;
  /** False bypasses without losing settings. Absent means enabled. */
  enabled?: boolean;
}

/** A transition on the cut into a clip. */
export interface ClipTransition {
  id: string;
  /** Seconds the transition covers. */
  duration: number;
}

export interface EffectDefinition {
  id: string;
  label: string;
  category: EffectCategory;
  /** One line on what it does, shown in the card tooltip. */
  blurb: string;
  /** CSS background for the preview tile, until real thumbnails exist. */
  swatch: string;
  params: FilterParam[];
  /**
   * Builds the FFmpeg video filter fragment for these parameter values.
   * `index` is the fragment's position in the clip's chain: any filtergraph
   * labels MUST embed it, or stacking the same effect twice duplicates
   * labels and FFmpeg rejects the whole graph.
   */
  chain: (params: Record<string, number>, index: number) => string;
  /** How the monitor draws it live. Every effect has one - no export-only. */
  preview: EffectPreview;
}

export interface TransitionDefinition {
  id: string;
  label: string;
  category: TransitionCategory;
  blurb: string;
  /** False = shown as Soon in the Library; not applied yet. */
  implemented: boolean;
  defaultDuration: number;
}

/** On-disk manifest for an effect slice (authoring metadata). */
export interface EffectManifest {
  id: string;
  kind: "effect";
  category: EffectCategory;
  i18nKey: string;
  swatch: string;
}

/** On-disk manifest for a transition slice. */
export interface TransitionManifest {
  id: string;
  kind: "transition";
  category: TransitionCategory;
  i18nKey: string;
  implemented: boolean;
  defaultDuration: number;
}
