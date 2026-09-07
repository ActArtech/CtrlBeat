/**
 * The overlay bake, behind a configuration step.
 *
 * The dialog collects what the user agrees to (see BakeDialog); `run` streams
 * the frames exactly as the old inline App.tsx callback did, now reporting
 * progress per frame and honouring a cancel flag between frames. A successful
 * bake remembers its settings key - in the session and in localStorage - so
 * reopening the project and exporting with the same settings + beats skips
 * the redundant re-encode instead of repeating it.
 */

import { useCallback, useRef, useState } from "react";

import { selectBeatTimes } from "../lib/beatPlacement";
import { beatPulseIntensity, pulsedGridSize } from "../lib/codevice/beatPulse";
import {
  bakeFileKey,
  bakeFrameCount,
  bakeFrameRate,
  bakeFrameTimes,
  bakeSize,
  bakeSpan,
  createBakeVideo,
  estimateBakeSeconds,
  seekBakeVideo,
  waitBakeVideoReady,
  type BakeConfig,
  type BakeKind,
  type BakeSpan,
} from "../lib/codevice/bakeOverlay";
import { asciiPaletteById } from "../lib/codevice/asciiPalettes";
import { renderMusicVisualizer } from "../lib/codevice/musicVisualizer";
import { canvasToJpegBytes, renderBeatSymbols } from "../lib/codevice/renderBeatSymbols";
import { processFrameToAscii } from "../lib/codevice/videoAsciiEngine";
import { findClip, findMedia, type Clip, type EditorProject, type MediaItem } from "../lib/editor";
import {
  bakeAbort,
  bakeBegin,
  bakeFinish,
  bakeFrame,
  newMediaFromSummary,
  probeMedia,
} from "../lib/engine";
import type { Command as EditorCommand } from "../lib/generated/Command";
import { t } from "../lib/i18n";
import { getLastBake, setLastBake } from "../lib/settings";
import type { AsciiDriveMode } from "../components/AsciiLiveOverlay";
import type { BeatAnalysis } from "./useBeatsWorkflow";

/** What surfaced in the Beats tab asked for the bake. */
export type BakeSurfaceKind = "ascii" | "visualizer";

/** The plan snapshot the dialog is opened with. */
export interface BakeRequest {
  kind: BakeSurfaceKind;
  /** True when Export is waiting on this bake to finish. */
  forExport: boolean;
  bakeKind: BakeKind;
  /** ASCII's sampled source, resolved when the dialog opened. */
  videoSource: { media: MediaItem; clip: Clip | null } | null;
  span: BakeSpan | null;
  /** Settings + beats identity at the default frame rate. */
  bakeKey: string | null;
  /** The same settings + beats were already baked (clip already placed). */
  alreadyBaked: boolean;
  /** A previous bake exists to replace (this session or discovered). */
  hasPreviousBake: boolean;
}

export type BakeOutcome = "placed" | "empty" | "cancelled";

/** A previous bake's footprint on the timeline, for replacement. */
interface BakeFootprint {
  clipIds: string[];
  trackIds: string[];
  mediaIds: string[];
}

/** Baked overlays land in the project cache under `bake-<kind>-<hash>.mp4`. */
const BAKE_MEDIA_PATH = /[\\/]bake-(visualizer|asciiVideo|symbols)-[0-9a-f]{8}\.mp4$/;

