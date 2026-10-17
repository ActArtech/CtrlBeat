# Distribution — CtrlBeat 0.4.0

One ready-to-paste post for announcing the shipped 0.4.0 installers.
Everything below is verified against the live download page and the release
assets (2026-10-17).

## The post

---

**Beat-synced video editing on Windows — free, local, no watermark.**

I've been shipping **CtrlBeat**, a desktop video editor built for
music-driven cuts: drop in a track, it detects the beats
(Balanced / Bass / Piano / Dense), and you place images and videos straight
on the grid. Visualizer and ASCII-code overlays bake into the timeline as
one animated clip — then everything exports locally.

**Just landed in 0.4.0:**

- A full transition suite — cross-fade, fades to black/white, wipes, push,
  zoom — real in preview *and* export, with apply-to-selection / apply-to-all
- **Lyrics on beats** — paste the words, group them per beat, karaoke-style
- Word-by-word auto captions (whisper token timing)
- Platform export presets: YouTube 1080p/4K, Shorts/Reels/TikTok, Instagram
  feed, square, cinema
- Unified fades that ramp sound and picture together

**Why it exists:** editors at this level either watermark your output, gate
exports behind an account, or run in someone's cloud. CtrlBeat runs entirely
on your machine — no account, no cloud, no watermark. Projects live in
`Desktop/CtrlBeat`.

**Install** (Windows 10/11, ~84 MB): https://actartech.github.io/CtrlBeat/

Source and release notes:
https://github.com/ActArtech/CtrlBeat (free, AGPL-3.0)

Fair warning on the fork: CtrlBeat is a named product fork of
[Concat / WolfCut](https://github.com/jub0t/Concat), with attribution in the
repo — and three upstream PRs contributed back so far. The build isn't
code-signed yet, so SmartScreen will grumble once: *More info → Run anyway*.

---

## Channels to consider

- **X/Twitter** — trim to the hook + download link + one screenshot/GIF
- **Reddit** — r/VideoEditing, r/editors, r/opensource (check each sub's
  self-promo rules first; lead with the fork/attribution paragraph there)
- **Show HN** — the "AGPL fork that contributed PRs upstream" angle works
- **LinkedIn** — keep the feature bullets, drop the SmartScreen note

## Fact box (verified 2026-10-17)

| Fact | Value |
|---|---|
| Version | 0.4.0 (release 2026-09-08) |
| Download page | https://actartech.github.io/CtrlBeat/ (live, verified) |
| Release assets | `CtrlBeat_0.4.0_x64-setup.exe` (~84 MB), `CtrlBeat_0.4.0_x64_en-US.msi` (~114 MB) |
| Downloads so far | 26 (setup.exe) + 2 (msi) |
| License / stack | AGPL-3.0; named product fork of jub0t/Concat (WolfCut); upstream PRs #46, #47, #48 open |
| Runs | Windows 10/11 x64, fully local; projects in `Desktop/CtrlBeat` |
