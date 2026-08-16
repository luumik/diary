import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import type {
  CreateDiaryEntryResult,
  DiaryEntry,
} from "./application/createDiaryEntry";
import type { DeleteDiaryEntryResult } from "./application/deleteDiaryEntry";
import type { UpdateDiaryEntryResult } from "./application/updateDiaryEntry";
import type { DiaryEntryInput } from "./domain/validateDiaryEntryInput";
import { DiaryBrowser } from "./DiaryBrowser";

const entry: DiaryEntry = {
  id: "entry-123",
  title: "A quiet morning",
  content: "I enjoyed a cup of tea before work.",
  entryDate: "2026-08-16",
  tags: ["Reflection"],
  createdAt: "2026-08-16T08:00:00.000Z",
  updatedAt: "2026-08-16T08:00:00.000Z",
};

function renderCreateBrowser(
  createEntry: (input: DiaryEntryInput) => Promise<CreateDiaryEntryResult>,
  entries: readonly DiaryEntry[] = [],
) {
  const props: React.ComponentProps<typeof DiaryBrowser> = {
    loadEntries: vi.fn(async () => entries),
    loadEntry: vi.fn(async () => undefined),
    createEntry,
    updateEntry: vi.fn(async () => ({
      found: true as const,
      isValid: true as const,
      entry,
    })),
    deleteEntry: vi.fn(async () => ({ deleted: true as const })),
    today: () => "2026-08-16",
  };

  render(<DiaryBrowser {...props} />);
}

function renderUpdateBrowser(
  updateEntry: (
    id: string,
    input: DiaryEntryInput,
  ) => Promise<UpdateDiaryEntryResult>,
) {
  const props: React.ComponentProps<typeof DiaryBrowser> = {
    loadEntries: vi.fn(async () => [entry]),
    loadEntry: vi.fn(async () => entry),
    createEntry: vi.fn(async () => ({ isValid: true as const, entry })),
    today: () => "2026-08-16",
    updateEntry,
    deleteEntry: vi.fn(async () => ({ deleted: true as const })),
  };

  render(<DiaryBrowser {...props} />);
}

function renderDeleteBrowser(
  deleteEntry: (id: string) => Promise<DeleteDiaryEntryResult>,
) {
  const otherEntry: DiaryEntry = {
    ...entry,
    id: "entry-456",
    title: "An afternoon walk",
    content: "I walked through the park after lunch.",
    entryDate: "2026-08-15",
  };
  const props: React.ComponentProps<typeof DiaryBrowser> = {
    loadEntries: vi.fn(async () => [entry, otherEntry]),
    loadEntry: vi.fn(async (id: string) => (id === entry.id ? entry : undefined)),
    createEntry: vi.fn(async () => ({ isValid: true as const, entry })),
    updateEntry: vi.fn(async () => ({
      found: true as const,
      isValid: true as const,
      entry,
    })),
    today: () => "2026-08-16",
    deleteEntry,
  };

  render(<DiaryBrowser {...props} />);
}

afterEach(cleanup);

