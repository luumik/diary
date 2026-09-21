#!/usr/bin/env python3
"""Diary Weather Agent CLI. Works without a language model or API key."""

from __future__ import annotations

import argparse
import json
import subprocess
import sys
from datetime import date
from pathlib import Path
from typing import Any, Dict, List

AGENT_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(AGENT_DIR))
sys.path.insert(0, str(AGENT_DIR / "memory"))
from agent_env import load_agent_environment
from memory import MemoryStore

load_agent_environment()


def load_skills() -> Dict[str, str]:
    return {path.stem: path.read_text(encoding="utf-8") for path in sorted((AGENT_DIR / "skills").glob("*.md"))}


def run_subagent(place: str, date_str: str) -> Dict[str, Any]:
    result = subprocess.run(
        [sys.executable, str(AGENT_DIR / "subagents" / "weather_reporter.py"), "--place", place, "--date", date_str],
        text=True, capture_output=True, cwd=str(AGENT_DIR), timeout=30,
    )
    if result.returncode != 0:
        try:
            return json.loads(result.stdout)
        except json.JSONDecodeError:
            return {"status": "error", "error": "Säähaku epäonnistui."}
    return json.loads(result.stdout)


def run_once(place: str, date_str: str, raw_json: bool) -> int:
    load_skills()
    result = run_subagent(place, date_str)
    if result.get("status") == "success":
        data = result["data"]
        MemoryStore().remember(data)
        print(json.dumps(result, ensure_ascii=False, indent=2) if raw_json else data["summary"])
        return 0
    print(json.dumps(result, ensure_ascii=False) if raw_json else result.get("error", "Säähaku epäonnistui."))
    return 1


def main() -> None:
    parser = argparse.ArgumentParser(description="Diary Weather Agent")
    parser.add_argument("query", nargs="?", help="Paikkakunta (vaihtoehto --place-valinnalle)")
    parser.add_argument("--place", help="Haettava paikkakunta")
    parser.add_argument("--date", default=date.today().isoformat(), help="Päivämäärä VVVV-KK-PP")
    parser.add_argument("--chat", action="store_true", help="Vuorovaikutteinen tila")
    parser.add_argument("--json", action="store_true", help="Tulosta JSON")
    args = parser.parse_args()
    if args.chat:
        print("Sääagentti. Kirjoita paikkakunta tai 'exit'.")
        while True:
            try:
                place = input("paikkakunta> ").strip()
            except (EOFError, KeyboardInterrupt):
                print()
                return
            if place.lower() in {"exit", "quit"}:
                return
            date_str = input(f"päivä [{args.date}]> ").strip() or args.date
            run_once(place, date_str, args.json)
    else:
        place = args.place or args.query
        if not place:
            parser.error("anna paikkakunta --place-valinnalla tai argumenttina")
        sys.exit(run_once(place, args.date, args.json))


if __name__ == "__main__":
    main()
