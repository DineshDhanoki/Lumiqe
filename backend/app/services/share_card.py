"""
Lumiqe -- Share Card Generator.

Generates a 1200x630 OG-compatible PNG image for social sharing,
featuring the user's skin color, season, undertone, and palette swatches.
"""

import io
import logging

from PIL import Image, ImageDraw, ImageFont

logger = logging.getLogger("lumiqe.services.share_card")


def _hex_to_rgb(hex_color: str) -> tuple[int, int, int]:
    """Convert #RRGGBB to (R, G, B) tuple."""
    h = hex_color.lstrip("#")
    return (int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16))


def _contrasting_text_color(
    bg_rgb: tuple[int, int, int],
) -> tuple[int, int, int]:
    """Return white or dark text depending on background luminance."""
    luminance = 0.299 * bg_rgb[0] + 0.587 * bg_rgb[1] + 0.114 * bg_rgb[2]
    return (255, 255, 255) if luminance < 140 else (20, 20, 20)


def _load_fonts() -> dict[str, ImageFont.FreeTypeFont | ImageFont.ImageFont]:
    """Load fonts with fallback to Pillow default."""
    fonts: dict[str, ImageFont.FreeTypeFont | ImageFont.ImageFont] = {}
    font_paths = [
        # Linux
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
        "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
        # Windows
        "C:/Windows/Fonts/arialbd.ttf",
        "C:/Windows/Fonts/arial.ttf",
    ]
    bold_path = None
    regular_path = None
    for path in font_paths:
        try:
            ImageFont.truetype(path, 12)
            if "Bold" in path or "bd" in path:
                bold_path = bold_path or path
            else:
                regular_path = regular_path or path
        except (OSError, IOError):
            continue

    try:
        bp = bold_path or regular_path
        rp = regular_path or bold_path
        if bp and rp:
            fonts["brand"] = ImageFont.truetype(bp, 40)
            fonts["season"] = ImageFont.truetype(bp, 52)
            fonts["hex"] = ImageFont.truetype(rp, 22)
            fonts["undertone"] = ImageFont.truetype(rp, 26)
            fonts["cta"] = ImageFont.truetype(rp, 20)
            fonts["label"] = ImageFont.truetype(rp, 16)
        else:
            raise OSError("No usable font found")
    except (OSError, IOError):
        default = ImageFont.load_default()
        for key in ("brand", "season", "hex", "undertone", "cta", "label"):
            fonts[key] = default

    return fonts


def generate_share_card(
    season: str,
    hex_color: str,
    palette: list[str],
    undertone: str,
) -> bytes:
    """
    Generate a 1200x630 OG image for social sharing.

    Layout:
        Left half  -- large skin color circle + hex code
        Right half -- season name (large), undertone, 6 palette swatches,
                      "Discover yours at lumiqe.in" CTA
        Brand header "LUMIQE" at top
    """
    width, height = 1200, 630
    img = Image.new("RGB", (width, height), (12, 12, 12))
    draw = ImageDraw.Draw(img)

    skin_rgb = _hex_to_rgb(hex_color)
    fonts = _load_fonts()

    # ── Background gradient ──────────────────────────────────
    for y in range(height):
        ratio = y / height
        r = int(12 + skin_rgb[0] * 0.06 * ratio)
        g = int(12 + skin_rgb[1] * 0.06 * ratio)
        b = int(12 + skin_rgb[2] * 0.06 * ratio)
        draw.line(
            [(0, y), (width, y)],
            fill=(min(r, 255), min(g, 255), min(b, 255)),
        )

    # ── Brand header ─────────────────────────────────────────
    draw.text((50, 30), "LUMIQE", fill=(239, 68, 68), font=fonts["brand"])

    # ── Left half: skin color circle ─────────────────────────
    circle_cx, circle_cy = 250, 310
    circle_radius = 110
    draw.ellipse(
        [
            circle_cx - circle_radius,
            circle_cy - circle_radius,
            circle_cx + circle_radius,
            circle_cy + circle_radius,
        ],
        fill=skin_rgb,
        outline=(255, 255, 255, 60),
        width=3,
    )
    # Hex code below circle
    hex_label = hex_color.upper()
    draw.text(
        (circle_cx, circle_cy + circle_radius + 20),
        hex_label,
        fill=(200, 200, 200),
        font=fonts["hex"],
        anchor="mt",
    )

    # ── Right half ───────────────────────────────────────────
    right_x = 500

    # Season name
    draw.text(
        (right_x, 120),
        season,
        fill=(255, 255, 255),
        font=fonts["season"],
    )

    # Undertone
    if undertone:
        draw.text(
            (right_x, 190),
            f"{undertone.capitalize()} Undertone",
            fill=(180, 180, 180),
            font=fonts["undertone"],
        )

    # Palette swatches (up to 6)
    swatch_y = 280
    swatch_size = 60
    swatch_gap = 16
    for i, color_hex in enumerate(palette[:6]):
        sx = right_x + i * (swatch_size + swatch_gap)
        rgb = _hex_to_rgb(color_hex)
        draw.rounded_rectangle(
            [sx, swatch_y, sx + swatch_size, swatch_y + swatch_size],
            radius=12,
            fill=rgb,
            outline=(60, 60, 60),
            width=1,
        )

    # Palette label
    draw.text(
        (right_x, swatch_y - 30),
        "Your Palette",
        fill=(140, 140, 140),
        font=fonts["label"],
    )

    # CTA
    draw.text(
        (right_x, 420),
        "Discover yours at lumiqe.in",
        fill=(120, 120, 120),
        font=fonts["cta"],
    )

    # ── Subtle bottom accent line ────────────────────────────
    draw.rectangle(
        [0, height - 4, width, height],
        fill=(239, 68, 68),
    )

    # ── Export ────────────────────────────────────────────────
    buf = io.BytesIO()
    img.save(buf, format="PNG", optimize=True)
    logger.debug(
        "Generated share card: season=%s hex=%s palette_count=%d",
        season,
        hex_color,
        len(palette),
    )
    return buf.getvalue()
