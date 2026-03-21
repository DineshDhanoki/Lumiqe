"""
Lumiqe — OG Image Generator.

Generates 1200x630 Open Graph images for social sharing.
Uses Pillow for server-side rendering.
"""

import io

from PIL import Image, ImageDraw, ImageFont


def _hex_to_rgb(hex_color: str) -> tuple[int, int, int]:
    """Convert #RRGGBB to (R, G, B) tuple."""
    h = hex_color.lstrip("#")
    return tuple(int(h[i:i+2], 16) for i in (0, 2, 4))


def generate_og_image(
    season: str,
    hex_color: str,
    palette: list[str],
    undertone: str = "",
) -> bytes:
    """Generate a 1200x630 OG image with palette swatches and branding."""
    W, H = 1200, 630
    img = Image.new("RGB", (W, H), (10, 10, 10))
    draw = ImageDraw.Draw(img)

    # Try to load a nice font, fall back to default
    try:
        font_large = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 52)
        font_medium = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 28)
        font_small = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 20)
        font_brand = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 36)
    except (OSError, IOError):
        font_large = ImageFont.load_default()
        font_medium = ImageFont.load_default()
        font_small = ImageFont.load_default()
        font_brand = ImageFont.load_default()

    # Background gradient effect — dark with accent
    skin_rgb = _hex_to_rgb(hex_color)
    for y in range(H):
        ratio = y / H
        r = int(10 + skin_rgb[0] * 0.08 * ratio)
        g = int(10 + skin_rgb[1] * 0.08 * ratio)
        b = int(10 + skin_rgb[2] * 0.08 * ratio)
        draw.line([(0, y), (W, y)], fill=(min(r, 255), min(g, 255), min(b, 255)))

    # Left side — skin color circle
    circle_x, circle_y, circle_r = 200, 250, 90
    draw.ellipse(
        [circle_x - circle_r, circle_y - circle_r, circle_x + circle_r, circle_y + circle_r],
        fill=skin_rgb,
        outline=(255, 255, 255, 40),
        width=3,
    )

    # Season name
    draw.text((360, 180), season, fill=(255, 255, 255), font=font_large)

    # Undertone
    if undertone:
        draw.text((360, 250), f"{undertone.capitalize()} Undertone", fill=(180, 180, 180), font=font_medium)

    # Palette swatches
    swatch_y = 340
    swatch_size = 56
    swatch_gap = 16
    swatch_x_start = 360
    for i, color in enumerate(palette[:6]):
        x = swatch_x_start + i * (swatch_size + swatch_gap)
        rgb = _hex_to_rgb(color)
        draw.rounded_rectangle(
            [x, swatch_y, x + swatch_size, swatch_y + swatch_size],
            radius=12,
            fill=rgb,
            outline=(60, 60, 60),
            width=1,
        )

    # Branding
    draw.text((80, 530), "LUMIQE", fill=(239, 68, 68), font=font_brand)

    # CTA
    draw.text((360, 540), "Discover your true colors at lumiqe.in", fill=(120, 120, 120), font=font_small)

    # Export to PNG bytes
    buf = io.BytesIO()
    img.save(buf, format="PNG", optimize=True)
    return buf.getvalue()
