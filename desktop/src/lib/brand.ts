/**
 * CtrlBeat product identity.
 *
 * This desktop app is a named fork of Concat (WolfCut). Engine crate names
 * stay `wolfcut-*` on purpose: they are the upstream library layer. User-facing
 * strings, installer product name, and bundle id are CtrlBeat.
 */

export const BRAND = {
  name: "CtrlBeat",
  /** Marketing / About version; keep in sync with package.json + tauri.conf. */
  version: "0.3.1",
  tagline: "Beat-synced video editing",
  /** Default project folder under the user Desktop. */
  projectsFolder: "CtrlBeat",
  /** Tauri / OS reverse-DNS id (install path, uniqueness vs WolfCut/BeatCut). */
  identifier: "app.ctrlbeat.desktop",
  basedOn: {
    name: "Concat",
    alsoKnownAs: "WolfCut",
    url: "https://github.com/jub0t/Concat",
    author: "jub0t",
  },
  /** License of this tree's covered sources (see repo LICENSE). */
  license: "MPL-2.0",
} as const;

export type Brand = typeof BRAND;

/**
 * Read a preference under a CtrlBeat key, migrating once from older BeatCut
 * or WolfCut keys so existing installs keep theme / locale / model choices.
 */
export function storageGet(key: string, ...legacyKeys: string[]): string | null {
  try {
    const next = localStorage.getItem(key);
    if (next !== null) return next;
    for (const legacyKey of legacyKeys) {
      const legacy = localStorage.getItem(legacyKey);
      if (legacy === null) continue;
      localStorage.setItem(key, legacy);
      return legacy;
    }
    return null;
  } catch {
    return null;
  }
}

export function storageSet(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Private mode / blocked storage - preferences are best-effort.
  }
}

export function storageRemove(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch {
    // Same as set: ignore.
  }
}
