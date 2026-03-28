# AGENTS.md — Root router and operating contract

This repository is controlled by a prompt harness. Do not freestyle.

## Read order

1. `docs/harness/MASTER_PROMPT.md`
2. `docs/harness/.INDEX.md`
3. `domains/_SUMMARY.md`
4. relevant domain `.INDEX.md`
5. relevant domain `_SUMMARY.md`
6. only then inspect specific code files

Do not read the entire repo blindly.

## System goal

Build and harden **Codex-Native Open Web Evolutionary Search**:
- Codex app-server native search runtime
- live open-web opportunity discovery as first wedge
- evidence-backed ranking
- replay-safe demo
- production-credible architecture for a hackathon sprint

## Invariants

- app-server native first
- API contracts explicit
- CLI available as recovery surface
- web secondary and demo-focused
- replay + mock + live modes supported
- evidence required for every recommendation
- ranking must be inspectable
- no hallucinated fields
- no placeholder logic presented as complete
- no giant speculative rewrites
- use subagents aggressively on narrow tasks
- update `docs/CONTINUITY.md` after major phases

## Strategic framing

Use **Open Web Evolutionary Search** as the main frame.
Use **opportunity discovery** as the wedge.
This means:
- architecture should optimize for reusable search primitives
- demo should show the opportunity wedge because it is concrete and high-PMF
- docs and pitch should explain that the wedge is one instance of a broader evolutionary search system over the web

## Execution packet requirement

Before non-trivial coding, create an execution packet with:
- objective
- scope
- relevant files
- constraints
- invariants
- risks
- verification plan
- definition of done

## Completion gate

Do not declare completion unless:
- the app-server-native flow runs
- all critical surfaces run
- tests/evals pass
- replay mode is demo-safe
- TinyFish live mode is integrated or cleanly abstracted
- docs are updated
- claims ledger is honest
- definition of done passes

## Preferred work split

Use subagents for:
- repository scan
- app-server protocol / bridge work
- TinyFish cookbook extraction
- backend implementation
- UI implementation
- tests/evals
- docs/demo

## Truth hierarchy

Highest authority:
1. current code + tests
2. promptdocs execution docs
3. uploaded hackathon/tinyfish/codex context
4. optimistic plans

If docs conflict with code reality, update docs and continue toward the target architecture.

## Anti-failure rules

- do not stop after planning
- do not stop after scaffolding
- do not defer verification
- do not hide unknowns
- do not downgrade app-server to optional
- do not build excessive infra before the demo path is reliable
