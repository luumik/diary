import { useEffect, useRef, useState, type FormEvent } from "react";

import type {
  DiaryEntryInput,
  ValidationResult,
} from "./domain/validateDiaryEntryInput";
import type { WeatherSummary } from "./domain/weather";

export type NewEntryFormSubmitHandler = (
  input: DiaryEntryInput,
) => Promise<ValidationResult> | ValidationResult;

export interface NewEntryFormProps {
  readonly today: () => string;
  readonly initialInput?: DiaryEntryInput;
  readonly operationError?: string | undefined;
  readonly onSubmit?: NewEntryFormSubmitHandler;
  readonly onCancel?: () => void;
  readonly cancelLabel?: string;
  readonly submitLabel?: string;
  readonly onFetchWeather?: (
    place: string,
    date: string,
  ) => Promise<WeatherSummary>;
}

export function NewEntryForm({
  today,
  initialInput,
  operationError,
  onSubmit,
  onCancel,
  cancelLabel = "Cancel editing",
  submitLabel = "Save entry",
  onFetchWeather,
}: NewEntryFormProps) {
  const [title, setTitle] = useState(initialInput?.title ?? "");
  const [content, setContent] = useState(initialInput?.content ?? "");
  const [entryDate, setEntryDate] = useState(
    initialInput?.entryDate ?? today,
  );
  const [tags, setTags] = useState(initialInput?.tags.join(", ") ?? "");
  const [weatherLocation, setWeatherLocation] = useState(
    initialInput?.weather?.location ?? "",
  );
  const [weatherSummary, setWeatherSummary] = useState(
    initialInput?.weather?.summary ?? "",
  );
  const [weatherSource, setWeatherSource] = useState(
    initialInput?.weather?.source ?? "",
  );
  const [weatherError, setWeatherError] = useState<string | undefined>(undefined);
  const [isFetchingWeather, setIsFetchingWeather] = useState(false);
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

    if (onSubmit === undefined || isSubmitting || isFetchingWeather) {
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await onSubmit({
        title,
        content,
        entryDate,
        tags: tags.split(",").map((tag) => tag.trim()),
        ...(weatherLocation.trim() && weatherSummary.trim() && weatherSource.trim()
          ? {
              weather: {
                location: weatherLocation,
                summary: weatherSummary,
                source: weatherSource,
              },
            }
          : {}),
      });

      setValidationResult(result);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleFetchWeather() {
    if (onFetchWeather === undefined || isFetchingWeather) {
      return;
    }
    if (!weatherLocation.trim()) {
      setWeatherError("Anna paikkakunta ennen säähakua.");
      return;
    }
    if (!entryDate) {
      setWeatherError("Valitse päivämäärä ennen säähakua.");
      return;
    }

    setIsFetchingWeather(true);
    setWeatherError(undefined);
    try {
      const result = await onFetchWeather(weatherLocation, entryDate);
      setWeatherLocation(result.location);
      setWeatherSummary(result.summary);
      setWeatherSource(result.source);
    } catch {
      setWeatherError("Säätietojen hakeminen epäonnistui. Yritä uudelleen.");
    } finally {
      setIsFetchingWeather(false);
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
        onChange={(event) => {
          setEntryDate(event.target.value);
          setWeatherSummary("");
          setWeatherSource("");
          setWeatherError(undefined);
        }}
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

      <fieldset className="weather-fields">
        <legend>Sää (vapaaehtoinen)</legend>
        <label htmlFor="weather-location">Paikkakunta</label>
        <input
          id="weather-location"
          name="weatherLocation"
          value={weatherLocation}
          onChange={(event) => {
            setWeatherLocation(event.target.value);
            setWeatherSummary("");
            setWeatherSource("");
            setWeatherError(undefined);
          }}
        />
        <button
          className="secondary-action"
          type="button"
          onClick={() => void handleFetchWeather()}
          disabled={isFetchingWeather || onFetchWeather === undefined}
        >
          {isFetchingWeather ? "Haetaan säätä…" : "Hae sää"}
        </button>
        {weatherError === undefined ? null : (
          <p className="field-error" role="alert">{weatherError}</p>
        )}
        <label htmlFor="weather-summary">Sääkuvaus</label>
        <textarea
          id="weather-summary"
          name="weatherSummary"
          value={weatherSummary}
          onChange={(event) => setWeatherSummary(event.target.value)}
          maxLength={1_000}
          disabled={!weatherSource}
        />
        {weatherSource ? <p className="weather-source">Säädata: {weatherSource}</p> : null}
        {weatherSummary ? (
          <button
            className="secondary-action"
            type="button"
            onClick={() => {
              setWeatherLocation("");
              setWeatherSummary("");
              setWeatherSource("");
            }}
          >
            Poista sää
          </button>
        ) : null}
      </fieldset>

      {isSubmitting ? <p role="status">Saving entry…</p> : null}
      {onCancel === undefined ? null : (
        <button
          className="secondary-action"
          type="button"
          onClick={onCancel}
          disabled={isSubmitting || isFetchingWeather}
        >
          {cancelLabel}
        </button>
      )}
      <button
        className="primary-action"
        type="submit"
        disabled={isSubmitting || isFetchingWeather}
      >
        {submitLabel}
      </button>
    </form>
  );
}
