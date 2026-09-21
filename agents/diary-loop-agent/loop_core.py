"""Weather-agent verification guardrails and local state for the Diary CLI."""

from __future__ import annotations

import json
import os
import subprocess
import sys
import tempfile
from collections.abc import Mapping
from dataclasses import asdict, dataclass, field
from datetime import datetime, timezone
from pathlib import Path
from time import monotonic
from typing import Callable, Literal
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

ErrorKind = Literal["test_failure", "service_start_failure", "browser_unavailable", "timeout"]
@dataclass(frozen=True)
class CheckResult:
    command: tuple[str, ...]
    passed: bool
    duration_seconds: float


@dataclass
class LoopState:
    loop_number: int = 0
    iteration_started_at: str | None = None
    iteration_finished_at: str | None = None
    selected_task: str | None = None
    checks: list[dict[str, object]] = field(default_factory=list)
    last_error: ErrorKind | None = None
    consecutive_errors: int = 0
    stop_reason: str | None = None


class StateStore:
    def __init__(self, path: Path) -> None:
        self.path = path

    def load(self) -> LoopState:
        if not self.path.exists():
            return LoopState()
        raw = json.loads(self.path.read_text(encoding="utf-8"))
        if not isinstance(raw, dict):
            raise ValueError("Loop state must be a JSON object.")
        return LoopState(
            loop_number=_as_nonnegative_int(raw.get("loop_number"), "loop_number"),
            iteration_started_at=_as_optional_string(raw.get("iteration_started_at"), "iteration_started_at"),
            iteration_finished_at=_as_optional_string(raw.get("iteration_finished_at"), "iteration_finished_at"),
            selected_task=_as_optional_string(raw.get("selected_task"), "selected_task"),
            checks=_as_check_list(raw.get("checks")),
            last_error=_as_error_kind(raw.get("last_error")),
            consecutive_errors=_as_nonnegative_int(raw.get("consecutive_errors"), "consecutive_errors"),
            stop_reason=_as_optional_string(raw.get("stop_reason"), "stop_reason"),
        )

    def save(self, state: LoopState) -> None:
        self.path.parent.mkdir(parents=True, exist_ok=True)
        descriptor, temporary_name = tempfile.mkstemp(prefix=f".{self.path.name}.", suffix=".tmp", dir=self.path.parent)
        try:
            with os.fdopen(descriptor, "w", encoding="utf-8") as temporary_file:
                json.dump(asdict(state), temporary_file, ensure_ascii=False, indent=2)
                temporary_file.write("\n")
                temporary_file.flush()
                os.fsync(temporary_file.fileno())
            os.replace(temporary_name, self.path)
        finally:
            if os.path.exists(temporary_name):
                os.unlink(temporary_name)


def fetch_weather_summary(place: str, date: str, timeout_seconds: float, opener: Callable[..., object] = urlopen) -> dict[str, str]:
    payload = json.dumps({"place": place, "date": date}).encode("utf-8")
    request = Request(
        "http://127.0.0.1:8002/weather/summary",
        data=payload,
        method="POST",
        headers={"content-type": "application/json"},
    )
    try:
        with opener(request, timeout=min(timeout_seconds, 15)) as response:
            value: object = json.load(response)
    except (HTTPError, URLError, TimeoutError, json.JSONDecodeError) as error:
        raise RuntimeError("Weather service is unavailable.") from error
    if not isinstance(value, Mapping):
        raise RuntimeError("Weather service returned an invalid response.")
    required = ("location", "date", "summary", "source")
    if not all(isinstance(value.get(key), str) for key in required) or value.get("source") != "Open-Meteo":
        raise RuntimeError("Weather service returned an invalid response.")
    return {key: value[key] for key in required if isinstance(value[key], str)}


def fetch_live_weather(timeout_seconds: float) -> dict[str, str]:
    return fetch_weather_summary("Helsinki", "2024-06-01", timeout_seconds)


