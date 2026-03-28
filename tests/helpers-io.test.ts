import path from "node:path";

import { beforeEach, describe, expect, test } from "vitest";

import { resetDataDir } from "./helpers.js";
import { readJson, writeJson } from "../src/utils/helpers.js";

beforeEach(async () => {
  await resetDataDir();
});

describe("writeJson", () => {
  test("supports concurrent writes to the same file without temp-file collisions", async () => {
    const filePath = path.join(process.cwd(), ".owes-data", "scratch", "concurrent.json");

    await Promise.all(
      Array.from({ length: 8 }, (_, index) =>
        writeJson(filePath, {
          sequence: index,
          label: `write-${index}`
        })
      )
    );

    const saved = await readJson<{ sequence: number; label: string }>(filePath);
    expect(saved).not.toBeNull();
    expect(saved?.label).toMatch(/^write-\d+$/);
  });
});
