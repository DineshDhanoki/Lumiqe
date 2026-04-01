"""
Lumiqe CV — Color Analysis.

CLAHE lighting normalization, K-Means undertone clustering, ITA calculation,
Grey World color constancy, exposure gate, and 12-season mapping.

IMPORTANT: All algorithm logic, constants, thresholds, and numerical
operations are identical to lumiqe_engine.py. Nothing has been changed.
"""

import logging

import cv2
import numpy as np
from sklearn.cluster import KMeans
from sklearn.metrics import silhouette_score

logger = logging.getLogger("lumiqe.cv.color_analysis")


# ════════════════════════════════════════════════════════════════
# 12-SEASON MAP (ITA range, required tone, season name, 6-color palette)
# ════════════════════════════════════════════════════════════════
SEASON_MAP = [
    (55,  90, "warm", "Light Spring",  ["#FDDBB4", "#F9C784", "#FFF0DC", "#FFE8B0", "#F5DCA0", "#FFF5E6"]),
    (41,  55, "warm", "True Spring",   ["#F5C191", "#E8A96B", "#FDE8C8", "#FFD5A0", "#F0B878", "#FFF0D8"]),
    (28,  41, "warm", "Warm Spring",   ["#E8A96B", "#D4875A", "#F5D5B5", "#C07848", "#DDA070", "#F0C8A0"]),
    (55,  90, "cool", "Light Summer",  ["#E8C4C4", "#D4A0A0", "#F5E0E0", "#C8B0C0", "#E0D0D8", "#F0E8EE"]),
    (41,  55, "cool", "True Summer",   ["#C9A0A0", "#B07878", "#E8D0D0", "#A08888", "#D0B8B8", "#E0C8C8"]),
    (28,  41, "cool", "Soft Summer",   ["#B89090", "#A07878", "#D8C4C4", "#907070", "#C0A8A8", "#D0B8B8"]),
    (10,  28, "cool", "Soft Autumn",   ["#C4956A", "#A87848", "#DDB88C", "#B8885C", "#D0A478", "#E0C098"]),
    (10,  28, "warm", "True Autumn",   ["#C07840", "#A05820", "#D89060", "#8C4818", "#B06830", "#E0A070"]),
    (-30, 10, "warm", "Deep Autumn",   ["#8B5E3C", "#6B3E1C", "#A87848", "#5C2E10", "#7A4E30", "#B88858"]),
    (-30, 10, "cool", "Deep Winter",   ["#2C1810", "#4A2820", "#6B3830", "#1A1018", "#3C2028", "#584038"]),
    (-55, -30, "cool", "True Winter",  ["#E8E0F0", "#C0B0D8", "#A090C0", "#D8D0E8", "#B0A0C8", "#9080B0"]),
    (-55, -30, None,  "Bright Winter", ["#F0E8FF", "#D0C0F0", "#B0A0E0", "#E0D8F8", "#C0B0E8", "#A098D0"]),
]

SEASON_DESCRIPTIONS = {
    "Light Spring":  "You have warm, light coloring. Soft pastels and warm ivories look beautiful on you.",
    "True Spring":   "You have warm, golden coloring. Peach, coral, and warm greens are your best friends.",
    "Warm Spring":   "You have warm, clear coloring. Bold, bright colors with warm undertones suit you perfectly.",
    "Light Summer":  "You have cool, delicate coloring. Soft lavenders, powder blues, and rose pinks flatter you.",
    "True Summer":   "You have cool, muted coloring. Dusty blues, soft grays, and cool mauves are ideal.",
    "Soft Summer":   "You have cool, blended coloring. Muted, smoky tones with a cool edge look stunning.",
    "Soft Autumn":   "You have warm, muted coloring. Earthy olives, warm taupes, and terracotta suit you.",
    "True Autumn":   "You have warm, rich coloring. Burnt orange, mustard, and deep teals are your palette.",
    "Deep Autumn":   "You have warm, deep coloring. Rich, saturated warm tones like burgundy and forest green shine.",
    "Deep Winter":   "You have cool, deep coloring. Dramatic jewel tones — ruby, emerald, sapphire — are perfect.",
    "True Winter":   "You have cool, icy coloring. Pure white, navy, and fuchsia create striking contrast.",
    "Bright Winter": "You have cool, vivid coloring. High-contrast, electric shades make you glow.",
}


