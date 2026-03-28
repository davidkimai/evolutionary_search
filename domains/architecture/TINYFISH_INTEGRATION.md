# TinyFish Integration

## Why TinyFish belongs in the stack

TinyFish is directly aligned with the hackathon brief: autonomous agents that browse, search, and extract real-time data from the open web. The docs and skill guide emphasize:
- natural language task goals
- JSON-structured extraction
- SSE streaming
- async and concurrent requests
- browser profiles (`lite`, `stealth`)
- proxy support
- anti-detection support
- real websites as programmable surfaces. fileciteturn5file0 fileciteturn6file0 citeturn905586view0turn239728view1turn239728view2turn239728view3

## Integration guidance

### 1. Keep TinyFish behind an adapter
Create:
- `TinyFishClient`
- `ReplayOpportunityClient`
- `MockOpportunityClient`

### 2. Use one task per source / search slice
The TinyFish skill guide is explicit that parallel independent extractions should be separate calls, not one giant combined goal. fileciteturn6file0

### 3. Force structured output
Every TinyFish goal should request exact JSON structure.

### 4. Preserve raw evidence
Store:
- source URL
- goal
- raw final JSON
- relevant snippets
- timestamps
- profile / objective params

### 5. Use replay fixtures aggressively
Every successful live run that is demo-worthy should be capturable for replay.

## Suggested source portfolio

Start with:
- official grant pages
- official accelerator pages
- public tender / procurement portals
- trusted aggregators only when clearly labeled

## Suggested goal template

"Extract current opportunities matching this profile. Return strict JSON array with fields:
[{title, issuer, source_url, application_url, reward_value_text, deadline_text, geography, eligibility_bullets, summary, evidence_snippets}]"

## CLI / SDK note

The attached TinyFish skill guide is CLI-oriented and is ideal for coding-agent usage and fallback validation. The live product can still wrap SDK or HTTP usage, but the command semantics are a useful design anchor. fileciteturn6file0
