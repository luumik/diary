export interface DeleteDiaryEntryRepository {
  deleteById(id: string): Promise<boolean>;
}

export interface DeleteDiaryEntryDependencies {
  readonly id: string;
  readonly repository: DeleteDiaryEntryRepository;
}

export interface DeleteDiaryEntryResult {
  readonly deleted: boolean;
}

export async function deleteDiaryEntry({
  id,
  repository,
}: DeleteDiaryEntryDependencies): Promise<DeleteDiaryEntryResult> {
  const deleted = await repository.deleteById(id);

  return { deleted };
}
