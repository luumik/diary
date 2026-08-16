export const createDiaryEntriesMigration = {
  id: "0001_create_diary_entries",
  sql: `
    CREATE TABLE diary_entries (
      id TEXT PRIMARY KEY NOT NULL,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      entry_date TEXT NOT NULL,
      tags TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `,
};
