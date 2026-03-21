"""
Lumiqe CV — Model Loader.

Handles loading BiSeNet weights, MediaPipe face detector,
seasons.json, and all path resolution. Lazy-loaded on first access.

IMPORTANT: All algorithm constants and loading logic are preserved
exactly as in the original lumiqe_engine.py.
"""

import importlib.util
import json
import logging
import sys
from pathlib import Path

import torch

logger = logging.getLogger("lumiqe.cv.loader")

# ─── Resolve all paths relative to the backend/ root ─────────
_BACKEND_DIR = Path(__file__).resolve().parent.parent.parent
_WEIGHTS_PATH = _BACKEND_DIR / "79999_iter.pth"
_RESNET_PATH = _BACKEND_DIR / "face-parsing" / "resnet.py"
_MODEL_PATH = _BACKEND_DIR / "face-parsing" / "model.py"
_SEASONS_JSON = _BACKEND_DIR / "data" / "seasons.json"
_FACE_MODEL_PATH = _BACKEND_DIR / "blaze_face_short_range.tflite"

# ─── Lazy-load singletons ────────────────────────────────────
_bisenet = None
_face_detector = None
_device = None
_seasons_data = None


def _load_seasons_data() -> dict:
    """Load and validate seasons.json knowledge base."""
    if not _SEASONS_JSON.exists():
        logger.warning(f"seasons.json not found at {_SEASONS_JSON}, enrichment disabled")
        return {}
    with open(_SEASONS_JSON, "r", encoding="utf-8") as f:
        data = json.load(f)
    logger.info(f"Loaded season data for {len(data)} seasons")
    return data


def _load_module(name: str, path: Path):
    """Load a Python module by file path into sys.modules."""
    spec = importlib.util.spec_from_file_location(name, str(path))
    module = importlib.util.module_from_spec(spec)
    sys.modules[name] = module
    spec.loader.exec_module(module)
    return module


def _load_bisenet(weights_path: Path, device: str) -> torch.nn.Module:
    """Load BiSeNet with trained weights."""
    _load_module("resnet", _RESNET_PATH)
    _model_module = _load_module("model", _MODEL_PATH)
    _BiSeNetClass = _model_module.BiSeNet

    model = _BiSeNetClass(n_classes=19).to(device)

    if not weights_path.exists():
        raise FileNotFoundError(
            f"Model weights not found at {weights_path}. "
            f"Download 79999_iter.pth from your Colab notebook."
        )

    state = torch.load(str(weights_path), map_location=device, weights_only=True)
    model.load_state_dict(state, strict=True)
    model.eval()
    logger.info("BiSeNet loaded (strict=True, weights_only=True)")
    return model


def _create_face_detector():
    """Create MediaPipe face detector using the tasks API."""
    from mediapipe.tasks.python import BaseOptions
    from mediapipe.tasks.python.vision import (
        FaceDetector,
        FaceDetectorOptions,
    )
    if not _FACE_MODEL_PATH.exists():
        raise FileNotFoundError(
            f"Face detector model not found at {_FACE_MODEL_PATH}. "
            f"Download blaze_face_short_range.tflite from MediaPipe."
        )
    options = FaceDetectorOptions(
        base_options=BaseOptions(model_asset_path=str(_FACE_MODEL_PATH)),
        min_detection_confidence=0.5,
    )
    detector = FaceDetector.create_from_options(options)
    logger.info("MediaPipe Face Detector loaded (tasks API)")
    return detector


# ─── Public Accessors (lazy-loaded on first call) ────────────

def get_device() -> str:
    """Return the compute device (cuda/cpu)."""
    global _device
    if _device is None:
        _device = "cuda" if torch.cuda.is_available() else "cpu"
        logger.info(f"Hardware: {_device.upper()}")
    return _device


def get_bisenet() -> torch.nn.Module:
    """Return the loaded BiSeNet model (lazy-loaded)."""
    global _bisenet
    if _bisenet is None:
        _bisenet = _load_bisenet(_WEIGHTS_PATH, get_device())
    return _bisenet


def get_face_detector():
    """Return the MediaPipe face detector (lazy-loaded)."""
    global _face_detector
    if _face_detector is None:
        _face_detector = _create_face_detector()
    return _face_detector


def get_seasons_data() -> dict:
    """Return the seasons.json knowledge base (lazy-loaded)."""
    global _seasons_data
    if _seasons_data is None:
        _seasons_data = _load_seasons_data()
    return _seasons_data
