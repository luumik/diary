import type { WeatherSummary } from "../features/diary/domain/weather";

export interface WeatherAgent {
  getSummary(place: string, date: string): Promise<WeatherSummary>;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isWeatherSummary(value: unknown): value is WeatherSummary {
  return (
    isRecord(value) &&
    typeof value.location === "string" &&
    typeof value.date === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(value.date) &&
    typeof value.summary === "string" &&
    value.source === "Open-Meteo"
  );
}

export function createWeatherAgentClient(
  baseUrl: string,
  request: typeof fetch = fetch,
): WeatherAgent {
  const url = baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;

  return {
    async getSummary(place, date) {
      let response: Response;
      try {
        response = await request(`${url}/weather/summary`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ place, date }),
        });
      } catch {
        throw new Error("Weather agent is unavailable.");
      }

      if (!response.ok) {
        throw new Error("Weather agent could not find weather for the selection.");
      }

      let body: unknown;
      try {
        body = await response.json();
      } catch {
        throw new Error("Weather agent returned an invalid response.");
      }

      if (!isWeatherSummary(body)) {
        throw new Error("Weather agent returned an invalid response.");
      }
      return body;
    },
  };
}
