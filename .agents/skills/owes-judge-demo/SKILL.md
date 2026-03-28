---
name: owes-judge-demo
description: Use this skill only when the operator explicitly invokes $owes-judge-demo to run the visual judge demo for Open Web Evolutionary Search. Default to a screenshot-backed walkthrough inside the Codex macOS app, verify or start the app server if needed, run Live TinyFish Proof first, then Judge-Safe Replay, and keep the demo on the primary buttons without wandering into custom controls. Use headed local browser mode only when explicitly requested or when rehearsing locally.
---

# OWES Judge Demo

This skill is for the hackathon judge demo only. It is not a general operations skill.

This skill is self-contained and should work in a fresh session without prior repo context.
It assumes the skill is being invoked inside Codex with the `agent-browser` tool available. The default attractor inside the Codex macOS app is a screenshot-backed walkthrough from the same web UI because it keeps the judge in one surface, leaves persistent visual artifacts behind, and avoids headed-browser daemon risk. Use headed local-browser control only when the operator explicitly asks for it or when rehearsing locally.

## Repo context you should assume

- Product frame: **Open Web Evolutionary Search**
- Product definition: the loop itself, not the wedge
- Loop: objective -> expand -> select -> review -> shortlist
- First wedge for the demo: **startup program search**
- Control plane: Codex app-server
- Live web execution layer: TinyFish
- Demo hierarchy: live proof for credibility, replay for the flagship walkthrough
- Local app URL: `http://127.0.0.1:4317`

## Goal

Run the safest high-impact visual demo path for this repo:

1. verify the app is reachable locally
2. open the local web UI in `agent-browser` and capture step-by-step visuals inside Codex
3. do `Run Live TinyFish Proof` first
4. do `Run Judge-Safe Replay` second
5. show ranking, evidence, review, and export
6. verify completion with backend and UI checks before declaring success

## Default workflow

1. Work from the repo root.
2. Check whether `http://127.0.0.1:4317/health` and `http://127.0.0.1:4317/ready` respond.
3. Check `http://127.0.0.1:4317/v1/providers/status` before the demo starts.
   - If `tinyfishApiConfigured` is `true`, the live TinyFish proof is eligible to run.
   - If `tinyfishApiConfigured` is `false` and the operator has already supplied `OWES_TINYFISH_API_KEY` for this session, restart the local app with that environment variable applied before retrying the live proof.
   - If `tinyfishApiConfigured` is `false` and no credential is available, keep the story fixed, note the live blocker briefly, and continue with replay.
4. If the app is not running:
   - run `npm install` only if dependencies are missing
   - run `npm run build` if the repo has not been built yet or the operator wants a clean verification step
   - start the app with `npm start`
   - wait until the app responds at `http://127.0.0.1:4317`
   - do not block on missing live credentials; if TinyFish credentials are unavailable, say so briefly and continue with replay
5. When running inside Codex with `agent-browser` available, default to `agent-browser open http://127.0.0.1:4317`.
   - capture screenshots into a stable local folder such as `/tmp/owes-judge-demo/`
   - keep the walkthrough inside the Codex app by showing the screenshots and narrating the result there
   - only switch to `agent-browser open http://127.0.0.1:4317 --headed` if the operator explicitly asks for a live local window or is rehearsing outside the main judged path
6. After the page loads, use `agent-browser snapshot -i` and keep the demo on the visible primary path:
   - `Run Live TinyFish Proof`
   - `Run Judge-Safe Replay`
   - `Review Shortlist`
   - `Export Dossier`
7. After each major step, confirm the result both visually and through the app surface:
   - capture a screenshot and keep the latest image available in the Codex thread
   - live proof: a new `live` run appears and completes
   - replay: a new `replay` run appears and completes with the ranked shortlist
   - review: `lastReview` is populated for the selected replay run
   - export: the dossier link resolves to `/v1/exports/<runId>.md`
   - when multiple runs exist, explicitly select the newest relevant run card before review or export
8. Narrate the result as:
   - messy web in
   - evidence-backed shortlist out
   - startup program search as the first wedge
   - the evolutionary search loop as the actual product
   - Codex app-server as control plane
   - TinyFish as live web execution

## Default operating mode

- Prefer a screenshot-backed walkthrough inside the Codex macOS app because it minimizes context switching during pairwise judging.
- Re-snapshot after every major interaction because the selected run and visible controls can change.
- Capture the key beats:
  - hero and primary buttons
  - live proof running
  - live proof completed or blocked
  - replay completed
  - review visible
  - export report open
