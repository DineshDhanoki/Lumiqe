"""
Lumiqe — Product Scraper Service.

Uses Firecrawl to extract structured product data from curated
brand URLs, then processes colors and inserts into PostgreSQL.
"""

import hashlib
import logging
import io
from typing import Optional

import httpx
from firecrawl import FirecrawlApp
from pydantic import BaseModel, Field

from app.core.config import settings
from app.services.brand_catalog import BRAND_CATALOG, get_brands

logger = logging.getLogger("lumiqe.services.scraper")

# ─── Pydantic Schemas for Firecrawl Extraction ───────────────

class ScrapedProduct(BaseModel):
    """Schema passed to Firecrawl's LLM extraction."""
    name: str = Field(description="The product name / title")
    price: str = Field(description="The price including currency symbol, e.g. ₹1,499")
    image_url: str = Field(description="Absolute URL to the main product image (must start with http)")
    product_url: str = Field(description="Absolute URL to the product page (must start with http)")


class ExtractionResult(BaseModel):
    """Wrapper for Firecrawl extract response."""
    products: list[ScrapedProduct] = []


# ─── Color Extraction ────────────────────────────────────────

def _extract_dominant_color_from_url(image_url: str) -> Optional[tuple[str, list[float]]]:
    """
    Download an image from URL and extract its dominant color.
    Returns (hex_color, [r, g, b] embedding) or None on failure.
    """
    try:
        import cv2
        import numpy as np
        from sklearn.cluster import KMeans

        with httpx.Client(timeout=15.0) as client:
            resp = client.get(image_url, follow_redirects=True)
            if resp.status_code != 200:
                return None

        img_array = np.frombuffer(resp.content, np.uint8)
        img = cv2.imdecode(img_array, cv2.IMREAD_COLOR)
        if img is None:
            return None

        # Resize for speed
        img = cv2.resize(img, (150, 150))
        pixels = img.reshape(-1, 3).astype(np.float32)

        # K-Means with k=3, take dominant cluster
        km = KMeans(n_clusters=3, n_init=5, max_iter=100, random_state=42)
        labels = km.fit_predict(pixels)
        counts = np.bincount(labels)
        dominant = km.cluster_centers_[counts.argmax()]

        b, g, r = int(dominant[0]), int(dominant[1]), int(dominant[2])
        hex_color = f"#{r:02X}{g:02X}{b:02X}"
        embedding = [r / 255.0, g / 255.0, b / 255.0]

        return hex_color, embedding

    except Exception as e:
        logger.warning(f"Color extraction failed for {image_url}: {e}")
        return None


# ─── Source ID Generation ────────────────────────────────────

def _generate_source_id(brand: str, product_url: str) -> str:
    """Create a deterministic unique ID for deduplication."""
    raw = f"{brand}:{product_url}"
    return hashlib.sha256(raw.encode()).hexdigest()[:20]


# ─── Main Scraping Function ──────────────────────────────────

