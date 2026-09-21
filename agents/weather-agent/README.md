# Diary Weather Agent

A deterministic Python agent that retrieves historical daily weather from Open-Meteo and writes a Finnish plain-language summary. It does not use Gemini, OpenAI, or an API key.

## Run

```sh
python -m pip install -r agents/weather-agent/requirements.txt
python agents/weather-agent/weather_agent.py --place Helsinki --date 2024-06-01
python agents/weather-agent/api/main.py
python agents/weather-agent/ui/app.py
```

The API binds to `127.0.0.1:8002`; the standalone UI binds to `127.0.0.1:5002`.

## Test

```sh
python -m pytest agents/weather-agent/tests -q
```

[Open-Meteo](https://open-meteo.com/)'s free API is for non-commercial use and requires attribution under CC BY 4.0. The agent sends only the place query, resolved coordinates, and date to Open-Meteo. Diary titles and content are never sent.

The rule set recognizes clear, cloudy, foggy, rainy, snowy, showery, stormy, hot, and freezing conditions. `Myrskyinen` requires a daily maximum sustained wind of at least 89 km/h. The agent never labels weather as a hurricane or typhoon because a single-location daily record cannot establish a tropical cyclone classification.
