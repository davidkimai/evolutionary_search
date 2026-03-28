# App-Server Bridge Spec

## Goal

Implement a bridge layer that maps app-server conversations onto the project’s evolutionary search state machine.

## Mapping

- `thread` → search session
- `turn` → search iteration / refinement step
- `item` → observable work unit or result artifact

## Core bridge services

### AppServerClient
- process spawn / connection
- initialize handshake
- request / response helpers
- notification subscription

### SearchThreadService
- startSearchThread
- resumeSearchThread
- forkSearchThread
- compactSearchThread
- setThreadName

### SearchTurnService
- startTurn
- steerTurn
- interruptTurn
- attachOutputSchema when useful
- request review

### EventProjector
- convert app-server events into internal event rows
- project event stream into UI-friendly status
- persist deltas and final items

## Hard requirement

The web UI and API must be able to read search status from the projected event store without scraping stdout directly.
