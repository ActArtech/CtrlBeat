/**
 * Procedural code-symbol field for Concat, inspired by ActArtech/codeviceanim.
 *
 * Does not require a video source: fills a canvas with glyphs that densify and
 * brighten with `intensity` (0..1 from the beat pulse).
 */

import { symbolSetById, type SymbolSetId } from "./symbolSets";
import { pulsedDensity, pulsedGridSize } from "./beatPulse";

export interface BeatSymbolRenderOptions {
  width: number;
  height: number;
  /** 0..1 beat hit strength. */
  intensity: number;
  symbolSetId: SymbolSetId;
  background?: string;
  foreground?: string;
  /** Base cell size before pulse. Default 14. */
  baseGridSize?: number;
  /** Seed so consecutive frames look related. */
  seed?: number;
}

function hash(n: number): number {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

/**
 * Draws a beat-reactive symbol field onto `canvas` and returns it.
 */
export function renderBeatSymbols(
  canvas: HTMLCanvasElement,
  options: BeatSymbolRenderOptions,
): HTMLCanvasElement {
  const width = Math.max(16, Math.floor(options.width));
  const height = Math.max(16, Math.floor(options.height));
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d", { alpha: false });
  if (!ctx) return canvas;

  const bg = options.background ?? "#0b0f14";
  const fg = options.foreground ?? "#5ac8fa";
  const intensity = Math.max(0, Math.min(1, options.intensity));
  const grid = pulsedGridSize(options.baseGridSize ?? 14, intensity);
  const density = pulsedDensity(0.35, intensity);
  const chars = symbolSetById(options.symbolSetId).chars;
  const seed = options.seed ?? 1;

  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, width, height);

  const fontSize = Math.max(8, Math.floor(grid * 0.85));
  ctx.font = `bold ${fontSize}px "Courier New", Courier, monospace`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  const cols = Math.floor(width / grid);
  const rows = Math.floor(height / grid);

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const n = hash(seed * 0.1 + r * 12.9898 + c * 78.233);
      // More cells light up on the beat.
      if (n > density) continue;

      const charIdx = Math.min(
        chars.length - 1,
        Math.floor(hash(seed + r * 4.1 + c * 9.3) * chars.length),
      );
      const glyph = chars[charIdx] ?? "·";
      if (glyph === " ") continue;

      const bright = 0.45 + intensity * 0.55 + n * 0.15;
      ctx.globalAlpha = Math.max(0.25, Math.min(1, bright));
      ctx.fillStyle = fg;
      const x = c * grid + grid / 2;
      const y = r * grid + grid / 2;
      // Tiny jitter on the beat for a glitch feel.
      const jx = intensity > 0.6 ? (hash(seed + c) - 0.5) * 2 : 0;
      const jy = intensity > 0.6 ? (hash(seed + r) - 0.5) * 2 : 0;
      ctx.fillText(glyph, x + jx, y + jy);
    }
  }

  ctx.globalAlpha = 1;
  return canvas;
}

/** Canvas -> JPEG bytes for the project cache. */
export async function canvasToJpegBytes(
  canvas: HTMLCanvasElement,
  quality = 0.92,
): Promise<Uint8Array> {
  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob((value) => resolve(value), "image/jpeg", quality);
  });
  if (!blob) throw new Error("could not encode code-symbol frame");
  return new Uint8Array(await blob.arrayBuffer());
}
