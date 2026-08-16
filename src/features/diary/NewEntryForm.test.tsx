import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { NewEntryForm } from "./NewEntryForm";

describe("NewEntryForm", () => {
  afterEach(cleanup);

  it("defaults the entry date to the current local date", () => {
    render(<NewEntryForm today={() => "2026-08-16"} />);

    expect(screen.getByLabelText("Entry date")).toHaveValue("2026-08-16");
  });

  it("submits the entered title, content, date, and comma-separated tags", async () => {
    const onSubmit = vi.fn(async () => ({ isValid: true as const }));

    render(
      <NewEntryForm today={() => "2026-08-16"} onSubmit={onSubmit} />,
    );

    fireEvent.change(screen.getByLabelText("Title"), {
      target: { value: "A quiet morning" },
    });
    fireEvent.change(screen.getByLabelText("Content"), {
      target: { value: "I enjoyed a cup of tea before work." },
    });
    fireEvent.change(screen.getByLabelText("Tags"), {
      target: { value: "Reflection, Morning" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save entry" }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({
        title: "A quiet morning",
        content: "I enjoyed a cup of tea before work.",
        entryDate: "2026-08-16",
        tags: ["Reflection", "Morning"],
      });
    });
  });

  it("shows returned field errors and preserves entered values", async () => {
    const onSubmit = vi.fn(async () => ({
      isValid: false as const,
      errors: { title: "Title is required." },
    }));

    render(
      <NewEntryForm today={() => "2026-08-16"} onSubmit={onSubmit} />,
    );

    fireEvent.change(screen.getByLabelText("Title"), {
      target: { value: "  " },
    });
    fireEvent.change(screen.getByLabelText("Content"), {
      target: { value: "I enjoyed a cup of tea before work." },
    });
    fireEvent.change(screen.getByLabelText("Tags"), {
      target: { value: "Reflection" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save entry" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Title is required.",
    );
    expect(screen.getByLabelText("Title")).toHaveValue("  ");
    expect(screen.getByLabelText("Content")).toHaveValue(
      "I enjoyed a cup of tea before work.",
    );
    expect(screen.getByLabelText("Entry date")).toHaveValue("2026-08-16");
    expect(screen.getByLabelText("Tags")).toHaveValue("Reflection");
  });

  it("associates a title validation error with the title field", async () => {
    const onSubmit = vi.fn(async () => ({
      isValid: false as const,
      errors: { title: "Title is required." },
    }));

    render(
      <NewEntryForm today={() => "2026-08-16"} onSubmit={onSubmit} />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Save entry" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Title is required.",
    );

    const titleField = screen.getByLabelText("Title");
    expect(titleField).toHaveAttribute("aria-invalid", "true");
    expect(titleField).toHaveAccessibleDescription("Title is required.");
  });

  it("associates a content validation error with the content field", async () => {
    const onSubmit = vi.fn(async () => ({
      isValid: false as const,
      errors: { content: "Content is required." },
    }));

    render(
      <NewEntryForm today={() => "2026-08-16"} onSubmit={onSubmit} />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Save entry" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Content is required.",
    );

    const contentField = screen.getByLabelText("Content");
    expect(contentField).toHaveAttribute("aria-invalid", "true");
    expect(contentField).toHaveAccessibleDescription("Content is required.");
  });

  it("associates an entry-date validation error with the entry-date field", async () => {
    const onSubmit = vi.fn(async () => ({
      isValid: false as const,
      errors: { entryDate: "Entry date must be a valid YYYY-MM-DD date." },
    }));

    render(
      <NewEntryForm today={() => "2026-08-16"} onSubmit={onSubmit} />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Save entry" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Entry date must be a valid YYYY-MM-DD date.",
    );

    const entryDateField = screen.getByLabelText("Entry date");
    expect(entryDateField).toHaveAttribute("aria-invalid", "true");
    expect(entryDateField).toHaveAccessibleDescription(
      "Entry date must be a valid YYYY-MM-DD date.",
    );
  });

  it("associates a tags validation error with the tags field", async () => {
    const onSubmit = vi.fn(async () => ({
      isValid: false as const,
      errors: { tags: "Tags must contain 20 items or fewer." },
    }));

    render(
      <NewEntryForm today={() => "2026-08-16"} onSubmit={onSubmit} />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Save entry" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Tags must contain 20 items or fewer.",
    );

    const tagsField = screen.getByLabelText("Tags");
    expect(tagsField).toHaveAttribute("aria-invalid", "true");
    expect(tagsField).toHaveAccessibleDescription(
      "Tags must contain 20 items or fewer.",
    );
  });

  it("moves focus to the title field after a title validation failure", async () => {
    const onSubmit = vi.fn(async () => ({
      isValid: false as const,
      errors: { title: "Title is required." },
    }));

    render(
      <NewEntryForm today={() => "2026-08-16"} onSubmit={onSubmit} />,
    );

    const saveButton = screen.getByRole("button", { name: "Save entry" });
    saveButton.focus();
    fireEvent.click(saveButton);

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Title is required.",
    );
    expect(screen.getByLabelText("Title")).toHaveFocus();
  });

  it("moves focus to the content field after a content validation failure", async () => {
    const onSubmit = vi.fn(async () => ({
      isValid: false as const,
      errors: { content: "Content is required." },
    }));

    render(
      <NewEntryForm today={() => "2026-08-16"} onSubmit={onSubmit} />,
    );

    fireEvent.change(screen.getByLabelText("Title"), {
      target: { value: "A valid title" },
    });
    const saveButton = screen.getByRole("button", { name: "Save entry" });
    saveButton.focus();
    fireEvent.click(saveButton);

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Content is required.",
    );
    expect(screen.getByLabelText("Content")).toHaveFocus();
  });

  it("shows saving feedback and disables submission while saving", () => {
    const pendingSubmission = new Promise<{ readonly isValid: true }>(() => {});
    const onSubmit = vi.fn(() => pendingSubmission);

    render(
      <NewEntryForm today={() => "2026-08-16"} onSubmit={onSubmit} />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Save entry" }));

    expect(screen.getByRole("status")).toHaveTextContent("Saving entry…");
    expect(screen.getByRole("button", { name: "Save entry" })).toBeDisabled();
  });

  it("does not submit a second time while a save is pending", () => {
    const pendingSubmission = new Promise<{ readonly isValid: true }>(() => {});
    const onSubmit = vi.fn(() => pendingSubmission);

    render(
      <NewEntryForm today={() => "2026-08-16"} onSubmit={onSubmit} />,
    );

    const saveButton = screen.getByRole("button", { name: "Save entry" });
    fireEvent.click(saveButton);
    fireEvent.click(saveButton);

    expect(onSubmit).toHaveBeenCalledOnce();
  });
});
