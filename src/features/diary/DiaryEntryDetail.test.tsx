import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import type { DiaryEntry } from "./application/createDiaryEntry";
import { DiaryEntryDetail } from "./DiaryEntryDetail";

const entry: DiaryEntry = {
  id: "entry-123",
  title: "A quiet morning",
  content: "I enjoyed a cup of tea before work.",
  entryDate: "2026-08-16",
  tags: ["Reflection", "Morning"],
  createdAt: "2026-08-16T08:00:00.000Z",
  updatedAt: "2026-08-16T08:00:00.000Z",
};

describe("DiaryEntryDetail", () => {
  it("displays an entry's title, content, date, and tags", () => {
    render(<DiaryEntryDetail entry={entry} />);

    expect(
      screen.getByRole("heading", { name: "A quiet morning" }),
    ).toBeVisible();
    expect(
      screen.getByText("I enjoyed a cup of tea before work."),
    ).toBeVisible();
    expect(screen.getByText("2026-08-16")).toBeVisible();
    expect(screen.getByRole("list", { name: "Tags" })).toBeVisible();
    expect(screen.getByText("Reflection")).toBeVisible();
    expect(screen.getByText("Morning")).toBeVisible();
  });

  it("renders HTML-like entry content as text", () => {
    const content = "<strong>Private</strong>";

    render(<DiaryEntryDetail entry={{ ...entry, content }} />);

    expect(screen.getByText(content)).toBeVisible();
    expect(document.querySelector("strong")).not.toBeInTheDocument();
  });
});
