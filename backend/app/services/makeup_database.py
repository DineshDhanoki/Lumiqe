"""
Lumiqe — Built-in Makeup Shade Database.

Contains curated shade data for foundation, concealer, lipstick, and blush
across popular brands including MAC, Maybelline, L'Oreal, Fenty Beauty,
and Lakme (Indian market).

Each shade entry includes:
    name      — Product shade name
    brand     — Brand + product line
    hex       — Representative hex color
    undertone — warm, cool, or neutral
"""

FOUNDATION_SHADES: list[dict] = [
    # MAC Studio Fix
    {"name": "Porcelain", "brand": "MAC Studio Fix", "hex": "#F5E6D3", "undertone": "neutral"},
    {"name": "NC15", "brand": "MAC Studio Fix", "hex": "#EBCFAD", "undertone": "warm"},
    {"name": "NC25", "brand": "MAC Studio Fix", "hex": "#D4A97A", "undertone": "warm"},
    {"name": "NC35", "brand": "MAC Studio Fix", "hex": "#C09060", "undertone": "warm"},
    {"name": "NC42", "brand": "MAC Studio Fix", "hex": "#A07848", "undertone": "warm"},
    {"name": "NC45", "brand": "MAC Studio Fix", "hex": "#8B6538", "undertone": "warm"},
    {"name": "NW13", "brand": "MAC Studio Fix", "hex": "#E8CEB3", "undertone": "cool"},
    {"name": "NW25", "brand": "MAC Studio Fix", "hex": "#C4A07A", "undertone": "cool"},
    {"name": "NW35", "brand": "MAC Studio Fix", "hex": "#A68058", "undertone": "cool"},
    {"name": "NW45", "brand": "MAC Studio Fix", "hex": "#7A5838", "undertone": "cool"},
    # Maybelline Fit Me
    {"name": "Ivory 110", "brand": "Maybelline Fit Me", "hex": "#F5DEB3", "undertone": "warm"},
    {"name": "Natural Beige 220", "brand": "Maybelline Fit Me", "hex": "#D2B48C", "undertone": "warm"},
    {"name": "Sun Beige 310", "brand": "Maybelline Fit Me", "hex": "#C49A6C", "undertone": "warm"},
    {"name": "Toffee 330", "brand": "Maybelline Fit Me", "hex": "#A07850", "undertone": "warm"},
    # L'Oreal True Match
    {"name": "Porcelain W1", "brand": "L'Oreal True Match", "hex": "#F3E0CC", "undertone": "warm"},
    {"name": "Light Ivory W2", "brand": "L'Oreal True Match", "hex": "#EDDCC0", "undertone": "warm"},
    {"name": "Nude Beige W3", "brand": "L'Oreal True Match", "hex": "#D9BD9A", "undertone": "warm"},
    {"name": "Sand C5", "brand": "L'Oreal True Match", "hex": "#C4A278", "undertone": "cool"},
    # Fenty Beauty Pro Filt'r
    {"name": "130", "brand": "Fenty Beauty Pro Filt'r", "hex": "#F0D5B8", "undertone": "warm"},
    {"name": "230", "brand": "Fenty Beauty Pro Filt'r", "hex": "#D4A87C", "undertone": "warm"},
    {"name": "330", "brand": "Fenty Beauty Pro Filt'r", "hex": "#B08050", "undertone": "warm"},
    {"name": "385", "brand": "Fenty Beauty Pro Filt'r", "hex": "#8C6238", "undertone": "neutral"},
    {"name": "445", "brand": "Fenty Beauty Pro Filt'r", "hex": "#6B4423", "undertone": "warm"},
    {"name": "150", "brand": "Fenty Beauty Pro Filt'r", "hex": "#E8C8A8", "undertone": "neutral"},
    # Lakme (Indian market)
    {"name": "Marble N100", "brand": "Lakme Perfecting Liquid", "hex": "#F0D8C0", "undertone": "neutral"},
    {"name": "Shell N200", "brand": "Lakme Perfecting Liquid", "hex": "#DCC0A0", "undertone": "warm"},
    {"name": "Beige Honey N340", "brand": "Lakme Perfecting Liquid", "hex": "#C8A070", "undertone": "warm"},
    {"name": "Dusky N380", "brand": "Lakme Perfecting Liquid", "hex": "#A07848", "undertone": "warm"},
]

