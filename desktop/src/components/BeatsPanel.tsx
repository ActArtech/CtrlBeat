/**
 * Beats, music visualizer, and ASCII tools.
 *
 * File stays for project actions. This panel is the home for "add music →
 * particles move" and related beat workflows.
 */

import { BEAT_PRESETS, type BeatPresetId } from "../lib/beatPresets";
import {
  ASCII_COLOR_MODES,
  ASCII_MOTIONS,
  ASCII_PALETTES,
  type AsciiColorModeId,
  type AsciiMotionId,
} from "../lib/codevice/asciiPalettes";
import {
  VISUALIZER_LAYOUTS,
  VISUALIZER_PRESETS,
  type VisualizerLayoutId,
  type VisualizerPresetId,
  type VizColorModeId,
} from "../lib/codevice/musicVisualizer";
import { SYMBOL_SETS, type SymbolSetId } from "../lib/codevice/symbolSets";
import type { AsciiDriveMode, OverlaySurface } from "./AsciiLiveOverlay";
import { Group } from "./controls";
import { Icon } from "./Icon";
import { useLocale, type MsgKey } from "../lib/i18n";

export function BeatsPanel({
  beatCount,
  analyzingBeats,
  bakingSymbols,
  beatPresetId,
  beatsPerImage,
  loopImagesUntilEnd,
  asciiLivePreview,
  asciiDriveMode,
  overlaySurface,
  visualizerPreset,
  visualizerLayout,
  symbolSetId,
  asciiColorMode,
  asciiPaletteId,
  asciiMotion,
  vizColorMode,
  vizCount,
  beatOffsetMs,
  beatBpm,
  canAnalyze,
  canPlaceImages,
  canPlaceSymbols,
  onAnalyze,
  onClearBeats,
  onPlaceImages,
  onPlaceSymbols,
  onPlaceVisualizer,
  onBeatPreset,
  onBeatsPerImage,
  onLoopImages,
  onAsciiLivePreview,
  onAsciiDriveMode,
  onOverlaySurface,
  onVisualizerPreset,
  onVisualizerLayout,
  onSymbolSet,
  onAsciiColorMode,
  onAsciiPalette,
  onAsciiMotion,
  onVizColorMode,
  onVizCount,
  onBeatOffset,
}: {
  beatCount: number;
  analyzingBeats: boolean;
  bakingSymbols: boolean;
  beatPresetId: BeatPresetId;
  beatsPerImage: number;
  loopImagesUntilEnd: boolean;
  asciiLivePreview: boolean;
  asciiDriveMode: AsciiDriveMode;
  overlaySurface: OverlaySurface;
  visualizerPreset: VisualizerPresetId;
  visualizerLayout: VisualizerLayoutId;
  symbolSetId: SymbolSetId;
  asciiColorMode: AsciiColorModeId;
  asciiPaletteId: string;
  asciiMotion: AsciiMotionId;
  vizColorMode: VizColorModeId;
  vizCount: number;
  beatOffsetMs: number;
  beatBpm: number;
  canAnalyze: boolean;
  canPlaceImages: boolean;
  canPlaceSymbols: boolean;
  onAnalyze: () => void;
  onClearBeats: () => void;
  onPlaceImages: () => void;
  onPlaceSymbols: () => void;
  onPlaceVisualizer: () => void;
  onBeatPreset: (id: BeatPresetId) => void;
  onBeatsPerImage: (n: number) => void;
  onLoopImages: (value: boolean) => void;
  onAsciiLivePreview: (value: boolean) => void;
  onAsciiDriveMode: (mode: AsciiDriveMode) => void;
  onOverlaySurface: (surface: OverlaySurface) => void;
  onVisualizerPreset: (id: VisualizerPresetId) => void;
  onVisualizerLayout: (id: VisualizerLayoutId) => void;
  onSymbolSet: (id: SymbolSetId) => void;
  onAsciiColorMode: (mode: AsciiColorModeId) => void;
  onAsciiPalette: (id: string) => void;
  onAsciiMotion: (motion: AsciiMotionId) => void;
  onVizColorMode: (mode: VizColorModeId) => void;
  onVizCount: (count: number) => void;
  onBeatOffset: (ms: number) => void;
}) {
  const { t } = useLocale();

  let beatReadout = t("beatsPanel.noBeats");
  if (beatCount > 0 && beatBpm > 0) {
    beatReadout = t("beatsPanel.bpmReadout", {
      bpm: beatBpm.toFixed(0),
      count: String(beatCount),
    });
  } else if (beatCount > 0) {
    beatReadout = t("beatsPanel.beatCount", { count: String(beatCount) });
  }

  return (
    <div className="flex flex-col gap-4 p-3">
      <Group title={t("beatsPanel.visualizer")} help={t("beatsPanel.visualizerHelp")}>
        <ToggleRow
          label={t("menu.file.asciiLivePreview")}
          checked={asciiLivePreview}
          onChange={onAsciiLivePreview}
        />
        <div className="mt-2 mb-2 flex flex-col gap-1">
          <Choice
            label={t("beatsPanel.surfaceVisualizer")}
            checked={overlaySurface === "visualizer"}
            onSelect={() => onOverlaySurface("visualizer")}
          />
          <Choice
            label={t("beatsPanel.surfaceAscii")}
            checked={overlaySurface === "ascii"}
            onSelect={() => onOverlaySurface("ascii")}
          />
        </div>
        <p className="mb-1 text-[11px] font-medium text-tertiary">{t("beatsPanel.vizPresets")}</p>
        <div className="mb-2 flex flex-col gap-1">
          {VISUALIZER_PRESETS.map((preset) => (
            <Choice
              key={preset.id}
              label={t(preset.labelKey as MsgKey)}
              hint={preset.description}
              checked={visualizerPreset === preset.id}
              onSelect={() => {
                onVisualizerPreset(preset.id);
                onOverlaySurface("visualizer");
              }}
            />
          ))}
        </div>
        <p className="mb-1 text-[11px] font-medium text-tertiary">{t("beatsPanel.layouts")}</p>
        <div className="mb-2 flex flex-col gap-1">
          {VISUALIZER_LAYOUTS.map((layout) => (
            <Choice
              key={layout.id}
              label={t(layout.labelKey as MsgKey)}
              checked={visualizerLayout === layout.id}
              onSelect={() => onVisualizerLayout(layout.id)}
            />
          ))}
        </div>
        <p className="mb-1 text-[11px] font-medium text-tertiary">{t("beatsPanel.vizColorMode")}</p>
        <div className="mb-2 flex flex-col gap-1">
          {(
            [
              ["mono", "beatsPanel.colorModeMono"],
              ["gradient", "beatsPanel.colorModeGradient"],
              ["neon", "beatsPanel.colorModeNeon"],
            ] as const
          ).map(([mode, key]) => (
            <Choice
              key={mode}
              label={t(key)}
              checked={vizColorMode === mode}
              onSelect={() => onVizColorMode(mode)}
            />
          ))}
        </div>
        <label className="mb-2 flex items-center justify-between gap-2 text-[12px] text-primary">
          <span>{t("beatsPanel.vizCount")}</span>
          <input
            type="number"
            className="w-20 rounded-md border border-hairline bg-sunken px-2 py-1 text-[12px]"
            value={vizCount}
            min={0}
            max={2000}
            step={10}
            onChange={(event) => onVizCount(Number(event.target.value))}
          />
        </label>
        <Action
          label={
            bakingSymbols
              ? t("beatsPanel.bakingVisualizer")
              : t("beatsPanel.placeVisualizer")
          }
          disabled={beatCount === 0 || bakingSymbols}
          onClick={onPlaceVisualizer}
          primary
        />
        <p className="mt-2 text-[10px] leading-relaxed text-tertiary">
          {t("beatsPanel.exportHint")}
        </p>
      </Group>

      <Group title={t("beatsPanel.detect")}>
        <p className="mb-2 text-[11px] text-secondary">{beatReadout}</p>
        <label className="mb-2 flex items-center justify-between gap-2 text-[12px] text-primary">
          <span>{t("beatsPanel.offset")}</span>
          <input
            type="number"
            className="w-24 rounded-md border border-hairline bg-sunken px-2 py-1 text-[12px]"
            value={beatOffsetMs}
            min={-2000}
            max={2000}
            step={10}
            onChange={(event) => onBeatOffset(Number(event.target.value))}
          />
        </label>
        <div className="mb-2 flex flex-col gap-1">
          {BEAT_PRESETS.map((preset) => (
            <Choice
              key={preset.id}
              label={t(preset.labelKey)}
              checked={beatPresetId === preset.id}
              onSelect={() => onBeatPreset(preset.id)}
            />
          ))}
        </div>
        <div className="flex flex-wrap gap-1.5">
          <Action
            label={analyzingBeats ? t("menu.file.analyzingBeats") : t("menu.file.analyzeBeats")}
            disabled={!canAnalyze || analyzingBeats}
            onClick={onAnalyze}
            primary
          />
          <Action
            label={t("menu.file.clearBeats")}
            disabled={beatCount === 0}
            onClick={onClearBeats}
          />
        </div>
      </Group>

      <Group title={t("beatsPanel.place")}>
        <label className="mb-2 flex items-center justify-between gap-2 text-[12px] text-primary">
          <span>{t("beatsPanel.beatsPerImage")}</span>
          <select
            className="rounded-md border border-hairline bg-sunken px-2 py-1 text-[12px]"
            value={beatsPerImage}
            onChange={(event) => onBeatsPerImage(Number(event.target.value))}
          >
            {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
              <option key={n} value={n}>
                {n === 1
                  ? t("menu.file.beatsPerImageOne")
                  : t("menu.file.beatsPerImageN", { count: String(n) })}
              </option>
            ))}
          </select>
        </label>
        <ToggleRow
          label={t("menu.file.loopImages")}
          checked={loopImagesUntilEnd}
          onChange={onLoopImages}
        />
        <div className="mt-2 flex flex-wrap gap-1.5">
          <Action
            label={t("menu.file.placeImagesOnBeats")}
            disabled={!canPlaceImages}
            onClick={onPlaceImages}
          />
          <Action
            label={
              bakingSymbols
                ? t("menu.file.bakingCodeSymbols")
                : t("menu.file.placeCodeSymbolsOnBeats")
            }
            disabled={!canPlaceSymbols || bakingSymbols}
            onClick={onPlaceSymbols}
          />
        </div>
      </Group>

      <Group title={t("beatsPanel.ascii")}>
        <div className="flex flex-col gap-1">
          {(
            [
              ["video", "menu.file.asciiModeVideo"],
              ["voice", "menu.file.asciiModeVoice"],
              ["hybrid", "menu.file.asciiModeHybrid"],
              ["timeline", "menu.file.asciiModeTimeline"],
            ] as const
          ).map(([mode, key]) => (
            <Choice
              key={mode}
              label={t(key)}
              checked={asciiDriveMode === mode}
              onSelect={() => onAsciiDriveMode(mode)}
            />
          ))}
        </div>
        <p className="mb-1 mt-2 text-[11px] font-medium text-tertiary">{t("beatsPanel.colorMode")}</p>
        <div className="mb-2 flex flex-col gap-1">
          {ASCII_COLOR_MODES.map((mode) => (
            <Choice
              key={mode.id}
              label={t(mode.labelKey as MsgKey)}
              checked={asciiColorMode === mode.id}
              onSelect={() => onAsciiColorMode(mode.id)}
            />
          ))}
        </div>
        <p className="mb-1 text-[11px] font-medium text-tertiary">{t("beatsPanel.palette")}</p>
        <div className="flex max-h-56 flex-col gap-1 overflow-y-auto pr-1">
          {ASCII_PALETTES.map((palette) => (
            <Choice
              key={palette.id}
              label={t(palette.labelKey as MsgKey)}
              checked={asciiPaletteId === palette.id}
              onSelect={() => onAsciiPalette(palette.id)}
            />
          ))}
        </div>
        <p className="mb-1 mt-2 text-[11px] font-medium text-tertiary">{t("beatsPanel.motion")}</p>
        <div className="flex flex-col gap-1">
          {ASCII_MOTIONS.map((motion) => (
            <Choice
              key={motion.id}
              label={t(motion.labelKey as MsgKey)}
              checked={asciiMotion === motion.id}
              onSelect={() => onAsciiMotion(motion.id)}
            />
          ))}
        </div>
      </Group>

      <Group title={t("beatsPanel.symbols")}>
        <div className="flex max-h-56 flex-col gap-1 overflow-y-auto pr-1">
          {SYMBOL_SETS.map((set) => (
            <Choice
              key={set.id}
              label={t(set.labelKey as MsgKey)}
              hint={set.description}
              checked={symbolSetId === set.id}
              onSelect={() => {
                onSymbolSet(set.id);
                onOverlaySurface("ascii");
              }}
            />
          ))}
        </div>
      </Group>
    </div>
  );
}

