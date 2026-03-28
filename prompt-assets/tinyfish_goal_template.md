# TinyFish Goal Template

Use strict JSON output.

Template:

You are extracting current opportunities from the given website.
Return strict JSON only.
Schema:
[
  {
    "title": "string",
    "issuer": "string | null",
    "source_url": "string",
    "application_url": "string | null",
    "source_type": "grant | accelerator | tender | other",
    "reward_value_text": "string | null",
    "deadline_text": "string | null",
    "geography": "string | null",
    "eligibility_bullets": ["string"],
    "summary": "string | null",
    "evidence_snippets": ["string"]
  }
]

Rules:
- if unknown, use null
- do not fabricate amounts or deadlines
- keep evidence snippets short and literal
