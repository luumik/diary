#!/usr/bin/env python3
"""Safe CLI verifier for the Diary weather agent."""

from __future__ import annotations

import argparse
import json
import os
import sys
from pathlib import Path

from loop_core import StateStore, fetch_weather_summary, run_weather_loop

AGENT_DIRECTORY = Path(__file__).resolve().parent
PROJECT_ROOT = AGENT_DIRECTORY.parent.parent
DEFAULT_STATE_PATH = AGENT_DIRECTORY / "memory" / "data" / "loop_state.json"


def parse_arguments() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Verify the local Diary weather agent safely.")
    parser.add_argument("command", nargs="?", choices=("verify", "lookup", "status"), default="verify")
    parser.add_argument("--verify", action="store_true", help="Compatibility alias for the default verify command.")
    parser.add_argument("--max-iterations", type=int, default=2, help="One or two iterations; default: 2.")
    parser.add_argument("--timeout-minutes", type=int, default=15, help="One to fifteen minutes per iteration; default: 15.")
    parser.add_argument("--state-file", type=Path, default=DEFAULT_STATE_PATH, help="Local JSON state path.")
    parser.add_argument("--chat", action="store_true", help="Read one run or status command interactively.")
    parser.add_argument("--place", help="Place for the lookup command.")
    parser.add_argument("--date", help="ISO date (YYYY-MM-DD) for the lookup command.")
    return parser.parse_args()


def main() -> int:
    arguments = parse_arguments()
    os.chdir(PROJECT_ROOT)
    command = _chat_command() if arguments.chat else arguments.command
    store = StateStore(arguments.state_file)
    if command == "status":
        print(json.dumps(store.load().__dict__, ensure_ascii=False, indent=2))
        return 0
    if command == "lookup":
        if not arguments.place or not arguments.date:
            raise ValueError("lookup requires --place and --date.")
        result = fetch_weather_summary(arguments.place, arguments.date, min(arguments.timeout_minutes * 60, 15))
        print(json.dumps(result, ensure_ascii=False, indent=2))
        return 0

    state = run_weather_loop(
        store,
        max_iterations=arguments.max_iterations,
        timeout_seconds=arguments.timeout_minutes * 60,
    )
    print(json.dumps(state.__dict__, ensure_ascii=False, indent=2))
    return 0 if state.stop_reason == "weather_verified" else 1


def _chat_command() -> str:
    command = input("Command [verify/lookup/status]: ").strip().lower() or "verify"
    if command not in {"verify", "lookup", "status"}:
        raise ValueError("Command must be verify, lookup or status.")
    return command


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except (OSError, ValueError) as error:
        print(f"Loop agent failed safely: {error}", file=sys.stderr)
        raise SystemExit(1)
