/**
 * Pure derivations of what the monitor and the exporter see.
 *
 * Everything here answers one question - given the project and a playhead,
 * what is on screen, what ghosts in, what washes over, what exports - with
 * no React and no IO, which is what makes the cross-fade pre-roll arithmetic
 * and the exporter flattening testable in microseconds. App.tsx memoises
 * these; nothing else derives them a second way.
 */

import {
  clipsAt,
  findMedia,
  findTrack,
  precedingClip,
  type Clip,
  type EditorProject,
  type TimelineData,
} from "./editor";
import type { TextStyle } from "./text";

/** The clip the element preview shows: top-most visual clip at the playhead. */
export interface PreviewSource {
  clipId: string;
  path: string;
  /** Where in the source file the playhead sits, in seconds. */
  time: number;
  /** Playback rate, 1 being normal - the element must run at this rate or it
      drifts from the transport and stutters on every corrective seek. */
  speed: number;
  /** A still is shown as an image; there is nothing to seek or play. */
  isStill: boolean;
}

/** A title to draw over the picture, already positioned. */
export interface TextOverlay {
  clipId: string;
  style: TextStyle;
  /** Offset from centred, as a fraction of the frame. */
  offsetX: number;
  offsetY: number;
  /** 0..1 while the title fades or dissolves in; absent is fully opaque. */
  opacity?: number;
  /** Horizontal travel as a frame fraction while it wipes or pushes in. */
  translateX?: number;
  /** Scale multiplier while it zoom-punches in. */
  scale?: number;
}

/** A title flattened for the export dialog's rasteriser. */
export interface ExportTitle {
  clipId: string;
  style: TextStyle;
  /** Offset from centred, as a fraction of the frame. */
  offsetX: number;
  offsetY: number;
  start: number;
  duration: number;
  /** Index into the track stack, zero being bottom-most. */
  track: number;
  /** The clip's transition into its cut, passed through to the export clip -
      titles take transitions like any visual once rasterised. */
  transitionIn?: NonNullable<Clip["transitionIn"]>;
  /** The clip's fades, which the export lowers to the PNG's opacity ramps. */
  fadeIn: number;
  fadeOut: number;
}

/** A transition in progress: the incoming clip's pre-roll, arriving. */
export interface PreviewGhost {
  clipId: string;
  path: string;
  time: number;
  speed: number;
  opacity: number;
  /**
   * Horizontal travel left, as a fraction of the frame: 1 enters from the
   * right edge, -1 from the left, 0 (absent) already there. Wipes and pushes
   * slide; a zoom leaves it at 0 and scales instead.
   */
  translateX?: number;
  /** Scale multiplier the arrival starts from, settling to 1. */
  scale?: number;
}

/** A push in progress: the outgoing picture being shown off the frame. */
export interface PreviewMainMotion {
  /** Travel as a fraction of the frame; negative leaves to the left. */
  translateX: number;
  scale?: number;
}

/** A fade-to-colour transition washing over the playhead. */
export interface PreviewVeil {
  color: string;
  opacity: number;
}

const depthIn = (timeline: TimelineData) => {
  return (trackId: string) => timeline.tracks.findIndex((track) => track.id === trackId);
};

