import { describe, expect, test } from "vitest";
import { readFileSync } from "node:fs";

import { defaultSources, type ProviderSearchResult } from "../src/providers/index.js";
import { normalizeAndRank } from "../src/services/pipeline.js";
import type { Objective } from "../src/core/types.js";

const fixture = JSON.parse(readFileSync(new URL("../fixtures/replay/demo-opportunities.json", import.meta.url), "utf8")) as {
  results: Array<{ sourceId: string; rawOpportunities: any[] }>;
};

const objective: Objective = {
  objectiveId: "obj_test",
  title: "AI startup opportunity search",
  query: "AI startup credits and accelerator programs",
  profile: "Seed-stage startup building AI developer tools.",
  geography: "Global",
  sectors: ["AI", "developer tools", "cloud"],
  sourceTypes: ["grant", "accelerator"],
  sourceIds: [],
  constraints: ["Prefer explicit benefits"],
  fixtureId: "demo-opportunities",
  createdAt: "2026-03-28T00:00:00Z"
};

describe("normalizeAndRank", () => {
  test("produces weighted scores sorted descending", () => {
    const results: ProviderSearchResult[] = fixture.results.flatMap((entry) => {
      const source = defaultSources.find((candidate) => candidate.id === entry.sourceId);
      if (!source) {
        return [];
      }
      return [{
        source,
        requestGoal: "fixture",
        rawOpportunities: entry.rawOpportunities,
        rawEventLog: []
      }];
    });

    const ranked = normalizeAndRank("run_test", objective, results);
    expect(ranked.length).toBe(3);
    expect(ranked[0].weightedScore).toBeGreaterThanOrEqual(ranked[1].weightedScore);
    expect(ranked[0].fitReason.length).toBeGreaterThan(0);
    expect(ranked[0].title).toBe("AWS Activate Credits for Startups");
    expect(ranked.find((item) => item.title === "Y Combinator Startup Accelerator")?.rewardValueNumericMax).toBe(500_000);
    expect(ranked.find((item) => item.title === "AWS Activate Credits for Startups")?.rewardValueNumericMax).toBe(100_000);
    expect(ranked.find((item) => item.title === "Y Combinator Startup Accelerator")?.uncertaintyNotes.length).toBeGreaterThan(0);
  });
});
