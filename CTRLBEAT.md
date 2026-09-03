# CtrlBeat

**Beat-synced video editing** on Windows.

CtrlBeat is a named product built on [Concat / WolfCut](https://github.com/jub0t/Concat).
It is not an official Concat release. See [ATTRIBUTION.md](ATTRIBUTION.md).

**Version:** 0.3.1  
**Installer:** `releases/CtrlBeat_0.3.1_x64-setup.exe`

**Feature merge backlog (requirements only until coded):** see sibling
[`../FEATURE_REQUIREMENTS.md`](../FEATURE_REQUIREMENTS.md)
for BeatFrame transitions, visualizer catalogue expansion (`FR-VIZ-*`),
and source inventory. Existing bake presets today: particles, radialPulse,
kaleidoscope, lissajous, orbit.

---

## What CtrlBeat is

A local desktop editor for music-driven cuts:

- Detect beats and mark them on the timeline
- Place images and videos on the beat grid (loop, beats-per-clip)
- Live music visualizer and ASCII / code-symbol overlays
- Bake overlays so export includes them
- Freeze, duplicate, fit/match, video source window

Plus the Concat core: multi-track timeline, effects, filters, captions, TTS,
templates, local FFmpeg export.

## Install (friends)

1. Run `releases/CtrlBeat_0.3.1_x64-setup.exe`
2. If SmartScreen appears: **More info** → **Run anyway** (unsigned build)
3. Open **CtrlBeat** from the Start menu

Projects default to `Desktop/CtrlBeat`.

## Product identity

| Surface | Value |
|---------|--------|
| Display name | CtrlBeat |
| Bundle id | `app.ctrlbeat.desktop` |
| Version | 0.3.1 |
| About | Settings → About (credits + highlights) |
| Brand module | `desktop/src/lib/brand.ts` |
| Brandkit | `brandkit/` (SVG masters + app/in-app/github/store exports) |
| Engine crates | still `wolfcut-*` (upstream library layer) |
| Prefs keys | `ctrlbeat.*` (migrates from `beatcut.*` then `wolfcut.*`) |

## Mobile

CtrlBeat is **Windows desktop** today. Upstream Concat lists Android/iOS as
work in progress. For phones, use CapCut, kneecap, or LibreCuts.

## Dev

From `desktop/` (VS Developer shell on Windows):

```text
npm run app
npm run app:build
```
