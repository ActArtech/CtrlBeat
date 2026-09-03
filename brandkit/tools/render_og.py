"""Build GitHub/OG banners with system fonts so CtrlBeat text is exact."""
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

bk = Path(__file__).resolve().parents[1]
mark = Image.open(bk / "app" / "icon-256.png").convert("RGBA")


def load_font(size: int, bold: bool = True) -> ImageFont.ImageFont:
    candidates = [
        r"C:\Windows\Fonts\segoeuib.ttf" if bold else r"C:\Windows\Fonts\segoeui.ttf",
        r"C:\Windows\Fonts\arialbd.ttf" if bold else r"C:\Windows\Fonts\arial.ttf",
    ]
    for path in candidates:
        if Path(path).exists():
            return ImageFont.truetype(path, size)
    return ImageFont.load_default()


def make_og(width: int, height: int, out_name: str) -> None:
    img = Image.new("RGB", (width, height), "#07080C")
    draw = ImageDraw.Draw(img)
    for y in range(height):
        t = y / max(height - 1, 1)
        r = int(7 + (6 - 7) * t)
        g = int(8 + (32 - 8) * t * 0.35)
        b = int(12 + (26 - 12) * t * 0.45)
        draw.line([(0, y), (width, y)], fill=(r, g, b))

    cx, cy = int(width * 0.78), height // 2
    for rad in (220, 150, 90):
        draw.ellipse([cx - rad, cy - rad, cx + rad, cy + rad], outline=(46, 230, 166))

    m = mark.resize((224, 224), Image.Resampling.LANCZOS)
    mx, my = 96, (height - 224) // 2 - 10
    img.paste(m, (mx, my), m)

    title = load_font(92, True)
    tag = load_font(30, False)
    foot = load_font(22, False)
    tx = mx + 224 + 48
    draw.text((tx, height // 2 - 70), "CtrlBeat", font=title, fill="#F4F6F8")
    draw.text((tx, height // 2 + 20), "Beat-synced video editing", font=tag, fill="#2EE6A6")
    draw.text(
        (tx, height - 110),
        "Built on Concat / WolfCut  ·  Local  ·  No watermark",
        font=foot,
        fill="#8B93A7",
    )
    out = bk / "github" / out_name
    img.save(out, "PNG")
    print("wrote", out, img.size)


def make_wordmark(dark: bool, out_name: str) -> None:
    full_w, full_h = 720, 128
    if dark:
        canvas = Image.new("RGBA", (full_w, full_h), (11, 15, 20, 255))
        m = Image.open(bk / "app" / "icon-128.png").convert("RGBA").resize(
            (96, 96), Image.Resampling.LANCZOS
        )
        color = "#F4F6F8"
    else:
        canvas = Image.new("RGBA", (full_w, full_h), (0, 0, 0, 0))
        # Prefer a properly sized light-bg mark if present
        light = bk / "in-app" / "start-screen-64.png"
        # Use dark-plate mark for light backgrounds from master raster via titlebar-light
        src = bk / "in-app" / "titlebar-32-light.png"
        m = Image.open(src).convert("RGBA").resize((96, 96), Image.Resampling.NEAREST)
        color = "#0B0F14"
        _ = light
    canvas.paste(m, (16, (full_h - 96) // 2), m)
    draw = ImageDraw.Draw(canvas)
    font = load_font(64, True)
    draw.text((130, full_h // 2 - 36), "CtrlBeat", font=font, fill=color)
    out = bk / "master" / out_name
    canvas.save(out, "PNG")
    print("wrote", out)


if __name__ == "__main__":
    make_og(1280, 640, "social-og-1280x640.png")
    make_og(1200, 630, "social-og-1200x630.png")
    make_og(1280, 640, "banner-1280x640.png")
    make_wordmark(False, "logo-full.png")
    make_wordmark(True, "logo-full-dark.png")
