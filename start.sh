#!/bin/sh
set -e
echo "=== Preload model ==="
python scripts/preload_model.py
echo "=== Start server ==="
exec uvicorn app:app --host 0.0.0.0 --port "${PORT:-8000}"
