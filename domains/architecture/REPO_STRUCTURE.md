# Repo Structure

```text
.
├── .agents/
│   └── skills/
│       └── owes-judge-demo/
├── README.md
├── domains/
│   ├── architecture/
│   ├── demo/
│   └── product/
├── fixtures/
│   ├── live/
│   └── replay/
├── prompt-assets/
├── public/
├── src/
└── package.json
```

## Shipped surfaces

- `.agents/skills/owes-judge-demo/` contains the self-contained judge-demo skill.
- `domains/demo/` contains the public demo and judging docs.
- `domains/product/` contains the product and wedge framing docs.
- `prompt-assets/`, `public/`, and `src/` contain the runtime prompt, shell, and server implementation.

## Archived separately

Internal build, planning, harness, continuity, and execution-state docs are archived outside the repo before finalization so the shipped repository stays product-facing.
