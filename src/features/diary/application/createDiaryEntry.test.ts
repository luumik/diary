import { describe, expect, it, vi } from "vitest";

import { createDiaryEntry } from "./createDiaryEntry";

interface DiaryEntry {
  readonly id: string;
  readonly title: string;
  readonly content: string;
  readonly entryDate: string;
  readonly tags: readonly string[];
  readonly createdAt: string;
  readonly updatedAt: string;
}

describe("createDiaryEntry", () => {
  it("persists and returns a valid entry with generated identifiers and timestamps", async () => {
    const timestamp = "2026-08-16T10:15:00.000Z";
    const entry: DiaryEntry = {
      id: "entry-123",
      title: "A quiet morning",
      content: "I enjoyed a cup of tea before work.",
      entryDate: "2026-08-16",
      tags: ["Reflection", "Morning"],
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    const repository = {
      save: vi.fn(async (savedEntry: DiaryEntry) => savedEntry),
    };

    const result = await createDiaryEntry({
      input: {
        title: entry.title,
        content: entry.content,
        entryDate: entry.entryDate,
        tags: entry.tags,
      },
      repository,
      generateId: () => entry.id,
      now: () => timestamp,
    });

    expect(repository.save).toHaveBeenCalledOnce();
    expect(repository.save).toHaveBeenCalledWith(entry);
    expect(result).toEqual({ isValid: true, entry });
  });

  it("returns title validation errors without saving an invalid entry", async () => {
    const repository = {
      save: vi.fn(async (entry: DiaryEntry) => entry),
    };

    const result = await createDiaryEntry({
      input: {
        title: " \t",
        content: "I enjoyed a cup of tea before work.",
        entryDate: "2026-08-16",
        tags: [],
      },
      repository,
      generateId: () => "entry-123",
      now: () => "2026-08-16T10:15:00.000Z",
    });

    expect(result).toEqual({
      isValid: false,
      errors: { title: "Title is required." },
    });
    expect(repository.save).not.toHaveBeenCalled();
  });

  it("returns content validation errors without saving an invalid entry", async () => {
    const repository = {
      save: vi.fn(async (entry: DiaryEntry) => entry),
    };

    const result = await createDiaryEntry({
      input: {
        title: "A quiet morning",
        content: "\n ",
        entryDate: "2026-08-16",
        tags: [],
      },
      repository,
      generateId: () => "entry-123",
      now: () => "2026-08-16T10:15:00.000Z",
    });

    expect(result).toEqual({
      isValid: false,
      errors: { content: "Content is required." },
    });
    expect(repository.save).not.toHaveBeenCalled();
  });

  it("persists normalized tags", async () => {
    const repository = {
      save: vi.fn(async (entry: DiaryEntry) => entry),
    };

    await createDiaryEntry({
      input: {
        title: "A quiet morning",
        content: "I enjoyed a cup of tea before work.",
        entryDate: "2026-08-16",
        tags: [" Morning ", "", "morning", "Work"],
      },
      repository,
      generateId: () => "entry-123",
      now: () => "2026-08-16T10:15:00.000Z",
    });

    expect(repository.save).toHaveBeenCalledWith({
      id: "entry-123",
      title: "A quiet morning",
      content: "I enjoyed a cup of tea before work.",
      entryDate: "2026-08-16",
      tags: ["Morning", "Work"],
      createdAt: "2026-08-16T10:15:00.000Z",
      updatedAt: "2026-08-16T10:15:00.000Z",
    });
  });

  it("trims surrounding whitespace from the title and content before saving", async () => {
    const repository = {
      save: vi.fn(async (entry: DiaryEntry) => entry),
    };

    await createDiaryEntry({
      input: {
        title: "  A quiet morning  ",
        content: "\nI enjoyed a cup of tea before work.\n",
        entryDate: "2026-08-16",
        tags: [],
      },
      repository,
      generateId: () => "entry-123",
      now: () => "2026-08-16T10:15:00.000Z",
    });

    expect(repository.save).toHaveBeenCalledWith({
      id: "entry-123",
      title: "A quiet morning",
      content: "I enjoyed a cup of tea before work.",
      entryDate: "2026-08-16",
      tags: [],
      createdAt: "2026-08-16T10:15:00.000Z",
      updatedAt: "2026-08-16T10:15:00.000Z",
    });
  });
});
