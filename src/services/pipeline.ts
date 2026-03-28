import type { ProviderSearchResult } from "../providers/index.js";
import {
  scoreWeights,
  type ExportRecord,
  type Objective,
  type Opportunity,
  type RawOpportunity,
  type RunRecord,
  type ScoreBreakdown,
  type SourceType
} from "../core/types.js";
import { clamp01, makeId, nowIso, slugify, tokenize, uniqueStrings } from "../utils/helpers.js";

function parseRewardValue(text: string | null): { min: number | null; max: number | null } {
  if (!text) {
    return { min: null, max: null };
  }

  const matches = [...text.matchAll(/\$?\s*([0-9]{1,3}(?:,[0-9]{3})*(?:\.[0-9]+)?|[0-9]+(?:\.[0-9]+)?)([kKmM]?)/g)];
  if (matches.length === 0) {
    return { min: null, max: null };
  }

  const values = matches.map((match) => {
    const raw = Number(match[1].replaceAll(",", ""));
    const suffix = match[2]?.toLowerCase();
    if (suffix === "k") {
      return raw * 1_000;
    }
    if (suffix === "m") {
      return raw * 1_000_000;
    }
    return raw;
  });

  return {
    min: Math.min(...values),
    max: Math.max(...values)
  };
}

function parseDeadline(deadlineText: string | null): string | null {
  if (!deadlineText) {
    return null;
  }
  const parsed = new Date(deadlineText);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
}

function keywordOverlapScore(tokens: string[], text: string): number {
  if (tokens.length === 0) {
    return 0.4;
  }
  const haystack = new Set(tokenize(text));
  const hits = tokens.filter((token) => haystack.has(token)).length;
  return clamp01(hits / Math.max(2, Math.min(tokens.length, 8)));
}

function scoreRewardValue(valueMax: number | null): number {
  if (!valueMax) {
    return 0.35;
  }
  return clamp01(Math.log10(valueMax + 10) / 6);
}

function scoreDeadlineUrgency(deadlineIso: string | null): number {
  if (!deadlineIso) {
    return 0.4;
  }
  const now = Date.now();
  const deadline = new Date(deadlineIso).getTime();
  if (Number.isNaN(deadline)) {
    return 0.35;
  }
  const days = (deadline - now) / (1000 * 60 * 60 * 24);
  if (days <= 0) {
    return 0;
  }
  return clamp01(1 - days / 180);
}

function buildUncertaintyNotes(opportunity: Opportunity): string[] {
  const notes: string[] = [];
  if (opportunity.sourceType === "accelerator") {
    notes.push("Accelerator selectivity is not modeled from the current evidence.");
  }
  if (!opportunity.deadlineText) {
    notes.push("Deadline evidence is missing.");
  }
  if (opportunity.rewardValueText && opportunity.rewardValueNumericMax === null) {
    notes.push("Reward value is qualitative rather than numerically verified.");
  }
  if (opportunity.eligibilityBullets.length < 3) {
    notes.push("Eligibility evidence is high-level and may omit program gates.");
  }
  return uniqueStrings(notes);
}

function buildScoreBreakdown(opportunity: Opportunity, objective: Objective): ScoreBreakdown {
  const queryTokens = uniqueStrings([
    ...tokenize(objective.query),
    ...tokenize(objective.profile),
    ...objective.sectors.flatMap(tokenize)
  ]);
  const searchableText = [
    opportunity.title,
    opportunity.summary ?? "",
    opportunity.issuer ?? "",
    opportunity.geography ?? "",
    opportunity.eligibilityBullets.join(" ")
  ].join(" ");

  const profileFit = keywordOverlapScore(queryTokens, searchableText);
  const geographyBoost = objective.geography.toLowerCase() === "global"
    ? 0.75
    : searchableText.toLowerCase().includes(objective.geography.toLowerCase())
      ? 1
      : 0.35;
  const sourceTypeBoost = objective.sourceTypes.includes(opportunity.sourceType) ? 1 : 0.45;
  const strategicRelevance = clamp01((profileFit * 0.6) + (geographyBoost * 0.25) + (sourceTypeBoost * 0.15));
  const rewardValue = scoreRewardValue(opportunity.rewardValueNumericMax);
  const deadlineUrgency = scoreDeadlineUrgency(opportunity.deadlineIso);
  const feasibilityBase =
    (opportunity.applicationLink ? (opportunity.sourceType === "accelerator" ? 0.18 : 0.35) : 0.08) +
    (opportunity.eligibilityBullets.length > 0 ? 0.3 : 0.12) +
    (opportunity.summary ? 0.2 : 0.05) +
    (opportunity.deadlineText ? 0.1 : 0.03);
  const uncertaintyPenalty = Math.min(0.2, opportunity.uncertaintyNotes.length * 0.05);
  const applicationFeasibility = clamp01(feasibilityBase - uncertaintyPenalty);
  const evidenceConfidence = clamp01(
    (Math.min(opportunity.evidenceSnippets.length, 4) / 4) * 0.6 +
      (opportunity.summary ? 0.15 : 0.05) +
      (opportunity.rewardValueText ? 0.1 : 0.03) +
      (opportunity.deadlineText ? 0.1 : 0.03) +
      (opportunity.applicationLink ? 0.05 : 0.02) -
      Math.min(0.18, opportunity.uncertaintyNotes.length * 0.04)
  );

  return {
    profile_fit: profileFit,
    strategic_relevance: strategicRelevance,
    reward_value: rewardValue,
    deadline_urgency: deadlineUrgency,
    application_feasibility: applicationFeasibility,
    evidence_confidence: evidenceConfidence
  };
}

