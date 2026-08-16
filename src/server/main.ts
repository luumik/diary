import { startLocalDiaryServer } from "./startLocalDiaryServer";

void startLocalDiaryServer({ projectRoot: process.cwd() }).catch(() => {
  process.stderr.write("Unable to start the local diary server.\n");
  process.exitCode = 1;
});
