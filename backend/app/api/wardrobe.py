"""API — Wardrobe tracker with color extraction and palette compatibility."""

import io
import logging
import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_db, get_current_user
from app.models import WardrobeItem

logger = logging.getLogger("lumiqe.api.wardrobe")
router = APIRouter(prefix="/api/wardrobe", tags=["Wardrobe"])

_MAX_WARDROBE_ITEMS = 100
_MAX_UPLOAD_BYTES = 5 * 1024 * 1024  # 5 MB


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
    if not palette:
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

    serialized_items = [
        {
            "id": item.id,
            "dominant_color": item.dominant_color,
            "match_score": item.match_score,
            "image_filename": item.image_filename,
            "category": item.category,
            "created_at": item.created_at.isoformat() if item.created_at else None,
        }
        for item in items
    ]

    # Compute stats
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
async def upload_wardrobe_item(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
):
    """
    Upload a clothing photo, extract its dominant color via K-Means,
    and score it against the user's palette using Delta-E.
    """
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

    # Read and validate the upload
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

    # Extract dominant color
    try:
        dominant_color = _extract_dominant_color(image_bytes)
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
    except ValueError as exc:
        logger.warning(f"Invalid image data: {exc}")
        raise HTTPException(
            status_code=422,
            detail={
                "error": "INVALID_IMAGE",
                "detail": "Could not process the uploaded image. Please try a different file.",
                "code": 422,
            },
        )
    except IndexError as exc:
        logger.error(f"Color extraction index error: {exc}")
        raise HTTPException(
            status_code=422,
            detail={
                "error": "EXTRACTION_FAILED",
                "detail": "Failed to extract colors from the image.",
                "code": 422,
            },
        )
    except RuntimeError as exc:
        logger.error(f"Color extraction runtime error: {exc}")
        raise HTTPException(
            status_code=500,
            detail={
                "error": "EXTRACTION_ERROR",
                "detail": "An error occurred during color extraction.",
                "code": 500,
            },
        )

    # Score against the user's palette
    user_palette = current_user.get("palette") or []
    match_score = _score_against_palette(dominant_color, user_palette)

    # Persist the wardrobe item (image is NOT stored — privacy by design)
    item = WardrobeItem(
        id=str(uuid.uuid4()),
        user_id=current_user["id"],
        dominant_color=dominant_color,
        match_score=match_score,
        image_filename=file.filename or "unknown",
        created_at=datetime.now(timezone.utc),
    )
    session.add(item)
    await session.flush()

    logger.info(
        f"User {current_user['id']} added wardrobe item {item.id}: "
        f"color={dominant_color} score={match_score}"
    )

    return {
        "message": "Wardrobe item added.",
        "item": {
            "id": item.id,
            "dominant_color": dominant_color,
            "match_score": match_score,
            "image_filename": item.image_filename,
            "created_at": item.created_at.isoformat(),
        },
    }


@router.delete("/{item_id}")
async def delete_wardrobe_item(
    item_id: str,
    current_user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
):
    """Delete a wardrobe item. Only the owner can delete their items."""
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

    item_scores = []
    for item in items:
        score = _score_against_palette(item.dominant_color, user_palette)
        item_scores.append({
            "id": item.id,
            "dominant_color": item.dominant_color,
            "match_score": score,
            "image_filename": item.image_filename,
        })

    overall_score = round(
        sum(i["match_score"] for i in item_scores) / len(item_scores)
    )
    compatible_count = sum(1 for i in item_scores if i["match_score"] >= 60)

    # Generate a human-readable summary
    if overall_score >= 80:
        summary = "Excellent! Your wardrobe is highly compatible with your color palette."
    elif overall_score >= 60:
        summary = "Good. Most of your wardrobe works well with your palette."
    elif overall_score >= 40:
        summary = "Fair. Consider replacing some items with colors from your palette."
    else:
        summary = "Your wardrobe could use some updates to better match your color palette."

    return {
        "overall_score": overall_score,
        "total_items": len(item_scores),
        "compatible_items": compatible_count,
        "items": item_scores,
        "summary": summary,
    }
