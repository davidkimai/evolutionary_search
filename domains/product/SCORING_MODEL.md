# Scoring Model

## Principle

Ranking must be explicit, decomposable, and inspectable.

## Default score components

- `profile_fit`
- `strategic_relevance`
- `reward_value`
- `deadline_urgency`
- `application_feasibility`
- `evidence_confidence`

## Recommended defaults

- profile_fit: 0.30
- strategic_relevance: 0.20
- reward_value: 0.15
- deadline_urgency: 0.10
- application_feasibility: 0.10
- evidence_confidence: 0.15

## Rules

- unknown fields reduce confidence, not fabricate certainty
- evidence confidence should visibly affect rank
- keep component scores stored
- show score breakdown in UI and exports

## Future upgrade

Allow profile-specific presets for other web search spaces without changing the visible loop contract.
