# Open Web Evolutionary Search

Codex-Native Open Web Evolutionary Search turns messy public web pages into ranked, evidence-backed opportunities. This hackathon submission applies that system to one concrete wedge: startup opportunity discovery.

## Executive Summary

This repo is a serious venture-style prototype for finding startup grants, cloud credit programs, and accelerators across the open web. Codex app-server is the primary control plane, TinyFish is the live web execution layer, and the product returns a shortlist with evidence, score breakdowns, open questions, and next actions instead of a pile of tabs.

The submission is intentionally optimized for pairwise judging:

- one completed pinned single-source live proof run for credibility and magic
- one deterministic replay walkthrough for clarity and reliability
- one crisp PMF wedge: opportunity discovery for startups

## Why It Matters

Founders still discover many high-value opportunities manually across fragmented web pages, stale lists, and application portals. This product compresses that work into an inspectable shortlist that is easier to trust, easier to act on, and easier to demo.

## Why TinyFish + OpenAI Are Core

- OpenAI Codex app-server runs the search and review loop with explicit kickoff and review turns.
- TinyFish executes on the live web and returns structured extraction results from messy sources.
- Together they turn the open web into a search surface rather than a browsing chore.

## Submission Snapshot

- Wedge: startup opportunity discovery
- Control plane: Codex app-server
- Live layer: TinyFish
- Flagship demo: deterministic replay in the web UI
- Credibility artifact: one completed pinned single-source live proof run
- Output: evidence-backed ranking, open questions, review, and exportable dossier

## Verification Status

| Surface | Status | What is true |
|---|---|---|
| Replay flagship | replay-verified | Deterministic, judge-safe, and recommended for the main walkthrough |
| Live transport | live-transport-verified | TinyFish async auth and batch completion were credential-verified in this workspace |
| Live proof | live-run-verified | One pinned AWS Activate live proof run completed end to end |
| Broad live fanout | implemented in code only | Not fully live-verified end to end and not demo-safe |

## Quick Start

```bash
npm install
npm run build
npm start
```

