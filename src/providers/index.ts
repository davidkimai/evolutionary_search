import { readFile } from "node:fs/promises";
import path from "node:path";
import { spawn } from "node:child_process";

import { config } from "../core/config.js";
import { buildTinyfishGoal } from "../core/prompts.js";
import {
  rawOpportunitySchema,
  type Objective,
  type ProviderArtifact,
  type RawOpportunity,
  type RunMode,
  type SourceDefinition
} from "../core/types.js";
import { makeId, nowIso, parseJsonText } from "../utils/helpers.js";

export type ProviderSearchResult = {
  source: SourceDefinition;
  requestGoal: string;
  rawOpportunities: RawOpportunity[];
  rawEventLog: unknown[];
};

export interface OpportunityProvider {
  readonly name: string;
  readonly mode: RunMode;
  search(objective: Objective, sources: SourceDefinition[]): Promise<ProviderSearchResult[]>;
}

type TinyFishAsyncStartResponse = {
  run_id?: string;
  error?: string | null;
};

type TinyFishBatchRun = {
  run_id: string;
  status?: string;
  result?: unknown;
  error?: string | null;
  goal?: string;
  created_at?: string;
  started_at?: string;
  finished_at?: string;
};

type TinyFishBatchResponse = {
  data?: TinyFishBatchRun[];
  not_found?: string[] | null;
};

export const defaultSources: SourceDefinition[] = [
  {
    id: "aws-activate",
    label: "AWS Activate",
    sourceType: "grant",
    url: "https://aws.amazon.com/startups/credits",
    region: "Global"
  },
  {
    id: "google-startups-cloud",
    label: "Google for Startups Cloud Program",
    sourceType: "grant",
    url: "https://cloud.google.com/startup/benefits",
    region: "Global"
  },
  {
    id: "yc-apply",
    label: "Y Combinator Apply",
    sourceType: "accelerator",
    url: "https://www.ycombinator.com/apply",
    region: "Global"
  },
  {
    id: "grants-gov-search",
    label: "Grants.gov Search",
    sourceType: "grant",
    url: "https://www.grants.gov/search-grants",
    region: "United States"
  }
];

export function getSourcePortfolio(objective: Objective): SourceDefinition[] {
  const selectedByType = defaultSources.filter((source) => objective.sourceTypes.includes(source.sourceType));
  if (objective.sourceIds.length === 0) {
    return selectedByType;
  }
  const selectedIds = new Set(objective.sourceIds);
  return selectedByType.filter((source) => selectedIds.has(source.id));
}

export async function createProvider(mode: RunMode): Promise<OpportunityProvider> {
  if (mode === "mock") {
    return new MockOpportunityProvider();
  }
  if (mode === "replay") {
    return new ReplayOpportunityProvider();
  }
  return new TinyFishLiveProvider();
}

class ReplayOpportunityProvider implements OpportunityProvider {
  readonly name = "replay";
  readonly mode = "replay" as const;

  async search(objective: Objective, sources: SourceDefinition[]): Promise<ProviderSearchResult[]> {
    const fixturePath = path.join(config.fixturesDir, "replay", `${objective.fixtureId}.json`);
    const raw = JSON.parse(await readFile(fixturePath, "utf8")) as {
      results: Array<{ sourceId: string; rawOpportunities: RawOpportunity[]; rawEventLog?: unknown[] }>;
    };

    return raw.results.flatMap((entry) => {
      const source = sources.find((candidate) => candidate.id === entry.sourceId);
      if (!source) {
        return [];
      }
      return [
        {
          source,
          requestGoal: buildTinyfishGoal(source, objective),
          rawOpportunities: entry.rawOpportunities.map((item) => rawOpportunitySchema.parse(item)),
          rawEventLog: entry.rawEventLog ?? []
        }
      ];
    });
  }
}

class MockOpportunityProvider implements OpportunityProvider {
  readonly name = "mock";
  readonly mode = "mock" as const;

  async search(objective: Objective, sources: SourceDefinition[]): Promise<ProviderSearchResult[]> {
    return sources.map((source, index) => ({
      source,
      requestGoal: buildTinyfishGoal(source, objective),
      rawOpportunities: [
        rawOpportunitySchema.parse({
          title: `${objective.sectors[0] ?? "AI"} Founder Support Program ${index + 1}`,
          issuer: source.label,
          source_url: source.url,
          application_url: source.url,
          source_type: source.sourceType,
          reward_value_text: index === 0 ? "$200,000 credits" : "$50,000 to $250,000 support",
          deadline_text: index === 2 ? null : "Rolling applications",
          geography: objective.geography,
          eligibility_bullets: [
            "Early-stage company",
            `Relevant to ${objective.query}`
          ],
          summary: `Mock fallback opportunity for ${objective.title}.`,
          evidence_snippets: [
            `${source.label} mock fixture`,
            objective.query
          ]
        })
      ],
      rawEventLog: [{ type: "mock_result", sourceId: source.id }]
    }));
  }
}

