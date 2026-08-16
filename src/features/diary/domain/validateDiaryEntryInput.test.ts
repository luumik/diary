import { describe, expect, it } from "vitest";

import { validateDiaryEntryInput } from "./validateDiaryEntryInput";

interface DiaryEntryInput {
  readonly title: string;
  readonly content: string;
  readonly entryDate: string;
  readonly tags: readonly string[];
}

function validInput(): DiaryEntryInput {
  return {
    title: "A quiet morning",
    content: "I enjoyed a cup of tea before work.",
    entryDate: "2026-08-16",
    tags: ["Reflection"],
  };
}

describe("validateDiaryEntryInput", () => {
  it("accepts a valid YYYY-MM-DD entry date", () => {
    expect(validateDiaryEntryInput(validInput())).toEqual({ isValid: true });
  });

  it("reports an entry-date error for an invalid date format", () => {
    expect(
      validateDiaryEntryInput({ ...validInput(), entryDate: "16-08-2026" }),
    ).toEqual({
      isValid: false,
      errors: { entryDate: "Entry date must be a valid YYYY-MM-DD date." },
    });
  });

  it("reports an entry-date error for an impossible calendar date", () => {
    expect(
      validateDiaryEntryInput({ ...validInput(), entryDate: "2026-02-30" }),
    ).toEqual({
      isValid: false,
      errors: { entryDate: "Entry date must be a valid YYYY-MM-DD date." },
    });
  });

  it("reports a field error for an empty or whitespace-only title", () => {
    expect(
      validateDiaryEntryInput({ ...validInput(), title: " \t" }),
    ).toEqual({
      isValid: false,
      errors: { title: "Title is required." },
    });
  });

  it("reports a field error for an empty or whitespace-only content", () => {
    expect(
      validateDiaryEntryInput({ ...validInput(), content: "\n " }),
    ).toEqual({
      isValid: false,
      errors: { content: "Content is required." },
    });
  });

  it("reports a title error when the title exceeds 200 characters", () => {
    expect(
      validateDiaryEntryInput({ ...validInput(), title: "a".repeat(201) }),
    ).toEqual({
      isValid: false,
      errors: { title: "Title must be 200 characters or fewer." },
    });
  });

  it("reports a content error when the content exceeds 50,000 characters", () => {
    expect(
      validateDiaryEntryInput({
        ...validInput(),
        content: "a".repeat(50_001),
      }),
    ).toEqual({
      isValid: false,
      errors: { content: "Content must be 50,000 characters or fewer." },
    });
  });

  it("reports a tag error when a tag exceeds 50 characters", () => {
    expect(
      validateDiaryEntryInput({
        ...validInput(),
        tags: ["a".repeat(51)],
      }),
    ).toEqual({
      isValid: false,
      errors: { tags: "Each tag must be 50 characters or fewer." },
    });
  });

  it("reports a tag error when more than 20 tags are provided", () => {
    expect(
      validateDiaryEntryInput({
        ...validInput(),
        tags: Array.from({ length: 21 }, (_, index) => `tag-${index}`),
      }),
    ).toEqual({
      isValid: false,
      errors: { tags: "An entry can have at most 20 tags." },
    });
  });
});
