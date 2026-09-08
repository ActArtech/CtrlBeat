# Effect / transition slices

Phase 1 **feature-slice** catalogue for CtrlBeat's Library.

## Layout

```text
slices/
  shared.ts              # preview helpers (temperature, grain, formatters)
  types.ts               # EffectDefinition / TransitionDefinition
  registry.ts            # imports every package (build-time index)
  effects/<id>/
    manifest.json        # id, category, swatch, i18nKey
    index.ts             # definition: label/blurb/params/chain/preview
  transitions/<id>/
    manifest.json
    index.ts
```

## Add a new effect

1. Create `effects/<id>/manifest.json` and `index.ts` (copy `black-white` as a template).
2. Import the package in `registry.ts` and append it to `EFFECT_SLICES`.
3. Add locale keys `effects.<id>.label` / `.blurb` (+ param labels) in `locales/en.json` (and `zh-CN.json`).
4. **Mirror the FFmpeg `chain` in** `engine/crates/wolfcut-export/src/chains.rs` (required until Phase 2 codegen).
5. Pin default/min/max strings in `effects.test.ts`.
6. Optional: drop a thumbnail at `src/assets/effect-previews/<id>.jpg`.

## Add a new transition

Same pattern under `transitions/<id>/`. Set `implemented: false` for Library "Soon" cards until export lowering exists in Rust.

## Why not runtime plugins yet

Export truth is Rust; preview is executable TypeScript. Phase 1 discovers packages at **build time**. Runtime WASM/DLL packs are a later phase.

## Related

- Public API: `lib/effects.ts` (re-exports registry)
- Requirements: repo-root `FEATURE_REQUIREMENTS.md` (`FR-ADV-TRANS` for BeatFrame image switches)
