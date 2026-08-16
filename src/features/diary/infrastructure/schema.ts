import { text, sqliteTable } from "drizzle-orm/sqlite-core";

export const diaryEntries = sqliteTable("diary_entries", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  entryDate: text("entry_date").notNull(),
  tags: text("tags").notNull(),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});
