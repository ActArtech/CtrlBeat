import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, test } from "vitest";

import {
  EFFECT_SLICES,
  TRANSITION_SLICES,
  registeredEffectIds,
  registeredTransitionIds,
} from "./registry";

const here = path.dirname(fileURLToPath(import.meta.url));

function listDirs(kind: "effects" | "transitions"): string[] {
  const root = path.join(here, kind);
  return fs
    .readdirSync(root, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
}

describe("effect / transition slice registry", () => {
  test("every effects/ folder is registered exactly once", () => {
    const folders = listDirs("effects");
    const ids = registeredEffectIds().sort();
    expect(ids).toEqual(folders);
    expect(new Set(ids).size).toBe(ids.length);
  });

  test("every transitions/ folder is registered exactly once", () => {
    const folders = listDirs("transitions");
    const ids = registeredTransitionIds().sort();
    expect(ids).toEqual(folders);
    expect(new Set(ids).size).toBe(ids.length);
  });

  test("each effect slice has manifest.json matching definition id", () => {
    for (const effect of EFFECT_SLICES) {
      const manifestPath = path.join(here, "effects", effect.id, "manifest.json");
      expect(fs.existsSync(manifestPath), effect.id).toBe(true);
      const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8")) as {
        id: string;
        kind: string;
        category: string;
      };
      expect(manifest.id).toBe(effect.id);
      expect(manifest.kind).toBe("effect");
      expect(manifest.category).toBe(effect.category);
    }
  });

  test("each transition slice has manifest.json matching definition id", () => {
    for (const transition of TRANSITION_SLICES) {
      const manifestPath = path.join(here, "transitions", transition.id, "manifest.json");
      expect(fs.existsSync(manifestPath), transition.id).toBe(true);
      const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8")) as {
        id: string;
        kind: string;
        implemented: boolean;
        defaultDuration: number;
      };
      expect(manifest.id).toBe(transition.id);
      expect(manifest.kind).toBe("transition");
      expect(manifest.implemented).toBe(transition.implemented);
      expect(manifest.defaultDuration).toBe(transition.defaultDuration);
    }
  });

  test("catalogue sizes stay at the migrated baseline", () => {
    expect(EFFECT_SLICES).toHaveLength(19);
    expect(TRANSITION_SLICES).toHaveLength(7);
  });
});
