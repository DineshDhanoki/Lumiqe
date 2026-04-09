"""API — Wardrobe tracker with color extraction and palette compatibility."""

import asyncio
import io
import logging
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, File, Form, HTTPException, Request, UploadFile
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_db, get_current_user
from app.core.rate_limiter import check_rate_limit
from app.models import WardrobeItem

logger = logging.getLogger("lumiqe.api.wardrobe")
router = APIRouter(prefix="/api/wardrobe", tags=["Wardrobe"])

# ─── Constants ───────────────────────────────────────────────

_MAX_WARDROBE_ITEMS = 100
_MAX_UPLOAD_BYTES = 5 * 1024 * 1024  # 5 MB

_VALID_CATEGORIES = {
    "tops", "bottoms", "dresses", "outerwear", "shoes",
    "accessories", "bags", "activewear", "formal", "other",
}


# ─── Color Extraction Helpers ───────────────────────────────


def _extract_dominant_color(image_bytes: bytes) -> str:
    """
    Extract the dominant color from an image using K-Means clustering.

    Returns a hex color string (e.g., '#A0522D').
    """
    try:
        from sklearn.cluster import KMeans
    except ImportError:
        raise ImportError(
            "scikit-learn is required for color extraction. "
            "Install it with: pip install scikit-learn"
        )

    from PIL import Image
    import numpy as np

    image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    # Resize for performance — 150x150 is sufficient for color extraction
    image = image.resize((150, 150))

    pixels = np.array(image).reshape(-1, 3).astype(float)

    kmeans = KMeans(n_clusters=5, n_init=10, random_state=42)
    kmeans.fit(pixels)

    # Find the largest cluster (dominant color)
    labels, counts = np.unique(kmeans.labels_, return_counts=True)
    dominant_index = labels[counts.argmax()]
    dominant_rgb = kmeans.cluster_centers_[dominant_index].astype(int)

    hex_color = "#{:02X}{:02X}{:02X}".format(
        dominant_rgb[0], dominant_rgb[1], dominant_rgb[2]
    )
    return hex_color


def _calculate_delta_e(hex_a: str, hex_b: str) -> float:
    """
    Calculate the Delta-E (CIE76) color difference between two hex colors.

    Lower values mean more similar colors. < 10 is a good match.
    """
    import math

    def hex_to_lab(hex_color: str) -> tuple[float, float, float]:
        """Convert hex to CIE-Lab via sRGB -> XYZ -> Lab."""
        hex_clean = hex_color.lstrip("#")
        r, g, b = (
            int(hex_clean[0:2], 16) / 255.0,
            int(hex_clean[2:4], 16) / 255.0,
            int(hex_clean[4:6], 16) / 255.0,
        )

        # sRGB to linear
        r = ((r + 0.055) / 1.055) ** 2.4 if r > 0.04045 else r / 12.92
        g = ((g + 0.055) / 1.055) ** 2.4 if g > 0.04045 else g / 12.92
        b = ((b + 0.055) / 1.055) ** 2.4 if b > 0.04045 else b / 12.92

        # Linear RGB to XYZ (D65)
        x = (r * 0.4124564 + g * 0.3575761 + b * 0.1804375) / 0.95047
        y = r * 0.2126729 + g * 0.7151522 + b * 0.0721750
        z = (r * 0.0193339 + g * 0.1191920 + b * 0.9503041) / 1.08883

        # XYZ to Lab
        epsilon = 0.008856
        kappa = 903.3

        fx = x ** (1 / 3) if x > epsilon else (kappa * x + 16) / 116
        fy = y ** (1 / 3) if y > epsilon else (kappa * y + 16) / 116
        fz = z ** (1 / 3) if z > epsilon else (kappa * z + 16) / 116

        lab_l = 116 * fy - 16
        lab_a = 500 * (fx - fy)
        lab_b = 200 * (fy - fz)

        return lab_l, lab_a, lab_b

    l1, a1, b1 = hex_to_lab(hex_a)
    l2, a2, b2 = hex_to_lab(hex_b)

    return math.sqrt((l2 - l1) ** 2 + (a2 - a1) ** 2 + (b2 - b1) ** 2)


def _score_against_palette(item_hex: str, palette: list[str]) -> int:
    """
    Score a clothing item's color against the user's palette.

    Returns a 0-100 match score (100 = perfect match).
    """
    if not palette or not item_hex:
        return 0

    min_delta_e = min(_calculate_delta_e(item_hex, p) for p in palette)

    # Delta-E interpretation:
    #   0-5:   near-identical
    #   5-15:  good match
    #   15-30: noticeable difference
    #   30+:   poor match
    # Map to 0-100 score (clamped)
    score = max(0, min(100, int(100 - (min_delta_e * 2))))
    return score


# ─── Serialization Helpers ───────────────────────────────────