function weightedScore(breakdown: ScoreBreakdown): number {
  return clamp01(
    breakdown.profile_fit * scoreWeights.profile_fit +
      breakdown.strategic_relevance * scoreWeights.strategic_relevance +
      breakdown.reward_value * scoreWeights.reward_value +
      breakdown.deadline_urgency * scoreWeights.deadline_urgency +
      breakdown.application_feasibility * scoreWeights.application_feasibility +
      breakdown.evidence_confidence * scoreWeights.evidence_confidence
  );
}

function fitReason(opportunity: Opportunity, breakdown: ScoreBreakdown, objective: Objective): string {
  const strongestSignals = [
    breakdown.profile_fit > 0.7 ? `strong keyword overlap with ${objective.query}` : null,
    breakdown.strategic_relevance > 0.7 ? `good strategic relevance for ${objective.geography}` : null,
    breakdown.reward_value > 0.6 && opportunity.rewardValueText ? `clear value signal (${opportunity.rewardValueText})` : null,
    breakdown.application_feasibility > 0.7 ? "application path is explicit" : null,
    breakdown.evidence_confidence > 0.7 ? "evidence density is high" : null
  ].filter((value): value is string => value !== null);

  return strongestSignals.length > 0
    ? strongestSignals.slice(0, 2).join("; ")
    : `Relevant to ${objective.title} with evidence drawn from ${opportunity.sourceName}.`;
}

function verificationStatus(raw: RawOpportunity, sourceType: SourceType): Opportunity["verificationStatus"] {
  if (raw.evidence_snippets.length === 0) {
    return "incomplete";
  }
  if (raw.summary?.toLowerCase().includes("mock fallback")) {
    return "mock";
  }
  return sourceType === "other" ? "incomplete" : "evidence_backed";
}

function normalizeOpportunity(runId: string, objective: Objective, result: ProviderSearchResult, raw: RawOpportunity): Opportunity {
  const timestamp = nowIso();
  const reward = parseRewardValue(raw.reward_value_text);
  const opportunity: Opportunity = {
    opportunityId: makeId("opp"),
    runId,
    sourceName: result.source.label,
    sourceUrl: raw.source_url,
    sourceType: raw.source_type,
    title: raw.title,
    issuer: raw.issuer,
    summary: raw.summary,
    rewardValueText: raw.reward_value_text,
    rewardValueNumericMin: reward.min,
    rewardValueNumericMax: reward.max,
    deadlineText: raw.deadline_text,
    deadlineIso: parseDeadline(raw.deadline_text),
    geography: raw.geography,
    sectorTags: uniqueStrings([...objective.sectors, ...tokenize(raw.summary ?? "").slice(0, 3)]),
    eligibilityBullets: uniqueStrings(raw.eligibility_bullets),
    applicationLink: raw.application_url,
    evidenceSnippets: uniqueStrings(raw.evidence_snippets).slice(0, 5),
    uncertaintyNotes: [],
    fitReason: "",
    confidence: 0,
    verificationStatus: verificationStatus(raw, raw.source_type),
    dedupeClusterId: "",
    scoreBreakdown: {
      profile_fit: 0,
      strategic_relevance: 0,
      reward_value: 0,
      deadline_urgency: 0,
      application_feasibility: 0,
      evidence_confidence: 0
    },
    weightedScore: 0,
    createdAt: timestamp,
    updatedAt: timestamp
  };

  opportunity.uncertaintyNotes = buildUncertaintyNotes(opportunity);

  const breakdown = buildScoreBreakdown(opportunity, objective);
  const score = weightedScore(breakdown);
  return {
    ...opportunity,
    fitReason: fitReason(opportunity, breakdown, objective),
    confidence: breakdown.evidence_confidence,
    dedupeClusterId: `${slugify(raw.title)}-${slugify(raw.issuer ?? result.source.id)}`,
    scoreBreakdown: breakdown,
    weightedScore: score
  };
}

