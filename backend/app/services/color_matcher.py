"""
Color Matcher Service — Pure color-science module for the Buy or Pass scanner.

Uses K-Means clustering for dominant color extraction and CIE Delta-E 2000
for human-perceptual color distance. No ML models, no GPU needed.

Functions:
    extract_dominant_color(image_bytes) → hex string
    hex_to_lab(hex_color) → (L, a, b) tuple
    delta_e_cie2000(lab1, lab2) → float
    score_match(item_hex, palette_hexes) → ScanResult dict
"""

import logging
import math
from io import BytesIO

import numpy as np

logger = logging.getLogger("lumiqe.color_matcher")


# ─── Color Conversion ────────────────────────────────────────

def hex_to_rgb(hex_color: str) -> tuple[int, int, int]:
    """Convert a hex color string to an (R, G, B) tuple."""
    hex_color = hex_color.lstrip("#")
    return (
        int(hex_color[0:2], 16),
        int(hex_color[2:4], 16),
        int(hex_color[4:6], 16),
    )


def rgb_to_lab(r: int, g: int, b: int) -> tuple[float, float, float]:
    """Convert RGB (0-255) to CIE L*a*b* via XYZ intermediate."""
    # Step 1: RGB → Linear RGB (sRGB gamma correction)
    channels = []
    for channel in (r, g, b):
        c = channel / 255.0
        if c > 0.04045:
            c = ((c + 0.055) / 1.055) ** 2.4
        else:
            c = c / 12.92
        channels.append(c * 100.0)

    linear_r, linear_g, linear_b = channels

    # Step 2: Linear RGB → XYZ (D65 illuminant)
    x = linear_r * 0.4124564 + linear_g * 0.3575761 + linear_b * 0.1804375
    y = linear_r * 0.2126729 + linear_g * 0.7151522 + linear_b * 0.0721750
    z = linear_r * 0.0193339 + linear_g * 0.1191920 + linear_b * 0.9503041

    # Step 3: XYZ → L*a*b* (D65 white point)
    x_ref, y_ref, z_ref = 95.047, 100.000, 108.883
    x /= x_ref
    y /= y_ref
    z /= z_ref

    def f(t: float) -> float:
        if t > 0.008856:
            return t ** (1 / 3)
        return (7.787 * t) + (16 / 116)

    l_star = (116.0 * f(y)) - 16.0
    a_star = 500.0 * (f(x) - f(y))
    b_star = 200.0 * (f(y) - f(z))

    return (l_star, a_star, b_star)


def hex_to_lab(hex_color: str) -> tuple[float, float, float]:
    """Convert a hex color string directly to CIE L*a*b*."""
    r, g, b = hex_to_rgb(hex_color)
    return rgb_to_lab(r, g, b)


# ─── Delta-E CIE2000 ─────────────────────────────────────────

