"""
Lumiqe — Shopping Agent Service (8-Category Outfit Assembly).

Scrapes 8 clothing categories concurrently using Firecrawl,
then uses CIE Delta-E 2000 color matching to pick the best item
per category based on the user's skin-tone palette hex codes.

Categories: upper, layering, lower, shoes, watch, bag, eyewear, jewelry
"""

import asyncio
import logging
import re

from pydantic import BaseModel, Field

from app.core.config import settings
from app.services.color_matcher import hex_to_lab, delta_e_cie2000

logger = logging.getLogger("lumiqe.services.shopping_agent")


# ─── Category-to-Brand Routing ───────────────────────────────

CATEGORY_ROUTES: dict[str, dict[str, list[dict]]] = {
    "male": {
        "upper": [
            {"brand": "Snitch", "url": "https://www.snitch.co.in/collections/new-arrivals"},
            {"brand": "Bewakoof", "url": "https://www.bewakoof.com/men-t-shirts"},
        ],
        "layering": [
            {"brand": "Bonkers Corner", "url": "https://www.bonkerscorner.com/collections/hoodies"},
            {"brand": "Snitch", "url": "https://www.snitch.co.in/collections/jackets"},
        ],
        "lower": [
            {"brand": "Snitch", "url": "https://www.snitch.co.in/collections/jeans"},
            {"brand": "Bewakoof", "url": "https://www.bewakoof.com/men-joggers"},
        ],
        "shoes": [
            {"brand": "Campus", "url": "https://www.campusshoes.com/collections/men-casual-shoes"},
        ],
        "watch": [
            {"brand": "Myntra Watches", "url": "https://www.myntra.com/men-watches"},
        ],
        "bag": [
            {"brand": "Myntra Bags", "url": "https://www.myntra.com/men-backpacks"},
        ],
        "eyewear": [
            {"brand": "Myntra Sunglasses", "url": "https://www.myntra.com/men-sunglasses"},
        ],
        "jewelry": [
            {"brand": "Myntra Jewelry", "url": "https://www.myntra.com/men-jewellery"},
        ],
    },
    "female": {
        "upper": [
            {"brand": "Newme", "url": "https://www.newme.asia/collections/all"},
            {"brand": "Urbanic", "url": "https://www.urbanic.com/in/category/women-clothing"},
        ],
        "layering": [
            {"brand": "Newme", "url": "https://www.newme.asia/collections/jackets"},
        ],
        "lower": [
            {"brand": "Savana", "url": "https://savana.in/collections/all"},
            {"brand": "Newme", "url": "https://www.newme.asia/collections/bottoms"},
        ],
        "shoes": [
            {"brand": "Campus", "url": "https://www.campusshoes.com/collections/women-casual-shoes"},
        ],
        "watch": [
            {"brand": "Myntra Watches", "url": "https://www.myntra.com/women-watches"},
        ],
        "bag": [
            {"brand": "Myntra Bags", "url": "https://www.myntra.com/women-handbags"},
        ],
        "eyewear": [
            {"brand": "Myntra Sunglasses", "url": "https://www.myntra.com/women-sunglasses"},
        ],
        "jewelry": [
            {"brand": "Myntra Jewelry", "url": "https://www.myntra.com/women-jewellery"},
        ],
    },
}

# All 8 outfit slots in display order
OUTFIT_SLOTS = (
    "upper", "layering", "lower", "shoes",
    "watch", "bag", "eyewear", "jewelry",
)

# Human-readable labels
SLOT_LABELS = {
    "upper": "Upper",
    "layering": "Layering",
    "lower": "Lower",
    "shoes": "Shoes",
    "watch": "Watch",
    "bag": "Bag",
    "eyewear": "Eyewear",
    "jewelry": "Jewelry",
}


# ─── Pydantic Schema for Firecrawl LLM Extraction ────────────

class _ExtractedProduct(BaseModel):
    name: str = Field(description="The product name / title")
    price: str = Field(description="Price with currency symbol, e.g. ₹1,499")
    image_url: str = Field(
        description="Absolute URL to the product image (starts with http)"
    )
    product_url: str = Field(
        description="Absolute URL to the product page (starts with http)"
    )
    dominant_color: str = Field(
        default="",
        description=(
            "The most prominent color of the product as a hex code, "
            "e.g. #3A2F2F. If unknown, leave empty."
        ),
    )


class _ExtractionResult(BaseModel):
    products: list[_ExtractedProduct] = []


# ─── Gender Validation ───────────────────────────────────────

