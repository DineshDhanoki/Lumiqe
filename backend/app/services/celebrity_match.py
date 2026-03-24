"""
Lumiqe -- Celebrity Season Match Service.

Maps each of the 12 color seasons to well-known Indian and international
celebrities who share that season's ideal palette.
"""

import logging

logger = logging.getLogger("lumiqe.services.celebrity_match")

CELEBRITY_SEASONS: dict[str, list[dict]] = {
    "Deep Winter": [
        {
            "name": "Deepika Padukone",
            "image_hint": "deepika",
            "note": "Known for wearing bold jewel tones",
        },
        {
            "name": "Priyanka Chopra",
            "image_hint": "priyanka",
            "note": "Stunning in deep emerald and royal blue",
        },
        {
            "name": "Lupita Nyong'o",
            "image_hint": "lupita",
            "note": "Radiates in rich saturated colors",
        },
    ],
    "Cool Winter": [
        {
            "name": "Aishwarya Rai",
            "image_hint": "aishwarya",
            "note": "Iconic in cool blues and icy pinks",
        },
        {
            "name": "Anne Hathaway",
            "image_hint": "anne",
            "note": "Elegant in cool-toned jewel shades",
        },
        {
            "name": "Kareena Kapoor",
            "image_hint": "kareena",
            "note": "Glows in sapphire and platinum",
        },
    ],
    "Clear Winter": [
        {
            "name": "Alia Bhatt",
            "image_hint": "alia",
            "note": "Bright and clear colors complement her best",
        },
        {
            "name": "Megan Fox",
            "image_hint": "megan",
            "note": "Striking in vivid contrast colors",
        },
    ],
    "Light Spring": [
        {
            "name": "Kiara Advani",
            "image_hint": "kiara",
            "note": "Glows in warm pastels and light gold",
        },
        {
            "name": "Scarlett Johansson",
            "image_hint": "scarlett",
            "note": "Beautiful in soft warm tones",
        },
    ],
    "Warm Spring": [
        {
            "name": "Anushka Sharma",
            "image_hint": "anushka",
            "note": "Radiant in warm coral and golden tones",
        },
        {
            "name": "Jennifer Lopez",
            "image_hint": "jlo",
            "note": "Signature warm golden glow",
        },
    ],
    "Clear Spring": [
        {
            "name": "Shraddha Kapoor",
            "image_hint": "shraddha",
            "note": "Vibrant in clear warm brights",
        },
        {
            "name": "Emma Stone",
            "image_hint": "emma",
            "note": "Stunning in bright warm colors",
        },
    ],
    "Light Summer": [
        {
            "name": "Sonam Kapoor",
            "image_hint": "sonam",
            "note": "Ethereal in soft muted pastels",
        },
        {
            "name": "Cate Blanchett",
            "image_hint": "cate",
            "note": "Elegant in dusty rose and lavender",
        },
    ],
    "Cool Summer": [
        {
            "name": "Katrina Kaif",
            "image_hint": "katrina",
            "note": "Graceful in cool muted tones",
        },
        {
            "name": "Kate Middleton",
            "image_hint": "kate",
            "note": "Classic in navy and soft burgundy",
        },
    ],
    "Soft Summer": [
        {
            "name": "Vidya Balan",
            "image_hint": "vidya",
            "note": "Beautiful in soft muted earth tones",
        },
        {
            "name": "Drew Barrymore",
            "image_hint": "drew",
            "note": "Lovely in dusty and muted shades",
        },
    ],
    "Soft Autumn": [
        {
            "name": "Madhuri Dixit",
            "image_hint": "madhuri",
            "note": "Warm and soft in muted autumn tones",
        },
        {
            "name": "Jennifer Aniston",
            "image_hint": "jennifer",
            "note": "Classic in warm neutral tones",
        },
    ],
    "Warm Autumn": [
        {
            "name": "Bipasha Basu",
            "image_hint": "bipasha",
            "note": "Rich and warm in terracotta and bronze",
        },
        {
            "name": "Beyonce",
            "image_hint": "beyonce",
            "note": "Golden in warm amber and bronze",
        },
    ],
    "Deep Autumn": [
        {
            "name": "Kajol",
            "image_hint": "kajol",
            "note": "Powerful in deep warm earth tones",
        },
        {
            "name": "Eva Mendes",
            "image_hint": "eva",
            "note": "Gorgeous in rich warm darks",
        },
    ],
}

# Mapping of season keywords to help find the closest match
_SEASON_FAMILIES: dict[str, list[str]] = {
    "Winter": ["Deep Winter", "Cool Winter", "Clear Winter"],
    "Spring": ["Light Spring", "Warm Spring", "Clear Spring"],
    "Summer": ["Light Summer", "Cool Summer", "Soft Summer"],
    "Autumn": ["Soft Autumn", "Warm Autumn", "Deep Autumn"],
}


def get_celebrity_matches(season: str) -> list[dict]:
    """
    Return celebrity matches for a season.

    Falls back to the closest season in the same family if an exact
    match is not found (e.g. "True Winter" -> first Winter sub-season
    with data).
    """
    # Exact match
    if season in CELEBRITY_SEASONS:
        logger.debug("Exact celebrity match for season=%s", season)
        return CELEBRITY_SEASONS[season]

    # Try case-insensitive match
    season_lower = season.lower().strip()
    for key, celebs in CELEBRITY_SEASONS.items():
        if key.lower() == season_lower:
            logger.debug("Case-insensitive match: %s -> %s", season, key)
            return celebs

    # Fallback: find the family and return the first sub-season match
    for family, sub_seasons in _SEASON_FAMILIES.items():
        if family.lower() in season_lower:
            logger.info(
                "No exact match for '%s', falling back to %s family",
                season,
                family,
            )
            return CELEBRITY_SEASONS[sub_seasons[0]]

    logger.warning("No celebrity matches found for season='%s'", season)
    return []
