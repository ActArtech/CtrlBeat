import { beforeEach, describe, expect, test } from "vitest";

import { BRAND, storageGet, storageRemove, storageSet } from "./brand";

/** Minimal localStorage so brand helpers run under Vitest's default node env. */
function installMemoryLocalStorage(): void {
  const store = new Map<string, string>();
  const memory = {
    getItem(key: string) {
      return store.has(key) ? store.get(key)! : null;
    },
    setItem(key: string, value: string) {
      store.set(String(key), String(value));
    },
    removeItem(key: string) {
      store.delete(key);
    },
    clear() {
      store.clear();
    },
    key(index: number) {
      return [...store.keys()][index] ?? null;
    },
    get length() {
      return store.size;
    },
  };
  Object.defineProperty(globalThis, "localStorage", {
    value: memory,
    configurable: true,
    writable: true,
  });
}

describe("BRAND", () => {
  test("ships as CtrlBeat with Concat/WolfCut credit metadata", () => {
    expect(BRAND.name).toBe("CtrlBeat");
    expect(BRAND.identifier).toBe("app.ctrlbeat.desktop");
    expect(BRAND.projectsFolder).toBe("CtrlBeat");
    expect(BRAND.basedOn.name).toBe("Concat");
    expect(BRAND.basedOn.alsoKnownAs).toBe("WolfCut");
  });
});

describe("storageGet / storageSet / storageRemove", () => {
  beforeEach(() => {
    installMemoryLocalStorage();
  });

  test("storageSet then storageGet round-trips the CtrlBeat key", () => {
    storageSet("ctrlbeat.theme", "dark");
    expect(storageGet("ctrlbeat.theme")).toBe("dark");
  });

  test("migrates once from BeatCut legacy key into CtrlBeat key", () => {
    localStorage.setItem("beatcut.theme", "dark");
    expect(storageGet("ctrlbeat.theme", "beatcut.theme", "wolfcut.theme")).toBe("dark");
    expect(localStorage.getItem("ctrlbeat.theme")).toBe("dark");
    localStorage.removeItem("beatcut.theme");
    expect(storageGet("ctrlbeat.theme", "beatcut.theme", "wolfcut.theme")).toBe("dark");
  });

  test("migrates once from WolfCut legacy when BeatCut key is absent", () => {
    localStorage.setItem("wolfcut.locale", "zh-CN");
    expect(storageGet("ctrlbeat.locale", "beatcut.locale", "wolfcut.locale")).toBe("zh-CN");
    expect(localStorage.getItem("ctrlbeat.locale")).toBe("zh-CN");
  });

  test("prefers current CtrlBeat key over legacy values", () => {
    localStorage.setItem("ctrlbeat.theme", "light");
    localStorage.setItem("beatcut.theme", "dark");
    localStorage.setItem("wolfcut.theme", "dark");
    expect(storageGet("ctrlbeat.theme", "beatcut.theme", "wolfcut.theme")).toBe("light");
  });

  test("storageRemove clears the key", () => {
    storageSet("ctrlbeat.theme", "dark");
    storageRemove("ctrlbeat.theme");
    expect(storageGet("ctrlbeat.theme")).toBeNull();
  });

  test("returns null when neither current nor legacy keys exist", () => {
    expect(storageGet("ctrlbeat.missing", "beatcut.missing", "wolfcut.missing")).toBeNull();
  });
});
