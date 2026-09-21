import { describe, expect, it, vi } from "vitest";

import { createWeatherAgentClient } from "./WeatherAgentClient";

describe("WeatherAgentClient", () => {
  it("returns a validated summary from the Python agent", async () => {
    const weather = {
      location: "Helsinki, Suomi",
      date: "2024-06-01",
      summary: "Päivä oli aurinkoinen.",
      source: "Open-Meteo",
    };
    const request = vi.fn(async () => new Response(JSON.stringify(weather), {
      status: 200,
      headers: { "content-type": "application/json" },
    }));

    await expect(
      createWeatherAgentClient("http://127.0.0.1:8002", request).getSummary(
        "Helsinki",
        "2024-06-01",
      ),
    ).resolves.toEqual(weather);
  });

  it("rejects malformed agent responses", async () => {
    const request = vi.fn(async () => new Response(JSON.stringify({ summary: 42 })));

    await expect(
      createWeatherAgentClient("http://127.0.0.1:8002", request).getSummary(
        "Helsinki",
        "2024-06-01",
      ),
    ).rejects.toThrow("Weather agent returned an invalid response.");
  });
});
