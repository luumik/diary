import { describe, expect, it, vi } from "vitest";

import type { DiaryEntry } from "./createDiaryEntry";
import { updateDiaryEntry } from "./updateDiaryEntry";

const existingEntry: DiaryEntry = {
  id: "entry-123",
  title: "A quiet morning",
  content: "I enjoyed a cup of tea before work.",
  entryDate: "2026-08-16",
  tags: ["Reflection"],
  createdAt: "2026-08-16T08:00:00.000Z",
  updatedAt: "2026-08-16T08:00:00.000Z",
};

describe("updateDiaryEntry", () => {
  it("updates valid fields while preserving the id and creation timestamp", async () => {
    const updatedAt = "2026-08-16T12:00:00.000Z";
    const updatedEntry: DiaryEntry = {
      id: existingEntry.id,
      title: "A productive afternoon",
      content: "I finished the tasks I planned for the day.",
      entryDate: "2026-08-16",
      tags: ["Work", "Reflection"],
      createdAt: existingEntry.createdAt,
      updatedAt,
    };
    const repository = {
      findById: vi.fn(async () => existingEntry),
      update: vi.fn(async (entry: DiaryEntry) => entry),
    };

    const result = await updateDiaryEntry({
      id: existingEntry.id,
      input: {
        title: updatedEntry.title,
        content: updatedEntry.content,
        entryDate: updatedEntry.entryDate,
        tags: [" Work ", "work", "Reflection", ""],
      },
      repository,
      now: () => updatedAt,
    });

    expect(repository.findById).toHaveBeenCalledWith(existingEntry.id);
    expect(repository.update).toHaveBeenCalledWith(updatedEntry);
    expect(result).toEqual({ found: true, isValid: true, entry: updatedEntry });
  });

  it("returns not found without updating when the requested entry does not exist", async () => {
    const repository = {
      findById: vi.fn(async () => undefined),
      update: vi.fn(async (entry: DiaryEntry) => entry),
    };

    const result = await updateDiaryEntry({
      id: "missing-entry",
      input: {
        title: "A productive afternoon",
        content: "I finished the tasks I planned for the day.",
        entryDate: "2026-08-16",
        tags: [],
      },
      repository,
      now: () => "2026-08-16T12:00:00.000Z",
    });

    expect(repository.findById).toHaveBeenCalledWith("missing-entry");
    expect(repository.update).not.toHaveBeenCalled();
    expect(result).toEqual({ found: false });
  });

  it("trims surrounding whitespace from updated text fields before saving", async () => {
    const updatedAt = "2026-08-16T12:00:00.000Z";
    const repository = {
      findById: vi.fn(async () => existingEntry),
      update: vi.fn(async (entry: DiaryEntry) => entry),
    };

    await updateDiaryEntry({
      id: existingEntry.id,
      input: {
        title: "  A productive afternoon  ",
        content: "\nI finished the tasks I planned for the day.\n",
        entryDate: existingEntry.entryDate,
        tags: [],
      },
      repository,
      now: () => updatedAt,
    });

    expect(repository.update).toHaveBeenCalledWith({
      id: existingEntry.id,
      title: "A productive afternoon",
      content: "I finished the tasks I planned for the day.",
      entryDate: existingEntry.entryDate,
      tags: [],
      createdAt: existingEntry.createdAt,
      updatedAt,
    });
  });
});
