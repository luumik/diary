import { useEffect, useRef, useState } from "react";

import type {
  CreateDiaryEntryResult,
  DiaryEntry,
} from "./application/createDiaryEntry";
import type { DeleteDiaryEntryResult } from "./application/deleteDiaryEntry";
import type { UpdateDiaryEntryResult } from "./application/updateDiaryEntry";
import type {
  DiaryEntryInput,
  ValidationResult,
} from "./domain/validateDiaryEntryInput";
import { DiaryEntryDetail } from "./DiaryEntryDetail";
import { DiaryList, type DiaryListFocusTarget } from "./DiaryList";
import { NewEntryForm } from "./NewEntryForm";

type DiaryBrowserFocusTarget =
  | { readonly kind: "detail-navigation" }
  | { readonly kind: "edit-action" }
  | DiaryListFocusTarget;

type ErrorRecoveryAction = "retry-entry-list" | "show-entry-list";

export interface DiaryBrowserProps {
  readonly loadEntries: () => Promise<readonly DiaryEntry[]>;
  readonly loadEntry: (id: string) => Promise<DiaryEntry | undefined>;
  readonly createEntry: (
    input: DiaryEntryInput,
  ) => Promise<CreateDiaryEntryResult>;
  readonly updateEntry: (
    id: string,
    input: DiaryEntryInput,
  ) => Promise<UpdateDiaryEntryResult>;
  readonly deleteEntry: (id: string) => Promise<DeleteDiaryEntryResult>;
  readonly today: () => string;
}

