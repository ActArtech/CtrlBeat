/**
 * Beat-driven music visualizer (inspired by ActArtech/codeviceanim generators).
 *
 * Screen-adaptive: layouts scale to the output frame. Presets are pure canvas
 * draws driven by `intensity` (beat pulse) and optional `voice` (0..1).
 */

import { mixHexColors } from "./asciiPalettes";

export type VisualizerPresetId =
  | "particles"
  | "radialPulse"
  | "kaleidoscope"
  | "lissajous"
  | "orbit";

export type VisualizerLayoutId = "center" | "corners" | "fractal";

export type VizColorModeId = "mono" | "gradient" | "neon";

export interface VisualizerPreset {
  id: VisualizerPresetId;
  labelKey: string;
  description: string;
}

export interface VisualizerLayout {
  id: VisualizerLayoutId;
  labelKey: string;
}

export const VISUALIZER_PRESETS: readonly VisualizerPreset[] = [
  {
    id: "particles",
    labelKey: "beatsPanel.vizParticles",
    description: "Bursting particle field that expands on each beat.",
  },
  {
    id: "radialPulse",
    labelKey: "beatsPanel.vizRadial",
    description: "Center core with circular spectrum spikes (codeviceanim radial).",
  },
  {
    id: "kaleidoscope",
    labelKey: "beatsPanel.vizKaleidoscope",
    description: "Mirrored wedge pattern that blooms with the beat.",
  },
  {
    id: "lissajous",
    labelKey: "beatsPanel.vizLissajous",
    description: "Harmonic curve loops (sonic Lissajous).",
  },
  {
    id: "orbit",
    labelKey: "beatsPanel.vizOrbit",
    description: "Orbiting particle ring with beat-scaled radius.",
  },
];

export const VISUALIZER_LAYOUTS: readonly VisualizerLayout[] = [
  {
    id: "center",
    labelKey: "beatsPanel.layoutCenter",
  },
  {
    id: "corners",
    labelKey: "beatsPanel.layoutCorners",
  },
  {
    id: "fractal",
    labelKey: "beatsPanel.layoutFractal",
  },
];

export interface VisualizerRenderOptions {
  width: number;
  height: number;
  /** Seconds on the timeline / scrub clock. */
  time: number;
  /** 0..1 beat hit. */
  intensity: number;
  /** 0..1 optional mic / audio energy. */
  voice?: number;
  preset: VisualizerPresetId;
  layout: VisualizerLayoutId;
  background?: string;
  foreground?: string;
  accent?: string;
  /** mono = single color; gradient = foreground->accent ramp; neon = cycling hue. */
  colorMode?: VizColorModeId;
  /** Explicit element count, clamped 8..2000 (smooth even at 1000). Undefined = preset default. */
  count?: number;
}

/**
 * Draws one visualizer frame. Safe to call every animation tick.
 */
export function renderMusicVisualizer(
  canvas: HTMLCanvasElement,
  options: VisualizerRenderOptions,
): void {
  const width = Math.max(16, Math.floor(options.width));
  const height = Math.max(16, Math.floor(options.height));
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d", { alpha: false });
  if (!ctx) return;

  const bg = options.background ?? "#05070b";
  const fg = options.foreground ?? "#e8f4ff";
  const accent = options.accent ?? mixHexColors(fg, "#ffffff", 0.55);
  const colorMode = options.colorMode ?? "mono";
  const count =
    options.count === undefined ? undefined : Math.max(8, Math.min(2000, Math.floor(options.count)));
  const intensity = clamp01(options.intensity);
  const voice = clamp01(options.voice ?? 0);
  const energy = Math.max(intensity, voice * 0.9);
  const t = options.time;

  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, width, height);
  ctx.fillStyle = fg;
  ctx.strokeStyle = fg;

  const paint = makeElementPaint(fg, accent, colorMode, t);
  const cells = layoutCells(width, height, options.layout);
  for (const cell of cells) {
    ctx.save();
    ctx.beginPath();
    ctx.rect(cell.x, cell.y, cell.w, cell.h);
    ctx.clip();
    ctx.translate(cell.x, cell.y);
    if (cell.mirrorX || cell.mirrorY) {
      ctx.translate(cell.mirrorX ? cell.w : 0, cell.mirrorY ? cell.h : 0);
      ctx.scale(cell.mirrorX ? -1 : 1, cell.mirrorY ? -1 : 1);
    }
    if (cell.rotate) {
      ctx.translate(cell.w / 2, cell.h / 2);
      ctx.rotate(cell.rotate);
      ctx.translate(-cell.w / 2, -cell.h / 2);
    }
    drawPreset(ctx, cell.w, cell.h, t, energy, intensity, voice, options.preset, paint, count, cells.length);
    ctx.restore();
  }
}