function Choice({
  label,
  hint,
  checked,
  onSelect,
}: {
  label: string;
  hint?: string;
  checked: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`flex w-full cursor-pointer items-start gap-2 rounded-lg px-2 py-1.5 text-left text-[12px]
                  transition-colors hover:bg-hover ${checked ? "bg-hover text-primary" : "text-secondary"}`}
    >
      <Icon
        name="check"
        size={14}
        className={`mt-0.5 shrink-0 ${checked ? "text-accent opacity-100" : "opacity-0"}`}
      />
      <span className="min-w-0">
        <span className="block text-primary">{label}</span>
        {hint && <span className="mt-0.5 block text-[10px] text-tertiary">{hint}</span>}
      </span>
    </button>
  );
}

function ToggleRow({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-[12px] text-primary hover:bg-hover">
      <span>{label}</span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="accent-[var(--accent)]"
      />
    </label>
  );
}

function Action({
  label,
  disabled,
  onClick,
  primary,
}: {
  label: string;
  disabled?: boolean;
  onClick: () => void;
  primary?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`cursor-pointer rounded-md px-2.5 py-1.5 text-[12px] font-medium transition-colors
                  disabled:cursor-not-allowed disabled:opacity-40
                  ${
                    primary
                      ? "bg-accent text-on-accent hover:bg-accent-hover"
                      : "bg-sunken text-primary hover:bg-hover"
                  }`}
    >
      {label}
    </button>
  );
}
