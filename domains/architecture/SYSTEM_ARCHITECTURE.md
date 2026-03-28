# System Architecture

## Primary shape

```text
Judge / User
  ├─ Thin Web UI (demo shell)
  ├─ CLI (local recovery / CI / scripting)
  └─ Codex-native app shell
         ├─ Codex app-server client
         │    ├─ thread/start, thread/resume, thread/fork
         │    ├─ turn/start, turn/steer, turn/completed
         │    ├─ item/* streamed events
         │    ├─ review/start
         │    └─ approvals / filesystem / command surfaces
         ├─ Evolutionary Search Orchestrator
         │    ├─ search portfolio expansion
         │    ├─ selection / ranking
         │    ├─ evidence verification
         │    └─ refinement / iteration
         ├─ Opportunity Wedge Service
         │    ├─ grants
         │    ├─ accelerators
         │    └─ tenders / RFPs
         ├─ TinyFish Provider Layer
         │    ├─ TinyFishLiveClient
         │    ├─ ReplayOpportunityClient
         │    └─ MockOpportunityClient
         ├─ Normalization + Evidence extraction
         ├─ Deduplication + clustering
         ├─ Scoring / ranking
         ├─ Export service
         └─ Persistence
```

## Strategic rationale

The phrase **Open Web Evolutionary Search** is better than **Opportunity Engine** for hackathon framing because it more accurately names the technical primitive and creates a stronger “aha” around search, selection, and refinement over a messy web corpus.

However, **startup program search** remains the best first wedge because it scores better on PMF, presentation clarity, and impact.

So the project should be presented as:

> A codex-native evolutionary search system over the open web, with startup program search as the first high-value wedge.

## Why codex native first

Make Codex app-server the primary runtime because:
- it gives the project a direct OpenAI/Codex-native surface
- it aligns with the event’s Codex collaboration context
- it provides strong streamed interaction primitives and approvals
- it gives us thread-level persistence and compaction for iterative search
- it is a better story for judges than “we wrapped a backend around prompts”

## Modes

### LIVE_MODE
- Codex app-server drives the search session / interaction
- TinyFish executes live web tasks
- store raw events and normalized results

### REPLAY_MODE
- Codex app-server still drives the session UX
- provider returns deterministic replay fixtures
- demo-safe

### MOCK_MODE
- local deterministic fallback
- app-server shell still works
- no credentials required

## Non-negotiable claim

The system’s core claim is not “we can browse.”
It is:

> “We can run codex-native evolutionary search over the open web and turn messy sites into ranked, evidence-backed decisions.”
