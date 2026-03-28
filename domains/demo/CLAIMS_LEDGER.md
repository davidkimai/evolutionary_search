# Claims Ledger

Use this ledger to keep the submission honest. If a claim is not marked as verified or live-proofed, do not say it on stage or put it in submission copy.

Interpretation rules:

- `Implemented in code` means the capability exists in the current repo state.
- `Verified` means it was executed locally in this workspace on March 28, 2026 with captured artifacts.
- `Live proof` means the pinned single-source AWS Activate product-run through Codex app-server plus TinyFish.
- `Replay flagship` means the deterministic judge-safe walkthrough.

## Implemented In Code

| Claim | Source / Evidence | Confidence | Where used |
|---|---|---:|---|
| Codex app-server is the primary control plane and real runs use `thread/start`, `turn/start`, streamed `item/*`, and `review/start` | local smoke run `run_44f694fe-c76d-49e9-a293-cd9dd31da7b8`, live run `run_2103d888-2116-46f0-ae9b-ac9d181d070b`, persisted run events, app-server client implementation | high | README, demo |
| Every surfaced recommendation includes evidence and a decomposable score breakdown | replay export, live export, API payloads, ranking pipeline, web shell | high | product, demo |
| The system surfaces uncertainty notes instead of overstating certainty | replay run export and live run export both retain explicit uncertainty notes | medium | product, demo |
| TinyFish live mode is implemented via async API plus batch polling, with CLI fallback | `src/providers/index.ts`, TinyFish async and batch docs, `/v1/providers/status` | medium | README |
| A repo-scoped `$owes-judge-demo` skill exists to standardize the visual judge demo path inside Codex, defaulting to a screenshot-backed walkthrough with headed mode as optional | `.agents/skills/owes-judge-demo/SKILL.md`, `.agents/skills/owes-judge-demo/agents/openai.yaml`, README, demo docs | high | README, demo |

## Replay-Verified Deterministic

| Claim | Source / Evidence | Confidence | Where used |
|---|---|---:|---|
| Replay mode is deterministic and demo-safe | replay fixture `fixtures/replay/demo-opportunities.json`, `npm test`, repeated `npm run test:smoke -- --json` | high | demo |
| The product can replay a live-derived proof path without hitting TinyFish again | `fixtures/replay/live-proof-aws-activate.json` | medium | docs, verification |

## Live Transport Verified

| Claim | Source / Evidence | Confidence | Where used |
|---|---|---:|---|
| TinyFish async API auth and batch completion are credential-verified in this workspace | `fixtures/live/tinyfish-api-smoke-example.json`, direct async start plus batch fetch on March 28, 2026 | medium | README, current state |

## Live End-To-End Verified

| Claim | Source / Evidence | Confidence | Where used |
|---|---|---:|---|
| One completed single-source live product-run was captured in this workspace | `fixtures/live/golden-live-aws-activate-summary.json`, `fixtures/live/golden-live-aws-activate-export.md`, live run `run_2103d888-2116-46f0-ae9b-ac9d181d070b` | high | README, demo |
| The golden live run was reviewed and exported through the CLI and API surfaces, and the web shell serving/render path was verified locally | CLI review/export on `run_2103d888-2116-46f0-ae9b-ac9d181d070b`, `fixtures/live/golden-live-aws-activate-review.md`, API fetch, export route, static shell verification against `/tmp/owes-live-proof-2` | high | demo, verification |

## Claims To Avoid In The Submission

| Claim to avoid | Why | Evidence |
|---|---|---|
| Broad multi-source live startup-program search is demo-safe | Live reliability was proven on a pinned single-source path, not on a broad live fanout | `fixtures/live/golden-live-aws-activate-summary.json`, `fixtures/live/tinyfish-live-yc-timeout-summary.json` |
| Replay is unnecessary now that live works once | Replay remains the stronger flagship demo because it is deterministic and shows a richer shortlist | `fixtures/replay/demo-opportunities.json`, `fixtures/replay/live-proof-aws-activate.json` |
| The demo skill is a headed-browser-only experience | The default judged path is the screenshot-backed walkthrough inside Codex; headed mode is optional for rehearsal or explicit operator preference | `.agents/skills/owes-judge-demo/SKILL.md` |
