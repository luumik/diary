import { describe, expect, it, vi } from "vitest";

import type { DiaryEntry } from "./createDiaryEntry";
import { getDiaryEntryById } from "./getDiaryEntryById";

const savedEntry: DiaryEntry = {
  id: "entry-123",
  title: "A quiet morning",
  content: "I enjoyed a cup of tea before work.",
  entryDate: "2026-08-16",
  tags: ["Reflection"],
  createdAt: "2026-08-16T10:15:00.000Z",
  updatedAt: "2026-08-16T10:15:00.000Z",
};

describe("getDiaryEntryById", () => {
  it("returns a found result for an existing entry", async () => {
    const repository = {
      findById: vi.fn(async () => savedEntry),
    };

    const result = await getDiaryEntryById({
      id: savedEntry.id,
      repository,
    });

    expect(repository.findById).toHaveBeenCalledWith(savedEntry.id);
    expect(result).toEqual({ found: true, entry: savedEntry });
  });

  it("returns a not-found result when no entry exists for the requested id", async () => {
    const repository = {
      findById: vi.fn(async () => undefined),
    };

    const result = await getDiaryEntryById({
      id: "missing-entry",
      repository,
    });

    expect(repository.findById).toHaveBeenCalledWith("missing-entry");
    expect(result).toEqual({ found: false });
  });
});
