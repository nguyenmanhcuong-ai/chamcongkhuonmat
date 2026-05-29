FROM python:3.10-slim

ENV PYTHONUNBUFFERED=1 \
    PYTHONPATH=/app \
    MODEL_NAME=buffalo_s \
    DATA_DIR=/tmp/data \
    OMP_NUM_THREADS=1

RUN apt-get update && apt-get install -y --no-install-recommends \
    libglib2.0-0 libgomp1 libxcb1 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements.txt .
# insightface có thể cài opencv-python (cần X11) — chỉ giữ headless trên server
RUN pip install --no-cache-dir -r requirements.txt \
    && pip uninstall -y opencv-python opencv-contrib-python 2>/dev/null || true \
    && pip install --no-cache-dir --force-reinstall "opencv-python-headless>=4.8.0"

COPY config.py app.py start.sh ./
COPY core/ ./core/
COPY web/ ./web/
COPY scripts/ ./scripts/

RUN mkdir -p /tmp/data && chmod +x start.sh

EXPOSE 8000
CMD ["./start.sh"]
