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
  const topOpportunity = run.opportunities[0] ?? null;
  const scopeNote = buildScopeNote(run);
  const sourceLabels = uniqueStrings(run.artifacts.map((artifact) => artifact.sourceLabel));
  const lines = [
    `# ${run.objective.title}`,
    "",
    `Prepared by: Open Web Evolutionary Search`,
    `Prepared on: ${formatReportTimestamp(run.updatedAt)}`,
    `Run ID: ${run.runId}`,
    "",
    "## Executive Summary",
    topOpportunity
      ? `The strongest current candidate for this search is **${topOpportunity.title}** from **${topOpportunity.sourceName}**. It ranked first because ${topOpportunity.fitReason}.`
      : "No ranked candidates were produced for this run.",
    "The product is the evolutionary search loop itself: objective in, web candidates expanded and scored, review applied, shortlist out.",
    `This run demonstrates the first wedge, startup opportunity search, against a broader open-web evolutionary search architecture.`,
    topOpportunity?.applicationLink
      ? `Recommended next step: review **${topOpportunity.title}** and follow the application path at ${topOpportunity.applicationLink}.`
      : "Recommended next step: inspect the shortlist and confirm the next candidate action manually.",
    scopeNote,
    "",
    "## Search Brief",
    `- Objective: ${run.objective.query}`,
    `- Profile: ${run.objective.profile}`,
    `- Geography: ${run.objective.geography}`,
    `- Mode: ${run.mode}`,
    `- Status: ${run.status}`,
    `- Source set: ${sourceLabels.length > 0 ? sourceLabels.join(", ") : "No sources recorded"}`,
    `- Candidate count: ${run.opportunities.length}`,
    "",
    "## Ranked Shortlist",
    "",
    "| Rank | Candidate | Source | Score | Confidence | Value | Next action |",
    "| --- | --- | --- | --- | --- | --- | --- |"
  ];

  for (const [index, opportunity] of run.opportunities.entries()) {
    lines.push(`| ${index + 1} | ${escapeMarkdownCell(opportunity.title)} | ${escapeMarkdownCell(opportunity.sourceName)} | ${opportunity.weightedScore.toFixed(3)} | ${opportunity.confidence.toFixed(2)} | ${escapeMarkdownCell(opportunity.rewardValueText ?? "Not stated")} | ${escapeMarkdownCell(opportunity.applicationLink ?? "Inspect source")} |`);
  }

  for (const [index, opportunity] of run.opportunities.entries()) {
    lines.push("");
    lines.push(`## ${index + 1}. ${opportunity.title}`);
    lines.push(`- Source: ${opportunity.sourceName}`);
    lines.push(`- URL: ${opportunity.sourceUrl}`);
    lines.push(`- Fit summary: ${opportunity.fitReason}`);
    lines.push(`- Score: ${opportunity.weightedScore.toFixed(3)}`);
    lines.push(`- Confidence: ${opportunity.confidence.toFixed(2)}`);
    if (opportunity.rewardValueText) {
      lines.push(`- Value signal: ${opportunity.rewardValueText}`);
    }
    if (opportunity.deadlineText) {
      lines.push(`- Timing signal: ${opportunity.deadlineText}`);
    }
    if (opportunity.applicationLink) {
      lines.push(`- Next action: ${opportunity.applicationLink}`);
    }
    lines.push("- Evidence");
    for (const snippet of opportunity.evidenceSnippets) {
      lines.push(`  - ${snippet}`);
    }
    if (opportunity.uncertaintyNotes.length > 0) {
      lines.push("- Open Questions");
      for (const note of opportunity.uncertaintyNotes) {
        lines.push(`  - ${note}`);
      }
    }
    lines.push("- Why It Ranked Here");
    lines.push(`  - Profile Fit: ${opportunity.scoreBreakdown.profile_fit.toFixed(2)}`);
    lines.push(`  - Strategic Relevance: ${opportunity.scoreBreakdown.strategic_relevance.toFixed(2)}`);
    lines.push(`  - Reward Value: ${opportunity.scoreBreakdown.reward_value.toFixed(2)}`);
    lines.push(`  - Deadline Urgency: ${opportunity.scoreBreakdown.deadline_urgency.toFixed(2)}`);
    lines.push(`  - Application Feasibility: ${opportunity.scoreBreakdown.application_feasibility.toFixed(2)}`);
    lines.push(`  - Evidence Confidence: ${opportunity.scoreBreakdown.evidence_confidence.toFixed(2)}`);
  }

  if (run.appServer.lastReview) {
    lines.push("");
    lines.push("## Codex Review");
    lines.push(run.appServer.lastReview);
  }

  lines.push("");
  lines.push("## Method");
  lines.push("- The system runs an open-web evolutionary search loop: objective, expand, select, review, shortlist.");
  lines.push("- TinyFish performs live extraction on the source pages; Codex app-server owns orchestration and review.");
  lines.push("- Only evidence-backed candidates are surfaced; unknowns remain explicit.");
  lines.push("- Ranking is decomposable across profile fit, strategic relevance, reward value, deadline urgency, application feasibility, and evidence confidence.");

  lines.push("");
  lines.push("## Appendix: Recent Event Trail");
  for (const event of run.events.slice(-10)) {
    lines.push(`- ${formatReportTimestamp(event.at)} · ${event.type} · ${event.message}`);
  }

  return {
    exportId: makeId("export"),
    runId: run.runId,
    format: "markdown",
    body: lines.join("\n"),
    createdAt: nowIso()
  };
}

