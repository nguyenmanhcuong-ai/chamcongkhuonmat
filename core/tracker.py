"""Tracking 2–3 giây: gom nhiều frame, average embedding, voting."""

from __future__ import annotations

import time
from collections import Counter

import numpy as np

import config
from .database import EmployeeDatabase
from .engine import FaceEngine


class AttendanceTracker:
    """
    Một phiên nhận diện khi có mặt trong khung hình.
    Sau TRACK_SECONDS + đủ frame → quyết định bằng avg embedding + vote.
    """

    def __init__(self, db: EmployeeDatabase, engine: FaceEngine) -> None:
        self.db = db
        self.engine = engine
        self.embeddings: list[np.ndarray] = []
        self.votes: list[str] = []
        self.scores: list[float] = []
        self.started_at: float | None = None
        self._cooldown: dict[str, float] = {}

    def reset(self) -> None:
        self.embeddings.clear()
        self.votes.clear()
        self.scores.clear()
        self.started_at = None

    def in_cooldown(self, employee_id: str) -> bool:
        last = self._cooldown.get(employee_id)
        if last is None:
            return False
        return (time.time() - last) < config.COOLDOWN_SECONDS

    def _set_cooldown(self, employee_id: str) -> None:
        self._cooldown[employee_id] = time.time()

    def add_frame(self, image_bgr) -> dict:
        """
        Xử lý 1 frame. Trả dict trạng thái UI:
        status: idle | collecting | matched | unknown | cooldown
        """
        face = self.engine.largest_face(image_bgr)
        if face is None:
            self.reset()
            return {"status": "idle", "message": "Không thấy mặt"}

        emb = self.engine.embedding(face)
        if emb is None:
            return {"status": "idle", "message": "Không đọc được embedding"}

        if self.started_at is None:
            self.started_at = time.time()

        emp_id, name, score = self.db.match(emb)
        self.embeddings.append(emb)
        if emp_id:
            self.votes.append(emp_id)
        self.scores.append(score)

        elapsed = time.time() - self.started_at
        n = len(self.embeddings)
        progress = min(1.0, elapsed / config.MAX_CHECKIN_SECONDS)

        enough_frames = n >= config.MIN_FRAMES_FOR_DECISION
        enough_time = elapsed >= config.TRACK_SECONDS
        hit_cap = elapsed >= config.MAX_CHECKIN_SECONDS and n >= 1

        if not ((enough_frames and enough_time) or hit_cap):
            return {
                "status": "collecting",
                "progress": progress,
                "bbox": face.bbox.astype(int).tolist(),
            }

        return self._finalize()

    def _finalize(self) -> dict:
        stacked = np.stack(self.embeddings, axis=0)
        avg_emb = stacked.mean(axis=0)
        avg_emb /= np.linalg.norm(avg_emb) + 1e-8

        emp_id, name, score = self.db.match(avg_emb)

        if emp_id and self.votes:
            vote_counts = Counter(self.votes)
            voted_id, vote_n = vote_counts.most_common(1)[0]
            if voted_id != emp_id and vote_n >= len(self.votes) // 2 + 1:
                rec = self.db._data["employees"].get(voted_id, {})
                emp_id = voted_id
                name = rec.get("name", voted_id)

        self.reset()

        if not emp_id:
            return {
                "status": "unknown",
                "message": "Không khớp nhân viên",
                "score": score,
            }

        if self.in_cooldown(emp_id):
            last = self._cooldown[emp_id]
            remaining = max(1, int(config.COOLDOWN_SECONDS - (time.time() - last) + 0.5))
            return {
                "status": "cooldown",
                "employee_id": emp_id,
                "name": name,
                "cooldown_remaining": remaining,
                "message": f"Đã chấm công. Chấm lại sau {remaining} giây",
            }

        self._set_cooldown(emp_id)
        return {
            "status": "matched",
            "employee_id": emp_id,
            "name": name,
            "score": score,
        }
