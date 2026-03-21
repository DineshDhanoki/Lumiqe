"""
Lumiqe — Model Downloader.

Downloads required ML model files if they are missing.
Called automatically at startup on Render (where model files are gitignored).

Models:
  - 79999_iter.pth          (BiSeNet face-parsing weights, ~53MB)
  - blaze_face_short_range.tflite  (MediaPipe face detector, ~230KB)

Usage:
  python download_models.py
  OR called automatically in app.main lifespan on first boot.
"""

import logging
import os
import sys
from pathlib import Path

logger = logging.getLogger("lumiqe.model_downloader")

# ─── Paths ────────────────────────────────────────────────────
BACKEND_DIR = Path(__file__).resolve().parent
WEIGHTS_PATH = BACKEND_DIR / "79999_iter.pth"
FACE_MODEL_PATH = BACKEND_DIR / "blaze_face_short_range.tflite"

# ─── Download URLs ────────────────────────────────────────────
# BlazeFace — official MediaPipe CDN (stable, always available)
BLAZE_FACE_URL = (
    "https://storage.googleapis.com/mediapipe-models/"
    "face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite"
)

# BiSeNet weights — set BISENET_WEIGHTS_URL env var to your hosted URL
# (upload 79999_iter.pth to Hugging Face, GitHub Releases, or any CDN)
BISENET_URL = os.getenv("BISENET_WEIGHTS_URL", "")


def _download(url: str, dest: Path, label: str) -> None:
    """Download a file from `url` to `dest` with a progress log."""
    import urllib.request

    logger.info(f"Downloading {label} from {url} ...")
    dest.parent.mkdir(parents=True, exist_ok=True)

    def _progress(block_num, block_size, total_size):
        if total_size > 0:
            pct = block_num * block_size * 100 / total_size
            if block_num % 100 == 0:
                logger.info(f"  {label}: {min(pct, 100):.0f}%")

    try:
        urllib.request.urlretrieve(url, str(dest), reporthook=_progress)
        logger.info(f"  ✓ {label} saved to {dest} ({dest.stat().st_size // 1024}KB)")
    except Exception as exc:
        # Clean up partial download
        if dest.exists():
            dest.unlink()
        raise RuntimeError(f"Failed to download {label}: {exc}") from exc


def ensure_models() -> None:
    """
    Check for model files. Download any that are missing.
    Raises RuntimeError if a required file cannot be obtained.
    """
    errors = []

    # ── BlazeFace tflite ──────────────────────────────────────
    if not FACE_MODEL_PATH.exists():
        try:
            _download(BLAZE_FACE_URL, FACE_MODEL_PATH, "blaze_face_short_range.tflite")
        except RuntimeError as exc:
            errors.append(str(exc))
    else:
        logger.info(f"blaze_face_short_range.tflite already present at {FACE_MODEL_PATH}")

    # ── BiSeNet weights ───────────────────────────────────────
    if not WEIGHTS_PATH.exists():
        if not BISENET_URL:
            errors.append(
                "79999_iter.pth is missing and BISENET_WEIGHTS_URL env var is not set. "
                "Please upload the file to Hugging Face / GitHub Releases / any CDN "
                "and set BISENET_WEIGHTS_URL to the direct download link."
            )
        else:
            try:
                _download(BISENET_URL, WEIGHTS_PATH, "79999_iter.pth")
            except RuntimeError as exc:
                errors.append(str(exc))
    else:
        logger.info(f"79999_iter.pth already present at {WEIGHTS_PATH}")

    if errors:
        for err in errors:
            logger.error(err)
        raise RuntimeError(
            "One or more model files could not be loaded:\n" + "\n".join(errors)
        )

    logger.info("All model files are ready.")


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO, format="%(levelname)s: %(message)s")
    try:
        ensure_models()
    except RuntimeError as exc:
        print(f"\nERROR: {exc}", file=sys.stderr)
        sys.exit(1)
