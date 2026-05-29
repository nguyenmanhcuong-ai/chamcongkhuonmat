"""
Web chấm công khuôn mặt — FastAPI + HTML.

Chạy:
  python app.py
Mở trình duyệt: http://localhost:8000
"""

from __future__ import annotations

import base64
import uuid
from contextlib import asynccontextmanager
from typing import Any

import cv2
import numpy as np
import uvicorn
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, HTMLResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field

import config
from core import AttendanceTracker, EmployeeDatabase, FaceEngine
from core.database import AttendanceLog
from core.network import get_lan_ips

STATIC_DIR = config.BASE_DIR / "web" / "static"

engine: FaceEngine | None = None
db: EmployeeDatabase | None = None
attendance_log: AttendanceLog | None = None
trackers: dict[str, AttendanceTracker] = {}
register_buffers: dict[str, list[np.ndarray]] = {}


def decode_bgr_image(data_url: str) -> np.ndarray:
    raw = data_url
    if "," in raw:
        raw = raw.split(",", 1)[1]
    buf = np.frombuffer(base64.b64decode(raw), dtype=np.uint8)
    img = cv2.imdecode(buf, cv2.IMREAD_COLOR)
    if img is None:
        raise ValueError("Không đọc được ảnh")
    return img


def get_tracker(session_id: str) -> AttendanceTracker:
    if session_id not in trackers:
        trackers[session_id] = AttendanceTracker(db, engine)
    return trackers[session_id]


@asynccontextmanager
async def lifespan(_app: FastAPI):
    global engine, db, attendance_log
    print("Loading InsightFace (SCRFD + ArcFace)...")
    engine = FaceEngine()
    db = EmployeeDatabase()
    attendance_log = AttendanceLog()
    config.DATA_DIR.mkdir(parents=True, exist_ok=True)
    n = len(db.list_employees())
    port = config.WEB_PORT
    print(f"Ready - {n} employee(s) in database.")
    print("=" * 55)
    print("  TABLET / APK nhap mot trong cac dia chi:")
    for ip in get_lan_ips():
        print(f"    http://{ip}:{port}")
    print(f"  PC trinh duyet: http://127.0.0.1:{port}")
    print("  Kiem tra tablet: http://IP-PC:{0}/api/ping".format(port))
    print("  Share file duoc nhung tablet khong vao -> mo-firewall.bat (Admin)")
    print("  Tablet phai cung mang (IP 192.168.8-11.x neu PC la 192.168.10.x)")
    print("=" * 55)
    yield
    trackers.clear()
    register_buffers.clear()


