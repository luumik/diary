import { DiaryBrowser } from "./features/diary/DiaryBrowser";
import type { DiaryApiClient } from "./features/diary/infrastructure/DiaryApiClient";

export interface AppProps {
  readonly client: DiaryApiClient;
}

function currentLocalDate(): string {
  const now = new Date();
  const localTime = new Date(now.getTime() - now.getTimezoneOffset() * 60_000);

  return localTime.toISOString().slice(0, 10);
}

export function App({ client }: AppProps) {
  return (
    <main className="app-shell">
      <div className="app-frame">
        <header className="app-header">
          <div>
            <p className="eyebrow">Private local journal</p>
            <h1>Diary</h1>
          </div>
          <p className="privacy-note">Stored only on this device</p>
        </header>
        <div className="diary-workspace">
          <DiaryBrowser
            loadEntries={client.loadEntries}
            loadEntry={client.loadEntry}
            createEntry={client.createEntry}
            updateEntry={client.updateEntry}
            deleteEntry={client.deleteEntry}
            today={currentLocalDate}
          />
        </div>
      </div>
    </main>
  );
}
