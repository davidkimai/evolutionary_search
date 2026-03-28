# Ranking Prompt

Given:
- a user profile
- a set of normalized opportunities

Score each opportunity on:
- profile_fit
- strategic_relevance
- reward_value
- deadline_urgency
- application_feasibility
- evidence_confidence

Return JSON with component scores, fit_reason, and total weighted score.
Do not hide reasoning inside prose only.