app = FastAPI(title="Chấm công khuôn mặt", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.mount("/static", StaticFiles(directory=str(STATIC_DIR)), name="static")
# Đường dẫn tương đối cho web + APK (css/style.css, js/...)
app.mount("/css", StaticFiles(directory=str(STATIC_DIR / "css")), name="css")
app.mount("/js", StaticFiles(directory=str(STATIC_DIR / "js")), name="js")
app.mount("/icons", StaticFiles(directory=str(STATIC_DIR / "icons")), name="icons")
app.mount("/audio", StaticFiles(directory=str(STATIC_DIR / "audio")), name="audio")


@app.get("/manifest.json")
def manifest_json():
    return FileResponse(STATIC_DIR / "manifest.json", media_type="application/json")


class FramePayload(BaseModel):
    image: str
    session_id: str | None = None


class RegisterSavePayload(BaseModel):
    employee_id: str = Field(min_length=1, max_length=32)
    name: str = Field(min_length=1, max_length=128)
    session_id: str


@app.get("/", response_class=HTMLResponse)
def page_checkin():
    return FileResponse(STATIC_DIR / "index.html")


@app.get("/register", response_class=HTMLResponse)
def page_register():
    return FileResponse(STATIC_DIR / "register.html")


@app.get("/setup", response_class=HTMLResponse)
def page_setup():
    return FileResponse(STATIC_DIR / "setup.html")


@app.post("/api/session")
def new_session() -> dict[str, str]:
    sid = str(uuid.uuid4())
    trackers[sid] = AttendanceTracker(db, engine)
    register_buffers[sid] = []
    return {"session_id": sid}


@app.post("/api/checkin/frame")
def checkin_frame(payload: FramePayload) -> dict[str, Any]:
    if not db.list_employees():
        raise HTTPException(400, "Chưa có nhân viên. Vào trang Đăng ký trước.")

    sid = payload.session_id or str(uuid.uuid4())
    tracker = get_tracker(sid)

    try:
        frame = decode_bgr_image(payload.image)
    except ValueError as e:
        raise HTTPException(400, str(e)) from e

    result = tracker.add_frame(frame)

    if result.get("status") == "matched":
        record = attendance_log.append(
            result["employee_id"],
            result["name"],
            result["score"],
        )
        result["record"] = record

    result["session_id"] = sid
    return result


@app.get("/api/ping")
def api_ping() -> dict[str, str]:
    return {"status": "ok", "message": "Server cham cong dang chay"}


@app.get("/api/employees")
def list_employees() -> list[dict]:
    employees = db._data.get("employees", {})
    return [
        {
            "id": emp_id,
            "name": rec.get("name", emp_id),
            "registered_at": rec.get("registered_at"),
            "sample_count": rec.get("sample_count"),
        }
        for emp_id, rec in employees.items()
    ]


@app.get("/api/attendance")
def get_attendance(limit: int = 30) -> list[dict]:
    return list(reversed(attendance_log.recent(limit)))


@app.post("/api/register/capture")
def register_capture(payload: FramePayload) -> dict[str, Any]:
    sid = payload.session_id
    if not sid:
        raise HTTPException(400, "Thiếu session_id")

    if sid not in register_buffers:
        register_buffers[sid] = []

    samples = register_buffers[sid]
    if len(samples) >= config.REGISTER_MAX_SAMPLES:
        return {
            "ok": False,
            "message": f"Đủ {config.REGISTER_MAX_SAMPLES} mẫu",
            "count": len(samples),
            "max": config.REGISTER_MAX_SAMPLES,
            "min": config.REGISTER_MIN_SAMPLES,
        }

    try:
        frame = decode_bgr_image(payload.image)
    except ValueError as e:
        raise HTTPException(400, str(e)) from e

    face = engine.largest_face(frame)
    if face is None:
        return {
            "ok": False,
            "message": "Không thấy mặt",
            "count": len(samples),
            "bbox": None,
        }

    emb = engine.embedding(face)
    if emb is None:
        return {
            "ok": False,
            "message": "Không tạo được embedding",
            "count": len(samples),
            "bbox": None,
        }

    samples.append(emb)
    return {
        "ok": True,
        "message": f"Đã chụp mẫu {len(samples)}",
        "count": len(samples),
        "max": config.REGISTER_MAX_SAMPLES,
        "min": config.REGISTER_MIN_SAMPLES,
        "bbox": face.bbox.astype(int).tolist(),
    }


@app.post("/api/register/save")
def register_save(payload: RegisterSavePayload) -> dict[str, str]:
    samples = register_buffers.get(payload.session_id, [])
    try:
        db.register(payload.employee_id.strip(), payload.name.strip(), samples)
    except ValueError as e:
        raise HTTPException(400, str(e)) from e

    register_buffers[payload.session_id] = []
    return {
        "message": f"Đã đăng ký {payload.name}",
        "employee_id": payload.employee_id,
    }


@app.post("/api/register/reset")
def register_reset(payload: FramePayload) -> dict[str, str]:
    if payload.session_id:
        register_buffers[payload.session_id] = []
    return {"message": "Đã xóa mẫu tạm"}


def _pick_port(start: int, tries: int = 10) -> int:
    import socket

    for port in range(start, start + tries):
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
            try:
                sock.bind((config.WEB_HOST, port))
                return port
            except OSError:
                continue
    raise RuntimeError(
        f"Ports {start}-{start + tries - 1} are in use. "
        "Close the other app.py window or run: netstat -ano | findstr :8000"
    )


def main() -> None:
    port = _pick_port(config.WEB_PORT)
    url = f"http://127.0.0.1:{port}"
    if port != config.WEB_PORT:
        print(f"Port {config.WEB_PORT} busy -> {url}")
    else:
        print("=" * 50)
        print("  MO TRINH DUYET (KHONG dung 0.0.0.0):")
        print(f"  {url}")
        print(f"  http://localhost:{port}")
        print("=" * 50)
    uvicorn.run(
        "app:app",
        host=config.WEB_HOST,
        port=port,
        reload=False,
    )


if __name__ == "__main__":
    main()
