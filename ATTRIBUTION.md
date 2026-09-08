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

## License (Path 2 - AGPL-3.0-or-later)

See `LICENSE` (GNU Affero General Public License v3.0), path map in `NOTICE`,
and `THIRD_PARTY_NOTICES.md`.

**Facts for this tree:**

| Item | Value |
|------|--------|
| Repo / combined product license | **AGPL-3.0-or-later** |
| Upstream AGPL switch | Concat commit `c30b245` / tag `v0.2.0-alpha.19` (2 Sep 2026) |
| MIT for the whole repo | **Not available** |
| Concat plugin exception | **Does not apply** (full-app fork, not an Independent Module) |

Path 2 means CtrlBeat may track Concat and carries AGPL's network clause: if
you modify CtrlBeat and provide it to users over a network, you must offer
them the corresponding source under AGPL.

End users who only edit videos locally have no extra obligation. Obligations
attach to redistribution, embedding, and hosting.

For a closed-source desktop or SaaS product built on this code, contact
Concat for a commercial license. Do not ship under MIT.

## Third-party ideas adapted in CtrlBeat

- Beat-synced batch placement patterns (BeatFrame-style slideshow pacing)
- Symbol-set / visualizer patterns inspired by ActArtech codeviceanim-style work

Preserve credit when you redistribute those layers.