CONCEALER_SHADES: list[dict] = [
    {"name": "Fair 15", "brand": "Maybelline Instant Age Rewind", "hex": "#F5E0CC", "undertone": "neutral"},
    {"name": "Light 20", "brand": "Maybelline Instant Age Rewind", "hex": "#EEDAB8", "undertone": "warm"},
    {"name": "Medium 30", "brand": "Maybelline Instant Age Rewind", "hex": "#D8BA90", "undertone": "warm"},
    {"name": "Honey 40", "brand": "Maybelline Instant Age Rewind", "hex": "#C49A6C", "undertone": "warm"},
    {"name": "NC20", "brand": "MAC Studio Fix 24H Concealer", "hex": "#E5C8A0", "undertone": "warm"},
    {"name": "NC35", "brand": "MAC Studio Fix 24H Concealer", "hex": "#C49468", "undertone": "warm"},
    {"name": "NW25", "brand": "MAC Studio Fix 24H Concealer", "hex": "#CDAA80", "undertone": "cool"},
    {"name": "120", "brand": "Fenty Beauty Pro Filt'r Concealer", "hex": "#F0D8C0", "undertone": "warm"},
    {"name": "240", "brand": "Fenty Beauty Pro Filt'r Concealer", "hex": "#D0A878", "undertone": "warm"},
    {"name": "340", "brand": "Fenty Beauty Pro Filt'r Concealer", "hex": "#A88050", "undertone": "neutral"},
]

LIPSTICK_SHADES: list[dict] = [
    # Warm reds
    {"name": "Ruby Woo", "brand": "MAC Retro Matte", "hex": "#C0392B", "undertone": "cool"},
    {"name": "Russian Red", "brand": "MAC Matte", "hex": "#B03020", "undertone": "cool"},
    {"name": "Lady Danger", "brand": "MAC Matte", "hex": "#E04030", "undertone": "warm"},
    # Cool pinks
    {"name": "Pink Nouveau", "brand": "MAC Satin", "hex": "#D8507A", "undertone": "cool"},
    {"name": "Snob", "brand": "MAC Satin", "hex": "#CC8899", "undertone": "cool"},
    # Nudes
    {"name": "Velvet Teddy", "brand": "MAC Matte", "hex": "#B07060", "undertone": "warm"},
    {"name": "Honey Love", "brand": "MAC Lustre", "hex": "#C89880", "undertone": "warm"},
    {"name": "Pillow Talk", "brand": "Charlotte Tilbury", "hex": "#BA7D72", "undertone": "neutral"},
    {"name": "Super Star", "brand": "Lakme 9 to 5", "hex": "#C47868", "undertone": "neutral"},
    # Berries and mauves
    {"name": "Rebel", "brand": "MAC Satin", "hex": "#802040", "undertone": "cool"},
    {"name": "Twig", "brand": "MAC Satin", "hex": "#A06858", "undertone": "neutral"},
    {"name": "Mehr", "brand": "MAC Matte", "hex": "#A86070", "undertone": "cool"},
    {"name": "Stunna Lip Paint", "brand": "Fenty Beauty", "hex": "#8C1820", "undertone": "neutral"},
    {"name": "Color Riche 377", "brand": "L'Oreal", "hex": "#A04050", "undertone": "cool"},
    {"name": "Red Coat 404", "brand": "Lakme Absolute", "hex": "#C83028", "undertone": "warm"},
]

BLUSH_SHADES: list[dict] = [
    # Peach
    {"name": "Peaches", "brand": "MAC Powder Blush", "hex": "#F0A080", "undertone": "warm"},
    {"name": "Peach Pop", "brand": "Clinique Cheek Pop", "hex": "#E89878", "undertone": "warm"},
    # Rose
    {"name": "Desert Rose", "brand": "MAC Powder Blush", "hex": "#C07080", "undertone": "cool"},
    {"name": "Rose Pop", "brand": "Clinique Cheek Pop", "hex": "#D08090", "undertone": "cool"},
    # Coral
    {"name": "Melba", "brand": "MAC Powder Blush", "hex": "#E0907A", "undertone": "warm"},
    {"name": "Warm Soul", "brand": "MAC Mineralize Blush", "hex": "#D09070", "undertone": "warm"},
    # Berry
    {"name": "Raizin", "brand": "MAC Powder Blush", "hex": "#985060", "undertone": "cool"},
    {"name": "Berry Pop", "brand": "Clinique Cheek Pop", "hex": "#B06878", "undertone": "cool"},
    # Nude / Soft
    {"name": "Blushbaby", "brand": "MAC Powder Blush", "hex": "#D0A098", "undertone": "neutral"},
    {"name": "Nude Pink", "brand": "Lakme Face Stylist Blush Duos", "hex": "#D4A090", "undertone": "neutral"},
]

