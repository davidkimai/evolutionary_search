import path from "node:path";

import { config } from "../core/config.js";
import {
  objectiveInputSchema,
  objectiveSchema,
  runModeSchema,
  runRecordSchema,
  type Objective,
  type ObjectiveInput,
  type RunMode,
  type RunRecord,
  type SourceDefinition
} from "../core/types.js";
import { listJsonFiles, makeId, nowIso, readJson, writeJson } from "../utils/helpers.js";

export class FileStore {
  private readonly objectivesDir = path.join(config.dataDir, "objectives");
  private readonly runsDir = path.join(config.dataDir, "runs");

  async createObjective(input: ObjectiveInput): Promise<Objective> {
    const parsed = objectiveInputSchema.parse(input);
    const objective = objectiveSchema.parse({
      ...parsed,
      objectiveId: makeId("obj"),
      createdAt: nowIso()
    });
    await writeJson(this.getObjectivePath(objective.objectiveId), objective);
    return objective;
  }

  async listObjectives(): Promise<Objective[]> {
    const files = await listJsonFiles(this.objectivesDir);
    const objectives = await Promise.all(files.map((filePath) => readJson<Objective>(filePath)));
    return objectives.filter((value): value is Objective => value !== null).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  async getObjective(objectiveId: string): Promise<Objective | null> {
    const value = await readJson<Objective>(this.getObjectivePath(objectiveId));
    return value ? objectiveSchema.parse(value) : null;
  }

  async createRun(objective: Objective, mode: RunMode, sources: SourceDefinition[]): Promise<RunRecord> {
    const parsedMode = runModeSchema.parse(mode);
    const timestamp = nowIso();
    const record = runRecordSchema.parse({
      runId: makeId("run"),
      objective,
      mode: parsedMode,
      status: "queued",
      createdAt: timestamp,
      updatedAt: timestamp,
      sources,
      appServer: {
        status: "not_started",
        threadId: null,
        kickoffTurnId: null,
        reviewTurnId: null,
        reviewThreadId: null,
        lastError: null,
        lastReview: null
      },
      events: [],
      artifacts: [],
      opportunities: [],
      exportRecord: null,
      errors: []
    });
    await writeJson(this.getRunPath(record.runId), record);
    return record;
  }

  async getRun(runId: string): Promise<RunRecord | null> {
    const value = await readJson<RunRecord>(this.getRunPath(runId));
    return value ? runRecordSchema.parse(value) : null;
  }

  async listRuns(): Promise<RunRecord[]> {
    const files = await listJsonFiles(this.runsDir);
    const runs = await Promise.all(files.map((filePath) => readJson<RunRecord>(filePath)));
    return runs.filter((value): value is RunRecord => value !== null).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  async saveRun(run: RunRecord): Promise<RunRecord> {
    const parsed = runRecordSchema.parse(run);
    await writeJson(this.getRunPath(parsed.runId), parsed);
    return parsed;
  }

  private getObjectivePath(objectiveId: string): string {
    return path.join(this.objectivesDir, `${objectiveId}.json`);
  }

  private getRunPath(runId: string): string {
    return path.join(this.runsDir, `${runId}.json`);
  }
}
