import os
import sys

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
