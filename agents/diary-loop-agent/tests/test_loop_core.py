from __future__ import annotations

import sys
from pathlib import Path
from subprocess import CompletedProcess

AGENT_DIRECTORY = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(AGENT_DIRECTORY))

from loop_core import StateStore, fetch_weather_summary, run_weather_loop


def test_fetch_weather_summary_posts_requested_place_and_date():
    import json

    class Response:
        def __enter__(self): return self
        def __exit__(self, *_args): return None
        def read(self):
            return json.dumps({"location": "Tampere, Suomi", "date": "2024-06-02", "summary": "Pilvistä.", "source": "Open-Meteo"})

    captured = {}
    def opener(request, **_kwargs):
        captured["body"] = request.data
        return Response()

    result = fetch_weather_summary("Tampere", "2024-06-02", 5, opener)
    assert result["location"] == "Tampere, Suomi"
    assert json.loads(captured["body"]) == {"place": "Tampere", "date": "2024-06-02"}


def test_successful_weather_check_writes_state_atomically(tmp_path: Path):
    store = StateStore(tmp_path / "state.json")
    state = run_weather_loop(
        store,
        max_iterations=2,
        timeout_seconds=60,
        command_runner=lambda command, **_kwargs: CompletedProcess(command, 0, "", ""),
        weather_fetcher=lambda _timeout: {
            "location": "Helsinki, Suomi",
            "date": "2024-06-01",
            "summary": "Päivä oli aurinkoinen.",
            "source": "Open-Meteo",
        },
    )
    assert state.loop_number == 1
    assert state.selected_task == "weather-agent"
    assert state.stop_reason == "weather_verified"
    assert store.load().stop_reason == "weather_verified"
    assert not list(tmp_path.glob("*.tmp"))


def test_stops_after_two_consecutive_verification_errors(tmp_path: Path):
    def failed_command(command, **_kwargs):
        return CompletedProcess(command, 1, "", "")

    state = run_weather_loop(
        StateStore(tmp_path / "state.json"),
        max_iterations=2,
        timeout_seconds=60,
        command_runner=failed_command,
    )
    assert state.loop_number == 2
    assert state.last_error == "test_failure"
    assert state.consecutive_errors == 2
    assert state.stop_reason == "two_consecutive_errors"