describe("DiaryBrowser", () => {
  it("shows loading feedback before displaying the loaded entry list", async () => {
    let resolveEntries: (entries: readonly DiaryEntry[]) => void = () => undefined;
    const entriesPromise = new Promise<readonly DiaryEntry[]>((resolve) => {
      resolveEntries = resolve;
    });
    const loadEntries = vi.fn(() => entriesPromise);

    render(
      <DiaryBrowser
        loadEntries={loadEntries}
        loadEntry={vi.fn(async () => undefined)}
        createEntry={vi.fn(async () => ({ isValid: true as const, entry }))}
        updateEntry={vi.fn(async () => ({
          found: true as const,
          isValid: true as const,
          entry,
        }))}
        deleteEntry={vi.fn(async () => ({ deleted: true as const }))}
        today={() => "2026-08-16"}
      />,
    );

    expect(screen.getByRole("status")).toHaveTextContent("Loading entries…");
    expect(loadEntries).toHaveBeenCalledOnce();

    await act(async () => {
      resolveEntries([entry]);
    });

    expect(
      await screen.findByRole("button", { name: "A quiet morning" }),
    ).toBeVisible();
  });

  it("loads and displays the complete selected entry", async () => {
    const loadEntry = vi.fn(async (id: string) =>
      id === entry.id ? entry : undefined,
    );

    render(
      <DiaryBrowser
        loadEntries={vi.fn(async () => [entry])}
        loadEntry={loadEntry}
        createEntry={vi.fn(async () => ({ isValid: true as const, entry }))}
        updateEntry={vi.fn(async () => ({
          found: true as const,
          isValid: true as const,
          entry,
        }))}
        deleteEntry={vi.fn(async () => ({ deleted: true as const }))}
        today={() => "2026-08-16"}
      />,
    );

    fireEvent.click(
      await screen.findByRole("button", { name: "A quiet morning" }),
    );

    expect(loadEntry).toHaveBeenCalledWith(entry.id);
    expect(
      await screen.findByRole("heading", { name: "A quiet morning" }),
    ).toBeVisible();
    expect(
      screen.getByText("I enjoyed a cup of tea before work."),
    ).toBeVisible();
    expect(screen.getByText("Reflection")).toBeVisible();
  });

  it("returns to the entry list from the selected entry detail", async () => {
    render(
      <DiaryBrowser
        loadEntries={vi.fn(async () => [entry])}
        loadEntry={vi.fn(async () => entry)}
        createEntry={vi.fn(async () => ({ isValid: true as const, entry }))}
        updateEntry={vi.fn(async () => ({
          found: true as const,
          isValid: true as const,
          entry,
        }))}
        deleteEntry={vi.fn(async () => ({ deleted: true as const }))}
        today={() => "2026-08-16"}
      />,
    );

    fireEvent.click(
      await screen.findByRole("button", { name: "A quiet morning" }),
    );
    await screen.findByRole("heading", { name: "A quiet morning" });

    fireEvent.click(screen.getByRole("button", { name: "Back to entries" }));

    expect(
      await screen.findByRole("button", { name: "A quiet morning" }),
    ).toBeVisible();
  });

  it("shows a not-found state with a route back to the entry list", async () => {
    render(
      <DiaryBrowser
        loadEntries={vi.fn(async () => [entry])}
        loadEntry={vi.fn(async () => undefined)}
        createEntry={vi.fn(async () => ({ isValid: true as const, entry }))}
        updateEntry={vi.fn(async () => ({
          found: true as const,
          isValid: true as const,
          entry,
        }))}
        deleteEntry={vi.fn(async () => ({ deleted: true as const }))}
        today={() => "2026-08-16"}
      />,
    );

    fireEvent.click(
      await screen.findByRole("button", { name: "A quiet morning" }),
    );

    expect(
      await screen.findByRole("heading", { name: "Entry not found" }),
    ).toBeVisible();

    fireEvent.click(screen.getByRole("button", { name: "Back to entries" }));

    expect(
      await screen.findByRole("button", { name: "A quiet morning" }),
    ).toBeVisible();
  });

  it("shows loading feedback while the selected entry is loading", async () => {
    let resolveEntry: (loadedEntry: DiaryEntry | undefined) => void = () => undefined;
    const entryPromise = new Promise<DiaryEntry | undefined>((resolve) => {
      resolveEntry = resolve;
    });

    render(
      <DiaryBrowser
        loadEntries={vi.fn(async () => [entry])}
        loadEntry={vi.fn(() => entryPromise)}
        createEntry={vi.fn(async () => ({ isValid: true as const, entry }))}
        updateEntry={vi.fn(async () => ({
          found: true as const,
          isValid: true as const,
          entry,
        }))}
        deleteEntry={vi.fn(async () => ({ deleted: true as const }))}
        today={() => "2026-08-16"}
      />,
    );

    fireEvent.click(
      await screen.findByRole("button", { name: "A quiet morning" }),
    );

    expect(screen.getByRole("status")).toHaveTextContent("Loading entry…");

    await act(async () => {
      resolveEntry(entry);
    });

    expect(
      await screen.findByRole("heading", { name: "A quiet morning" }),
    ).toBeVisible();
  });

  it("opens the new-entry form from the empty diary action", async () => {
    renderCreateBrowser(
      vi.fn(async () => ({ isValid: true as const, entry })),
    );

    fireEvent.click(
      await screen.findByRole("button", { name: "Create your first entry" }),
    );

    expect(screen.getByLabelText("Title")).toBeVisible();
    expect(screen.getByLabelText("Content")).toBeVisible();
    expect(screen.getByLabelText("Entry date")).toHaveValue("2026-08-16");
    expect(screen.getByRole("button", { name: "Save entry" })).toBeVisible();
  });

  it("saves a new entry and opens its detail with success feedback", async () => {
    const createEntry = vi.fn(async () => ({ isValid: true as const, entry }));

    renderCreateBrowser(createEntry);

    fireEvent.click(
      await screen.findByRole("button", { name: "Create your first entry" }),
    );
    fireEvent.change(screen.getByLabelText("Title"), {
      target: { value: entry.title },
    });
    fireEvent.change(screen.getByLabelText("Content"), {
      target: { value: entry.content },
    });
    fireEvent.change(screen.getByLabelText("Tags"), {
      target: { value: "Reflection" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save entry" }));

    expect(createEntry).toHaveBeenCalledWith({
      title: entry.title,
      content: entry.content,
      entryDate: "2026-08-16",
      tags: ["Reflection"],
    });
    expect(
      await screen.findByRole("heading", { name: entry.title }),
    ).toBeVisible();
    expect(screen.getByRole("status")).toHaveTextContent("Entry saved.");
  });

  it("shows a non-sensitive error when saving a new entry fails", async () => {
    const createEntry = vi.fn(async () => {
      throw new Error("Storage unavailable");
    });

    renderCreateBrowser(createEntry);

    fireEvent.click(
      await screen.findByRole("button", { name: "Create your first entry" }),
    );
    fireEvent.change(screen.getByLabelText("Title"), {
      target: { value: entry.title },
    });
    fireEvent.change(screen.getByLabelText("Content"), {
      target: { value: entry.content },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save entry" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Unable to save diary entry.",
    );
    expect(screen.queryByText("Storage unavailable")).not.toBeInTheDocument();
  });

  it("keeps a new entry form usable after a save failure", async () => {
    let shouldFail = true;
    const createEntry = vi.fn(
      async (_input: DiaryEntryInput): Promise<CreateDiaryEntryResult> => {
        if (shouldFail) {
          shouldFail = false;
          throw new Error("Storage unavailable");
        }

        return { isValid: true as const, entry };
      },
    );

    renderCreateBrowser(createEntry);

    fireEvent.click(
      await screen.findByRole("button", { name: "Create your first entry" }),
    );
    fireEvent.change(screen.getByLabelText("Title"), {
      target: { value: entry.title },
    });
    fireEvent.change(screen.getByLabelText("Content"), {
      target: { value: entry.content },
    });
    fireEvent.change(screen.getByLabelText("Tags"), {
      target: { value: "Reflection, Morning" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save entry" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Unable to save diary entry.",
    );
    expect(screen.getByLabelText("Title")).toHaveValue(entry.title);
    expect(screen.getByLabelText("Content")).toHaveValue(entry.content);
    expect(screen.getByLabelText("Tags")).toHaveValue("Reflection, Morning");

    fireEvent.click(screen.getByRole("button", { name: "Save entry" }));

    expect(
      await screen.findByRole("heading", { name: entry.title }),
    ).toBeVisible();
    expect(createEntry).toHaveBeenCalledTimes(2);
  });

  it("opens the new-entry form from an existing entry list", async () => {
    renderCreateBrowser(
      vi.fn(async () => ({ isValid: true as const, entry })),
      [entry],
    );

    fireEvent.click(await screen.findByRole("button", { name: "New entry" }));

    expect(screen.getByLabelText("Title")).toBeVisible();
  });

  it("opens an edit form prefilled with the selected entry", async () => {
    renderUpdateBrowser(
      vi.fn(async () => ({ found: true as const, isValid: true as const, entry })),
    );

    fireEvent.click(
      await screen.findByRole("button", { name: entry.title }),
    );
    await screen.findByRole("heading", { name: entry.title });
    fireEvent.click(screen.getByRole("button", { name: "Edit entry" }));

    expect(screen.getByLabelText("Title")).toHaveValue(entry.title);
    expect(screen.getByLabelText("Content")).toHaveValue(entry.content);
    expect(screen.getByLabelText("Entry date")).toHaveValue(entry.entryDate);
    expect(screen.getByLabelText("Tags")).toHaveValue("Reflection");
    expect(screen.getByRole("button", { name: "Save changes" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Cancel editing" })).toBeVisible();
  });

  it("cancels editing without persisting changed values", async () => {
    const updateEntry = vi.fn(async () => ({
      found: true as const,
      isValid: true as const,
      entry,
    }));

    renderUpdateBrowser(updateEntry);

    fireEvent.click(
      await screen.findByRole("button", { name: entry.title }),
    );
    await screen.findByRole("heading", { name: entry.title });
    fireEvent.click(screen.getByRole("button", { name: "Edit entry" }));
    fireEvent.change(screen.getByLabelText("Title"), {
      target: { value: "An unsaved change" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Cancel editing" }));

    expect(updateEntry).not.toHaveBeenCalled();
    expect(
      await screen.findByRole("heading", { name: entry.title }),
    ).toBeVisible();
  });

  it("returns focus to editing after cancelling an edit", async () => {
    renderUpdateBrowser(async () => ({
      found: true as const,
      isValid: true as const,
      entry,
    }));

    fireEvent.click(await screen.findByRole("button", { name: entry.title }));
    await screen.findByRole("heading", { name: entry.title });
    fireEvent.click(screen.getByRole("button", { name: "Edit entry" }));
    const cancelButton = screen.getByRole("button", {
      name: "Cancel editing",
    });
    cancelButton.focus();
    fireEvent.click(cancelButton);

    await screen.findByRole("heading", { name: entry.title });
    expect(screen.getByRole("button", { name: "Edit entry" })).toHaveFocus();
  });

  it("saves changed values and displays the updated entry", async () => {
    const updatedEntry: DiaryEntry = {
      ...entry,
      title: "A productive afternoon",
      content: "I completed my planned work.",
      tags: ["Work"],
      updatedAt: "2026-08-16T12:00:00.000Z",
    };
    const updateEntry = vi.fn(async () => ({
      found: true as const,
      isValid: true as const,
      entry: updatedEntry,
    }));

    renderUpdateBrowser(updateEntry);

    fireEvent.click(
      await screen.findByRole("button", { name: entry.title }),
    );
    await screen.findByRole("heading", { name: entry.title });
    fireEvent.click(screen.getByRole("button", { name: "Edit entry" }));
    fireEvent.change(screen.getByLabelText("Title"), {
      target: { value: updatedEntry.title },
    });
    fireEvent.change(screen.getByLabelText("Content"), {
      target: { value: updatedEntry.content },
    });
    fireEvent.change(screen.getByLabelText("Tags"), {
      target: { value: "Work" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save changes" }));

    expect(updateEntry).toHaveBeenCalledWith(entry.id, {
      title: updatedEntry.title,
      content: updatedEntry.content,
      entryDate: entry.entryDate,
      tags: ["Work"],
    });
    expect(
      await screen.findByRole("heading", { name: updatedEntry.title }),
    ).toBeVisible();
    expect(screen.getByRole("status")).toHaveTextContent("Entry updated.");
  });

  it("shows a not-found state when the entry disappears before saving edits", async () => {
    renderUpdateBrowser(vi.fn(async () => ({ found: false as const })));

    fireEvent.click(
      await screen.findByRole("button", { name: entry.title }),
    );
    await screen.findByRole("heading", { name: entry.title });
    fireEvent.click(screen.getByRole("button", { name: "Edit entry" }));
    fireEvent.click(screen.getByRole("button", { name: "Save changes" }));

    expect(
      await screen.findByRole("heading", { name: "Entry not found" }),
    ).toBeVisible();
    expect(screen.getByRole("button", { name: "Back to entries" })).toBeVisible();
  });

  it("shows a non-sensitive error when saving edits fails", async () => {
    const updateEntry = vi.fn(async () => {
      throw new Error("Database unavailable");
    });

    renderUpdateBrowser(updateEntry);

    fireEvent.click(
      await screen.findByRole("button", { name: entry.title }),
    );
    await screen.findByRole("heading", { name: entry.title });
    fireEvent.click(screen.getByRole("button", { name: "Edit entry" }));
    fireEvent.click(screen.getByRole("button", { name: "Save changes" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Unable to update diary entry.",
    );
    expect(screen.queryByText("Database unavailable")).not.toBeInTheDocument();
  });

  it("requests explicit confirmation and identifies the selected entry before deleting", async () => {
    const deleteEntry = vi.fn(async () => ({ deleted: true as const }));

    renderDeleteBrowser(deleteEntry);

    fireEvent.click(
      await screen.findByRole("button", { name: entry.title }),
    );
    await screen.findByRole("heading", { name: entry.title });
    fireEvent.click(screen.getByRole("button", { name: "Delete entry" }));

    expect(screen.getByRole("alertdialog")).toBeVisible();
    expect(screen.getByRole("alertdialog")).toHaveTextContent(entry.title);
    expect(
      screen.getByRole("button", { name: "Confirm deletion" }),
    ).toBeVisible();
    expect(screen.getByRole("button", { name: "Cancel deletion" })).toBeVisible();
    expect(deleteEntry).not.toHaveBeenCalled();
  });

  it("marks the deletion action as destructive", async () => {
    renderDeleteBrowser(async () => ({ deleted: true as const }));

    fireEvent.click(await screen.findByRole("button", { name: entry.title }));
    await screen.findByRole("heading", { name: entry.title });

    expect(screen.getByRole("button", { name: "Delete entry" })).toHaveClass(
      "destructive-action",
    );
  });

  it("marks the confirmed deletion action as destructive", async () => {
    renderDeleteBrowser(async () => ({ deleted: true as const }));

    fireEvent.click(await screen.findByRole("button", { name: entry.title }));
    await screen.findByRole("heading", { name: entry.title });
    fireEvent.click(screen.getByRole("button", { name: "Delete entry" }));

    expect(
      screen.getByRole("button", { name: "Confirm deletion" }),
    ).toHaveClass("destructive-action");
  });

  it("cancels deletion without removing the selected entry", async () => {
    const deleteEntry = vi.fn(async () => ({ deleted: true as const }));

    renderDeleteBrowser(deleteEntry);

    fireEvent.click(
      await screen.findByRole("button", { name: entry.title }),
    );
    await screen.findByRole("heading", { name: entry.title });
    fireEvent.click(screen.getByRole("button", { name: "Delete entry" }));
    fireEvent.click(screen.getByRole("button", { name: "Cancel deletion" }));

    expect(deleteEntry).not.toHaveBeenCalled();
    expect(
      await screen.findByRole("heading", { name: entry.title }),
    ).toBeVisible();
  });

  it("deletes a confirmed entry and returns to the entry list with feedback", async () => {
    const deleteEntry = vi.fn(async () => ({ deleted: true as const }));

    renderDeleteBrowser(deleteEntry);

    fireEvent.click(
      await screen.findByRole("button", { name: entry.title }),
    );
    await screen.findByRole("heading", { name: entry.title });
    fireEvent.click(screen.getByRole("button", { name: "Delete entry" }));
    fireEvent.click(screen.getByRole("button", { name: "Confirm deletion" }));

    expect(deleteEntry).toHaveBeenCalledWith(entry.id);
    expect(
      await screen.findByRole("button", { name: "An afternoon walk" }),
    ).toBeVisible();
    expect(
      screen.queryByRole("button", { name: entry.title }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("Entry deleted.");
  });

  it("shows deletion feedback and prevents duplicate confirmation while deleting", async () => {
    let resolveDeletion: (result: DeleteDiaryEntryResult) => void = () => undefined;
    const deletionPromise = new Promise<DeleteDiaryEntryResult>((resolve) => {
      resolveDeletion = resolve;
    });
    const deleteEntry = vi.fn(() => deletionPromise);

    renderDeleteBrowser(deleteEntry);

    fireEvent.click(
      await screen.findByRole("button", { name: entry.title }),
    );
    await screen.findByRole("heading", { name: entry.title });
    fireEvent.click(screen.getByRole("button", { name: "Delete entry" }));

    const confirmButton = screen.getByRole("button", {
      name: "Confirm deletion",
    });
    fireEvent.click(confirmButton);
    fireEvent.click(confirmButton);

    expect(screen.getByRole("status")).toHaveTextContent("Deleting entry…");
    expect(confirmButton).toBeDisabled();
    expect(deleteEntry).toHaveBeenCalledOnce();

    await act(async () => {
      resolveDeletion({ deleted: true });
    });
  });

  it("shows a not-found state when the entry disappears before deletion", async () => {
    renderDeleteBrowser(vi.fn(async () => ({ deleted: false as const })));

    fireEvent.click(
      await screen.findByRole("button", { name: entry.title }),
    );
    await screen.findByRole("heading", { name: entry.title });
    fireEvent.click(screen.getByRole("button", { name: "Delete entry" }));
    fireEvent.click(screen.getByRole("button", { name: "Confirm deletion" }));

    expect(
      await screen.findByRole("heading", { name: "Entry not found" }),
    ).toBeVisible();
    expect(screen.getByRole("button", { name: "Back to entries" })).toBeVisible();
  });

  it("shows a non-sensitive error when deletion fails", async () => {
    const deleteEntry = vi.fn(async () => {
      throw new Error("Storage unavailable");
    });

    renderDeleteBrowser(deleteEntry);

    fireEvent.click(
      await screen.findByRole("button", { name: entry.title }),
    );
    await screen.findByRole("heading", { name: entry.title });
    fireEvent.click(screen.getByRole("button", { name: "Delete entry" }));
    fireEvent.click(screen.getByRole("button", { name: "Confirm deletion" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Unable to delete diary entry.",
    );
    expect(screen.queryByText("Storage unavailable")).not.toBeInTheDocument();
  });

  it("moves focus to the title field when opening the new-entry form", async () => {
    renderCreateBrowser(async () => ({ isValid: true as const, entry }));

    fireEvent.click(
      await screen.findByRole("button", { name: "Create your first entry" }),
    );

    expect(screen.getByLabelText("Title")).toHaveFocus();
  });

  it("moves focus to the title field when opening the edit form", async () => {
    renderUpdateBrowser(async () => ({
      found: true as const,
      isValid: true as const,
      entry,
    }));

    fireEvent.click(await screen.findByRole("button", { name: entry.title }));
    await screen.findByRole("heading", { name: entry.title });
    fireEvent.click(screen.getByRole("button", { name: "Edit entry" }));

    expect(screen.getByLabelText("Title")).toHaveFocus();
  });

  it("moves focus to the cancellation action when opening deletion confirmation", async () => {
    renderDeleteBrowser(async () => ({ deleted: true as const }));

    fireEvent.click(await screen.findByRole("button", { name: entry.title }));
    await screen.findByRole("heading", { name: entry.title });
    fireEvent.click(screen.getByRole("button", { name: "Delete entry" }));

    expect(screen.getByRole("button", { name: "Cancel deletion" })).toHaveFocus();
  });

  it("returns focus to deletion action after cancelling deletion confirmation", async () => {
    renderDeleteBrowser(async () => ({ deleted: true as const }));

    fireEvent.click(await screen.findByRole("button", { name: entry.title }));
    await screen.findByRole("heading", { name: entry.title });
    fireEvent.click(screen.getByRole("button", { name: "Delete entry" }));
    fireEvent.click(screen.getByRole("button", { name: "Cancel deletion" }));

    await screen.findByRole("heading", { name: entry.title });
    expect(screen.getByRole("button", { name: "Delete entry" })).toHaveFocus();
  });

  it("cancels deletion with Escape and returns focus to deletion action", async () => {
    const deleteEntry = vi.fn(async () => ({ deleted: true as const }));

    renderDeleteBrowser(deleteEntry);

    fireEvent.click(await screen.findByRole("button", { name: entry.title }));
    await screen.findByRole("heading", { name: entry.title });
    fireEvent.click(screen.getByRole("button", { name: "Delete entry" }));
    fireEvent.keyDown(screen.getByRole("alertdialog"), { key: "Escape" });

    await screen.findByRole("heading", { name: entry.title });
    expect(deleteEntry).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Delete entry" })).toHaveFocus();
  });

  it("moves focus to the detail navigation after creating an entry", async () => {
    renderCreateBrowser(async () => ({ isValid: true as const, entry }));

    fireEvent.click(
      await screen.findByRole("button", { name: "Create your first entry" }),
    );
    fireEvent.change(screen.getByLabelText("Title"), {
      target: { value: entry.title },
    });
    fireEvent.change(screen.getByLabelText("Content"), {
      target: { value: entry.content },
    });
    const saveButton = screen.getByRole("button", { name: "Save entry" });
    saveButton.focus();
    fireEvent.click(saveButton);

    await screen.findByRole("heading", { name: entry.title });
    expect(screen.getByRole("button", { name: "Back to entries" })).toHaveFocus();
  });

  it("moves focus to the detail navigation after updating an entry", async () => {
    renderUpdateBrowser(async () => ({
      found: true as const,
      isValid: true as const,
      entry,
    }));

    fireEvent.click(await screen.findByRole("button", { name: entry.title }));
    await screen.findByRole("heading", { name: entry.title });
    fireEvent.click(screen.getByRole("button", { name: "Edit entry" }));
    const saveButton = screen.getByRole("button", { name: "Save changes" });
    saveButton.focus();
    fireEvent.click(saveButton);

    await screen.findByRole("heading", { name: entry.title });
    expect(screen.getByRole("button", { name: "Back to entries" })).toHaveFocus();
  });

  it("moves focus to the next entry after deleting an entry", async () => {
    renderDeleteBrowser(async () => ({ deleted: true as const }));

    fireEvent.click(await screen.findByRole("button", { name: entry.title }));
    await screen.findByRole("heading", { name: entry.title });
    fireEvent.click(screen.getByRole("button", { name: "Delete entry" }));
    const confirmButton = screen.getByRole("button", {
      name: "Confirm deletion",
    });
    confirmButton.focus();
    fireEvent.click(confirmButton);

    const nextEntryButton = await screen.findByRole("button", {
      name: "An afternoon walk",
    });
    expect(nextEntryButton).toHaveFocus();
  });

  it("returns focus to the selected entry after returning to the list", async () => {
    renderUpdateBrowser(async () => ({
      found: true as const,
      isValid: true as const,
      entry,
    }));

    fireEvent.click(await screen.findByRole("button", { name: entry.title }));
    await screen.findByRole("heading", { name: entry.title });
    const backButton = screen.getByRole("button", { name: "Back to entries" });
    backButton.focus();
    fireEvent.click(backButton);

    const entryButton = await screen.findByRole("button", {
      name: entry.title,
    });
    expect(entryButton).toHaveFocus();
  });

  it("retries loading entries after the initial load fails", async () => {
    const loadEntries = vi
      .fn<() => Promise<readonly DiaryEntry[]>>()
      .mockRejectedValueOnce(new Error("Storage unavailable"))
      .mockResolvedValueOnce([entry]);

    render(
      <DiaryBrowser
        loadEntries={loadEntries}
        loadEntry={vi.fn(async () => undefined)}
        createEntry={vi.fn(async () => ({ isValid: true as const, entry }))}
        updateEntry={vi.fn(async () => ({
          found: true as const,
          isValid: true as const,
          entry,
        }))}
        deleteEntry={vi.fn(async () => ({ deleted: true as const }))}
        today={() => "2026-08-16"}
      />,
    );

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Unable to load diary entries.",
    );
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));

    expect(
      await screen.findByRole("button", { name: entry.title }),
    ).toBeVisible();
    expect(loadEntries).toHaveBeenCalledTimes(2);
  });

  it("returns to the loaded list after loading an entry fails", async () => {
    const loadEntries = vi.fn(async () => [entry]);
    const loadEntry = vi.fn(async () => {
      throw new Error("Storage unavailable");
    });

    render(
      <DiaryBrowser
        loadEntries={loadEntries}
        loadEntry={loadEntry}
        createEntry={vi.fn(async () => ({ isValid: true as const, entry }))}
        updateEntry={vi.fn(async () => ({
          found: true as const,
          isValid: true as const,
          entry,
        }))}
        deleteEntry={vi.fn(async () => ({ deleted: true as const }))}
        today={() => "2026-08-16"}
      />,
    );

    fireEvent.click(await screen.findByRole("button", { name: entry.title }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Unable to load diary entry.",
    );
    fireEvent.click(screen.getByRole("button", { name: "Back to entries" }));

    expect(
      await screen.findByRole("button", { name: entry.title }),
    ).toBeVisible();
    expect(loadEntries).toHaveBeenCalledOnce();
  });

  it("moves focus to the retry action after loading entries fails", async () => {
    render(
      <DiaryBrowser
        loadEntries={vi.fn(async () => {
          throw new Error("Storage unavailable");
        })}
        loadEntry={vi.fn(async () => undefined)}
        createEntry={vi.fn(async () => ({ isValid: true as const, entry }))}
        updateEntry={vi.fn(async () => ({
          found: true as const,
          isValid: true as const,
          entry,
        }))}
        deleteEntry={vi.fn(async () => ({ deleted: true as const }))}
        today={() => "2026-08-16"}
      />,
    );

    await screen.findByRole("alert");
    expect(screen.getByRole("button", { name: "Try again" })).toHaveFocus();
  });

  it("moves focus to the return action after loading an entry fails", async () => {
    render(
      <DiaryBrowser
        loadEntries={vi.fn(async () => [entry])}
        loadEntry={vi.fn(async () => {
          throw new Error("Storage unavailable");
        })}
        createEntry={vi.fn(async () => ({ isValid: true as const, entry }))}
        updateEntry={vi.fn(async () => ({
          found: true as const,
          isValid: true as const,
          entry,
        }))}
        deleteEntry={vi.fn(async () => ({ deleted: true as const }))}
        today={() => "2026-08-16"}
      />,
    );

    fireEvent.click(await screen.findByRole("button", { name: entry.title }));

    await screen.findByRole("alert");
    expect(
      screen.getByRole("button", { name: "Back to entries" }),
    ).toHaveFocus();
  });

  it("returns focus to the attempted entry after recovering from a load error", async () => {
    render(
      <DiaryBrowser
        loadEntries={vi.fn(async () => [entry])}
        loadEntry={vi.fn(async () => {
          throw new Error("Storage unavailable");
        })}
        createEntry={vi.fn(async () => ({ isValid: true as const, entry }))}
        updateEntry={vi.fn(async () => ({
          found: true as const,
          isValid: true as const,
          entry,
        }))}
        deleteEntry={vi.fn(async () => ({ deleted: true as const }))}
        today={() => "2026-08-16"}
      />,
    );

    fireEvent.click(await screen.findByRole("button", { name: entry.title }));
    await screen.findByRole("alert");
    fireEvent.click(screen.getByRole("button", { name: "Back to entries" }));

    expect(
      await screen.findByRole("button", { name: entry.title }),
    ).toHaveFocus();
  });

  it("moves focus to the first entry after retrying a failed list load", async () => {
    const loadEntries = vi
      .fn<() => Promise<readonly DiaryEntry[]>>()
      .mockRejectedValueOnce(new Error("Storage unavailable"))
      .mockResolvedValueOnce([entry]);

    render(
      <DiaryBrowser
        loadEntries={loadEntries}
        loadEntry={vi.fn(async () => undefined)}
        createEntry={vi.fn(async () => ({ isValid: true as const, entry }))}
        updateEntry={vi.fn(async () => ({
          found: true as const,
          isValid: true as const,
          entry,
        }))}
        deleteEntry={vi.fn(async () => ({ deleted: true as const }))}
        today={() => "2026-08-16"}
      />,
    );

    await screen.findByRole("alert");
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));

    expect(
      await screen.findByRole("button", { name: entry.title }),
    ).toHaveFocus();
  });

  it("moves focus to the create action after retrying to an empty diary", async () => {
    const loadEntries = vi
      .fn<() => Promise<readonly DiaryEntry[]>>()
      .mockRejectedValueOnce(new Error("Storage unavailable"))
      .mockResolvedValueOnce([]);

    render(
      <DiaryBrowser
        loadEntries={loadEntries}
        loadEntry={vi.fn(async () => undefined)}
        createEntry={vi.fn(async () => ({ isValid: true as const, entry }))}
        updateEntry={vi.fn(async () => ({
          found: true as const,
          isValid: true as const,
          entry,
        }))}
        deleteEntry={vi.fn(async () => ({ deleted: true as const }))}
        today={() => "2026-08-16"}
      />,
    );

    await screen.findByRole("alert");
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));

    expect(
      await screen.findByRole("button", { name: "Create your first entry" }),
    ).toHaveFocus();
  });
});