class TinyFishLiveProvider implements OpportunityProvider {
  readonly name = "tinyfish";
  readonly mode = "live" as const;

  async search(objective: Objective, sources: SourceDefinition[]): Promise<ProviderSearchResult[]> {
    if (config.tinyfishApiKey) {
      return this.searchViaApi(objective, sources);
    }
    await this.assertTinyFishCliReady();
    return Promise.all(sources.map((source) => this.runSource(objective, source)));
  }

  private async searchViaApi(objective: Objective, sources: SourceDefinition[]): Promise<ProviderSearchResult[]> {
    const startedRuns = await Promise.all(sources.map(async (source) => {
      const requestGoal = buildTinyfishGoal(source, objective);
      const response = await tinyfishRequest<TinyFishAsyncStartResponse>("/v1/automation/run-async", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-api-key": config.tinyfishApiKey as string
        },
        body: JSON.stringify({
          url: source.url,
          goal: requestGoal,
          browser_profile: config.tinyfishBrowserProfile
        })
      });

      if (!response.run_id || response.error) {
        throw new Error(`TinyFish async run start failed for ${source.label}: ${response.error ?? "missing run_id"}`);
      }

      return {
        source,
        requestGoal,
        runId: response.run_id
      };
    }));

    const runs = await this.waitForApiRuns(startedRuns);
    return runs.map(({ source, requestGoal, run }) => {
      try {
        return {
          source,
          requestGoal,
          rawOpportunities: parseTinyFishResultPayload(run.result, source),
          rawEventLog: [run]
        };
      } catch (error) {
        const excerpt = JSON.stringify(run.result)?.slice(0, 800) ?? "unserializable result";
        throw new Error(`Unable to parse TinyFish API result for ${source.label}: ${String(error)}. Result excerpt: ${excerpt}`);
      }
    });
  }

  private async waitForApiRuns(
    startedRuns: Array<{ source: SourceDefinition; requestGoal: string; runId: string }>
  ): Promise<Array<{ source: SourceDefinition; requestGoal: string; run: TinyFishBatchRun }>> {
    const pending = new Map(startedRuns.map((item) => [item.runId, item]));
    const completed: Array<{ source: SourceDefinition; requestGoal: string; run: TinyFishBatchRun }> = [];
    const deadline = Date.now() + config.tinyfishRunTimeoutMs;

    while (pending.size > 0 && Date.now() < deadline) {
      const batch = await tinyfishRequest<TinyFishBatchResponse>("/v1/runs/batch", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-api-key": config.tinyfishApiKey as string
        },
        body: JSON.stringify({
          run_ids: [...pending.keys()]
        })
      });

      if (Array.isArray(batch.not_found) && batch.not_found.length > 0) {
        throw new Error(`TinyFish batch lookup lost runs: ${batch.not_found.join(", ")}`);
      }

      for (const run of batch.data ?? []) {
        const started = pending.get(run.run_id);
        if (!started) {
          continue;
        }

        const status = String(run.status ?? "").toUpperCase();
        if (status === "COMPLETED") {
          completed.push({ ...started, run });
          pending.delete(run.run_id);
          continue;
        }

        if (status === "FAILED" || status === "ERROR" || status === "CANCELLED") {
          throw new Error(`TinyFish run failed for ${started.source.label}: ${run.error ?? status}`);
        }
      }

      if (pending.size > 0) {
        await sleep(config.tinyfishPollIntervalMs);
      }
    }

    if (pending.size > 0) {
      throw new Error(`TinyFish batch polling timed out for runs: ${[...pending.keys()].join(", ")}`);
    }

    return completed;
  }

  private async assertTinyFishCliReady(): Promise<void> {
    const version = await runCommand(config.tinyfishExecutable, ["--version"]);
    if (version.exitCode !== 0) {
      throw new Error("TinyFish API key is not configured, and TinyFish CLI is not installed or not executable.");
    }

    const authStatus = await runCommand(config.tinyfishExecutable, ["auth", "status"]);
    const authOutput = `${authStatus.stdout}\n${authStatus.stderr}`.toLowerCase();
    if (authStatus.exitCode !== 0 || authOutput.includes("not authenticated") || authOutput.includes("login")) {
      throw new Error("TinyFish API key is not configured, and TinyFish CLI is available but not authenticated.");
    }
  }

  private async runSource(objective: Objective, source: SourceDefinition): Promise<ProviderSearchResult> {
    const requestGoal = buildTinyfishGoal(source, objective);
    const result = await runCommand(config.tinyfishExecutable, [
      "agent",
      "run",
      "--sync",
      "--url",
      source.url,
      requestGoal
    ], 180_000);

    if (result.exitCode !== 0) {
      throw new Error(`TinyFish failed for ${source.label}: ${result.stderr || result.stdout}`);
    }

    const rawOpportunities = parseTinyFishOutput(result.stdout);
    return {
      source,
      requestGoal,
      rawOpportunities: rawOpportunities.map((item) => rawOpportunitySchema.parse(item)),
      rawEventLog: result.stdout.split("\n").filter(Boolean)
    };
  }
}

