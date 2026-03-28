# 00CURRENT_STATE

## Goal
Ship a runnable Codex-native Open Web Evolutionary Search MVP with opportunity discovery as the wedge, Codex app-server as the control plane, TinyFish as the live web execution layer, and replay as the judge-safe demo path.

## Repo reality
What is real and working now:

- Single-package TypeScript app with explicit schemas, persistence, API, CLI, web shell, replay fixtures, and tests
- Codex app-server client using stdio with `initialize`, `thread/start`, `turn/start`, streamed `item/*`, and `review/start`
- Replay, mock, and live provider abstraction with a shared normalized opportunity contract
- Evidence-backed ranking with decomposable score breakdowns, uncertainty notes, and markdown export
- Fastify server plus a judge-facing shell with one-click replay demo and one-click live proof
- Repo-scoped `$owes-judge-demo` skill for starting the visual judge path consistently in Codex
- One completed single-source live product-run on March 28, 2026 using a pinned AWS Activate source, captured in `fixtures/live/golden-live-aws-activate-summary.json`
- A live-derived replay fixture at `fixtures/replay/live-proof-aws-activate.json`

What is intentionally constrained:

- The live proof path is intentionally narrow and pinned to one source for reliability
- Replay remains the primary demo path because it is deterministic and shows a richer shortlist
- The successful live proof is one source and one ranked opportunity, not a broad multi-source live crawl

## Current phase
Phase 10: submission-surface and demo-operability hardening complete.

## Highest-leverage next actions
1. Rehearse the same skill-driven visual demo path until it is muscle memory.
2. Keep replay as the flagship demo and position the live proof as credibility plus magic.
3. Avoid expanding scope unless it directly improves the submission surface.

## Known risks
- TinyFish live behavior is now verified end to end on the pinned AWS path, but broader live fanout is still queue-latency sensitive and should not be the main demo.
- The live proof is narrower than the replay showcase, so the pitch has to explain why that tradeoff is intentional.
- Ranking remains heuristic and inspectable, not learned.

## Verification completed
- `npm run typecheck`
- `npm test`
- `npm run build`
- `npm run test:smoke -- --json`
- `OWES_DATA_DIR=/tmp/owes-live-proof-2 node dist/src/cli.js demo live --json`
- `OWES_DATA_DIR=/tmp/owes-live-proof-2 node dist/src/cli.js run review run_2103d888-2116-46f0-ae9b-ac9d181d070b --json`
- `OWES_DATA_DIR=/tmp/owes-live-proof-2 node dist/src/cli.js run export run_2103d888-2116-46f0-ae9b-ac9d181d070b --json`
- `OWES_DATA_DIR=/tmp/owes-live-proof-2 OWES_PORT=4417 node dist/src/server.js`
- local HTTP verification of `/`, `/health`, `/ready`, `/v1/providers/status`, `/v1/runs`, `/v1/runs/:runId`, `/v1/exports/:runId.md`, and `/public/app.js`
