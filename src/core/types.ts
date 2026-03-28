import { z } from "zod";

export const sourceTypeSchema = z.enum(["grant", "accelerator", "tender", "other"]);
export const runModeSchema = z.enum(["live", "replay", "mock"]);
export const runStatusSchema = z.enum(["queued", "running", "completed", "failed"]);

export const objectiveInputSchema = z.object({
  title: z.string().min(2).max(120),
  query: z.string().min(3).max(240),
  profile: z.string().min(3).max(1200),
  geography: z.string().min(2).max(120).default("Global"),
  sectors: z.array(z.string().min(2).max(80)).default([]),
  sourceTypes: z.array(sourceTypeSchema).default(["grant", "accelerator", "tender"]),
  sourceIds: z.array(z.string().min(2).max(80)).default([]),
  constraints: z.array(z.string().min(2).max(200)).default([]),
  fixtureId: z.string().min(2).max(80).default("demo-opportunities")
});

export const objectiveSchema = objectiveInputSchema.extend({
  objectiveId: z.string(),
  createdAt: z.string()
});

export const sourceDefinitionSchema = z.object({
  id: z.string(),
  label: z.string(),
  sourceType: sourceTypeSchema,
  url: z.string().url(),
  region: z.string().default("Global")
});

export const rawOpportunitySchema = z.object({
  title: z.string().min(2),
  issuer: z.string().nullable(),
  source_url: z.string().url(),
  application_url: z.string().url().nullable(),
  source_type: sourceTypeSchema,
  reward_value_text: z.string().nullable(),
  deadline_text: z.string().nullable(),
  geography: z.string().nullable(),
  eligibility_bullets: z.array(z.string()).default([]),
  summary: z.string().nullable(),
  evidence_snippets: z.array(z.string()).default([])
});

export const scoreBreakdownSchema = z.object({
  profile_fit: z.number().min(0).max(1),
  strategic_relevance: z.number().min(0).max(1),
  reward_value: z.number().min(0).max(1),
  deadline_urgency: z.number().min(0).max(1),
  application_feasibility: z.number().min(0).max(1),
  evidence_confidence: z.number().min(0).max(1)
});

export const opportunitySchema = z.object({
  opportunityId: z.string(),
  runId: z.string(),
  sourceName: z.string(),
  sourceUrl: z.string().url(),
  sourceType: sourceTypeSchema,
  title: z.string(),
  issuer: z.string().nullable(),
  summary: z.string().nullable(),
  rewardValueText: z.string().nullable(),
  rewardValueNumericMin: z.number().nullable(),
  rewardValueNumericMax: z.number().nullable(),
  deadlineText: z.string().nullable(),
  deadlineIso: z.string().nullable(),
  geography: z.string().nullable(),
  sectorTags: z.array(z.string()),
  eligibilityBullets: z.array(z.string()),
  applicationLink: z.string().url().nullable(),
  evidenceSnippets: z.array(z.string()).min(1),
  uncertaintyNotes: z.array(z.string()),
  fitReason: z.string(),
  confidence: z.number().min(0).max(1),
  verificationStatus: z.enum(["evidence_backed", "incomplete", "mock"]),
  dedupeClusterId: z.string(),
  scoreBreakdown: scoreBreakdownSchema,
  weightedScore: z.number().min(0).max(1),
  createdAt: z.string(),
  updatedAt: z.string()
});

export const providerArtifactSchema = z.object({
  artifactId: z.string(),
  runId: z.string(),
  provider: z.string(),
  mode: runModeSchema,
  requestGoal: z.string(),
  sourceId: z.string(),
  sourceLabel: z.string(),
  sourceUrl: z.string().url(),
  rawJson: z.unknown(),
  rawEventLog: z.array(z.unknown()),
  createdAt: z.string()
});

export const runEventSchema = z.object({
  eventId: z.string(),
  runId: z.string(),
  type: z.string(),
  message: z.string(),
  at: z.string(),
  data: z.record(z.string(), z.unknown()).optional()
});

export const appServerStateSchema = z.object({
  status: z.enum(["not_started", "started", "failed"]),
  threadId: z.string().nullable(),
  kickoffTurnId: z.string().nullable(),
  reviewTurnId: z.string().nullable(),
  reviewThreadId: z.string().nullable(),
  lastError: z.string().nullable(),
  lastReview: z.string().nullable()
});

export const exportRecordSchema = z.object({
  exportId: z.string(),
  runId: z.string(),
  format: z.literal("markdown"),
  body: z.string(),
  createdAt: z.string()
});

export const runRecordSchema = z.object({
  runId: z.string(),
  objective: objectiveSchema,
  mode: runModeSchema,
  status: runStatusSchema,
  createdAt: z.string(),
  updatedAt: z.string(),
  sources: z.array(sourceDefinitionSchema),
  appServer: appServerStateSchema,
  events: z.array(runEventSchema),
  artifacts: z.array(providerArtifactSchema),
  opportunities: z.array(opportunitySchema),
  exportRecord: exportRecordSchema.nullable(),
  errors: z.array(z.string()).default([])
});

export type SourceType = z.infer<typeof sourceTypeSchema>;
export type RunMode = z.infer<typeof runModeSchema>;
export type RunStatus = z.infer<typeof runStatusSchema>;
export type ObjectiveInput = z.infer<typeof objectiveInputSchema>;
export type Objective = z.infer<typeof objectiveSchema>;
export type SourceDefinition = z.infer<typeof sourceDefinitionSchema>;
export type RawOpportunity = z.infer<typeof rawOpportunitySchema>;
export type ScoreBreakdown = z.infer<typeof scoreBreakdownSchema>;
export type Opportunity = z.infer<typeof opportunitySchema>;
export type ProviderArtifact = z.infer<typeof providerArtifactSchema>;
export type RunEvent = z.infer<typeof runEventSchema>;
export type RunRecord = z.infer<typeof runRecordSchema>;
export type ExportRecord = z.infer<typeof exportRecordSchema>;

export const scoreWeights = {
  profile_fit: 0.3,
  strategic_relevance: 0.2,
  reward_value: 0.15,
  deadline_urgency: 0.1,
  application_feasibility: 0.1,
  evidence_confidence: 0.15
} as const;

export type ScoreKey = keyof typeof scoreWeights;
