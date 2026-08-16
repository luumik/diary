import { useEffect, useRef } from "react";

import type { DiaryEntry } from "./application/createDiaryEntry";

export type DiaryListFocusTarget =
  | { readonly kind: "entry"; readonly id: string }
  | { readonly kind: "create-action" };

export interface DiaryListProps {
  readonly entries: readonly DiaryEntry[];
  readonly onCreateEntry: () => void;
  readonly onSelectEntry: (id: string) => void;
  readonly focusTarget?: DiaryListFocusTarget;
  readonly onFocusTargetHandled?: () => void;
}

export function DiaryList({
  entries,
  onCreateEntry,
  onSelectEntry,
  focusTarget,
  onFocusTargetHandled,
}: DiaryListProps) {
  const focusTargetRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (focusTarget !== undefined) {
      focusTargetRef.current?.focus();
      onFocusTargetHandled?.();
    }
  }, [focusTarget, onFocusTargetHandled]);

  if (entries.length === 0) {
    return (
      <section
        className="diary-panel diary-empty-state"
        aria-labelledby="empty-diary-heading"
      >
        <p className="eyebrow">A fresh page</p>
        <h1 id="empty-diary-heading">Your diary is empty</h1>
        <p>Capture a thought, a memory, or a moment from your day.</p>
        <button
          className="primary-action"
          ref={focusTarget?.kind === "create-action" ? focusTargetRef : undefined}
          type="button"
          onClick={onCreateEntry}
        >
          Create your first entry
        </button>
      </section>
    );
  }

  return (
    <section className="diary-panel diary-list-panel" aria-label="Diary entries">
      <header className="panel-header">
        <div>
          <p className="eyebrow">Your journal</p>
          <h1>Diary entries</h1>
        </div>
        <button className="primary-action" type="button" onClick={onCreateEntry}>
          New entry
        </button>
      </header>
      <ul className="entry-list">
        {entries.map((entry) => (
          <li className="entry-list-item" key={entry.id}>
            <button
              className="entry-list-button"
              ref={
                focusTarget?.kind === "entry" && focusTarget.id === entry.id
                  ? focusTargetRef
                  : undefined
              }
              type="button"
              onClick={() => onSelectEntry(entry.id)}
            >{entry.title}</button>
            <time className="entry-list-date" dateTime={entry.entryDate}>{entry.entryDate}</time>
          </li>
        ))}
      </ul>
    </section>
  );
}
