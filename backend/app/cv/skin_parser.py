"""
Lumiqe CV — Skin Parser.

BiSeNet face parsing → binary skin mask (class 1) + morphological cleanup.

IMPORTANT: All algorithm logic is identical to lumiqe_engine.py.
No constants, thresholds, or numerical operations have been changed.
"""

import logging

import cv2
import numpy as np
import torch

logger = logging.getLogger("lumiqe.cv.skin_parser")

# ─── BiSeNet normalization constants (ImageNet) ──────────────
_BISENET_MEAN = np.array([0.485, 0.456, 0.406], dtype=np.float32)
_BISENET_STD = np.array([0.229, 0.224, 0.225], dtype=np.float32)
SKIN_CLASS = 1


def generate_skin_mask(face_bgr: np.ndarray, model: torch.nn.Module, device: str = "cpu") -> np.ndarray:
    """Run BiSeNet and return morphologically cleaned binary skin mask."""
    img_rgb = cv2.cvtColor(face_bgr, cv2.COLOR_BGR2RGB).astype(np.float32) / 255.0
    tensor = torch.from_numpy((img_rgb - _BISENET_MEAN) / _BISENET_STD)
    tensor = tensor.permute(2, 0, 1).unsqueeze(0).float().to(device)

    with torch.no_grad():
        out = model(tensor)
        # BiSeNet returns (feat_out, feat_out16, feat_out32) tuple
        logits = out[0] if isinstance(out, (tuple, list)) else out
        seg = logits.argmax(dim=1).squeeze().cpu().numpy().astype(np.uint8)

    skin_mask = (seg == SKIN_CLASS).astype(np.uint8) * 255

    # Morphological cleanup
    kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (7, 7))
    skin_mask = cv2.morphologyEx(skin_mask, cv2.MORPH_OPEN, kernel, iterations=2)
    skin_mask = cv2.morphologyEx(skin_mask, cv2.MORPH_CLOSE, kernel, iterations=2)
    return skin_mask
