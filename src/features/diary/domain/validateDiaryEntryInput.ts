export interface DiaryEntryInput {
  readonly title: string;
  readonly content: string;
  readonly entryDate: string;
  readonly tags: readonly string[];
}

type FieldName = "title" | "content" | "entryDate" | "tags";

export type ValidationResult =
  | { readonly isValid: true }
  | {
      readonly isValid: false;
      readonly errors: Readonly<Partial<Record<FieldName, string>>>;
    };

function isValidEntryDate(entryDate: string): boolean {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(entryDate);

  if (match === null) {
    return false;
  }

  const [, yearText, monthText, dayText] = match;

  if (yearText === undefined || monthText === undefined || dayText === undefined) {
    return false;
  }

  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);

  if (year < 1 || month < 1 || month > 12 || day < 1) {
    return false;
  }

  const isLeapYear = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  const daysInMonth =
    month === 2 ? (isLeapYear ? 29 : 28) : [4, 6, 9, 11].includes(month) ? 30 : 31;

  return day <= daysInMonth;
}

export function validateDiaryEntryInput(
  input: DiaryEntryInput,
): ValidationResult {
  if (input.title.trim().length === 0) {
    return {
      isValid: false,
      errors: { title: "Title is required." },
    };
  }

  if (input.content.trim().length === 0) {
    return {
      isValid: false,
      errors: { content: "Content is required." },
    };
  }

  if (!isValidEntryDate(input.entryDate)) {
    return {
      isValid: false,
      errors: { entryDate: "Entry date must be a valid YYYY-MM-DD date." },
    };
  }

  if (input.title.length > 200) {
    return {
      isValid: false,
      errors: { title: "Title must be 200 characters or fewer." },
    };
  }

  if (input.content.length > 50_000) {
    return {
      isValid: false,
      errors: { content: "Content must be 50,000 characters or fewer." },
    };
  }

  if (input.tags.some((tag) => tag.length > 50)) {
    return {
      isValid: false,
      errors: { tags: "Each tag must be 50 characters or fewer." },
    };
  }

  if (input.tags.length > 20) {
    return {
      isValid: false,
      errors: { tags: "An entry can have at most 20 tags." },
    };
  }

  return { isValid: true };
}
