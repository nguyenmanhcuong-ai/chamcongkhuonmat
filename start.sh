#!/bin/sh
set -e
cd "$(dirname "$0")"
export PYTHONPATH="${PYTHONPATH:-/app}:$(pwd)"
# Giảm RAM peak trên Render free (512MB)
export OMP_NUM_THREADS="${OMP_NUM_THREADS:-1}"
export OPENBLAS_NUM_THREADS="${OPENBLAS_NUM_THREADS:-1}"
export MKL_NUM_THREADS="${MKL_NUM_THREADS:-1}"
export MALLOC_ARENA_MAX="${MALLOC_ARENA_MAX:-2}"
echo "=== Start server (model loads once at startup) ==="
exec uvicorn app:app --host 0.0.0.0 --port "${PORT:-8000}" --workers 1
