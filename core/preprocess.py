"""Thu nhỏ ảnh trước inference — nhanh hơn nhiều trên CPU."""

from __future__ import annotations

import cv2
import numpy as np

import config


def resize_for_inference(image_bgr: np.ndarray) -> np.ndarray:
    h, w = image_bgr.shape[:2]
    max_w = config.INFER_MAX_WIDTH
    if w <= max_w:
        return image_bgr
    scale = max_w / w
    new_w = max_w
    new_h = int(h * scale)
    return cv2.resize(image_bgr, (new_w, new_h), interpolation=cv2.INTER_LINEAR)
