from pathlib import Path
import os

BASE_DIR = Path(__file__).resolve().parent

# Render free: DATA_DIR=/tmp/data — profile nhẹ RAM (~512MB)
_CLOUD = os.getenv("DATA_DIR", "").startswith("/tmp") or os.getenv(
    "RENDER", ""
).lower() in ("1", "true", "yes")

MODEL_NAME = os.getenv("MODEL_NAME", "buffalo_s" if _CLOUD else "buffalo_l")
CTX_ID = -1
DET_SIZE = (256, 256) if _CLOUD else (320, 320)
INFER_MAX_WIDTH = int(os.getenv("INFER_MAX_WIDTH", "360" if _CLOUD else "480"))

# ONNX Runtime — ít thread + tắt arena giúp giảm RAM trên cloud
ONNX_PROVIDER_OPTS: dict = {
    "intra_op_num_threads": int(os.getenv("ONNX_INTRA_THREADS", "1" if _CLOUD else "4")),
    "inter_op_num_threads": int(os.getenv("ONNX_INTER_THREADS", "1")),
}
if _CLOUD or os.getenv("ONNX_DISABLE_MEM_ARENA", "").lower() in ("1", "true", "yes"):
    ONNX_PROVIDER_OPTS["enable_cpu_mem_arena"] = False

SIMILARITY_THRESHOLD = float(os.getenv("SIMILARITY_THRESHOLD", "0.45"))

REGISTER_MIN_SAMPLES = 5
REGISTER_MAX_SAMPLES = 7

TRACK_SECONDS = 1.4
MIN_FRAMES_FOR_DECISION = 2
MAX_CHECKIN_SECONDS = 3.0
COOLDOWN_SECONDS = 12

CAMERA_INDEX = 0

WEB_HOST = "0.0.0.0"
WEB_PORT = int(os.getenv("PORT", os.getenv("WEB_PORT", "8000")))

DATA_DIR = Path(os.getenv("DATA_DIR", str(BASE_DIR / "data")))
EMPLOYEES_FILE = DATA_DIR / "employees.json"
ATTENDANCE_FILE = DATA_DIR / "attendance.json"
