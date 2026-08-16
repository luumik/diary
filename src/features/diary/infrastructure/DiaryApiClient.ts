import type {
  CreateDiaryEntryResult,
  DiaryEntry,
} from "../application/createDiaryEntry";
import type { DeleteDiaryEntryResult } from "../application/deleteDiaryEntry";
import type { UpdateDiaryEntryResult } from "../application/updateDiaryEntry";
import {
  validateDiaryEntryInput,
  type DiaryEntryInput,
} from "../domain/validateDiaryEntryInput";

type FieldName = "title" | "content" | "entryDate" | "tags";
type ValidationErrors = Readonly<Partial<Record<FieldName, string>>>;

export type DiaryApiRequest = (
  url: string,
  init?: RequestInit,
) => Promise<Response>;

export interface DiaryApiClientOptions {
  readonly baseUrl: string;
  readonly request: DiaryApiRequest;
}

export interface DiaryApiClient {
  loadEntries(): Promise<readonly DiaryEntry[]>;
  loadEntry(id: string): Promise<DiaryEntry | undefined>;
  createEntry(input: DiaryEntryInput): Promise<CreateDiaryEntryResult>;
  updateEntry(
    id: string,
    input: DiaryEntryInput,
  ): Promise<UpdateDiaryEntryResult>;
  deleteEntry(id: string): Promise<DeleteDiaryEntryResult>;
}

function createApiError(): Error {
  return new Error("Unable to communicate with the diary API.");
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isIsoTimestamp(value: unknown): value is string {
  if (typeof value !== "string") {
    return false;
  }

  const timestamp = new Date(value);

  return !Number.isNaN(timestamp.getTime()) && timestamp.toISOString() === value;
}

function isDiaryEntry(value: unknown): value is DiaryEntry {
  if (
    !isRecord(value) ||
    typeof value.id !== "string" ||
    typeof value.title !== "string" ||
    typeof value.content !== "string" ||
    typeof value.entryDate !== "string" ||
    !Array.isArray(value.tags) ||
    !value.tags.every((tag) => typeof tag === "string") ||
    !isIsoTimestamp(value.createdAt) ||
    !isIsoTimestamp(value.updatedAt)
  ) {
    return false;
  }

  return validateDiaryEntryInput({
    title: value.title,
    content: value.content,
    entryDate: value.entryDate,
    tags: value.tags,
  }).isValid;
}

function isFieldName(value: string): value is FieldName {
  return value === "title" || value === "content" || value === "entryDate" || value === "tags";
}

function parseValidationErrors(value: unknown): ValidationErrors | undefined {
  if (!isRecord(value) || !isRecord(value.errors)) {
    return undefined;
  }

  const errors: Partial<Record<FieldName, string>> = {};

  for (const [field, message] of Object.entries(value.errors)) {
    if (!isFieldName(field) || typeof message !== "string") {
      return undefined;
    }

    errors[field] = message;
  }

  return Object.keys(errors).length === 0 ? undefined : errors;
}

async function parseJson(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    throw createApiError();
  }
}

export function createDiaryApiClient({
  baseUrl,
  request,
}: DiaryApiClientOptions): DiaryApiClient {
  const apiUrl = baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;

  async function send(url: string, init?: RequestInit): Promise<Response> {
    try {
      return init === undefined ? await request(url) : await request(url, init);
    } catch {
      throw createApiError();
    }
  }

  async function loadEntries(): Promise<readonly DiaryEntry[]> {
    const response = await send(`${apiUrl}/api/entries`);

    if (!response.ok) {
      throw createApiError();
    }

    const body = await parseJson(response);

    if (!Array.isArray(body) || !body.every(isDiaryEntry)) {
      throw createApiError();
    }

    return body;
  }

  async function loadEntry(id: string): Promise<DiaryEntry | undefined> {
    const response = await send(`${apiUrl}/api/entries/${id}`);

    if (response.status === 404) {
      return undefined;
    }

    if (!response.ok) {
      throw createApiError();
    }

    const body = await parseJson(response);

    if (!isDiaryEntry(body)) {
      throw createApiError();
    }

    return body;
  }

  async function createEntry(
    input: DiaryEntryInput,
  ): Promise<CreateDiaryEntryResult> {
    const response = await send(`${apiUrl}/api/entries`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(input),
    });

    const body = await parseJson(response);

    if (response.status === 201 && isDiaryEntry(body)) {
      return { isValid: true, entry: body };
    }

    const errors = parseValidationErrors(body);

    if (response.status === 400 && errors !== undefined) {
      return { isValid: false, errors };
    }

    throw createApiError();
  }

  async function updateEntry(
    id: string,
    input: DiaryEntryInput,
  ): Promise<UpdateDiaryEntryResult> {
    const response = await send(`${apiUrl}/api/entries/${id}`, {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(input),
    });

    if (response.status === 404) {
      return { found: false };
    }

    const body = await parseJson(response);

    if (response.ok && isDiaryEntry(body)) {
      return { found: true, isValid: true, entry: body };
    }

    const errors = parseValidationErrors(body);

    if (response.status === 400 && errors !== undefined) {
      return { found: true, isValid: false, errors };
    }

    throw createApiError();
  }

  async function deleteEntry(id: string): Promise<DeleteDiaryEntryResult> {
    const response = await send(`${apiUrl}/api/entries/${id}`, {
      method: "DELETE",
    });

    if (response.status === 204) {
      return { deleted: true };
    }

    if (response.status === 404) {
      return { deleted: false };
    }

    throw createApiError();
  }

  return {
    loadEntries,
    loadEntry,
    createEntry,
    updateEntry,
    deleteEntry,
  };
}
