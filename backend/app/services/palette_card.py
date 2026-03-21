"""
Palette Card Generator — creates shareable PNG images.

Generates a 1080×1920 card with:
  - Lumiqe branding
  - Season name + undertone
  - 6-color palette swatches with hex codes
  - Metal recommendation
  - Confidence score
  - QR/URL footer
"""

import logging
from io import BytesIO

from PIL import Image, ImageDraw, ImageFont

logger = logging.getLogger("lumiqe.palette_card")

# ─── Constants ────────────────────────────────────────────────
CARD_WIDTH = 1080
CARD_HEIGHT = 1920
BG_COLOR = (20, 10, 15)  # Near-black with warm tint
ACCENT_WARM = (200, 120, 64)
ACCENT_COOL = (120, 100, 160)
TEXT_WHITE = (255, 255, 255)
TEXT_MUTED = (180, 170, 175)
SWATCH_SIZE = 140
SWATCH_GAP = 30
SWATCH_RADIUS = 16


def _hex_to_rgb(hex_color: str) -> tuple[int, int, int]:
    """Convert hex color string to RGB tuple."""
    hex_color = hex_color.lstrip("#")
    if len(hex_color) != 6:
        return (128, 128, 128)
    return tuple(int(hex_color[i:i+2], 16) for i in (0, 2, 4))


def _draw_rounded_rect(
    draw: ImageDraw.ImageDraw,
    bbox: tuple[int, int, int, int],
    fill: tuple[int, int, int],
    radius: int = 16,
):
    """Draw a rounded rectangle on the canvas."""
    draw.rounded_rectangle(bbox, radius=radius, fill=fill)


def _get_font(size: int) -> ImageFont.FreeTypeFont:
    """Get a font, falling back to default if custom not available."""
    try:
        return ImageFont.truetype("arial.ttf", size)
    except (OSError, IOError):
        try:
            return ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", size)
        except (OSError, IOError):
            return ImageFont.load_default()


