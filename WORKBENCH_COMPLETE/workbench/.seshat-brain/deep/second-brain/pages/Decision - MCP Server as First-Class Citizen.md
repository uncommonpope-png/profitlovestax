# Decision: MCP Server as First-Class Citizen

**type:: [[decision]]**  
**status::** [[status/accepted]]  
**date::** May 26, 2026  
**extracted-from::** [[2026_05_26]]

---

## Context

Every power in Soul Commander was internal-only. Only the CLI could invoke them. Claude Code, Cursor, and other agents had no access.

## Decision

**Every power must be exposed as an MCP tool.**  
62 tools over stdio JSON-RPC 2.0. Zero config. `claude mcp add soul-commander`.

## Rationale

- Claude Code is the primary target user
- MCP is Claude Code's plugin architecture
- If powers aren't MCP tools, Claude can't use them
- Dynamic tool updates (`listChanged`) mean new powers auto-appear

## Consequences

- Each power must have a JSON Schema input/output
- Need `mcp-server.cjs` with full JSON-RPC pipeline
- `_meta["anthropic/maxResultSizeChars"]: 50000` for large outputs
- But: Claude Code agents can now say "WTF I have 62 tools"

---

*"If Claude can't touch it, it doesn't exist."*
