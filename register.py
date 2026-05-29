"""
Đăng ký nhân viên: chụp 5–10 ảnh → SCRFD + ArcFace → lưu embedding DB.

Chạy:
  python register.py --id NV001 --name "Nguyễn Văn A"
"""

from __future__ import annotations

import argparse
import sys

import cv2
import numpy as np

import config
from core import EmployeeDatabase, FaceEngine


def draw_info(frame, lines: list[str]) -> None:
    y = 30
    for line in lines:
        cv2.putText(
            frame, line, (10, y),
            cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 0), 2,
        )
        y += 28


def main() -> int:
    parser = argparse.ArgumentParser(description="Đăng ký khuôn mặt nhân viên")
    parser.add_argument("--id", required=True, help="Mã nhân viên, VD: NV001")
    parser.add_argument("--name", required=True, help="Họ tên")
    parser.add_argument("--camera", type=int, default=config.CAMERA_INDEX)
    args = parser.parse_args()

    print("Đang tải InsightFace (SCRFD + ArcFace)...")
    engine = FaceEngine()
    db = EmployeeDatabase()

    cap = cv2.VideoCapture(args.camera)
    if not cap.isOpened():
        print("Không mở được camera.")
        return 1

    samples: list[np.ndarray] = []
    window = "Dang ky nhan vien - SPACE chup, S luu, Q thoat"

    print(f"\nĐăng ký: {args.id} - {args.name}")
    print(f"Chup {config.REGISTER_MIN_SAMPLES}-{config.REGISTER_MAX_SAMPLES} anh.")
    print("SPACE: chụp mẫu | S: lưu | Q: thoát\n")

    while True:
        ok, frame = cap.read()
        if not ok:
            break

        face = engine.largest_face(frame)
        lines = [
            f"{args.id} | {args.name}",
            f"Mau: {len(samples)}/{config.REGISTER_MAX_SAMPLES}",
            "SPACE: chup | S: luu | Q: thoat",
        ]

        if face is not None:
            x1, y1, x2, y2 = face.bbox.astype(int)
            cv2.rectangle(frame, (x1, y1), (x2, y2), (0, 255, 0), 2)
            for x, y in face.kps.astype(int):
                cv2.circle(frame, (x, y), 2, (0, 0, 255), -1)
            lines.append("Mat hop le")
        else:
            lines.append("Dua mat vao khung hinh")

        draw_info(frame, lines)
        cv2.imshow(window, frame)
        key = cv2.waitKey(1) & 0xFF

        if key == ord("q"):
            break
        if key == ord(" ") and face is not None:
            emb = engine.embedding(face)
            if emb is not None and len(samples) < config.REGISTER_MAX_SAMPLES:
                samples.append(emb)
                print(f"  Da chup mau {len(samples)}")
        if key == ord("s"):
            if len(samples) < config.REGISTER_MIN_SAMPLES:
                print(f"  Can them mau ({len(samples)}/{config.REGISTER_MIN_SAMPLES})")
                continue
            db.register(args.id, args.name, samples)
            print(f"  Da luu {args.name} vao database.")
            break

    cap.release()
    cv2.destroyAllWindows()
    return 0


if __name__ == "__main__":
    sys.exit(main())
