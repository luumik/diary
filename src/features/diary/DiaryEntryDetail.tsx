import type { DiaryEntry } from "./application/createDiaryEntry";

export interface DiaryEntryDetailProps {
  readonly entry: DiaryEntry;
}

export function DiaryEntryDetail({ entry }: DiaryEntryDetailProps) {
  return (
    <article className="entry-detail">
      <header className="entry-detail-header">
        <p className="eyebrow">Journal entry</p>
        <h1>{entry.title}</h1>
        <time className="entry-date" dateTime={entry.entryDate}>{entry.entryDate}</time>
      </header>
      <p className="entry-content">{entry.content}</p>
      <ul className="tag-list" aria-label="Tags">
        {entry.tags.map((tag) => (
          <li key={tag}>{tag}</li>
        ))}
      </ul>
    </article>
  );
}
