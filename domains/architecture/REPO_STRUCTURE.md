# Repo Structure

```text
.
├── README.md
├── docs/
│   ├── harness/
│   │   ├── AGENTS.md
│   │   ├── .INDEX.md
│   │   └── MASTER_PROMPT.md
├── docs/
│   ├── 00CURRENT_STATE.md
│   ├── CONTINUITY.md
│   ├── JUDGES.md
│   ├── DEMO_SCRIPT.md
│   └── CLAIMS_LEDGER.md
├── apps/
│   ├── api/
│   ├── cli/
│   ├── web/
│   └── appserver-shell/
├── packages/
│   ├── core/
│   ├── tinyfish-provider/
│   ├── appserver-client/
│   ├── schemas/
│   └── prompt-assets/
├── data/
│   ├── replay/
│   └── seeds/
├── tests/
└── promptdocs/
```

## Important addition

The repo now needs an **appserver-shell** or equivalent package because the project is codex native.
That package owns:
- app-server process management
- event subscription
- search session lifecycle
- protocol adapters
