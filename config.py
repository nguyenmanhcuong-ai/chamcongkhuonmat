from pathlib import Path

# Thư mục dữ liệu
BASE_DIR = Path(__file__).resolve().parent
DATA_DIR = BASE_DIR / "data"
EMPLOYEES_FILE = DATA_DIR / "employees.json"
ATTENDANCE_FILE = DATA_DIR / "attendance.json"

# InsightFace: buffalo_l = SCRFD + ArcFace (chuẩn production)
MODEL_NAME = "buffalo_l"
# ctx_id=0 cần GPU + CUDA; -1 chỉ CPU (máy không có NVIDIA → dùng -1)
CTX_ID = -1
# 320 nhanh hơn 640 rất nhiều trên CPU, vẫn đủ chính xác chấm công
DET_SIZE = (320, 320)
INFER_MAX_WIDTH = 480

# Ngưỡng cosine similarity (embedding đã normalize)
SIMILARITY_THRESHOLD = 0.45

# Đăng ký: 5–7 ảnh là đủ
REGISTER_MIN_SAMPLES = 5
REGISTER_MAX_SAMPLES = 7

# Chấm công: mục tiêu hoàn tất trong <= 3 giây
TRACK_SECONDS = 1.4
MIN_FRAMES_FOR_DECISION = 2
MAX_CHECKIN_SECONDS = 3.0
# Chống chấm liên tục; hết thời gian này có thể chấm lại
COOLDOWN_SECONDS = 12

# Camera (script OpenCV)
CAMERA_INDEX = 0

# Web
WEB_HOST = "0.0.0.0"
WEB_PORT = 8000