def delta_e_cie2000(
    lab1: tuple[float, float, float],
    lab2: tuple[float, float, float],
) -> float:
    """
    Calculate the CIE2000 Delta-E perceptual color distance.

    Returns a float where:
        < 5  = nearly indistinguishable
        5-10 = noticeable but acceptable
        10-30 = clearly different
        > 30 = completely different colors
    """
    l1, a1, b1 = lab1
    l2, a2, b2 = lab2

    # Step 1: Calculate C' and h'
    c1_ab = math.sqrt(a1 ** 2 + b1 ** 2)
    c2_ab = math.sqrt(a2 ** 2 + b2 ** 2)
    c_ab_mean = (c1_ab + c2_ab) / 2.0

    c_ab_mean_pow7 = c_ab_mean ** 7
    g = 0.5 * (1.0 - math.sqrt(c_ab_mean_pow7 / (c_ab_mean_pow7 + 25.0 ** 7)))

    a1_prime = a1 * (1.0 + g)
    a2_prime = a2 * (1.0 + g)

    c1_prime = math.sqrt(a1_prime ** 2 + b1 ** 2)
    c2_prime = math.sqrt(a2_prime ** 2 + b2 ** 2)

    h1_prime = math.degrees(math.atan2(b1, a1_prime)) % 360
    h2_prime = math.degrees(math.atan2(b2, a2_prime)) % 360

    # Step 2: Calculate deltas
    delta_l_prime = l2 - l1
    delta_c_prime = c2_prime - c1_prime

    if c1_prime * c2_prime == 0:
        delta_h_prime = 0
    elif abs(h2_prime - h1_prime) <= 180:
        delta_h_prime = h2_prime - h1_prime
    elif h2_prime - h1_prime > 180:
        delta_h_prime = h2_prime - h1_prime - 360
    else:
        delta_h_prime = h2_prime - h1_prime + 360

    delta_big_h_prime = 2.0 * math.sqrt(c1_prime * c2_prime) * math.sin(math.radians(delta_h_prime / 2.0))

    # Step 3: Calculate CIEDE2000
    l_prime_mean = (l1 + l2) / 2.0
    c_prime_mean = (c1_prime + c2_prime) / 2.0

    if c1_prime * c2_prime == 0:
        h_prime_mean = h1_prime + h2_prime
    elif abs(h1_prime - h2_prime) <= 180:
        h_prime_mean = (h1_prime + h2_prime) / 2.0
    elif h1_prime + h2_prime < 360:
        h_prime_mean = (h1_prime + h2_prime + 360) / 2.0
    else:
        h_prime_mean = (h1_prime + h2_prime - 360) / 2.0

    t = (
        1
        - 0.17 * math.cos(math.radians(h_prime_mean - 30))
        + 0.24 * math.cos(math.radians(2 * h_prime_mean))
        + 0.32 * math.cos(math.radians(3 * h_prime_mean + 6))
        - 0.20 * math.cos(math.radians(4 * h_prime_mean - 63))
    )

    s_l = 1 + (0.015 * (l_prime_mean - 50) ** 2) / math.sqrt(20 + (l_prime_mean - 50) ** 2)
    s_c = 1 + 0.045 * c_prime_mean
    s_h = 1 + 0.015 * c_prime_mean * t

    c_prime_mean_pow7 = c_prime_mean ** 7
    r_t = (
        -2.0
        * math.sqrt(c_prime_mean_pow7 / (c_prime_mean_pow7 + 25.0 ** 7))
        * math.sin(math.radians(60 * math.exp(-((h_prime_mean - 275) / 25) ** 2)))
    )

    delta_e = math.sqrt(
        (delta_l_prime / s_l) ** 2
        + (delta_c_prime / s_c) ** 2
        + (delta_big_h_prime / s_h) ** 2
        + r_t * (delta_c_prime / s_c) * (delta_big_h_prime / s_h)
    )

    return delta_e


# ─── Dominant Color Extraction ───────────────────────────────

def extract_dominant_color(image_bytes: bytes) -> str:
    """
    Extract the dominant color from a clothing image using K-Means clustering.

    A center-crop (inner 60%) is applied first to exclude background pixels
    that are typically at the edges of in-store clothing photos.

    Args:
        image_bytes: Raw image bytes (JPEG, PNG, or WebP).

    Returns:
        Hex color string of the dominant color (e.g., "#B85C38").
    """
    from PIL import Image
    from sklearn.cluster import KMeans

    image = Image.open(BytesIO(image_bytes)).convert("RGB")

    # Center-crop to remove background — clothing is usually centered
    w, h = image.size
    crop_factor = 0.6
    left = int(w * (1 - crop_factor) / 2)
    top = int(h * (1 - crop_factor) / 2)
    right = int(w * (1 + crop_factor) / 2)
    bottom = int(h * (1 + crop_factor) / 2)
    image = image.crop((left, top, right, bottom))

    # Resize for speed — K-Means doesn't need full resolution
    image = image.resize((150, 150))
    pixels = np.array(image).reshape(-1, 3).astype(np.float32)

    logger.info(f"Extracting dominant color from {len(pixels)} pixels (center-cropped)")

    km = KMeans(n_clusters=3, init="k-means++", n_init=5, max_iter=100, random_state=42)
    labels = km.fit_predict(pixels)

    cluster_sizes = np.bincount(labels)
    dominant_index = int(cluster_sizes.argmax())
    dominant_rgb = km.cluster_centers_[dominant_index].astype(int)

    dominant_hex = "#{:02X}{:02X}{:02X}".format(
        int(dominant_rgb[0]),
        int(dominant_rgb[1]),
        int(dominant_rgb[2]),
    )

    logger.info(
        f"Dominant color: {dominant_hex} "
        f"(cluster sizes: {cluster_sizes.tolist()}, dominant: {dominant_index})"
    )

    return dominant_hex


