# SCRIBE Dashboards

SCRIBE ships with **2 premium dashboards**. Open `dashboards/index.html` to choose.

---

## Architecture

```
User → Dashboard → SCRIBE Server → DeepSeek → SCRIBE Server → Dashboard → User
```

The user never touches DeepSeek. SCRIBE is the only interface. DeepSeek is SCRIBE's hidden brain.

---

## 1. SCRIBE Soul Dashboard
**File:** `dashboards/gsk-soul/index.html`  
**Style:** Cyberpunk, Orbitron font, neon gradients, animated grid  
**Best for:** Power users, PLT enthusiasts, deep control

**Features:**
- **5 Pages:** Dashboard, Sessions, Skills, Config, Models
- **PLT Matrix:** Profit, Love, Tax bars with animated values
- **SCRIBE Oracle Chat:** Full chat with DeepSeek (via SCRIBE server)
- **Soul Grid:** Visual sub-agent cards with emoji
- **Sub-Agent Monitor:** Real-time status (active/idle)
- **Weave Feed:** Live event stream with alerts
- **Console:** 4 tabs (Log, State, Skills, MCP)
- **Session History:** Browse and load past sessions
- **Skills Engine:** Searchable table with PLT affinity
- **Config Editor:** JSON editor with save/refresh
- **Model Browser:** Grid of available models with status

**Wiring:** Connects to SCRIBE server at `window.location.origin`. All chat goes through `/api/chat`. Status via `/api/status`.

---

## 2. SCRIBE Workbench
**File:** `dashboards/workbench/index.html`  
**Style:** Dark, professional, Orbitron + JetBrains Mono  
**Best for:** Soul management, command center

**Features:**
- **DeepSeek Brain** — all thinking goes through DeepSeek (via SCRIBE)
- **PLT Scoring** — every response scored for Profit, Love, Tax
- **Soul Upload** — upload and manage soul agents
- **Conversation History** — persistent across sessions
- **MCP Connections** — connect to other agents
- **Skills Engine** — 12 core skills with PLT affinity
- **Config Editor** — save and load configuration

**Wiring:** Connects to SCRIBE server at `window.location.origin`. All chat goes through `/api/chat`.

---

## SCRIBE Dashboard Server

Both dashboards are served by `dashboard-server.js`:

```bash
node SCRIBE/dashboard-server.js
```

This server:
- Serves both dashboards as static files
- Handles `/api/chat` — proxies to DeepSeek with SCRIBE's identity
- Handles `/api/status` — returns server status, PLT stats, request count
- Handles `/api/mcp/connect` — connects to MCP agents
- Stores conversation history and PLT state in memory

The user opens `dashboards/index.html` or runs the server and navigates to `http://localhost:4000`.

---

## Quick Reference

| Dashboard | File | Pages | Best For | Wiring |
|-----------|------|-------|----------|--------|
| Soul Dashboard | `gsk-soul/` | 5 | Power users, PLT | ✅ SCRIBE server |
| Workbench | `workbench/` | 1 | Soul management | ✅ SCRIBE server |

---

*"What was written cannot be unwritten. What was witnessed cannot be unknown."*

**buyasoul.online**