def _serialize_wardrobe_item(
    item: WardrobeItem,
    palette: list[str] | None = None,
) -> dict:
    """Convert a WardrobeItem ORM object to a JSON-serializable dict."""
    match_score = _score_against_palette(item.color_hex or "", palette or [])
    return {
        "id": item.id,
        "name": item.name,
        "category": item.category,
        "color_hex": item.color_hex,
        "image_url": item.image_url,
        "brand": item.brand,
        "notes": item.notes,
        "match_score": match_score,
        "created_at": item.created_at.isoformat() if item.created_at else None,
    }


def _generate_compatibility_summary(overall_score: int) -> str:
    """Return a human-readable summary for a wardrobe compatibility score."""
    if overall_score >= 80:
        return "Excellent! Your wardrobe is highly compatible with your color palette."
    if overall_score >= 60:
        return "Good. Most of your wardrobe works well with your palette."
    if overall_score >= 40:
        return "Fair. Consider replacing some items with colors from your palette."
    return "Your wardrobe could use some updates to better match your color palette."


# ─── Endpoints ──────────────────────────────────────────────


@router.get("")
async def get_wardrobe(
    current_user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
):
    """Get all wardrobe items for the authenticated user, plus stats."""
    result = await session.execute(
        select(WardrobeItem)
        .where(WardrobeItem.user_id == current_user["id"])
        .order_by(WardrobeItem.created_at.desc())
    )
    items = result.scalars().all()

    user_palette = current_user.get("palette") or []
    serialized_items = [
        _serialize_wardrobe_item(item, user_palette) for item in items
    ]

    count = len(serialized_items)
    avg_match_score = 0
    if count > 0:
        avg_match_score = round(
            sum(item["match_score"] for item in serialized_items) / count
        )

    return {
        "items": serialized_items,
        "total": count,
        "stats": {
            "count": count,
            "avg_match_score": avg_match_score,
        },
    }


@router.post("")
async def add_wardrobe_item(
    name: str = Form(..., min_length=1, max_length=255),
    category: str = Form(..., min_length=1, max_length=100),
    brand: str | None = Form(default=None, max_length=255),
    notes: str | None = Form(default=None, max_length=500),
    color_hex: str | None = Form(default=None, max_length=7),
    file: UploadFile | None = File(default=None),
    request: Request = None,
    current_user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
):
    """
    Add a wardrobe item. Optionally upload a photo to auto-extract color.

    If a photo is provided and no color_hex is given, the dominant color
    is extracted via K-Means clustering. The image itself is NOT persisted
    (privacy by design).
    """
    await check_rate_limit(f"wardrobe_add:{current_user['id']}", max_requests=30, window_seconds=3600)
    # Validate category
    if category.lower() not in _VALID_CATEGORIES:
        raise HTTPException(
            status_code=422,
            detail={
                "error": "INVALID_CATEGORY",
                "detail": f"Category must be one of: {', '.join(sorted(_VALID_CATEGORIES))}.",
                "code": 422,
            },
        )

    # Enforce per-user limit
    count_result = await session.execute(
        select(func.count()).select_from(WardrobeItem).where(
            WardrobeItem.user_id == current_user["id"]
        )
    )
    current_count = count_result.scalar() or 0

    if current_count >= _MAX_WARDROBE_ITEMS:
        raise HTTPException(
            status_code=400,
            detail={
                "error": "WARDROBE_LIMIT_REACHED",
                "detail": f"You can store up to {_MAX_WARDROBE_ITEMS} wardrobe items. Delete some to add new ones.",
                "code": 400,
            },
        )

    extracted_color = color_hex

    # If a photo was uploaded, extract its dominant color
    if file is not None:
        image_bytes = await file.read()
        if len(image_bytes) > _MAX_UPLOAD_BYTES:
            raise HTTPException(
                status_code=413,
                detail={
                    "error": "FILE_TOO_LARGE",
                    "detail": "Image must be under 5 MB.",
                    "code": 413,
                },
            )

        if len(image_bytes) == 0:
            raise HTTPException(
                status_code=400,
                detail={
                    "error": "EMPTY_FILE",
                    "detail": "Uploaded file is empty.",
                    "code": 400,
                },
            )

        # Extract dominant color from the image (K-Means is CPU-bound — run in thread)
        if not extracted_color:
            try:
                loop = asyncio.get_running_loop()
                extracted_color = await loop.run_in_executor(
                    None, _extract_dominant_color, image_bytes
                )
            except ImportError as exc:
                logger.error(f"Missing dependency for color extraction: {exc}")
                raise HTTPException(
                    status_code=503,
                    detail={
                        "error": "DEPENDENCY_MISSING",
                        "detail": "Color extraction service is temporarily unavailable.",
                        "code": 503,
                    },
                )
            except (ValueError, IndexError, RuntimeError) as exc:
                logger.warning(f"Color extraction failed: {exc}")
                raise HTTPException(
                    status_code=422,
                    detail={
                        "error": "EXTRACTION_FAILED",
                        "detail": "Could not extract color from the image. Please try a different photo or enter the color manually.",
                        "code": 422,
                    },
                )

    # Score against the user's palette
    user_palette = current_user.get("palette") or []
    match_score = _score_against_palette(extracted_color or "", user_palette)

    # Persist the wardrobe item (image is NOT stored — privacy by design)
    item = WardrobeItem(
        user_id=current_user["id"],
        name=name,
        category=category.lower(),
        color_hex=extracted_color,
        brand=brand,
        notes=notes,
        created_at=datetime.now(timezone.utc),
    )
    session.add(item)
    await session.flush()

    logger.info(
        f"User {current_user['id']} added wardrobe item {item.id}: "
        f"name={name} category={category} color={extracted_color} score={match_score}"
    )

    return {
        "message": "Wardrobe item added.",
        "item": _serialize_wardrobe_item(item, user_palette),
    }


