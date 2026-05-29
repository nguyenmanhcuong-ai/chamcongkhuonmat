"""
Chấm công realtime: camera → detect → embedding → so khớp DB.

Production: tracking ~2.5s, nhiều frame, average embedding + voting.

Chạy:
  python checkin.py
"""

from __future__ import annotations

import sys
import time

import cv2

import config
from core import AttendanceTracker, EmployeeDatabase, FaceEngine
from core.database import AttendanceLog


def draw_status(frame, result: dict) -> None:
    status = result.get("status", "idle")
    h, w = frame.shape[:2]

    if status == "collecting":
        progress = result.get("progress", 0)
        bar_w = int(w * 0.6 * progress)
        cv2.rectangle(frame, (40, h - 40), (40 + int(w * 0.6), h - 20), (80, 80, 80), -1)
        cv2.rectangle(frame, (40, h - 40), (40 + bar_w, h - 20), (0, 200, 255), -1)
        msg = "Dang nhan dien... giu mat trong khung"
        color = (0, 200, 255)
    elif status == "matched":
        msg = f"CHAM CONG THANH CONG: {result['name']}"
        color = (0, 255, 0)
    elif status == "cooldown":
        msg = result.get("message", "Cooldown")
        color = (0, 255, 255)
    elif status == "unknown":
        msg = f"Khong nhan dien ({result.get('score', 0):.2f})"
        color = (0, 0, 255)
    else:
        msg = result.get("message", "Nhin vao camera")
        color = (200, 200, 200)

    cv2.putText(frame, msg, (10, 35), cv2.FONT_HERSHEY_SIMPLEX, 0.8, color, 2)

    bbox = result.get("bbox")
    if bbox:
        x1, y1, x2, y2 = bbox
        cv2.rectangle(frame, (x1, y1), (x2, y2), color, 2)


def main() -> int:
    db = EmployeeDatabase()
    employees = db.list_employees()
    if not employees:
        print("Chưa có nhân viên. Chạy register.py trước.")
        return 1

    print("Đang tải InsightFace...")
    engine = FaceEngine()
    tracker = AttendanceTracker(db, engine)
    log = AttendanceLog()

    print(f"Đã nạp {len(employees)} nhân viên: {', '.join(employees)}")
    print("Q: thoát\n")

    cap = cv2.VideoCapture(config.CAMERA_INDEX)
    if not cap.isOpened():
        print("Không mở được camera.")
        return 1

    window = "Cham cong khuon mat"
    last_result: dict = {"status": "idle", "message": "Nhin vao camera"}

    while True:
        ok, frame = cap.read()
        if not ok:
            break

        result = tracker.add_frame(frame)

        if result["status"] == "matched":
            rec = log.append(
                result["employee_id"],
                result["name"],
                result["score"],
            )
            print(f"[{rec['time']}] {rec['name']} | score={rec['score']}")
            last_result = result
            time.sleep(0.5)
        elif result["status"] in ("collecting", "unknown", "cooldown"):
            last_result = result
        elif result["status"] == "idle":
            if last_result.get("status") not in ("matched", "cooldown"):
                last_result = result

        display = frame.copy()
        draw_status(display, last_result)
        cv2.imshow(window, display)

        if (cv2.waitKey(1) & 0xFF) == ord("q"):
            break

    cap.release()
    cv2.destroyAllWindows()
    return 0


if __name__ == "__main__":
    sys.exit(main())
