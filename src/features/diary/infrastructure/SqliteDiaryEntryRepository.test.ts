import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import Database from "better-sqlite3";
import { describe, expect, it } from "vitest";

import type { DiaryEntry } from "../application/createDiaryEntry";
import { SqliteDiaryEntryRepository } from "./SqliteDiaryEntryRepository";

const entry: DiaryEntry = {
  id: "entry-123",
  title: "A quiet morning",
  content: "I enjoyed a cup of tea before work.",
  entryDate: "2026-08-16",
  tags: ["Reflection", "Morning"],
  createdAt: "2026-08-16T08:00:00.000Z",
  updatedAt: "2026-08-16T08:00:00.000Z",
};

const secondEntry: DiaryEntry = {
  ...entry,
  id: "entry-456",
  title: "An afternoon walk",
  content: "I took a walk through the park after lunch.",
  entryDate: "2026-08-17",
  tags: ["Outdoors"],
  createdAt: "2026-08-17T08:00:00.000Z",
  updatedAt: "2026-08-17T08:00:00.000Z",
};

const updatedEntry: DiaryEntry = {
  ...entry,
  title: "A productive morning",
  content: "I finished the work I planned before lunch.",
  tags: ["Work"],
  updatedAt: "2026-08-16T12:00:00.000Z",
};

const weatherEntry: DiaryEntry = {
  ...entry,
  id: "entry-weather",
  weather: {
    location: "Helsinki, Suomi",
    summary: "Päivä oli kirkas ja aurinkoinen.",
    source: "Open-Meteo",
  },
};

async function withTemporaryRepository(
  callback: (repository: SqliteDiaryEntryRepository) => Promise<void>,
): Promise<void> {
  const temporaryDirectory = await mkdtemp(join(tmpdir(), "diary-test-"));
  const databasePath = join(temporaryDirectory, "diary.sqlite");
  let repository: SqliteDiaryEntryRepository | undefined;

  try {
    repository = await SqliteDiaryEntryRepository.open({ databasePath });
    await callback(repository);
  } finally {
    await repository?.close();
    await rm(temporaryDirectory, { recursive: true, force: true });
  }
}

describe("SqliteDiaryEntryRepository", () => {
  it("keeps a saved entry available after reopening the database", async () => {
    const temporaryDirectory = await mkdtemp(join(tmpdir(), "diary-test-"));
    const databasePath = join(temporaryDirectory, "diary.sqlite");
    const writer = await SqliteDiaryEntryRepository.open({ databasePath });

    try {
      await writer.save(entry);
    } finally {
      await writer.close();
    }

    const reader = await SqliteDiaryEntryRepository.open({ databasePath });

    try {
      expect(await reader.findById(entry.id)).toEqual(entry);
    } finally {
      await reader.close();
      await rm(temporaryDirectory, { recursive: true, force: true });
    }
  });

  it("lists every saved entry", async () => {
    await withTemporaryRepository(async (repository) => {
      await repository.save(entry);
      await repository.save(secondEntry);

      expect(await repository.list()).toEqual(
        expect.arrayContaining([entry, secondEntry]),
      );
    });
  });

  it("persists updates to an existing entry", async () => {
    await withTemporaryRepository(async (repository) => {
      await repository.save(entry);
      await repository.update(updatedEntry);

      expect(await repository.findById(entry.id)).toEqual(updatedEntry);
    });
  });

  it("persists optional weather metadata", async () => {
    await withTemporaryRepository(async (repository) => {
      await repository.save(weatherEntry);

      expect(await repository.findById(weatherEntry.id)).toEqual(weatherEntry);
    });
  });

  it("migrates an existing diary database without losing entries", async () => {
    const temporaryDirectory = await mkdtemp(join(tmpdir(), "diary-test-"));
    const databasePath = join(temporaryDirectory, "diary.sqlite");
    const legacyDatabase = new Database(databasePath);
    legacyDatabase.exec(`
      CREATE TABLE schema_migrations (id TEXT PRIMARY KEY NOT NULL);
      INSERT INTO schema_migrations (id) VALUES ('0001_create_diary_entries');
      CREATE TABLE diary_entries (
        id TEXT PRIMARY KEY NOT NULL,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        entry_date TEXT NOT NULL,
        tags TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
    `);
    legacyDatabase.prepare(
      "INSERT INTO diary_entries VALUES (?, ?, ?, ?, ?, ?, ?)",
    ).run(
      entry.id,
      entry.title,
      entry.content,
      entry.entryDate,
      JSON.stringify(entry.tags),
      entry.createdAt,
      entry.updatedAt,
    );
    legacyDatabase.close();

    const repository = await SqliteDiaryEntryRepository.open({ databasePath });
    try {
      expect(await repository.findById(entry.id)).toEqual(entry);
      await repository.update({ ...weatherEntry, id: entry.id });
      expect((await repository.findById(entry.id))?.weather).toEqual(weatherEntry.weather);
    } finally {
      await repository.close();
      await rm(temporaryDirectory, { recursive: true, force: true });
    }
  });

  it("deletes an existing entry and reports a missing entry as not deleted", async () => {
    await withTemporaryRepository(async (repository) => {
      await repository.save(entry);

      expect(await repository.deleteById(entry.id)).toBe(true);
      expect(await repository.findById(entry.id)).toBeUndefined();
      expect(await repository.deleteById("missing-entry")).toBe(false);
    });
  });
});
