# Upstream Concat PR drafts

All three PRs are **open** against `jub0t/Concat` (branches on
**https://github.com/ActArtech/Concat**):

- [#46 Duplicate every selected clip](https://github.com/jub0t/Concat/pull/46) - mergeable
- [#47 Fit-to-frame and match-size actions](https://github.com/jub0t/Concat/pull/47) - mergeable
- [#48 Freeze frame at the playhead](https://github.com/jub0t/Concat/pull/48) - rebased onto current `main` 2026-09-07 (import conflict resolved; the freeze still now clones the source clip so new model fields carry over); `cargo test -p concat-project` green (46 tests)

The drafts below are kept as the PR bodies' source of truth.

---

## 1) Freeze frame

- Branch: `pr/freeze-frame`
- Compare: https://github.com/jub0t/Concat/compare/main...ActArtech:Concat:pr/freeze-frame?expand=1
- Title: **Add freeze frame at playhead**
- Tested: `cargo test -p concat-project --lib freeze_frame_holds` (ok)

Body:

```markdown
## Summary
Adds CapCut-style **Freeze frame** for picture clips.

- New `Command::FreezeFrame` in `concat-project` (split + still hold + lane ripple)
- Editor extracts a JPEG still for video (images reuse existing media)
- Context menu: **Freeze frame** (enabled when the playhead is inside a video/image clip)

## Test plan
- [x] `cargo test -p concat-project --lib freeze_frame_holds`
- [ ] Manual: playhead inside a video → right-click → Freeze frame → 1s still + lane ripple
- [ ] Manual: freeze on an image clip
- [ ] Undo restores the pre-freeze timeline

## Notes
Scoped to freeze only. Happy to discuss in Discussion #3 first if preferred.
```

---

## 2) Duplicate selected

- Branch: `pr/duplicate-selected`
- Compare: https://github.com/jub0t/Concat/compare/main...ActArtech:Concat:pr/duplicate-selected?expand=1
- Title: **Duplicate every selected clip**

Body:

```markdown
## Summary
Context-menu **Duplicate** now copies every unlocked selected clip, not only
the menu-target clip. Copies are placed right-to-left by start so neighbours
do not stack.

## Test plan
- [ ] Select one clip → Duplicate (same as before)
- [ ] Multi-select several clips → Duplicate → each gets a copy after itself
- [ ] Locked track clips are skipped

## Notes
Builds on the existing single-clip `Studio::duplicate` helper. No new engine command.
```

---

## 3) Fit / match sizing

- Branch: `pr/fit-match`
- Compare: https://github.com/jub0t/Concat/compare/main...ActArtech:Concat:pr/fit-match?expand=1
- Title: **Fit to frame and match size for picture clips**

Body:

```markdown
## Summary
Adds a **SIZE** group on the picture clip context menu:

- Fit to frame height / width
- Match width / height (first selected) when 2+ picture clips are selected

Uses existing `SetClipTransform`; resets offsets to centre.

## Test plan
- [ ] Select one video/image → Fit to frame height / width
- [ ] Multi-select pictures → Match width / height to the first selected
- [ ] Undo restores previous transforms

## Notes
No new engine command; pure editor math over `SetClipTransform`.
```
