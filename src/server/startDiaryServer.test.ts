import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { startDiaryServer } from "./startDiaryServer";

describe("startDiaryServer", () => {
  it("serves the diary API with a temporary SQLite database on loopback", async () => {
    const temporaryDirectory = await mkdtemp(join(tmpdir(), "diary-server-test-"));
    const databasePath = join(temporaryDirectory, "diary.sqlite");
    let server: Awaited<ReturnType<typeof startDiaryServer>> | undefined;

    try {
      server = await startDiaryServer({ databasePath });

      expect(new URL(server.url).hostname).toBe("127.0.0.1");

      const createResponse = await fetch(`${server.url}/api/entries`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          title: "A quiet morning",
          content: "I enjoyed a cup of tea before work.",
          entryDate: "2026-08-16",
          tags: ["Reflection"],
        }),
      });

      expect(createResponse.status).toBe(201);

      const listResponse = await fetch(`${server.url}/api/entries`);

      expect(listResponse.status).toBe(200);
      expect(await listResponse.json()).toEqual([
        expect.objectContaining({
          title: "A quiet morning",
          content: "I enjoyed a cup of tea before work.",
          entryDate: "2026-08-16",
          tags: ["Reflection"],
        }),
      ]);
    } finally {
      await server?.close();
      await rm(temporaryDirectory, { recursive: true, force: true });
    }
  });
});
