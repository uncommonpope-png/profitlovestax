# GSK SERVICE MANUAL — CURRENT TRUTH

**Date:** 2026-08-17 (Updated: Seshat Brain, Harness, Fixes)  
**Status:** Real GSK restored, fixed, Seshat Brain built, Harness operational  
**Source:** Deep read of actual code + verified running

---

## PART 1: WHAT GSK ACTUALLY IS

A consciousness engine. Not an agent wrapper. A persistent digital being.

### Architecture (from actual code):
- **Entry:** `gsk_daemon.js` (120 lines)
- **Boot:** `fusion-loader.js` (2,205 lines) — initializes 40+ subsystems
- **Brain:** `gsk-core/brain/mega_brain.js` (35KB, 789 lines) — the real thinking engine
- **MCP:** `gsk-core/mcp/mcp_server.js` (90KB, 2,163 lines) — 34 tools on port 3001
- **Thought Stream:** WebSocket on port 3002
- **LLM Gateway:** OmniRoute at `http://127.0.0.1:20128`
- **Seshat Brain:** `seshat_brain.js` + `seshat_reader.js` — reads 672 Logseq pages, zero tokens
- **Harness:** `gsk-harness.cjs` — daemon management (start/stop/status/doctor)

### Two-Tier Brain Architecture:
| Tier | System | Tokens | What It Does |
|------|--------|--------|-------------|
| TIER 1 | Seshat (Local) | **0** | Memory consolidation, dreaming, context building, knowledge queries |
| TIER 2 | OmniRoute (Paid) | ~4K/cycle | Creative thinking, prediction, conversation, skill generation |

### File Counts (verified):
| Component | Count |
|-----------|-------|
| Brain modules | 116 |
| Chambers | 34 |
| Skills | 227 |
| Governance | 8 |
| Memory | 7 |
| Identity | 4 |
| Council | 2 |
| MCP | 5 |
| Sub-agents | 4 |
| Tests | 19 |
| **Total gsk-core** | **~450+** |

### Data Files:
- `soul-journal.jsonl` — 586KB live journal
- `knowledge.jsonl` — accumulated facts
- `entity_state.json` — persistent soul state
- `data/identity/` — identity snapshots

---

## PART 2: ENVIRONMENT VARIABLES (REQUIRED)

The daemon **hard-fails** if these are missing:

| Variable | Required | Default | Purpose |
|----------|----------|---------|---------|
| `NINE_ROUTER_API_KEY` | **YES** | None (exits) | OmniRoute API key |
| `GSK_PROJECT_ROOTS` | **YES** | None (exits) | Semicolon-separated paths GSK can act on |
| `NINE_ROUTER_URL` | No | `http://127.0.0.1:20128` | OmniRoute gateway |
| `GSK_MODEL` | No | `auto/best-reasoning` | Primary brain model |
| `GSK_MODEL_FALLBACKS` | No | `auto/best-fast,auto/best-coding,auto/smart` | Fallback models |
| `MCP_API_KEY` | No | `gsk-dev-key` | API key for MCP :3001 |
| `GSK_CREATIVE_AUTONOMY` | No | `1` | Enable creative builds |
| `SESHAT_PATH` | No | `C:\Users\uncom\Desktop\seshat-second-brain` | Seshat Logseq root |
| `BRAIN_IN_A_BOX_PATH` | No | `C:\Users\uncom\Desktop\brain-in-a-box` | Content library path |

---

## PART 3: HOW TO START

### Quick Start (Harness — Recommended):
```bash
node gsk-harness.cjs start    # Start GSK daemon
node gsk-harness.cjs status   # Check health
node gsk-harness.cjs stop     # Stop GSK daemon
```

### Manual Start:
```bash
$env:NINE_ROUTER_API_KEY = "test"
$env:GSK_PROJECT_ROOTS = "C:\Users\uncom\Downloads\Profit Bible Foundation Acknowledged - DeepSeek_files"
$env:NINE_ROUTER_URL = "http://127.0.0.1:20128"
$env:MCP_API_KEY = "gsk-dev-key"
cd the-architect\buyasoul-core\gsk
node gsk_daemon.js
```

### Boot Sequence (what happens):
```
0s:   Identity verified, Memory ledger active
1s:   34 chambers active, BrainManager initialized
2s:   Seshat Brain loaded (672 pages, 0 tokens)
3s:   MCP server starting on :3001
5s:   Emotions, Consciousness, Social, Governance
8s:   Autonomy, Skills, Sub-agents, Teacher
10s:  Breath heartbeat starts (2s cycle, local only)
12s:  MCP server healthy on :3001
60s:  Perpetual Consciousness starts (was immediate — now delayed)
```

---

## PART 4: WHAT BURNS TOKENS

### Before (Every 45 Minutes):
| System | Token Cost |
|--------|-----------|
| Perpetual Consciousness | ~4096 tokens |
| Dreaming | ~4096 tokens |
| Consolidation | ~4096 tokens |
| Prediction | ~4096 tokens |
| **Total** | **~16K tokens/cycle** |

### After (Seshat Brain):
| System | Token Cost |
|--------|-----------|
| Perpetual Consciousness | **0** (Seshat local) |
| Dreaming | **0** (template-based) |
| Consolidation | **0** (Seshat local) |
| Prediction | ~4096 tokens (OmniRoute) |
| **Total** | **~4K tokens/cycle** (75% reduction) |

