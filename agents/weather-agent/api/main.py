#!/usr/bin/env python3
"""Loopback-only FastAPI service for the Diary weather agent."""

from __future__ import annotations

import sys
from pathlib import Path

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field

AGENT_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(AGENT_DIR))
from agent_env import load_agent_environment
from weather_core import WeatherAgentError, get_weather_summary

load_agent_environment()

app = FastAPI(title="Diary Weather Agent")


class WeatherRequest(BaseModel):
    place: str = Field(min_length=1, max_length=200)
    date: str


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/weather/summary")
async def weather_summary(request: WeatherRequest) -> dict[str, str]:
    try:
        return get_weather_summary(request.place, request.date)
    except WeatherAgentError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="127.0.0.1", port=8002)
