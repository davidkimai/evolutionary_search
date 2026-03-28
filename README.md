# Open Web Evolutionary Search

Open Web Evolutionary Search is a Codex-native system for long-running autonomous agents that search the live web as a candidate space, not just a set of pages to browse and summarize. Codex app-server runs the control plane, TinyFish runs the live web execution layer, and the system turns messy sources into ranked, evidence-backed shortlists through an explicit loop: objective, expand, select, review, shortlist.

This hackathon submission applies that loop to one concrete first wedge: startup program search across grants, cloud credits, and accelerators. Instead of manually hunting through fragmented websites, the agent returns a comparable shortlist with score breakdowns, uncertainty notes, review output, and next actions.

## Why This Should Exist Now

The aha is that autonomous agents are finally good enough to run long loops, but most web agents still stop at "browse page -> summarize page." That leaves a huge gap between research and decisions. Open Web Evolutionary Search closes that gap by combining:

- Codex app-server for long-running orchestration and review
- TinyFish for reliable live web execution
- an explicit loop that expands candidates, normalizes them, ranks them, reviews them, and outputs a shortlist

That is the part that should feel like "why didn’t this exist before now?" The product is not a better browser tab or a prettier research note. It is a decision loop over the open web.

## Built During The Hackathon

The hackathon deliverable is the integrated product path shown in this repo and demo:

- Codex app-server orchestration for kickoff and review turns
- TinyFish live proof integration on the pinned AWS Activate path
- deterministic replay path for the judge-safe walkthrough
- evidence-backed normalization, ranking, review, and export
- the web shell and repo-local `$owes-judge-demo` operator path

The submission is intentionally optimized for pairwise judging:

- one completed pinned single-source live proof run for credibility and magic
- one deterministic replay walkthrough for clarity and reliability
- one crisp PMF wedge: startup program search

Reusable scaffolding or harness ideas should be disclosed separately. The judged novelty here is the integrated Codex-native product loop over the open web.

## Not A Standard Research Agent

A standard deep research or web search agent usually browses, summarizes, and returns notes. Open Web Evolutionary Search is different: it treats the web as a candidate space to search, normalize, rank, review, and shortlist.

| Standard research agent | Open Web Evolutionary Search |
|---|---|
| returns notes or an answer | returns a comparable candidate shortlist |
| page-by-page browsing | candidate-space expansion across sources |
| opaque synthesis | explicit score breakdown plus uncertainty |
| one-shot response | loop: objective -> expand -> select -> review -> shortlist |

## Why It Matters

Teams still solve messy, high-value search problems manually across fragmented web pages, stale lists, and application portals. This product compresses that work into an inspectable shortlist that is easier to trust, easier to act on, and easier to generalize across domains. The hackathon demo uses startup programs because the wedge is legible, urgent, and venture-relevant.

## Why TinyFish + OpenAI Are Core

- OpenAI Codex app-server runs the search and review loop with explicit kickoff and review turns.
- TinyFish executes on the live web and returns structured extraction results from messy sources.
- Together they turn the open web into an evolutionary search surface rather than a browsing chore.

## Submission Snapshot

- First wedge: startup program search
- Control plane: Codex app-server
- Live layer: TinyFish
- Flagship demo: deterministic replay in the web UI
- Credibility artifact: one completed pinned single-source live proof run
- Output: evidence-backed ranking, open questions, review, and a consultant-style dossier

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

For the live TinyFish proof, start the app with `OWES_TINYFISH_API_KEY=...` and confirm `GET /v1/providers/status` reports `"tinyfishApiConfigured": true` before the demo.

## Try it with Codex

This repo includes a repo-local skill for the visual judge demo at `.agents/skills/owes-judge-demo/`. In Codex, invoke it by starting your prompt with `$owes-judge-demo`. Inside the Codex macOS app, the preferred path is a screenshot-backed walkthrough from the same web UI so the judge stays in one surface and the demo leaves persistent visual artifacts. Headed local browser mode is optional for rehearsal or explicit operator preference.

Use this one-line prompt:

```text
$owes-judge-demo Run the visual judge demo for this repo in the Codex macOS app as a screenshot-backed walkthrough from the web UI: verify the app is running, preflight TinyFish status, do the Live TinyFish Proof first, then the Judge-Safe Replay, capture step-by-step visuals, and narrate the ranked evidence-backed shortlist.
```

Replay-only fallback:

```text
$owes-judge-demo Run the replay-only visual judge demo for this repo in the Codex macOS app as a screenshot-backed walkthrough from the web UI: verify the app is running, skip live proof if unavailable, do the Judge-Safe Replay, capture step-by-step visuals, and narrate the ranked evidence-backed shortlist.
```

This skill is intended for cloned-repo users and judges/operators. It keeps the demo on the primary web UI path, avoids drifting into operator-only controls, and reduces operator risk by defaulting to one judged surface.

## Judge Demo Path

Preferred operator path:

1. Use the `$owes-judge-demo` skill inside Codex so the app is verified first and the demo stays on the intended visual flow.
2. Keep the walkthrough inside the Codex macOS app with step-by-step screenshots from the same web UI.
3. Preflight `GET /v1/providers/status` if you intend to show the live proof.
4. In the web UI, click `Run Live TinyFish Proof`.
5. Then click `Run Judge-Safe Replay`.
6. Show the ranked shortlist, evidence, `Review Shortlist`, and `Export Dossier`.

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
