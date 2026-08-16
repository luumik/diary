import {
  validateDiaryEntryInput,
  type ValidationResult,
} from "../domain/validateDiaryEntryInput";
import { normalizeTags } from "../domain/normalizeTags";
import type { CreateDiaryEntryInput, DiaryEntry } from "./createDiaryEntry";

export interface UpdateDiaryEntryRepository {
  findById(id: string): Promise<DiaryEntry | undefined>;
  update(entry: DiaryEntry): Promise<DiaryEntry>;
}

export interface UpdateDiaryEntryDependencies {
  readonly id: string;
  readonly input: CreateDiaryEntryInput;
  readonly repository: UpdateDiaryEntryRepository;
  readonly now: () => string;
}

type ValidationFailure = Extract<ValidationResult, { readonly isValid: false }>;

export type UpdateDiaryEntryResult =
  | { readonly found: false }
  | { readonly found: true; readonly isValid: true; readonly entry: DiaryEntry }
  | ({ readonly found: true } & ValidationFailure);

export async function updateDiaryEntry({
  id,
  input,
  repository,
  now,
}: UpdateDiaryEntryDependencies): Promise<UpdateDiaryEntryResult> {
  const existingEntry = await repository.findById(id);

  if (existingEntry === undefined) {
    return { found: false };
  }

  const normalizedInput: CreateDiaryEntryInput = {
    ...input,
    title: input.title.trim(),
    content: input.content.trim(),
    tags: normalizeTags(input.tags),
  };
  const validationResult = validateDiaryEntryInput(normalizedInput);

  if (!validationResult.isValid) {
    return { found: true, isValid: false, errors: validationResult.errors };
  }

  const updatedEntry: DiaryEntry = {
    id: existingEntry.id,
    title: normalizedInput.title,
    content: normalizedInput.content,
    entryDate: normalizedInput.entryDate,
    tags: normalizedInput.tags,
    createdAt: existingEntry.createdAt,
    updatedAt: now(),
  };
  const savedEntry = await repository.update(updatedEntry);

  return { found: true, isValid: true, entry: savedEntry };
}
