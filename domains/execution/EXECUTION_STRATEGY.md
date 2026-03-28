# Execution Strategy

## Overall approach

Use the repo and harness as a directed search system over implementation space.

### Human side already set:
- objective
- evaluation criteria
- constraints
- ROI target

### Model side responsibilities:
- expand implementation options
- select the best low-risk path
- implement in phases
- verify each phase
- compress state into continuity docs

## High-level order

### Phase 0
Ground context and repo reality.

### Phase 1
Establish contracts and provider abstraction.

### Phase 2
Build deterministic replay path and CLI.

### Phase 3
Implement live TinyFish path.

### Phase 4
Normalization, evidence, ranking, dedupe.

### Phase 5
Thin web demo + exports.

### Phase 6
Tests, demo script, docs, polish.

### Phase 7
Optional app-server bridge scaffold.

## Core philosophy

A stable replayable demo that clearly shows decision quality beats a brittle live-only system with more ambition.

## Mandatory verification cadence

After every major phase:
- run tests
- update current state
- update continuity
- update claims ledger if product claims changed