_MALE_BLOCKLIST = {
    "lipstick", "heels", "stiletto", "stilettos", "clutch", "handbag",
    "handbags", "necklace", "bangle", "bangles", "anklet", "saree",
    "lehenga", "kurti", "mangalsutra", "sindoor", "dupatta", "salwar",
    "churidar", "palazzo", "crop top", "sports bra", "bikini",
}
_FEMALE_BLOCKLIST = {
    "boxer", "boxers", "briefs", "lungi", "dhoti", "kurta pajama",
}


def _is_valid_for_gender(name: str, gender: str) -> bool:
    """Check if a product name is appropriate for the given gender."""
    name_lower = name.lower()
    blocklist = _MALE_BLOCKLIST if gender.lower() == "male" else _FEMALE_BLOCKLIST
    return not any(term in name_lower for term in blocklist)


# ─── Single-Brand Scraper ────────────────────────────────────

async def _scrape_single_brand(
    brand_config: dict,
    category: str,
    gender: str = "male",
    max_items: int = 6,
) -> list[dict]:
    """Scrape one brand URL for a category using Firecrawl."""
    from firecrawl import FirecrawlApp  # lazy import
    from urllib.parse import urljoin

    if not settings.FIRECRAWL_API_KEY:
        logger.warning("FIRECRAWL_API_KEY not set — skipping scrape")
        return []

    brand = brand_config["brand"]
    url = brand_config["url"]
    gender_label = "men's" if gender.lower() == "male" else "women's"

    male_exclusion = (
        "Do NOT include lipstick, heels, stilettos, clutch bags, handbags, "
        "necklaces, bangles, anklets, sarees, lehengas, kurtis, crop tops, "
        "or any women's accessories. "
    )
    female_exclusion = (
        "Do NOT include men's boxers, briefs, lungis, or dhotis. "
    )
    exclusion = male_exclusion if gender.lower() == "male" else female_exclusion

    prompt = (
        f"Extract the first {max_items} {gender_label} products from the "
        f"main product grid. Only include {gender_label} items. "
        f"{exclusion}"
        f"For each product, get: name, price (with ₹ or $ symbol), "
        f"the full absolute image URL (starts with http), "
        f"the full absolute product page URL (starts with http), "
        f"and the dominant/primary color of the product as a hex code "
        f"(e.g. #3A2F2F). "
        f"Only extract from the primary product listing — NOT "
        f"'You might also like', navigation, or banners."
    )

    logger.info(f"[{category}] Scraping {brand}: {url}")

    try:
        fc = FirecrawlApp(api_key=settings.FIRECRAWL_API_KEY)
        result = await asyncio.to_thread(
            fc.scrape_url,
            url,
            params={
                "formats": ["extract"],
                "extract": {
                    "prompt": prompt,
                    "schema": _ExtractionResult.model_json_schema(),
                },
            },
        )

        extracted = result.get("extract", {})
        raw_products = extracted.get("products", [])

        valid = []
        for item in raw_products[:max_items]:
            name = (item.get("name") or "").strip()
            image_url = (item.get("image_url") or "").strip()
            product_url = (item.get("product_url") or "").strip()
            price = (item.get("price") or "Price N/A").strip()
            dominant_color = (item.get("dominant_color") or "").strip()

            # Fix relative URLs by resolving against brand URL
            if image_url and not image_url.startswith("http"):
                image_url = urljoin(url, image_url)
            if product_url and not product_url.startswith("http"):
                product_url = urljoin(url, product_url)

            if (
                not name
                or not image_url.startswith("http")
                or not product_url.startswith("http")
            ):
                continue

            if not _is_valid_for_gender(name, gender):
                logger.info(f"[{category}] Filtered out '{name}' — invalid for {gender}")
                continue

            valid.append({
                "name": name,
                "price": price,
                "image_url": image_url,
                "product_url": product_url,
                "dominant_color": dominant_color,
                "category": category,
                "brand": brand,
            })

        logger.info(f"[{category}] Got {len(valid)} valid items from {brand}")
        return valid

    except Exception as exc:
        logger.error(f"[{category}] Scrape failed for {brand}: {exc}")
        return []


# ─── Concurrent Category Gathering ───────────────────────────

async def gather_inventory(gender: str) -> list[dict]:
    """Scrape all 8 categories concurrently via asyncio.gather."""
    gender_key = gender.lower()
    routes = CATEGORY_ROUTES.get(gender_key, CATEGORY_ROUTES["male"])

    async def _scrape_category(
        category: str, configs: list[dict],
    ) -> list[dict]:
        tasks = [_scrape_single_brand(cfg, category, gender_key) for cfg in configs]
        results = await asyncio.gather(*tasks, return_exceptions=True)
        merged = []
        for res in results:
            if isinstance(res, list):
                merged.extend(res)
        return merged

    category_tasks = [
        _scrape_category(cat, configs)
        for cat, configs in routes.items()
    ]

    results = await asyncio.gather(*category_tasks, return_exceptions=True)

    inventory = []
    for res in results:
        if isinstance(res, list):
            inventory.extend(res)

    logger.info(f"Total scraped inventory: {len(inventory)} items")
    return inventory


