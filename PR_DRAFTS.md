# Upstream Concat PR drafts

Upstream (`jub0t/Concat`) has moved to the Slint `engine/` app (no Tauri
`desktop/`). These three branches retarget freeze / duplicate / fit onto that
stack. Branches are on **https://github.com/ActArtech/Concat**.

API `gh pr create` against `jub0t/Concat` returned:
`ActArtech does not have the correct permissions to execute CreatePullRequest`.
Open the compare links below in the browser (or post the same text in
[Discussion #3](https://github.com/jub0t/Concat/discussions/3) if they prefer
ideas before PRs).

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