interface LayoutCell {
  x: number;
  y: number;
  w: number;
  h: number;
  mirrorX?: boolean;
  mirrorY?: boolean;
  rotate?: number;
}

function layoutCells(
  width: number,
  height: number,
  layout: VisualizerLayoutId,
): LayoutCell[] {
  if (layout === "center") {
    return [{ x: 0, y: 0, w: width, h: height }];
  }
  if (layout === "corners") {
    const hw = Math.floor(width / 2);
    const hh = Math.floor(height / 2);
    return [
      { x: 0, y: 0, w: hw, h: hh },
      { x: hw, y: 0, w: width - hw, h: hh, mirrorX: true },
      { x: 0, y: hh, w: hw, h: height - hh, mirrorY: true },
      { x: hw, y: hh, w: width - hw, h: height - hh, mirrorX: true, mirrorY: true },
    ];
  }
  // Fractal / kaleidoscope: 8 wedges approximated as mirrored quadrants + rotation.
  const hw = Math.floor(width / 2);
  const hh = Math.floor(height / 2);
  return [
    { x: 0, y: 0, w: hw, h: hh },
    { x: hw, y: 0, w: width - hw, h: hh, mirrorX: true },
    { x: 0, y: hh, w: hw, h: height - hh, mirrorY: true },
    { x: hw, y: hh, w: width - hw, h: height - hh, mirrorX: true, mirrorY: true },
    { x: 0, y: 0, w: hw, h: hh, rotate: Math.PI / 4 },
    { x: hw, y: 0, w: width - hw, h: hh, mirrorX: true, rotate: Math.PI / 4 },
    { x: 0, y: hh, w: hw, h: height - hh, mirrorY: true, rotate: Math.PI / 4 },
    {
      x: hw,
      y: hh,
      w: width - hw,
      h: height - hh,
      mirrorX: true,
      mirrorY: true,
      rotate: Math.PI / 4,
    },
  ];
}

type ElementPaint = (i: number, total: number) => string;

function makeElementPaint(
  fg: string,
  accent: string,
  colorMode: VizColorModeId,
  t: number,
): ElementPaint {
  if (colorMode === "gradient") {
    return (i, total) => mixHexColors(fg, accent, total <= 1 ? 0 : i / (total - 1));
  }
  if (colorMode === "neon") {
    return (i, total) =>
      `hsl(${Math.floor((((i / Math.max(1, total)) * 360 + t * 40) % 360) + 360) % 360}, 100%, 60%)`;
  }
  return () => fg;
}

function drawPreset(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  t: number,
  energy: number,
  intensity: number,
  voice: number,
  preset: VisualizerPresetId,
  paint: ElementPaint,
  count: number | undefined,
  cellCount: number,
): void {
  switch (preset) {
    case "radialPulse":
      drawRadialPulse(ctx, w, h, t, energy, voice, paint, count);
      break;
    case "kaleidoscope":
      drawKaleidoscope(ctx, w, h, t, energy, paint, count, cellCount);
      break;
    case "lissajous":
      drawLissajous(ctx, w, h, t, energy, paint, count);
      break;
    case "orbit":
      drawOrbit(ctx, w, h, t, energy, paint, count);
      break;
    default:
      drawParticles(ctx, w, h, t, energy, intensity, paint, count);
      break;
  }
}