# ─── Delta-E Outfit Assembly ─────────────────────────────────

_HEX_RE = re.compile(r"^#[0-9A-Fa-f]{6}$")


def _compute_min_delta_e(product: dict, palette_labs: list) -> float | None:
    """
    Return the minimum Delta-E between a product's dominant_color and any palette color.
    Returns None if the product has no valid or parseable hex color.
    """
    hex_color = product.get("dominant_color", "")
    if not _HEX_RE.match(hex_color):
        return None
    try:
        product_lab = hex_to_lab(hex_color)
    except Exception as exc:
        logger.debug(
            f"Skipping product {product.get('product_url', '?')}: "
            f"invalid hex color {hex_color!r} — {exc}"
        )
        return None
    return min(delta_e_cie2000(product_lab, p_lab) for p_lab in palette_labs)


def _pick_best_match(
    products: list[dict],
    palette_labs: list,
    exclude_ids: set[str] | None = None,
) -> dict | None:
    """
    Pick the product whose dominant_color is closest (lowest Delta-E) to any palette color.
    Skips products in exclude_ids. Falls back to the first non-excluded product.
    """
    if not products:
        return None

    exclude_ids = exclude_ids or set()
    best_product = None
    best_delta_e = float("inf")

    for product in products:
        if product.get("product_url", "") in exclude_ids:
            continue
        min_de = _compute_min_delta_e(product, palette_labs)
        if min_de is not None and min_de < best_delta_e:
            best_delta_e = min_de
            best_product = product

    if best_product is None:
        for p in products:
            if p.get("product_url", "") not in exclude_ids:
                return p
    return best_product


def _build_palette_labs(palette_hexes: list[str]) -> list:
    """Convert a list of hex color strings to CIE LAB values, skipping invalid entries."""
    labs = []
    for hex_code in palette_hexes:
        try:
            labs.append(hex_to_lab(hex_code))
        except Exception as exc:
            logger.warning(f"Skipping invalid palette hex {hex_code!r}: {exc}")
    return labs


def _group_inventory_by_category(inventory: list[dict]) -> dict[str, list[dict]]:
    """Group inventory items into a dict keyed by their category field."""
    by_category: dict[str, list[dict]] = {}
    for item in inventory:
        cat = item.get("category", "unknown")
        by_category.setdefault(cat, []).append(item)
    return by_category


def assemble_outfit(
    inventory: list[dict],
    palette_hexes: list[str],
    exclude_ids: set[str] | None = None,
) -> dict:
    """
    Pick one item per category (8 slots) using Delta-E matching.
    Items in exclude_ids are skipped to ensure non-repeating outfits.
    """
    palette_labs = _build_palette_labs(palette_hexes)
    if not palette_labs:
        return {"error": "No valid hex colors in palette"}

    by_category = _group_inventory_by_category(inventory)
    outfit: dict = {}
    used_urls: set[str] = set(exclude_ids or set())

    for slot in OUTFIT_SLOTS:
        best = _pick_best_match(by_category.get(slot, []), palette_labs, used_urls)
        if best:
            product_url = best["product_url"]
            outfit[slot] = {
                "name": best["name"],
                "price": best["price"],
                "image_url": best["image_url"],
                "product_url": product_url,
            }
            used_urls.add(product_url)
        else:
            outfit[slot] = {
                "name": f"No {SLOT_LABELS.get(slot, slot)} found",
                "price": "—",
                "image_url": "",
                "product_url": "",
            }

    outfit["look_name"] = "Your Palette Match"
    return outfit


# ─── DB Category → Outfit Slot Mapping ────────────────────────

# Maps DB product categories to outfit slot keys
DB_CATEGORY_TO_SLOT: dict[str, dict[str, list[str]]] = {
    "male": {
        "upper": ["Tops", "Streetwear"],
        "layering": ["Outerwear", "Sweatshirts"],
        "lower": ["Jeans", "Bottoms", "Shorts"],
        "shoes": ["Shoes"],
        "watch": ["Watches", "Accessories"],
        "bag": ["Bags", "Accessories"],
        "eyewear": ["Eyewear", "Accessories"],
        "jewelry": ["Jewelry", "Accessories"],
    },
    "female": {
        "upper": ["Tops", "Dresses"],
        "layering": ["Outerwear", "Dresses"],
        "lower": ["Bottoms"],
        "shoes": ["Heels", "Boots", "Shoes"],
        "watch": ["Watches", "Accessories"],
        "bag": ["Bags", "Accessories"],
        "eyewear": ["Eyewear", "Accessories"],
        "jewelry": ["Jewelry", "Accessories"],
    },
}


