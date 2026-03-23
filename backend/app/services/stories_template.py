"""
Lumiqe — Instagram Stories Template Generator.

Generates a branded 1080x1920 PNG card with the user's color analysis
results for sharing on Instagram Stories.
"""

import logging
from io import BytesIO

from PIL import Image, ImageDraw, ImageFont

logger = logging.getLogger("lumiqe.stories_template")

# ─── Layout Constants ────────────────────────────────────────
CARD_WIDTH = 1080
CARD_HEIGHT = 1920
BG_COLOR = (15, 10, 20)
ACCENT_RED = (239, 68, 68)
TEXT_WHITE = (255, 255, 255)
TEXT_MUTED = (161, 161, 170)
SWATCH_SIZE = 130
SWATCH_GAP = 24
SWATCH_RADIUS = 14


def _hex_to_rgb(hex_color: str) -> tuple[int, int, int]:
    """Convert hex color string to RGB tuple."""
    hex_color = hex_color.lstrip("#")
    if len(hex_color) != 6:
        return (128, 128, 128)
    return (
        int(hex_color[0:2], 16),
        int(hex_color[2:4], 16),
        int(hex_color[4:6], 16),
    )


def _get_font(size: int) -> ImageFont.FreeTypeFont:
    """Get a font, falling back gracefully if custom fonts are unavailable."""
    font_paths = [
        "arial.ttf",
        "Arial.ttf",
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
        "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
        "C:/Windows/Fonts/arial.ttf",
    ]
    for path in font_paths:
        try:
            return ImageFont.truetype(path, size)
        except (OSError, IOError):
            continue
    return ImageFont.load_default()


def _draw_rounded_rect(
    draw: ImageDraw.ImageDraw,
    bbox: tuple[int, int, int, int],
    fill: tuple[int, ...],
    radius: int = 14,
) -> None:
    """Draw a rounded rectangle on the canvas."""
    draw.rounded_rectangle(bbox, radius=radius, fill=fill)


def _draw_centered_text(
    draw: ImageDraw.ImageDraw,
    y: int,
    text: str,
    font: ImageFont.FreeTypeFont,
    fill: tuple[int, ...],
) -> int:
    """Draw horizontally centered text and return the bottom y coordinate."""
    bbox = draw.textbbox((0, 0), text, font=font)
    text_width = bbox[2] - bbox[0]
    text_height = bbox[3] - bbox[1]
    x = (CARD_WIDTH - text_width) // 2
    draw.text((x, y), text, fill=fill, font=font)
    return y + text_height


