/**
 * Offline beat detection from mono PCM.
 *
 * Energy windows plus an adaptive onset gate (local energy vs a trailing
 * average) so quiet later sections of a song still register. Optional
 * interval smoothing is light and uses the last *kept* beat so a tempo
 * change mid-track does not erase the rest of the song.
 */

export type BeatStrategy =
  | "all-frequencies"
  | "bass-heavy"
  | "vocal-range"
  | "high-energy"
  | "saxophone"
  | "piano";

export interface BeatInfo {
  /** Seconds from the start of the buffer. */
  time: number;
  /** Relative strength in 0..1. */
  intensity: number;
}

export interface BeatDetectSettings {
  sensitivity?: number;
  minBeatInterval?: number;
  energyThreshold?: number;
  /** Analysis window length in seconds. Default 0.05. */
  windowSeconds?: number;
  strategy?: BeatStrategy;
  /**
   * How strongly a window must exceed the local average to count as an onset.
   * 1.3 = 30% above recent average. Lower = more beats.
   */
  onsetRatio?: number;
  /** Disable interval smoothing (keeps every onset past the min-interval gate). */
  smooth?: boolean;
}

const DEFAULTS = {
  sensitivity: 1.0,
  minBeatInterval: 0.25,
  energyThreshold: 0.15,
  windowSeconds: 0.05,
  strategy: "all-frequencies" as BeatStrategy,
  onsetRatio: 1.35,
  smooth: true,
};

/**
 * Detects beats in a mono PCM buffer.
 *
 * Walks the entire buffer - there is no early exit - so a three-minute song
 * is analyzed end to end.
 */
export function detectBeatsFromPcm(
  samples: Float32Array | ArrayLike<number>,
  sampleRate: number,
  settings: BeatDetectSettings = {},
): BeatInfo[] {
  if (sampleRate <= 0 || samples.length === 0) return [];

  const sensitivity = settings.sensitivity ?? DEFAULTS.sensitivity;
  const minBeatInterval = settings.minBeatInterval ?? DEFAULTS.minBeatInterval;
  const energyThreshold = settings.energyThreshold ?? DEFAULTS.energyThreshold;
  const windowSeconds = settings.windowSeconds ?? DEFAULTS.windowSeconds;
  const strategy = settings.strategy ?? DEFAULTS.strategy;
  const onsetRatio = settings.onsetRatio ?? DEFAULTS.onsetRatio;
  const smooth = settings.smooth ?? DEFAULTS.smooth;

  const samplesPerWindow = Math.max(1, Math.floor(windowSeconds * sampleRate));
  const floor = energyThreshold * sensitivity * 0.35;
  const beats: BeatInfo[] = [];
  let lastBeatTime = -minBeatInterval;

  // Trailing average of recent window energies (adaptive gate).
  let avgEnergy = 0;
  let avgInitialized = false;
  const avgAlpha = 0.15;

  for (let i = 0; i + samplesPerWindow <= samples.length; i += samplesPerWindow) {
    const time = i / sampleRate;
    const window = sliceWindow(samples, i, samplesPerWindow);
    const energy = calculateEnergy(window, sampleRate, strategy);

    if (!avgInitialized) {
      avgEnergy = Math.max(energy, floor);
      avgInitialized = true;
    } else {
      avgEnergy = avgEnergy * (1 - avgAlpha) + energy * avgAlpha;
    }

    const localGate = Math.max(floor, avgEnergy * onsetRatio * sensitivity);
    const absoluteGate = energyThreshold * sensitivity;
    const isOnset = energy > localGate || energy > absoluteGate;

    if (isOnset && time - lastBeatTime >= minBeatInterval) {
      beats.push({
        time,
        intensity: Math.min(energy * 2, 1),
      });
      lastBeatTime = time;
      // After a hit, raise the average so immediate re-triggers need more energy.
      avgEnergy = Math.max(avgEnergy, energy);
    }
  }

  return smooth ? smoothBeats(beats) : beats;
}

function sliceWindow(
  samples: Float32Array | ArrayLike<number>,
  start: number,
  length: number,
): Float32Array {
  if (samples instanceof Float32Array) {
    return samples.subarray(start, start + length);
  }
  const out = new Float32Array(length);
  for (let i = 0; i < length; i++) out[i] = samples[start + i] ?? 0;
  return out;
}

function calculateEnergy(
  data: Float32Array,
  sampleRate: number,
  strategy: BeatStrategy,
): number {
  switch (strategy) {
    case "bass-heavy":
      return bandEnergy(data, 20, 150, sampleRate);
    case "vocal-range":
      return bandEnergy(data, 200, 3500, sampleRate);
    case "high-energy":
      return bandEnergy(data, 2000, 8000, sampleRate);
    case "saxophone":
      return bandEnergy(data, 200, 2000, sampleRate) * 1.2;
    case "piano": {
      const low = bandEnergy(data, 27.5, 500, sampleRate);
      const high = bandEnergy(data, 500, 4200, sampleRate);
      return (low + high) / 2;
    }
    default: {
      let sum = 0;
      for (const sample of data) sum += Math.abs(sample);
      return data.length === 0 ? 0 : sum / data.length;
    }
  }
}

/**
 * Crude time-domain stand-in for a band: weight samples by a raised-cosine
 * envelope whose period matches the mid frequency of the band. Good enough
 * for offline slideshow sync without an FFT dependency in the UI bundle.
 */
function bandEnergy(
  data: Float32Array,
  startFreq: number,
  endFreq: number,
  sampleRate: number,
): number {
  if (data.length === 0 || sampleRate <= 0) return 0;
  const mid = (startFreq + endFreq) / 2;
  const omega = (2 * Math.PI * mid) / sampleRate;
  let sum = 0;
  for (let i = 0; i < data.length; i++) {
    const weight = 0.5 + 0.5 * Math.cos(omega * i);
    sum += Math.abs(data[i]) * weight;
  }
  return sum / data.length;
}

/**
 * Light cleanup using the last *kept* beat. Wide tolerance so a piano rubato
 * or a breakdown does not wipe the rest of the track.
 */
function smoothBeats(beats: BeatInfo[]): BeatInfo[] {
  if (beats.length < 2) return beats;

  const kept: BeatInfo[] = [beats[0]];
  const intervals: number[] = [];

  for (let i = 1; i < beats.length; i++) {
    const beat = beats[i];
    const interval = beat.time - kept[kept.length - 1].time;
    if (intervals.length < 4) {
      kept.push(beat);
      intervals.push(interval);
      continue;
    }
    const avg = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    // Very permissive: keep almost everything past min spacing already applied.
    if (interval >= avg * 0.25 && interval <= avg * 3.5) {
      kept.push(beat);
      intervals.push(interval);
      if (intervals.length > 12) intervals.shift();
    }
  }
  return kept;
}

/**
 * Builds a mono PCM buffer with unit-energy pulses at the given times.
 * Used by tests as a deterministic fixture.
 */
export function syntheticPulsePcm(
  pulseTimes: readonly number[],
  sampleRate: number,
  durationSeconds: number,
  pulseWidthSeconds = 0.02,
): Float32Array {
  const total = Math.max(1, Math.floor(durationSeconds * sampleRate));
  const samples = new Float32Array(total);
  const halfWidth = Math.max(1, Math.floor((pulseWidthSeconds * sampleRate) / 2));
  for (const time of pulseTimes) {
    const center = Math.floor(time * sampleRate);
    for (let i = center - halfWidth; i <= center + halfWidth; i++) {
      if (i >= 0 && i < total) samples[i] = 1;
    }
  }
  return samples;
}
