# Architecture Summary

## Primary architecture

**Codex app-server native runtime**
→ explicit backend services
→ TinyFish provider layer
→ replay/mock/live parity
→ thin web demo shell

## Why this is the right move

Codex app-server gives us:
- threads, turns, and items as a native interaction model
- streamed agent events
- approvals and review flows
- persisted conversation state and compaction
- the same style of runtime surface used by Codex-rich clients

TinyFish gives us:
- live web execution
- SSE streaming
- async / batch runs
- stealth browser modes
- extraction from dynamic sites

Together, they create a hackathon-native stack:
Codex for orchestration and interaction, TinyFish for real-world web work.