def generate_card(
    season: str,
    palette: list[str],
    hex_color: str,
    undertone: str,
    metal: str = "",
    confidence: float = 0.0,
) -> bytes:
    """
    Generate a shareable palette card as PNG bytes.

    Args:
        season: Color season name (e.g., "True Autumn").
        palette: List of 6 hex color strings.
        hex_color: Detected skin hex color.
        undertone: "warm", "cool", or "neutral".
        metal: "Gold", "Silver", or "Both".
        confidence: Analysis confidence (0.0-1.0).

    Returns:
        PNG image as bytes.
    """
    img = Image.new("RGB", (CARD_WIDTH, CARD_HEIGHT), BG_COLOR)
    draw = ImageDraw.Draw(img)

    # Accent color based on undertone
    accent = ACCENT_WARM if undertone == "warm" else ACCENT_COOL

    # ─── Gradient background overlay ─────────────────────────
    for y in range(CARD_HEIGHT):
        ratio = y / CARD_HEIGHT
        r = int(BG_COLOR[0] + (accent[0] - BG_COLOR[0]) * ratio * 0.15)
        g = int(BG_COLOR[1] + (accent[1] - BG_COLOR[1]) * ratio * 0.15)
        b = int(BG_COLOR[2] + (accent[2] - BG_COLOR[2]) * ratio * 0.15)
        draw.line([(0, y), (CARD_WIDTH, y)], fill=(r, g, b))

    # ─── Fonts ───────────────────────────────────────────────
    font_brand = _get_font(48)
    font_season = _get_font(72)
    font_label = _get_font(32)
    font_hex = _get_font(24)
    font_small = _get_font(28)

    # ─── Top: Lumiqe branding ─────────────────────────────────
    y_cursor = 120
    brand_text = "✨ LUMIQE"
    brand_bbox = draw.textbbox((0, 0), brand_text, font=font_brand)
    brand_width = brand_bbox[2] - brand_bbox[0]
    draw.text(
        ((CARD_WIDTH - brand_width) // 2, y_cursor),
        brand_text,
        fill=accent,
        font=font_brand,
    )

    # ─── Season name ─────────────────────────────────────────
    y_cursor += 120
    season_bbox = draw.textbbox((0, 0), season, font=font_season)
    season_width = season_bbox[2] - season_bbox[0]
    draw.text(
        ((CARD_WIDTH - season_width) // 2, y_cursor),
        season,
        fill=TEXT_WHITE,
        font=font_season,
    )

    # ─── Undertone badge ─────────────────────────────────────
    y_cursor += 110
    undertone_text = f"{undertone.title()} Undertone"
    ut_bbox = draw.textbbox((0, 0), undertone_text, font=font_label)
    ut_width = ut_bbox[2] - ut_bbox[0]
    badge_padding = 24
    badge_x = (CARD_WIDTH - ut_width - badge_padding * 2) // 2
    _draw_rounded_rect(
        draw,
        (badge_x, y_cursor, badge_x + ut_width + badge_padding * 2, y_cursor + 52),
        fill=(*accent, 80) if len(accent) == 3 else accent,
        radius=26,
    )
    draw.text(
        ((CARD_WIDTH - ut_width) // 2, y_cursor + 8),
        undertone_text,
        fill=TEXT_WHITE,
        font=font_label,
    )

    # ─── Detected skin color circle ──────────────────────────
    y_cursor += 100
    skin_rgb = _hex_to_rgb(hex_color)
    circle_size = 100
    circle_x = (CARD_WIDTH - circle_size) // 2
    draw.ellipse(
        [circle_x, y_cursor, circle_x + circle_size, y_cursor + circle_size],
        fill=skin_rgb,
        outline=TEXT_WHITE,
        width=3,
    )
    draw.text(
        ((CARD_WIDTH - len(hex_color) * 14) // 2, y_cursor + circle_size + 12),
        hex_color,
        fill=TEXT_MUTED,
        font=font_hex,
    )

    # ─── Palette label ───────────────────────────────────────
    y_cursor += circle_size + 70
    palette_label = "YOUR PALETTE"
    pl_bbox = draw.textbbox((0, 0), palette_label, font=font_label)
    pl_width = pl_bbox[2] - pl_bbox[0]
    draw.text(
        ((CARD_WIDTH - pl_width) // 2, y_cursor),
        palette_label,
        fill=TEXT_MUTED,
        font=font_label,
    )

    # ─── Color swatches (2 rows × 3) ────────────────────────
    y_cursor += 60
    swatch_colors = palette[:6] if len(palette) >= 6 else palette
    row_width = 3 * SWATCH_SIZE + 2 * SWATCH_GAP
    start_x = (CARD_WIDTH - row_width) // 2

    for i, hex_col in enumerate(swatch_colors):
        row = i // 3
        col = i % 3
        sx = start_x + col * (SWATCH_SIZE + SWATCH_GAP)
        sy = y_cursor + row * (SWATCH_SIZE + SWATCH_GAP + 40)
        rgb = _hex_to_rgb(hex_col)

        _draw_rounded_rect(
            draw,
            (sx, sy, sx + SWATCH_SIZE, sy + SWATCH_SIZE),
            fill=rgb,
            radius=SWATCH_RADIUS,
        )

        # Hex label under each swatch
        hex_label = hex_col.upper()
        hl_bbox = draw.textbbox((0, 0), hex_label, font=font_hex)
        hl_width = hl_bbox[2] - hl_bbox[0]
        draw.text(
            (sx + (SWATCH_SIZE - hl_width) // 2, sy + SWATCH_SIZE + 8),
            hex_label,
            fill=TEXT_MUTED,
            font=font_hex,
        )

    # ─── Metal recommendation ────────────────────────────────
    y_cursor += 2 * (SWATCH_SIZE + SWATCH_GAP + 40) + 40
    if metal:
        metal_icon = "🥇" if metal.lower() == "gold" else "🥈"
        metal_text = f"{metal_icon}  Best Metal: {metal}"
        mt_bbox = draw.textbbox((0, 0), metal_text, font=font_small)
        mt_width = mt_bbox[2] - mt_bbox[0]
        draw.text(
            ((CARD_WIDTH - mt_width) // 2, y_cursor),
            metal_text,
            fill=TEXT_WHITE,
            font=font_small,
        )
        y_cursor += 60

    # ─── Confidence ──────────────────────────────────────────
    if confidence > 0:
        conf_text = f"Confidence: {int(confidence * 100)}%"
        ct_bbox = draw.textbbox((0, 0), conf_text, font=font_small)
        ct_width = ct_bbox[2] - ct_bbox[0]
        draw.text(
            ((CARD_WIDTH - ct_width) // 2, y_cursor),
            conf_text,
            fill=TEXT_MUTED,
            font=font_small,
        )
        y_cursor += 60

    # ─── Footer — Lumiqe branding & CTA ─────────────────────
    footer_y = CARD_HEIGHT - 140
    # Divider line
    draw.line([(100, footer_y), (CARD_WIDTH - 100, footer_y)], fill=(*accent, 60) if len(accent) == 3 else accent, width=1)
    footer_y += 20

    cta_text = "Discover yours at lumiqe.in"
    cta_bbox = draw.textbbox((0, 0), cta_text, font=font_small)
    cta_width = cta_bbox[2] - cta_bbox[0]
    draw.text(
        ((CARD_WIDTH - cta_width) // 2, footer_y),
        cta_text,
        fill=TEXT_WHITE,
        font=font_small,
    )

    footer_y += 50
    watermark = "LUMIQE"
    wm_font = _get_font(36)
    wm_bbox = draw.textbbox((0, 0), watermark, font=wm_font)
    wm_width = wm_bbox[2] - wm_bbox[0]
    draw.text(
        ((CARD_WIDTH - wm_width) // 2, footer_y),
        watermark,
        fill=(*TEXT_MUTED[:3], 120) if len(TEXT_MUTED) == 3 else TEXT_MUTED,
        font=wm_font,
    )

    # ─── Save to bytes ───────────────────────────────────────
    output = BytesIO()
    img.save(output, format="PNG", optimize=True)
    png_bytes = output.getvalue()
    logger.info(f"Generated palette card: {len(png_bytes)} bytes")
    return png_bytes


def generate_square_card(
    season: str,
    palette: list[str],
    hex_color: str,
    undertone: str,
    metal: str = "",
    confidence: float = 0.0,
) -> bytes:
    """
    Generate a 1080x1080 Instagram-friendly palette card.

    Same content as the story card but in square format.
    """
    SIZE = 1080
    img = Image.new("RGB", (SIZE, SIZE), BG_COLOR)
    draw = ImageDraw.Draw(img)

    accent = ACCENT_WARM if undertone == "warm" else ACCENT_COOL

    # Gradient background
    for y in range(SIZE):
        ratio = y / SIZE
        r = int(BG_COLOR[0] + (accent[0] - BG_COLOR[0]) * ratio * 0.15)
        g = int(BG_COLOR[1] + (accent[1] - BG_COLOR[1]) * ratio * 0.15)
        b = int(BG_COLOR[2] + (accent[2] - BG_COLOR[2]) * ratio * 0.15)
        draw.line([(0, y), (SIZE, y)], fill=(r, g, b))

    font_brand = _get_font(36)
    font_season = _get_font(56)
    font_label = _get_font(26)
    font_hex = _get_font(20)
    font_small = _get_font(22)

    # Brand
    y_cursor = 60
    brand_text = "LUMIQE"
    br_bbox = draw.textbbox((0, 0), brand_text, font=font_brand)
    draw.text(((SIZE - (br_bbox[2] - br_bbox[0])) // 2, y_cursor), brand_text, fill=accent, font=font_brand)

    # Season
    y_cursor += 80
    s_bbox = draw.textbbox((0, 0), season, font=font_season)
    draw.text(((SIZE - (s_bbox[2] - s_bbox[0])) // 2, y_cursor), season, fill=TEXT_WHITE, font=font_season)

    # Undertone
    y_cursor += 80
    ut_text = f"{undertone.title()} Undertone"
    ut_bbox = draw.textbbox((0, 0), ut_text, font=font_label)
    draw.text(((SIZE - (ut_bbox[2] - ut_bbox[0])) // 2, y_cursor), ut_text, fill=TEXT_MUTED, font=font_label)

    # Skin color circle
    y_cursor += 60
    skin_rgb = _hex_to_rgb(hex_color)
    circle_size = 70
    circle_x = (SIZE - circle_size) // 2
    draw.ellipse([circle_x, y_cursor, circle_x + circle_size, y_cursor + circle_size], fill=skin_rgb, outline=TEXT_WHITE, width=2)

    # Palette swatches (2 rows x 3)
    y_cursor += circle_size + 50
    swatch_size = 120
    swatch_gap = 24
    swatch_colors = palette[:6] if len(palette) >= 6 else palette
    row_width = 3 * swatch_size + 2 * swatch_gap
    start_x = (SIZE - row_width) // 2

    for i, hex_col in enumerate(swatch_colors):
        row = i // 3
        col = i % 3
        sx = start_x + col * (swatch_size + swatch_gap)
        sy = y_cursor + row * (swatch_size + swatch_gap + 32)
        rgb = _hex_to_rgb(hex_col)
        _draw_rounded_rect(draw, (sx, sy, sx + swatch_size, sy + swatch_size), fill=rgb, radius=12)
        hl = hex_col.upper()
        hl_bbox = draw.textbbox((0, 0), hl, font=font_hex)
        draw.text((sx + (swatch_size - (hl_bbox[2] - hl_bbox[0])) // 2, sy + swatch_size + 6), hl, fill=TEXT_MUTED, font=font_hex)

    # Metal + confidence
    y_cursor += 2 * (swatch_size + swatch_gap + 32) + 20
    if metal:
        metal_icon = "Gold" if metal.lower() == "gold" else "Silver"
        mt_text = f"Best Metal: {metal_icon}"
        mt_bbox = draw.textbbox((0, 0), mt_text, font=font_small)
        draw.text(((SIZE - (mt_bbox[2] - mt_bbox[0])) // 2, y_cursor), mt_text, fill=TEXT_WHITE, font=font_small)
        y_cursor += 40

    # Footer CTA
    footer_y = SIZE - 60
    cta = "Discover yours at lumiqe.in"
    cta_bbox = draw.textbbox((0, 0), cta, font=font_small)
    draw.text(((SIZE - (cta_bbox[2] - cta_bbox[0])) // 2, footer_y), cta, fill=TEXT_MUTED, font=font_small)

    output = BytesIO()
    img.save(output, format="PNG", optimize=True)
    png_bytes = output.getvalue()
    logger.info(f"Generated square palette card: {len(png_bytes)} bytes")
    return png_bytes
