import { useEffect, useState } from "react";

import type {
  AsciiDriveMode,
  OverlaySurface,
} from "../components/AsciiLiveOverlay";
import type {
  AsciiColorModeId,
  AsciiMotionId,
} from "../lib/codevice/asciiPalettes";
import type {
  VisualizerLayoutId,
  VisualizerPresetId,
  VizColorModeId,
} from "../lib/codevice/musicVisualizer";

/**
 * Live-overlay (ASCII / music-visualizer) presentation state plus the mic
 * energy loop that drives it in voice / hybrid mode. Purely presentational:
 * the playback source, baking, and beat data all live with the caller.
 */
export function useAsciiOverlay() {
  /** Live overlay on the preview while scrubbing / playing. Off by default so Export does not surprise-bake. */
  const [asciiLivePreview, setAsciiLivePreview] = useState(false);
  const [asciiDriveMode, setAsciiDriveMode] = useState<AsciiDriveMode>("video");
  const [overlaySurface, setOverlaySurface] = useState<OverlaySurface>("visualizer");
  const [visualizerPreset, setVisualizerPreset] = useState<VisualizerPresetId>("particles");
  const [visualizerLayout, setVisualizerLayout] = useState<VisualizerLayoutId>("center");
  const [voiceLevel, setVoiceLevel] = useState(0);
  const [asciiColorMode, setAsciiColorMode] = useState<AsciiColorModeId>("mono");
  const [asciiPaletteId, setAsciiPaletteId] = useState("deepSea");
  const [asciiMotion, setAsciiMotion] = useState<AsciiMotionId>("none");
  const [vizColorMode, setVizColorMode] = useState<VizColorModeId>("mono");
  const [vizCount, setVizCount] = useState(0);

  // Mic / voice energy for live ASCII when mode is voice or hybrid.
  useEffect(() => {
    if (!asciiLivePreview || (asciiDriveMode !== "voice" && asciiDriveMode !== "hybrid")) {
      setVoiceLevel(0);
      return;
    }
    let cancelled = false;
    let raf = 0;
    let stream: MediaStream | null = null;
    let ctx: AudioContext | null = null;
    let analyser: AnalyserNode | null = null;

    void (async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        const AudioCtx =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        ctx = new AudioCtx();
        analyser = ctx.createAnalyser();
        analyser.fftSize = 256;
        ctx.createMediaStreamSource(stream).connect(analyser);
        const data = new Uint8Array(analyser.frequencyBinCount);
        const tick = () => {
          if (cancelled || !analyser) return;
          analyser.getByteFrequencyData(data);
          let sum = 0;
          for (let i = 0; i < data.length; i++) sum += data[i];
          setVoiceLevel(Math.min(1, sum / (data.length * 180)));
          raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
      } catch {
        if (!cancelled) setVoiceLevel(0);
      }
    })();

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      stream?.getTracks().forEach((track) => track.stop());
      void ctx?.close();
    };
  }, [asciiLivePreview, asciiDriveMode]);

  return {
    asciiLivePreview,
    setAsciiLivePreview,
    asciiDriveMode,
    setAsciiDriveMode,
    overlaySurface,
    setOverlaySurface,
    visualizerPreset,
    setVisualizerPreset,
    visualizerLayout,
    setVisualizerLayout,
    voiceLevel,
    setVoiceLevel,
    asciiColorMode,
    setAsciiColorMode,
    asciiPaletteId,
    setAsciiPaletteId,
    asciiMotion,
    setAsciiMotion,
    vizColorMode,
    setVizColorMode,
    vizCount,
    setVizCount,
  };
}