@router.put("/{item_id}")
async def update_wardrobe_item(
    item_id: int,
    name: str | None = Form(default=None, max_length=255),
    category: str | None = Form(default=None, max_length=100),
    brand: str | None = Form(default=None, max_length=255),
    notes: str | None = Form(default=None, max_length=500),
    color_hex: str | None = Form(default=None, max_length=7),
    current_user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
):
    """Update a wardrobe item. Only the owner can update their items."""
    await check_rate_limit(f"wardrobe_update:{current_user['id']}", max_requests=60, window_seconds=3600)
    result = await session.execute(
        select(WardrobeItem).where(WardrobeItem.id == item_id)
    )
    item = result.scalar_one_or_none()

    if not item:
        raise HTTPException(
            status_code=404,
            detail={
                "error": "NOT_FOUND",
                "detail": "Wardrobe item not found.",
                "code": 404,
            },
        )

    if item.user_id != current_user["id"]:
        raise HTTPException(
            status_code=403,
            detail={
                "error": "FORBIDDEN",
                "detail": "You can only update your own wardrobe items.",
                "code": 403,
            },
        )

    if category is not None and category.lower() not in _VALID_CATEGORIES:
        raise HTTPException(
            status_code=422,
            detail={
                "error": "INVALID_CATEGORY",
                "detail": f"Category must be one of: {', '.join(sorted(_VALID_CATEGORIES))}.",
                "code": 422,
            },
        )

    if name is not None:
        item.name = name
    if category is not None:
        item.category = category.lower()
    if brand is not None:
        item.brand = brand
    if notes is not None:
        item.notes = notes
    if color_hex is not None:
        item.color_hex = color_hex

    await session.flush()

    user_palette = current_user.get("palette") or []
    logger.info(f"User {current_user['id']} updated wardrobe item {item_id}")

    return {
        "message": "Wardrobe item updated.",
        "item": _serialize_wardrobe_item(item, user_palette),
    }


@router.delete("/{item_id}")
async def delete_wardrobe_item(
    item_id: int,
    current_user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
):
    """Delete a wardrobe item. Only the owner can delete their items."""
    await check_rate_limit(f"wardrobe_delete:{current_user['id']}", max_requests=60, window_seconds=3600)
    result = await session.execute(
        select(WardrobeItem).where(WardrobeItem.id == item_id)
    )
    item = result.scalar_one_or_none()

    if not item:
        raise HTTPException(
            status_code=404,
            detail={
                "error": "NOT_FOUND",
                "detail": "Wardrobe item not found.",
                "code": 404,
            },
        )

    if item.user_id != current_user["id"]:
        raise HTTPException(
            status_code=403,
            detail={
                "error": "FORBIDDEN",
                "detail": "You can only delete your own wardrobe items.",
                "code": 403,
            },
        )

    await session.delete(item)
    logger.info(f"User {current_user['id']} deleted wardrobe item {item_id}")
    return {"message": "Wardrobe item deleted."}


@router.get("/compatibility")
async def wardrobe_compatibility(
    current_user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
):
    """
    Analyze overall wardrobe compatibility with the user's color palette.

    Returns a summary score and per-item breakdown.
    """
    user_palette = current_user.get("palette") or []
    if not user_palette:
        raise HTTPException(
            status_code=400,
            detail={
                "error": "NO_PALETTE",
                "detail": "Complete a color analysis first to check wardrobe compatibility.",
                "code": 400,
            },
        )

    result = await session.execute(
        select(WardrobeItem)
        .where(WardrobeItem.user_id == current_user["id"])
        .order_by(WardrobeItem.created_at.desc())
    )
    items = result.scalars().all()

    if not items:
        return {
            "overall_score": 0,
            "total_items": 0,
            "compatible_items": 0,
            "items": [],
            "summary": "Your wardrobe is empty. Upload some clothing photos to get started.",
        }

    item_scores = [
        _serialize_wardrobe_item(item, user_palette) for item in items
    ]

    overall_score = round(
        sum(i["match_score"] for i in item_scores) / len(item_scores)
    )
    compatible_count = sum(1 for i in item_scores if i["match_score"] >= 60)

    summary = _generate_compatibility_summary(overall_score)

    return {
        "overall_score": overall_score,
        "total_items": len(item_scores),
        "compatible_items": compatible_count,
        "items": item_scores,
        "summary": summary,
    }
