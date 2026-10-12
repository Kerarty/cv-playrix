# -*- coding: utf-8 -*-
"""
make-og.py — генератор превью ссылки для мессенджеров.

Ссылка на резюме без картинки прилетает в чат серым прямоугольником, и половина
впечатления теряется ещё до того, как её открыли. Поэтому обложка рисуется
здесь тем же кодом цветов, что и сама страница, — из тех же переменных.

Запуск:  python tools/make-og.py
Результат: assets/og.png (1200×630, PNG)
"""

import os
import math
from PIL import Image, ImageDraw, ImageFilter, ImageFont

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "assets", "og.png")
FONTS = os.path.join(os.environ.get("WINDIR", r"C:\Windows"), "Fonts")

W, H = 1200, 630

# Те же значения, что в styles.css
BG_TOP = (0xFF, 0xF9, 0xEC)
BG_BOT = (0xFF, 0xE7, 0xC6)
EMERALD = (0x2F, 0xB5, 0x6B)
SAPPHIRE = (0x2F, 0x80, 0xED)
AMETHYST = (0x9B, 0x51, 0xE0)
GOLD = (0xF0, 0xA5, 0x00)
GOLD_2 = (0xFF, 0xC5, 0x31)
RUBY = (0xE2, 0x3B, 0x4A)
INK = (0x4A, 0x2B, 0x18)
INK_2 = (0x7A, 0x56, 0x38)
INK_3 = (0xA9, 0x8A, 0x6C)


def font(name, size):
    return ImageFont.truetype(os.path.join(FONTS, name), size)


def vertical_gradient(w, h, top, bottom):
    img = Image.new("RGB", (w, h))
    d = ImageDraw.Draw(img)
    for y in range(h):
        t = y / max(1, h - 1)
        d.line(
            [(0, y), (w, y)],
            fill=tuple(int(top[i] + (bottom[i] - top[i]) * t) for i in range(3)),
        )
    return img


def glow(base, cx, cy, rx, ry, color, strength=120):
    """Мягкое пятно вместо картинки — тот же приём, что и в CSS."""
    layer = Image.new("RGBA", base.size, (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    d.ellipse([cx - rx, cy - ry, cx + rx, cy + ry], fill=color + (strength,))
    layer = layer.filter(ImageFilter.GaussianBlur(110))
    base.paste(Image.alpha_composite(base.convert("RGBA"), layer).convert("RGB"), (0, 0))
    return base


def spaced(draw, xy, text, fnt, fill, tracking):
    """Печать с разрядкой: подручных средств для letter-spacing в Pillow нет."""
    x, y = xy
    for ch in text:
        draw.text((x, y), ch, font=fnt, fill=fill)
        x += draw.textlength(ch, font=fnt) + tracking
    return x


def gem(draw, cx, cy, r, tier, alpha=255):
    """Фигуры те же, что в merge: у уровня свой цвет и своя форма."""
    colors = [EMERALD, SAPPHIRE, AMETHYST, GOLD_2, RUBY]
    color = colors[tier] + (alpha,)
    pts = []
    if tier == 0:
        draw.ellipse([cx - r, cy - r, cx + r, cy + r], fill=color)
        return
    if tier == 1:
        draw.rounded_rectangle([cx - r, cy - r, cx + r, cy + r], radius=r * 0.34, fill=color)
        return
    if tier == 2:
        pts = [(cx, cy - r), (cx + r, cy), (cx, cy + r), (cx - r, cy)]
    elif tier == 3:
        for i in range(6):
            a = -math.pi / 2 + i * math.pi / 3
            pts.append((cx + math.cos(a) * r, cy + math.sin(a) * r))
    else:
        for i in range(10):
            a = -math.pi / 2 + i * math.pi / 5
            rr = r * (0.46 if i % 2 else 1.0)
            pts.append((cx + math.cos(a) * rr, cy + math.sin(a) * rr))
    draw.polygon(pts, fill=color)


def main():
    base = vertical_gradient(W, H, BG_TOP, BG_BOT)
    base = glow(base, 120, -70, 520, 380, GOLD_2, 120)
    base = glow(base, 1090, 40, 460, 340, SAPPHIRE, 70)
    base = glow(base, 820, 700, 520, 320, RUBY, 52)

    d = ImageDraw.Draw(base, "RGBA")

    # Три механики подряд — ровно то, что на странице
    gem(d, 1005, 245, 60, 4, 240)
    gem(d, 900, 400, 45, 3, 235)
    gem(d, 1085, 432, 37, 2, 230)

    # Кольцо тайминг-механики
    d.ellipse([790, 145, 1140, 495], outline=EMERALD + (70,), width=10)

    kicker = font("arialbd.ttf", 20)
    title = font("arialbd.ttf", 76)
    lead = font("arialbd.ttf", 30)
    sub = font("arial.ttf", 25)

    x0 = 84
    y = 138

    # Красный бейдж, как hero__kicker на странице
    badge = "PLAYRIX · PLAYABLES (INTERN)"
    bw = d.textlength(badge, font=kicker) + 3 * len(badge) + 36
    d.rounded_rectangle([x0, y, x0 + bw, y + 38], radius=19, fill=RUBY)
    spaced(d, (x0 + 18, y + 10), badge, kicker, (255, 255, 255), 3)

    d.text((x0, y + 64), "Ярослав Кукар", fill=INK, font=title)
    d.text((x0, y + 158), "Геймдизайнер плейблов", fill=EMERALD, font=lead)

    d.line([(x0, y + 232), (x0 + 320, y + 232)], fill=(0xD4, 0xAE, 0x79), width=3)

    d.text((x0, y + 258), "Резюме, в которое сразу можно", fill=INK_2, font=sub)
    d.text((x0, y + 296), "поиграть: три механики и разбор каждой", fill=INK_2, font=sub)

    handle, hf = "@Kerarty", font("arialbd.ttf", 23)
    hx = spaced(d, (x0, H - 70), handle, hf, INK, 2)
    d.text((hx + 18, H - 70), "kukar.yar@gmail.com", fill=INK_3, font=font("arial.ttf", 23))

    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    base.save(OUT, "PNG", optimize=True)
    print("saved:", OUT, os.path.getsize(OUT), "bytes")


if __name__ == "__main__":
    main()
