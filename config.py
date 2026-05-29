from pathlib import Path
import os

BASE_DIR = Path(__file__).resolve().parent

MODEL_NAME = os.getenv("MODEL_NAME", "buffalo_l")
CTX_ID = -1
DET_SIZE = (320, 320)
INFER_MAX_WIDTH = 480

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