def scrape_brand(
    brand_config: dict,
    gender: str,
    vibe: str,
    max_products: int = 8,
) -> list[dict]:
    """
    Scrape a single brand URL using Firecrawl.

    Args:
        brand_config: Dict with keys: brand, url, category, tier
        gender: "male" or "female"
        vibe: "Casual", "Gym", "Party", "Formal"
        max_products: Max items to extract per brand

    Returns:
        List of product dicts ready for DB insertion.
    """
    if not settings.FIRECRAWL_API_KEY:
        raise RuntimeError("FIRECRAWL_API_KEY not set in .env")

    brand = brand_config["brand"]
    url = brand_config["url"]
    category = brand_config["category"]
    tier = brand_config["tier"]

    logger.info(f"Scraping {brand} ({gender}/{vibe}): {url}")

    app = FirecrawlApp(api_key=settings.FIRECRAWL_API_KEY)

    try:
        result = app.scrape_url(
            url,
            params={
                "formats": ["extract"],
                "extract": {
                    "prompt": (
                        f"Extract the first {max_products} products from the main product grid "
                        f"on this page. Only extract items from the primary product listing. "
                        f"Do NOT extract products from 'You might also like', 'Recently viewed', "
                        f"navigation menus, or promotional banners. "
                        f"For each product, get the name, price (with ₹ or $ symbol), "
                        f"the full absolute image URL (must start with http), "
                        f"and the full absolute product page URL (must start with http)."
                    ),
                    "schema": ExtractionResult.model_json_schema(),
                },
                "actions": [
                    {"type": "scroll", "direction": "down", "amount": 3},
                    {"type": "wait", "milliseconds": 2000},
                ],
            },
        )
    except Exception as e:
        logger.error(f"Firecrawl scrape failed for {brand}: {e}")
        return []

    # Parse extraction result
    extracted = result.get("extract", {})
    raw_products = extracted.get("products", [])

    if not raw_products:
        logger.warning(f"No products extracted from {brand} ({url})")
        return []

    logger.info(f"Extracted {len(raw_products)} raw products from {brand}")

    # ── Post-scrape validation & color processing ────────────
    valid_products = []
    for item in raw_products[:max_products]:
        # Validate required fields
        name = item.get("name", "").strip()
        price = item.get("price", "").strip()
        image_url = item.get("image_url", "").strip()
        product_url = item.get("product_url", "").strip()

        if not name or not image_url.startswith("http") or not product_url.startswith("http"):
            logger.debug(f"Skipping invalid item: {name}")
            continue

        # Generate source_id for deduplication
        source_id = _generate_source_id(brand, product_url)

        # Extract dominant color from the product image
        color_result = _extract_dominant_color_from_url(image_url)
        color_hex = None
        color_embedding = None
        season = "Unknown"

        if color_result:
            color_hex, color_embedding = color_result
            # Map to season using our CV logic
            try:
                from app.cv.color_analysis import map_to_season
                import cv2
                import numpy as np

                # Convert hex to LAB for season mapping
                r_val = int(color_hex[1:3], 16)
                g_val = int(color_hex[3:5], 16)
                b_val = int(color_hex[5:7], 16)
                bgr = np.array([[[b_val, g_val, r_val]]], dtype=np.uint8)
                lab = cv2.cvtColor(bgr, cv2.COLOR_BGR2LAB)
                L_cv, a_cv, b_cv = float(lab[0, 0, 0]), float(lab[0, 0, 1]), float(lab[0, 0, 2])

                # Convert to CIE scale
                L_cie = L_cv * 100.0 / 255.0
                a_cie = a_cv - 128.0
                b_cie = b_cv - 128.0

                from app.cv.color_analysis import calculate_ita
                ita = calculate_ita(L_cie, b_cie)
                season_name, _, _ = map_to_season(ita, a_cie, b_cie)
                season = season_name.replace(" (Neutral Flow)", "")
            except Exception as e:
                logger.warning(f"Season mapping failed for {name}: {e}")

        product_dict = {
            "id": source_id,
            "name": name,
            "brand": brand,
            "price": price if price else "Price N/A",
            "image": image_url,
            "url": product_url,
            "category": category,
            "season": season,
            "gender": gender,
            "vibe": vibe,
            "tier": tier,
            "source": "firecrawl",
            "source_id": source_id,
            "is_active": True,
            "match_score": 85,
            "color_hex": color_hex,
            "color_embedding": color_embedding,
        }
        valid_products.append(product_dict)

    logger.info(f"Validated {len(valid_products)}/{len(raw_products)} products from {brand}")
    return valid_products


def scrape_vibe(gender: str, vibe: str, max_per_brand: int = 8) -> list[dict]:
    """
    Scrape all brands for a given Gender + Vibe combination.
    Returns a flat list of product dicts.
    """
    brands = get_brands(gender, vibe)
    all_products = []

    for brand_config in brands:
        products = scrape_brand(brand_config, gender, vibe, max_per_brand)
        all_products.extend(products)

    logger.info(f"Total for {gender}/{vibe}: {len(all_products)} products")
    return all_products


async def scrape_and_save(gender: str, vibe: str, max_per_brand: int = 8) -> int:
    """
    Scrape + upsert into PostgreSQL. Returns count of products saved.
    """
    from app.core.dependencies import async_session_factory as AsyncSessionLocal
    from app.models import Product
    from sqlalchemy.dialects.postgresql import insert as pg_insert
    from sqlalchemy import select

    products = scrape_vibe(gender, vibe, max_per_brand)
    if not products:
        return 0

    async with AsyncSessionLocal() as session:
        saved = 0
        for p in products:
            # Check if source_id already exists
            existing = await session.execute(
                select(Product).where(Product.source_id == p["source_id"])
            )
            if existing.scalar_one_or_none():
                logger.debug(f"Skipping duplicate: {p['name']}")
                continue

            product = Product(
                id=p["id"],
                name=p["name"],
                brand=p["brand"],
                price=p["price"],
                image=p["image"],
                url=p["url"],
                category=p["category"],
                season=p["season"],
                gender=p["gender"],
                vibe=p["vibe"],
                tier=p["tier"],
                source=p["source"],
                source_id=p["source_id"],
                is_active=p["is_active"],
                match_score=p["match_score"],
                color_hex=p["color_hex"],
                color_embedding=p["color_embedding"],
            )
            session.add(product)
            saved += 1

        await session.commit()
        logger.info(f"Saved {saved} new products for {gender}/{vibe}")
        return saved
