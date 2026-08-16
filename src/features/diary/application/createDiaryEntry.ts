import {
  validateDiaryEntryInput,
  type DiaryEntryInput,
  type ValidationResult,
} from "../domain/validateDiaryEntryInput";
import { normalizeTags } from "../domain/normalizeTags";

export interface DiaryEntry {
  readonly id: string;
  readonly title: string;
  readonly content: string;
  readonly entryDate: string;
  readonly tags: readonly string[];
  readonly createdAt: string;
  readonly updatedAt: string;
}

export type CreateDiaryEntryInput = DiaryEntryInput;

export interface DiaryEntryRepository {
  save(entry: DiaryEntry): Promise<DiaryEntry>;
}

export interface CreateDiaryEntryDependencies {
  readonly input: CreateDiaryEntryInput;
  readonly repository: DiaryEntryRepository;
  readonly generateId: () => string;
  readonly now: () => string;
}

type ValidationFailure = Extract<ValidationResult, { readonly isValid: false }>;

export type CreateDiaryEntryResult =
  | { readonly isValid: true; readonly entry: DiaryEntry }
  | ValidationFailure;

export async function createDiaryEntry({
  input,
  repository,
  generateId,
  now,
}: CreateDiaryEntryDependencies): Promise<CreateDiaryEntryResult> {
  const normalizedInput: CreateDiaryEntryInput = {
    ...input,
    title: input.title.trim(),
    content: input.content.trim(),
    tags: normalizeTags(input.tags),
  };
  const validationResult = validateDiaryEntryInput(normalizedInput);

  if (!validationResult.isValid) {
    return validationResult;
  }

  const timestamp = now();
  const entry: DiaryEntry = {
    id: generateId(),
    title: normalizedInput.title,
    content: normalizedInput.content,
    entryDate: normalizedInput.entryDate,
    tags: normalizedInput.tags,
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  const savedEntry = await repository.save(entry);

  return { isValid: true, entry: savedEntry };
}
