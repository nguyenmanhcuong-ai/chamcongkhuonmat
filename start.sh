#!/bin/sh
set -e
echo "=== Starting cham cong server ==="
python scripts/preload_model.py
echo "=== Starting uvicorn ==="
exec uvicorn app:app --host 0.0.0.0 --port "${PORT:-8000}"
