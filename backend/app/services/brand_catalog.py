"""
Lumiqe — Brand Catalog & Target URLs.

Maps each Gender × Vibe combination to a curated list of
brands with their scraping target URLs.
"""

# ─────────────────────────────────────────────────────────────
# Structure:  BRAND_CATALOG[gender][vibe] = [
#     { "brand": "...", "url": "...", "category": "...", "tier": "..." },
#     ...
# ]
# ─────────────────────────────────────────────────────────────

BRAND_CATALOG: dict[str, dict[str, list[dict]]] = {
    # ═══════════════════════════════════════════════════════════
    # MENSWEAR
    # ═══════════════════════════════════════════════════════════
    "male": {
        "Casual": [
            # ── Tops ──
            {
                "brand": "Snitch",
                "url": "https://www.snitch.co.in/collections/new-arrivals",
                "category": "Tops",
                "tier": "free",
            },
            {
                "brand": "Bonkers Corner",
                "url": "https://www.bonkerscorner.com/collections/all",
                "category": "Tops",
                "tier": "free",
            },
            # ── Bottoms / Jeans ──
            {
                "brand": "Snitch",
                "url": "https://www.snitch.co.in/collections/jeans",
                "category": "Jeans",
                "tier": "free",
            },
            {
                "brand": "Bewakoof",
                "url": "https://www.bewakoof.com/men-joggers",
                "category": "Bottoms",
                "tier": "free",
            },
            # ── Outerwear ──
            {
                "brand": "Snitch",
                "url": "https://www.snitch.co.in/collections/jackets",
                "category": "Outerwear",
                "tier": "free",
            },
            # ── Shoes ──
            {
                "brand": "Campus Shoes",
                "url": "https://www.campusshoes.com/collections/men-casual-shoes",
                "category": "Shoes",
                "tier": "free",
            },
            # ── Accessories ──
            {
                "brand": "Urban Monkey",
                "url": "https://urbanmonkey.com/collections/all",
                "category": "Accessories",
                "tier": "free",
            },
            {
                "brand": "Bewakoof",
                "url": "https://www.bewakoof.com/men-backpacks",
                "category": "Accessories",
                "tier": "free",
            },
        ],
        "Gym": [
            {
                "brand": "Athflex",
                "url": "https://athflex.in/collections/all",
                "category": "Activewear",
                "tier": "premium",
            },
            {
                "brand": "Fuaark",
                "url": "https://fuaark.com/collections/all",
                "category": "Activewear",
                "tier": "premium",
            },
            {
                "brand": "Nike",
                "url": "https://www.nike.com/in/w/mens-tops-t-shirts-9om13znik1",
                "category": "Activewear",
                "tier": "premium",
            },
            {
                "brand": "HRX",
                "url": "https://www.myntra.com/hrx-by-hrithik-roshan?rawQuery=hrx+men",
                "category": "Activewear",
                "tier": "premium",
            },
            {
                "brand": "Cultsport",
                "url": "https://cultsport.com/men/apparel.html",
                "category": "Activewear",
                "tier": "premium",
            },
        ],
        "Party": [
            {
                "brand": "Rare Rabbit",
                "url": "https://thehouseofrarerabbit.com/collections/shirts",
                "category": "Shirts",
                "tier": "premium",
            },
            {
                "brand": "Zara Men",
                "url": "https://www.zara.com/in/en/man-shirts-l737.html",
                "category": "Shirts",
                "tier": "premium",
            },
            {
                "brand": "Snitch Luxe",
                "url": "https://www.snitch.co.in/collections/luxe",
                "category": "Shirts",
                "tier": "premium",
            },
        ],
        "Formal": [
            {
                "brand": "Bombay Shirt Company",
                "url": "https://bombayshirts.com/collections/shirts",
                "category": "Shirts",
                "tier": "premium",
            },
            {
                "brand": "Rare Rabbit",
                "url": "https://thehouseofrarerabbit.com/collections/formal",
                "category": "Formal",
                "tier": "premium",
            },
            {
                "brand": "Marks & Spencer",
                "url": "https://www.marksandspencer.in/l/men/shirts/formal-shirts",
                "category": "Formal",
                "tier": "premium",
            },
        ],
    },

    # ═══════════════════════════════════════════════════════════
    # WOMENSWEAR
    # ═══════════════════════════════════════════════════════════
    "female": {
        "Casual": [
            {
                "brand": "Urbanic",
                "url": "https://www.urbanic.com/in/category/women-clothing",
                "category": "Tops",
                "tier": "free",
            },
            {
                "brand": "Newme",
                "url": "https://www.newme.asia/collections/all",
                "category": "Tops",
                "tier": "free",
            },
            {
                "brand": "Savana",
                "url": "https://savana.in/collections/all",
                "category": "Tops",
                "tier": "free",
            },
        ],
        "Gym": [
            {
                "brand": "Athflex",
                "url": "https://athflex.in/collections/women",
                "category": "Activewear",
                "tier": "premium",
            },
            {
                "brand": "BlissClub",
                "url": "https://myblissclub.com/collections/all",
                "category": "Activewear",
                "tier": "premium",
            },
            {
                "brand": "Kica Active",
                "url": "https://kicaactive.com/collections/all",
                "category": "Activewear",
                "tier": "premium",
            },
            {
                "brand": "Nike",
                "url": "https://www.nike.com/in/w/womens-tops-t-shirts-5e1x6z9om13",
                "category": "Activewear",
                "tier": "premium",
            },
        ],
        "Party": [
            {
                "brand": "Cider",
                "url": "https://www.shopcider.com/collection/party",
                "category": "Dresses",
                "tier": "premium",
            },
            {
                "brand": "FabAlley",
                "url": "https://www.faballey.com/party-wear",
                "category": "Dresses",
                "tier": "premium",
            },
        ],
        "Formal": [
            {
                "brand": "FableStreet",
                "url": "https://www.fablestreet.com/collections/all",
                "category": "Formal",
                "tier": "premium",
            },
            {
                "brand": "Zara",
                "url": "https://www.zara.com/in/en/woman-blazers-l1055.html",
                "category": "Formal",
                "tier": "premium",
            },
            {
                "brand": "Mango",
                "url": "https://shop.mango.com/in/en/c/women/blazers_t67",
                "category": "Formal",
                "tier": "premium",
            },
        ],
    },
}


def get_brands(gender: str, vibe: str) -> list[dict]:
    """Return brand configs for a given gender + vibe."""
    g = gender.lower()
    return BRAND_CATALOG.get(g, {}).get(vibe, [])


def get_all_vibes() -> list[str]:
    return ["Casual", "Gym", "Party", "Formal"]


def get_all_genders() -> list[str]:
    return ["male", "female"]
