#!/usr/bin/env python3
"""Generate the AMP Field launcher, splash and favicon assets.

The mark is pure geometry — a restrained AMP red accent bar beside three
report lines — so it is reproducible without any font dependency and stays
crisp at every density.

Usage:  python3 scripts/generate-brand-assets.py
Requires: Pillow (pip install pillow)
"""

from __future__ import annotations

import pathlib

from PIL import Image, ImageDraw

OUT = pathlib.Path(__file__).resolve().parent.parent / "assets" / "brand"

INK = (10, 11, 13, 255)        # surface-primary / near-black
RED = (217, 58, 46, 255)       # accent-primary
WHITE = (242, 245, 248, 255)   # text-primary
SLATE = (139, 150, 166, 255)   # text-muted

# The mark is authored on a 1024 grid and scaled down for each output.
GRID = 1024


def draw_mark(size: int, background: tuple[int, int, int, int] | None, scale: float = 1.0) -> Image.Image:
    """Render the AMP Field mark at `size` px, optionally over a background."""
    canvas = Image.new("RGBA", (GRID, GRID), background or (0, 0, 0, 0))
    draw = ImageDraw.Draw(canvas)

    # The mark is laid out inside a centred square of side `span`.
    span = GRID * scale
    left = (GRID - span) / 2

    line_h = span * 0.150
    line_gap = span * 0.135
    block_h = line_h * 3 + line_gap * 2
    top = (GRID - block_h) / 2

    bar_w = span * 0.105
    bar_pad = span * 0.06

    # Accent bar, slightly taller than the lines it introduces.
    draw.rounded_rectangle(
        [left, top - bar_pad, left + bar_w, top + block_h + bar_pad],
        radius=bar_w / 2,
        fill=RED,
    )

    # Three report lines of decreasing length.
    line_left = left + bar_w + span * 0.14
    max_line_w = span - (line_left - left)

    for index, (ratio, colour) in enumerate(zip((1.0, 0.78, 0.52), (WHITE, WHITE, SLATE))):
        y = top + index * (line_h + line_gap)
        draw.rounded_rectangle(
            [line_left, y, line_left + max_line_w * ratio, y + line_h],
            radius=line_h / 2,
            fill=colour,
        )

    return canvas.resize((size, size), Image.LANCZOS)


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)

    # App icon: opaque, mark inset so it survives the iOS corner mask.
    draw_mark(1024, INK, scale=0.62).save(OUT / "icon.png")

    # Android adaptive foreground: transparent, mark inside the 66% safe zone.
    draw_mark(1024, None, scale=0.50).save(OUT / "adaptive-icon.png")

    # Splash: transparent, sized for the 180pt splash image slot.
    draw_mark(512, None, scale=0.80).save(OUT / "splash-icon.png")

    # Web favicon.
    draw_mark(64, INK, scale=0.70).save(OUT / "favicon.png")

    for name in ("icon.png", "adaptive-icon.png", "splash-icon.png", "favicon.png"):
        print(f"wrote assets/brand/{name}")


if __name__ == "__main__":
    main()
