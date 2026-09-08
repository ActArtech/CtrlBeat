/**
 * Rasterize CtrlBeat SVG masters into app / in-app / github / store assets.
 * Run from brandkit/tools: node render.mjs
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { Resvg } from "@resvg/resvg-js";
import pngToIco from "png-to-ico";
import { PNG } from "pngjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

function ensure(dir) {
  mkdirSync(dir, { recursive: true });
}

function renderSvg(svgPath, outPath, width, { square = false } = {}) {
  const svg = readFileSync(svgPath);
  const resvg = new Resvg(svg, {
    fitTo: { mode: "width", value: width },
    background: "transparent",
  });
  let png = resvg.render().asPng();
  if (square) {
    png = padToSquare(png, width);
  }
  writeFileSync(outPath, png);
  console.log("wrote", outPath, `(${width}px${square ? " square" : ""})`);
}

/** Center a non-square PNG on a transparent square canvas (Tauri icon needs square). */
function padToSquare(pngBytes, size) {
  const src = PNG.sync.read(pngBytes);
  const out = new PNG({ width: size, height: size });
  out.data.fill(0);
  const ox = Math.floor((size - src.width) / 2);
  const oy = Math.floor((size - src.height) / 2);
  for (let y = 0; y < src.height; y++) {
    for (let x = 0; x < src.width; x++) {
      const si = (src.width * y + x) << 2;
      const di = (size * (y + oy) + (x + ox)) << 2;
      out.data[di] = src.data[si];
      out.data[di + 1] = src.data[si + 1];
      out.data[di + 2] = src.data[si + 2];
      out.data[di + 3] = src.data[si + 3];
    }
  }
  return PNG.sync.write(out);
}

async function main() {
  const master = join(root, "master");
  const mark = join(master, "logo-mark.svg");
  const markDark = join(master, "logo-mark-dark.svg");
  const social = join(master, "social-og.svg");

  const app = join(root, "app");
  const github = join(root, "github");
  const inApp = join(root, "in-app");
  const store = join(root, "store");
  for (const d of [app, github, inApp, store]) ensure(d);

  // App / installer icons: dark-UI mark (must be square for Tauri)
  for (const size of [16, 32, 64, 128, 256, 512]) {
    renderSvg(markDark, join(app, `icon-${size}.png`), size, { square: true });
  }

  // In-app: dark UI uses mark-dark; light UI uses mark (square for crisp UI boxes)
  renderSvg(markDark, join(inApp, "titlebar-16.png"), 16, { square: true });
  renderSvg(markDark, join(inApp, "titlebar-32.png"), 32, { square: true });
  renderSvg(markDark, join(inApp, "start-screen-64.png"), 64, { square: true });
  renderSvg(markDark, join(inApp, "start-screen-128.png"), 128, { square: true });
  renderSvg(markDark, join(inApp, "about-128.png"), 128, { square: true });
  renderSvg(mark, join(inApp, "titlebar-16-light.png"), 16, { square: true });
  renderSvg(mark, join(inApp, "titlebar-32-light.png"), 32, { square: true });
  // Light-UI mark at 96px (wordmarks / docs compositing)
  renderSvg(mark, join(inApp, "mark-96-light.png"), 96, { square: true });

  // Full wordmarks (optional docs / marketing)
  const full = join(master, "logo-full.svg");
  const fullDark = join(master, "logo-full-dark.svg");
  renderSvg(full, join(master, "logo-full.png"), 720);
  renderSvg(fullDark, join(master, "logo-full-dark.png"), 720);

  // GitHub: avatars from mark; OG/banner from authored social SVG (text as paths)
  renderSvg(markDark, join(github, "avatar-200.png"), 200, { square: true });
  renderSvg(markDark, join(github, "avatar-400.png"), 400, { square: true });
  renderSvg(social, join(github, "social-og-1280x640.png"), 1280);
  renderSvg(social, join(github, "social-og-1200x630.png"), 1200);
  renderSvg(social, join(github, "banner-1280x640.png"), 1280);

  // Windows store tiles
  for (const size of [44, 71, 150, 310]) {
    renderSvg(markDark, join(store, `Square${size}x${size}Logo.png`), size, {
      square: true,
    });
  }
  renderSvg(markDark, join(store, "StoreLogo.png"), 50, { square: true });

  // Multi-size ICO from app icons
  const icoBuf = await pngToIco([
    join(app, "icon-16.png"),
    join(app, "icon-32.png"),
    join(app, "icon-64.png"),
    join(app, "icon-256.png"),
  ]);
  writeFileSync(join(app, "icon.ico"), icoBuf);
  console.log("wrote", join(app, "icon.ico"));

  // Placeholder icns note: copy largest PNG as stand-in is wrong format;
  // write a tiny readme pointer instead of a fake .icns
  writeFileSync(
    join(app, "ICNS.txt"),
    "macOS .icns not generated on Windows. Use icon-512.png with iconutil/Tauri icon pipeline on macOS.\n",
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
