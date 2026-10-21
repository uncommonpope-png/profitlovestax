---
tags: [decision, codex, workflow, automation]
date: 2026-06-27
session: 13
status: active
---

# Decision - Codex as Primary Builder

## Decision

Use Codex CLI as primary code builder for the GSK Containment Observatory.

## Rationale

Codex can:
- Read/write files
- Run shell commands
- Spawn subagents
- Do code review
- Generate images
- Search web

All from terminal.

## Config

```toml
provider = openai
model = gpt-5.5
sandbox = danger-full-access
auth = ChatGPT OAuth
```

## Workflow

**Profit** → Guides direction
**Codex** → Builds
**Craig** → Reviews

## Limitations

- Project-scoped API keys lack `api.responses.write` scope
- Must use **ChatGPT OAuth**, not API key
