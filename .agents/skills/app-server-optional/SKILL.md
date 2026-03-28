# Skill: codex-native-first

Codex app-server is not optional in this project.

Use this skill whenever you are making architecture, routing, UI, or event-stream decisions.

## Rules
- prefer app-server thread/turn/item semantics
- prefer stdio transport
- persist and project app-server events
- keep CLI as recovery surface only
- do not bypass app-server in the primary UX
