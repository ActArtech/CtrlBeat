/**
 * Live overlay for the monitor: ASCII glyphs or beat-driven music visualizer.
 */

import { useEffect, useRef } from "react";

import {
  asciiPaletteById,
  type AsciiColorModeId,
  type AsciiMotionId,
} from "../lib/codevice/asciiPalettes";
import { beatPulseIntensity, pulsedGridSize } from "../lib/codevice/beatPulse";
import {
  renderMusicVisualizer,
  type VizColorModeId,
  type VisualizerLayoutId,
  type VisualizerPresetId,
} from "../lib/codevice/musicVisualizer";
import { renderBeatSymbols } from "../lib/codevice/renderBeatSymbols";
import type { SymbolSetId } from "../lib/codevice/symbolSets";
import { processFrameToAscii } from "../lib/codevice/videoAsciiEngine";

export type AsciiDriveMode = "video" | "voice" | "hybrid" | "timeline";
export type OverlaySurface = "ascii" | "visualizer";

export interface AsciiLiveOverlayProps {
  enabled: boolean;
  playhead: number;
  beatTimes: readonly number[];
  symbolSetId: SymbolSetId;
  /** video = sample preview media; voice = mic energy; hybrid = both; timeline = project audio at playhead. */
  mode: AsciiDriveMode;
  /** ascii = glyph field; visualizer = particles / kaleidoscope / etc. */
  surface?: OverlaySurface;
  visualizerPreset?: VisualizerPresetId;
  visualizerLayout?: VisualizerLayoutId;
  /** 0..1 from mic / audio analyser when voice or hybrid. */
  voiceLevel?: number;
  /** Palette for glyph + visualizer colors; defaults to Concat deep sea. */
  asciiPaletteId?: string;
  /** How glyphs take color: mono | video | gradient | neon. */
  asciiColorMode?: AsciiColorModeId;
  /** Animated per-cell motion (requires playhead as the time clock). */
  asciiMotion?: AsciiMotionId;
  /** Visualizer color scheme: mono | gradient | neon. */
  vizColorMode?: VizColorModeId;
  /** Visualizer element count; 0 = preset default. */
  vizCount?: number;
  /** Loudness 0..1 of the timeline's audio at a given second (timeline mode). */
  audioLevelAt?: (time: number) => number;
  getSource: () => CanvasImageSource | null;
  width: number;
  height: number;
}

export function AsciiLiveOverlay({
  enabled,
  playhead,
  beatTimes,
  symbolSetId,
  mode,
  surface = "ascii",
  visualizerPreset = "particles",
  visualizerLayout = "center",
  voiceLevel = 0,
  asciiPaletteId = "deepSea",
  asciiColorMode = "mono",
  asciiMotion = "none",
  vizColorMode = "mono",
  vizCount = 0,
  audioLevelAt,
  getSource,
  width,
  height,
}: AsciiLiveOverlayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const offscreenRef = useRef<HTMLCanvasElement | null>(null);
  const latest = useRef({
    playhead,
    beatTimes,
    symbolSetId,
    mode,
    surface,
    visualizerPreset,
    visualizerLayout,
    voiceLevel,
    palette: asciiPaletteById(asciiPaletteId),
    asciiColorMode,
    asciiMotion,
    vizColorMode,
    vizCount,
    audioLevelAt,
    getSource,
    width,
    height,
  });
  latest.current = {
    playhead,
    beatTimes,
    symbolSetId,
    mode,
    surface,
    visualizerPreset,
    visualizerLayout,
    voiceLevel,
    palette: asciiPaletteById(asciiPaletteId),
    asciiColorMode,
    asciiMotion,
    vizColorMode,
    vizCount,
    audioLevelAt,
    getSource,
    width,
    height,
  };

  useEffect(() => {
    if (!enabled) return;

    let frame = 0;
    let lastDraw = 0;
    const minIntervalMs = 1000 / 20;

    const draw = (now: number) => {
      if (now - lastDraw < minIntervalMs) {
        frame = requestAnimationFrame(draw);
        return;
      }
      lastDraw = now;

      const canvas = canvasRef.current;
      if (!canvas) {
        frame = requestAnimationFrame(draw);
        return;
      }

      const state = latest.current;
      if (canvas.width !== state.width || canvas.height !== state.height) {
        canvas.width = Math.max(2, state.width);
        canvas.height = Math.max(2, state.height);
      }
      if (!offscreenRef.current) {
        offscreenRef.current = document.createElement("canvas");
      }

      const beatHit = beatPulseIntensity(state.playhead, state.beatTimes, 0.14);
      const voice =
        state.mode === "voice" || state.mode === "hybrid"
          ? Math.max(0, Math.min(1, state.voiceLevel))
          : state.mode === "timeline"
            ? Math.max(0, Math.min(1, state.audioLevelAt?.(state.playhead) ?? 0))
            : 0;
      const intensity =
        state.mode === "voice"
          ? Math.max(voice, beatHit * 0.35)
          : state.mode === "hybrid" || state.mode === "timeline"
            ? Math.max(beatHit, voice * 0.85)
            : Math.max(0.2, beatHit);

      if (state.surface === "visualizer") {
        renderMusicVisualizer(canvas, {
          width: canvas.width,
          height: canvas.height,
          time: state.playhead,
          intensity,
          voice,
          preset: state.visualizerPreset,
          layout: state.visualizerLayout,
          foreground: state.palette.foreground,
          accent: state.palette.accent,
          colorMode: state.vizColorMode,
          count: state.vizCount > 0 ? state.vizCount : undefined,
        });
      } else {
        const source = state.mode === "voice" ? null : state.getSource();
        const gridSize = pulsedGridSize(14, intensity);
        if (source && (source instanceof HTMLVideoElement ? source.readyState >= 2 : true)) {
          processFrameToAscii(
            source,
            canvas,
            {
              symbolSetId: state.symbolSetId,
              gridSize,
              brightness: Math.round(intensity * 24),
              contrast: 12,
              enableEdgeSlashes: true,
              background: state.palette.background,
              foreground: state.palette.foreground,
              accent: state.palette.accent,
              colorMode: state.asciiColorMode,
              motion: state.asciiMotion,
              time: state.playhead,
            },
            offscreenRef.current,
          );
        } else {
          renderBeatSymbols(canvas, {
            width: canvas.width,
            height: canvas.height,
            intensity: Math.max(0.4, intensity),
            symbolSetId: state.symbolSetId,
            seed: Math.floor(state.playhead * 10) + 1,
          });
        }
      }

      frame = requestAnimationFrame(draw);
    };

    frame = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(frame);
  }, [enabled]);

  if (!enabled) return null;

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none absolute inset-0 h-full w-full object-contain"
      aria-hidden
    />
  );
}
