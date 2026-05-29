FROM python:3.10-slim

ENV PYTHONUNBUFFERED=1 \
    MODEL_NAME=buffalo_s \
    DATA_DIR=/tmp/data

RUN apt-get update && apt-get install -y --no-install-recommends \
    libglib2.0-0 \
    libgomp1 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Tải model InsightFace lúc build (tránh timeout khi start)
RUN python -c "\
from insightface.app import FaceAnalysis; \
import os; \
app = FaceAnalysis(name=os.environ['MODEL_NAME'], providers=['CPUExecutionProvider'], allowed_modules=['detection','recognition']); \
app.prepare(ctx_id=-1, det_size=(320,320)); \
print('Model OK:', os.environ['MODEL_NAME'])"

COPY config.py app.py ./
COPY core/ ./core/
COPY web/ ./web/

RUN mkdir -p /tmp/data

EXPOSE 8000

CMD ["sh", "-c", "uvicorn app:app --host 0.0.0.0 --port ${PORT:-8000}"]
