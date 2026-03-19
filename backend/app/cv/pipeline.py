"""
Lumiqe CV — Pipeline Orchestrator.

Coordinates the 9-step analysis pipeline by calling functions
from face_detector, skin_parser, and color_analysis modules.

IMPORTANT: The pipeline execution order and all step logic are
identical to lumiqe_engine.py _run_pipeline(). Nothing has been changed.
"""

import logging
import time

import numpy as np

from app.cv.face_detector import detect_and_crop_face, decode_image, decode_bytes
from app.cv.skin_parser import generate_skin_mask
from app.cv.color_analysis import (
    apply_grey_world,
    check_exposure,
    extract_masked_lab_pixels,
    cluster_undertone,
    opencv_lab_to_cie,
    calculate_ita,
    lab_to_hex,
    map_to_season,
    compute_color_confidence,
    compute_miou,
    load_gt_mask_cached,
    SEASON_DESCRIPTIONS,
)
from app.cv.loader import get_bisenet, get_device, get_seasons_data

logger = logging.getLogger("lumiqe.cv.pipeline")


def _run_pipeline(
    image: np.ndarray,
    dataset_root: str | None = None,
    img_path: str | None = None,
) -> dict:
    """
    Internal shared pipeline. Takes a decoded BGR image, returns result dict.
    """
    t0 = time.perf_counter()

    device = get_device()
    bisenet = get_bisenet()
    seasons_data = get_seasons_data()

    # STEP 1 & 2: Face crop
    face_crop = detect_and_crop_face(image)
    if face_crop is None:
        raise RuntimeError("No face detected — image may be too blurry, rotated, or face is occluded.")

    # FIX 2: Exposure gate
    passed, reason = check_exposure(face_crop)
    if not passed:
        raise ValueError(reason)

    # FIX 1: Grey World color constancy
    face_crop = apply_grey_world(face_crop)

    # STEP 3: BiSeNet skin mask
    skin_mask = generate_skin_mask(face_crop, bisenet, device)
    skin_px = int((skin_mask == 255).sum())
    if skin_px < 500:
        raise RuntimeError(f"Skin mask too small ({skin_px}px) — face may be partially covered.")

    # STEP 4 & 5: CLAHE + pixel extraction
    lab_pixels = extract_masked_lab_pixels(face_crop, skin_mask)

    # STEP 6 & 7: K-Means on a*b*
    dominant_lab_cv = cluster_undertone(lab_pixels, k=3)

    # STEP 8: ITA calculation
    L_cie, a_cie, b_cie = opencv_lab_to_cie(dominant_lab_cv)
    ita_angle = calculate_ita(L_cie, b_cie)
    hex_color = lab_to_hex(L_cie, a_cie, b_cie)

    # STEP 9: Season mapping
    season, palette, undertone = map_to_season(ita_angle, a_cie, b_cie)
    base_season = season.replace(" (Neutral Flow)", "")
    description = SEASON_DESCRIPTIONS.get(base_season, "")

    # Confidence
    confidence = compute_color_confidence(lab_pixels, dominant_lab_cv)

    # Contrast level from ITA
    if ita_angle > 50:
        contrast_level = "Low"
    elif ita_angle > 20:
        contrast_level = "Medium"
    else:
        contrast_level = "High"

    # Enrich from seasons.json
    season_info = seasons_data.get(base_season, {})
    avoid_colors = season_info.get("avoid", [])
    metal = season_info.get("metal", "Gold" if undertone == "warm" else "Silver")
    celebrities = season_info.get("celebrities", [])
    makeup = season_info.get("makeup", {})
    tips = season_info.get("tips", "")

    # mIoU evaluation (only when dataset_root + img_path are provided — reuses skin_mask from above)
    miou = None
    if dataset_root and img_path:
        gt_mask = load_gt_mask_cached(img_path, dataset_root)
        if gt_mask is not None:
            miou = round(compute_miou(skin_mask, gt_mask), 3)

    elapsed_ms = round((time.perf_counter() - t0) * 1000, 1)

    logger.info(f"Analysis complete: {season} (ITA={ita_angle:.1f}, conf={confidence}, {elapsed_ms}ms)")

    result = {
        "season": season,
        "description": description,
        "ita_angle": round(ita_angle, 2),
        "undertone": undertone,
        "hex_color": hex_color,
        "palette": palette,
        "confidence": confidence,
        "contrast_level": contrast_level,
        "avoid_colors": avoid_colors,
        "metal": metal,
        "celebrities": celebrities,
        "makeup": makeup,
        "tips": tips,
        "skin_pixels": skin_px,
        "processing_time_ms": elapsed_ms,
    }
    if miou is not None:
        result["miou"] = miou
    return result


def analyze_image(img_path: str, dataset_root: str | None = None) -> dict:
    """
    Full 9-step pipeline from file path.

    Args:
        img_path: Path to the image file.
        dataset_root: Optional path to evaluation dataset for mIoU scoring.

    Returns:
        dict with season, palette, confidence, and diagnostics.
    """
    img_path = str(img_path)
    image = decode_image(img_path)
    return _run_pipeline(image, dataset_root, img_path=img_path)


def analyze_bytes(image_bytes: bytes) -> dict:
    """
    Full 9-step pipeline from raw bytes (for API/FormData upload).

    Args:
        image_bytes: Raw image bytes from upload.

    Returns:
        dict with season, palette, confidence, and diagnostics.
    """
    image = decode_bytes(image_bytes)
    return _run_pipeline(image)
