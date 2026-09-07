/**
 * App-level preferences, in localStorage.
 *
 * These are machine preferences, not edit state: which Whisper model to use,
 * which language to expect. They deliberately do not live in the project -
 * copying a project to a machine without the model should not break it, and
 * the choice is about this computer's speed/quality tradeoff.
 *
 * Keys use the CtrlBeat prefix; BeatCut and WolfCut legacy keys migrate on first read.
 */

import { storageGet, storageSet } from "./brand";

const MODEL_KEY = "ctrlbeat.transcriber.model";
const LANGUAGE_KEY = "ctrlbeat.transcriber.language";
const LEGACY_BEATCUT_MODEL_KEY = "beatcut.transcriber.model";
const LEGACY_BEATCUT_LANGUAGE_KEY = "beatcut.transcriber.language";
const LEGACY_WOLFCUT_MODEL_KEY = "wolfcut.transcriber.model";
const LEGACY_WOLFCUT_LANGUAGE_KEY = "wolfcut.transcriber.language";

/** The default model: the speed/quality sweet spot, per the settings panel. */
export const DEFAULT_TRANSCRIBER_MODEL = "base.en";

export function getTranscriberModel(): string {
  return (
    storageGet(MODEL_KEY, LEGACY_BEATCUT_MODEL_KEY, LEGACY_WOLFCUT_MODEL_KEY) ??
    DEFAULT_TRANSCRIBER_MODEL
  );
}

export function setTranscriberModel(id: string): void {
  storageSet(MODEL_KEY, id);
}

/** A Whisper language code, or "auto" to let the model decide. */
export function getTranscriberLanguage(): string {
  return (
    storageGet(LANGUAGE_KEY, LEGACY_BEATCUT_LANGUAGE_KEY, LEGACY_WOLFCUT_LANGUAGE_KEY) ?? "auto"
  );
}

export function setTranscriberLanguage(code: string): void {
  storageSet(LANGUAGE_KEY, code);
}

const TTS_MODEL_KEY = "ctrlbeat.tts.model";
const TTS_VOICE_KEY = "ctrlbeat.tts.voice";
const LEGACY_BEATCUT_TTS_MODEL_KEY = "beatcut.tts.model";
const LEGACY_BEATCUT_TTS_VOICE_KEY = "beatcut.tts.voice";
const LEGACY_WOLFCUT_TTS_MODEL_KEY = "wolfcut.tts.model";
const LEGACY_WOLFCUT_TTS_VOICE_KEY = "wolfcut.tts.voice";

/** The default voice model: the compact build the settings panel recommends. */
export const DEFAULT_TTS_MODEL = "kokoro-int8-multi-lang-v1_0";

/** The default speaker: af_heart, Kokoro's showcase voice. */
export const DEFAULT_TTS_VOICE = 3;

export function getTtsModel(): string {
  return (
    storageGet(TTS_MODEL_KEY, LEGACY_BEATCUT_TTS_MODEL_KEY, LEGACY_WOLFCUT_TTS_MODEL_KEY) ??
    DEFAULT_TTS_MODEL
  );
}

export function setTtsModel(id: string): void {
  storageSet(TTS_MODEL_KEY, id);
}

/** A Kokoro speaker id, from the host's voices table. */
export function getTtsVoice(): number {
  const raw = storageGet(TTS_VOICE_KEY, LEGACY_BEATCUT_TTS_VOICE_KEY, LEGACY_WOLFCUT_TTS_VOICE_KEY);
  if (raw === null) return DEFAULT_TTS_VOICE;
  const stored = Number(raw);
  return Number.isInteger(stored) && stored >= 0 ? stored : DEFAULT_TTS_VOICE;
}

export function setTtsVoice(id: number): void {
  storageSet(TTS_VOICE_KEY, String(id));
}

const BAKE_LAST_KEY = "ctrlbeat.bake.last";

/** The last applied bake for one project: its folder and settings key. */
export interface LastBake {
  projectPath: string;
  bakeKey: string;
}

/**
 * Remembers the last bake applied to a project, so reopening it and exporting
 * with identical settings + beats skips a redundant re-encode. Machine-local
 * on purpose: the key names settings, not edit state - and the baked MP4 is
 * still in the project's cache either way.
 */
export function getLastBake(): LastBake | null {
  const raw = storageGet(BAKE_LAST_KEY);
  if (!raw) return null;
  try {
    const stored = JSON.parse(raw) as Partial<LastBake>;
    if (typeof stored.projectPath === "string" && typeof stored.bakeKey === "string") {
      return { projectPath: stored.projectPath, bakeKey: stored.bakeKey };
    }
  } catch {
    // A corrupt entry is a miss, not an error.
  }
  return null;
}

export function setLastBake(projectPath: string, bakeKey: string): void {
  storageSet(BAKE_LAST_KEY, JSON.stringify({ projectPath, bakeKey }));
}

const CAPTION_GRANULARITY_KEY = "ctrlbeat.captions.granularity";

/** How auto captions land: one clip per phrase, or one per word. */
export type CaptionGranularity = "phrase" | "word";

export function getCaptionGranularity(): CaptionGranularity {
  return storageGet(CAPTION_GRANULARITY_KEY) === "word" ? "word" : "phrase";
}

export function setCaptionGranularity(value: CaptionGranularity): void {
  storageSet(CAPTION_GRANULARITY_KEY, value);
}