Open [http://127.0.0.1:4317](http://127.0.0.1:4317).

## Try it with Codex

This repo includes a repo-local skill for the visual judge demo at `.agents/skills/owes-judge-demo/`. In Codex, invoke it by starting your prompt with `$owes-judge-demo`.

Use this one-line prompt:

```text
$owes-judge-demo Run the visual judge demo for this repo in the web UI: verify the app is running, do the Live TinyFish Proof first, then the Judge-Safe Replay, and narrate the ranked evidence-backed shortlist.
```

Replay-only fallback:

```text
$owes-judge-demo Run the replay-only visual judge demo for this repo in the web UI: verify the app is running, skip live proof if unavailable, do the Judge-Safe Replay, and narrate the ranked evidence-backed shortlist.
```

This skill is intended for cloned-repo users and judges/operators. It keeps the demo on the primary web UI path and avoids drifting into operator-only controls.

## Judge Demo Path

Preferred operator path:

1. Use the `$owes-judge-demo` skill so the app is verified first and the demo stays on the intended visual flow.
2. In the web UI, click `Run Live TinyFish Proof`.
3. Then click `Run Judge-Safe Replay`.
4. Show the ranked shortlist, evidence, `Review Shortlist`, and `Export Dossier`.

Manual CLI recovery surface:

```bash
npm run demo:live -- --json
npm run demo:replay -- --json
npm run export:demo -- --json
```

## What Ships

- Codex app-server client over stdio with `initialize`, `thread/start`, `turn/start`, streamed `item/*` capture, and `review/start`
- Replay, mock, and live TinyFish provider modes behind one normalized contract
- Evidence-backed normalization, dedupe, scoring, uncertainty notes, and markdown export
- Fastify API plus thin web shell for runs, score breakdowns, events, and review results
- CLI recovery surface for create, list, show, review, export, and demo flows
- Repo-local `$owes-judge-demo` skill for the visual judge path

## Artifacts

- live proof summary: `fixtures/live/golden-live-aws-activate-summary.json`
- live proof export: `fixtures/live/golden-live-aws-activate-export.md`
- live proof review: `fixtures/live/golden-live-aws-activate-review.md`
- TinyFish API smoke artifact: `fixtures/live/tinyfish-api-smoke-example.json`
- live-derived replay fixture: `fixtures/replay/live-proof-aws-activate.json`
- flagship replay fixture: `fixtures/replay/demo-opportunities.json`

## Live And Replay Reality

Live mode supports the TinyFish async API with batch polling, with local CLI fallback when API credentials are unavailable. For the submission, the live path is intentionally pinned to AWS Activate for demo stability, while the full walkthrough uses deterministic replay.

- Preferred: set `OWES_TINYFISH_API_KEY` and the app will use TinyFish async runs plus batch polling against `https://agent.tinyfish.ai`
- Fallback: if no API key is set, the live provider falls back to the local `tinyfish` CLI and checks CLI auth before running

On March 28, 2026, TinyFish async auth and batch completion were credential-verified in this workspace, and a completed pinned single-source live proof run was captured on the AWS Activate path. Replay remains the flagship demo because it is deterministic and shows a richer shortlist. The broader opportunity portfolio is shown in replay; the current live proof is intentionally pinned to one source.

## Useful Commands

```bash
npm run demo:replay -- --json
npm run demo:live -- --json
npm run export:demo -- --json
npm run test:smoke -- --json
npm exec tsx src/cli.ts run review <runId> --json
```

## Environment

See `.env.example`.

Important variables:

- `OWES_CODEX_APP_SERVER_MODE=real|mock`
- `OWES_CODEX_EXECUTABLE=codex`
- `OWES_TINYFISH_API_KEY=...`
- `TINYFISH_API_KEY=...`
- `OWES_TINYFISH_API_BASE_URL=https://agent.tinyfish.ai`
- `OWES_TINYFISH_BROWSER_PROFILE=lite|stealth`
- `OWES_TINYFISH_POLL_INTERVAL_MS=2000`
- `OWES_TINYFISH_RUN_TIMEOUT_MS=300000`
- `OWES_TINYFISH_EXECUTABLE=tinyfish`
- `OWES_HOST=127.0.0.1`
- `OWES_PORT=4317`

## HTTP Surface

- `GET /`
- `GET /health`
- `GET /ready`
- `GET /v1/providers/status`
- `GET /v1/objectives`
- `POST /v1/objectives`
- `GET /v1/runs`
- `POST /v1/runs`
- `GET /v1/runs/:runId`
- `GET /v1/runs/:runId/events`
- `GET /v1/runs/:runId/opportunities`
- `POST /v1/runs/:runId/review`
- `GET /v1/exports/:runId.md`

## Verification

Verified locally on March 28, 2026:

- `npm run typecheck`
- `npm run build`
- `npm test`
- `npm run test:smoke -- --json`
- `npm exec tsx src/cli.ts run review run_2103d888-2116-46f0-ae9b-ac9d181d070b --json`
- `OWES_DATA_DIR=/tmp/owes-live-proof-2 node dist/src/cli.js demo live --json`
- `OWES_DATA_DIR=/tmp/owes-live-proof-2 node dist/src/cli.js run review run_2103d888-2116-46f0-ae9b-ac9d181d070b --json`
- `OWES_DATA_DIR=/tmp/owes-live-proof-2 node dist/src/cli.js run export run_2103d888-2116-46f0-ae9b-ac9d181d070b --json`
- `OWES_DATA_DIR=/tmp/owes-live-proof-2 OWES_PORT=4417 node dist/src/server.js`
- `curl http://127.0.0.1:4417/health`
- `curl http://127.0.0.1:4417/ready`
- `curl http://127.0.0.1:4417/v1/providers/status`
- `curl -I http://127.0.0.1:4417/`
- `curl -I http://127.0.0.1:4417/public/app.js`

## Notes

- Run data is stored under `.owes-data/`
- Replay fixtures live under `fixtures/replay/`
- The main replay fixture is intentionally deterministic for judge-safe demos
- The live proof path is intentionally pinned to one source for reliability
