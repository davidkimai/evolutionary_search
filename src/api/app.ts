import path from "node:path";

import fastify from "fastify";
import fastifyStatic from "@fastify/static";
import { ZodError } from "zod";

import { config } from "../core/config.js";
import { objectiveInputSchema, runModeSchema } from "../core/types.js";
import { buildHtmlExportReport } from "../services/pipeline.js";
import { RunService } from "../services/run-service.js";

export function createApp(service = new RunService()) {
  const app = fastify({ logger: false });

  app.register(fastifyStatic, {
    root: config.publicDir,
    prefix: "/public/"
  });

  app.setErrorHandler((error, _request, reply) => {
    if (error instanceof ZodError) {
      reply.status(400).send({ error: "validation_error", details: error.issues });
      return;
    }
    const message = error instanceof Error ? error.message : String(error);
    reply.status(500).send({ error: "internal_error", message });
  });

  app.get("/", async (_request, reply) => reply.sendFile("index.html", path.join(config.publicDir)));
  app.get("/health", async () => ({ ok: true }));
  app.get("/ready", async () => ({ ready: true }));

  app.get("/v1/objectives", async () => ({ data: await service.listObjectives() }));
  app.post("/v1/objectives", async (request) => {
    const payload = objectiveInputSchema.parse(request.body ?? {});
    return { objective: await service.createObjective(payload) };
  });

  app.get("/v1/runs", async () => ({ data: await service.listRuns() }));
  app.post("/v1/runs", async (request) => {
    const body = request.body as Record<string, unknown>;
    const mode = runModeSchema.parse(body.mode ?? "replay");
    if (typeof body.objectiveId === "string") {
      return { run: await service.startRunFromObjectiveId(body.objectiveId, mode) };
    }
    const payload = objectiveInputSchema.parse(body.objective ?? body);
    return { run: await service.createObjectiveAndRun(payload, mode) };
  });

  app.get("/v1/runs/:runId", async (request, reply) => {
    const run = await service.getRun((request.params as { runId: string }).runId);
    if (!run) {
      return reply.status(404).send({ error: "not_found" });
    }
    return { run };
  });

  app.get("/v1/runs/:runId/events", async (request, reply) => {
    const run = await service.getRun((request.params as { runId: string }).runId);
    if (!run) {
      return reply.status(404).send({ error: "not_found" });
    }
    return { data: run.events };
  });

  app.get("/v1/runs/:runId/opportunities", async (request, reply) => {
    const run = await service.getRun((request.params as { runId: string }).runId);
    if (!run) {
      return reply.status(404).send({ error: "not_found" });
    }
    return { data: run.opportunities };
  });

  app.post("/v1/runs/:runId/review", async (request, reply) => {
    try {
      return { run: await service.reviewRun((request.params as { runId: string }).runId) };
    } catch (error) {
      return reply.status(400).send({ error: "review_failed", message: String(error) });
    }
  });

  app.get("/v1/opportunities/:opportunityId", async (request, reply) => {
    const runs = await service.listRuns();
    const opportunity = runs.flatMap((run) => run.opportunities).find((item) => item.opportunityId === (request.params as { opportunityId: string }).opportunityId);
    if (!opportunity) {
      return reply.status(404).send({ error: "not_found" });
    }
    return { opportunity };
  });

  app.get("/v1/exports/:runId.md", async (request, reply) => {
    try {
      const runId = (request.params as { runId: string }).runId;
      const body = await service.exportRun(runId);
      const run = await service.getRun(runId);
      if (!run) {
        return reply.status(404).send({ error: "not_found" });
      }
      const query = request.query as { view?: string } | undefined;
      if (query?.view === "report") {
        reply.header("content-type", "text/html; charset=utf-8");
        return buildHtmlExportReport(run);
      }
      reply.header("content-type", "text/markdown; charset=utf-8");
      reply.header("content-disposition", `attachment; filename="${runId}-dossier.md"`);
      return body;
    } catch (error) {
      return reply.status(404).send({ error: "not_found", message: String(error) });
    }
  });

  app.get("/v1/providers/status", async () => ({
    codexAppServerMode: config.codexAppServerMode,
    tinyfishApiBaseUrl: config.tinyfishApiBaseUrl,
    tinyfishApiConfigured: Boolean(config.tinyfishApiKey),
    tinyfishBrowserProfile: config.tinyfishBrowserProfile,
    tinyfishExecutable: config.tinyfishExecutable,
    codexExecutable: config.codexExecutable
  }));

  return app;
}