- Use `agent-browser screenshot` or `agent-browser screenshot --full` for proof and for the judge-facing walkthrough.
- Use `agent-browser record start <file>` and `agent-browser record stop` only when you want a rehearsal artifact. The recording is secondary to the screenshot sequence.
- In the Codex app, keep the story in one surface by showing the screenshots as local images instead of forcing judges to track a separate window.

## Headed optional mode

- Use `agent-browser open http://127.0.0.1:4317 --headed` only when the operator explicitly asks for a live local browser window or when rehearsing locally.
- Re-snapshot after every major interaction because the selected run and visible controls can change.
- If `agent-browser` fails before launch because its daemon socket is stuck, restart the browser tooling once before downgrading the flow:
  - close the browser if possible
  - kill stale `agent-browser`, `playwright-mcp`, or related daemon processes
  - remove stale socket files under `~/.agent-browser/`
  - retry the headed launch once, then return to the default screenshot-backed path

## Guardrails

- Prefer the web UI over CLI output.
- Prefer one judged surface over multiple windows. In Codex macOS app, that means the default path is the screenshot-backed walkthrough.
- Do not open the custom search controls during judging unless the operator explicitly asks.
- Do not broaden the live proof beyond the pinned single-source path.
- Do not describe replay as a fallback apology. Replay is the flagship judge path.
- Do not overclaim broad live reliability.
- Review only the shortlist shown in the UI; do not drift into repo inspection or code review during the demo.
- Do not spend demo time on config, environment variables, or backend internals unless asked.
- If the UI appears unchanged after a click, do not assume failure immediately. Check whether the run started via `/v1/runs`, wait for the refresh cycle, then continue.

## Screenshot-backed walkthrough

This is the default, not a fallback.

1. stay on the same web UI at `http://127.0.0.1:4317`
2. capture screenshots after each major state change
3. narrate the flow exactly as if the judge were watching it live:
   - live TinyFish proof first
   - judge-safe replay second
   - ranked evidence-backed shortlist
   - review and export
4. treat the screenshot sequence as the main visual artifact inside Codex
5. do not switch the story to backend mechanics just because the browser is headless

## Full completion checks

Do not stop after a click. The skill is complete only when all of these are true:

1. the local app is healthy and ready
2. the visual surface is open on `http://127.0.0.1:4317` in either default screenshot-backed mode or optional headed mode
3. the live proof created a new `live` run and it reached `completed` or a documented external blocker
4. the replay created a new `replay` run and it reached `completed`
5. the replay shortlist is visible with ranked evidence-backed opportunities
6. the replay review completed and returned real review text
7. the export link opens the correct markdown dossier for the replay run

## Red-team loop

After the first successful pass, test for operator-risk:

1. note any point where the UI gives weak immediate feedback
2. verify whether that is only latency/refresh behavior or a real failure
3. document the smallest safe operator habit or product patch needed
4. rerun the flow if a patch changes the judge path

## If live proof is unavailable

If live proof is blocked by credentials, network, queue latency, or browser-tool availability:

1. say that clearly and briefly
2. continue with the judge-safe replay in the same web UI
3. keep the story fixed: live proof is credibility, replay is the main walkthrough
4. use the smallest possible recovery step, then return to the web UI immediately

## Exact invocation

Use the skill explicitly by starting the prompt with:

`$owes-judge-demo`

Preferred prompt:

`$owes-judge-demo Run the visual judge demo for this repo in the Codex macOS app as a screenshot-backed walkthrough from the web UI. Verify the app is running, preflight TinyFish status, do the Live TinyFish Proof first, then the Judge-Safe Replay, capture step-by-step visuals, verify review and export, and narrate the ranked evidence-backed shortlist. Use headed browser mode only if explicitly requested.`

Replay-only prompt:

`$owes-judge-demo Run the replay-only visual judge demo for this repo in the Codex macOS app as a screenshot-backed walkthrough from the web UI. Verify the app is running, skip live proof if unavailable, do the Judge-Safe Replay, capture step-by-step visuals, verify review and export, and narrate the ranked evidence-backed shortlist. Use headed browser mode only if explicitly requested.`

## Optional supporting docs

Do not depend on other docs to run the flow. Read these only if you need exact narration or claim boundaries:

- `README.md`
- `domains/demo/DEMO_SCRIPT.md`
- `domains/demo/JUDGES_MAPPING.md`
- `domains/demo/CLAIMS_LEDGER.md`
