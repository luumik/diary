import { createServer, type Server } from "node:http";

import { describe, expect, it, vi } from "vitest";

import type { DiaryEntry } from "../features/diary/application/createDiaryEntry";
import { createDiaryApi } from "./createDiaryApi";

function startServer(server: Server): Promise<number> {
  return new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();

      if (address === null || typeof address === "string") {
        reject(new Error("The API server did not provide a TCP address."));
        return;
      }

      server.off("error", reject);
      resolve(address.port);
    });
  });
}

function stopServer(server: Server): Promise<void> {
  return new Promise((resolve, reject) => {
    server.close((error) => {
      if (error === undefined) {
        resolve();
        return;
      }

      reject(error);
    });
  });
}

describe("createDiaryApi", () => {
  it("creates an entry through POST /api/entries", async () => {
    const timestamp = "2026-08-16T10:15:00.000Z";
    const savedEntry: DiaryEntry = {
      id: "entry-123",
      title: "A quiet morning",
      content: "I enjoyed a cup of tea before work.",
      entryDate: "2026-08-16",
      tags: ["Reflection", "Morning"],
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    const repository = {
      save: vi.fn(async (entry: DiaryEntry) => entry),
      list: vi.fn(async () => []),
      findById: vi.fn(async () => undefined),
      update: vi.fn(async (entry: DiaryEntry) => entry),
      deleteById: vi.fn(async () => false),
    };
    const server = createServer(
      createDiaryApi({
        repository,
        generateId: () => savedEntry.id,
        now: () => timestamp,
      }),
    );
    const port = await startServer(server);

    try {
      const response = await fetch(`http://127.0.0.1:${port}/api/entries`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          title: " A quiet morning ",
          content: " I enjoyed a cup of tea before work. ",
          entryDate: "2026-08-16",
          tags: [" Reflection ", "reflection", "Morning", ""],
        }),
      });

      expect(response.status).toBe(201);
      expect(repository.save).toHaveBeenCalledWith(savedEntry);
      expect(await response.json()).toEqual(savedEntry);
    } finally {
      await stopServer(server);
    }
  });

  it("lists entries through GET /api/entries in reverse chronological order", async () => {
    const olderEntry: DiaryEntry = {
      id: "entry-1",
      title: "Older entry",
      content: "Created first",
      entryDate: "2026-01-01",
      tags: ["work"],
      createdAt: "2026-01-01T08:00:00.000Z",
      updatedAt: "2026-01-01T08:00:00.000Z",
    };
    const newerEntry: DiaryEntry = {
      id: "entry-2",
      title: "Newer entry",
      content: "Created later",
      entryDate: "2026-01-02",
      tags: ["home"],
      createdAt: "2026-01-02T08:00:00.000Z",
      updatedAt: "2026-01-02T08:00:00.000Z",
    };
    const repository = {
      save: vi.fn(async (entry: DiaryEntry) => entry),
      list: vi.fn(async () => [olderEntry, newerEntry]),
      findById: vi.fn(async () => undefined),
      update: vi.fn(async (entry: DiaryEntry) => entry),
      deleteById: vi.fn(async () => false),
    };
    const server = createServer(
      createDiaryApi({
        repository,
        generateId: () => "generated-id",
        now: () => "2026-01-02T08:00:00.000Z",
      }),
    );
    const port = await startServer(server);

    try {
      const response = await fetch(`http://127.0.0.1:${port}/api/entries`);

      expect(response.status).toBe(200);
      expect(repository.list).toHaveBeenCalledOnce();
      expect(await response.json()).toEqual([newerEntry, olderEntry]);
    } finally {
      await stopServer(server);
    }
  });

  it("returns an existing entry through GET /api/entries/:id", async () => {
    const entry: DiaryEntry = {
      id: "entry-1",
      title: "A saved entry",
      content: "Its full content",
      entryDate: "2026-01-02",
      tags: ["work"],
      createdAt: "2026-01-02T08:00:00.000Z",
      updatedAt: "2026-01-02T08:00:00.000Z",
    };
    const repository = {
      save: vi.fn(async (savedEntry: DiaryEntry) => savedEntry),
      list: vi.fn(async () => []),
      findById: vi.fn(async (id: string) => (id === entry.id ? entry : undefined)),
      update: vi.fn(async (entryToUpdate: DiaryEntry) => entryToUpdate),
      deleteById: vi.fn(async () => false),
    };
    const server = createServer(
      createDiaryApi({
        repository,
        generateId: () => "generated-id",
        now: () => "2026-01-02T08:00:00.000Z",
      }),
    );
    const port = await startServer(server);

    try {
      const response = await fetch(`http://127.0.0.1:${port}/api/entries/${entry.id}`);

      expect(response.status).toBe(200);
      expect(repository.findById).toHaveBeenCalledWith(entry.id);
      expect(await response.json()).toEqual(entry);
    } finally {
      await stopServer(server);
    }
  });

  it("returns 404 when GET /api/entries/:id does not find an entry", async () => {
    const repository = {
      save: vi.fn(async (entry: DiaryEntry) => entry),
      list: vi.fn(async () => []),
      findById: vi.fn(async () => undefined),
      update: vi.fn(async (entry: DiaryEntry) => entry),
      deleteById: vi.fn(async () => false),
    };
    const server = createServer(
      createDiaryApi({
        repository,
        generateId: () => "generated-id",
        now: () => "2026-01-02T08:00:00.000Z",
      }),
    );
    const port = await startServer(server);

    try {
      const response = await fetch("http://127.0.0.1:" + port + "/api/entries/missing-entry");

      expect(response.status).toBe(404);
      expect(repository.findById).toHaveBeenCalledWith("missing-entry");
    } finally {
      await stopServer(server);
    }
  });

  it("updates an existing entry through PUT /api/entries/:id", async () => {
    const existingEntry: DiaryEntry = {
      id: "entry-1",
      title: "A saved entry",
      content: "Its original content",
      entryDate: "2026-01-01",
      tags: ["work"],
      createdAt: "2026-01-01T08:00:00.000Z",
      updatedAt: "2026-01-01T08:00:00.000Z",
    };
    const updatedEntry: DiaryEntry = {
      id: existingEntry.id,
      title: "An updated entry",
      content: "Its revised content",
      entryDate: "2026-01-02",
      tags: ["home", "Work"],
      createdAt: existingEntry.createdAt,
      updatedAt: "2026-01-02T08:00:00.000Z",
    };
    const repository = {
      save: vi.fn(async (entry: DiaryEntry) => entry),
      list: vi.fn(async () => []),
      findById: vi.fn(async (id: string) =>
        id === existingEntry.id ? existingEntry : undefined,
      ),
      update: vi.fn(async (entry: DiaryEntry) => entry),
      deleteById: vi.fn(async () => false),
    };
    const server = createServer(
      createDiaryApi({
        repository,
        generateId: () => "generated-id",
        now: () => updatedEntry.updatedAt,
      }),
    );
    const port = await startServer(server);

    try {
      const response = await fetch(`http://127.0.0.1:${port}/api/entries/${existingEntry.id}`, {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          title: " An updated entry ",
          content: " Its revised content ",
          entryDate: updatedEntry.entryDate,
          tags: ["home", " Home ", "Work", ""],
        }),
      });

      expect(response.status).toBe(200);
      expect(repository.update).toHaveBeenCalledWith(updatedEntry);
      expect(await response.json()).toEqual(updatedEntry);
    } finally {
      await stopServer(server);
    }
  });

  it("returns 404 when PUT /api/entries/:id does not find an entry", async () => {
    const repository = {
      save: vi.fn(async (entry: DiaryEntry) => entry),
      list: vi.fn(async () => []),
      findById: vi.fn(async () => undefined),
      update: vi.fn(async (entry: DiaryEntry) => entry),
      deleteById: vi.fn(async () => false),
    };
    const server = createServer(
      createDiaryApi({
        repository,
        generateId: () => "generated-id",
        now: () => "2026-01-02T08:00:00.000Z",
      }),
    );
    const port = await startServer(server);

    try {
      const response = await fetch("http://127.0.0.1:" + port + "/api/entries/missing-entry", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          title: "An updated entry",
          content: "Its revised content",
          entryDate: "2026-01-02",
          tags: [],
        }),
      });

      expect(response.status).toBe(404);
      expect(repository.findById).toHaveBeenCalledWith("missing-entry");
      expect(repository.update).not.toHaveBeenCalled();
    } finally {
      await stopServer(server);
    }
  });

  it("deletes an existing entry through DELETE /api/entries/:id", async () => {
    const repository = {
      save: vi.fn(async (entry: DiaryEntry) => entry),
      list: vi.fn(async () => []),
      findById: vi.fn(async () => undefined),
      update: vi.fn(async (entry: DiaryEntry) => entry),
      deleteById: vi.fn(async () => true),
    };
    const server = createServer(
      createDiaryApi({
        repository,
        generateId: () => "generated-id",
        now: () => "2026-01-02T08:00:00.000Z",
      }),
    );
    const port = await startServer(server);

    try {
      const response = await fetch("http://127.0.0.1:" + port + "/api/entries/entry-1", {
        method: "DELETE",
      });

      expect(response.status).toBe(204);
      expect(repository.deleteById).toHaveBeenCalledWith("entry-1");
      expect(await response.text()).toBe("");
    } finally {
      await stopServer(server);
    }
  });

  it("returns 404 when DELETE /api/entries/:id does not find an entry", async () => {
    const repository = {
      save: vi.fn(async (entry: DiaryEntry) => entry),
      list: vi.fn(async () => []),
      findById: vi.fn(async () => undefined),
      update: vi.fn(async (entry: DiaryEntry) => entry),
      deleteById: vi.fn(async () => false),
    };
    const server = createServer(
      createDiaryApi({
        repository,
        generateId: () => "generated-id",
        now: () => "2026-01-02T08:00:00.000Z",
      }),
    );
    const port = await startServer(server);

    try {
      const response = await fetch("http://127.0.0.1:" + port + "/api/entries/missing-entry", {
        method: "DELETE",
      });

      expect(response.status).toBe(404);
      expect(repository.deleteById).toHaveBeenCalledWith("missing-entry");
      expect(await response.json()).toEqual({ message: "Diary entry not found." });
    } finally {
      await stopServer(server);
    }
  });

  it("returns a non-sensitive error without reporting a successful save when persistence fails", async () => {
    const privateTitle = "A private fictional title";
    const privateContent = "A private fictional detail";
    const privateTag = "private-fictional-tag";
    const repository = {
      save: vi.fn(async () => {
        throw new Error(
          `Unable to store ${privateTitle}: ${privateContent} (${privateTag})`,
        );
      }),
      list: vi.fn(async () => []),
      findById: vi.fn(async () => undefined),
      update: vi.fn(async (entry: DiaryEntry) => entry),
      deleteById: vi.fn(async () => false),
    };
    const server = createServer(
      createDiaryApi({
        repository,
        generateId: () => "generated-id",
        now: () => "2026-01-02T08:00:00.000Z",
      }),
    );
    const port = await startServer(server);

    try {
      const response = await fetch(`http://127.0.0.1:${port}/api/entries`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          title: privateTitle,
          content: privateContent,
          entryDate: "2026-01-02",
          tags: [privateTag],
        }),
      });
      const responseBody = await response.text();

      expect(response.status).toBe(500);
      expect(responseBody).toContain("Unable to save diary entry.");
      expect(responseBody).not.toContain(privateTitle);
      expect(responseBody).not.toContain(privateContent);
      expect(responseBody).not.toContain(privateTag);
    } finally {
      await stopServer(server);
    }
  });

  it("returns a deletion-specific non-sensitive error and keeps the entry available when deletion fails", async () => {
    const entry: DiaryEntry = {
      id: "entry-1",
      title: "An existing fictional entry",
      content: "It remains available after a failed deletion.",
      entryDate: "2026-01-02",
      tags: ["fictional"],
      createdAt: "2026-01-02T08:00:00.000Z",
      updatedAt: "2026-01-02T08:00:00.000Z",
    };
    const repository = {
      save: vi.fn(async (savedEntry: DiaryEntry) => savedEntry),
      list: vi.fn(async () => [entry]),
      findById: vi.fn(async (id: string) => (id === entry.id ? entry : undefined)),
      update: vi.fn(async (entryToUpdate: DiaryEntry) => entryToUpdate),
      deleteById: vi.fn(async () => {
        throw new Error(`Unable to delete ${entry.title}: ${entry.content}`);
      }),
    };
    const server = createServer(
      createDiaryApi({
        repository,
        generateId: () => "generated-id",
        now: () => "2026-01-02T08:00:00.000Z",
      }),
    );
    const port = await startServer(server);

    try {
      const deletionResponse = await fetch(
        `http://127.0.0.1:${port}/api/entries/${entry.id}`,
        { method: "DELETE" },
      );
      const deletionBody = await deletionResponse.text();
      const getResponse = await fetch(
        `http://127.0.0.1:${port}/api/entries/${entry.id}`,
      );

      expect(deletionResponse.status).toBe(500);
      expect(deletionBody).toContain("Unable to delete diary entry.");
      expect(deletionBody).not.toContain(entry.title);
      expect(deletionBody).not.toContain(entry.content);
      expect(getResponse.status).toBe(200);
      expect(await getResponse.json()).toEqual(entry);
    } finally {
      await stopServer(server);
    }
  });

  it("returns an update-specific non-sensitive error when persistence fails during editing", async () => {
    const existingEntry: DiaryEntry = {
      id: "entry-1",
      title: "An existing fictional entry",
      content: "Its original fictional content.",
      entryDate: "2026-01-01",
      tags: [],
      createdAt: "2026-01-01T08:00:00.000Z",
      updatedAt: "2026-01-01T08:00:00.000Z",
    };
    const privateTitle = "An updated private fictional title";
    const privateContent = "An updated private fictional detail";
    const repository = {
      save: vi.fn(async (entry: DiaryEntry) => entry),
      list: vi.fn(async () => [existingEntry]),
      findById: vi.fn(async (id: string) =>
        id === existingEntry.id ? existingEntry : undefined,
      ),
      update: vi.fn(async () => {
        throw new Error(`Unable to update ${privateTitle}: ${privateContent}`);
      }),
      deleteById: vi.fn(async () => false),
    };
    const server = createServer(
      createDiaryApi({
        repository,
        generateId: () => "generated-id",
        now: () => "2026-01-02T08:00:00.000Z",
      }),
    );
    const port = await startServer(server);

    try {
      const response = await fetch(
        `http://127.0.0.1:${port}/api/entries/${existingEntry.id}`,
        {
          method: "PUT",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            title: privateTitle,
            content: privateContent,
            entryDate: "2026-01-02",
            tags: [],
          }),
        },
      );
      const responseBody = await response.text();

      expect(response.status).toBe(500);
      expect(responseBody).toContain("Unable to update diary entry.");
      expect(responseBody).not.toContain(privateTitle);
      expect(responseBody).not.toContain(privateContent);
    } finally {
      await stopServer(server);
    }
  });

  it("rejects a structurally invalid create request without saving an entry", async () => {
    const repository = {
      save: vi.fn(async (entry: DiaryEntry) => entry),
      list: vi.fn(async () => []),
      findById: vi.fn(async () => undefined),
      update: vi.fn(async (entry: DiaryEntry) => entry),
      deleteById: vi.fn(async () => false),
    };
    const server = createServer(
      createDiaryApi({
        repository,
        generateId: () => "generated-id",
        now: () => "2026-01-02T08:00:00.000Z",
      }),
    );
    const port = await startServer(server);

    try {
      const response = await fetch(`http://127.0.0.1:${port}/api/entries`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          title: "A fictional entry",
          content: "Its fictional content.",
          entryDate: "2026-01-02",
        }),
      });

      expect(response.status).toBe(400);
      expect(await response.json()).toEqual({ message: "Invalid diary entry." });
      expect(repository.save).not.toHaveBeenCalled();
    } finally {
      await stopServer(server);
    }
  });

  it("returns required-field validation errors from a create request without saving", async () => {
    const repository = {
      save: vi.fn(async (entry: DiaryEntry) => entry),
      list: vi.fn(async () => []),
      findById: vi.fn(async () => undefined),
      update: vi.fn(async (entry: DiaryEntry) => entry),
      deleteById: vi.fn(async () => false),
    };
    const server = createServer(
      createDiaryApi({
        repository,
        generateId: () => "generated-id",
        now: () => "2026-01-02T08:00:00.000Z",
      }),
    );
    const port = await startServer(server);

    try {
      const response = await fetch(`http://127.0.0.1:${port}/api/entries`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          title: "  ",
          content: "Its fictional content.",
          entryDate: "2026-01-02",
          tags: [],
        }),
      });

      expect(response.status).toBe(400);
      expect(await response.json()).toEqual({
        errors: { title: "Title is required." },
      });
      expect(repository.save).not.toHaveBeenCalled();
    } finally {
      await stopServer(server);
    }
  });

  it("returns maximum-length validation errors from a create request without saving", async () => {
    const repository = {
      save: vi.fn(async (entry: DiaryEntry) => entry),
      list: vi.fn(async () => []),
      findById: vi.fn(async () => undefined),
      update: vi.fn(async (entry: DiaryEntry) => entry),
      deleteById: vi.fn(async () => false),
    };
    const server = createServer(
      createDiaryApi({
        repository,
        generateId: () => "generated-id",
        now: () => "2026-01-02T08:00:00.000Z",
      }),
    );
    const port = await startServer(server);

    try {
      const response = await fetch(`http://127.0.0.1:${port}/api/entries`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          title: "a".repeat(201),
          content: "Its fictional content.",
          entryDate: "2026-01-02",
          tags: [],
        }),
      });

      expect(response.status).toBe(400);
      expect(await response.json()).toEqual({
        errors: { title: "Title must be 200 characters or fewer." },
      });
      expect(repository.save).not.toHaveBeenCalled();
    } finally {
      await stopServer(server);
    }
  });

  it("returns a generic client error for malformed JSON without saving an entry", async () => {
    const repository = {
      save: vi.fn(async (entry: DiaryEntry) => entry),
      list: vi.fn(async () => []),
      findById: vi.fn(async () => undefined),
      update: vi.fn(async (entry: DiaryEntry) => entry),
      deleteById: vi.fn(async () => false),
    };
    const server = createServer(
      createDiaryApi({
        repository,
        generateId: () => "generated-id",
        now: () => "2026-01-02T08:00:00.000Z",
      }),
    );
    const port = await startServer(server);

    try {
      const response = await fetch(`http://127.0.0.1:${port}/api/entries`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: "{ malformed-json",
      });

      expect(response.status).toBe(400);
      expect(await response.json()).toEqual({ message: "Invalid diary entry." });
      expect(repository.save).not.toHaveBeenCalled();
    } finally {
      await stopServer(server);
    }
  });

  it("does not log sensitive fields when persistence operations fail", async () => {
    const privateTitle = "A private fictional title";
    const privateContent = "A private fictional detail";
    const privateTag = "private-fictional-tag";
    const existingEntry: DiaryEntry = {
      id: "entry-1",
      title: privateTitle,
      content: privateContent,
      entryDate: "2026-01-02",
      tags: [privateTag],
      createdAt: "2026-01-02T08:00:00.000Z",
      updatedAt: "2026-01-02T08:00:00.000Z",
    };
    const repository = {
      save: vi.fn(async () => {
        throw new Error(
          `Unable to store ${privateTitle}: ${privateContent} (${privateTag})`,
        );
      }),
      list: vi.fn(async () => [existingEntry]),
      findById: vi.fn(async () => existingEntry),
      update: vi.fn(async () => {
        throw new Error(`Unable to update ${privateTitle}: ${privateContent}`);
      }),
      deleteById: vi.fn(async () => {
        throw new Error(`Unable to delete ${privateTitle}: ${privateTag}`);
      }),
    };
    const server = createServer(
      createDiaryApi({
        repository,
        generateId: () => "generated-id",
        now: () => "2026-01-02T08:00:00.000Z",
      }),
    );
    const logSpy = vi.spyOn(console, "log");
    const warnSpy = vi.spyOn(console, "warn");
    const errorSpy = vi.spyOn(console, "error");
    const port = await startServer(server);

    try {
      const createResponse = await fetch(
        `http://127.0.0.1:${port}/api/entries`,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            title: privateTitle,
            content: privateContent,
            entryDate: existingEntry.entryDate,
            tags: [privateTag],
          }),
        },
      );
      const updateResponse = await fetch(
        `http://127.0.0.1:${port}/api/entries/${existingEntry.id}`,
        {
          method: "PUT",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            title: privateTitle,
            content: privateContent,
            entryDate: existingEntry.entryDate,
            tags: [privateTag],
          }),
        },
      );
      const deleteResponse = await fetch(
        `http://127.0.0.1:${port}/api/entries/${existingEntry.id}`,
        { method: "DELETE" },
      );

      expect(createResponse.status).toBe(500);
      expect(updateResponse.status).toBe(500);
      expect(deleteResponse.status).toBe(500);
      expect(logSpy).not.toHaveBeenCalled();
      expect(warnSpy).not.toHaveBeenCalled();
      expect(errorSpy).not.toHaveBeenCalled();
    } finally {
      logSpy.mockRestore();
      warnSpy.mockRestore();
      errorSpy.mockRestore();
      await stopServer(server);
    }
  });

  it("does not expose or log sensitive fields when read operations fail", async () => {
    const privateTitle = "A private fictional title";
    const privateContent = "A private fictional detail";
    const privateTag = "private-fictional-tag";
    const repository = {
      save: vi.fn(async (entry: DiaryEntry) => entry),
      list: vi.fn(async () => {
        throw new Error(
          `Unable to list ${privateTitle}: ${privateContent} (${privateTag})`,
        );
      }),
      findById: vi.fn(async () => {
        throw new Error(
          `Unable to read ${privateTitle}: ${privateContent} (${privateTag})`,
        );
      }),
      update: vi.fn(async (entry: DiaryEntry) => entry),
      deleteById: vi.fn(async () => false),
    };
    const server = createServer(
      createDiaryApi({
        repository,
        generateId: () => "generated-id",
        now: () => "2026-01-02T08:00:00.000Z",
      }),
    );
    const logSpy = vi.spyOn(console, "log");
    const warnSpy = vi.spyOn(console, "warn");
    const errorSpy = vi.spyOn(console, "error");
    const port = await startServer(server);

    try {
      const listResponse = await fetch(
        `http://127.0.0.1:${port}/api/entries`,
      );
      const entryResponse = await fetch(
        `http://127.0.0.1:${port}/api/entries/entry-1`,
      );
      const listBody = await listResponse.text();
      const entryBody = await entryResponse.text();

      expect(listResponse.status).toBe(500);
      expect(entryResponse.status).toBe(500);
      expect(listBody).toContain("Unable to complete diary operation.");
      expect(entryBody).toContain("Unable to complete diary operation.");
      for (const privateValue of [privateTitle, privateContent, privateTag]) {
        expect(listBody).not.toContain(privateValue);
        expect(entryBody).not.toContain(privateValue);
      }
      expect(logSpy).not.toHaveBeenCalled();
      expect(warnSpy).not.toHaveBeenCalled();
      expect(errorSpy).not.toHaveBeenCalled();
    } finally {
      logSpy.mockRestore();
      warnSpy.mockRestore();
      errorSpy.mockRestore();
      await stopServer(server);
    }
  });
});
