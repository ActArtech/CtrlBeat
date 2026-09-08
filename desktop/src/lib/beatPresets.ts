/**
 * Named beat-detection presets the File menu exposes.
 *
 * Four options cover the usual music cases without dumping raw knobs on the
 * user. Each maps to `detectBeatsFromPcm` settings.
 */

import type { BeatDetectSettings } from "./beatDetection";

export type BeatPresetId = "balanced" | "bass" | "piano" | "dense";

export interface BeatPreset {
  id: BeatPresetId;
  /** i18n key for the menu label. */
  labelKey:
    | "menu.file.beatPresetBalanced"
    | "menu.file.beatPresetBass"
    | "menu.file.beatPresetPiano"
    | "menu.file.beatPresetDense";
  settings: BeatDetectSettings;
}

export const BEAT_PRESETS: readonly BeatPreset[] = [
  {
    id: "balanced",
    labelKey: "menu.file.beatPresetBalanced",
    settings: {
      strategy: "all-frequencies",
      sensitivity: 1.0,
      energyThreshold: 0.12,
      minBeatInterval: 0.2,
      windowSeconds: 0.05,
      onsetRatio: 1.3,
      smooth: true,
    },
  },
  {
    id: "bass",
    labelKey: "menu.file.beatPresetBass",
    settings: {
      strategy: "bass-heavy",
      sensitivity: 1.15,
      energyThreshold: 0.1,
      minBeatInterval: 0.18,
      windowSeconds: 0.05,
      onsetRatio: 1.25,
      smooth: true,
    },
  },
  {
    id: "piano",
    labelKey: "menu.file.beatPresetPiano",
    settings: {
      strategy: "piano",
      sensitivity: 1.2,
      energyThreshold: 0.06,
      minBeatInterval: 0.15,
      windowSeconds: 0.04,
      onsetRatio: 1.15,
      // Piano dynamics vary a lot; keep every onset past the min interval.
      smooth: false,
    },
  },
  {
    id: "dense",
    labelKey: "menu.file.beatPresetDense",
    settings: {
      strategy: "all-frequencies",
      sensitivity: 1.4,
      energyThreshold: 0.05,
      minBeatInterval: 0.1,
      windowSeconds: 0.04,
      onsetRatio: 1.1,
      smooth: false,
    },
  },
];

export function beatPresetById(id: BeatPresetId): BeatPreset {
  return BEAT_PRESETS.find((preset) => preset.id === id) ?? BEAT_PRESETS[0];
}
