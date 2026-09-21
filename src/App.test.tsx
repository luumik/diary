import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { DiaryEntry } from "./features/diary/application/createDiaryEntry";
import type { DiaryApiClient } from "./features/diary/infrastructure/DiaryApiClient";
import { App } from "./App";

const entry: DiaryEntry = {
  id: "entry-123",
  title: "A quiet morning",
  content: "I enjoyed a cup of tea before work.",
  entryDate: "2026-08-16",
  tags: ["Reflection"],
  createdAt: "2026-08-16T08:00:00.000Z",
  updatedAt: "2026-08-16T08:00:00.000Z",
};

interface AppClientProps {
  readonly client: DiaryApiClient;
}

function createClient(): DiaryApiClient {
  return {
    loadEntries: vi.fn(async () => [entry]),
    loadEntry: vi.fn(async () => entry),
    createEntry: vi.fn(async () => ({ isValid: true as const, entry })),
    updateEntry: vi.fn(async () => ({
      found: true as const,
      isValid: true as const,
      entry,
    })),
    deleteEntry: vi.fn(async () => ({ deleted: true as const })),
    fetchWeather: vi.fn(async () => ({
      location: "Helsinki, Suomi",
      date: "2026-08-16",
      summary: "Päivä oli aurinkoinen.",
      source: "Open-Meteo",
    })),
  };
}

function renderApp(client: DiaryApiClient) {
  const props: React.ComponentProps<typeof App> & AppClientProps = { client };

  render(<App {...props} />);
}

afterEach(cleanup);

describe("App", () => {
  it.each([false, true])("cancels creation without saving (empty diary: %s)", async (empty) => {
    const client = createClient();
    if (empty) vi.mocked(client.loadEntries).mockResolvedValue([]);
    renderApp(client);
    const action = empty ? "Create your first entry" : "New entry";
    fireEvent.click(await screen.findByRole("button", { name: action }));
    fireEvent.change(screen.getByLabelText("Title"), { target: { value: "Discard this fictional draft" } });
    fireEvent.click(screen.getByRole("button", { name: "Cancel creation" }));
    expect(await screen.findByRole("button", { name: action })).toHaveFocus();
    expect(client.createEntry).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: action }));
    expect(screen.getByLabelText("Title")).toHaveValue("");
  });

  it("fetches and saves weather while editing an existing entry without weather", async () => {
    const client = createClient();
    renderApp(client);
    fireEvent.click(await screen.findByRole("button", { name: entry.title }));
    fireEvent.click(await screen.findByRole("button", { name: "Edit entry" }));
    fireEvent.change(screen.getByLabelText("Paikkakunta"), { target: { value: "Helsinki" } });
    fireEvent.click(screen.getByRole("button", { name: "Hae sää" }));
    expect(await screen.findByDisplayValue("Päivä oli aurinkoinen.")).toBeVisible();
    expect(client.fetchWeather).toHaveBeenCalledWith("Helsinki", entry.entryDate);
    fireEvent.click(screen.getByRole("button", { name: "Save changes" }));
    expect(await screen.findByText("Entry updated.")).toBeVisible();
    expect(client.updateEntry).toHaveBeenCalledWith(entry.id, expect.objectContaining({
      weather: { location: "Helsinki, Suomi", summary: "Päivä oli aurinkoinen.", source: "Open-Meteo" },
    }));
  });

  it("preserves an old entry and allows cancellation when weather lookup fails", async () => {
    const client = createClient();
    vi.mocked(client.fetchWeather).mockRejectedValue(new Error("Unavailable"));
    renderApp(client);
    fireEvent.click(await screen.findByRole("button", { name: entry.title }));
    fireEvent.click(await screen.findByRole("button", { name: "Edit entry" }));
    fireEvent.change(screen.getByLabelText("Paikkakunta"), { target: { value: "Unknown place" } });
    fireEvent.click(screen.getByRole("button", { name: "Hae sää" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Säätietojen hakeminen epäonnistui");
    expect(screen.getByLabelText("Title")).toHaveValue(entry.title);
    expect(screen.getByLabelText("Content")).toHaveValue(entry.content);
    fireEvent.click(screen.getByRole("button", { name: "Cancel editing" }));
    expect(await screen.findByRole("heading", { name: entry.title })).toBeVisible();
    expect(client.updateEntry).not.toHaveBeenCalled();
  });

  it("displays the entry list loaded through the injected API client", async () => {
    const client = createClient();

    renderApp(client);

    expect(
      await screen.findByRole("button", { name: entry.title }),
    ).toBeVisible();
    expect(client.loadEntries).toHaveBeenCalledOnce();
  });

  it("loads and displays a selected entry through the injected API client", async () => {
    const client = createClient();

    renderApp(client);

    fireEvent.click(
      await screen.findByRole("button", { name: entry.title }),
    );

    expect(client.loadEntry).toHaveBeenCalledWith(entry.id);
    expect(
      await screen.findByRole("heading", { name: entry.title }),
    ).toBeVisible();
    expect(screen.getByText(entry.content)).toBeVisible();
  });
});
