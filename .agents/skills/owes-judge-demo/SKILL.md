---
name: owes-judge-demo
description: Use this skill only when the operator explicitly invokes $owes-judge-demo to run the visual judge demo for Open Web Evolutionary Search. Prefer the local web UI, verify or start the app server if needed, direct the operator to the local URL, run Live TinyFish Proof first, then Judge-Safe Replay, and keep the demo on the primary buttons without wandering into custom controls.
---

# OWES Judge Demo

This skill is for the hackathon judge demo only. It is not a general operations skill.

## Goal

Run the safest high-impact visual demo path for this repo:

1. verify the app is reachable locally
2. open or direct the operator to the local web UI
3. do `Run Live TinyFish Proof` first
4. do `Run Judge-Safe Replay` second
5. show ranking, evidence, review, and export

## Default workflow

1. Work from the repo root.
2. Check whether `http://127.0.0.1:4317/health` and `http://127.0.0.1:4317/ready` respond.
3. If the app is not running:
   - run `npm install` only if dependencies are missing
   - run `npm run build` if the repo has not been built yet or the operator wants a clean verification step
   - start the app with `npm start`
   - wait until the app responds at `http://127.0.0.1:4317`
4. Direct the operator to `http://127.0.0.1:4317`.
5. Keep the demo on the visible primary path:
   - `Run Live TinyFish Proof`
   - `Run Judge-Safe Replay`
   - `Review Shortlist`
   - `Export Dossier`
6. Narrate the result as:
   - messy web in
   - evidence-backed shortlist out
   - opportunity discovery as the wedge
   - Codex app-server as control plane
   - TinyFish as live web execution

## Guardrails

- Prefer the web UI over CLI output.
- Do not open the custom search controls during judging unless the operator explicitly asks.
- Do not broaden the live proof beyond the pinned single-source path.
- Do not describe replay as a fallback apology. Replay is the flagship judge path.
- Do not overclaim broad live reliability.
- Review only the shortlist shown in the UI; do not drift into repo inspection or code review during the demo.
- Do not spend demo time on config, environment variables, or backend internals unless asked.

## If live proof is unavailable

If live proof is blocked by credentials, network, or queue latency:

1. say that clearly and briefly
2. continue with the judge-safe replay in the same web UI
3. keep the story fixed: live proof is credibility, replay is the main walkthrough
4. use the smallest possible recovery step, then return to the web UI immediately

## Exact invocation

Use the skill explicitly by starting the prompt with:

`$owes-judge-demo`

Preferred prompt:

`$owes-judge-demo Run the visual judge demo for this repo in the web UI: verify the app is running, do the Live TinyFish Proof first, then the Judge-Safe Replay, and narrate the ranked evidence-backed shortlist.`

Replay-only prompt:

`$owes-judge-demo Run the replay-only visual judge demo for this repo in the web UI: verify the app is running, skip live proof if unavailable, do the Judge-Safe Replay, and narrate the ranked evidence-backed shortlist.`

## Read only if needed

For exact narration or claim boundaries, read:

- `README.md`
- `domains/demo/DEMO_SCRIPT.md`
- `domains/demo/JUDGES_MAPPING.md`
- `domains/demo/CLAIMS_LEDGER.md`
