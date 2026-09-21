#!/usr/bin/env python3
"""Deterministic weather lookup and Finnish daily-summary rules."""

from __future__ import annotations

import json
from datetime import date
from typing import Any, Callable, Dict, List
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode
from urllib.request import Request, urlopen

GEOCODING_URL = "https://geocoding-api.open-meteo.com/v1/search"
ARCHIVE_URL = "https://archive-api.open-meteo.com/v1/archive"
SOURCE_NAME = "Open-Meteo"
HttpGet = Callable[[str], Dict[str, Any]]


class WeatherAgentError(Exception):
    """A safe error that may be shown to the user."""


def _http_get_json(url: str) -> Dict[str, Any]:
    request = Request(url, headers={"User-Agent": "Diary weather agent/1.0"})
    try:
        with urlopen(request, timeout=15) as response:
            payload: Any = json.load(response)
    except (HTTPError, URLError, TimeoutError, json.JSONDecodeError) as exc:
        raise WeatherAgentError("Sääpalveluun ei saatu yhteyttä.") from exc
    if not isinstance(payload, dict):
        raise WeatherAgentError("Sääpalvelu palautti virheellisen vastauksen.")
    return payload


def validate_date(value: str) -> str:
    try:
        parsed = date.fromisoformat(value)
    except ValueError as exc:
        raise WeatherAgentError("Päivämäärän pitää olla muodossa VVVV-KK-PP.") from exc
    if parsed > date.today():
        raise WeatherAgentError("Historiallista säätä ei voi hakea tulevalle päivälle.")
    return parsed.isoformat()


def geocode_place(place: str, http_get: HttpGet = _http_get_json) -> Dict[str, Any]:
    normalized = place.strip()
    if not normalized:
        raise WeatherAgentError("Anna paikkakunta.")
    url = f"{GEOCODING_URL}?{urlencode({'name': normalized, 'count': 1, 'language': 'fi', 'format': 'json'})}"
    payload = http_get(url)
    results = payload.get("results")
    if not isinstance(results, list) or not results or not isinstance(results[0], dict):
        raise WeatherAgentError("Paikkakuntaa ei löytynyt.")
    result = results[0]
    latitude = result.get("latitude")
    longitude = result.get("longitude")
    name = result.get("name")
    country = result.get("country")
    if not isinstance(latitude, (int, float)) or not isinstance(longitude, (int, float)) or not isinstance(name, str):
        raise WeatherAgentError("Paikkakunnan tiedot olivat puutteelliset.")
    display_name = f"{name}, {country}" if isinstance(country, str) and country else name
    return {"latitude": float(latitude), "longitude": float(longitude), "name": display_name}


def fetch_daily_weather(latitude: float, longitude: float, date_str: str, http_get: HttpGet = _http_get_json) -> Dict[str, Any]:
    validated_date = validate_date(date_str)
    variables = ",".join([
        "weather_code", "temperature_2m_max", "temperature_2m_min",
        "precipitation_sum", "rain_sum", "snowfall_sum",
        "wind_speed_10m_max", "wind_gusts_10m_max", "sunshine_duration",
    ])
    url = f"{ARCHIVE_URL}?{urlencode({'latitude': latitude, 'longitude': longitude, 'start_date': validated_date, 'end_date': validated_date, 'daily': variables, 'timezone': 'auto'})}"
    payload = http_get(url)
    daily = payload.get("daily")
    if not isinstance(daily, dict):
        raise WeatherAgentError("Säätietoja ei löytynyt valitulle päivälle.")
    result: Dict[str, Any] = {}
    for key in variables.split(","):
        values = daily.get(key)
        if not isinstance(values, list) or not values or not isinstance(values[0], (int, float)):
            raise WeatherAgentError("Säätiedot olivat puutteelliset.")
        result[key] = values[0]
    return result