# ════════════════════════════════════════════════════════════════
# GREY WORLD COLOR CONSTANCY
# ════════════════════════════════════════════════════════════════
def apply_grey_world(face_bgr: np.ndarray, skin_mask: np.ndarray | None = None) -> np.ndarray:
    """
    Normalize color cast using Grey World assumption.

    When a skin_mask is provided, multipliers are computed from skin
    pixels only — this avoids bias from hair, background, and clothing
    that dominated the old whole-image approach.

    Melanin Protector: multipliers are clamped to [0.85, 1.15] to
    prevent extreme overcorrection that would wash out deep skin tones.
    """
    if skin_mask is not None:
        mask_bool = skin_mask == 255
        if mask_bool.sum() > 100:
            skin_pixels = face_bgr[mask_bool]
            mean_b = np.mean(skin_pixels[:, 0])
            mean_g = np.mean(skin_pixels[:, 1])
            mean_r = np.mean(skin_pixels[:, 2])
        else:
            mean_b = np.mean(face_bgr[:, :, 0])
            mean_g = np.mean(face_bgr[:, :, 1])
            mean_r = np.mean(face_bgr[:, :, 2])
    else:
        mean_b = np.mean(face_bgr[:, :, 0])
        mean_g = np.mean(face_bgr[:, :, 1])
        mean_r = np.mean(face_bgr[:, :, 2])

    mean_gray = (mean_b + mean_g + mean_r) / 3.0

    # Compute raw multipliers, then clamp to a safe range
    CLAMP_LO, CLAMP_HI = 0.85, 1.15
    mult_b = np.clip(mean_gray / (mean_b + 1e-6), CLAMP_LO, CLAMP_HI)
    mult_g = np.clip(mean_gray / (mean_g + 1e-6), CLAMP_LO, CLAMP_HI)
    mult_r = np.clip(mean_gray / (mean_r + 1e-6), CLAMP_LO, CLAMP_HI)

    logger.debug(
        f"Grey World multipliers: B={mult_b:.3f} G={mult_g:.3f} R={mult_r:.3f} "
        f"(clamped to [{CLAMP_LO}, {CLAMP_HI}], skin_masked={skin_mask is not None})"
    )

    face = face_bgr.astype(np.float32)
    face[:, :, 0] = np.clip(face[:, :, 0] * mult_b, 0, 255)
    face[:, :, 1] = np.clip(face[:, :, 1] * mult_g, 0, 255)
    face[:, :, 2] = np.clip(face[:, :, 2] * mult_r, 0, 255)
    return face.astype(np.uint8)


# ════════════════════════════════════════════════════════════════
# EXPOSURE QUALITY GATE
# ════════════════════════════════════════════════════════════════
def check_exposure(face_bgr: np.ndarray) -> tuple[bool, str]:
    """Reject images that are too dark or too bright for reliable analysis."""
    gray = cv2.cvtColor(face_bgr, cv2.COLOR_BGR2GRAY)
    mean_lum = float(np.mean(gray))

    if mean_lum < 40:
        return False, f"Image too dark (luminance={mean_lum:.1f}). Please retake in better light."
    if mean_lum > 240:
        return False, f"Image too bright/blown out (luminance={mean_lum:.1f}). Please retake."
    return True, "OK"


# ════════════════════════════════════════════════════════════════
# CLAHE LIGHTING NORMALIZATION
# ════════════════════════════════════════════════════════════════
def extract_masked_lab_pixels(face_bgr: np.ndarray, skin_mask: np.ndarray) -> np.ndarray:
    """
    Extract skin pixels in LAB with CLAHE-corrected L channel.

    CLAHE is applied only within the skin mask bounding box to prevent
    non-skin regions (hair, background) from skewing histogram equalization.
    """
    lab = cv2.cvtColor(face_bgr, cv2.COLOR_BGR2LAB)
    L, a, b = cv2.split(lab)

    mask_bool = skin_mask == 255

    # Apply CLAHE only within the skin mask bounding box
    rows = np.any(mask_bool, axis=1)
    cols = np.any(mask_bool, axis=0)
    if rows.any() and cols.any():
        rmin, rmax = np.where(rows)[0][[0, -1]]
        cmin, cmax = np.where(cols)[0][[0, -1]]
        L_roi = L[rmin:rmax + 1, cmin:cmax + 1]
        clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
        L_roi_eq = clahe.apply(L_roi)
        L_eq = L.copy()
        L_eq[rmin:rmax + 1, cmin:cmax + 1] = L_roi_eq
    else:
        clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
        L_eq = clahe.apply(L)

    lab_eq = cv2.merge([L_eq, a, b])
    lab_pixels = lab_eq[mask_bool]
    return lab_pixels


