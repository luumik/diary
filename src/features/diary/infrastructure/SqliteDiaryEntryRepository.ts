import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { eq } from "drizzle-orm";

import type { DiaryEntry } from "../application/createDiaryEntry";
import { normalizeTags } from "../domain/normalizeTags";
import { validateDiaryEntryInput } from "../domain/validateDiaryEntryInput";
import { applyMigrations } from "./migrations";
import { diaryEntries } from "./schema";

type DiaryEntryRow = typeof diaryEntries.$inferSelect;

export interface OpenSqliteDiaryEntryRepositoryOptions {
  readonly databasePath: string;
}

function isIsoTimestamp(value: string): boolean {
  const parsedTimestamp = new Date(value);

  return !Number.isNaN(parsedTimestamp.getTime()) && parsedTimestamp.toISOString() === value;
}

function parseTags(serializedTags: string): readonly string[] | undefined {
  let parsedTags: unknown;

  try {
    parsedTags = JSON.parse(serializedTags);
  } catch {
    return undefined;
  }

  if (!Array.isArray(parsedTags) || !parsedTags.every((tag) => typeof tag === "string")) {
    return undefined;
  }

  return parsedTags;
}

function parseDiaryEntry(row: DiaryEntryRow): DiaryEntry {
  const tags = parseTags(row.tags);

  if (
    tags === undefined ||
    row.id.length === 0 ||
    row.title !== row.title.trim() ||
    row.content !== row.content.trim() ||
    !isIsoTimestamp(row.createdAt) ||
    !isIsoTimestamp(row.updatedAt) ||
    !validateDiaryEntryInput({
      title: row.title,
      content: row.content,
      entryDate: row.entryDate,
      tags,
    }).isValid
  ) {
    throw new Error("Stored diary entry is invalid.");
  }

  const normalizedTags = normalizeTags(tags);

  if (
    normalizedTags.length !== tags.length ||
    normalizedTags.some((tag, index) => tag !== tags[index])
  ) {
    throw new Error("Stored diary entry is invalid.");
  }

  return {
    id: row.id,
    title: row.title,
    content: row.content,
    entryDate: row.entryDate,
    tags,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export class SqliteDiaryEntryRepository {
  private readonly database;

  private constructor(private readonly sqlite: Database.Database) {
    this.database = drizzle(sqlite);
  }

  static async open({
    databasePath,
  }: OpenSqliteDiaryEntryRepositoryOptions): Promise<SqliteDiaryEntryRepository> {
    const sqlite = new Database(databasePath);

    try {
      applyMigrations(sqlite);
      return new SqliteDiaryEntryRepository(sqlite);
    } catch (error) {
      sqlite.close();
      throw error;
    }
  }

  async save(entry: DiaryEntry): Promise<DiaryEntry> {
    this.database
      .insert(diaryEntries)
      .values({
        id: entry.id,
        title: entry.title,
        content: entry.content,
        entryDate: entry.entryDate,
        tags: JSON.stringify(entry.tags),
        createdAt: entry.createdAt,
        updatedAt: entry.updatedAt,
      })
      .run();

    return entry;
  }

  async findById(id: string): Promise<DiaryEntry | undefined> {
    const row = this.database
      .select()
      .from(diaryEntries)
      .where(eq(diaryEntries.id, id))
      .get();

    return row === undefined ? undefined : parseDiaryEntry(row);
  }

  async list(): Promise<DiaryEntry[]> {
    const rows = this.database.select().from(diaryEntries).all();

    return rows.map((row) => parseDiaryEntry(row));
  }

  async update(entry: DiaryEntry): Promise<DiaryEntry> {
    const result = this.database
      .update(diaryEntries)
      .set({
        title: entry.title,
        content: entry.content,
        entryDate: entry.entryDate,
        tags: JSON.stringify(entry.tags),
        createdAt: entry.createdAt,
        updatedAt: entry.updatedAt,
      })
      .where(eq(diaryEntries.id, entry.id))
      .run();

    if (result.changes !== 1) {
      throw new Error("Diary entry was not found.");
    }

    return entry;
  }

  async deleteById(id: string): Promise<boolean> {
    const result = this.database
      .delete(diaryEntries)
      .where(eq(diaryEntries.id, id))
      .run();

    return result.changes === 1;
  }

  async close(): Promise<void> {
    this.sqlite.close();
  }
}