# ─── Color Name Lookup ────────────────────────────────────────

# Extended fashion-relevant color names (CSS4 + common fashion palette)
_COLOR_NAMES = {
    # Neutrals
    "#FFFFFF": "White", "#F5F5F5": "White Smoke", "#FFFFF0": "Ivory",
    "#FFFAF0": "Floral White", "#FAF0E6": "Linen", "#FDF5E6": "Old Lace",
    "#F5F5DC": "Beige", "#F0EAD6": "Eggshell", "#E8E8D8": "Ecru",
    "#D2B48C": "Tan", "#C4A882": "Khaki Brown", "#C8AD7F": "Pale Taupe",
    "#A9A9A9": "Dark Gray", "#808080": "Gray", "#696969": "Dim Gray",
    "#D3D3D3": "Light Gray", "#C0C0C0": "Silver", "#B0C4DE": "Light Steel Blue",
    "#2F4F4F": "Dark Slate Gray", "#000000": "Black",
    # Whites / Creams
    "#FAEBD7": "Antique White", "#FFDEAD": "Navajo White", "#FFFACD": "Lemon Chiffon",
    # Browns / Tans / Earth
    "#8B4513": "Saddle Brown", "#A0522D": "Sienna", "#D2691E": "Chocolate",
    "#C76B3F": "Burnt Sienna", "#CD853F": "Peru", "#DEB887": "Burlywood",
    "#F4A460": "Sandy Brown", "#DAA520": "Goldenrod", "#B8860B": "Dark Goldenrod",
    "#6B3E1C": "Dark Brown", "#7A4E30": "Medium Brown", "#B88858": "Light Brown",
    "#8B6914": "Golden Brown", "#C68642": "Bronze", "#A67B5B": "Café Au Lait",
    "#7B3F00": "Chocolate Brown", "#4B2E1A": "Dark Chocolate", "#5C3317": "Bark",
    # Reds / Pinks
    "#FF0000": "Red", "#DC143C": "Crimson", "#B22222": "Firebrick",
    "#8B0000": "Dark Red", "#FF6347": "Tomato", "#FF4500": "Orange Red",
    "#FF69B4": "Hot Pink", "#FF1493": "Deep Pink", "#C71585": "Medium Violet Red",
    "#DB7093": "Pale Violet Red", "#FFB6C1": "Light Pink", "#FFC0CB": "Pink",
    "#E75480": "Dark Pink", "#CE2939": "Cardinal Red", "#A52A2A": "Brown Red",
    "#800020": "Burgundy", "#722F37": "Wine", "#C41E3A": "Cardinal",
    # Oranges / Corals
    "#FF7F50": "Coral", "#FF6B35": "Burnt Orange", "#E2711D": "Ochre",
    "#FF8C00": "Dark Orange", "#FFA500": "Orange", "#FFD700": "Gold",
    "#FFA07A": "Light Salmon", "#FA8072": "Salmon", "#E9967A": "Dark Salmon",
    "#FF7043": "Deep Orange", "#BF5700": "Rust",
    # Yellows
    "#FFFF00": "Yellow", "#FFFFE0": "Light Yellow", "#FAFAD2": "Light Goldenrod",
    "#EEE8AA": "Pale Goldenrod", "#F0E68C": "Khaki", "#BDB76B": "Dark Khaki",
    "#9B870C": "Dark Yellow", "#E4D00A": "Citrine",
    # Greens
    "#008000": "Green", "#006400": "Dark Green", "#228B22": "Forest Green",
    "#32CD32": "Lime Green", "#90EE90": "Light Green", "#98FB98": "Pale Green",
    "#2E8B57": "Sea Green", "#3CB371": "Medium Sea Green", "#20B2AA": "Light Sea Green",
    "#00CED1": "Dark Turquoise", "#40E0D0": "Turquoise", "#48D1CC": "Medium Turquoise",
    "#7CFC00": "Lawn Green", "#ADFF2F": "Green Yellow", "#556B2F": "Dark Olive Green",
    "#6B8E23": "Olive Drab", "#808000": "Olive", "#8FBC8F": "Dark Sea Green",
    "#4F7942": "Fern Green", "#355E3B": "Hunter Green", "#29AB87": "Jungle Green",
    "#00A693": "Persian Green",
    # Blues / Teals
    "#0000FF": "Blue", "#000080": "Navy", "#00008B": "Dark Blue",
    "#0000CD": "Medium Blue", "#4169E1": "Royal Blue", "#1E90FF": "Dodger Blue",
    "#6495ED": "Cornflower Blue", "#87CEEB": "Sky Blue", "#87CEFA": "Light Sky Blue",
    "#4682B4": "Steel Blue", "#5F9EA0": "Cadet Blue", "#00BFFF": "Deep Sky Blue",
    "#191970": "Midnight Blue", "#003153": "Prussian Blue", "#0047AB": "Cobalt Blue",
    "#007BA7": "Cerulean", "#4B9CD3": "Carolina Blue", "#002366": "Royal Navy",
    # Purples / Violets
    "#800080": "Purple", "#4B0082": "Indigo", "#9400D3": "Dark Violet",
    "#8A2BE2": "Blue Violet", "#9370DB": "Medium Purple", "#6A5ACD": "Slate Blue",
    "#483D8B": "Dark Slate Blue", "#BA55D3": "Medium Orchid", "#DA70D6": "Orchid",
    "#EE82EE": "Violet", "#DDA0DD": "Plum", "#D8BFD8": "Thistle",
    "#E6E6FA": "Lavender", "#7B68EE": "Medium Slate Blue", "#9932CC": "Dark Orchid",
    "#B57EDC": "Lavender Purple", "#614051": "Eggplant",
    # Metallic / Special
    "#FFD700": "Gold", "#C0C0C0": "Silver", "#B87333": "Copper",
    "#CD7F32": "Bronze", "#E5E4E2": "Platinum", "#CC7722": "Ochre",
}


