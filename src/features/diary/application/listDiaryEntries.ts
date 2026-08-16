import type { DiaryEntry } from "./createDiaryEntry";

export interface ListDiaryEntriesRepository {
  list(): Promise<readonly DiaryEntry[]>;
}

export interface ListDiaryEntriesDependencies {
  readonly repository: ListDiaryEntriesRepository;
}

export async function listDiaryEntries({
  repository,
}: ListDiaryEntriesDependencies): Promise<DiaryEntry[]> {
  const entries = await repository.list();

  return [...entries].sort(
    (first, second) =>
      second.entryDate.localeCompare(first.entryDate) ||
      second.createdAt.localeCompare(first.createdAt),
  );
}