# ════════════════════════════════════════════════════════════════
# K-MEANS ON a*b* ONLY
# ════════════════════════════════════════════════════════════════
def _select_best_k(ab_pixels: np.ndarray, k_range: range = range(2, 6)) -> int:
    """
    Select optimal k for K-Means using silhouette score.
    Falls back to k=3 if the sample is too small for evaluation.
    """
    n = len(ab_pixels)
    if n < 60:
        return 3

    # Subsample for speed if large (silhouette is O(n^2))
    max_sample = 5000
    if n > max_sample:
        rng = np.random.default_rng(42)
        idx = rng.choice(n, max_sample, replace=False)
        sample = ab_pixels[idx]
    else:
        sample = ab_pixels

    best_k, best_score = 3, -1.0
    for k in k_range:
        if k >= n:
            break
        km = KMeans(n_clusters=k, init="k-means++", n_init=5, max_iter=200, random_state=42)
        labels = km.fit_predict(sample)
        if len(set(labels)) < 2:
            continue
        score = silhouette_score(sample, labels, sample_size=min(2000, len(sample)))
        if score > best_score:
            best_score = score
            best_k = k

    logger.info(f"Adaptive k: selected k={best_k} (silhouette={best_score:.3f})")
    return best_k


def cluster_undertone(lab_pixels: np.ndarray, k: int | None = None) -> np.ndarray:
    """
    K-Means on a*b* channels (lighting-invariant).
    Returns the dominant cluster center as [L, a, b] in OpenCV scale.

    When k is None, the optimal k is selected automatically using
    silhouette score over k=2..5.

    Glare & Deep Shadow Filter: drops pixels with L* > 85 (specular
    highlights like forehead glare) or L* < 15 (deep chin shadows)
    before clustering, forcing K-Means to evaluate only mid-tone skin.
    """
    min_pixels = 30
    if len(lab_pixels) < min_pixels:
        raise ValueError(f"Too few skin pixels ({len(lab_pixels)}) — face crop too small.")

    # ── Filter out specular highlights and deep shadows ──────
    L_CHANNEL_LO, L_CHANNEL_HI = 15, 85
    l_values = lab_pixels[:, 0]
    midtone_mask = (l_values >= L_CHANNEL_LO) & (l_values <= L_CHANNEL_HI)
    filtered_pixels = lab_pixels[midtone_mask]

    # Safety fallback: if the filter is too aggressive, revert
    if len(filtered_pixels) < min_pixels:
        logger.warning(
            f"L* filter dropped too many pixels ({len(lab_pixels)} → {len(filtered_pixels)}), "
            f"reverting to unfiltered array"
        )
        filtered_pixels = lab_pixels
    else:
        dropped = len(lab_pixels) - len(filtered_pixels)
        logger.info(
            f"L* filter: dropped {dropped} pixels "
            f"({dropped / len(lab_pixels) * 100:.1f}% highlights/shadows), "
            f"{len(filtered_pixels)} mid-tone pixels remain"
        )

    # ── Adaptive k selection ─────────────────────────────────
    ab_pixels = filtered_pixels[:, 1:].astype(np.float32)
    if k is None:
        k = _select_best_k(ab_pixels)

    # ── K-Means on filtered a*b* only ────────────────────────
    km = KMeans(n_clusters=k, init="k-means++", n_init=10, max_iter=300, random_state=42)
    labels = km.fit_predict(ab_pixels)

    # Select dominant cluster weighted by compactness (inverse variance)
    counts = np.bincount(labels)
    scores = np.zeros(k)
    for cid in range(k):
        cluster_pts = ab_pixels[labels == cid]
        variance = np.mean(np.var(cluster_pts, axis=0)) + 1e-6
        scores[cid] = counts[cid] / variance
    dominant_id = int(scores.argmax())

    dominant_ab = km.cluster_centers_[dominant_id]

    # Use filtered pixels for L* median (not the original array)
    dominant_L = np.median(filtered_pixels[labels == dominant_id, 0])

    logger.info(
        f"K-Means: k={k}, dominant cluster={dominant_id} "
        f"(size={counts[dominant_id]}, score={scores[dominant_id]:.1f})"
    )

    return np.array([dominant_L, dominant_ab[0], dominant_ab[1]])


