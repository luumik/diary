import express, { type ErrorRequestHandler, type Express } from "express";
import { z } from "zod";

import {
  createDiaryEntry,
  type DiaryEntryRepository,
} from "../features/diary/application/createDiaryEntry";
import {
  deleteDiaryEntry,
  type DeleteDiaryEntryRepository,
} from "../features/diary/application/deleteDiaryEntry";
import {
  getDiaryEntryById,
  type GetDiaryEntryByIdRepository,
} from "../features/diary/application/getDiaryEntryById";
import {
  listDiaryEntries,
  type ListDiaryEntriesRepository,
} from "../features/diary/application/listDiaryEntries";
import {
  updateDiaryEntry,
  type UpdateDiaryEntryRepository,
} from "../features/diary/application/updateDiaryEntry";
import type { WeatherAgent } from "./WeatherAgentClient";

const weatherMetadataSchema = z
  .object({
    location: z.string(),
    summary: z.string(),
    source: z.string(),
  })
  .strict();

const diaryEntryInputSchema = z
  .object({
    title: z.string(),
    content: z.string(),
    entryDate: z.string(),
    tags: z.array(z.string()),
    weather: weatherMetadataSchema.optional(),
  })
  .strict();

function toDiaryEntryInput(input: z.infer<typeof diaryEntryInputSchema>) {
  return {
    title: input.title,
    content: input.content,
    entryDate: input.entryDate,
    tags: input.tags,
    ...(input.weather === undefined ? {} : { weather: input.weather }),
  };
}

function isMalformedJsonError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "type" in error &&
    error.type === "entity.parse.failed"
  );
}

export interface CreateDiaryApiDependencies {
  readonly repository: DiaryEntryRepository &
    ListDiaryEntriesRepository &
    GetDiaryEntryByIdRepository &
    UpdateDiaryEntryRepository &
    DeleteDiaryEntryRepository;
  readonly generateId: () => string;
  readonly now: () => string;
  readonly weatherAgent?: WeatherAgent;
}

export function createDiaryApi({
  repository,
  generateId,
  now,
  weatherAgent,
}: CreateDiaryApiDependencies): Express {
  const api = express();

  api.use(express.json());

  api.post("/api/weather-summary", async (request, response) => {
    const parsedInput = z
      .object({ place: z.string().trim().min(1).max(200), date: z.string() })
      .strict()
      .safeParse(request.body);

    if (!parsedInput.success) {
      response.status(400).json({ message: "Invalid weather request." });
      return;
    }

    if (weatherAgent === undefined) {
      response.status(503).json({ message: "Weather agent is unavailable." });
      return;
    }

    try {
      response.json(
        await weatherAgent.getSummary(parsedInput.data.place, parsedInput.data.date),
      );
    } catch {
      response.status(502).json({ message: "Unable to fetch weather." });
    }
  });

  api.get("/api/entries", async (_request, response) => {
    const entries = await listDiaryEntries({ repository });

    response.json(entries);
  });

  api.get("/api/entries/:id", async (request, response) => {
    const result = await getDiaryEntryById({
      id: request.params.id,
      repository,
    });

    if (!result.found) {
      response.status(404).json({ message: "Diary entry not found." });
      return;
    }

    response.json(result.entry);
  });

  api.post("/api/entries", async (request, response) => {
    const parsedInput = diaryEntryInputSchema.safeParse(request.body);

    if (!parsedInput.success) {
      response.status(400).json({ message: "Invalid diary entry." });
      return;
    }

    try {
      const result = await createDiaryEntry({
        input: toDiaryEntryInput(parsedInput.data),
        repository,
        generateId,
        now,
      });

      if (!result.isValid) {
        response.status(400).json({ errors: result.errors });
        return;
      }

      response.status(201).json(result.entry);
    } catch {
      response.status(500).json({ message: "Unable to save diary entry." });
    }
  });

  api.put("/api/entries/:id", async (request, response) => {
    const parsedInput = diaryEntryInputSchema.safeParse(request.body);

    if (!parsedInput.success) {
      response.status(400).json({ message: "Invalid diary entry." });
      return;
    }

    try {
      const result = await updateDiaryEntry({
        id: request.params.id,
        input: toDiaryEntryInput(parsedInput.data),
        repository,
        now,
      });

      if (!result.found) {
        response.status(404).json({ message: "Diary entry not found." });
        return;
      }

      if (!result.isValid) {
        response.status(400).json({ errors: result.errors });
        return;
      }

      response.json(result.entry);
    } catch {
      response.status(500).json({ message: "Unable to update diary entry." });
    }
  });

  api.delete("/api/entries/:id", async (request, response) => {
    try {
      const result = await deleteDiaryEntry({
        id: request.params.id,
        repository,
      });

      if (!result.deleted) {
        response.status(404).json({ message: "Diary entry not found." });
        return;
      }

      response.status(204).end();
    } catch {
      response.status(500).json({ message: "Unable to delete diary entry." });
    }
  });

  const handleUnexpectedError: ErrorRequestHandler = (
    error,
    _request,
    response,
    _next,
  ) => {
    if (isMalformedJsonError(error)) {
      response.status(400).json({ message: "Invalid diary entry." });
      return;
    }

    response.status(500).json({ message: "Unable to complete diary operation." });
  };

  api.use(handleUnexpectedError);

  return api;
}
