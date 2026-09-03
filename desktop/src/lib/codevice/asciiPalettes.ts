/**
 * ASCII color palettes + color modes.
 *
 * Ported from ActArtech/codeviceanim `COLOR_PALETTES` / `ColorModeType`,
 * adapted for Concat: gradient mixes foreground -> accent, neon derives
 * hue from luminance + position, video samples the real frame colors.
 */

export type AsciiColorModeId = "mono" | "video" | "gradient" | "neon";

export interface AsciiColorMode {
  id: AsciiColorModeId;
  labelKey: string;
}

export const ASCII_COLOR_MODES: readonly AsciiColorMode[] = [
  { id: "mono", labelKey: "beatsPanel.colorModeMono" },
  { id: "video", labelKey: "beatsPanel.colorModeVideo" },
  { id: "gradient", labelKey: "beatsPanel.colorModeGradient" },
  { id: "neon", labelKey: "beatsPanel.colorModeNeon" },
];

export interface AsciiPalette {
  id: string;
  labelKey: string;
  background: string;
  foreground: string;
  /** Gradient partner / secondary hue. */
  accent: string;
}

export const ASCII_PALETTES: readonly AsciiPalette[] = [
  {
    id: "deepSea",
    labelKey: "beatsPanel.paletteDeepSea",
    background: "#0b0f14",
    foreground: "#5ac8fa",
    accent: "#a78bfa",
  },
  {
    id: "vibrantCoral",
    labelKey: "beatsPanel.paletteVibrantCoral",
    background: "#fff9f2",
    foreground: "#ff6b6b",
    accent: "#2d3436",
  },
  {
    id: "hummingbirdOrange",
    labelKey: "beatsPanel.paletteHummingbird",
    background: "#faf7f2",
    foreground: "#f28c53",
    accent: "#3d1e0c",
  },
  {
    id: "cyberMatrix",
    labelKey: "beatsPanel.paletteCyberMatrix",
    background: "#090d12",
    foreground: "#00ff66",
    accent: "#008833",
  },
  {
    id: "mintTeal",
    labelKey: "beatsPanel.paletteMintTeal",
    background: "#fff9f2",
    foreground: "#4ecdc4",
    accent: "#ffe66d",
  },
  {
    id: "retroAmber",
    labelKey: "beatsPanel.paletteRetroAmber",
    background: "#1a0f00",
    foreground: "#ffb000",
    accent: "#996a00",
  },
  {
    id: "blueprintBlue",
    labelKey: "beatsPanel.paletteBlueprint",
    background: "#0b1d3a",
    foreground: "#4cc9f0",
    accent: "#4361ee",
  },
  {
    id: "highMonochrome",
    labelKey: "beatsPanel.paletteHighMono",
    background: "#000000",
    foreground: "#ffffff",
    accent: "#888888",
  },
];

export function asciiPaletteById(id: string | undefined): AsciiPalette {
  return ASCII_PALETTES.find((p) => p.id === id) ?? ASCII_PALETTES[0];
}

/** Animated per-cell motion styles for the ASCII field. */
export type AsciiMotionId = "none" | "wave" | "jitter" | "shimmer";

export interface AsciiMotion {
  id: AsciiMotionId;
  labelKey: string;
}

export const ASCII_MOTIONS: readonly AsciiMotion[] = [
  { id: "none", labelKey: "beatsPanel.motionNone" },
  { id: "wave", labelKey: "beatsPanel.motionWave" },
  { id: "jitter", labelKey: "beatsPanel.motionJitter" },
  { id: "shimmer", labelKey: "beatsPanel.motionShimmer" },
];

/** Parse `#rrggbb` into 0..255 components. Falls back to white. */
export function parseHexColor(hex: string): { r: number; g: number; b: number } {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return { r: 255, g: 255, b: 255 };
  const n = Number.parseInt(m[1], 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

/** Linear mix between two hex colors; t in 0..1. */
export function mixHexColors(a: string, b: string, t: number): string {
  const ca = parseHexColor(a);
  const cb = parseHexColor(b);
  const k = Math.max(0, Math.min(1, t));
  const r = Math.round(ca.r + (cb.r - ca.r) * k);
  const g = Math.round(ca.g + (cb.g - ca.g) * k);
  const bl = Math.round(ca.b + (cb.b - ca.b) * k);
  return `rgb(${r}, ${g}, ${bl})`;
}
