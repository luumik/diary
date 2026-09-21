"""Load optional agent settings from .env files without overwriting process values."""

from __future__ import annotations

import os
from pathlib import Path


def load_agent_environment() -> None:
    agent_dir = Path(__file__).resolve().parent
    for directory in (agent_dir.parent.parent, agent_dir):
        for name in (".env", ".env.local"):
            path = directory / name
            if not path.is_file():
                continue
            for raw_line in path.read_text(encoding="utf-8").splitlines():
                line = raw_line.strip()
                if not line or line.startswith("#") or "=" not in line:
                    continue
                key, value = line.split("=", 1)
                os.environ.setdefault(key.strip(), value.strip().strip('"').strip("'"))
