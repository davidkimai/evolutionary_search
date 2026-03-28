import { createAppServerClient } from "../appserver/client.js";
import type { Objective, ObjectiveInput, RunMode, RunRecord, RunEvent } from "../core/types.js";
import { buildArtifact, createProvider, getSourcePortfolio } from "../providers/index.js";
import { buildMarkdownExport, normalizeAndRank } from "./pipeline.js";
import { FileStore } from "./file-store.js";
import { makeId, nowIso } from "../utils/helpers.js";

export class RunService {
  constructor(
    private readonly store = new FileStore(),
    private readonly appServer = createAppServerClient()
  ) {}

  async createObjective(input: ObjectiveInput): Promise<Objective> {
    return this.store.createObjective(input);
  }

  async listObjectives(): Promise<Objective[]> {
    return this.store.listObjectives();
  }

  async getObjective(objectiveId: string): Promise<Objective | null> {
    return this.store.getObjective(objectiveId);
  }

  async listRuns(): Promise<RunRecord[]> {
    return this.store.listRuns();
  }

  async getRun(runId: string): Promise<RunRecord | null> {
    return this.store.getRun(runId);
  }

  async startRunFromObjectiveId(objectiveId: string, mode: RunMode): Promise<RunRecord> {
    const objective = await this.store.getObjective(objectiveId);
    if (!objective) {
      throw new Error(`Unknown objective: ${objectiveId}`);
    }
    return this.startRun(objective, mode);
  }

  async createObjectiveAndRun(input: ObjectiveInput, mode: RunMode): Promise<RunRecord> {
    const objective = await this.store.createObjective(input);
    return this.startRun(objective, mode);
  }

  async reviewRun(runId: string): Promise<RunRecord> {
    const run = await this.requireRun(runId);
    if (!run.appServer.threadId) {
      throw new Error(`Run ${runId} has no app-server thread to review.`);
    }
    const review = await this.appServer.reviewRun(run.runId, run.appServer.threadId, run.opportunities);
    run.appServer.reviewTurnId = review.turnId;
    run.appServer.reviewThreadId = review.reviewThreadId;
    run.appServer.lastReview = review.reviewText;
    run.events.push(...review.events);
    run.updatedAt = nowIso();
    run.exportRecord = null;
    return this.store.saveRun(run);
  }

  async exportRun(runId: string): Promise<string> {
    const run = await this.requireRun(runId);
    if (!run.exportRecord) {
      run.exportRecord = buildMarkdownExport(run);
      run.updatedAt = nowIso();
      await this.store.saveRun(run);
    }
    return run.exportRecord.body;
  }

  async smokeReplay(): Promise<RunRecord> {
    return this.createObjectiveAndRun(
      {
        title: "AI startup program search",
        query: "AI startup credits and accelerator programs",
        profile: "Seed-stage startup building AI developer tools with a small engineering team.",
        geography: "Global",
        sectors: ["AI", "developer tools", "cloud"],
        sourceTypes: ["grant", "accelerator"],
        sourceIds: [],
        constraints: ["Prefer programs with explicit application or benefit details"],
        fixtureId: "demo-opportunities"
      },
      "replay"
    );
  }

  async smokeLiveProof(): Promise<RunRecord> {
    return this.createObjectiveAndRun(
      {
        title: "AI startup program live proof",
        query: "AI startup cloud credit program with explicit benefits and application details",
        profile: "Seed-stage startup building AI developer tools with a small engineering team.",
        geography: "Global",
        sectors: ["AI", "developer tools", "cloud"],
        sourceTypes: ["grant"],
        sourceIds: ["aws-activate"],
        constraints: ["Prefer explicit credit amounts, benefits, and application details"],
        fixtureId: "demo-opportunities"
      },
      "live"
    );
  }

  private async startRun(objective: Objective, mode: RunMode): Promise<RunRecord> {
    const sources = getSourcePortfolio(objective);
    if (sources.length === 0) {
      throw new Error("Objective did not resolve to any supported sources.");
    }
    let run = await this.store.createRun(objective, mode, sources);
    run = this.appendEvent(run, "run_created", `Run created in ${mode} mode.`, {
      sourceCount: sources.length
    });

    run.status = "running";
    run.updatedAt = nowIso();
    await this.store.saveRun(run);

    try {
      const kickoff = await this.appServer.kickoffRun(run.runId, objective, mode);
      run.appServer.status = "started";
      run.appServer.threadId = kickoff.threadId;
      run.appServer.kickoffTurnId = kickoff.turnId;
      run.events.push(...kickoff.events);
      if (kickoff.summary) {
        run = this.appendEvent(run, "app_server_summary", kickoff.summary);
      }
    } catch (error) {
      run.appServer.status = "failed";
      run.appServer.lastError = String(error);
      run.errors.push(String(error));
      run = this.appendEvent(run, "run_failed", `App-server startup failed: ${String(error)}`);
      run.status = "failed";
      run.updatedAt = nowIso();
      await this.store.saveRun(run);
      throw error;
    }

    run = this.appendEvent(run, "provider_started", `Starting ${mode} provider across ${sources.length} sources.`);
    await this.store.saveRun(run);

    try {
      const provider = await createProvider(mode);
      const results = await provider.search(objective, sources);
      run.events.push(...results.map((result) => this.makeEvent(run.runId, "raw_result_received", `Received ${result.rawOpportunities.length} raw opportunities from ${result.source.label}.`, {
        sourceId: result.source.id,
        sourceLabel: result.source.label
      })));
      run.artifacts = results.map((result) => buildArtifact(run.runId, mode, provider.name, result));
      run.opportunities = normalizeAndRank(run.runId, objective, results);
      run = this.appendEvent(run, "normalization_complete", `Normalized ${run.opportunities.length} ranked opportunities.`);
      run.status = "completed";
      run.updatedAt = nowIso();
      run.exportRecord = buildMarkdownExport(run);
      run = this.appendEvent(run, "export_ready", "Markdown dossier generated.");
      run = this.appendEvent(run, "run_completed", `Run completed with ${run.opportunities.length} ranked opportunities.`);
      return this.store.saveRun(run);
    } catch (error) {
      run.status = "failed";
      run.updatedAt = nowIso();
      run.errors.push(String(error));
      run = this.appendEvent(run, "run_failed", `Provider or ranking failure: ${String(error)}`);
      await this.store.saveRun(run);
      throw error;
    }
  }

  private appendEvent(run: RunRecord, type: string, message: string, data: Record<string, unknown> = {}): RunRecord {
    run.events.push(this.makeEvent(run.runId, type, message, data));
    run.updatedAt = nowIso();
    return run;
  }

  private makeEvent(runId: string, type: string, message: string, data: Record<string, unknown> = {}): RunEvent {
    return {
      eventId: makeId("evt"),
      runId,
      type,
      message,
      at: nowIso(),
      data
    };
  }

  private async requireRun(runId: string): Promise<RunRecord> {
    const run = await this.store.getRun(runId);
    if (!run) {
      throw new Error(`Unknown run: ${runId}`);
    }
    return run;
  }
}