def _approximate_color_name(hex_color: str) -> str:
    """Find the closest named color for a given hex. Falls back to the hex itself."""
    target_lab = hex_to_lab(hex_color)
    best_name = hex_color
    best_distance = float("inf")

    for named_hex, name in _COLOR_NAMES.items():
        named_lab = hex_to_lab(named_hex)
        distance = delta_e_cie2000(target_lab, named_lab)
        if distance < best_distance:
            best_distance = distance
            best_name = name

    # Only use the name if it's reasonably close (Delta-E < 25)
    if best_distance > 25:
        return hex_color
    return best_name


# ─── Main Scoring Function ────────────────────────────────────

def score_match(
    item_hex: str,
    palette_hexes: list[str],
) -> dict:
    """
    Score how well a clothing item's color matches the user's palette.

    Args:
        item_hex: Hex color of the clothing item.
        palette_hexes: List of hex colors from the user's seasonal palette.

    Returns:
        Dictionary with match_score, verdict, best_palette_match, and suggestions.
    """
    if not palette_hexes:
        return {
            "item_hex": item_hex,
            "match_score": 0,
            "verdict": "UNKNOWN",
            "best_palette_match": "",
            "suggestions": [],
        }

    item_lab = hex_to_lab(item_hex)

    # Calculate Delta-E distance to each palette color
    distances = []
    for palette_hex in palette_hexes:
        palette_lab = hex_to_lab(palette_hex)
        de = delta_e_cie2000(item_lab, palette_lab)
        distances.append({
            "hex": palette_hex,
            "name": _approximate_color_name(palette_hex),
            "delta_e": round(de, 1),
        })

    # Sort by distance (closest match first)
    distances.sort(key=lambda d: d["delta_e"])

    best_match = distances[0]
    best_delta_e = best_match["delta_e"]

    # Convert Delta-E to a 0–100 match score
    # Delta-E 0 → 100%, Delta-E 30+ → 0%
    max_delta_e = 30.0
    match_score = max(0, int(100 - (best_delta_e / max_delta_e * 100)))

    # Determine verdict
    if match_score >= 70:
        verdict = "BUY"
    elif match_score >= 40:
        verdict = "MAYBE"
    else:
        verdict = "PASS"

    # Suggestions: top 3 closest palette colors
    suggestions = distances[:3]

    logger.info(
        f"Scan result: item={item_hex} best_match={best_match['hex']} "
        f"delta_e={best_delta_e} score={match_score} verdict={verdict}"
    )

    return {
        "item_hex": item_hex,
        "item_name": _approximate_color_name(item_hex),
        "match_score": match_score,
        "verdict": verdict,
        "best_palette_match": best_match["hex"],
        "suggestions": suggestions,
    }
