"""
Lumiqe CV — Face Detector.

MediaPipe face detection + padded crop to 512×512.
EXIF rotation fix for phone photos.

IMPORTANT: All algorithm logic is identical to lumiqe_engine.py.
No constants, thresholds, or numerical operations have been changed.
"""

import logging

import cv2
import numpy as np
import mediapipe as mp

from app.cv.loader import get_face_detector

logger = logging.getLogger("lumiqe.cv.face_detector")


# ════════════════════════════════════════════════════════════════
# EXIF ROTATION FIX
# ════════════════════════════════════════════════════════════════
def _get_exif_orientation(data: bytes) -> int:
    """
    Extract EXIF orientation from raw image bytes.
    Returns the orientation value (1 = no rotation) or 1 if not found.
    """
    if data[:2] != b'\xff\xd8':  # Not a JPEG
        return 1

    idx = data.find(b'\x01\x12')
    if idx == -1:
        return 1

    if b'MM' in data[:12]:      # Motorola byte order (big-endian)
        return int.from_bytes(data[idx + 6:idx + 8], byteorder='big')
    elif b'II' in data[:12]:    # Intel byte order (little-endian)
        return int.from_bytes(data[idx + 6:idx + 8], byteorder='little')

    return 1


def _apply_exif_rotation(image: np.ndarray, orientation: int) -> np.ndarray:
    """Apply cv2 rotation based on EXIF orientation tag value."""
    if orientation == 3:
        return cv2.rotate(image, cv2.ROTATE_180)
    elif orientation == 6:
        return cv2.rotate(image, cv2.ROTATE_90_CLOCKWISE)
    elif orientation == 8:
        return cv2.rotate(image, cv2.ROTATE_90_COUNTERCLOCKWISE)
    return image


def _fix_exif_rotation(image: np.ndarray, image_path: str = None) -> np.ndarray:
    """
    Fix image orientation using EXIF data from a file path.
    cv2.imread ignores EXIF, so phone photos often come in sideways.
    """
    if image_path is None:
        return image

    try:
        with open(image_path, "rb") as f:
            data = f.read(65536)
        orientation = _get_exif_orientation(data)
        if orientation != 1:
            image = _apply_exif_rotation(image, orientation)
            logger.debug(f"EXIF orientation={orientation}, rotation applied")
    except Exception as exc:
        logger.warning(f"EXIF rotation skipped: {exc}", exc_info=True)

    return image


# ════════════════════════════════════════════════════════════════
# FACE DETECTION & CROP
# ════════════════════════════════════════════════════════════════
def detect_and_crop_face(img_bgr: np.ndarray, padding: float = 0.25) -> np.ndarray | None:
    """Detect face with MediaPipe and return padded 512×512 crop."""
    detector = get_face_detector()

    img_rgb = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2RGB)
    mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=img_rgb)
    results = detector.detect(mp_image)

    if not results.detections:
        return None

    det = results.detections[0]
    bb = det.bounding_box
    h, w = img_bgr.shape[:2]

    # tasks API returns pixel coordinates in bounding_box
    x1 = max(0, int(bb.origin_x - padding * bb.width))
    y1 = max(0, int(bb.origin_y - padding * bb.height))
    x2 = min(w - 1, int(bb.origin_x + (1 + padding) * bb.width))
    y2 = min(h - 1, int(bb.origin_y + (1 + padding) * bb.height))

    crop = img_bgr[y1:y2, x1:x2]

    # Guard against zero-dimension crops
    if crop.shape[0] < 10 or crop.shape[1] < 10:
        return None

    crop = cv2.resize(crop, (512, 512), interpolation=cv2.INTER_LANCZOS4)
    return crop


# ════════════════════════════════════════════════════════════════
# IMAGE DECODERS
# ════════════════════════════════════════════════════════════════
def decode_image(image_path: str) -> np.ndarray:
    """Read image from disk with EXIF rotation fix."""
    img = cv2.imread(image_path)
    if img is None:
        raise FileNotFoundError(f"Cannot read image: {image_path}")
    img = _fix_exif_rotation(img, image_path)
    return img


def decode_bytes(image_bytes: bytes) -> np.ndarray:
    """Decode image from raw bytes (for API upload via FormData)."""
    # Extract EXIF orientation before decoding — cv2.imdecode strips EXIF metadata
    orientation = _get_exif_orientation(image_bytes[:65536])

    nparr = np.frombuffer(image_bytes, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    if img is None:
        raise ValueError("Could not decode image bytes. File may be corrupt or not an image.")

    if orientation != 1:
        img = _apply_exif_rotation(img, orientation)
        logger.debug(f"EXIF orientation={orientation}, rotation applied to uploaded bytes")

    return img
