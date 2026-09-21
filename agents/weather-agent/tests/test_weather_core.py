from __future__ import annotations

import sys
from pathlib import Path

import pytest

AGENT_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(AGENT_DIR))
from weather_core import WeatherAgentError, describe_weather, get_weather_summary


def weather(code=0, maximum=20, minimum=10, precipitation=0, rain=0, snowfall=0, wind=10, gusts=15, sunshine=36000):
    return {
        "weather_code": code, "temperature_2m_max": maximum, "temperature_2m_min": minimum,
        "precipitation_sum": precipitation, "rain_sum": rain, "snowfall_sum": snowfall,
        "wind_speed_10m_max": wind, "wind_gusts_10m_max": gusts, "sunshine_duration": sunshine,
    }


@pytest.mark.parametrize(
    ("record", "expected"),
    [
        (weather(code=0), "kirkas ja aurinkoinen"),
        (weather(code=3), "pilvinen"),
        (weather(code=63, precipitation=8, rain=8), "sateinen"),
        (weather(code=75, precipitation=9, snowfall=12), "lumisateinen"),
        (weather(code=95, precipitation=5), "ukkoskuuroinen"),
        (weather(code=99, precipitation=8), "raekuuroja"),
    ],
)
def test_describes_wmo_conditions(record, expected):
    assert expected.casefold() in describe_weather(record).casefold()


def test_describes_heat_frost_and_wind():
    assert "Helleraja ylittyi" in describe_weather(weather(maximum=26))
    assert "pakkaspäivä" in describe_weather(weather(maximum=-3, minimum=-12))
    assert "kireää pakkasta" in describe_weather(weather(maximum=-3, minimum=-22))
    assert "myrskyinen" in describe_weather(weather(wind=89, gusts=100))
    assert "myrskyinen" not in describe_weather(weather(wind=50, gusts=70))
    assert "hyvin tuulinen" in describe_weather(weather(wind=50, gusts=70))


def test_cloudy_day_does_not_add_a_conflicting_sunshine_phrase():
    description = describe_weather(weather(code=3, sunshine=36000))
    assert "pilvinen" in description
    assert "aurinko paistoi" not in description


def test_lookup_geocodes_then_fetches_without_exposing_coordinates():
    responses = [
        {"results": [{"name": "Helsinki", "country": "Suomi", "latitude": 60.17, "longitude": 24.94}]},
        {"daily": {key: [value] for key, value in weather(code=2).items()}},
    ]
    urls = []
    def fake_get(url):
        urls.append(url)
        return responses.pop(0)
    result = get_weather_summary("Helsinki", "2024-06-01", fake_get)
    assert result["location"] == "Helsinki, Suomi"
    assert result["source"] == "Open-Meteo"
    assert "latitude" not in result and "longitude" not in result
    assert len(urls) == 2


def test_missing_place_has_safe_error():
    with pytest.raises(WeatherAgentError, match="Anna paikkakunta"):
        get_weather_summary(" ", "2024-06-01", lambda _url: {})
