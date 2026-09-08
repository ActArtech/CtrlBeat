/**
 * Shared helpers for effect slices (preview + chain).
 */
import { t } from "../i18n";
import type { FilterParam } from "../filters";

export type EffectCategory = "basic" | "blur" | "color" | "stylize" | "distort";
export type TransitionCategory = "basic" | "motion";

export const percent = (value: number) => `${Math.round(value)}%`;
export const pixels = (value: number) => `${Math.round(value)} px`;
export const times = (value: number) => `${value.toFixed(2)}x`;
export const kelvin = (value: number) => `${Math.round(value)} K`;

export function temperatureMatrix(kelvinIn: number): string {
  const t = Math.min(400, Math.max(10, kelvinIn / 100));
  let r: number;
  let g: number;
  let b: number;
  if (t <= 66) {
    r = 255;
    g = 99.4708 * Math.log(t) - 161.1196;
    b = t <= 19 ? 0 : 138.5177 * Math.log(t - 10) - 305.0448;
  } else {
    r = 329.6987 * Math.pow(t - 60, -0.1332047);
    g = 288.1222 * Math.pow(t - 60, -0.0755148);
    b = 255;
  }
  const clamp = (value: number) => Math.min(255, Math.max(0, value)) / 255;
  const peak = Math.max(clamp(r), clamp(g), clamp(b), 1e-6);
  const [nr, ng, nb] = [clamp(r) / peak, clamp(g) / peak, clamp(b) / peak];
  return (
    `<feColorMatrix type="matrix" values="` +
    `${nr.toFixed(4)} 0 0 0 0  0 ${ng.toFixed(4)} 0 0 0  0 0 ${nb.toFixed(4)} 0 0  0 0 0 1 0"/>`
  );
}

let grainTile: string | null = null;
export function grainDataUri(): string {
  if (grainTile !== null) return grainTile;
  if (typeof document === "undefined") return (grainTile = "");
  const canvas = document.createElement("canvas");
  canvas.width = 128;
  canvas.height = 128;
  const context = canvas.getContext("2d");
  if (!context) return (grainTile = "");
  const image = context.createImageData(128, 128);
  for (let at = 0; at < image.data.length; at += 4) {
    const value = Math.floor(Math.random() * 256);
    image.data[at] = value;
    image.data[at + 1] = value;
    image.data[at + 2] = value;
    image.data[at + 3] = 255;
  }
  context.putImageData(image, 0, 0);
  return (grainTile = canvas.toDataURL());
}

export { t };
export type { FilterParam };
