#!/usr/bin/env python3
"""Composite localized labels and a geometrically correct compass onto the farmyard map."""

from __future__ import annotations

import math
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter, ImageFont

ROOT = Path(__file__).resolve().parents[1]
BASE = ROOT / "src/assets/img/board_background_base.jpg"
OUT_DIR = ROOT / "src/assets/img"
FONTS = ROOT / "src/assets/fonts"

INK = (28, 20, 12, 255)
INK_SOFT = (28, 20, 12, 210)
CREAM = (232, 214, 176, 255)
GOLD = (176, 142, 72, 255)

LABELS = {
    "pl": {
        "barn": "Stodoła",
        "cottage": "Kurna chata",
        "garden": "Warzywnik",
        "well": "Studnia",
        "hay": "Kopa siana",
        "kegs": "Antałki",
        "compost": "Kompost",
        "title": "Stary Majdan",
        "compass": ("Pn", "E", "Pd", "W"),
    },
    "en": {
        "barn": "Barn",
        "cottage": "Smoke cottage",
        "garden": "Vegetable patch",
        "well": "Well",
        "hay": "Haystack",
        "kegs": "Kegs",
        "compost": "Compost",
        "title": "Old Majdan",
        "compass": ("N", "E", "S", "W"),
    },
    "cs": {
        "barn": "Stodola",
        "cottage": "Kouřová chalupa",
        "garden": "Zahrádka",
        "well": "Studna",
        "hay": "Kupa sena",
        "kegs": "Sudy",
        "compost": "Kompost",
        "title": "Starý Majdan",
        "compass": ("S", "V", "J", "Z"),
    },
    "uk": {
        "barn": "Стодола",
        "cottage": "Курна хата",
        "garden": "Город",
        "well": "Криниця",
        "hay": "Копа сіна",
        "kegs": "Бочки",
        "compost": "Компост",
        "title": "Старий Майдан",
        "compass": ("Пн", "Сх", "Пд", "Зх"),
    },
    "tlh": {
        "barn": "tIr qach",
        "cottage": "tlhIch juH",
        "garden": "naH yotlh",
        "well": "ngeng",
        "hay": "magh yuvtlhe'",
        "kegs": "HIq balmey",
        "compost": "veQ yuvtlhe'",
        "title": "majDan qan",
        "compass": ("Dung", "nIH", "bIng", "poS"),
        "piqad": True,
    },
}

# Percent positions on the 1024 map (cx, cy)
POS = {
    "barn": (0.27, 0.125),
    "cottage": (0.705, 0.145),
    "garden": (0.20, 0.475),
    "well": (0.42, 0.575),
    "hay": (0.68, 0.675),
    "kegs": (0.78, 0.455),
    "compost": (0.13, 0.755),
    "title": (0.40, 0.938),
    "compass": (0.855, 0.855),
}


def to_piqad(text: str) -> str:
    single = {
        "a": "\uF8D0", "b": "\uF8D1", "D": "\uF8D3", "e": "\uF8D4",
        "H": "\uF8D6", "I": "\uF8D7", "j": "\uF8D8", "l": "\uF8D9",
        "m": "\uF8DA", "n": "\uF8DB", "o": "\uF8DD", "p": "\uF8DE",
        "q": "\uF8DF", "Q": "\uF8E0", "r": "\uF8E1", "S": "\uF8E2",
        "t": "\uF8E3", "u": "\uF8E5", "v": "\uF8E6", "w": "\uF8E7",
        "y": "\uF8E8", "'": "\uF8E9",
    }
    out = []
    i = 0
    while i < len(text):
        if text.startswith("tlh", i):
            out.append("\uF8E4")
            i += 3
        elif text.startswith("ch", i):
            out.append("\uF8D2")
            i += 2
        elif text.startswith("gh", i):
            out.append("\uF8D5")
            i += 2
        elif text.startswith("ng", i):
            out.append("\uF8DC")
            i += 2
        else:
            out.append(single.get(text[i], text[i]))
            i += 1
    return "".join(out)


def polar(cx, cy, angle_deg, radius):
    rad = math.radians(angle_deg)
    return (cx + radius * math.sin(rad), cy - radius * math.cos(rad))


