/**
 * Video / image frame -> ASCII / symbol field.
 *
 * Ported from ActArtech/codeviceanim `processFrameToAscii` (core path):
 * sample source luminance on a grid, map density to a character set, draw.
 */

import {
  mixHexColors,
  type AsciiColorModeId,
  type AsciiMotionId,
} from "./asciiPalettes";
import { DEFAULT_ASCII_PALETTE, symbolSetById, type SymbolSetId } from "./symbolSets";

export interface VideoAsciiSettings {
  symbolSetId: SymbolSetId;
  gridSize: number;
  brightness?: number;
  contrast?: number;
  invert?: boolean;
  fontSizeRatio?: number;
  background?: string;
  foreground?: string;
  /** mono = single fg color; video = sample frame colors; gradient = fg->accent; neon = luminance hue. */
  colorMode?: AsciiColorModeId;
  accent?: string;
  /** Animated motion style (requires `time`). */
  motion?: AsciiMotionId;
  /** Seconds clock used by motion styles. */
  time?: number;
  /** Enable directional slash edges (techMap style). */
  enableEdgeSlashes?: boolean;
  edgeSensitivity?: number;
}

export interface VideoAsciiResult {
  cols: number;
  rows: number;
}

/**
 * Renders `source` (video frame or still image canvas/img) as symbol art.
 */