export function DiaryBrowser({
  loadEntries,
  loadEntry,
  createEntry,
  updateEntry,
  deleteEntry,
  today,
}: DiaryBrowserProps) {
  const [entries, setEntries] = useState<readonly DiaryEntry[] | undefined>(undefined);
  const [selectedEntry, setSelectedEntry] = useState<DiaryEntry | undefined>(undefined);
  const [isCreatingEntry, setIsCreatingEntry] = useState(false);
  const [createErrorMessage, setCreateErrorMessage] = useState<
    string | undefined
  >(undefined);
  const [entryBeingEdited, setEntryBeingEdited] = useState<
    DiaryEntry | undefined
  >(undefined);
  const [entryPendingDeletion, setEntryPendingDeletion] = useState<
    DiaryEntry | undefined
  >(undefined);
  const [isNotFound, setIsNotFound] = useState(false);
  const [isLoadingEntry, setIsLoadingEntry] = useState(false);
  const [isDeletingEntry, setIsDeletingEntry] = useState(false);
  const [entryLoadErrorId, setEntryLoadErrorId] = useState<string | undefined>(
    undefined,
  );
  const [errorMessage, setErrorMessage] = useState<string | undefined>(undefined);
  const [errorRecoveryAction, setErrorRecoveryAction] = useState<
    ErrorRecoveryAction | undefined
  >(undefined);
  const [successMessage, setSuccessMessage] = useState<string | undefined>(
    undefined,
  );
  const cancelDeletionButtonRef = useRef<HTMLButtonElement>(null);
  const backToEntriesButtonRef = useRef<HTMLButtonElement>(null);
  const editEntryButtonRef = useRef<HTMLButtonElement>(null);
  const retryEntryListButtonRef = useRef<HTMLButtonElement>(null);
  const errorBackToEntriesButtonRef = useRef<HTMLButtonElement>(null);
  const [focusTarget, setFocusTarget] = useState<
    DiaryBrowserFocusTarget | undefined
  >(undefined);

  useEffect(() => {
    let isCurrent = true;

    async function load() {
      try {
        const loadedEntries = await loadEntries();

        if (isCurrent) {
          setEntries(loadedEntries);
        }
      } catch {
        if (isCurrent) {
          setErrorMessage("Unable to load diary entries.");
          setErrorRecoveryAction("retry-entry-list");
        }
      }
    }

    void load();

    return () => {
      isCurrent = false;
    };
  }, [loadEntries]);

  useEffect(() => {
    if (entryPendingDeletion !== undefined) {
      cancelDeletionButtonRef.current?.focus();
    }
  }, [entryPendingDeletion]);

  useEffect(() => {
    if (errorRecoveryAction === "retry-entry-list") {
      retryEntryListButtonRef.current?.focus();
      return;
    }

    if (errorRecoveryAction === "show-entry-list") {
      errorBackToEntriesButtonRef.current?.focus();
    }
  }, [errorRecoveryAction]);

  useEffect(() => {
    if (focusTarget?.kind === "detail-navigation") {
      backToEntriesButtonRef.current?.focus();
      setFocusTarget(undefined);
      return;
    }

    if (focusTarget?.kind === "edit-action") {
      editEntryButtonRef.current?.focus();
      setFocusTarget(undefined);
    }
  }, [focusTarget]);

  async function handleSelectEntry(id: string) {
    setEntryLoadErrorId(undefined);
    setIsLoadingEntry(true);

    try {
      const entry = await loadEntry(id);

      if (entry === undefined) {
        setIsNotFound(true);
        return;
      }

      setSelectedEntry(entry);
    } catch {
      setErrorMessage("Unable to load diary entry.");
      setErrorRecoveryAction("show-entry-list");
      setEntryLoadErrorId(id);
    } finally {
      setIsLoadingEntry(false);
    }
  }

  async function retryEntryList() {
    setErrorMessage(undefined);
    setErrorRecoveryAction(undefined);

    try {
      const loadedEntries = await loadEntries();
      const firstEntry = loadedEntries[0];

      setEntries(loadedEntries);
      setFocusTarget(
        firstEntry === undefined
          ? { kind: "create-action" }
          : { kind: "entry", id: firstEntry.id },
      );
    } catch {
      setErrorMessage("Unable to load diary entries.");
      setErrorRecoveryAction("retry-entry-list");
    }
  }

  function showNewEntryForm() {
    setIsCreatingEntry(true);
    setCreateErrorMessage(undefined);
    setErrorMessage(undefined);
    setSuccessMessage(undefined);
  }

  async function handleCreateEntry(
    input: DiaryEntryInput,
  ): Promise<ValidationResult> {
    setCreateErrorMessage(undefined);

    try {
      const result = await createEntry(input);

      if (!result.isValid) {
        return result;
      }

      setEntries((currentEntries) =>
        currentEntries === undefined
          ? [result.entry]
          : [result.entry, ...currentEntries],
      );
      setSelectedEntry(result.entry);
      setIsCreatingEntry(false);
      setSuccessMessage("Entry saved.");
      setFocusTarget({ kind: "detail-navigation" });

      return { isValid: true };
    } catch {
      setCreateErrorMessage("Unable to save diary entry.");

      return { isValid: true };
    }
  }

  function showEditEntryForm() {
    if (selectedEntry !== undefined) {
      setEntryBeingEdited(selectedEntry);
      setErrorMessage(undefined);
      setSuccessMessage(undefined);
    }
  }

  function cancelEditing() {
    setEntryBeingEdited(undefined);
    setFocusTarget({ kind: "edit-action" });
  }

  async function handleUpdateEntry(
    input: DiaryEntryInput,
  ): Promise<ValidationResult> {
    if (entryBeingEdited === undefined) {
      return { isValid: true };
    }

    try {
      const result = await updateEntry(entryBeingEdited.id, input);

      if (!result.found) {
        setEntryBeingEdited(undefined);
        setSelectedEntry(undefined);
        setIsNotFound(true);

        return { isValid: true };
      }

      if (!result.isValid) {
        return result;
      }

      setEntries((currentEntries) =>
        currentEntries?.map((currentEntry) =>
          currentEntry.id === result.entry.id ? result.entry : currentEntry,
        ),
      );
      setSelectedEntry(result.entry);
      setEntryBeingEdited(undefined);
      setSuccessMessage("Entry updated.");
      setFocusTarget({ kind: "detail-navigation" });

      return { isValid: true };
    } catch {
      setErrorMessage("Unable to update diary entry.");

      return { isValid: true };
    }
  }

  function showDeletionConfirmation() {
    if (selectedEntry !== undefined) {
      setEntryPendingDeletion(selectedEntry);
      setErrorMessage(undefined);
      setSuccessMessage(undefined);
    }
  }

  function cancelDeletion() {
    if (!isDeletingEntry) {
      setEntryPendingDeletion(undefined);
    }
  }

  async function confirmDeletion() {
    if (entryPendingDeletion === undefined || isDeletingEntry) {
      return;
    }

    setIsDeletingEntry(true);

    try {
      const result = await deleteEntry(entryPendingDeletion.id);

      if (!result.deleted) {
        setEntryPendingDeletion(undefined);
        setSelectedEntry(undefined);
        setIsNotFound(true);

        return;
      }

      setEntries((currentEntries) =>
        currentEntries?.filter(
          (currentEntry) => currentEntry.id !== entryPendingDeletion.id,
        ),
      );
      const nextEntry = entries?.find(
        (currentEntry) => currentEntry.id !== entryPendingDeletion.id,
      );
      setEntryPendingDeletion(undefined);
      setSelectedEntry(undefined);
      setSuccessMessage("Entry deleted.");
      setFocusTarget(
        nextEntry === undefined
          ? { kind: "create-action" }
          : { kind: "entry", id: nextEntry.id },
      );
    } catch {
      setErrorMessage("Unable to delete diary entry.");
    } finally {
      setIsDeletingEntry(false);
    }
  }

  function showEntryList() {
    const selectedEntryId = selectedEntry?.id ?? entryLoadErrorId;

    setIsCreatingEntry(false);
    setCreateErrorMessage(undefined);
    setEntryBeingEdited(undefined);
    setEntryPendingDeletion(undefined);
    setSelectedEntry(undefined);
    setEntryLoadErrorId(undefined);
    setIsNotFound(false);
    setIsDeletingEntry(false);
    setErrorMessage(undefined);
    setErrorRecoveryAction(undefined);
    setSuccessMessage(undefined);
    setFocusTarget(
      selectedEntryId === undefined
        ? undefined
        : { kind: "entry", id: selectedEntryId },
    );
  }

  const diaryListFocusProps =
    focusTarget?.kind === "entry" || focusTarget?.kind === "create-action"
      ? {
          focusTarget,
          onFocusTargetHandled: () => setFocusTarget(undefined),
        }
      : {};

  if (errorMessage !== undefined) {
    return (
      <section className="diary-panel diary-error-state" aria-label="Diary error">
        <p className="operation-message operation-message-error" role="alert">{errorMessage}</p>
        {errorRecoveryAction === "retry-entry-list" ? (
          <button
            ref={retryEntryListButtonRef}
            className="primary-action"
            type="button"
            onClick={() => void retryEntryList()}
          >
            Try again
          </button>
        ) : null}
        {errorRecoveryAction === "show-entry-list" ? (
          <button
            ref={errorBackToEntriesButtonRef}
            className="secondary-action"
            type="button"
            onClick={showEntryList}
          >
            Back to entries
          </button>
        ) : null}
      </section>
    );
  }

  if (entries === undefined) {
    return <p role="status">Loading entries…</p>;
  }

  if (isLoadingEntry) {
    return <p role="status">Loading entry…</p>;
  }

  if (isCreatingEntry) {
    return (
      <NewEntryForm
        today={today}
        operationError={createErrorMessage}
        onSubmit={handleCreateEntry}
      />
    );
  }

  if (entryBeingEdited !== undefined) {
    return (
      <NewEntryForm
        today={today}
        initialInput={entryBeingEdited}
        onSubmit={handleUpdateEntry}
        onCancel={cancelEditing}
        submitLabel="Save changes"
      />
    );
  }

  if (entryPendingDeletion !== undefined) {
    return (
      <section
        className="diary-panel deletion-dialog"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="delete-entry-heading"
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            event.preventDefault();
            cancelDeletion();
          }
        }}
      >
        <h1 id="delete-entry-heading">Delete entry?</h1>
        <p>{entryPendingDeletion.title}</p>
        {isDeletingEntry ? <p role="status">Deleting entry…</p> : null}
        <button
          ref={cancelDeletionButtonRef}
          className="secondary-action"
          type="button"
          onClick={cancelDeletion}
          disabled={isDeletingEntry}
        >
          Cancel deletion
        </button>
        <button
          className="destructive-action"
          type="button"
          onClick={confirmDeletion}
          disabled={isDeletingEntry}
        >
          Confirm deletion
        </button>
      </section>
    );
  }

  if (isNotFound) {
    return (
      <section className="diary-panel diary-error-state" aria-labelledby="entry-not-found-heading">
        <h1 id="entry-not-found-heading">Entry not found</h1>
        <p role="alert">Diary entry not found.</p>
        <button className="secondary-action" type="button" onClick={showEntryList}>
          Back to entries
        </button>
      </section>
    );
  }

  if (selectedEntry !== undefined) {
    return (
      <section className="diary-panel entry-view">
        {successMessage === undefined ? null : (
          <p role="status">{successMessage}</p>
        )}
        <button
          ref={backToEntriesButtonRef}
          className="secondary-action"
          type="button"
          onClick={showEntryList}
        >
          Back to entries
        </button>
        <button
          ref={editEntryButtonRef}
          className="primary-action"
          type="button"
          onClick={showEditEntryForm}
        >
          Edit entry
        </button>
        <button
          className="destructive-action"
          type="button"
          onClick={showDeletionConfirmation}
        >
          Delete entry
        </button>
        <DiaryEntryDetail entry={selectedEntry} />
      </section>
    );
  }

  return (
    <>
      {successMessage === undefined ? null : (
        <p role="status">{successMessage}</p>
      )}
      <DiaryList
        entries={entries}
        onCreateEntry={showNewEntryForm}
        onSelectEntry={handleSelectEntry}
        {...diaryListFocusProps}
      />
    </>
  );
}