# ════════════════════════════════════════════════════════════════
# ITA + SEASON MAPPING
# ════════════════════════════════════════════════════════════════
def opencv_lab_to_cie(lab_cv: np.ndarray) -> tuple[float, float, float]:
    """Convert OpenCV LAB (0-255 scale) to CIE LAB (L:0-100, a/b: -128 to +127)."""
    L_cie = lab_cv[0] * 100.0 / 255.0
    a_cie = lab_cv[1] - 128.0
    b_cie = lab_cv[2] - 128.0
    return L_cie, a_cie, b_cie


def calculate_ita(L_cie: float, b_cie: float) -> float:
    """Compute Individual Typology Angle. Higher = lighter skin."""
    if abs(b_cie) < 1e-6:
        b_cie = 1e-6
    return float(np.degrees(np.arctan2((L_cie - 50.0), b_cie)))


def lab_to_hex(L_cie: float, a_cie: float, b_cie: float) -> str:
    """Convert CIE LAB to HEX color string."""
    lab_cv = np.array([[[
        np.clip(L_cie * 255.0 / 100.0, 0, 255),
        np.clip(a_cie + 128.0, 0, 255),
        np.clip(b_cie + 128.0, 0, 255),
    ]]], dtype=np.uint8)
    bgr = cv2.cvtColor(lab_cv, cv2.COLOR_LAB2BGR)
    b, g, r = int(bgr[0, 0, 0]), int(bgr[0, 0, 1]), int(bgr[0, 0, 2])
    return f"#{r:02X}{g:02X}{b:02X}"


def compute_warmth_score(a_cie: float, b_cie: float) -> float:
    """Weighted warm/cool score. Positive = warm, negative = cool."""
    return (0.25 * a_cie) + (0.75 * b_cie)


def _season_probability(ita_angle: float, warmth_score: float, tone: str,
                        ita_min: float, ita_max: float, req_tone: str | None) -> float:
    """
    Compute a soft probability for how well (ita_angle, warmth_score)
    fits a given season range using Gaussian falloff at boundaries.
    """
    # Tone mismatch → zero probability (unless req_tone is None)
    if req_tone is not None and req_tone != tone:
        # Allow small bleed for warmth near zero
        if abs(warmth_score) > 1.5:
            return 0.0
        tone_penalty = 0.3
    else:
        tone_penalty = 1.0

    # ITA fit: 1.0 inside range, Gaussian falloff outside
    ita_mid = (ita_min + ita_max) / 2.0
    ita_half = (ita_max - ita_min) / 2.0
    sigma = ita_half * 0.6

    if ita_min <= ita_angle < ita_max:
        ita_fit = 1.0
    else:
        dist = min(abs(ita_angle - ita_min), abs(ita_angle - ita_max))
        ita_fit = float(np.exp(-0.5 * (dist / sigma) ** 2))

    return ita_fit * tone_penalty


def map_to_season(ita_angle: float, a_cie: float, b_cie: float) -> tuple[str, list[str], str]:
    """
    Map ITA angle + a*b* warmth score to one of 12 seasons.
    Returns (season_name, palette, undertone).
    """
    warmth_score = compute_warmth_score(a_cie, b_cie)
    tone = "warm" if warmth_score > 0 else "cool"
    BOUNDARY_TOL_ITA = 5.0
    BOUNDARY_TOL_W = 0.5

    for ita_min, ita_max, req_tone, season, palette in SEASON_MAP:
        if ita_min <= ita_angle < ita_max:
            if req_tone is None or req_tone == tone:
                ita_on_edge = (
                    ita_angle - ita_min < BOUNDARY_TOL_ITA
                    or ita_max - ita_angle < BOUNDARY_TOL_ITA
                )
                warmth_on_edge = abs(warmth_score) < BOUNDARY_TOL_W
                if ita_on_edge or warmth_on_edge:
                    return f"{season} (Neutral Flow)", palette, "neutral"
                return season, palette, tone

    # Fallback for extreme ITA values
    if ita_angle >= 90:
        return "Light Spring", SEASON_MAP[0][4], "warm"
    return "Deep Winter", SEASON_MAP[9][4], "cool"