def generate_stories_card(
    season: str,
    hex_color: str,
    palette: list[str],
    undertone: str,
) -> bytes:
    """
    Generate a 1080x1920 Instagram Stories PNG card.

    Args:
        season: Color season name (e.g., "True Autumn").
        hex_color: Detected skin hex color (e.g., "#C68642").
        palette: List of palette hex color strings (uses up to 6).
        undertone: "warm", "cool", or "neutral".

    Returns:
        PNG image as bytes.
    """
    img = Image.new("RGB", (CARD_WIDTH, CARD_HEIGHT), BG_COLOR)
    draw = ImageDraw.Draw(img)

    # ─── Subtle gradient background ──────────────────────────
    skin_rgb = _hex_to_rgb(hex_color)
    for y in range(CARD_HEIGHT):
        ratio = y / CARD_HEIGHT
        r = int(BG_COLOR[0] + (skin_rgb[0] - BG_COLOR[0]) * ratio * 0.08)
        g = int(BG_COLOR[1] + (skin_rgb[1] - BG_COLOR[1]) * ratio * 0.08)
        b = int(BG_COLOR[2] + (skin_rgb[2] - BG_COLOR[2]) * ratio * 0.08)
        draw.line([(0, y), (CARD_WIDTH, y)], fill=(r, g, b))

    # ─── Fonts ───────────────────────────────────────────────
    font_brand = _get_font(52)
    font_season = _get_font(68)
    font_label = _get_font(32)
    font_hex = _get_font(22)
    font_cta = _get_font(28)

    # ─── Brand Header ────────────────────────────────────────
    y_cursor = 140
    y_cursor = _draw_centered_text(
        draw, y_cursor, "LUMIQE", font_brand, ACCENT_RED
    )

    # ─── Tagline ─────────────────────────────────────────────
    y_cursor += 16
    y_cursor = _draw_centered_text(
        draw, y_cursor, "Your Color Analysis", font_label, TEXT_MUTED
    )

    # ─── Divider ─────────────────────────────────────────────
    y_cursor += 32
    draw.line(
        [(200, y_cursor), (CARD_WIDTH - 200, y_cursor)],
        fill=(*ACCENT_RED, 100),
        width=1,
    )

    # ─── Season Name ─────────────────────────────────────────
    y_cursor += 48
    y_cursor = _draw_centered_text(
        draw, y_cursor, season, font_season, TEXT_WHITE
    )

    # ─── Skin Color Circle ───────────────────────────────────
    y_cursor += 64
    circle_diameter = 120
    circle_x = (CARD_WIDTH - circle_diameter) // 2
    draw.ellipse(
        [circle_x, y_cursor, circle_x + circle_diameter, y_cursor + circle_diameter],
        fill=skin_rgb,
        outline=TEXT_WHITE,
        width=3,
    )
    y_cursor += circle_diameter + 16

    # Hex label under circle
    _draw_centered_text(draw, y_cursor, hex_color.upper(), font_hex, TEXT_MUTED)

    # ─── Palette Label ───────────────────────────────────────
    y_cursor += 60
    y_cursor = _draw_centered_text(
        draw, y_cursor, "YOUR BEST COLORS", font_label, TEXT_MUTED
    )

    # ─── 6 Palette Swatches (2 rows x 3) ────────────────────
    y_cursor += 40
    swatch_colors = palette[:6] if len(palette) >= 6 else palette
    row_width = 3 * SWATCH_SIZE + 2 * SWATCH_GAP
    start_x = (CARD_WIDTH - row_width) // 2

    for i, hex_col in enumerate(swatch_colors):
        row = i // 3
        col = i % 3
        sx = start_x + col * (SWATCH_SIZE + SWATCH_GAP)
        sy = y_cursor + row * (SWATCH_SIZE + SWATCH_GAP + 36)
        rgb = _hex_to_rgb(hex_col)

        _draw_rounded_rect(
            draw,
            (sx, sy, sx + SWATCH_SIZE, sy + SWATCH_SIZE),
            fill=rgb,
            radius=SWATCH_RADIUS,
        )

        # Hex label under each swatch
        hex_label = hex_col.upper()
        label_bbox = draw.textbbox((0, 0), hex_label, font=font_hex)
        label_width = label_bbox[2] - label_bbox[0]
        draw.text(
            (sx + (SWATCH_SIZE - label_width) // 2, sy + SWATCH_SIZE + 8),
            hex_label,
            fill=TEXT_MUTED,
            font=font_hex,
        )

    # ─── Undertone Badge ─────────────────────────────────────
    num_rows = (len(swatch_colors) + 2) // 3
    y_cursor += num_rows * (SWATCH_SIZE + SWATCH_GAP + 36) + 40

    undertone_text = f"{undertone.title()} Undertone"
    ut_bbox = draw.textbbox((0, 0), undertone_text, font=font_label)
    ut_width = ut_bbox[2] - ut_bbox[0]
    badge_padding = 28
    badge_x = (CARD_WIDTH - ut_width - badge_padding * 2) // 2
    _draw_rounded_rect(
        draw,
        (badge_x, y_cursor, badge_x + ut_width + badge_padding * 2, y_cursor + 56),
        fill=(40, 30, 45),
        radius=28,
    )
    draw.text(
        ((CARD_WIDTH - ut_width) // 2, y_cursor + 10),
        undertone_text,
        fill=TEXT_WHITE,
        font=font_label,
    )

    # ─── Footer: CTA ─────────────────────────────────────────
    footer_y = CARD_HEIGHT - 180
    draw.line(
        [(120, footer_y), (CARD_WIDTH - 120, footer_y)],
        fill=(*ACCENT_RED, 80),
        width=1,
    )
    footer_y += 28

    _draw_centered_text(
        draw, footer_y, "Find your colors at", font_hex, TEXT_MUTED
    )
    footer_y += 36
    _draw_centered_text(
        draw, footer_y, "lumiqe.in", font_cta, ACCENT_RED
    )

    # ─── Watermark ───────────────────────────────────────────
    footer_y += 48
    wm_font = _get_font(20)
    _draw_centered_text(draw, footer_y, "LUMIQE", wm_font, (80, 75, 85))

    # ─── Export PNG ──────────────────────────────────────────
    output = BytesIO()
    img.save(output, format="PNG", optimize=True)
    png_bytes = output.getvalue()
    logger.info(f"Generated stories card: {len(png_bytes)} bytes")
    return png_bytes
