# Data Models

## Run
- run_id
- objective
- profile
- mode
- status
- created_at
- updated_at

## Opportunity
- opportunity_id
- run_id
- source_name
- source_url
- source_type
- title
- issuer
- summary
- reward_value_text
- reward_value_numeric_min
- reward_value_numeric_max
- deadline_text
- deadline_iso
- geography
- sector_tags
- eligibility_bullets
- application_link
- evidence_snippets
- fit_reason
- confidence
- verification_status
- dedupe_cluster_id
- score_breakdown
- weighted_score
- created_at
- updated_at

## Raw provider artifact
- artifact_id
- run_id
- provider
- mode
- request_goal
- source_url
- raw_json
- raw_event_log
- created_at

## Export
- export_id
- run_id
- format
- body
- created_at
