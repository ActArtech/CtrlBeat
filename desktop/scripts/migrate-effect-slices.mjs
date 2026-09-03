/**
 * One-shot: split effects.ts EFFECTS/TRANSITIONS into slice packages.
 * Run from desktop/: node scripts/migrate-effect-slices.mjs
 */
import fs from "node:fs";
import path from "node:path";

const root = path.resolve("src/lib");
const src = fs.readFileSync(path.join(root, "effects.ts"), "utf8");

const sharedPath = path.join(root, "slices/shared.ts");
fs.mkdirSync(path.dirname(sharedPath), { recursive: true });
fs.writeFileSync(
  sharedPath,
  `/**
 * Shared helpers for effect slices (preview + chain).
 */
import { t } from "../i18n";
import type { FilterParam } from "../filters";

export type EffectCategory = "basic" | "blur" | "color" | "stylize" | "distort";
export type TransitionCategory = "basic" | "motion";

export const percent = (value: number) => \`\${Math.round(value)}%\`;
export const pixels = (value: number) => \`\${Math.round(value)} px\`;
export const times = (value: number) => \`\${value.toFixed(2)}x\`;
export const kelvin = (value: number) => \`\${Math.round(value)} K\`;

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
    \`<feColorMatrix type="matrix" values="\` +
    \`\${nr.toFixed(4)} 0 0 0 0  0 \${ng.toFixed(4)} 0 0 0  0 0 \${nb.toFixed(4)} 0 0  0 0 0 1 0"/>\`
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
`,
);

function extractArray(startMarker, endMarker) {
  const start = src.indexOf(startMarker);
  const end = src.indexOf(endMarker);
  if (start < 0 || end < 0) throw new Error(`markers missing: ${startMarker}`);
  const block = src.slice(start, end);
  const open = block.indexOf("[");
  const close = block.lastIndexOf("]");
  return block.slice(open + 1, close);
}

/** Split top-level `{ ... }` objects inside an array body. */
function splitObjects(body) {
  const objects = [];
  let depth = 0;
  let start = -1;
  for (let i = 0; i < body.length; i++) {
    const ch = body[i];
    if (ch === "{") {
      if (depth === 0) start = i;
      depth++;
    } else if (ch === "}") {
      depth--;
      if (depth === 0 && start >= 0) {
        objects.push(body.slice(start, i + 1));
        start = -1;
      }
    }
  }
  return objects;
}

function rewriteObject(obj) {
  return obj
    .replaceAll("temperatureMatrix(", "temperatureMatrix(")
    .replaceAll("grainDataUri()", "grainDataUri()")
    .replaceAll("format: percent", "format: percent")
    .replaceAll("format: pixels", "format: pixels")
    .replaceAll("format: times", "format: times")
    .replaceAll("format: kelvin", "format: kelvin")
    .replaceAll("t(", "t(");
}

function writeEffectSlice(obj) {
  const idMatch = obj.match(/id:\s*"([^"]+)"/);
  if (!idMatch) throw new Error("effect without id");
  const id = idMatch[1];
  const dir = path.join(root, "slices/effects", id);
  fs.mkdirSync(dir, { recursive: true });

  const category = (obj.match(/category:\s*"([^"]+)"/) || [])[1] || "basic";
  const swatch = (obj.match(/swatch:\s*"((?:\\.|[^"\\])*)"/) || [])[1] || "";

  const manifest = {
    id,
    kind: "effect",
    category,
    i18nKey: `effects.${id}`,
    swatch: swatch.replace(/\\"/g, '"'),
  };
  fs.writeFileSync(path.join(dir, "manifest.json"), JSON.stringify(manifest, null, 2) + "\n");

  const body = rewriteObject(obj.trim());
  const index = `/**
 * Effect slice: ${id}
 * @see manifest.json
 */
import type { EffectDefinition } from "../../types";
import {
  grainDataUri,
  kelvin,
  percent,
  pixels,
  t,
  temperatureMatrix,
  times,
} from "../../shared";

const definition: EffectDefinition = ${body};

export default definition;
`;
  fs.writeFileSync(path.join(dir, "index.ts"), index);
  return id;
}

function writeTransitionSlice(obj) {
  const idMatch = obj.match(/id:\s*"([^"]+)"/);
  if (!idMatch) throw new Error("transition without id");
  const id = idMatch[1];
  const dir = path.join(root, "slices/transitions", id);
  fs.mkdirSync(dir, { recursive: true });

  const category = (obj.match(/category:\s*"([^"]+)"/) || [])[1] || "basic";
  const implemented = /implemented:\s*true/.test(obj);
  const durationMatch = obj.match(/defaultDuration:\s*([0-9.]+)/);
  const defaultDuration = durationMatch ? Number(durationMatch[1]) : 1;

  const manifest = {
    id,
    kind: "transition",
    category,
    i18nKey: `transitions.${id}`,
    implemented,
    defaultDuration,
  };
  fs.writeFileSync(path.join(dir, "manifest.json"), JSON.stringify(manifest, null, 2) + "\n");

  const body = rewriteObject(obj.trim());
  const index = `/**
 * Transition slice: ${id}
 * @see manifest.json
 */
import type { TransitionDefinition } from "../../types";
import { t } from "../../shared";

const definition: TransitionDefinition = ${body};

export default definition;
`;
  fs.writeFileSync(path.join(dir, "index.ts"), index);
  return id;
}

const effectBody = extractArray(
  "export const EFFECTS: EffectDefinition[] = [",
  "export function findEffect",
);
const effectIds = splitObjects(effectBody).map(writeEffectSlice);

const transitionBody = extractArray(
  "export const TRANSITIONS: TransitionDefinition[] = [",
  "export function findTransition",
);
const transitionIds = splitObjects(transitionBody).map(writeTransitionSlice);

const registry = `/**
 * Build-time registry of effect / transition slices.
 *
 * Each package lives under \`slices/effects/<id>\` or \`slices/transitions/<id>\`.
 * Adding a catalogue entry = add a folder + import it here (and mirror the
 * FFmpeg chain in wolfcut-export chains.rs until Phase 2 codegen).
 *
 * A filesystem test asserts every folder is listed below.
 */
import type { EffectDefinition, TransitionDefinition } from "./types";

${effectIds
  .map((id) => {
    const alias = id.replace(/-/g, "_");
    return `import ${alias} from "./effects/${id}";`;
  })
  .join("\n")}

${transitionIds
  .map((id) => {
    const alias = `t_${id.replace(/-/g, "_")}`;
    return `import ${alias} from "./transitions/${id}";`;
  })
  .join("\n")}

export const EFFECT_SLICES: EffectDefinition[] = [
${effectIds.map((id) => `  ${id.replace(/-/g, "_")},`).join("\n")}
];

export const TRANSITION_SLICES: TransitionDefinition[] = [
${transitionIds.map((id) => `  t_${id.replace(/-/g, "_")},`).join("\n")}
];

export function registeredEffectIds(): string[] {
  return EFFECT_SLICES.map((effect) => effect.id);
}

export function registeredTransitionIds(): string[] {
  return TRANSITION_SLICES.map((transition) => transition.id);
}
`;

fs.writeFileSync(path.join(root, "slices/registry.ts"), registry);
console.log("effects", effectIds.length, effectIds.join(", "));
console.log("transitions", transitionIds.length, transitionIds.join(", "));
console.log("wrote slices + registry");
