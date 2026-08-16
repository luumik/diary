import { useEffect, useRef, useState, type FormEvent } from "react";

import type {
  DiaryEntryInput,
  ValidationResult,
} from "./domain/validateDiaryEntryInput";

export type NewEntryFormSubmitHandler = (
  input: DiaryEntryInput,
) => Promise<ValidationResult> | ValidationResult;

export interface NewEntryFormProps {
  readonly today: () => string;
  readonly initialInput?: DiaryEntryInput;
  readonly operationError?: string | undefined;
  readonly onSubmit?: NewEntryFormSubmitHandler;
  readonly onCancel?: () => void;
  readonly submitLabel?: string;
}

export function NewEntryForm({
  today,
  initialInput,
  operationError,
  onSubmit,
  onCancel,
  submitLabel = "Save entry",
}: NewEntryFormProps) {
  const [title, setTitle] = useState(initialInput?.title ?? "");
  const [content, setContent] = useState(initialInput?.content ?? "");
  const [entryDate, setEntryDate] = useState(
    initialInput?.entryDate ?? today,
  );
  const [tags, setTags] = useState(initialInput?.tags.join(", ") ?? "");
  const [validationResult, setValidationResult] = useState<
    ValidationResult | undefined
  >(undefined);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const errors =
    validationResult?.isValid === false ? validationResult.errors : undefined;
  const titleInputRef = useRef<HTMLInputElement>(null);
  const contentInputRef = useRef<HTMLTextAreaElement>(null);
  const entryDateInputRef = useRef<HTMLInputElement>(null);
  const tagsInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (errors?.title !== undefined) {
      titleInputRef.current?.focus();
      return;
    }

    if (errors?.content !== undefined) {
      contentInputRef.current?.focus();
      return;
    }

    if (errors?.entryDate !== undefined) {
      entryDateInputRef.current?.focus();
      return;
    }

    if (errors?.tags !== undefined) {
      tagsInputRef.current?.focus();
    }
  }, [errors]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (onSubmit === undefined || isSubmitting) {
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await onSubmit({
        title,
        content,
        entryDate,
        tags: tags.split(",").map((tag) => tag.trim()),
      });

      setValidationResult(result);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="diary-panel entry-form" onSubmit={handleSubmit}>
      {operationError === undefined ? null : (
        <p className="operation-message operation-message-error" role="alert">
          {operationError}
        </p>
      )}
      <label htmlFor="entry-title">Title</label>
      <input
        id="entry-title"
        name="title"
        ref={titleInputRef}
        autoFocus
        aria-invalid={errors?.title === undefined ? undefined : true}
        aria-describedby={
          errors?.title === undefined ? undefined : "title-error"
        }
        value={title}
        onChange={(event) => setTitle(event.target.value)}
      />
      {errors?.title === undefined ? null : (
        <p className="field-error" id="title-error" role="alert">
          {errors.title}
        </p>
      )}

      <label htmlFor="entry-content">Content</label>
      <textarea
        id="entry-content"
        name="content"
        ref={contentInputRef}
        aria-invalid={errors?.content === undefined ? undefined : true}
        aria-describedby={
          errors?.content === undefined ? undefined : "content-error"
        }
        value={content}
        onChange={(event) => setContent(event.target.value)}
      />
      {errors?.content === undefined ? null : (
        <p className="field-error" id="content-error" role="alert">
          {errors.content}
        </p>
      )}

      <label htmlFor="entry-date">Entry date</label>
      <input
        id="entry-date"
        name="entryDate"
        ref={entryDateInputRef}
        type="date"
        aria-invalid={errors?.entryDate === undefined ? undefined : true}
        aria-describedby={
          errors?.entryDate === undefined ? undefined : "entry-date-error"
        }
        value={entryDate}
        onChange={(event) => setEntryDate(event.target.value)}
      />
      {errors?.entryDate === undefined ? null : (
        <p className="field-error" id="entry-date-error" role="alert">
          {errors.entryDate}
        </p>
      )}

      <label htmlFor="entry-tags">Tags</label>
      <input
        id="entry-tags"
        name="tags"
        ref={tagsInputRef}
        aria-invalid={errors?.tags === undefined ? undefined : true}
        aria-describedby={
          errors?.tags === undefined ? undefined : "tags-error"
        }
        value={tags}
        onChange={(event) => setTags(event.target.value)}
      />
      {errors?.tags === undefined ? null : (
        <p className="field-error" id="tags-error" role="alert">
          {errors.tags}
        </p>
      )}

      {isSubmitting ? <p role="status">Saving entry…</p> : null}
      {onCancel === undefined ? null : (
        <button
          className="secondary-action"
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          Cancel editing
        </button>
      )}
      <button className="primary-action" type="submit" disabled={isSubmitting}>
        {submitLabel}
      </button>
    </form>
  );
}