/** Text clips at the playhead on visible tracks, bottom-most first. */
export function textOverlaysAt(
  project: EditorProject,
  timeline: TimelineData,
  playhead: number,
): TextOverlay[] {
  const depth = depthIn(timeline);
  return timeline.clips
    .filter((clip) => clip.kind === "text" && clip.text !== undefined)
    .filter((clip) => findTrack(project, clip.trackId)?.visible !== false)
    .flatMap((clip) => {
      const ends = clip.start + clip.duration;
      const onScreen = playhead >= clip.start && playhead < ends;

      // An overlap transition opens before the cut, so the incoming title
      // is already drawing during its window - the text twin of the video
      // ghost. A title has no source handle to clamp to.
      const transition =
        !onScreen && clip.transitionIn && OVERLAP_TRANSITIONS.has(clip.transitionIn.id)
          ? clip.transitionIn
          : null;
      const window = transition && precedingClip(project, clip.id) ? transition.duration : 0;
      const arriving = !onScreen && window > 0 && playhead >= clip.start - window && playhead < clip.start;
      if (!onScreen && !arriving) return [];

      let opacity = 1;
      let translateX = 0;
      let scale = 1;
      if (arriving && transition) {
        const progress = 1 - (clip.start - playhead) / window;
        if (transition.id === "cross-fade") {
          opacity *= progress;
        } else if (transition.id === "wipe-left" || transition.id === "push") {
          translateX = 1 - progress;
        } else if (transition.id === "wipe-right") {
          translateX = progress - 1;
        } else {
          opacity *= progress;
          scale = 1.25 - 0.25 * progress;
        }
      }

      // The title's own fades, once it is on screen - the same ramps the
      // export applies to the rasterised PNG. Before the cut the dissolve
      // above is the only ramp in play.
      if (onScreen) {
        const local = playhead - clip.start;
        if (clip.fadeIn > 0 && local < clip.fadeIn) {
          opacity *= Math.max(0, local / clip.fadeIn);
        }
        const remaining = ends - playhead;
        if (clip.fadeOut > 0 && remaining < clip.fadeOut) {
          opacity *= Math.max(0, remaining / clip.fadeOut);
        }
      }

      return [
        {
          clip,
          overlay: {
            clipId: clip.id,
            style: clip.text!,
            offsetX: clip.offsetX,
            offsetY: clip.offsetY,
            ...(opacity < 1 ? { opacity: Math.min(1, Math.max(0, opacity)) } : {}),
            ...(translateX !== 0 ? { translateX } : {}),
            ...(scale !== 1 ? { scale } : {}),
          },
        },
      ];
    })
    .sort((a, b) => depth(a.clip.trackId) - depth(b.clip.trackId))
    .map((entry) => entry.overlay);
}

/** The top-most visual clip under the playhead, mapped into its source. */
export function previewSourceAt(
  project: EditorProject,
  timeline: TimelineData,
  playhead: number,
): PreviewSource | null {
  const active = clipsAt(project, playhead).filter(
    (clip) => clip.kind !== "audio" && clip.kind !== "text",
  );
  if (active.length === 0) return null;
  const depth = depthIn(timeline);
  const top = active.reduce((best, clip) =>
    depth(clip.trackId) > depth(best.trackId) ? clip : best,
  );
  const media = findMedia(project, top.mediaId);
  if (!media) return null;
  return {
    clipId: top.id,
    path: media.path,
    time: top.sourceStart + (playhead - top.start) * top.speed,
    speed: top.speed,
    isStill: top.kind === "image",
  };
}

/**
 * The incoming half of an overlap transition under the playhead, if one is in
 * its window. The handle clamp mirrors the exporter's `resolve_transitions`
 * exactly: no handle, shorter transition. Cross-fades and zooms fade in;
 * wipes and pushes slide in opaque, from the side the exporter lowers.
 */
const OVERLAP_TRANSITIONS = new Set(["cross-fade", "wipe-left", "wipe-right", "push", "zoom"]);

export function previewGhostAt(
  project: EditorProject,
  timeline: TimelineData,
  playhead: number,
): PreviewGhost | null {
  for (const clip of timeline.clips) {
    const transition = clip.transitionIn;
    if (!transition || !OVERLAP_TRANSITIONS.has(transition.id)) continue;
    if (clip.kind !== "video" && clip.kind !== "image") continue;
    if (!precedingClip(project, clip.id)) continue;
    const handle =
      clip.kind === "image" ? Infinity : clip.sourceStart / Math.max(0.0625, clip.speed);
    const d = Math.min(transition.duration, handle);
    const cut = clip.start;
    if (d <= 0 || playhead < cut - d || playhead >= cut) continue;
    const media = findMedia(project, clip.mediaId);
    if (!media) continue;

    // How far through the window: 0 at the start of the pre-roll, 1 at the cut.
    const progress = 1 - (cut - playhead) / d;
    // How the picture arrives, per kind - the exporter's per-kind ramp.
    let translateX = 0;
    let scale = 1;
    let opacity = 1;
    if (transition.id === "cross-fade") {
      opacity = progress;
    } else if (transition.id === "wipe-left" || transition.id === "push") {
      translateX = 1 - progress;
    } else if (transition.id === "wipe-right") {
      translateX = progress - 1;
    } else {
      opacity = progress;
      scale = 1.25 - 0.25 * progress;
    }

    return {
      clipId: clip.id,
      path: media.path,
      time: Math.max(0, clip.sourceStart - (cut - playhead) * clip.speed),
      speed: clip.speed,
      opacity,
      ...(translateX !== 0 ? { translateX } : {}),
      ...(scale !== 1 ? { scale } : {}),
    };
  }
  return null;
}

