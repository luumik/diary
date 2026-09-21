#!/usr/bin/env python3
"""Standalone JSON tool for fetching a daily weather summary."""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

AGENT_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(AGENT_DIR))
from weather_core import WeatherAgentError, get_weather_summary


def main() -> None:
    parser = argparse.ArgumentParser(description="Fetch weather from Open-Meteo")
    parser.add_argument("--place", required=True)
    parser.add_argument("--date", required=True)
    args = parser.parse_args()
    try:
        print(json.dumps({"status": "success", "data": get_weather_summary(args.place, args.date)}, ensure_ascii=False))
    except WeatherAgentError as exc:
        print(json.dumps({"status": "error", "error": str(exc)}, ensure_ascii=False))
        sys.exit(1)


if __name__ == "__main__":
    main()
