FROM python:3.10-slim

ENV PYTHONUNBUFFERED=1 \
    PYTHONPATH=/app \
    MODEL_NAME=buffalo_s \
    DATA_DIR=/tmp/data \
    RENDER=true \
    OMP_NUM_THREADS=1 \
    OPENBLAS_NUM_THREADS=1 \
    MKL_NUM_THREADS=1 \
    MALLOC_ARENA_MAX=2 \
    INSIGHTFACE_HOME=/root/.insightface

RUN apt-get update && apt-get install -y --no-install-recommends \
    libglib2.0-0 libgomp1 libxcb1 wget unzip \
    && rm -rf /var/lib/apt/lists/*

# Model có sẵn trong image — tránh tải + peak RAM lúc start container
RUN mkdir -p /root/.insightface/models/buffalo_s \
    && wget -qO /tmp/buffalo_s.zip \
      "https://github.com/deepinsight/insightface/releases/download/v0.7/buffalo_s.zip" \
    && unzip -q /tmp/buffalo_s.zip -d /root/.insightface/models/buffalo_s \
    && rm /tmp/buffalo_s.zip \
    && test -n "$(find /root/.insightface/models/buffalo_s -name '*.onnx' | head -1)" \
    || (echo "buffalo_s unpack failed" && exit 1)

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
