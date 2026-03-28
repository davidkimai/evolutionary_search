import { beforeEach, describe, expect, test } from "vitest";

import { resetDataDir } from "./helpers.js";

process.env.OWES_CODEX_APP_SERVER_MODE = "mock";

beforeEach(async () => {
  await resetDataDir();
});

describe("RunService", () => {
  test("replay smoke run completes with ranked opportunities and export", async () => {
    const { RunService } = await import("../src/services/run-service.js");
    const service = new RunService();
    const run = await service.smokeReplay();

    expect(run.status).toBe("completed");
    expect(run.opportunities.length).toBeGreaterThan(0);
    expect(run.opportunities[0].evidenceSnippets.length).toBeGreaterThan(0);

    const markdown = await service.exportRun(run.runId);
    expect(markdown).toContain("# AI startup opportunity search");
    expect(markdown).toContain("## Ranked Opportunities");
    expect(markdown).toContain("- Status: completed");
  });
});
