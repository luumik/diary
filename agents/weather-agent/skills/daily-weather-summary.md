---
name: daily-weather-summary
description: Use when a diary entry needs a Finnish plain-language weather summary for a place and date.
tools: [fetch_weather]
---

## Purpose
Fetch daily Open-Meteo data and turn it into a deterministic Finnish diary description.

## When to Use
- The user asks for weather for a diary entry.
- The user provides a place and a past or current calendar date.

## Tools Required
- `fetch_weather`: Geocode the place, retrieve daily weather, and apply the rule set.

## Safety
- Send only the user-entered place, resolved coordinates, and entry date to the documented Open-Meteo endpoints.
- Send no diary title, content, tags, saved weather description, or other diary-entry fields to Open-Meteo.
- Do not persist resolved coordinates.
- Treat the place, date, display location, and generated summary as sensitive local data; do not log them.
- Do not claim a hurricane or typhoon from local measurements alone.
- Attribute saved results to Open-Meteo.
