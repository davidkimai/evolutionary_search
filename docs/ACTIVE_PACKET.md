# ACTIVE_PACKET

## Objective
Maximize hackathon win probability from the current MVP by making the demo safer to operate live, the submission surface more professional, and the judge path easier to reproduce through one explicit repo-scoped demo skill.

## Scope
- Add a repo-scoped judge-demo skill for the visual web UI path
- Rewrite README into a stronger submission document
- Align demo script, judges mapping, and claims ledger around the skill-driven judge flow
- Make only small trust-surface improvements that help cloned-repo users and judges/operators

## Relevant files
- Skill: `.agents/skills/owes-judge-demo/SKILL.md`, `.agents/skills/owes-judge-demo/agents/openai.yaml`
- Demo and claims: `README.md`, `domains/demo/CLAIMS_LEDGER.md`, `domains/demo/DEMO_SCRIPT.md`, `domains/demo/JUDGES_MAPPING.md`
- State docs: `docs/00CURRENT_STATE.md`, `docs/CONTINUITY.md`
- Shell references only: `public/index.html`, `public/app.js`, `public/styles.css`
- Artifacts and fixtures: `fixtures/live/*`, `fixtures/replay/*`

## Constraints
- Codex app-server remains mandatory and primary.
- TinyFish remains the live web execution layer.
- Replay remains the judge-safe fallback and primary demo path.
- No broadening to more verticals or abstract platform work.
- No runtime rewrites or new infrastructure.
- Claims must distinguish implemented, replay-verified, live-transport-verified, and live-run-verified behavior.

## Invariants
- Opportunity discovery stays the wedge.
- The product frame remains Codex-Native Open Web Evolutionary Search.
- Every surfaced recommendation needs evidence.
- Ranking remains explicit and inspectable.
- Unknowns stay explicit; no hallucinated completeness.
- The preferred operator path is the visual web UI, not CLI improvisation.
- Update `docs/CONTINUITY.md` after each major phase.

## Risks
- The demo skill could accidentally imply fully autonomous browser operation if documented sloppily.
- README and judge docs can still drift if they do not use the same invocation and same live-versus-replay story.
- Operators can still wander into custom controls if the preferred path is not explicit enough.

## Phases

### Phase A — Demo Skill
- Create one repo-scoped skill for the judge-safe visual demo path.
- Keep it explicit-invocation only.
- Make it prefer the web UI, verify the app, and keep the operator on the primary buttons.

### Phase B — Submission Surface
- Rewrite README for stronger executive readability and clearer verification boundaries.
- Add a pasteable Codex prompt for cloned-repo users and judges/operators.

### Phase C — Judge Docs Alignment
- Update demo script, judges mapping, and claims ledger around the skill-driven path.
- Explain why the skill reduces operator error without overstating automation.

## Verification
- verify `.agents/skills/owes-judge-demo/` exists and contains `SKILL.md` plus `agents/openai.yaml`
- verify the exact `$owes-judge-demo` invocation is documented in README and demo docs
- run the minimum bounded repo check needed after documentation changes

## Definition of done
- A repo-scoped judge-demo skill exists and is explicitly documented.
- README reads like a professional submission surface instead of an internal note.
- Demo script, judges mapping, and claims ledger all use the same invocation and same live-versus-replay story.
- No product scope is broadened.
