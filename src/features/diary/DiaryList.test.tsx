import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { DiaryEntry } from "./application/createDiaryEntry";
import { DiaryList } from "./DiaryList";

const entries: readonly DiaryEntry[] = [
  {
    id: "entry-2",
    title: "An afternoon walk",
    content: "I walked through the park after lunch.",
    entryDate: "2026-08-17",
    tags: ["Outdoors"],
    createdAt: "2026-08-17T12:00:00.000Z",
    updatedAt: "2026-08-17T12:00:00.000Z",
  },
  {
    id: "entry-1",
    title: "A quiet morning",
    content: "I enjoyed a cup of tea before work.",
    entryDate: "2026-08-16",
    tags: ["Reflection"],
    createdAt: "2026-08-16T08:00:00.000Z",
    updatedAt: "2026-08-16T08:00:00.000Z",
  },
];

afterEach(cleanup);

describe("DiaryList", () => {
  it("shows an empty state and an action to create the first entry when no entries exist", () => {
    const onCreateEntry = vi.fn();

    render(
      <DiaryList
        entries={[]}
        onCreateEntry={onCreateEntry}
        onSelectEntry={vi.fn()}
      />,
    );

    expect(
      screen.getByRole("heading", { name: "Your diary is empty" }),
    ).toBeVisible();
    expect(
      screen.getByRole("button", { name: "Create your first entry" }),
    ).toBeVisible();
    expect(screen.queryAllByRole("listitem")).toHaveLength(0);
  });

  it("shows the title and entry date for every provided entry", () => {
    render(
      <DiaryList
        entries={entries}
        onCreateEntry={vi.fn()}
        onSelectEntry={vi.fn()}
      />,
    );

    expect(screen.getAllByRole("listitem")).toHaveLength(entries.length);
    expect(screen.getByRole("button", { name: "An afternoon walk" })).toBeVisible();
    expect(screen.getByText("2026-08-17")).toBeVisible();
    expect(screen.getByRole("button", { name: "A quiet morning" })).toBeVisible();
    expect(screen.getByText("2026-08-16")).toBeVisible();
  });

  it("reports the selected entry id when an entry is activated", () => {
    const onSelectEntry = vi.fn();

    render(
      <DiaryList
        entries={entries}
        onCreateEntry={vi.fn()}
        onSelectEntry={onSelectEntry}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "A quiet morning" }));

    expect(onSelectEntry).toHaveBeenCalledWith("entry-1");
  });
});