export function buildHtmlExportReport(run: RunRecord): string {
  const topOpportunity = run.opportunities[0] ?? null;
  const sourceLabels = uniqueStrings(run.artifacts.map((artifact) => artifact.sourceLabel));
  const scopeNote = buildScopeNote(run);
  const rawMarkdownHref = `/v1/exports/${run.runId}.md`;

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(run.objective.title)} Report</title>
    <style>
      :root {
        --bg: #f4f1ea;
        --panel: #ffffff;
        --ink: #162025;
        --muted: #5c6870;
        --line: rgba(22, 32, 37, 0.14);
        --accent: #0d5c63;
        --accent-soft: #e7f1f2;
        --shadow: 0 24px 48px rgba(22, 32, 37, 0.08);
      }
      * { box-sizing: border-box; }
      body {
        margin: 0;
        background: linear-gradient(180deg, #faf8f3 0%, var(--bg) 100%);
        color: var(--ink);
        font-family: "Inter", "Segoe UI", system-ui, sans-serif;
      }
      .report-shell {
        width: min(1100px, calc(100vw - 32px));
        margin: 0 auto;
        padding: 28px 0 64px;
      }
      .topbar,
      .section,
      .opportunity-card {
        background: var(--panel);
        border: 1px solid var(--line);
        border-radius: 24px;
        box-shadow: var(--shadow);
      }
      .topbar {
        padding: 28px 32px;
        margin-bottom: 18px;
      }
      .eyebrow {
        margin: 0 0 10px;
        color: var(--accent);
        font-size: 12px;
        text-transform: uppercase;
        letter-spacing: 0.14em;
      }
      h1, h2, h3 {
        font-family: "Iowan Old Style", "Palatino Linotype", Georgia, serif;
        margin: 0;
      }
      h1 {
        font-size: clamp(32px, 5vw, 54px);
        line-height: 0.96;
        max-width: 12ch;
      }
      .lede {
        max-width: 72ch;
        color: var(--muted);
        font-size: 17px;
        line-height: 1.6;
      }
      .meta-grid,
      .summary-grid,
      .opportunity-grid {
        display: grid;
        gap: 14px;
      }
      .meta-grid,
      .summary-grid {
        grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
        margin-top: 18px;
      }
      .metric,
      .summary-card {
        padding: 16px 18px;
        border-radius: 18px;
        background: #fbfaf6;
        border: 1px solid var(--line);
      }
      .metric strong,
      .summary-card strong {
        display: block;
        margin-bottom: 8px;
        font-size: 12px;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        color: var(--muted);
      }
      .metric span {
        font-size: 18px;
        font-weight: 600;
      }
      .section {
        padding: 24px 28px;
        margin-top: 18px;
      }
      .section h2 {
        margin-bottom: 16px;
        font-size: 28px;
      }
      .note {
        margin-top: 14px;
        padding: 14px 16px;
        border-left: 4px solid var(--accent);
        background: var(--accent-soft);
        border-radius: 14px;
      }
      table {
        width: 100%;
        border-collapse: collapse;
      }
      th, td {
        padding: 12px 10px;
        border-bottom: 1px solid var(--line);
        text-align: left;
        vertical-align: top;
      }
      th {
        font-size: 12px;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        color: var(--muted);
      }
      .opportunity-grid {
        grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
      }
      .opportunity-card {
        padding: 22px;
      }
      .opportunity-card h3 {
        margin-bottom: 8px;
        font-size: 24px;
      }
      .muted {
        color: var(--muted);
      }
      ul {
        margin: 10px 0 0;
        padding-left: 20px;
      }
      .score-grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 10px;
        margin-top: 14px;
      }
      .score-chip {
        padding: 12px 14px;
        border-radius: 16px;
        background: #f5f7f8;
        border: 1px solid var(--line);
      }
      .score-chip strong {
        display: block;
        margin-bottom: 6px;
        font-size: 12px;
        text-transform: uppercase;
        letter-spacing: 0.07em;
        color: var(--muted);
      }
      .report-actions {
        display: flex;
        gap: 10px;
        flex-wrap: wrap;
        margin-top: 16px;
      }
      .report-actions a {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        padding: 12px 16px;
        border-radius: 999px;
        text-decoration: none;
        color: white;
        background: var(--accent);
      }
      .report-actions a.secondary {
        color: var(--ink);
        background: rgba(22, 32, 37, 0.08);
      }
      @media print {
        body { background: white; }
        .report-shell { width: 100%; padding: 0; }
        .report-actions { display: none; }
        .topbar, .section, .opportunity-card { box-shadow: none; }
      }
    </style>
  </head>
  <body>
    <main class="report-shell">
      <section class="topbar">
        <p class="eyebrow">Open Web Evolutionary Search Report</p>
        <h1>${escapeHtml(run.objective.title)}</h1>
        <p class="lede">${escapeHtml(topOpportunity
          ? `Recommendation memo for the current search. The strongest candidate is ${topOpportunity.title}, and the broader product remains the evolutionary search loop over messy web sources.`
          : "Recommendation memo for the current search. No ranked candidates were produced in this run.")}</p>
        <div class="report-actions">
          <a href="${rawMarkdownHref}">Download Raw Markdown</a>
          <a class="secondary" href="/">Back to App</a>
        </div>
        <div class="meta-grid">
          <div class="metric"><strong>Prepared On</strong><span>${escapeHtml(formatReportTimestamp(run.updatedAt))}</span></div>
          <div class="metric"><strong>Mode</strong><span>${escapeHtml(run.mode)}</span></div>
          <div class="metric"><strong>Candidate Count</strong><span>${run.opportunities.length}</span></div>
          <div class="metric"><strong>Source Set</strong><span>${escapeHtml(sourceLabels.length > 0 ? sourceLabels.join(", ") : "No sources recorded")}</span></div>
        </div>
      </section>

      <section class="section">
        <h2>Executive Summary</h2>
        <div class="summary-grid">
          <div class="summary-card">
            <strong>Search Objective</strong>
            <div>${escapeHtml(run.objective.query)}</div>
          </div>
          <div class="summary-card">
            <strong>Current Wedge</strong>
            <div>Startup opportunity search on top of a generalized open-web evolutionary search loop.</div>
          </div>
          <div class="summary-card">
            <strong>Lead Recommendation</strong>
            <div>${escapeHtml(topOpportunity ? topOpportunity.title : "No recommendation available")}</div>
          </div>
        </div>
        <p class="note">${escapeHtml(scopeNote)}</p>
      </section>

      <section class="section">
        <h2>Search Brief</h2>
        <table>
          <tbody>
            <tr><th>Profile</th><td>${escapeHtml(run.objective.profile)}</td></tr>
            <tr><th>Geography</th><td>${escapeHtml(run.objective.geography)}</td></tr>
            <tr><th>Mode</th><td>${escapeHtml(run.mode)}</td></tr>
            <tr><th>Status</th><td>${escapeHtml(run.status)}</td></tr>
            <tr><th>Search Loop</th><td>Objective -> Expand -> Select -> Review -> Shortlist</td></tr>
          </tbody>
        </table>
      </section>

      <section class="section">
        <h2>Ranked Shortlist</h2>
        <table>
          <thead>
            <tr>
              <th>Rank</th>
              <th>Candidate</th>
              <th>Source</th>
              <th>Score</th>
              <th>Confidence</th>
              <th>Value</th>
              <th>Next Action</th>
            </tr>
          </thead>
          <tbody>
            ${run.opportunities.map((opportunity, index) => `
              <tr>
                <td>${index + 1}</td>
                <td>${escapeHtml(opportunity.title)}</td>
                <td>${escapeHtml(opportunity.sourceName)}</td>
                <td>${opportunity.weightedScore.toFixed(3)}</td>
                <td>${opportunity.confidence.toFixed(2)}</td>
                <td>${escapeHtml(opportunity.rewardValueText ?? "Not stated")}</td>
                <td>${opportunity.applicationLink ? `<a href="${escapeHtml(opportunity.applicationLink)}" target="_blank" rel="noreferrer">Open application</a>` : "Inspect source"}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </section>

      <section class="section">
        <h2>Recommendation Detail</h2>
        <div class="opportunity-grid">
          ${run.opportunities.map((opportunity, index) => `
            <article class="opportunity-card">
              <p class="eyebrow">Recommendation ${index + 1}</p>
              <h3>${escapeHtml(opportunity.title)}</h3>
              <p class="muted">${escapeHtml(opportunity.sourceName)} · score ${opportunity.weightedScore.toFixed(3)} · confidence ${opportunity.confidence.toFixed(2)}</p>
              <p>${escapeHtml(opportunity.fitReason)}</p>
              ${opportunity.applicationLink ? `<p><strong>Next action:</strong> <a href="${escapeHtml(opportunity.applicationLink)}" target="_blank" rel="noreferrer">Open application</a></p>` : ""}
              <strong>Evidence</strong>
              <ul>${opportunity.evidenceSnippets.map((snippet) => `<li>${escapeHtml(snippet)}</li>`).join("")}</ul>
              ${opportunity.uncertaintyNotes.length > 0 ? `<strong>Open Questions</strong><ul>${opportunity.uncertaintyNotes.map((note) => `<li>${escapeHtml(note)}</li>`).join("")}</ul>` : ""}
              <div class="score-grid">
                ${renderHtmlScoreChip("Profile Fit", opportunity.scoreBreakdown.profile_fit)}
                ${renderHtmlScoreChip("Strategic Relevance", opportunity.scoreBreakdown.strategic_relevance)}
                ${renderHtmlScoreChip("Reward Value", opportunity.scoreBreakdown.reward_value)}
                ${renderHtmlScoreChip("Deadline Urgency", opportunity.scoreBreakdown.deadline_urgency)}
                ${renderHtmlScoreChip("Application Feasibility", opportunity.scoreBreakdown.application_feasibility)}
                ${renderHtmlScoreChip("Evidence Confidence", opportunity.scoreBreakdown.evidence_confidence)}
              </div>
            </article>
          `).join("")}
        </div>
      </section>

      ${run.appServer.lastReview ? `
        <section class="section">
          <h2>Codex Review</h2>
          <p class="lede">${escapeHtml(run.appServer.lastReview)}</p>
        </section>
      ` : ""}

      <section class="section">
        <h2>Method</h2>
        <ul>
          <li>TinyFish extracts from live web sources inside the current wedge.</li>
          <li>Codex app-server owns orchestration, review, and loop discipline.</li>
          <li>Only evidence-backed candidates are surfaced; missing facts remain explicit.</li>
          <li>Ranking remains inspectable across profile fit, strategic relevance, reward value, timing, feasibility, and evidence confidence.</li>
        </ul>
      </section>
    </main>
  </body>
</html>`;
}

function buildScopeNote(run: RunRecord): string {
  if (run.mode === "live") {
    return run.opportunities.length <= 2
      ? "This live proof is intentionally narrow. It proves the live web path end to end; broader comparison is shown in replay."
      : "This live proof is intentionally narrower than the replay flow. It proves the live web path while keeping the judge moment reliable.";
  }
  return "This replay run is the flagship demo path because it is deterministic, comparable, and safe to walk through under judge pressure.";
}

function formatReportTimestamp(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(date);
}

function escapeMarkdownCell(value: string): string {
  return value.replaceAll("|", "\\|").replaceAll("\n", " ");
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function renderHtmlScoreChip(label: string, value: number): string {
  return `<div class="score-chip"><strong>${escapeHtml(label)}</strong><span>${value.toFixed(2)}</span></div>`;
}
