import { mkdir } from "node:fs/promises";
import { join } from "node:path";

import {
  startDiaryServer,
  type RunningDiaryServer,
  type StartDiaryServerOptions,
} from "./startDiaryServer";

export interface StartLocalDiaryServerOptions {
  readonly projectRoot: string;
  readonly createDirectory?: (directory: string) => Promise<void>;
  readonly startServer?: (
    options: StartDiaryServerOptions,
  ) => Promise<RunningDiaryServer>;
}

async function createDirectory(directory: string): Promise<void> {
  await mkdir(directory, { recursive: true });
}

export async function startLocalDiaryServer({
  projectRoot,
  createDirectory: ensureDirectory = createDirectory,
  startServer = startDiaryServer,
}: StartLocalDiaryServerOptions): Promise<RunningDiaryServer> {
  const dataDirectory = join(projectRoot, "data");

  await ensureDirectory(dataDirectory);

  return startServer({
    databasePath: join(dataDirectory, "diary.sqlite"),
    port: 3000,
  });
}
