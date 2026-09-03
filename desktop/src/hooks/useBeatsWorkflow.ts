import { useCallback, useMemo, useRef, useState } from "react";

import { detectBeatsFromPcm, type BeatInfo } from "../lib/beatDetection";
import { beatPresetById, type BeatPresetId } from "../lib/beatPresets";
import { mediaBeatsToTimeline } from "../lib/beatTimeline";
import { t } from "../lib/i18n";
import { decodeAudioPcm } from "../lib/engine";
import type { Clip, MediaItem } from "../lib/editor";

/** Last offline beat analysis, keyed to the audio media it came from. */
export interface BeatAnalysis {
  mediaId: string;
  beats: BeatInfo[];
  /** Audio duration in seconds, used to loop images to the song end. */
  duration: number;
  /** Clip that owned the audio when analyzed, for remapping if needed. */
  clipId: string | null;
}

/**
 * The beats workflow: detection state, timeline beat marks, offset shifting,
 * BPM estimation, and the per-playhead audio level used by the "timeline"
 * ASCII drive mode. Selection of *which* audio to analyze stays with the
 * caller (it is project-selection logic) and comes in as a callback.
 */
export function useBeatsWorkflow(params: {
  resolveAudioForBeats: () => { media: MediaItem; clip: Clip | null } | null;
  pushToast: (message: string, failed: boolean) => void;
}) {
  const { resolveAudioForBeats, pushToast } = params;

  const [beatAnalysis, setBeatAnalysis] = useState<BeatAnalysis | null>(null);
  /** Editable beat marks on the timeline (seconds). Drawn, snapped, movable. */
  const [timelineBeats, setTimelineBeats] = useState<number[]>([]);
  const [analyzingBeats, setAnalyzingBeats] = useState(false);
  /** Which detection recipe Analyze beats uses. */
  const [beatPresetId, setBeatPresetId] = useState<BeatPresetId>("piano");
  /** Place an image every N beats (1 = every beat, 3 = every third). */
  const [beatsPerImage, setBeatsPerImage] = useState(1);
  /** Cycle selected images until the song / beat grid ends. */
  const [loopImagesUntilEnd, setLoopImagesUntilEnd] = useState(true);
  /** Global nudge applied to every detected beat mark, in milliseconds. */
  const [beatOffsetMs, setBeatOffsetMs] = useState(0);

  const beatPcmRef = useRef<{
    sampleRate: number;
    samples: Float32Array;
    toMediaTime: (time: number) => number;
  } | null>(null);

  const analyzeBeatsForSelection = useCallback(() => {
    const resolved = resolveAudioForBeats();
    if (!resolved || analyzingBeats) return;
    const { media, clip } = resolved;
    setAnalyzingBeats(true);
    void (async () => {
      try {
        const { sampleRate, samples } = await decodeAudioPcm(media.path, 22050);
        const speed = clip && clip.speed > 0 ? clip.speed : 1;
        const sourceStart = clip?.sourceStart ?? 0;
        const clipStart = clip?.start ?? 0;
        beatPcmRef.current = {
          sampleRate,
          samples,
          toMediaTime: (time) => sourceStart + (time - clipStart) * speed,
        };
        const beats = detectBeatsFromPcm(
          samples,
          sampleRate,
          beatPresetById(beatPresetId).settings,
        );
        const duration =
          media.duration && media.duration > 0
            ? media.duration
            : samples.length / sampleRate;
        const mediaTimes = beats.map((beat) => beat.time);
        const onTimeline = clip
          ? mediaBeatsToTimeline(mediaTimes, clip, duration)
          : mediaTimes;
        setBeatAnalysis({
          mediaId: media.id,
          beats,
          duration,
          clipId: clip?.id ?? null,
        });
        setTimelineBeats(onTimeline.map((time) => time + beatOffsetMs / 1000));
        const span =
          onTimeline.length > 0
            ? onTimeline[onTimeline.length - 1] - onTimeline[0]
            : 0;
        pushToast(
          t("toast.beatsDetectedSpan", {
            count: String(onTimeline.length),
            seconds: span.toFixed(1),
          }),
          false,
        );
      } catch (cause) {
        pushToast(String(cause), true);
      } finally {
        setAnalyzingBeats(false);
      }
    })();
  }, [resolveAudioForBeats, analyzingBeats, beatPresetId, beatOffsetMs, pushToast]);

  const audioLevelAt = useCallback((time: number) => {
    const pcm = beatPcmRef.current;
    if (!pcm) return 0;
    const mediaTime = pcm.toMediaTime(time);
    const center = Math.round(mediaTime * pcm.sampleRate);
    const halfWindow = Math.round(pcm.sampleRate * 0.05);
    const from = Math.max(0, center - halfWindow);
    const to = Math.min(pcm.samples.length, center + halfWindow);
    let sumSquares = 0;
    let count = 0;
    for (let i = from; i < to; i += 4) {
      sumSquares += pcm.samples[i] * pcm.samples[i];
      count += 1;
    }
    if (count === 0) return 0;
    return Math.min(1, Math.sqrt(sumSquares / count) * 3);
  }, []);

  const beatBpm = useMemo(() => {
    const gaps: number[] = [];
    for (let i = 1; i < timelineBeats.length; i++) {
      const gap = timelineBeats[i] - timelineBeats[i - 1];
      if (gap > 0.05) gaps.push(gap);
    }
    if (gaps.length === 0) return 0;
    gaps.sort((a, b) => a - b);
    const median = gaps[Math.floor(gaps.length / 2)];
    return median > 0 ? 60 / median : 0;
  }, [timelineBeats]);

  const handleBeatOffset = useCallback(
    (ms: number) => {
      const delta = (ms - beatOffsetMs) / 1000;
      setBeatOffsetMs(ms);
      setTimelineBeats((current) => current.map((time) => time + delta));
    },
    [beatOffsetMs],
  );

  const clearBeats = useCallback(() => {
    setTimelineBeats([]);
    setBeatAnalysis(null);
    beatPcmRef.current = null;
  }, []);

  return {
    beatAnalysis,
    timelineBeats,
    setTimelineBeats,
    analyzingBeats,
    beatPresetId,
    setBeatPresetId,
    beatsPerImage,
    setBeatsPerImage,
    loopImagesUntilEnd,
    setLoopImagesUntilEnd,
    beatOffsetMs,
    setBeatOffsetMs,
    analyzeBeatsForSelection,
    audioLevelAt,
    beatBpm,
    handleBeatOffset,
    clearBeats,
  };
}
