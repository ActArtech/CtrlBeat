# Attribution

**CtrlBeat** is a product fork of **Concat** (also known as **WolfCut**).

## Upstream

- Project: Concat / WolfCut
- Author / org: jub0t
- Source: https://github.com/jub0t/Concat
- Commercial contact (upstream): jub0trd@gmail.com

CtrlBeat keeps the Concat editing engine (`wolfcut-*` crates) and desktop shell
architecture. Product naming, beat-sync workflows, music visualizer, ASCII /
symbol overlays, bake-to-export path, and related UX are CtrlBeat additions.

## Names and trademarks

`Concat` and `WolfCut` identify upstream builds. This product ships as
**CtrlBeat** and does not claim to be an official Concat release.

Former interim name **BeatCut** referred to the same fork before the CtrlBeat
rename; preference keys migrate automatically.

## License (Path 1 - pre-AGPL snapshot)

See `LICENSE` (MPL-2.0), `NOTICE` (path map), and `THIRD_PARTY_NOTICES.md`.

**Facts for this tree:**

| Item | Value |
|------|--------|
| Repo license as shipped | **MPL-2.0** |
| Upstream AGPL switch | Concat commit `c30b245` / tag `v0.2.0-alpha.19` (2 Sep 2026) |
| This fork's merge-base with jub0t/Concat `main` | `8938ec34fbc28bd9790dee3a676dabc529105aa0` (31 Aug 2026, still MPL) |
| MIT for the whole repo | **Not available** (would mislabel inherited copyright) |

A license change upstream is not retroactive. Code received under MPL-2.0
stays usable under MPL-2.0. If this repo later merges Concat from
`v0.2.0-alpha.19` onward, the combined work must satisfy **AGPL-3.0-or-later**.

Do not merge those AGPL commits into CtrlBeat without deliberately switching
the product to Path 2 (AGPL). Concat's plugin exception does **not** apply to
this full-app fork.

End users who only edit videos locally have no extra obligation. Obligations
attach to redistribution, embedding, and hosting.

## Third-party ideas adapted in CtrlBeat

- Beat-synced batch placement patterns (BeatFrame-style slideshow pacing)
- Symbol-set / visualizer patterns inspired by ActArtech codeviceanim-style work

Preserve credit when you redistribute those layers.
