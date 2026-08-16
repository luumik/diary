import { join } from "node:path";

import { describe, expect, it, vi } from "vitest";

import { startLocalDiaryServer } from "./startLocalDiaryServer";

describe("startLocalDiaryServer", () => {
  it("starts the local API on port 3000 with the project's durable data path", async () => {
    const startServer = vi.fn(async () => ({
      url: "http://127.0.0.1:3000",
      close: async () => undefined,
    }));
    const createDirectory = vi.fn(async () => undefined);
    const projectRoot = join("C:", "diary-project");

    await startLocalDiaryServer({ projectRoot, createDirectory, startServer });

    expect(startServer).toHaveBeenCalledWith({
      databasePath: join(projectRoot, "data", "diary.sqlite"),
      port: 3000,
    });
  });

  it("creates the local data directory before opening the database", async () => {
    const startServer = vi.fn(async () => ({
      url: "http://127.0.0.1:3000",
      close: async () => undefined,
    }));
    const createDirectory = vi.fn(async () => undefined);
    const projectRoot = join("C:", "diary-project");

    await startLocalDiaryServer({ projectRoot, createDirectory, startServer });

    expect(createDirectory).toHaveBeenCalledWith(join(projectRoot, "data"));
  });
});