def _condition_phrases(code: int, precipitation: float, rain: float, snowfall: float) -> List[str]:
    if code == 0:
        phrases = ["kirkas ja aurinkoinen"]
    elif code == 1:
        phrases = ["enimmäkseen aurinkoinen"]
    elif code == 2:
        phrases = ["puolipilvinen"]
    elif code == 3:
        phrases = ["pilvinen"]
    elif code in (45, 48):
        phrases = ["sumuinen"]
    elif code in (51, 53, 55):
        phrases = ["pilvinen ja tihkusateinen"]
    elif code in (56, 57):
        phrases = ["pilvinen ja jäätävän tihkusateinen"]
    elif code in (61, 63, 65):
        phrases = ["pilvinen ja sateinen"]
    elif code in (66, 67):
        phrases = ["pilvinen ja jäätävän sateinen"]
    elif code in (71, 73, 75, 77):
        phrases = ["pilvinen ja lumisateinen"]
    elif code in (80, 81, 82):
        phrases = ["vaihteleva ja sadekuuroinen"]
    elif code in (85, 86):
        phrases = ["vaihteleva ja lumikuuroinen"]
    elif code in (95, 96, 99):
        phrases = ["ukkoskuuroinen"]
        if code in (96, 99):
            phrases.append("raekuuroja esiintyi")
    else:
        phrases = ["vaihteleva"]

    if snowfall > 0 and not any("lumi" in phrase for phrase in phrases):
        phrases.append("päivän aikana satoi lunta")
    elif rain > 0 and not any("sat" in phrase or "kuuro" in phrase for phrase in phrases):
        phrases.append("päivän aikana satoi vettä")
    elif precipitation > 0 and not any("sat" in phrase or "kuuro" in phrase for phrase in phrases):
        phrases.append("päivän aikana oli sadetta")
    return phrases


def describe_weather(weather: Dict[str, Any]) -> str:
    """Turn one Open-Meteo daily record into a deterministic Finnish description."""
    code = int(weather["weather_code"])
    maximum = float(weather["temperature_2m_max"])
    minimum = float(weather["temperature_2m_min"])
    precipitation = float(weather["precipitation_sum"])
    rain = float(weather["rain_sum"])
    snowfall = float(weather["snowfall_sum"])
    wind = float(weather["wind_speed_10m_max"])
    gusts = float(weather["wind_gusts_10m_max"])
    sunshine_hours = float(weather["sunshine_duration"]) / 3600

    phrases = _condition_phrases(code, precipitation, rain, snowfall)
    if sunshine_hours >= 8 and code == 2:
        phrases.append("aurinko paistoi suuren osan päivästä")
    if wind >= 89:
        phrases.append("päivä oli myrskyinen")
    elif wind >= 50 or gusts >= 60:
        phrases.append("päivä oli hyvin tuulinen")
    elif wind >= 29 or gusts >= 40:
        phrases.append("päivä oli tuulinen")

    if maximum >= 30:
        temperature = f"Päivä oli erittäin kuuma, ja lämpötila nousi {maximum:.0f} asteeseen."
    elif maximum >= 25:
        temperature = f"Helleraja ylittyi lämpötilan noustessa {maximum:.0f} asteeseen."
    elif minimum <= -20:
        temperature = f"Aamulla tai yöllä oli kireää pakkasta, alimmillaan {minimum:.0f} astetta."
    elif maximum < 0:
        temperature = f"Päivä oli pakkaspäivä; lämpötila vaihteli {minimum:.0f} ja {maximum:.0f} asteen välillä."
    else:
        temperature = f"Lämpötila vaihteli {minimum:.0f} ja {maximum:.0f} asteen välillä."

    first = "Päivä oli " + phrases[0] + "."
    extras = " ".join(phrase[0].upper() + phrase[1:] + "." for phrase in phrases[1:])
    return " ".join(part for part in (first, extras, temperature) if part)


def get_weather_summary(place: str, date_str: str, http_get: HttpGet = _http_get_json) -> Dict[str, str]:
    validated_date = validate_date(date_str)
    location = geocode_place(place, http_get)
    daily = fetch_daily_weather(location["latitude"], location["longitude"], validated_date, http_get)
    return {"location": location["name"], "date": validated_date, "summary": describe_weather(daily), "source": SOURCE_NAME}
