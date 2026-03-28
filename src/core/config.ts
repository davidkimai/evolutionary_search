import { mkdirSync } from "node:fs";
import path from "node:path";

const repoRoot = process.cwd();
const dataDir = process.env.OWES_DATA_DIR
  ? path.resolve(process.env.OWES_DATA_DIR)
  : path.join(repoRoot, ".owes-data");
const publicDir = path.join(repoRoot, "public");
const fixturesDir = path.join(repoRoot, "fixtures");

mkdirSync(dataDir, { recursive: true });
mkdirSync(path.join(dataDir, "runs"), { recursive: true });
mkdirSync(path.join(dataDir, "objectives"), { recursive: true });

export const config = {
  repoRoot,
  dataDir,
  publicDir,
  fixturesDir,
  host: process.env.OWES_HOST ?? "127.0.0.1",
  port: Number(process.env.OWES_PORT ?? 4317),
  codexExecutable: process.env.OWES_CODEX_EXECUTABLE ?? "codex",
  tinyfishExecutable: process.env.OWES_TINYFISH_EXECUTABLE ?? "tinyfish",
  tinyfishApiBaseUrl: process.env.OWES_TINYFISH_API_BASE_URL ?? "https://agent.tinyfish.ai",
  tinyfishApiKey: process.env.OWES_TINYFISH_API_KEY ?? process.env.TINYFISH_API_KEY ?? null,
  tinyfishBrowserProfile: process.env.OWES_TINYFISH_BROWSER_PROFILE ?? "lite",
  tinyfishPollIntervalMs: Number(process.env.OWES_TINYFISH_POLL_INTERVAL_MS ?? 2000),
  tinyfishRunTimeoutMs: Number(process.env.OWES_TINYFISH_RUN_TIMEOUT_MS ?? 300000),
  codexAppServerMode: process.env.OWES_CODEX_APP_SERVER_MODE ?? "real"
} as const;
