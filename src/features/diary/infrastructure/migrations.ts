import type Database from "better-sqlite3";

import { createDiaryEntriesMigration } from "./migrations/0001_createDiaryEntries";

interface Migration {
  readonly id: string;
  readonly sql: string;
}

const migrations: readonly Migration[] = [createDiaryEntriesMigration];

export function applyMigrations(database: Database.Database): void {
  database.exec(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id TEXT PRIMARY KEY NOT NULL
    );
  `);

  const appliedMigrationRows = database
    .prepare<[], { readonly id: string }>("SELECT id FROM schema_migrations")
    .all();
  const appliedMigrationIds = new Set(
    appliedMigrationRows.map((migration) => migration.id),
  );
  const applyMigration = database.transaction((migration: Migration) => {
    database.exec(migration.sql);
    database
      .prepare<[string]>("INSERT INTO schema_migrations (id) VALUES (?)")
      .run(migration.id);
  });

  for (const migration of migrations) {
    if (!appliedMigrationIds.has(migration.id)) {
      applyMigration(migration);
    }
  }
}