def draw_compass(size: int, labels: tuple[str, str, str, str], font: ImageFont.FreeTypeFont) -> Image.Image:
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    cx = cy = size / 2
    r = size * 0.28

    d.ellipse([cx - r * 1.18, cy - r * 1.18, cx + r * 1.18, cy + r * 1.18], outline=INK, width=3)
    d.ellipse([cx - r * 1.08, cy - r * 1.08, cx + r * 1.08, cy + r * 1.08], outline=INK_SOFT, width=1)

    hub = r * 0.12
    # Eight-point rose: N is longer so north is unambiguous. 0° = north.
    for i in range(8):
        ang = i * 45
        is_cardinal = i % 2 == 0
        length = r * (1.08 if i == 0 else 1.0 if is_cardinal else 0.62)
        halfw = 18 if is_cardinal else 12
        tip = polar(cx, cy, ang, length)
        left = polar(cx, cy, ang - halfw, hub)
        right = polar(cx, cy, ang + halfw, hub)
        mid = polar(cx, cy, ang, hub * 0.4)
        d.polygon([tip, left, mid], fill=INK)
        d.polygon([tip, mid, right], fill=CREAM)
        d.line([tip, right, left, tip], fill=INK, width=1)

    d.ellipse([cx - 7, cy - 7, cx + 7, cy + 7], fill=INK)
    d.ellipse([cx - 3, cy - 3, cx + 3, cy + 3], fill=GOLD)

    radius_lbl = r * 1.38
    for label, ang in zip(labels, (0, 90, 180, 270)):
        x, y = polar(cx, cy, ang, radius_lbl)
        bbox = d.textbbox((0, 0), label, font=font)
        tw, th = bbox[2] - bbox[0], bbox[3] - bbox[1]
        d.text((x - tw / 2, y - th / 2 - 1), label, font=font, fill=INK)

    return img


def load_font(path: Path, size: int) -> ImageFont.FreeTypeFont:
    return ImageFont.truetype(str(path), size)


def draw_centered(draw, xy, text, font, fill=INK):
    x, y = xy
    bbox = draw.textbbox((0, 0), text, font=font)
    tw, th = bbox[2] - bbox[0], bbox[3] - bbox[1]
    ox, oy = bbox[0], bbox[1]
    # faint parchment plate so ink stays readable on busy line-art
    pad = 6
    plate = [x - tw / 2 - pad, y - th / 2 - pad, x + tw / 2 + pad, y + th / 2 + pad]
    draw.rounded_rectangle(plate, radius=6, fill=(236, 220, 186, 175))
    draw.text((x - tw / 2 - ox, y - th / 2 - oy), text, font=font, fill=fill)


def compose(lang: str) -> Path:
    data = LABELS[lang]
    base = Image.open(BASE).convert("RGBA")
    w, h = base.size
    overlay = Image.new("RGBA", base.size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay)

    serif = load_font(Path("/usr/share/fonts/google-noto/NotoSerif-BoldItalic.ttf"), 26)
    serif_small = load_font(Path("/usr/share/fonts/google-noto/NotoSerif-Bold.ttf"), 20)
    if lang == "uk":
        title_font = load_font(Path("/usr/share/fonts/google-noto/NotoSerif-Bold.ttf"), 52)
    else:
        title_font = load_font(FONTS / "UnifrakturMaguntia.ttf", 62)
    compass_font = serif_small
    if data.get("piqad"):
        klingon = load_font(FONTS / "Klingon-pIqaD-HaSta.ttf", 28)
        klingon_title = load_font(FONTS / "Klingon-pIqaD-HaSta.ttf", 48)
        klingon_compass = load_font(FONTS / "Klingon-pIqaD-HaSta.ttf", 18)
        serif = klingon
        title_font = klingon_title
        compass_font = klingon_compass

    def maybe_script(text: str) -> str:
        return to_piqad(text) if data.get("piqad") else text

    for key in ("barn", "cottage", "garden", "well", "hay", "kegs", "compost"):
        px, py = POS[key]
        draw_centered(draw, (px * w, py * h), maybe_script(data[key]), serif)

    title = maybe_script(data["title"])
    # title uses a larger plate
    tx, ty = POS["title"][0] * w, POS["title"][1] * h
    bbox = draw.textbbox((0, 0), title, font=title_font)
    tw, th = bbox[2] - bbox[0], bbox[3] - bbox[1]
    draw.rounded_rectangle(
        [tx - tw / 2 - 18, ty - th / 2 - 10, tx + tw / 2 + 18, ty + th / 2 + 10],
        radius=8,
        fill=(236, 220, 186, 200),
    )
    draw.text((tx - tw / 2 - bbox[0], ty - th / 2 - bbox[1]), title, font=title_font, fill=INK)

    compass_labels = tuple(maybe_script(x) for x in data["compass"])
    compass = draw_compass(210, compass_labels, compass_font)
    cx = int(POS["compass"][0] * w - compass.size[0] / 2)
    cy = int(POS["compass"][1] * h - compass.size[1] / 2)
    overlay.alpha_composite(compass, (cx, cy))

    out = Image.alpha_composite(base, overlay).convert("RGB")
    dest = OUT_DIR / f"board_background_{lang}.jpg"
    out.save(dest, "JPEG", quality=92, subsampling=0)
    return dest


def main() -> None:
    if not BASE.exists():
        raise SystemExit(f"missing base map: {BASE}")
    for lang in LABELS:
        path = compose(lang)
        print("wrote", path)


if __name__ == "__main__":
    main()
