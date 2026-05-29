"""Lưu embedding nhân viên + log chấm công."""

from __future__ import annotations

import json
from datetime import datetime
from pathlib import Path
from typing import Any

import numpy as np

import config
from .engine import FaceEngine


class EmployeeDatabase:
    def __init__(self, path: Path | None = None) -> None:
        self.path = path or config.EMPLOYEES_FILE
        self.path.parent.mkdir(parents=True, exist_ok=True)
        self._data: dict[str, Any] = self._load()

    def _load(self) -> dict:
        if not self.path.exists():
            return {"employees": {}}
        with open(self.path, encoding="utf-8") as f:
            return json.load(f)

    def save(self) -> None:
        with open(self.path, encoding="utf-8", mode="w") as f:
            json.dump(self._data, f, ensure_ascii=False, indent=2)

    def list_employees(self) -> list[str]:
        return list(self._data.get("employees", {}).keys())

    def get_embedding(self, employee_id: str) -> np.ndarray | None:
        rec = self._data.get("employees", {}).get(employee_id)
        if not rec:
            return None
        emb = np.array(rec["embedding"], dtype=np.float32)
        norm = np.linalg.norm(emb)
        return emb / norm if norm > 1e-6 else None

    def register(
        self,
        employee_id: str,
        name: str,
        sample_embeddings: list[np.ndarray],
    ) -> None:
        if len(sample_embeddings) < config.REGISTER_MIN_SAMPLES:
            raise ValueError(
                f"Cần ít nhất {config.REGISTER_MIN_SAMPLES} mẫu, "
                f"hiện có {len(sample_embeddings)}"
            )
        stacked = np.stack(sample_embeddings, axis=0)
        mean_emb = stacked.mean(axis=0)
        mean_emb /= np.linalg.norm(mean_emb) + 1e-8

        self._data.setdefault("employees", {})[employee_id] = {
            "name": name,
            "embedding": mean_emb.tolist(),
            "sample_count": len(sample_embeddings),
            "registered_at": datetime.now().isoformat(timespec="seconds"),
        }
        self.save()

    def match(
        self,
        query: np.ndarray,
        threshold: float | None = None,
    ) -> tuple[str | None, str | None, float]:
        """So khớp embedding với DB. Trả (employee_id, name, score)."""
        threshold = threshold if threshold is not None else config.SIMILARITY_THRESHOLD
        best_id, best_name, best_score = None, None, -1.0

        for emp_id, rec in self._data.get("employees", {}).items():
            db_emb = np.array(rec["embedding"], dtype=np.float32)
            db_emb /= np.linalg.norm(db_emb) + 1e-8
            score = FaceEngine.cosine_similarity(query, db_emb)
            if score > best_score:
                best_score = score
                best_id = emp_id
                best_name = rec.get("name", emp_id)

        if best_score < threshold:
            return None, None, best_score
        return best_id, best_name, best_score


class AttendanceLog:
    def __init__(self, path: Path | None = None) -> None:
        self.path = path or config.ATTENDANCE_FILE
        self.path.parent.mkdir(parents=True, exist_ok=True)
        self._records: list[dict] = self._load()

    def _load(self) -> list:
        if not self.path.exists():
            return []
        with open(self.path, encoding="utf-8") as f:
            data = json.load(f)
        return data if isinstance(data, list) else data.get("records", [])

    def append(self, employee_id: str, name: str, score: float) -> dict:
        record = {
            "employee_id": employee_id,
            "name": name,
            "score": round(score, 4),
            "time": datetime.now().isoformat(timespec="seconds"),
        }
        self._records.append(record)
        with open(self.path, encoding="utf-8", mode="w") as f:
            json.dump(self._records, f, ensure_ascii=False, indent=2)
        return record

    def recent(self, limit: int = 20) -> list[dict]:
        return self._records[-limit:]
