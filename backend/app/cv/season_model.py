"""
Lumiqe CV — Season Classifier (Trained Model).

Loads the trained season classifier from backend/models/season_classifier.joblib
and provides model-based season prediction with probabilities.

Falls back to the hardcoded SEASON_MAP if the model file is not found.
"""

import logging
from pathlib import Path

import numpy as np

logger = logging.getLogger("lumiqe.cv.season_model")

# ─── Model path ──────────────────────────────────────────────
_BACKEND_DIR = Path(__file__).resolve().parent.parent.parent
_MODEL_PATH = _BACKEND_DIR / "models" / "season_classifier.joblib"

# ─── Lazy-loaded singleton ───────────────────────────────────
_season_clf = None
_model_available = None

# ─── Palette mapping (same as SEASON_MAP) ────────────────────
SEASON_PALETTES = {
    "Light Spring":  ["#FDDBB4", "#F9C784", "#FFF0DC", "#FFE8B0", "#F5DCA0", "#FFF5E6"],
    "True Spring":   ["#F5C191", "#E8A96B", "#FDE8C8", "#FFD5A0", "#F0B878", "#FFF0D8"],
    "Warm Spring":   ["#E8A96B", "#D4875A", "#F5D5B5", "#C07848", "#DDA070", "#F0C8A0"],
    "Light Summer":  ["#E8C4C4", "#D4A0A0", "#F5E0E0", "#C8B0C0", "#E0D0D8", "#F0E8EE"],
    "True Summer":   ["#C9A0A0", "#B07878", "#E8D0D0", "#A08888", "#D0B8B8", "#E0C8C8"],
    "Soft Summer":   ["#B89090", "#A07878", "#D8C4C4", "#907070", "#C0A8A8", "#D0B8B8"],
    "Soft Autumn":   ["#C4956A", "#A87848", "#DDB88C", "#B8885C", "#D0A478", "#E0C098"],
    "True Autumn":   ["#C07840", "#A05820", "#D89060", "#8C4818", "#B06830", "#E0A070"],
    "Deep Autumn":   ["#8B5E3C", "#6B3E1C", "#A87848", "#5C2E10", "#7A4E30", "#B88858"],
    "Deep Winter":   ["#2C1810", "#4A2820", "#6B3830", "#1A1018", "#3C2028", "#584038"],
    "True Winter":   ["#E8E0F0", "#C0B0D8", "#A090C0", "#D8D0E8", "#B0A0C8", "#9080B0"],
    "Bright Winter": ["#F0E8FF", "#D0C0F0", "#B0A0E0", "#E0D8F8", "#C0B0E8", "#A098D0"],
}


def is_model_available() -> bool:
    """Check if the trained season classifier model file exists."""
    global _model_available
    if _model_available is None:
        _model_available = _MODEL_PATH.exists()
        if _model_available:
            logger.info(f"Season classifier found at {_MODEL_PATH}")
        else:
            logger.warning(
                f"Season classifier not found at {_MODEL_PATH}. "
                f"Falling back to hardcoded SEASON_MAP. "
                f"Run the Colab training notebook to generate the model."
            )
    return _model_available


def get_season_classifier():
    """Load and return the season classifier (lazy-loaded singleton)."""
    global _season_clf
    if _season_clf is None:
        if not is_model_available():
            return None
        import joblib
        _season_clf = joblib.load(str(_MODEL_PATH))
        logger.info(
            f"Season classifier loaded: {_season_clf['model_name']}, "
            f"accuracy={_season_clf['test_accuracy']*100:.1f}%"
        )
    return _season_clf


def predict_season(
    ita_angle: float,
    a_cie: float,
    b_cie: float,
    L_cie: float,
    warmth: float,
) -> tuple[str, list[str], str, list[dict]]:
    """
    Predict season using the trained model.

    Returns:
        (season_name, palette, undertone, season_probabilities)

    If the model is not available, returns None (caller should use fallback).
    """
    clf_data = get_season_classifier()
    if clf_data is None:
        return None

    model = clf_data["model"]
    le = clf_data["label_encoder"]

    features = np.array([[ita_angle, a_cie, b_cie, L_cie, warmth]])
    proba = model.predict_proba(features)[0]

    # Sort by probability descending
    top_indices = np.argsort(proba)[::-1]

    # Top season
    top_season = le.classes_[top_indices[0]]
    top_prob = proba[top_indices[0]]

    # Determine undertone from warmth
    if abs(warmth) < 0.5:
        undertone = "neutral"
    elif warmth > 0:
        undertone = "warm"
    else:
        undertone = "cool"

    # Add "(Neutral Flow)" if top probability is low (uncertain)
    season_name = top_season
    if top_prob < 0.5 and undertone == "neutral":
        season_name = f"{top_season} (Neutral Flow)"

    palette = SEASON_PALETTES.get(top_season, SEASON_PALETTES["Light Spring"])

    # Build probability distribution (top 4)
    season_probabilities = []
    for idx in top_indices[:4]:
        s_name = le.classes_[idx]
        s_ut = "neutral" if abs(warmth) < 0.5 else ("warm" if warmth > 0 else "cool")
        season_probabilities.append({
            "season": s_name,
            "probability": round(float(proba[idx]), 3),
            "palette": SEASON_PALETTES.get(s_name, []),
            "undertone": s_ut,
        })

    return season_name, palette, undertone, season_probabilities
