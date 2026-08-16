import { describe, expect, it, vi } from "vitest";

import type { DiaryEntry } from "./createDiaryEntry";
import { listDiaryEntries } from "./listDiaryEntries";

function entry(
  id: string,
  entryDate: string,
  createdAt: string,
): DiaryEntry {
  return {
    id,
    title: `Entry ${id}`,
    content: `Content for ${id}`,
    entryDate,
    tags: [],
    createdAt,
    updatedAt: createdAt,
  };
}

describe("listDiaryEntries", () => {
  it("orders entries by entry date and then creation time in descending order", async () => {
    const oldestEntry = entry(
      "entry-1",
      "2026-08-14",
      "2026-08-14T12:00:00.000Z",
    );
    const earlierEntryOnSameDate = entry(
      "entry-2",
      "2026-08-16",
      "2026-08-16T08:00:00.000Z",
    );
    const latestEntry = entry(
      "entry-3",
      "2026-08-16",
      "2026-08-16T10:00:00.000Z",
    );
    const repository = {
      list: vi.fn(async () => [earlierEntryOnSameDate, oldestEntry, latestEntry]),
    };

    const entries = await listDiaryEntries({ repository });

    expect(repository.list).toHaveBeenCalledOnce();
    expect(entries).toEqual([latestEntry, earlierEntryOnSameDate, oldestEntry]);
  });
});
