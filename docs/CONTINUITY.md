# CONTINUITY

Update this after each major phase.

## Current phase
- Phase 10 submission-surface and demo-operability hardening complete

## What changed
- Added a repo-scoped `$owes-judge-demo` skill under `.agents/skills/owes-judge-demo/` with explicit-invocation metadata and a visual web UI workflow
- Documented one pasteable Codex prompt for cloned-repo users, judges, and operators
- Rewrote `README.md` into a stronger submission document with clearer verification boundaries and better scanability
- Aligned the demo script, judges mapping, and claims ledger around the skill-driven judge path
- Clarified that the demo skill standardizes the operator flow but does not claim full browser automation
- Added explicit `sourceIds` selection so the live path can pin a single stable source instead of widening across the full portfolio
- Corrected the runtime TinyFish default timeout to `300000` to match docs and the intended five-minute live budget
- Hardened TinyFish API result parsing with recursive unwrapping, fenced-JSON handling, alternate key coercion, and better parse-error excerpts
- Changed the live demo preset to a pinned AWS Activate proof path and added a matching one-click live proof button in the web shell
- Made the shell more judge-facing with a visible loop strip, a clearer live-versus-replay hero note, and a top-opportunity spotlight card
- Captured one completed single-source TinyFish live product-run proof at `fixtures/live/golden-live-aws-activate-summary.json`
- Added a live-derived replay fixture at `fixtures/replay/live-proof-aws-activate.json`
- Added a live export artifact at `fixtures/live/golden-live-aws-activate-export.md`
- Verified the golden live run across CLI review, CLI export, API fetch, export route, and static web shell endpoints
- Tightened the judge-facing shell so the visible story is live TinyFish proof first, replay second, with custom controls de-emphasized
- Rewrote the demo script into one pairwise-optimized 4-minute path with short objection handling
- Reframed the judges mapping around the official judging criteria: Technical Implementation & Complexity, Innovation, Functionality & Reliability, Design & UX, Presentation, and Impact & Relevance
- Hardened claim language so single-source live proof cannot be confused with broad live reliability

## Open risks
- The live proof is intentionally narrow and should be framed as the magical live moment, not as a broad live crawl benchmark
- Replay is still the better flagship demo because it shows a richer shortlist and is deterministic
- The custom search surface still exists for operator use; presenters should stay on the primary buttons during judging
- The repo-local demo skill reduces operator error, but the presenters still need rehearsal so the flow feels effortless

## Next packet
- No new product work
- Rehearse the `$owes-judge-demo` visual flow until it feels inevitable
- Keep the story fixed: Codex-Native Open Web Evolutionary Search, opportunity discovery wedge, live proof for magic, replay for clarity