async def _query_slot_products(
    session,
    slot: str,
    gender_key: str,
    db_categories: list[str],
    exclude_ids: set[str],
) -> list[dict]:
    """Query DB for products matching a single outfit slot."""
    from sqlalchemy import select
    from app.models import Product

    stmt = (
        select(Product)
        .where(
            Product.gender == gender_key,
            Product.category.in_(db_categories),
            Product.is_active,
        )
        .limit(10)
    )
    result = await session.execute(stmt)
    rows = result.scalars().all()

    return [
        {
            "name": row.name,
            "price": row.price,
            "image_url": row.image,
            "product_url": row.url,
            "dominant_color": row.color_hex or "",
            "category": slot,
            "brand": row.brand,
        }
        for row in rows
        if row.url not in exclude_ids
    ]


async def _fill_from_db(
    gender: str,
    empty_slots: list[str],
    palette_hexes: list[str],
    exclude_ids: set[str] | None = None,
) -> list[dict]:
    """Query PostgreSQL for products to fill empty outfit slots."""
    from app.core.dependencies import async_session_factory, db_available

    if not db_available:
        logger.warning("DB not available for fallback")
        return []

    exclude_ids = exclude_ids or set()
    gender_key = gender.lower()
    slot_map = DB_CATEGORY_TO_SLOT.get(gender_key, DB_CATEGORY_TO_SLOT["male"])
    db_products: list[dict] = []

    try:
        async with async_session_factory() as session:
            for slot in empty_slots:
                db_categories = slot_map.get(slot, [])
                if not db_categories:
                    continue
                products = await _query_slot_products(
                    session, slot, gender_key, db_categories, exclude_ids,
                )
                db_products.extend(products)

        logger.info(f"DB fallback: fetched {len(db_products)} products for {len(empty_slots)} empty slots")
    except Exception as exc:
        logger.error(f"DB fallback failed: {exc}")

    return db_products


# ─── Orchestrator ─────────────────────────────────────────────

def _check_empty_slots(outfit: dict) -> list[str]:
    """Return outfit slot keys that have no product assigned."""
    return [
        slot for slot in OUTFIT_SLOTS
        if outfit.get(slot, {}).get("name", "").startswith("No ")
    ]


def _merge_db_products(
    outfit: dict,
    empty_slots: list[str],
    inventory: list[dict],
    db_products: list[dict],
    palette_hexes: list[str],
    exclude_ids: set[str] | None,
) -> None:
    """Re-assemble empty slots using combined inventory + DB products."""
    combined = inventory + db_products
    full_outfit = assemble_outfit(combined, palette_hexes, exclude_ids)
    for slot in empty_slots:
        filled = full_outfit.get(slot, {})
        if not filled.get("name", "").startswith("No "):
            outfit[slot] = filled


async def get_curated_outfit(
    gender: str,
    palette_hexes: list[str],
    exclude_ids: set[str] | None = None,
) -> dict:
    """
    Hybrid shopping agent:
    1. Query DB first (reliable, always available)
    2. Delta-E match best item per category
    3. Fill any remaining empty slots via Firecrawl (optional — only when FIRECRAWL_API_KEY is set)
    """
    logger.info(f"Shopping agent started: gender={gender}, palette={palette_hexes}, excludes={len(exclude_ids or set())}")

    # Step 1: DB is primary source — always run first
    all_slots = list(OUTFIT_SLOTS)
    db_products = await _fill_from_db(gender, all_slots, palette_hexes, exclude_ids)
    outfit = assemble_outfit(db_products, palette_hexes, exclude_ids)
    empty_slots = _check_empty_slots(outfit)

    # Step 2: Firecrawl fills gaps only if configured
    if empty_slots and settings.FIRECRAWL_API_KEY:
        logger.info(f"Empty slots after DB: {empty_slots} — enhancing with Firecrawl…")
        scraped = await gather_inventory(gender)
        if scraped:
            _merge_db_products(outfit, empty_slots, db_products, scraped, palette_hexes, exclude_ids)
    elif empty_slots:
        logger.info(f"Empty slots after DB: {empty_slots} — FIRECRAWL_API_KEY not set, skipping scrape")

    filled_count = len(OUTFIT_SLOTS) - len(_check_empty_slots(outfit))
    logger.info(f"Final outfit: {filled_count}/8 slots filled")
    return outfit