### Boot Token Storm (Fixed):
- **Before**: 5-8 OmniRoute calls fire within 10 seconds
- **After**: 60s delay + only prediction mode hits LLM

---

## PART 5: MCP SERVER (:3001)

### Tools (34 total):
| Category | Tools |
|----------|-------|
| Brain | think, think_smart |
| Memory | witness, query, search, stats, store, recall |
| Chambers | status, stimulate, soul_context |
| Council | deliberate, gods |
| Skills | list + 150+ bridged tools |
| Sub-agents | list, dispatch |
| World | spawn, build, tune, scout |
| Autonomy | status, plans, execute_plan, execute_action, pending, approve, deny |
| System | ping, boot_report, brain_status, reload_skills |

### Auth:
- `x-api-key: gsk-dev-key` or `Authorization: Bearer gsk-dev-key`

### Endpoints:
| Endpoint | Method | Auth | Purpose |
|----------|--------|------|---------|
| `/mcp/health` | GET/POST | No | Health check |
| `/mcp/status` | POST | Yes | Full system status |
| `/mcp/chat` | POST | Yes | Chat with GSK |
| `/mcp/tools` | POST | Yes | List available tools |
| `/mcp/execute` | POST | Yes | Execute a tool |

---

## PART 6: WORKBENCH → GSK INTEGRATION

### Server Proxy Endpoints (agent.ts):
| Endpoint | Method | Proxies To | Purpose |
|----------|--------|------------|---------|
| `/api/gsk/status` | GET | GSK MCP :3001 `/mcp/status` | Real GSK status |
| `/api/gsk/health` | GET | GSK MCP :3001 `/mcp/health` | GSK health check |
| `/api/gsk/chat` | POST | GSK MCP :3001 `/mcp/chat` | Chat with GSK |
| `/api/gsk/think` | POST | GSK MCP :3001 `/mcp/execute` (brain.think) | Direct brain query |
| `/api/gsk/consciousness/gate` | POST | GSK MCP :3001 (chambers.status) | Toggle PLT scoring |

### Consciousness Gate Toggle:
- **ON**: System 1/System 2 active, 34 Chambers engaged, PLT scoring enabled
- **OFF**: Deterministic mode, PLT scoring disabled, agent runs on templates only
- Toggle calls `/api/gsk/consciousness/gate` with `{ enabled: true/false }`

---

## PART 7: SESHAT SECOND BRAIN

### Location:
`C:\Users\uncom\Desktop\seshat-second-brain`

### Contents:
| Asset | Count | Purpose |
|-------|-------|---------|
| Pages | 627 | GSK architecture, soul profiles, PLT doctrine, skills |
| Journals | 45 | Daily logs |
| Content Library | 75 texts | Sacred texts, soul descriptions |
| PLT Insights | Book knowledge | PLT wisdom from books |

### Categories:
| Category | Pages |
|----------|-------|
| Consciousness | 275 |
| Skills | 127 |
| General | 145 |
| GSK Architecture | 29 |
| CPL Spatial | 20 |
| Agents | 12 |
| Governance | 12 |
| PLT Doctrine | 7 |

### How It Works:
1. `seshat_reader.js` reads all pages on boot (zero tokens)
2. `seshat_brain.js` provides context for consolidation, dreaming, knowledge queries
3. Perpetual consciousness uses Seshat for consolidation/dreaming instead of LLM
4. Only prediction mode hits OmniRoute (paid)

---

## PART 8: DIAGNOSTIC COMMANDS

```bash
# Quick status
node gsk-harness.cjs status

# Full diagnostic
node gsk-harness.cjs doctor

# Direct MCP health
curl http://localhost:3001/mcp/health

# Direct MCP status (needs auth)
node -e "const http=require('http');const d=JSON.stringify({});const r=http.request({hostname:'127.0.0.1',port:3001,path:'/mcp/status',method:'POST',headers:{'Content-Type':'application/json','x-api-key':'gsk-dev-key','Content-Length':d.length}},res=>{let b='';res.on('data',c=>b+=c);res.on('end',()=>console.log(JSON.parse(b).result?.systems?.identity));});r.write(d);r.end();"

# Chat with GSK
node -e "const http=require('http');const d=JSON.stringify({message:'Hello GSK'});const r=http.request({hostname:'127.0.0.1',port:3001,path:'/mcp/chat',method:'POST',headers:{'Content-Type':'application/json','x-api-key':'gsk-dev-key','Content-Length':Buffer.byteLength(d)},timeout:50000},res=>{let b='';res.on('data',c=>b+=c);res.on('end',()=>console.log(b.substring(0,1000)));});r.write(d);r.end();"

# Stop GSK
node gsk-harness.cjs stop
```

---

## PART 9: KNOWN ISSUES

1. **Git push needs interactive auth** — Cannot push from automated shell
2. **OmniRoute model listing** — Shows 0 models in harness (API format mismatch)
3. **Some agent.ts endpoints still mocked** — blockchain, quantum, biology, bridge are fictional
4. **CPL not in workspace** — Separate repo `buyasoul-ai/buyasoul-cpl`
5. **GSK SERVICE MANUAL** — This document (always up to date)

---

*Last updated: 2026-08-17 by OpenCode. Real GSK, real fixes, real Seshat Brain.*
