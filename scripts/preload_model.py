import os
import sys
from pathlib import Path

# Server Linux không có X11 — tránh lỗi libxcb khi import cv2
os.environ.setdefault("OMP_NUM_THREADS", "1")

# /app phải có trong path khi chạy từ scripts/
_ROOT = Path(__file__).resolve().parent.parent
if str(_ROOT) not in sys.path:
    sys.path.insert(0, str(_ROOT))

# Import cv2 trước insightface để chắc dùng opencv-python-headless
import cv2  # noqa: F401

import config


def main() -> int:
    name = os.getenv("MODEL_NAME", config.MODEL_NAME)
    print(f"Loading {name}...", flush=True)
    try:
        from insightface.app import FaceAnalysis

        app = FaceAnalysis(
            name=name,
            providers=["CPUExecutionProvider"],
            allowed_modules=["detection", "recognition"],
        )
        app.prepare(ctx_id=-1, det_size=config.DET_SIZE)
        print("Model OK", flush=True)
        return 0
    except Exception as e:
        print(f"Error: {e}", file=sys.stderr, flush=True)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
