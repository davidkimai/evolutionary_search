# Demo Script

## Pairwise Principle

In pairwise judging, immediate clarity beats breadth. The demo should feel like one clean story:

1. one real live TinyFish proof for credibility and magic
2. one deterministic replay walkthrough for clarity and comparison
3. one crisp PMF wedge: startup opportunity discovery

## Preferred Operator Path

Use the repo-local demo skill so the operator path stays standardized:

```text
$owes-judge-demo Run the visual judge demo for this repo in the web UI: verify the app is running, do the Live TinyFish Proof first, then the Judge-Safe Replay, and narrate the ranked evidence-backed shortlist.
```

Replay-only fallback:

```text
$owes-judge-demo Run the replay-only visual judge demo for this repo in the web UI: verify the app is running, skip live proof if unavailable, do the Judge-Safe Replay, and narrate the ranked evidence-backed shortlist.
```

Why use the skill:

- it verifies or starts the local app before the demo
- it directs the operator to `http://127.0.0.1:4317`
- it keeps the visual flow on the two primary buttons
- it reduces operator error under judge pressure

## 4-Minute Table Demo

### 0:00-0:20 — Hook

Show only the hero strip and primary buttons.

Say:
"The best startup opportunities live on messy websites, not in a clean database. We built Codex-Native Open Web Evolutionary Search to turn the open web into a ranked, evidence-backed shortlist."

### 0:20-0:40 — Two-Move Setup

Point to the two primary buttons.

Say:
"This demo has two proof points. First, one real live TinyFish proof. Second, a deterministic replay that shows the full shortlist safely."

### 0:40-1:25 — Live TinyFish Proof

Click `Run Live TinyFish Proof`.

Say:
"Codex app-server owns the control plane. TinyFish does the live web extraction. We pin this proof to AWS Activate so the live moment is real and narrow enough to demo safely."

Show only:
- the `Best Match for This Profile` spotlight
- the apply link
- the evidence snippets
- the open question note

### 1:25-1:50 — Why This Is Decision-Ready

Say:
"This is not raw page capture. The system normalizes the opportunity, binds literal evidence to the claim, gives the next action, and keeps uncertainty explicit."

Briefly point to:
- evidence snippets
- score/confidence
- open questions

### 1:50-2:05 — Switch To Flagship Replay

Click `Run Judge-Safe Replay`.

Say:
"Now I switch to the flagship judge path. Same product, same contract, but deterministic so the full walkthrough is safe and comparable."

### 2:05-2:50 — Ranked Shortlist

Show the replay shortlist first, not the runtime section.

Say:
"Here the system expands across multiple opportunity sources, normalizes messy evidence, and returns a ranked shortlist instead of a pile of tabs."

Point to:
- ranked shortlist
- spotlight card
- score chips

### 2:50-3:20 — Review

Click `Review Shortlist`.

Say:
"Because this is Codex-native, review is part of the loop. Codex evaluates evidence quality, ranking coherence, and uncertainty before the shortlist is acted on."

### 3:20-3:40 — Export

Click `Export Dossier`.

Say:
"The output is decision-ready: evidence, score breakdown, open questions, and next action in one exportable dossier."

### 3:40-4:00 — Close

Say:
"The wedge is startup opportunity discovery. The broader frame is Open Web Evolutionary Search: messy web in, evidence-backed shortlist out."

## 60-Second Compression

1. Hook on the hero and say the problem.
2. Run the live TinyFish proof and show one evidence-backed result.
3. Run the judge-safe replay and show the ranked shortlist.
4. Click review or export once.
5. Close on wedge plus platform frame.

## Likely Judge Q&A

- `Why is replay the main demo if live works?`
  - "Live proves the magic is real. Replay is the flagship demo because pairwise judging rewards clarity and replay is deterministic."
- `Why is the live path intentionally narrow?`
  - "Because reliability matters more than breadth in a live table demo. We verified one real product-run path end to end and keep broader live fanout out of the main pitch."
- `What was built during the hackathon?`
  - "The judged scope is the integrated product path shown here: Codex app-server control plane, TinyFish live proof, deterministic replay demo, evidence-backed ranking, review, export, and the judge-facing shell."
- `How do you handle pre-existing work disclosure?`
  - "Any reusable harness or scaffolding should be disclosed separately. We keep the judged novelty focused on the integrated product flow shown in the demo."
- `Why is this venture-scale and not just a cool demo?`
  - "Teams already waste time hunting fragmented opportunities manually. This product compresses that into a ranked shortlist with evidence and next actions."

## Presenter Notes

- The preferred operator path is the `$owes-judge-demo` skill, not manual improvisation.
- Do not start in the custom form.
- Do not explain config, CLI, or environment variables unless asked.
- Do not broaden to procurement or other verticals in the main pitch.
- Treat replay as the flagship demo, not as an apology.