export function processFrameToAscii(
  source: CanvasImageSource,
  outputCanvas: HTMLCanvasElement,
  settings: VideoAsciiSettings,
  offscreenCanvas: HTMLCanvasElement,
): VideoAsciiResult {
  const ctx = outputCanvas.getContext("2d", { alpha: false });
  const offCtx = offscreenCanvas.getContext("2d", { willReadFrequently: true });
  if (!ctx || !offCtx) return { cols: 0, rows: 0 };

  let srcW = 640;
  let srcH = 360;
  if (source instanceof HTMLVideoElement) {
    srcW = source.videoWidth || 640;
    srcH = source.videoHeight || 360;
  } else if (source instanceof HTMLImageElement) {
    srcW = source.naturalWidth || source.width || 640;
    srcH = source.naturalHeight || source.height || 360;
  } else if (source instanceof HTMLCanvasElement) {
    srcW = source.width;
    srcH = source.height;
  }

  const outputWidth = outputCanvas.width;
  const outputHeight = outputCanvas.height;
  const gridSize = Math.max(4, settings.gridSize);
  const cols = Math.floor(outputWidth / gridSize);
  const rows = Math.floor(outputHeight / gridSize);
  if (cols <= 0 || rows <= 0) return { cols: 0, rows: 0 };

  if (offscreenCanvas.width !== cols || offscreenCanvas.height !== rows) {
    offscreenCanvas.width = cols;
    offscreenCanvas.height = rows;
  }

  offCtx.fillStyle = "#000000";
  offCtx.fillRect(0, 0, cols, rows);
  offCtx.drawImage(source, 0, 0, srcW, srcH, 0, 0, cols, rows);

  let frameData: ImageData;
  try {
    frameData = offCtx.getImageData(0, 0, cols, rows);
  } catch {
    return { cols: 0, rows: 0 };
  }
  const pixels = frameData.data;

  const bg = settings.background ?? DEFAULT_ASCII_PALETTE.background;
  const fg = settings.foreground ?? DEFAULT_ASCII_PALETTE.foreground;
  const colorMode = settings.colorMode ?? "mono";
  const accent = settings.accent ?? mixHexColors(fg, "#ffffff", 0.55);
  const motion = settings.motion ?? "none";
  const time = settings.time ?? 0;
  const chars = symbolSetById(settings.symbolSetId).chars;
  const charCount = chars.length;

  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, outputWidth, outputHeight);
  let currentStyle = bg;

  const fontSize = Math.max(6, Math.floor(gridSize * (settings.fontSizeRatio ?? 0.9)));
  ctx.font = `bold ${fontSize}px "Courier New", Courier, monospace`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  const contrast = settings.contrast ?? 0;
  const contrastFactor = (259 * (contrast + 255)) / (255 * (259 - contrast));
  const brightnessOffset = settings.brightness ?? 0;
  const invert = settings.invert === true;
  const edgeThresh = (100 - (settings.edgeSensitivity ?? 50)) * 1.5;
  const edgeSlashes =
    settings.enableEdgeSlashes !== false && settings.symbolSetId === "techMap";

  const rowColors: string[] = [];
  if (colorMode === "gradient") {
    for (let r = 0; r < rows; r++) {
      rowColors.push(mixHexColors(fg, accent, rows <= 1 ? 0 : r / (rows - 1)));
    }
  }

  const getLum = (x: number, y: number) => {
    const cx = Math.max(0, Math.min(cols - 1, x));
    const cy = Math.max(0, Math.min(rows - 1, y));
    const idx = (cy * cols + cx) * 4;
    const r = pixels[idx] ?? 0;
    const g = pixels[idx + 1] ?? 0;
    const b = pixels[idx + 2] ?? 0;
    let l = 0.299 * r + 0.587 * g + 0.114 * b;
    l = contrastFactor * (l - 128) + 128 + brightnessOffset;
    l = Math.max(0, Math.min(255, l));
    if (invert) l = 255 - l;
    return l;
  };

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const lum = getLum(c, r);
      let selectedSymbol = " ";

      if (lum > 15) {
        let isEdge = false;
        if (edgeSlashes) {
          const lTL = getLum(c - 1, r - 1);
          const lTR = getLum(c + 1, r - 1);
          const lBL = getLum(c - 1, r + 1);
          const lBR = getLum(c + 1, r + 1);
          const lL = getLum(c - 1, r);
          const lR = getLum(c + 1, r);
          const lT = getLum(c, r - 1);
          const lB = getLum(c, r + 1);
          const diag1 = Math.abs(lBL - lTR);
          const diag2 = Math.abs(lTL - lBR);
          const horiz = Math.abs(lL - lR);
          const vert = Math.abs(lT - lB);
          const maxGrad = Math.max(diag1, diag2, horiz, vert);
          if (maxGrad > edgeThresh) {
            isEdge = true;
            if (maxGrad === diag1) selectedSymbol = "/";
            else if (maxGrad === diag2) selectedSymbol = "\\";
            else if (maxGrad === horiz) selectedSymbol = lum < 120 ? "_" : "-";
            else selectedSymbol = "|";
          }
        }
        if (!isEdge) {
          const normLum = lum / 255;
          let charIdx = Math.min(charCount - 1, Math.floor((1 - normLum) * charCount));
          if (motion === "shimmer") {
            charIdx = (charIdx + Math.max(0, Math.floor(time * 8 + (c + r) * 0.7))) % charCount;
          }
          selectedSymbol = chars[charIdx] ?? chars[0] ?? "·";
        }
      }

      if (selectedSymbol === " ") continue;

      let posX = c * gridSize + gridSize / 2;
      let posY = r * gridSize + gridSize / 2;
      if (motion === "wave") {
        posX += Math.sin(r * 0.6 + time * 2) * gridSize * 0.22;
        posY += Math.cos(c * 0.5 + time * 1.7) * gridSize * 0.14;
      } else if (motion === "jitter") {
        const seed = c * 57 + r * 131 + Math.floor(time * 12) * 7919;
        posX += (fract(Math.sin(seed) * 43758.5453) - 0.5) * gridSize * 0.3;
        posY += (fract(Math.sin(seed + 1) * 43758.5453) - 0.5) * gridSize * 0.3;
      }

      let style: string;
      if (colorMode === "video") {
        const idx = (r * cols + c) * 4;
        style = `rgb(${pixels[idx]}, ${pixels[idx + 1]}, ${pixels[idx + 2]})`;
      } else if (colorMode === "gradient") {
        style = rowColors[r];
      } else if (colorMode === "neon") {
        const hue = Math.floor((lum * 1.5 + (c + r) * 3) % 360);
        style = `hsl(${hue}, 100%, 60%)`;
      } else {
        style = fg;
      }
      if (style !== currentStyle) {
        ctx.fillStyle = style;
        currentStyle = style;
      }

      if (selectedSymbol === "●" || selectedSymbol === "◯") {
        const dotR = Math.max(1.5, gridSize / 5);
        ctx.beginPath();
        ctx.arc(posX, posY, dotR, 0, Math.PI * 2);
        if (selectedSymbol === "◯") {
          ctx.strokeStyle = currentStyle;
          ctx.lineWidth = 1.5;
          ctx.stroke();
        } else {
          ctx.fill();
        }
      } else {
        ctx.fillText(selectedSymbol, posX, posY);
      }
    }
  }

  return { cols, rows };
}

function fract(n: number): number {
  return n - Math.floor(n);
}

/** Load an image from raw JPEG/PNG bytes. */
export function loadImageFromBytes(bytes: Uint8Array, mime = "image/jpeg"): Promise<HTMLImageElement> {
  const blob = new Blob([bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer], {
    type: mime,
  });
  const url = URL.createObjectURL(blob);
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("could not decode still for ASCII"));
    };
    img.src = url;
  });
}
