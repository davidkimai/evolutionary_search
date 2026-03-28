import { beforeEach, describe, expect, test } from "vitest";

import { resetDataDir } from "./helpers.js";

process.env.OWES_CODEX_APP_SERVER_MODE = "mock";

beforeEach(async () => {
  await resetDataDir();
});

describe("API", () => {
  test("can create and fetch a replay run", async () => {
    const { createApp } = await import("../src/api/app.js");
    const app = createApp();

    const createResponse = await app.inject({
      method: "POST",
      url: "/v1/runs",
      payload: {
        mode: "replay",
        objective: {
          title: "AI startup opportunity search",
          query: "AI startup credits and accelerator programs",
          profile: "Seed-stage startup building AI developer tools.",
          geography: "Global",
          sectors: ["AI", "developer tools", "cloud"],
          sourceTypes: ["grant", "accelerator"],
          constraints: ["Prefer explicit benefits"],
          fixtureId: "demo-opportunities"
        }
      }
    });

    expect(createResponse.statusCode).toBe(200);
    const created = createResponse.json();
    const runId = created.run.runId;

    const fetchResponse = await app.inject({ method: "GET", url: `/v1/runs/${runId}` });
    expect(fetchResponse.statusCode).toBe(200);
    expect(fetchResponse.json().run.runId).toBe(runId);

    await app.close();
  });
});
