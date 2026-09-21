"""Minimal local memory for the latest weather lookup."""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any, Dict, Optional


class MemoryStore:
    def __init__(self, path: Optional[Path] = None) -> None:
        self.path = path or Path(__file__).resolve().parent / "data" / "latest.json"

    def remember(self, result: Dict[str, Any]) -> None:
        self.path.parent.mkdir(parents=True, exist_ok=True)
        self.path.write_text(json.dumps(result, ensure_ascii=False, indent=2), encoding="utf-8")

    def latest(self) -> Optional[Dict[str, Any]]:
        if not self.path.exists():
            return None
        value = json.loads(self.path.read_text(encoding="utf-8"))
        return value if isinstance(value, dict) else None
