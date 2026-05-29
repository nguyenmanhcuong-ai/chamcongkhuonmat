"""InsightFace: SCRFD (detect) + alignment + ArcFace (embedding)."""

from __future__ import annotations

import numpy as np
import onnxruntime as ort
from insightface.app import FaceAnalysis

import config
from .preprocess import resize_for_inference


def _onnx_providers() -> tuple[list[str], int, dict]:
    """Chọn CPU hoặc CUDA theo máy — tránh cảnh báo CUDAExecutionProvider."""
    available = set(ort.get_available_providers())
    if config.CTX_ID >= 0 and "CUDAExecutionProvider" in available:
        return ["CUDAExecutionProvider", "CPUExecutionProvider"], config.CTX_ID, {}
    return ["CPUExecutionProvider"], -1, dict(config.ONNX_PROVIDER_OPTS)


class FaceEngine:
    """Wrapper FaceAnalysis — detect, landmarks, embedding."""

    def __init__(self) -> None:
        providers, ctx_id, provider_opts = _onnx_providers()
        provider_list = (
            [(p, provider_opts) for p in providers] if provider_opts else providers
        )
        self.app = FaceAnalysis(
            name=config.MODEL_NAME,
            providers=provider_list,
            allowed_modules=["detection", "recognition"],
        )
        self.app.prepare(ctx_id=ctx_id, det_size=config.DET_SIZE)

    def detect(self, image_bgr: np.ndarray) -> list:
        """Trả danh sách face objects (box, kps, embedding, ...)."""
        if image_bgr is None or image_bgr.size == 0:
            return []
        image_bgr = resize_for_inference(image_bgr)
        return self.app.get(image_bgr)

    def largest_face(self, image_bgr: np.ndarray):
        """Lấy mặt lớn nhất trong frame (phù hợp chấm công 1 người/lần)."""
        faces = self.detect(image_bgr)
        if not faces:
            return None
        return max(
            faces,
            key=lambda f: (f.bbox[2] - f.bbox[0]) * (f.bbox[3] - f.bbox[1]),
        )

    @staticmethod
    def embedding(face) -> np.ndarray | None:
        emb = getattr(face, "embedding", None)
        if emb is None:
            return None
        emb = np.asarray(emb, dtype=np.float32)
        norm = np.linalg.norm(emb)
        if norm < 1e-6:
            return None
        return emb / norm

    @staticmethod
    def cosine_similarity(a: np.ndarray, b: np.ndarray) -> float:
        return float(np.dot(a, b))