function mergeCluster(items: Opportunity[]): Opportunity {
  return items.reduce((best, current) => {
    if (current.weightedScore > best.weightedScore) {
      return {
        ...current,
        evidenceSnippets: uniqueStrings([...current.evidenceSnippets, ...best.evidenceSnippets]).slice(0, 5),
        eligibilityBullets: uniqueStrings([...current.eligibilityBullets, ...best.eligibilityBullets])
      };
    }
    return {
      ...best,
      evidenceSnippets: uniqueStrings([...best.evidenceSnippets, ...current.evidenceSnippets]).slice(0, 5),
      eligibilityBullets: uniqueStrings([...best.eligibilityBullets, ...current.eligibilityBullets])
    };
  });
}

export function normalizeAndRank(runId: string, objective: Objective, results: ProviderSearchResult[]): Opportunity[] {
  const normalized = results.flatMap((result) => result.rawOpportunities.map((raw) => normalizeOpportunity(runId, objective, result, raw)));
  const grouped = new Map<string, Opportunity[]>();

  for (const opportunity of normalized) {
    const cluster = grouped.get(opportunity.dedupeClusterId) ?? [];
    cluster.push(opportunity);
    grouped.set(opportunity.dedupeClusterId, cluster);
  }

  return [...grouped.values()]
    .map((cluster) => mergeCluster(cluster))
    .sort((a, b) => b.weightedScore - a.weightedScore || a.title.localeCompare(b.title));
}

export function buildMarkdownExport(run: RunRecord): ExportRecord {
  const lines = [
    `# ${run.objective.title}`,
    "",
    `- Run ID: ${run.runId}`,
    `- Mode: ${run.mode}`,
    `- Status: ${run.status}`,
    `- Objective query: ${run.objective.query}`,
    `- Profile: ${run.objective.profile}`,
    `- Geography: ${run.objective.geography}`,
    "",
    "## Ranked Opportunities"
  ];

  for (const [index, opportunity] of run.opportunities.entries()) {
    lines.push(`\n### ${index + 1}. ${opportunity.title}`);
    lines.push(`- Source: ${opportunity.sourceName}`);
    lines.push(`- URL: ${opportunity.sourceUrl}`);
    lines.push(`- Score: ${opportunity.weightedScore.toFixed(3)}`);
    lines.push(`- Fit: ${opportunity.fitReason}`);
    lines.push(`- Confidence: ${opportunity.confidence.toFixed(2)}`);
    if (opportunity.rewardValueText) {
      lines.push(`- Value: ${opportunity.rewardValueText}`);
    }
    if (opportunity.deadlineText) {
      lines.push(`- Deadline: ${opportunity.deadlineText}`);
    }
    if (opportunity.applicationLink) {
      lines.push(`- Apply: ${opportunity.applicationLink}`);
    }
    lines.push(`- Evidence:`);
    for (const snippet of opportunity.evidenceSnippets) {
      lines.push(`  - ${snippet}`);
    }
    if (opportunity.uncertaintyNotes.length > 0) {
      lines.push(`- Uncertainty:`);
      for (const note of opportunity.uncertaintyNotes) {
        lines.push(`  - ${note}`);
      }
    }
    lines.push(`- Score breakdown:`);
    lines.push(`  - profile_fit: ${opportunity.scoreBreakdown.profile_fit.toFixed(2)}`);
    lines.push(`  - strategic_relevance: ${opportunity.scoreBreakdown.strategic_relevance.toFixed(2)}`);
    lines.push(`  - reward_value: ${opportunity.scoreBreakdown.reward_value.toFixed(2)}`);
    lines.push(`  - deadline_urgency: ${opportunity.scoreBreakdown.deadline_urgency.toFixed(2)}`);
    lines.push(`  - application_feasibility: ${opportunity.scoreBreakdown.application_feasibility.toFixed(2)}`);
    lines.push(`  - evidence_confidence: ${opportunity.scoreBreakdown.evidence_confidence.toFixed(2)}`);
  }

  return {
    exportId: makeId("export"),
    runId: run.runId,
    format: "markdown",
    body: lines.join("\n"),
    createdAt: nowIso()
  };
}
