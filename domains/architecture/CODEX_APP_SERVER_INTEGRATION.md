# Codex App-Server Integration

## Position

Codex app-server is a **hard dependency** and the primary interaction bus.

Use it as the native control plane for:
- conversation state
- streamed progress
- search-session lifecycle
- review and approvals
- local tool / shell / file surfaces

## Default transport

Use `stdio` transport by default.
Do not default to websocket. Websocket is acceptable only for local experiments or when its ergonomics clearly improve the demo.

## Required primitives

### Connection bootstrap
- spawn `codex app-server`
- send `initialize`
- send `initialized`
- set stable `clientInfo`

### Thread lifecycle
- `thread/start` for a new search session
- `thread/resume` to continue a prior session
- `thread/fork` to branch alternative searches or review paths
- `thread/compact/start` when context needs to be compressed

### Turn lifecycle
- `turn/start` to launch search instructions or refinement steps
- `turn/steer` to add user guidance mid-flight
- stream and persist `item/*` events

### Review
- use `review/start` to run automated review for architecture, demo code, or judge-facing polish before claiming completion

## Native interaction model

Treat the app-server thread as the **search session object**.
Treat turns as **evolutionary search steps**.
Treat items as the **observable evidence trail** for what the system did.

This mapping should be explicit in code and docs.

## Required implementation pieces

- typed app-server client wrapper
- connection manager
- thread service
- turn service
- event normalizer
- app-server event persistence
- review runner
- approval handler abstraction

## Event handling

Persist and normalize at least:
- `turn/started`
- `turn/completed`
- `item/started`
- `item/completed`
- `item/agentMessage/delta`
- command/file change items if used
- review mode items if used

## Schema strategy

Generate app-server TypeScript or JSON schema from the installed Codex version when helpful so the integration matches the local Codex build.

## Guardrails

- app-server should not be bypassed in the primary UX
- if app-server is unavailable locally, fail clearly
- replay mode should still use the same thread/turn mental model