export function useBakeOverlay(params: {
  projectPath: string;
  getProject: () => EditorProject;
  frameWidth: number;
  frameHeight: number;
  timelineBeats: readonly number[];
  beatsPerImage: number;
  beatAnalysis: BeatAnalysis | null;
  visualizerPreset: Parameters<typeof renderMusicVisualizer>[1]["preset"];
  visualizerLayout: Parameters<typeof renderMusicVisualizer>[1]["layout"];
  vizColorMode: Parameters<typeof renderMusicVisualizer>[1]["colorMode"];
  vizCount: number;
  symbolSetId: Parameters<typeof renderBeatSymbols>[1]["symbolSetId"];
  asciiColorMode: Parameters<typeof processFrameToAscii>[2]["colorMode"];
  asciiPaletteId: string;
  asciiMotion: Parameters<typeof processFrameToAscii>[2]["motion"];
  asciiDriveMode: AsciiDriveMode;
  audioLevelAt: (time: number) => number;
  resolveVideoForAscii: () => { media: MediaItem; clip: Clip | null } | null;
  dispatch: (command: EditorCommand) => Promise<string | undefined>;
  setSelectedClipIds: (ids: string[]) => void;
}) {
  const paramsRef = useRef(params);
  paramsRef.current = params;

  const [request, setRequest] = useState<BakeRequest | null>(null);
  const requestRef = useRef<BakeRequest | null>(null);
  requestRef.current = request;
  const [running, setRunning] = useState(false);
  const cancelRef = useRef(false);
  /** The last bake this session placed, for replace + skip. */
  const lastBakeKeyRef = useRef<string | null>(null);
  const placedRef = useRef<BakeFootprint | null>(null);
  const inflightRef = useRef<Promise<BakeOutcome> | null>(null);

  /** Settings + beats identity at one effective frame rate. */
  const keyFor = useCallback(
    (bakeKind: BakeKind, usedBeats: readonly number[], fps: number): string => {
      const p = paramsRef.current;
      return [
        bakeKind,
        p.beatsPerImage,
        p.visualizerPreset,
        p.visualizerLayout,
        p.vizColorMode,
        p.vizCount,
        p.symbolSetId,
        p.asciiColorMode,
        p.asciiPaletteId,
        p.asciiMotion,
        usedBeats.length,
        usedBeats[0]?.toFixed(3),
        usedBeats[usedBeats.length - 1]?.toFixed(3),
        fps,
      ].join("|");
    },
    [],
  );

  /** The bake's span source: the analyzed audio's end on the timeline. */
  const endCapFor = useCallback((): number | undefined => {
    const { beatAnalysis, getProject } = paramsRef.current;
    if (beatAnalysis?.clipId) {
      const clip = findClip(getProject(), beatAnalysis.clipId);
      if (clip) {
        const mediaLen = beatAnalysis.duration > 0 ? beatAnalysis.duration : clip.duration;
        const speed = clip.speed > 0 ? clip.speed : 1;
        return clip.start + (mediaLen - clip.sourceStart) / speed;
      }
    }
    return beatAnalysis?.duration;
  }, []);

  /** The plan the dialog opens with, computed from the moment's truth. */
  const planFor = useCallback(
    (kind: BakeSurfaceKind): BakeRequest => {
      const p = paramsRef.current;
      const videoSource = kind === "ascii" ? p.resolveVideoForAscii() : null;
      const bakeKind: BakeKind =
        kind === "visualizer" ? "visualizer" : videoSource ? "asciiVideo" : "symbols";
      const usedBeats = selectBeatTimes(p.timelineBeats, { beatsPerImage: p.beatsPerImage });
      const span = bakeSpan(usedBeats, endCapFor());
      // The skip-dedupe key speaks the default frame rate; a deliberate
      // different choice bakes under its own key and is remembered that way.
      const bakeKey =
        span === null
          ? null
          : keyFor(bakeKind, usedBeats, bakeFrameRate(bakeKind, span.end - span.start));
      const persisted =
        span !== null &&
        getLastBake()?.projectPath === p.projectPath &&
        getLastBake()?.bakeKey === bakeKey;
      return {
        kind,
        forExport: false,
        bakeKind,
        videoSource,
        span,
        bakeKey,
        alreadyBaked: persisted || (bakeKey !== null && lastBakeKeyRef.current === bakeKey),
        hasPreviousBake:
          placedRef.current !== null || findPreviousBake(p.getProject()) !== null,
      };
    },
    [endCapFor, keyFor],
  );

  const open = useCallback(
    (kind: BakeSurfaceKind, forExport = false): void => {
      if (requestRef.current || inflightRef.current) return;
      const plan = { ...planFor(kind), forExport };
      setRequest(plan);
    },
    [planFor],
  );

  const close = useCallback((): void => {
    if (running) return;
    setRequest(null);
  }, [running]);

  /** True when the current settings + beats are already on the timeline. */
  const isAlreadyBaked = useCallback(
    (kind: BakeSurfaceKind): boolean => planFor(kind).alreadyBaked,
    [planFor],
  );

  const cancel = useCallback((): void => {
    cancelRef.current = true;
    // Kill the encoder now rather than after the in-flight frame: a
    // backpressured bake_frame can park for a while when FFmpeg is behind.
    void bakeAbort().catch(() => undefined);
  }, []);

  /**
   * Bakes per the agreed config. Throws only on real failures; a cancel and
   * a nothing-to-bake resolve as outcomes instead.
   */
  const run = useCallback(
    async (
      config: BakeConfig,
      onProgress: (frame: number, total: number) => void,
    ): Promise<BakeOutcome> => {
      if (inflightRef.current) return inflightRef.current;

      const exec = (async (): Promise<BakeOutcome> => {
        const plan = requestRef.current;
        if (!plan || plan.span === null) return "empty";
        const p = paramsRef.current;
        const { span } = plan;

        const size = bakeSize(p.frameWidth || 1920, p.frameHeight || 1080);
        const canvas = document.createElement("canvas");
        canvas.width = size.width;
        canvas.height = size.height;
        const offscreen = document.createElement("canvas");
        const palette = asciiPaletteById(p.asciiPaletteId);
        const fps = bakeFrameRate(plan.bakeKind, span.end - span.start, config.fps);
        const times = bakeFrameTimes(span.start, span.end, fps);

        // The mic cannot be baked, so voice mode falls back to the beat grid;
        // timeline and hybrid keep the audio-level drive the live overlay uses.
        const levelAt =
          p.asciiDriveMode === "timeline" || p.asciiDriveMode === "hybrid" ? p.audioLevelAt : null;

        const video =
          plan.bakeKind === "asciiVideo" && plan.videoSource
            ? createBakeVideo(plan.videoSource.media.path)
            : null;
        if (video) {
          document.body.appendChild(video);
          if (!(await waitBakeVideoReady(video))) {
            video.remove();
            throw new Error(t("toast.bakeVideoUnavailable"));
          }
        }

        cancelRef.current = false;
        setRunning(true);
        try {
          await bakeBegin(p.projectPath, bakeFileKey(plan.bakeKind, keyFor(plan.bakeKind, selectBeatTimes(p.timelineBeats, { beatsPerImage: p.beatsPerImage }), fps)), fps);

          for (let index = 0; index < times.length; index += 1) {
            if (cancelRef.current) return "cancelled";
            const time = times[index]!;
            const beatHit = beatPulseIntensity(time, p.timelineBeats, 0.14);
            const voice = levelAt ? Math.max(0, Math.min(1, levelAt(time))) : 0;
            const intensity =
              levelAt || p.asciiDriveMode === "voice"
                ? Math.max(beatHit, voice * 0.85)
                : Math.max(0.2, beatHit);

            if (plan.bakeKind === "visualizer") {
              renderMusicVisualizer(canvas, {
                width: size.width,
                height: size.height,
                time,
                intensity,
                voice,
                preset: p.visualizerPreset,
                layout: p.visualizerLayout,
                foreground: palette.foreground,
                accent: palette.accent,
                colorMode: p.vizColorMode,
                count: p.vizCount > 0 ? p.vizCount : undefined,
              });
            } else if (video && plan.videoSource) {
              const { media, clip } = plan.videoSource;
              let mediaTime = time;
              if (clip) {
                mediaTime = clip.sourceStart + (time - clip.start) * clip.speed;
                mediaTime = Math.max(0, mediaTime);
                if (media.duration && media.duration > 0) {
                  mediaTime = Math.min(mediaTime, Math.max(0, media.duration - 0.05));
                }
              } else if (media.duration && media.duration > 0) {
                mediaTime = Math.min(time, Math.max(0, media.duration - 0.05));
              }
              // A seek that times out keeps the previous frame - a late frame
              // beats aborting a long bake over one stall.
              await seekBakeVideo(video, mediaTime);
              processFrameToAscii(
                video,
                canvas,
                {
                  symbolSetId: p.symbolSetId,
                  gridSize: pulsedGridSize(14, intensity),
                  brightness: Math.round(intensity * 24),
                  contrast: 12,
                  enableEdgeSlashes: true,
                  background: palette.background,
                  foreground: palette.foreground,
                  accent: palette.accent,
                  colorMode: p.asciiColorMode,
                  motion: p.asciiMotion,
                  time,
                },
                offscreen,
              );
            } else {
              renderBeatSymbols(canvas, {
                width: size.width,
                height: size.height,
                intensity: Math.max(0.4, intensity),
                symbolSetId: p.symbolSetId,
                seed: Math.floor(time * 10) + 1,
              });
            }

            await bakeFrame(await canvasToJpegBytes(canvas));
            onProgress(index + 1, times.length);
          }

          if (cancelRef.current) return "cancelled";

          const path = await bakeFinish();
          const mediaItem = newMediaFromSummary(await probeMedia(path));
          const mediaId = await p.dispatch({ op: "addMedia", item: mediaItem });
          if (!mediaId) throw new Error(t("toast.bakePlaceFailed"));

          if (config.replace) {
            const previous = placedRef.current ?? findPreviousBake(p.getProject());
            if (previous) await removeFootprint(p.dispatch, previous);
          }
          placedRef.current = null;

          // The track exists only once a clip is certain to land on it.
          const trackId = await p.dispatch({ op: "addTrack" });
          if (!trackId) throw new Error(t("toast.bakeTrackFailed"));
          const clipId = await p.dispatch({
            op: "placeImageClips",
            placements: [{ mediaId, start: span.start, duration: times.length / fps }],
            trackId,
          });
          if (!clipId) throw new Error(t("toast.bakePlaceFailed"));

          void p.dispatch({ op: "renameTrack", trackId, name: t("track.overlayBake") });
          p.setSelectedClipIds([clipId]);

          const key = keyFor(plan.bakeKind, selectBeatTimes(p.timelineBeats, { beatsPerImage: p.beatsPerImage }), fps);
          lastBakeKeyRef.current = key;
          setLastBake(p.projectPath, key);
          placedRef.current = {
            clipIds: [clipId],
            trackIds: [trackId],
            mediaIds: [mediaId],
          };
          return "placed";
        } catch (cause) {
          // Leave no half-fed encoder behind; finish() may have reaped it
          // already, and abort on a dead session is a harmless no-op.
          await bakeAbort().catch(() => undefined);
          if (cancelRef.current) return "cancelled";
          throw cause;
        } finally {
          if (video) {
            video.removeAttribute("src");
            video.load();
            video.remove();
          }
        }
      })();

      inflightRef.current = exec;
      try {
        return await exec;
      } finally {
        inflightRef.current = null;
        setRunning(false);
      }
    },
    [keyFor],
  );

  return {
    request,
    running,
    /** True while the dialog is open or a bake is streaming. */
    busy: request !== null,
    open,
    close,
    run,
    cancel,
    isAlreadyBaked,
    /** The frame count + estimate the dialog shows, from the open plan. */
    planNumbers: (fpsChoice: number): { frames: number; seconds: number } | null => {
      if (!request || request.span === null) return null;
      const fps = bakeFrameRate(request.bakeKind, request.span.end - request.span.start, fpsChoice);
      const frames = bakeFrameCount(request.span, fps);
      return { frames, seconds: estimateBakeSeconds(request.bakeKind, frames) };
    },
  };
}

