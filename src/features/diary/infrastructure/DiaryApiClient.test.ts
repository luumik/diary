import { describe, expect, it, vi } from "vitest";

import type { DiaryEntry } from "../application/createDiaryEntry";
import { createDiaryApiClient } from "./DiaryApiClient";

const baseUrl = "http://127.0.0.1:3100";

const entry: DiaryEntry = {
  id: "entry-123",
  title: "A quiet morning",
  content: "I enjoyed a cup of tea before work.",
  entryDate: "2026-08-16",
  tags: ["Reflection"],
  createdAt: "2026-08-16T08:00:00.000Z",
  updatedAt: "2026-08-16T08:00:00.000Z",
};

const input = {
  title: entry.title,
  content: entry.content,
  entryDate: entry.entryDate,
  tags: entry.tags,
};

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

describe("DiaryApiClient", () => {
  it("loads diary entries from the local API", async () => {
    const request = vi.fn(async () => jsonResponse([entry]));
    const client = createDiaryApiClient({ baseUrl, request });

    await expect(client.loadEntries()).resolves.toEqual([entry]);
    expect(request).toHaveBeenCalledWith(`${baseUrl}/api/entries`);
  });

  it("returns undefined when the requested entry is not found", async () => {
    const request = vi.fn(async () =>
      jsonResponse({ message: "Diary entry not found." }, 404),
    );
    const client = createDiaryApiClient({ baseUrl, request });

    await expect(client.loadEntry("missing-entry")).resolves.toBeUndefined();
    expect(request).toHaveBeenCalledWith(
      `${baseUrl}/api/entries/missing-entry`,
    );
  });

  it("posts a new entry and returns the saved entry", async () => {
    const request = vi.fn(async () => jsonResponse(entry, 201));
    const client = createDiaryApiClient({ baseUrl, request });

    await expect(client.createEntry(input)).resolves.toEqual({
      isValid: true,
      entry,
    });
    expect(request).toHaveBeenCalledWith(`${baseUrl}/api/entries`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(input),
    });
  });

  it("maps create validation errors to the form result", async () => {
    const request = vi.fn(async () =>
      jsonResponse({ errors: { title: "Title is required." } }, 400),
    );
    const client = createDiaryApiClient({ baseUrl, request });

    await expect(client.createEntry(input)).resolves.toEqual({
      isValid: false,
      errors: { title: "Title is required." },
    });
  });

  it("maps update validation errors without treating the entry as missing", async () => {
    const request = vi.fn(async () =>
      jsonResponse({ errors: { content: "Content is required." } }, 400),
    );
    const client = createDiaryApiClient({ baseUrl, request });

    await expect(client.updateEntry(entry.id, input)).resolves.toEqual({
      found: true,
      isValid: false,
      errors: { content: "Content is required." },
    });
    expect(request).toHaveBeenCalledWith(`${baseUrl}/api/entries/${entry.id}`, {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(input),
    });
  });

  it("maps a missing entry during an update to a not-found result", async () => {
    const request = vi.fn(async () =>
      jsonResponse({ message: "Diary entry not found." }, 404),
    );
    const client = createDiaryApiClient({ baseUrl, request });

    await expect(client.updateEntry("missing-entry", input)).resolves.toEqual({
      found: false,
    });
  });

  it("maps successful and missing deletion responses", async () => {
    const request = vi
      .fn()
      .mockResolvedValueOnce(new Response(null, { status: 204 }))
      .mockResolvedValueOnce(
        jsonResponse({ message: "Diary entry not found." }, 404),
      );
    const client = createDiaryApiClient({ baseUrl, request });

    await expect(client.deleteEntry(entry.id)).resolves.toEqual({
      deleted: true,
    });
    await expect(client.deleteEntry("missing-entry")).resolves.toEqual({
      deleted: false,
    });
    expect(request).toHaveBeenNthCalledWith(
      1,
      `${baseUrl}/api/entries/${entry.id}`,
      { method: "DELETE" },
    );
    expect(request).toHaveBeenNthCalledWith(
      2,
      `${baseUrl}/api/entries/missing-entry`,
      { method: "DELETE" },
    );
  });

  it("rejects unexpected API responses with a non-sensitive error", async () => {
    const request = vi.fn(async () =>
      jsonResponse({ message: "The database at C:\\private\\diary.sqlite failed." }, 500),
    );
    const client = createDiaryApiClient({ baseUrl, request });

    await expect(client.loadEntries()).rejects.toThrow(
      "Unable to communicate with the diary API.",
    );
  });
});
