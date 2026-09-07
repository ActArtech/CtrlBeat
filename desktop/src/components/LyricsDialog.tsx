/**
 * The lyrics-on-beats sheet: paste the words, pick the grouping, see how
 * many clips it makes, place.
 *
 * Nothing lands on the timeline until Place is pressed - the readout on
 * screen ("42 words → 21 clips · 0 left over") is exactly what the planner
 * will do with the current text and grouping. Grouping is the karaoke dial:
 * one word per beat is strict, two or three per beat is the singable read,
 * and the beat step stretches groups across every N-th beat for slow songs.
 */

import { useState } from "react";

import { selectBeatTimes } from "../lib/beatPlacement";
import { splitLyricWords } from "../lib/lyrics";
import { useLocale } from "../lib/i18n";
import { Icon } from "./Icon";

/** What the sheet agreed to; App runs the planner with this. */
export interface LyricsConfig {
  text: string;
  wordsPerGroup: number;
  beatsPerGroup: number;
}

export function LyricsDialog({
  beatTimes,
  onPlace,
  onClose,
}: {
  /** The analyzed beat grid, for the live readout. */
  beatTimes: readonly number[];
  onPlace: (config: LyricsConfig) => void;
  onClose: () => void;
}) {
  const { t } = useLocale();
  const [text, setText] = useState("");
  const [wordsPerGroup, setWordsPerGroup] = useState(1);
  const [beatsPerGroup, setBeatsPerGroup] = useState(1);

  const words = splitLyricWords(text);
  const groups = words.length === 0 ? 0 : Math.ceil(words.length / wordsPerGroup);
  const usedBeats = selectBeatTimes(beatTimes, { beatsPerImage: beatsPerGroup });
  const clips = Math.min(groups, usedBeats.length);
  const leftover = Math.max(0, words.length - clips * wordsPerGroup);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-8
                 backdrop-blur-[2px]"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="surface w-full max-w-md rounded-2xl p-6">
        <div className="mb-5 flex items-center gap-2">
          <Icon name="type" size={17} className="text-accent" />
          <h2 className="flex-1 text-sm font-semibold text-primary">{t("lyrics.title")}</h2>
          <button
            type="button"
            aria-label={t("common.close")}
            onClick={onClose}
            className="cursor-pointer rounded p-1 text-secondary hover:bg-hover hover:text-primary"
          >
            <Icon name="close" size={14} />
          </button>
        </div>

        <p className="mb-3 text-[11px] leading-relaxed text-tertiary">{t("lyrics.help")}</p>

        <textarea
          value={text}
          spellCheck={false}
          onChange={(event) => setText(event.target.value)}
          placeholder={t("lyrics.placeholder")}
          rows={8}
          className="mb-4 w-full resize-none rounded-lg border border-hairline bg-sunken px-3 py-2
                     text-xs leading-relaxed text-primary focus:border-accent focus:outline-none"
        />

        <div className="mb-4 flex gap-3">
          <label className="flex min-w-0 flex-1 items-center justify-between gap-2 text-[12px] text-primary">
            <span className="shrink-0">{t("lyrics.wordsPerGroup")}</span>
            <select
              value={wordsPerGroup}
              onChange={(event) => setWordsPerGroup(Number(event.target.value))}
              className="shrink-0 rounded-md border border-hairline bg-sunken px-2 py-1 text-[12px]"
            >
              {[1, 2, 3, 4].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </label>
          <label className="flex min-w-0 flex-1 items-center justify-between gap-2 text-[12px] text-primary">
            <span className="shrink-0">{t("lyrics.beatsPerGroup")}</span>
            <select
              value={beatsPerGroup}
              onChange={(event) => setBeatsPerGroup(Number(event.target.value))}
              className="shrink-0 rounded-md border border-hairline bg-sunken px-2 py-1 text-[12px]"
            >
              {[1, 2, 3, 4].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </label>
        </div>

        <p className="mb-4 font-technical text-[11px] text-secondary">
          {t("lyrics.readout", { words: String(words.length), clips: String(clips) })}
          {leftover > 0 && ` · ${t("lyrics.leftover", { count: String(leftover) })}`}
        </p>

        <button
          type="button"
          disabled={clips === 0}
          onClick={() => onPlace({ text, wordsPerGroup, beatsPerGroup })}
          className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg
                     bg-accent px-4 py-2.5 text-sm font-medium text-on-accent transition-colors
                     hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Icon name="check" size={15} />
          {t("lyrics.place")}
        </button>
      </div>
    </div>
  );
}
