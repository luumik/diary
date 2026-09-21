#!/usr/bin/env python3
"""Small Flask UI for trying the weather agent independently."""

from __future__ import annotations

import sys
from datetime import date
from pathlib import Path

from flask import Flask, render_template, request

AGENT_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(AGENT_DIR))
from weather_core import WeatherAgentError, get_weather_summary

app = Flask(__name__)


@app.route("/", methods=["GET", "POST"])
def home():
    result = None
    error = None
    place = request.form.get("place", "")
    date_str = request.form.get("date", date.today().isoformat())
    if request.method == "POST":
        try:
            result = get_weather_summary(place, date_str)
        except WeatherAgentError as exc:
            error = str(exc)
    return render_template("home.html", result=result, error=error, place=place, date=date_str)


if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5002)
