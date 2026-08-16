import type { DiaryEntry } from "./createDiaryEntry";

export interface GetDiaryEntryByIdRepository {
  findById(id: string): Promise<DiaryEntry | undefined>;
}

export interface GetDiaryEntryByIdDependencies {
  readonly id: string;
  readonly repository: GetDiaryEntryByIdRepository;
}

export type GetDiaryEntryByIdResult =
  | { readonly found: true; readonly entry: DiaryEntry }
  | { readonly found: false };

export async function getDiaryEntryById({
  id,
  repository,
}: GetDiaryEntryByIdDependencies): Promise<GetDiaryEntryByIdResult> {
  const entry = await repository.findById(id);

  return entry === undefined ? { found: false } : { found: true, entry };
}
