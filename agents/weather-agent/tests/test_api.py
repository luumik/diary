from __future__ import annotations

import sys
from pathlib import Path
from unittest.mock import patch

from fastapi.testclient import TestClient

AGENT_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(AGENT_DIR / "api"))
from main import app

client = TestClient(app)


def test_health():
    assert client.get("/health").json() == {"status": "ok"}


def test_weather_summary_contract():
    value = {"location": "Helsinki, Suomi", "date": "2024-06-01", "summary": "Päivä oli aurinkoinen.", "source": "Open-Meteo"}
    with patch("main.get_weather_summary", return_value=value):
        response = client.post("/weather/summary", json={"place": "Helsinki", "date": "2024-06-01"})
    assert response.status_code == 200
    assert response.json() == value


def test_rejects_empty_place():
    assert client.post("/weather/summary", json={"place": "", "date": "2024-06-01"}).status_code == 422
