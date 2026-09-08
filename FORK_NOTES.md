# CtrlBeat engineering notes (fork changelog)

Product name: **CtrlBeat**. See [CTRLBEAT.md](CTRLBEAT.md) and [ATTRIBUTION.md](ATTRIBUTION.md).

Custom desktop build of [jub0t/Concat](https://github.com/jub0t/Concat).  
This document covers what we added on top of upstream, how to install the build, and what is *not* ready yet (mobile).

**Date:** 2026-09-07  
**App version in installer:** CtrlBeat 0.4.0  
**Base:** Concat / WolfCut (Tauri + React + Rust engine)  
**Bundle id:** `app.ctrlbeat.desktop`

---

## Quick start for friends (non-technical)

Send them one link: **https://actartech.github.io/CtrlBeat/** (download page with a big button).

Or straight to the installer: **https://github.com/ActArtech/CtrlBeat/releases/latest**
(`CtrlBeat_0.4.0_x64-setup.exe`; same app as MSI).

1. Double-click the setup.exe.
2. If Windows SmartScreen appears: **More info** → **Run anyway** (this build is unsigned).
3. Open **CtrlBeat** from the Start menu.

A local copy also sits in `releases/` (USB / Drive / zip) when the recipient has no GitHub access. Each release: bump versions, `npx tauri build`, copy both bundles into `releases/`, then `gh release create vX.Y.Z releases/CtrlBeat_*` (notes template in the v0.4.0 release).

Do **not** hand people the full source tree or ask them to `git clone` unless they have Node, Rust, and Visual Studio Build Tools. Official Concat GitHub releases do **not** include these CtrlBeat features.

---

## What this fork adds (summary)

| Area | What you get |
|------|----------------|
| **Effects slices** | Library effects/transitions as discoverable packages under `desktop/src/lib/slices/` |
| **Beats panel** | Analyze music, mark beats on the timeline, place media on beats |
| **Beat slideshow** | Images *and* videos on the beat grid, loop until song end, beats-per-clip |
| **Music visualizer** | Live + bakeable particle / radial / kaleidoscope / Lissajous / orbit overlays |
| **ASCII / code symbols** | 13 symbol sets, live preview, voice/hybrid/video modes, bake to timeline |
| **Bake with a config sheet** | Smoothness choice, live frame/time estimate, progress + cancel; one **animated** clip per bake; re-bake replaces instead of stacking; identical re-bakes are skipped across relaunches |
| **Lyrics on beats** | Paste lyrics, group words per beat (1–4 per beat, beat step), land as caption-styled text clips on a "Lyrics" lane, one undo step |
| **Full transition suite** | All seven catalogue transitions are real in preview *and* export (wipes/push/zoom lowered in the engine as motion ramps) |
| **Transition sweeps** | Apply to **selection** or **every cut** from each transition tile - one batch, one undo step |
| **Unified fades** | Fade in / Fade out ramp sound *and* picture together - clips, stills, titles; dissolves never shorten a deliberate fade |
| **Word-level captions** | Whisper token timing surfaced through the pipeline; Settings → Transcriber → Word by word, with graceful phrase fallback |
| **Title transitions + fades** | Text clips take every transition and fades end to end (live preview draws the arriving title; the export passes them onto the rasterised PNG) |
| **Clip fit / match** | Fit to frame width/height; match width/height for multi-select |
| **Freeze + duplicate** | CapCut-style freeze at playhead; duplicate selected clips |
| **Video source window** | Per-clip source in-point slider so a short beat gap shows the right part of a long clip |
| **UX cleanup** | Beat / ASCII / viz tools live under the **Beats** right-panel tab (not dumped in File) |
| **Windows installer** | NSIS setup.exe + MSI with bundled FFmpeg / Whisper tooling |

Upstream Concat still provides the core editor: multi-track timeline, effects, filters, captions, TTS, templates, local export, etc.

---

## Feature details

### 1. Beats workflow

**Where:** Right panel → **Beats** tab.

1. Put music on the timeline (audio track).
2. Pick a detection preset: **Balanced**, **Bass**, **Piano**, or **Dense**.
3. Optionally nudge with **offset** (ms).
4. **Analyze beats** → marks appear on the timeline; BPM / count readout updates.
5. **Clear beats** removes marks.

Detection presets tune sensitivity and onset strategy for different music (kick-heavy vs piano vs dense electronic).

### 2. Place images and videos on beats

**Where:** Beats panel → Place section.

- Select stills and/or videos in the media bin.
- Set **beats per image** (1 = every beat, 2 = every other, … up to 8).
- Toggle **loop until end** so a short list repeats through the whole song.
- **Place on beats** lays clips on the timeline.

**Rules we implemented:**

- Timeline duration for each slot is the **beat gap** (clips abut; videos do not stack/overlap).
- Videos default to **source start = 0** inside that gap.
- Adjust panel has a **source start** slider to pick which window of a long video plays in the short gap.
- Still formats such as HEIC / AVIF are treated as images (not misclassified as video).

### 3. Music visualizer

**Where:** Beats panel → Visualizer surface.

**Presets:** particles, radial pulse, kaleidoscope, Lissajous, orbit.  
**Layouts:** center, corners, fractal.  
**Color modes:** mono, gradient, neon.  
**Count:** element density (clamped roughly 8–2000).

Live preview follows playback / beat intensity. Use **Place visualizer** (or export bake) so frames land on a top track and appear in the MP4.

Inspiration / patterns adapted from ActArtech **codeviceanim**-style generators (local reference work).

### 4. ASCII and code-symbol overlays

**Where:** Beats panel → ASCII surface + Symbols group.

**13 symbol sets** (from codeviceanim-style sets), including:

- Tech Map, Greek & Runic, Math, Katakana glitch, Arrows, Geometry stars  
- Box drawing, Hex, Classic ASCII, Matrix binary, Blocks/shades, Braille, Dots

**Drive modes:** video, voice, hybrid, timeline.  
**Color modes / palettes / motion** options for the glyph look.

**Live preview** is on-canvas only. **Place code symbols on beats** (or export with live overlay on) **bakes** PNG frames onto a top track so the export includes them.

### 5. Export and bake behavior

Important product rule:

> Live ASCII / visualizer overlay is **preview-only**.  
> It is **not** in the MP4 until frames are baked to a timeline track.

**How the bake works now:** "Place visualizer / code symbols on
beats" (and the automatic pre-export bake) opens a **bake sheet** first —
what will bake, the span, a smoothness choice (12/24/30 fps; ASCII-on-video
samples the source once per frame so it runs at 12), and a live
"frames · time" estimate. Nothing encodes until **Bake** is pressed. While it
runs: frame progress with a time-left estimate and **Cancel** (returns to the
config, choices preserved).

The bake itself re-renders the overlay at full frame rate over the beat span
(the same draws the live overlay performs, same pulse math) and streams the
frames to the host, which encodes them into **one MP4** landing on the
timeline as **one clip** — not one frozen still per beat. That fixed the old
behaviour where the export was a ~2 fps slideshow of frozen frames while the
preview had shown 20 fps motion, and a 3-minute song cost hundreds of files /
media items / clips / undo entries.

- Re-baking with **Replace previous bake** on (default) removes the old clip,
  track and media first — experimenting no longer stacks lanes.
- An identical re-bake (same settings + beats, remembered across relaunches)
  is skipped; export continues with the clip already on the timeline.
- Export with the live overlay on opens the same sheet — every bake is
  explicitly agreed; Cancel returns to the editor without exporting.

### 6. Timeline editing extras

- **Freeze frame** at playhead (still hold, CapCut-style).
- **Duplicate** one or more selected clips.
- Context / Edit menu: **Fit to frame height**, **Fit to frame width**, plus match width/height helpers for multi-select sizing.

### 7. UX / panel layout

Beat detection, placement, visualizer, and ASCII controls were moved out of a crowded **File** menu into the dedicated **Beats** right-panel tab. File stays for project / import / export style actions.

### 8. September 2026 wave (shipped in 0.4.0)

- **Transitions are all real.** Wipe Left / Right, Push and Zoom existed in
  the catalogue but clicked to nothing; they are now lowered in the engine
  (`wolfcut-core` motion ramps folded into the render plan) exactly like the
  dissolve always was. Export, the paused monitor's true frame and live
  playback all draw the same geometry.
- **Apply to selected / every cut.** Each transition tile carries **Sel** and
  **All** chips; both land as one batch - one undo step - and toast the count.
- **One fade fades everything.** The Adjust panel's Fade in / Fade out were
  sound-only and hidden for stills; they now ramp the picture too, everywhere
  (export, paused monitor, live playback), and titles get the same fades.
- **Lyrics on beats.** New sheet in the Beats panel: paste words, pick words
  per beat and the beat step, see the exact plan ("42 words → 21 clips"),
  place onto a "Lyrics" lane.
- **Word-by-word auto captions.** whisper's token timestamps are surfaced
  through `transcribe.rs` (full-JSON output with a plain rerun fallback for
  old binaries); Settings → Transcriber picks the caption style.
- **Titles take transitions + fades.** Guards, preview helpers and the
  export's rasterised-title path all passed text through as a second-class
  citizen; now a title dissolves, wipes, pushes, zooms and fades like any
  visual.

---

## Installer and build artifacts

| File | Approx size | Role |
|------|-------------|------|
| `releases/CtrlBeat_0.4.0_x64-setup.exe` | ~84 MB | Preferred Windows installer (NSIS) |
| `releases/CtrlBeat_0.4.0_x64_en-US.msi` | ~114 MB | MSI alternative |
| `releases/README.txt` | small | Short install instructions |

Older `WolfCut_0.2.0_*` builds in `releases/` (if present) are pre-rebrand artifacts.

Built from `Concat/desktop` with:

```text
CARGO_TARGET_DIR=E:\cargo-targets\concat-desktop
CARGO_BUILD_JOBS=2
npx tauri build
```

(VS Developer / `vcvars64` environment required on this machine.)

Release binaries also land under:

```text
E:\cargo-targets\concat-desktop\release\bundle\nsis\
E:\cargo-targets\concat-desktop\release\bundle\msi\
```

The copy under `Concat/releases/` is the shareable set.

**Requirements for end users:** Windows 10/11 x64; disk space for install + export temp.  
**Requirements for developers:** Node.js, Rust/cargo, Visual Studio 2022 Build Tools + Windows SDK; run app scripts from `Concat/desktop` (e.g. `npm run app`), not repo root.

---

## Key source map (this fork)

| Path | Role |
|------|------|
| `desktop/src/components/BeatsPanel.tsx` | Beats / viz / ASCII UI |
| `desktop/src/components/AsciiLiveOverlay.tsx` | Live overlay canvas |
| `desktop/src/hooks/useAsciiOverlay.ts` | Overlay state / bake helpers |
| `desktop/src/lib/beatDetection.ts` | Beat detection from PCM |
| `desktop/src/lib/beatPresets.ts` | Balanced / Bass / Piano / Dense |
| `desktop/src/lib/beatPlacement.ts` | `planMediaOnBeats` planner |
| `desktop/src/lib/beatTimeline.ts` | Timeline beat marks |
| `desktop/src/lib/clipFit.ts` | Fit / match scale math |
| `desktop/src/lib/codevice/musicVisualizer.ts` | Visualizer render |
| `desktop/src/lib/codevice/symbolSets.ts` | 13 glyph sets |
| `desktop/src/lib/codevice/videoAsciiEngine.ts` | Frame → ASCII |
| `desktop/src/lib/codevice/asciiPalettes.ts` | Palettes / color / motion |
| `desktop/src/components/AdjustPanel.tsx` | Source-start slider for videos |
| `desktop/src/lib/codevice/bakeOverlay.ts` | Bake planner: span, fps budget, frame times |
| `desktop/src/hooks/useBakeOverlay.ts` | Bake orchestration: progress, cancel, replace |
| `desktop/src/components/BakeDialog.tsx` | The configure-agree bake sheet |
| `desktop/src-tauri/src/bake.rs` | Streaming bake encoder (JPEG pipe → one MP4) |
| `desktop/src/lib/lyrics.ts` | `planLyricsOnBeats` planner |
| `desktop/src/components/LyricsDialog.tsx` | Lyrics-on-beats sheet |
| `engine/crates/wolfcut-core/src/timeline.rs` | Motion ramps (wipe / push / zoom lowering) |
| `desktop/src-tauri/src/transcribe.rs` | whisper-cli run + word-timestamp parsing |
| `desktop/src/App.tsx` | Placement, freeze, fit, bake wiring |
| `desktop/src/locales/en.json` | English strings for new UI |
| Engine / host | `source_start`, place-image clips, classify stills |

Ideas borrowed / adapted from local references:

- BeatFrame-style batch beat placement and slideshow pacing  
- codeviceanim-style symbol sets and visualizer patterns  

---

## Mobile status

**This fork:** Windows desktop only. No Android/iOS build of our Beats / ASCII / viz stack.

**Upstream Concat:** lists Android and iOS as **work in progress** (not a ready phone app). Tauri mobile would still need a touch-first UI and mobile media pipeline; it is not a config flip.

**Similar options on phone today:**

| App | Notes |
|-----|--------|
| CapCut (mobile) | Mainstream beat-sync / templates |
| kneecap | Open CapCut-style mobile editor (sideload; local-first) |
| LibreCuts | FOSS Android editor on F-Droid (simpler toolset) |
| OpenCut classic | Browser / limited; rewrite aims at multi-platform later |

Practical split: use **this WolfCut installer on PC** for beat slideshow + ASCII + visualizer; use CapCut (or kneecap) on phone for quick mobile cuts.

---

## What we did (session history, condensed)

1. Cloned / set up Concat (WolfCut) desktop stack on Windows (MSVC, SDK, cargo target on `E:`).
2. Added freeze frame and clip duplicate.
3. Built beat detection, timeline marks, presets, offset, and Beats panel UX.
4. Implemented batch place on beats: beats-per-image, loop until song end, images + videos, gap-only durations, source-start control.
5. Ported / adapted 13 symbol sets + live ASCII preview (video / voice / hybrid / timeline) with bake-to-track for export.
6. Added music visualizer presets/layouts and bake path.
7. Fixed export so live overlay is either baked or warned; HEIC/AVIF classified as images.
8. Moved tools from File menu into Beats panel; fit/match clip sizing.
9. Staged FFmpeg/Whisper for release and produced Windows NSIS + MSI installers under `releases/`.
10. Rebranded the product as **CtrlBeat** (`brand.ts`, Settings → About credits, bundle id `app.ctrlbeat.desktop`, docs + attribution). Engine crates remain `wolfcut-*`.

---

## Known limits / tips

- Unsigned installer → SmartScreen warning is expected.
- Live overlay ≠ exported pixels until bake.
- Beat marks need a real audio clip on the timeline before Analyze works well.
- Piano / quiet tracks may need the **Piano** or **Dense** preset and a small offset nudge.
- Repo root has no `npm run app`; use `Concat/desktop`.
- Disk-heavy Rust builds: use `CARGO_TARGET_DIR` on a drive with space; clean old targets if the disk fills.

---

## License note

Upstream Concat / WolfCut licensing and third-party notices (FFmpeg, Whisper, etc.) still apply. See `LICENSE` and `THIRD_PARTY_NOTICES.md` in this tree. Fork-specific UI and planner code lives mainly under `desktop/src/` as listed above.
