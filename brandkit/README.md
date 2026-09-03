# CtrlBeat brandkit

Source of truth for the CtrlBeat mark, wordmark, and sized exports.

## Colors (current masters)

| Token | Hex | Use |
|-------|-----|-----|
| Ink / plate | `#000000` | Mark plate |
| Signal red | `#E62E31` | Accent bars + Ctrl word |
| Beat gray | `#D9D9D9` / `#262121` | Secondary bars |
| Paper | `#FFFFFF` | Dark-UI wordmark / mark plate accents |

Edit `master/*.svg` only, then regenerate. Do not hand-edit sized PNGs.

## Layout

```text
brandkit/
  master/     SVG sources (edit these)
  app/        Installer / OS icons
  in-app/     Title bar, Start, About
  github/     Avatar + Open Graph
  store/      Windows store tiles
  tools/      render.mjs (+ local node_modules)
```

## Do

- Edit `master/*.svg`, then run `node tools/render.mjs` from `brandkit/tools`.
- After master changes, refresh Tauri icons:  
  `npx tauri icon brandkit/app/icon-512.png --output desktop/src-tauri/icons`
- Copy updated `in-app/*` into `desktop/src/assets/brand/` (or re-run the copy step in docs).
- Keep the mark readable at **16px** (thick beat bars, no fine hairlines).
- Ship light and dark mark variants; dark UI is the default creative surface.

## Do not

- Use Concat / WolfCut logos as the primary CtrlBeat mark (credit in About only).
- Stretch or recolor the mark into low-contrast gray on dark panels.
- Put the full wordmark in the 16px title-bar slot (mark only).

## Regenerate

```powershell
cd brandkit\tools
npm install
node render.mjs
cd ..\..\desktop
npx tauri icon ..\brandkit\app\icon-512.png --output src-tauri\icons
Copy-Item ..\brandkit\in-app\titlebar-*.png,..\brandkit\in-app\start-screen-*.png,..\brandkit\in-app\about-128.png src\assets\brand\ -Force
```

`render.mjs` rasterizes SVG marks, icons, store tiles, and `social-og.svg`
(wordmark text should stay as paths in the SVG so it renders exactly).
`render_og.py` is optional/legacy if you rebuild OG without path text.

## Wired into the app

| Surface | Asset |
|---------|--------|
| Title bar | `desktop/src/assets/brand/titlebar-32.png` (+ light variant) |
| Start screen | `start-screen-64.png` |
| Settings → About | `about-128.png` |
| Light mark 96 | `in-app/mark-96-light.png` (from `logo-mark.svg`) |
| Windows / Tauri | `desktop/src-tauri/icons/*` from `icon-512.png` |
