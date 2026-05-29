"""
Demo nhỏ: cosine similarity giữa 2 embedding (giáo dục).

Chạy sau khi đã đăng ký ít nhất 1 nhân viên:
  python demo_compare.py
"""

import json
import sys

import numpy as np

import config
from core.engine import FaceEngine


def main() -> int:
    if not config.EMPLOYEES_FILE.exists():
        print("Chưa có file employees.json — chạy register.py trước.")
        return 1

    with open(config.EMPLOYEES_FILE, encoding="utf-8") as f:
        data = json.load(f)

    employees = data.get("employees", {})
    if len(employees) < 1:
        print("Database trống.")
        return 1

    ids = list(employees.keys())
    a = np.array(employees[ids[0]]["embedding"], dtype=np.float32)
    a /= np.linalg.norm(a)

    print("=== Cosine similarity (embedding đã chuẩn hóa) ===\n")
    print(f"Nhân viên gốc: {ids[0]} — {employees[ids[0]]['name']}\n")

    for emp_id, rec in employees.items():
        b = np.array(rec["embedding"], dtype=np.float32)
        b /= np.linalg.norm(b)
        sim = FaceEngine.cosine_similarity(a, b)
        same = " <-- CÙNG NGƯỜI" if emp_id == ids[0] else ""
        print(f"  vs {emp_id} ({rec['name']}): {sim:.4f}{same}")

    if len(ids) >= 2:
        b = np.array(employees[ids[1]]["embedding"], dtype=np.float32)
        b /= np.linalg.norm(b)
        cross = FaceEngine.cosine_similarity(a, b)
        print(f"\nHai người khác nhau thường có similarity thấp hơn ngưỡng "
              f"{config.SIMILARITY_THRESHOLD}: {cross:.4f}")

    return 0


if __name__ == "__main__":
    sys.exit(main())
