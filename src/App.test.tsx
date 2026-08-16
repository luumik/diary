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
  };
}

function renderApp(client: DiaryApiClient) {
  const props: React.ComponentProps<typeof App> & AppClientProps = { client };

  render(<App {...props} />);
}

afterEach(cleanup);

describe("App", () => {
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
