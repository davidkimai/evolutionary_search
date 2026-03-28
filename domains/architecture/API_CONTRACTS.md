# API Contracts

## Suggested routes

- `POST /v1/objectives`
- `POST /v1/runs`
- `GET /v1/runs/{run_id}`
- `GET /v1/runs/{run_id}/events`
- `GET /v1/runs/{run_id}/opportunities`
- `GET /v1/opportunities/{opportunity_id}`
- `GET /v1/exports/{run_id}.md`
- `GET /health`
- `GET /ready`

## Optional routes
- `POST /v1/runs/{run_id}/replay`
- `POST /v1/runs/{run_id}/cancel`
- `GET /v1/providers/status`

## Response rules
- typed JSON only
- explicit error envelope
- timestamps everywhere relevant
- mode (`live`, `replay`, `mock`) visible in run metadata

## Events
Event stream should expose:
- run_created
- provider_started
- provider_progress
- raw_result_received
- normalization_complete
- dedupe_complete
- scoring_complete
- export_ready
- run_failed
- run_completed
