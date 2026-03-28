import path from "node:path";
import { rm } from "node:fs/promises";

export async function resetDataDir() {
  await rm(path.join(process.cwd(), ".owes-data"), { recursive: true, force: true });
}