async function runCommand(command: string, args: string[], timeoutMs = 20_000): Promise<{ stdout: string; stderr: string; exitCode: number | null }> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: ["ignore", "pipe", "pipe"] });
    let stdout = "";
    let stderr = "";

    const timer = setTimeout(() => {
      child.kill("SIGTERM");
      reject(new Error(`Command timed out: ${command} ${args.join(" ")}`));
    }, timeoutMs);

    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });

    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });

    child.on("error", (error) => {
      clearTimeout(timer);
      reject(error);
    });

    child.on("close", (exitCode) => {
      clearTimeout(timer);
      resolve({ stdout, stderr, exitCode });
    });
  });
}

function parseTinyFishOutput(stdout: string): RawOpportunity[] {
  const direct = parseJsonText<unknown>(stdout.trim());
  if (Array.isArray(direct)) {
    return direct.map((item) => rawOpportunitySchema.parse(item));
  }

  const lines = stdout.split("\n").map((line) => line.trim()).filter(Boolean);
  for (const line of lines.reverse()) {
    if (!line.startsWith("data:")) {
      continue;
    }
    const payload = parseJsonText<{ resultJson?: unknown; type?: string }>(line.slice(5).trim());
    if (!payload) {
      continue;
    }
    if (Array.isArray(payload.resultJson)) {
      return payload.resultJson.map((item) => rawOpportunitySchema.parse(item));
    }
    if (typeof payload.resultJson === "string") {
      const parsed = parseJsonText<unknown>(payload.resultJson);
      if (Array.isArray(parsed)) {
        return parsed.map((item) => rawOpportunitySchema.parse(item));
      }
    }
  }

  throw new Error("Unable to parse TinyFish output into strict JSON opportunities.");
}

export function parseTinyFishResultPayload(payload: unknown, source?: SourceDefinition): RawOpportunity[] {
  if (Array.isArray(payload)) {
    if (payload.length === 0) {
      return [];
    }
    try {
      return payload.map((item) => rawOpportunitySchema.parse(item));
    } catch {
      const coerced = payload.map((item) => coerceTinyFishOpportunity(item, source)).filter((item): item is RawOpportunity => item !== null);
      if (coerced.length > 0) {
        return coerced.map((item) => rawOpportunitySchema.parse(item));
      }
    }
  }

  if (typeof payload === "string") {
    for (const candidate of extractJsonCandidates(payload)) {
      const parsed = parseJsonText<unknown>(candidate);
      if (parsed !== null) {
        return parseTinyFishResultPayload(parsed, source);
      }
    }
  }

  if (payload && typeof payload === "object") {
    if (looksLikeRawOpportunity(payload)) {
      return [rawOpportunitySchema.parse(payload)];
    }

    const record = payload as Record<string, unknown>;
    const coerced = coerceTinyFishOpportunity(record, source);
    if (coerced) {
      return [rawOpportunitySchema.parse(coerced)];
    }

    for (const key of ["resultJson", "result", "data", "output"]) {
      if (!(key in record)) {
        continue;
      }
      try {
        return parseTinyFishResultPayload(record[key], source);
      } catch {
        // Keep trying the remaining common TinyFish result shapes.
      }
    }

    for (const value of Object.values(record)) {
      try {
        return parseTinyFishResultPayload(value, source);
      } catch {
        // Keep trying nested values until one resolves.
      }
    }
  }

  throw new Error("Unable to parse TinyFish API result into strict JSON opportunities.");
}

function looksLikeRawOpportunity(payload: unknown): payload is RawOpportunity {
  if (!payload || typeof payload !== "object") {
    return false;
  }
  const record = payload as Record<string, unknown>;
  return typeof record.title === "string" && typeof record.source_url === "string";
}

