import { describe, expect, it, vi } from "vitest";

import { deleteDiaryEntry } from "./deleteDiaryEntry";

describe("deleteDiaryEntry", () => {
  it("deletes an existing entry", async () => {
    const repository = {
      deleteById: vi.fn(async () => true),
    };

    const result = await deleteDiaryEntry({
      id: "entry-123",
      repository,
    });

    expect(repository.deleteById).toHaveBeenCalledWith("entry-123");
    expect(result).toEqual({ deleted: true });
  });

  it("returns not deleted when the requested entry does not exist", async () => {
    const repository = {
      deleteById: vi.fn(async () => false),
    };

    const result = await deleteDiaryEntry({
      id: "missing-entry",
      repository,
    });

    expect(repository.deleteById).toHaveBeenCalledWith("missing-entry");
    expect(result).toEqual({ deleted: false });
  });
});