ALL_SHADES: dict[str, list[dict]] = {
    "foundation": FOUNDATION_SHADES,
    "concealer": CONCEALER_SHADES,
    "lipstick": LIPSTICK_SHADES,
    "blush": BLUSH_SHADES,
}

SEASON_RECOMMENDATIONS: dict[str, dict] = {
    "spring": {
        "undertone_guidance": "warm",
        "foundation_tip": (
            "Look for foundations with golden or peachy undertones. "
            "MAC NC shades, Maybelline Fit Me warm range, "
            "and Fenty Beauty warm-numbered shades work well."
        ),
        "lipstick_families": [
            "Warm coral",
            "Peach nude",
            "Warm light red",
        ],
        "lipstick_picks": [
            "MAC Lady Danger (warm red-orange)",
            "Charlotte Tilbury Pillow Talk (warm nude)",
            "MAC Honey Love (peachy nude)",
        ],
        "blush_families": [
            "Peach",
            "Coral",
            "Warm nude",
        ],
        "blush_picks": [
            "MAC Peaches",
            "Clinique Peach Pop",
            "MAC Melba (coral)",
        ],
        "eyeshadow_palettes": [
            "Warm golds and coppers",
            "Soft peach and terracotta tones",
            "Light warm browns with champagne shimmer",
        ],
    },
    "summer": {
        "undertone_guidance": "cool",
        "foundation_tip": (
            "Opt for foundations with pink or neutral undertones. "
            "MAC NW shades, L'Oreal True Match cool range, "
            "and Fenty Beauty neutral shades are ideal."
        ),
        "lipstick_families": [
            "Soft rose",
            "Cool mauve",
            "Berry pink",
        ],
        "lipstick_picks": [
            "MAC Mehr (cool mauve-pink)",
            "MAC Snob (soft cool pink)",
            "L'Oreal Color Riche 377 (berry)",
        ],
        "blush_families": [
            "Rose",
            "Soft berry",
            "Cool pink",
        ],
        "blush_picks": [
            "MAC Desert Rose",
            "Clinique Rose Pop",
            "MAC Blushbaby (soft cool nude)",
        ],
        "eyeshadow_palettes": [
            "Soft cool taupes and mauves",
            "Lavender and dusty rose tones",
            "Silver and cool grey shimmer",
        ],
    },
    "autumn": {
        "undertone_guidance": "warm",
        "foundation_tip": (
            "Rich warm-toned foundations are your best match. "
            "MAC NC30-NC45 range, Fenty Beauty warm shades, "
            "and Lakme warm beige shades complement autumn skin tones."
        ),
        "lipstick_families": [
            "Brick red",
            "Warm brown nude",
            "Burnt orange",
        ],
        "lipstick_picks": [
            "MAC Velvet Teddy (warm brown nude)",
            "MAC Twig (muted rose-brown)",
            "Lakme Red Coat 404 (warm true red)",
        ],
        "blush_families": [
            "Terracotta",
            "Warm coral",
            "Bronze-peach",
        ],
        "blush_picks": [
            "MAC Warm Soul (golden bronze)",
            "MAC Melba (warm coral)",
            "Clinique Peach Pop",
        ],
        "eyeshadow_palettes": [
            "Warm terracotta and burnt sienna",
            "Deep bronze and olive tones",
            "Rich brown with gold shimmer",
        ],
    },
    "winter": {
        "undertone_guidance": "cool",
        "foundation_tip": (
            "High-contrast cool or neutral foundations suit Winter best. "
            "MAC NW range, Fenty Beauty cool-leaning shades, "
            "and L'Oreal True Match cool shades are excellent choices."
        ),
        "lipstick_families": [
            "True red",
            "Deep berry",
            "Bold plum",
        ],
        "lipstick_picks": [
            "MAC Ruby Woo (iconic cool true red)",
            "MAC Rebel (deep plum-berry)",
            "Fenty Stunna Lip Paint (universal deep red)",
        ],
        "blush_families": [
            "Cool berry",
            "Deep rose",
            "Plum",
        ],
        "blush_picks": [
            "MAC Raizin (deep berry)",
            "Clinique Berry Pop",
            "MAC Desert Rose (cool rose)",
        ],
        "eyeshadow_palettes": [
            "Cool jewel tones — sapphire, emerald, amethyst",
            "Smoky charcoal and silver",
            "Deep plum with icy pink shimmer",
        ],
    },
}