/**
 * Finds bake clips by their cache media path, not by track name: names are
 * display strings (and translate), paths are what the bake wrote. A track is
 * removed only when every clip on it is a bake clip, so a user who dragged
 * their own material onto the overlay track keeps it.
 */
function findPreviousBake(project: EditorProject): BakeFootprint | null {
  const clipIds: string[] = [];
  const trackIds: string[] = [];
  const mediaIds = new Set<string>();

  for (const timeline of project.timelines) {
    const isBake = (clip: Clip) =>
      BAKE_MEDIA_PATH.test(findMedia(project, clip.mediaId)?.path ?? "");
    for (const track of timeline.tracks) {
      const onTrack = timeline.clips.filter((clip) => clip.trackId === track.id);
      const bakes = onTrack.filter(isBake);
      if (bakes.length === 0) continue;
      if (onTrack.length === bakes.length) {
        trackIds.push(track.id);
      }
      for (const clip of bakes) {
        clipIds.push(clip.id);
        mediaIds.add(clip.mediaId);
      }
    }
  }

  return clipIds.length > 0
    ? { clipIds, trackIds, mediaIds: [...mediaIds] }
    : null;
}

async function removeFootprint(
  dispatch: (command: EditorCommand) => Promise<string | undefined>,
  footprint: BakeFootprint,
): Promise<void> {
  const commands: EditorCommand[] = [];
  if (footprint.clipIds.length > 0) {
    commands.push({ op: "removeClips", clipIds: footprint.clipIds });
  }
  for (const trackId of footprint.trackIds) {
    commands.push({ op: "removeTrack", trackId });
  }
  for (const mediaId of footprint.mediaIds) {
    commands.push({ op: "removeMedia", mediaId });
  }
  if (commands.length === 0) return;
  await dispatch(commands.length === 1 ? commands[0]! : { op: "batch", commands });
}
