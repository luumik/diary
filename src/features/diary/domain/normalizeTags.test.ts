import { describe, expect, it } from "vitest";

import { normalizeTags } from "./normalizeTags";

describe("normalizeTags", () => {
  it("trims tags, discards empty values, and removes case-insensitive duplicates", () => {
    expect(
      normalizeTags([
        " Morning ",
        "",
        "morning",
        "  Work",
        "work ",
        "   ",
      ]),
    ).toEqual(["Morning", "Work"]);
  });
});
