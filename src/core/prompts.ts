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
    `Objective title: ${objective.title}`,
    `Objective query: ${objective.query}`,
    `Profile: ${objective.profile}`,
    `Preferred geography: ${objective.geography}`,
    `Sectors: ${sectorText}`,
    `Constraints: ${constraintText}`,
    `Source label: ${source.label}`,
    `Source type: ${source.sourceType}`,
    `Source URL: ${source.url}`,
    "Only return opportunities that are relevant to the objective and supported by literal evidence snippets from the source."
  ].join("\n\n");
}
