#!/bin/sh
set -e
cd "$(dirname "$0")"
export PYTHONPATH="${PYTHONPATH:-/app}:$(pwd)"
echo "=== Preload model ==="
python scripts/preload_model.py
echo "=== Start server ==="
exec uvicorn app:app --host 0.0.0.0 --port "${PORT:-8000}"