/**
 * The displayed clip's picture fade at the playhead, as a 0..1 factor that
 * multiplies its opacity - the twin of the engine's `video_fade_factor`,
 * which the export and the paused monitor already apply. One fade fades
 * sound and picture together; this is the picture half for live playback.
 */
export function previewPictureFadeAt(
  project: EditorProject,
  timeline: TimelineData,
  playhead: number,
): number {
  const active = clipsAt(project, playhead).filter(
    (clip) => clip.kind !== "audio" && clip.kind !== "text",
  );
  if (active.length === 0) return 1;

  // The same pick the element preview makes: the top-most visual clip.
  const depth = depthIn(timeline);
  const displayed = active.reduce((best, clip) =>
    depth(clip.trackId) > depth(best.trackId) ? clip : best,
  );

  const local = playhead - displayed.start;
  let factor = 1;
  if (displayed.fadeIn > 0 && local < displayed.fadeIn) {
    factor *= Math.max(0, local / displayed.fadeIn);
  }
  const remaining = displayed.duration - local;
  if (displayed.fadeOut > 0 && remaining < displayed.fadeOut) {
    factor *= Math.max(0, remaining / displayed.fadeOut);
  }
  return Math.min(1, Math.max(0, factor));
}

/**
 * The outgoing picture's own motion under the playhead - a push showing it
 * off the frame - or null when the main element should sit still.
 */
export function previewMainMotionAt(
  project: EditorProject,
  timeline: TimelineData,
  playhead: number,
): PreviewMainMotion | null {
  for (const clip of timeline.clips) {
    const transition = clip.transitionIn;
    if (!transition || transition.id !== "push") continue;
    if (!precedingClip(project, clip.id)) continue;
    const cut = clip.start;
    const d = transition.duration;
    if (d <= 0 || playhead < cut - d || playhead >= cut) continue;

    // Leaves to the left at the same pace the incoming enters from the right.
    return { translateX: -(1 - (cut - playhead) / d) };
  }
  return null;
}

/** A fade-to-colour wash over the playhead, if a cut's window covers it. */
export function previewVeilAt(
  project: EditorProject,
  timeline: TimelineData,
  playhead: number,
): PreviewVeil | null {
  for (const clip of timeline.clips) {
    const transition = clip.transitionIn;
    if (!transition) continue;
    if (transition.id !== "fade-black" && transition.id !== "fade-white") continue;
    if (!precedingClip(project, clip.id)) continue;
    const half = transition.duration / 2;
    const cut = clip.start;
    if (playhead < cut - half || playhead > cut + half) continue;
    const opacity =
      playhead <= cut ? (playhead - (cut - half)) / half : (cut + half - playhead) / half;
    return {
      color: transition.id === "fade-white" ? "#ffffff" : "#000000",
      opacity: Math.min(1, Math.max(0, opacity)),
    };
  }
  return null;
}

/** The active timeline's titles, flattened for rasterisation at export. */
export function exportTitlesOf(project: EditorProject, timeline: TimelineData): ExportTitle[] {
  return timeline.clips.flatMap((clip) => {
    if (clip.kind !== "text" || !clip.text) return [];
    const track = findTrack(project, clip.trackId);
    const index = timeline.tracks.findIndex((candidate) => candidate.id === clip.trackId);
    if (!track || !track.visible || index < 0) return [];
    return [
      {
        clipId: clip.id,
        style: clip.text,
        offsetX: clip.offsetX,
        offsetY: clip.offsetY,
        start: clip.start,
        duration: clip.duration,
        track: index,
        ...(clip.transitionIn ? { transitionIn: clip.transitionIn } : {}),
        fadeIn: clip.fadeIn,
        fadeOut: clip.fadeOut,
      },
    ];
  });
}