def map_to_season_probabilities(ita_angle: float, a_cie: float, b_cie: float) -> list[dict]:
    """
    Compute a probability distribution over all 12 seasons.

    Returns a sorted list of dicts:
        [{"season": str, "probability": float, "palette": list, "undertone": str}, ...]
    Probabilities are normalized to sum to 1.0.
    """
    warmth_score = compute_warmth_score(a_cie, b_cie)
    tone = "warm" if warmth_score > 0 else "cool"

    raw_scores = []
    for ita_min, ita_max, req_tone, season, palette in SEASON_MAP:
        prob = _season_probability(ita_angle, warmth_score, tone, ita_min, ita_max, req_tone)
        ut = "neutral" if abs(warmth_score) < 0.5 else (req_tone or tone)
        raw_scores.append({
            "season": season,
            "probability": prob,
            "palette": palette,
            "undertone": ut,
        })

    # Normalize
    total = sum(s["probability"] for s in raw_scores)
    if total > 0:
        for s in raw_scores:
            s["probability"] = round(s["probability"] / total, 3)
    else:
        raw_scores[0]["probability"] = 1.0

    raw_scores.sort(key=lambda s: s["probability"], reverse=True)
    return raw_scores


# ════════════════════════════════════════════════════════════════
# CONFIDENCE METRIC
# ════════════════════════════════════════════════════════════════
def compute_color_confidence(lab_pixels: np.ndarray, dominant_lab_cv: np.ndarray) -> float:
    """
    Compute confidence based on a*b* cluster tightness.
    Uses percentile-based scaling instead of magic constants.

    Returns a value in [0.0, 1.0]:
     - > 0.8  = high confidence (tight cluster)
     - 0.5–0.8 = medium (some variation)
     - < 0.5  = low (very heterogeneous skin or poor segmentation)
    """
    ab_pixels = lab_pixels[:, 1:].astype(np.float32)
    dom_ab = dominant_lab_cv[1:].astype(np.float32)
    dists = np.linalg.norm(ab_pixels - dom_ab, axis=1)

    # Use the 90th percentile distance as the spread metric
    p90 = float(np.percentile(dists, 90))

    # Calibrated: p90 < 5 → very tight (conf ~1.0), p90 > 25 → very spread (conf ~0.3)
    confidence = max(0.0, min(1.0, 1.0 - (p90 - 5.0) / 25.0))
    return round(confidence, 3)


# ════════════════════════════════════════════════════════════════
# mIoU (for evaluation only, not used in production path)
# ════════════════════════════════════════════════════════════════
def compute_miou(pred_mask: np.ndarray, gt_mask: np.ndarray) -> float:
    """Intersection-over-Union for skin mask evaluation."""
    pred = (pred_mask == 255).astype(bool)
    gt = (gt_mask == 255).astype(bool)
    intersection = np.logical_and(pred, gt).sum()
    union = np.logical_or(pred, gt).sum()
    return float(intersection) / float(union + 1e-8)


_GT_MASK_CACHE_MAX = 256
GT_MASK_CACHE: dict[str, np.ndarray | None] = {}


def load_gt_mask_cached(img_path: str, dataset_root: str, target_size=(512, 512)):
    """Load ground-truth skin mask with caching (for batch evaluation)."""
    from pathlib import Path

    img_id = Path(img_path).stem
    if img_id in GT_MASK_CACHE:
        return GT_MASK_CACHE[img_id]

    search_root = Path(dataset_root).parent
    candidates = list(search_root.rglob(f"{img_id}_skin.png"))
    if not candidates:
        if len(GT_MASK_CACHE) < _GT_MASK_CACHE_MAX:
            GT_MASK_CACHE[img_id] = None
        return None

    gt = cv2.imread(str(candidates[0]), cv2.IMREAD_GRAYSCALE)
    if gt is None:
        if len(GT_MASK_CACHE) < _GT_MASK_CACHE_MAX:
            GT_MASK_CACHE[img_id] = None
        return None

    gt = cv2.resize(gt, target_size, interpolation=cv2.INTER_NEAREST)
    _, gt = cv2.threshold(gt, 127, 255, cv2.THRESH_BINARY)
    if len(GT_MASK_CACHE) < _GT_MASK_CACHE_MAX:
        GT_MASK_CACHE[img_id] = gt
    return gt