function extractJsonCandidates(text: string): string[] {
  const trimmed = text.trim();
  const candidates = [trimmed];

  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i)?.[1]?.trim();
  if (fenced) {
    candidates.push(fenced);
  }

  const arrayStart = trimmed.indexOf("[");
  const arrayEnd = trimmed.lastIndexOf("]");
  if (arrayStart >= 0 && arrayEnd > arrayStart) {
    candidates.push(trimmed.slice(arrayStart, arrayEnd + 1));
  }

  const objectStart = trimmed.indexOf("{");
  const objectEnd = trimmed.lastIndexOf("}");
  if (objectStart >= 0 && objectEnd > objectStart) {
    candidates.push(trimmed.slice(objectStart, objectEnd + 1));
  }

  return [...new Set(candidates)];
}

function coerceTinyFishOpportunity(payload: unknown, source?: SourceDefinition): RawOpportunity | null {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  const record = payload as Record<string, unknown>;
  const title = firstString(record.title, record.name, record.opportunity_title);
  if (!title) {
    return null;
  }

  const sourceUrl = firstString(
    record.source_url,
    record.sourceUrl,
    record.page_url,
    record.pageUrl,
    record.application_url,
    record.applicationUrl,
    record.url,
    record.link,
    record.href,
    source?.url
  );

  if (!sourceUrl) {
    return null;
  }

  const applicationUrl = firstString(
    record.application_url,
    record.applicationUrl,
    record.apply_url,
    record.applyUrl,
    record.url,
    record.link,
    record.href
  );

  return {
    title,
    issuer: firstNullableString(record.issuer, record.provider, record.organization, record.organizer, record.company),
    source_url: sourceUrl,
    application_url: applicationUrl,
    source_type: normalizeSourceType(firstString(record.source_type, record.sourceType, source?.sourceType)),
    reward_value_text: firstNullableString(
      record.reward_value_text,
      record.rewardValueText,
      record.reward,
      record.reward_value,
      record.rewardValue,
      record.value,
      record.amount,
      record.credits,
      record.benefit,
      record.benefits
    ),
    deadline_text: firstNullableString(record.deadline_text, record.deadline, record.application_deadline, record.applicationDeadline),
    geography: firstNullableString(record.geography, record.region, record.location, source?.region),
    eligibility_bullets: normalizeStringArray(record.eligibility_bullets ?? record.eligibility ?? record.requirements ?? record.criteria),
    summary: firstNullableString(record.summary, record.description, record.overview),
    evidence_snippets: normalizeStringArray(record.evidence_snippets ?? record.evidence ?? record.highlights ?? record.quotes)
  };
}

function firstString(...values: unknown[]): string | null {
  for (const value of values) {
    if (typeof value === "string" && value.trim().length > 0) {
      return value.trim();
    }
  }
  return null;
}

function firstNullableString(...values: unknown[]): string | null {
  return firstString(...values);
}

function normalizeStringArray(value: unknown): string[] {
  if (typeof value === "string") {
    return value.trim().length > 0 ? [value.trim()] : [];
  }
  if (!Array.isArray(value)) {
    return [];
  }
  return value
    .flatMap((item) => {
      if (typeof item === "string") {
        return item.trim();
      }
      if (item && typeof item === "object") {
        return firstString(
          (item as Record<string, unknown>).text,
          (item as Record<string, unknown>).value,
          (item as Record<string, unknown>).quote
        ) ?? [];
      }
      return [];
    })
    .filter((item): item is string => typeof item === "string" && item.length > 0);
}

function normalizeSourceType(value: string | null): RawOpportunity["source_type"] {
  if (value === "grant" || value === "accelerator" || value === "tender" || value === "other") {
    return value;
  }
  return "other";
}

async function tinyfishRequest<T>(pathname: string, init: RequestInit): Promise<T> {
  const response = await fetch(`${config.tinyfishApiBaseUrl}${pathname}`, init);
  const text = await response.text();
  const payload = parseJsonText<unknown>(text);

  if (!response.ok) {
    const message = payload && typeof payload === "object" && typeof (payload as Record<string, unknown>).error === "string"
      ? (payload as Record<string, unknown>).error
      : text;
    throw new Error(`TinyFish API request failed (${response.status}): ${message}`);
  }

  if (payload === null) {
    throw new Error(`TinyFish API returned non-JSON response for ${pathname}.`);
  }

  return payload as T;
}

async function sleep(ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

export function buildArtifact(runId: string, mode: RunMode, providerName: string, result: ProviderSearchResult): ProviderArtifact {
  return {
    artifactId: makeId("artifact"),
    runId,
    provider: providerName,
    mode,
    requestGoal: result.requestGoal,
    sourceId: result.source.id,
    sourceLabel: result.source.label,
    sourceUrl: result.source.url,
    rawJson: result.rawOpportunities,
    rawEventLog: result.rawEventLog,
    createdAt: nowIso()
  };
}
