import { Command } from "commander";

import type { ObjectiveInput, RunRecord } from "./core/types.js";
import { RunService } from "./services/run-service.js";

const service = new RunService();
const program = new Command();

program
  .name("owes")
  .description("Codex-Native Open Web Evolutionary Search CLI")
  .option("--json", "emit JSON output");

const objective = program.command("objective");
objective.command("create")
  .requiredOption("--title <title>")
  .requiredOption("--query <query>")
  .requiredOption("--profile <profile>")
  .option("--geography <geography>", "preferred geography", "Global")
  .option("--sector <sector>", "repeatable sector", collect, [])
  .option("--source-type <sourceType>", "repeatable source type", collect, ["grant", "accelerator", "tender"])
  .option("--source-id <sourceId>", "repeatable source id", collect, [])
  .option("--constraint <constraint>", "repeatable constraint", collect, [])
  .option("--fixture-id <fixtureId>", "replay fixture id", "demo-opportunities")
  .action(async (options) => {
    const payload: ObjectiveInput = {
      title: options.title,
      query: options.query,
      profile: options.profile,
      geography: options.geography,
      sectors: options.sector,
      sourceTypes: options.sourceType,
      sourceIds: options.sourceId,
      constraints: options.constraint,
      fixtureId: options.fixtureId
    };
    emit(await service.createObjective(payload), program.opts().json);
  });

objective.command("list").action(async () => {
  emit(await service.listObjectives(), program.opts().json);
});

const run = program.command("run");
run.command("start")
  .requiredOption("--objective-id <objectiveId>")
  .option("--mode <mode>", "run mode", "replay")
  .action(async (options) => {
    emit(await service.startRunFromObjectiveId(options.objectiveId, options.mode), program.opts().json);
  });

run.command("list").action(async () => {
  emit(await service.listRuns(), program.opts().json);
});

run.command("show")
  .argument("<runId>")
  .action(async (runId) => {
    emit(await service.getRun(runId), program.opts().json);
  });

run.command("review")
  .argument("<runId>")
  .action(async (runId) => {
    emit(await service.reviewRun(runId), program.opts().json);
  });

run.command("export")
  .argument("<runId>")
  .action(async (runId) => {
    const body = await service.exportRun(runId);
    if (program.opts().json) {
      emit({ runId, body }, true);
      return;
    }
    console.log(body);
  });

const demo = program.command("demo");
demo.command("replay").action(async () => {
  emit(await service.smokeReplay(), program.opts().json);
});

demo.command("live").action(async () => {
  emit(await service.smokeLiveProof(), program.opts().json);
});

demo.command("export").action(async () => {
  const run = await service.smokeReplay();
  const body = await service.exportRun(run.runId);
  if (program.opts().json) {
    emit({ runId: run.runId, body }, true);
    return;
  }
  console.log(body);
});

program.command("smoke").action(async () => {
  const run = await service.smokeReplay();
  const summary = summarizeRun(run);
  emit(summary, program.opts().json);
});

program.parseAsync(process.argv).catch((error) => {
  console.error(error);
  process.exit(1);
});

function emit(value: unknown, asJson: boolean): void {
  if (asJson) {
    console.log(JSON.stringify(value, null, 2));
    return;
  }
  if (typeof value === "string") {
    console.log(value);
    return;
  }
  console.log(JSON.stringify(value, null, 2));
}

function collect(value: string, previous: string[]): string[] {
  return [...previous, value];
}

function summarizeRun(run: RunRecord) {
  return {
    runId: run.runId,
    status: run.status,
    topOpportunity: run.opportunities[0]?.title ?? null,
    opportunityCount: run.opportunities.length,
    eventCount: run.events.length,
    hasExport: Boolean(run.exportRecord)
  };
}
