# Judges Mapping

This is an internal translation from the official judging criteria to one concrete visible proof per category. Keep the mapping simple and repeatable under pairwise judging pressure.

## Preferred Operator Path

Use the repo-local demo skill during judging:

```text
$owes-judge-demo Run the visual judge demo for this repo in the web UI: verify the app is running, do the Live TinyFish Proof first, then the Judge-Safe Replay, and narrate the ranked evidence-backed shortlist.
```

Why this matters:

- it standardizes the exact web UI path
- it reduces operator error
- it keeps the demo on the primary buttons instead of operator-only controls
- it makes the judged experience more comparable across runs

## 1. Technical Implementation & Complexity

Visible proof:
- one completed live product-run at `fixtures/live/golden-live-aws-activate-summary.json`
- Codex app-server kickoff plus review on the same run
- explicit normalization, score breakdown, export, and evidence trail in the shell

Line to use:
"A live TinyFish run feeds a Codex app-server session that normalizes evidence, scores fit, and produces a reviewable shortlist."

## 2. Innovation

Visible proof:
- the hero strip and loop
- live proof first, replay second
- shortlist instead of raw pages

Line to use:
"We are not retrieving one answer from one page; we are searching the web as a ranked space of candidates."

## 3. Functionality & Reliability

Visible proof:
- `Run Live TinyFish Proof`
- `Run Judge-Safe Replay`
- repo-local `$owes-judge-demo` operator path
- replay fixture plus pinned live proof artifacts

Line to use:
"The live proof is intentionally narrow, and the replay path is deterministic. That is why the demo is reliable under judge pressure."

## 4. Design & UX

Visible proof:
- hero strip and primary actions
- spotlight card, ranked shortlist, and evidence snippets
- clear review and export actions in the same flow

Line to use:
"The interface is designed to make the search loop legible quickly: live proof, replay, evidence, review, and export."

## 5. Presentation

Visible proof:
- repo-local `$owes-judge-demo` operator path
- 4-minute flow: hook -> live proof -> replay -> review -> export
- spotlight card
- concise close on wedge plus platform frame

Line to use:
"Show, don’t tell: one live proof point, then one deterministic shortlist walkthrough."

## 6. Impact & Relevance

Visible proof:
- startup opportunity discovery wedge
- explicit apply link
- evidence-backed shortlist
- exportable dossier

Line to use:
"Founders already waste time hunting fragmented opportunities manually. We compress that into a ranked shortlist with evidence and next actions."

## Prize Mapping

### Deep Sea Architect

Proof to emphasize:
- solves a positive, high-leverage problem: better access to startup support and infrastructure
- feels magical because one messy live web source becomes an evidence-backed recommendation inside the app

### Most Likely to Be the Next Unicorn

Proof to emphasize:
- clear PMF wedge: startup opportunity discovery
- immediate venture story: founders, startup programs, investors, incubators, grant operators

### Overall Top 3

Proof to emphasize:
- strong technical integration
- memorable live moment
- deterministic demo safety
- crisp product wedge

## Likely Judge Q&A

- `Why is replay primary if live works?`
  - "Because pairwise judging rewards clarity. Live proves the magic is real; replay is the safer, richer flagship walkthrough."
- `Why is the live path intentionally narrow?`
  - "Because the goal is one reliable magical moment, not a risky broad live benchmark."
- `Why add a demo skill instead of just clicking around manually?`
  - "Because it reduces operator error. It verifies the app, keeps the demo on the intended visual path, and preserves the same story under judge pressure."
- `Where do TinyFish and OpenAI each matter here?`
  - "TinyFish executes on the live web; Codex app-server owns orchestration and the review loop."
- `What was actually built during the hackathon?`
  - "The judged scope is the integrated product path shown in the demo: Codex app-server control plane, TinyFish live proof, replay demo, ranking, review, export, and judge-facing shell."
- `How do you handle pre-existing work disclosure?`
  - "Any reusable harness or scaffolding should be disclosed separately. We do not present that as the hackathon novelty."
- `Why is this venture-scale?`
  - "The wedge is concrete, urgent, and repeatable. The broader frame is open-web ranking for messy, high-value selection problems."
