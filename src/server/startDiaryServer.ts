import { randomUUID } from "node:crypto";
import { createServer, type Server } from "node:http";

import { SqliteDiaryEntryRepository } from "../features/diary/infrastructure/SqliteDiaryEntryRepository";
import { createDiaryApi } from "./createDiaryApi";

const loopbackHost = "127.0.0.1";

export interface StartDiaryServerOptions {
  readonly databasePath: string;
  readonly port?: number;
}

export interface RunningDiaryServer {
  readonly url: string;
  close(): Promise<void>;
}

function listen(server: Server, port: number): Promise<number> {
  return new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(port, loopbackHost, () => {
      const address = server.address();

      if (address === null || typeof address === "string") {
        reject(new Error("The diary server did not provide a TCP address."));
        return;
      }

      server.off("error", reject);
      resolve(address.port);
    });
  });
}

function closeHttpServer(server: Server): Promise<void> {
  if (!server.listening) {
    return Promise.resolve();
  }

  return new Promise((resolve, reject) => {
    server.close((error) => {
      if (error === undefined) {
        resolve();
        return;
      }

      reject(error);
    });
  });
}

export async function startDiaryServer({
  databasePath,
  port = 0,
}: StartDiaryServerOptions): Promise<RunningDiaryServer> {
  const repository = await SqliteDiaryEntryRepository.open({ databasePath });
  const api = createDiaryApi({
    repository,
    generateId: randomUUID,
    now: () => new Date().toISOString(),
  });
  const server = createServer(api);

  try {
    const boundPort = await listen(server, port);

    return {
      url: `http://${loopbackHost}:${boundPort}`,
      async close() {
        await closeHttpServer(server);
        await repository.close();
      },
    };
  } catch (error) {
    await closeHttpServer(server);
    await repository.close();
    throw error;
  }
}