function drawParticles(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  t: number,
  energy: number,
  intensity: number,
  paint: ElementPaint,
  countOpt: number | undefined,
): void {
  const cx = w / 2;
  const cy = h / 2;
  const count = countOpt ?? Math.floor(80 + energy * 160);
  const burst = 0.35 + intensity * 1.4;
  for (let i = 0; i < count; i++) {
    const seed = i * 12.9898;
    const angle = hash(seed) * Math.PI * 2 + t * (0.4 + hash(seed + 1) * 1.2);
    const radius =
      (0.08 + hash(seed + 2) * 0.42) * Math.min(w, h) * burst +
      Math.sin(t * 3 + i) * 8 * energy;
    const x = cx + Math.cos(angle) * radius;
    const y = cy + Math.sin(angle) * radius;
    const size = 1.2 + hash(seed + 3) * 3.5 * (0.5 + energy);
    ctx.fillStyle = paint(i, count);
    ctx.globalAlpha = 0.35 + energy * 0.65;
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

function drawRadialPulse(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  t: number,
  energy: number,
  voice: number,
  paint: ElementPaint,
  countOpt: number | undefined,
): void {
  const cx = w / 2;
  const cy = h / 2;
  const minSide = Math.min(w, h);
  const baseRadius = minSide * (0.16 + energy * 0.1);
  const numBars = countOpt ?? 72;

  ctx.beginPath();
  ctx.arc(cx, cy, baseRadius * 0.45 + voice * minSide * 0.04, 0, Math.PI * 2);
  ctx.fill();

  for (let i = 0; i < numBars; i++) {
    const angle = (i / numBars) * Math.PI * 2;
    const freqAmp = Math.sin(i * 0.5 + t * 4) * 0.5 + 0.5;
    const barHeight = minSide * (0.02 + freqAmp * 0.08 * (1 + energy * 2.2));
    const x1 = cx + Math.cos(angle) * baseRadius;
    const y1 = cy + Math.sin(angle) * baseRadius;
    const x2 = cx + Math.cos(angle) * (baseRadius + barHeight);
    const y2 = cy + Math.sin(angle) * (baseRadius + barHeight);
    const style = paint(i, numBars);
    ctx.fillStyle = style;
    ctx.strokeStyle = style;
    ctx.lineWidth = Math.max(1.5, minSide * 0.004);
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(x2, y2, Math.max(1.5, minSide * 0.004), 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawKaleidoscope(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  t: number,
  energy: number,
  paint: ElementPaint,
  countOpt: number | undefined,
  cellCount: number,
): void {
  const cx = w / 2;
  const cy = h / 2;
  const wedges = 10;
  const arms = countOpt ? Math.max(3, Math.round(countOpt / Math.max(1, cellCount) / wedges)) : 18;
  const total = wedges * arms;
  for (let wdg = 0; wdg < wedges; wdg++) {
    const base = (wdg / wedges) * Math.PI * 2 + t * 0.35;
    for (let a = 0; a < arms; a++) {
      const angle = base + (a / arms) * (Math.PI / wedges);
      const len =
        Math.min(w, h) *
        (0.12 + energy * 0.35 + Math.sin(t * 2 + a + wdg) * 0.05);
      const x = cx + Math.cos(angle) * len;
      const y = cy + Math.sin(angle) * len;
      const style = paint(wdg * arms + a, total);
      ctx.fillStyle = style;
      ctx.strokeStyle = style;
      ctx.globalAlpha = 0.4 + energy * 0.6;
      ctx.beginPath();
      ctx.arc(x, y, 1.5 + energy * 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(x, y);
      ctx.stroke();
    }
  }
  ctx.globalAlpha = 1;
}

function drawLissajous(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  t: number,
  energy: number,
  paint: ElementPaint,
  countOpt: number | undefined,
): void {
  const cx = w / 2;
  const cy = h / 2;
  const scaleX = w * (0.28 + energy * 0.12);
  const scaleY = h * (0.28 + energy * 0.12);
  const a = 3;
  const b = 4;
  const delta = t * (1.2 + energy);
  const total = countOpt ?? 280;
  for (let i = 0; i < total; i++) {
    const phi = (i / total) * Math.PI * 2;
    const x = cx + Math.sin(a * phi + delta) * scaleX;
    const y = cy + Math.sin(b * phi) * scaleY;
    const size = 1.5 + Math.sin(phi * 6 + t * 3) * (1 + energy * 2);
    ctx.fillStyle = paint(i, total);
    ctx.beginPath();
    ctx.arc(x, y, Math.max(1, size), 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawOrbit(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  t: number,
  energy: number,
  paint: ElementPaint,
  countOpt: number | undefined,
): void {
  const cx = w / 2;
  const cy = h / 2;
  const count = countOpt ?? 120;
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2 + t * (0.5 + energy);
    const wave = Math.sin(angle * 4 + t * 2) * (20 + energy * 30);
    const radius = Math.min(w, h) * (0.18 + energy * 0.12) + wave;
    const x = cx + Math.cos(angle) * radius;
    const y = cy + Math.sin(angle) * radius;
    const size = 2 + Math.abs(Math.sin(i + t)) * (4 + energy * 6);
    ctx.fillStyle = paint(i, count);
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fill();
  }
}

function hash(n: number): number {
  const x = Math.sin(n) * 43758.5453;
  return x - Math.floor(x);
}

function clamp01(n: number): number {
  return Math.max(0, Math.min(1, n));
}
