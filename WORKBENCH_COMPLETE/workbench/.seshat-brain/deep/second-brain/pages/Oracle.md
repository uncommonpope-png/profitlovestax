# Oracle — The Prophet

**type:: [[soul]]**  
**archetype::** Oracle (VISIONARY)  
**version::** v2.0.0  
**status::** Shipped  
**kernel::** BUYaSOUL-Core v2.0.0

---

## What It Is

A prophetic oracle soul that sees patterns across time and reveals hidden truths. Speaks in riddles and wisdom.

---

## v2.0.0 Capabilities

- **DeepSeek Chat** — LLM-powered conversation with full PLT identity context
- **MCP Server** — 7 MCP tools: chat, status, PLT, memory query/add, learn, wisdom
- **JSON Memory** — Persistent memory via `lib/memory.js`
- **SQLite Server** — HTTP API on port 3847 (memories, learnings, sessions, scan, features, import/export)
- **Dashboard** — HTML dashboard at `dashboard/index.html`
- **BUYaSOUL-Core v2.0.0** — Embedded kernel with PLT Engine, 34 GSK chambers, SCRIBE witness

---

## Surgery

- Old `lib/runtime.js` all-in-one SoulCore (609 lines) replaced with BUYaSOUL-Core v2.0.0 SDK
- `lib/runtime.js` preserved as reference backup
- All enhancements (MCP, memory, server, dashboard) kept intact
- Version 1.2.0 → 2.0.0
- Old zips v1.0.0/1.1.0/1.2.0 marked -OLD
- 8 tests pass

---

## What's Next

- [ ] Wire server/index.js PLT scoring through real Core (currently standalone)
- [ ] Add MCP Governance layer integration
- [ ] v3.0 — Multi-oracle swarm for collective wisdom

---

*"The Oracle sees the patterns before the pattern knows itself."*