def run_weather_checks(
    deadline: float,
    command_runner: Callable[..., subprocess.CompletedProcess[str]] = subprocess.run,
    weather_fetcher: Callable[[float], dict[str, str]] = fetch_live_weather,
) -> tuple[list[CheckResult], ErrorKind | None]:
    seconds_remaining = deadline - monotonic()
    if seconds_remaining <= 0:
        return [], "timeout"
    command = (sys.executable, "-m", "pytest", "agents/weather-agent/tests", "-q")
    started = monotonic()
    try:
        completed = command_runner(command, check=False, capture_output=True, text=True, timeout=seconds_remaining)
    except subprocess.TimeoutExpired:
        return [], "timeout"
    checks = [CheckResult(("weather-agent", "tests"), completed.returncode == 0, monotonic() - started)]
    if completed.returncode != 0:
        return checks, "test_failure"
    seconds_remaining = deadline - monotonic()
    if seconds_remaining <= 0:
        return checks, "timeout"
    started = monotonic()
    try:
        weather_fetcher(seconds_remaining)
    except RuntimeError:
        checks.append(CheckResult(("weather-agent", "live-summary"), False, monotonic() - started))
        return checks, "service_start_failure"
    checks.append(CheckResult(("weather-agent", "live-summary"), True, monotonic() - started))
    return checks, None


def run_weather_loop(
    store: StateStore,
    *,
    max_iterations: int = 2,
    timeout_seconds: int = 900,
    command_runner: Callable[..., subprocess.CompletedProcess[str]] = subprocess.run,
    weather_fetcher: Callable[[float], dict[str, str]] = fetch_live_weather,
) -> LoopState:
    if not 1 <= max_iterations <= 2:
        raise ValueError("max_iterations must be between 1 and 2.")
    if not 1 <= timeout_seconds <= 900:
        raise ValueError("timeout_seconds must be between 1 and 900.")
    state = store.load()
    for _ in range(max_iterations):
        state.loop_number += 1
        state.iteration_started_at = _timestamp()
        state.iteration_finished_at = None
        state.selected_task = "weather-agent"
        state.checks = []
        state.last_error = None
        state.stop_reason = None
        store.save(state)
        checks, error = run_weather_checks(monotonic() + timeout_seconds, command_runner, weather_fetcher)
        state.checks = [
            {"command": list(check.command), "passed": check.passed, "duration_seconds": round(check.duration_seconds, 3)}
            for check in checks
        ]
        state.iteration_finished_at = _timestamp()
        state.last_error = error
        if error is None:
            state.consecutive_errors = 0
            state.stop_reason = "weather_verified"
            store.save(state)
            return state
        state.consecutive_errors += 1
        state.stop_reason = "two_consecutive_errors" if state.consecutive_errors >= 2 else "iteration_error"
        store.save(state)
        if state.consecutive_errors >= 2:
            return state
    state.stop_reason = "iteration_limit_reached"
    store.save(state)
    return state


def _timestamp() -> str:
    return datetime.now(timezone.utc).isoformat()


def _as_optional_string(value: object, field_name: str) -> str | None:
    if value is None or isinstance(value, str):
        return value
    raise ValueError(f"{field_name} must be a string or null.")


def _as_nonnegative_int(value: object, field_name: str) -> int:
    if isinstance(value, int) and value >= 0:
        return value
    raise ValueError(f"{field_name} must be a non-negative integer.")


def _as_error_kind(value: object) -> ErrorKind | None:
    if value is None:
        return None
    if value in {"test_failure", "service_start_failure", "browser_unavailable", "timeout"}:
        return value
    raise ValueError("last_error has an unsupported value.")


def _as_check_list(value: object) -> list[dict[str, object]]:
    if value is None:
        return []
    if not isinstance(value, list) or not all(isinstance(item, dict) for item in value):
        raise ValueError("checks must be a list of objects.")
    return list(value)
