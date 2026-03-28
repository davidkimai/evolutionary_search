import { readFileSync } from "node:fs";
import path from "node:path";

import type { Objective, SourceDefinition } from "./types.js";
import { config } from "./config.js";

function readPromptAsset(fileName: string): string {
  return readFileSync(path.join(config.repoRoot, "prompt-assets", fileName), "utf8").trim();
}

export const promptAssets = {
  evidencePrompt: readPromptAsset("evidence_prompt.md"),
  rankingPrompt: readPromptAsset("ranking_prompt.md"),
  tinyfishGoalTemplate: readPromptAsset("tinyfish_goal_template.md")
} as const;

export function buildTinyfishGoal(source: SourceDefinition, objective: Objective): string {
  const sectorText = objective.sectors.length > 0 ? objective.sectors.join(", ") : "broad opportunity relevance";
  const constraintText = objective.constraints.length > 0 ? objective.constraints.join("; ") : "no extra constraints";

  return [
    promptAssets.tinyfishGoalTemplate,
    "## Evidence discipline",
    promptAssets.evidencePrompt,
    "<objective>",
    `title: ${objective.title}`,
    `query: ${objective.query}`,
    `profile: ${objective.profile}`,
    `preferred_geography: ${objective.geography}`,
    `sectors: ${sectorText}`,
    `constraints: ${constraintText}`,
    "</objective>",
    "<source>",
    `label: ${source.label}`,
    `type: ${source.sourceType}`,
    `url: ${source.url}`,
    "</source>",
    "Only include candidates that are relevant to the objective and supported by literal evidence snippets from the source."
  ].join("\n\n");
}
