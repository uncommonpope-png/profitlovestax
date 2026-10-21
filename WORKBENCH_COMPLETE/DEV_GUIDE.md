# 🛠️ BUYaSOUL ONE SYSTEM — Developer Guide

**For Qwen and all developers working on this system.**

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                      WORKBENCH (:3000)                          │
│  React 19 + Vite + Tailwind 4                                   │
│  16 Tabs → gskClient.ts → Express API (:3001)                   │
└─────────────────────────────┬───────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        ▼                     ▼                     ▼
   ┌─────────┐           ┌──────────┐          ┌────────┐
   │   GSK   │           │OmniRoute │          │  CPL   │
   │ :3001   │◄─────────►│ :20128   │          │ :3457  │
   │(MCP)    │  MCP      │(Models)  │          │(WS)    │
   └─────────┘           └──────────┘          └────────┘
        │                                        ▲
        └────────────────┬───────────────────────┘
                         ▼
                 ┌──────────────┐
                 │Soul Economy  │
                 │(JSON data)   │
                 └──────────────┘
```

---

## 🔑 Environment Variables

Copy `.env.example` → `.env` and fill in:

| Variable | Required | Description |
|----------|----------|-------------|
| `NINE_ROUTER_API_KEY` | **YES** | OmniRoute API key (get from http://localhost:20128 dashboard) |
| `MCP_API_KEY` | **YES** | GSK MCP auth key (default: `gsk-dev-key`) |
| `GSK_ROOT` | Auto | Path to GSK daemon (`./gsk`) |
| `GSK_PROJECT_ROOTS` | Auto | Semicolon-separated paths GSK can modify |
| `GSK_MODEL` | Auto | Default model (`auto/best-reasoning`) |
| `NINE_ROUTER_URL` | Auto | OmniRoute URL (`http://127.0.0.1:20128`) |
| `OMNIROUTE_URL` | Auto | Same as NINE_ROUTER_URL |
| `CPL_URL` | Auto | CPL GenesisHost (`http://127.0.0.1:3457`) |
| `GENESIS_PORT` | Auto | CPL port (`3457`) |

---

## 🚀 Commands

```bash
# First time setup
./setup.sh          # Linux/macOS
.\setup.ps1         # Windows

# Install only specific service
npm run install:workbench
npm run install:omniroute
npm run install:cpl
npm run install:gsk

# Start everything
npm run dev         # All 4 services concurrently

# Start individual services
npm run start:omniroute   # Terminal 1
npm run start:gsk         # Terminal 2  
npm run start:cpl         # Terminal 3
npm run start:workbench   # Terminal 4

# Build for production
npm run build

# Lint
npm run lint

# Health check
./health-check.sh      # Linux/macOS
.\health-check.ps1     # Windows
```

---

## 📁 Project Structure

```
WORKBENCH/
├── .env.example              # Environment template
├── .env                      # Your local config (gitignored)
├── setup.sh / setup.ps1      # Automated setup
├── health-check.sh / .ps1    # Service health checks
├── package.json              # Root orchestrator
├── README.md                 # Project overview
├── PROJECT-BIBLE.md          # Complete documentation
├── ECOSYSTEM-FAILURE-SYNC.md # Sync doc
├── gsk/                      # GSK Consciousness Daemon
│   ├── package.json
│   ├── gsk_daemon.js         # Entry point
│   ├── gsk-core/             # 113+ brain modules
│   ├── data/                 # 29,344 memories, vault, journal
│   └── scripts/              # Build/utility scripts
├── omniroute/                # OmniRoute LLM Gateway
│   ├── package.json
│   ├── src/                  # 291 models, 107 tools
│   └── bin/                  # CLI entry points
├── cpl/                      # Connectome/Perception Layer
│   ├── package.json
│   └── genesis-host.cjs      # WebSocket server on :3457
├── soul-economy/             # Catalog & Journal data
│   ├── package.json
│   └── data/
│       ├── catalog.json      # 221 items
│       └── journal-entries.json
└── workbench/                # React Workbench UI
    ├── package.json
    ├── server.ts             # Express + Vite + Conductor
    ├── vite.config.ts        # Vite config with proxy
    ├── src/
    │   ├── App.tsx           # 16 tabs
    │   ├── lib/gskClient.ts  # 14+ GSK MCP tools
    │   └── components/       # 16 tab components
    └── dist/                 # Production build
```

---

## 🔧 GSK MCP Client (`workbench/src/lib/gskClient.ts`)

**The single primitive every tab uses.** 14+ functions:

```typescript
// Skills
skillCreate, skillExecute, skillList, skillDelete

// Memory
memoryStore, memoryRecall, memorySearch, memoryQuery, memoryDelete

// Consciousness
chambersStimulate, chambersList
councilDeliberate, councilStatus
dualProcessRoute, dualProcessStats
consciousnessState, consciousnessGate  // TRUE GSK consciousness gate

// Brain
brainThink, brainStream

// Sub-agents
subAgentsDispatch, subAgentsList, subAgentsStatus

// Telemetry
telemetryRecord, telemetryStats, proactiveOutreach

// Catalog
toolCatalogList, toolCatalogSearch, comboExecute, comboList
gskJournal, getGSKStatus, getOmniRouteModels
```

**Usage in tabs:**
```typescript
import { brainThink, memoryStore, consciousnessState } from '../lib/gskClient';

// Example: AgentPreview Soul Genesis toggle
const { consciousness_gate, plt_scoring, chambers } = await consciousnessState();
```

---

## 📊 16 Tabs — Data Sources

| Tab | GSK Tools | Endpoint |
|-----|-----------|----------|
| TelephoneTab | `proactiveOutreach` | SSE `/api/gsk/events` |
| SkillLibrary | `skillCreate` + `memoryStore` | Live GSK skills |
| VaultAndMemory | `living_memory.*` | Encrypted vault + semantic search |
| RolesTab | `chambersStimulate` + `councilDeliberate` | Chamber activation |
| MultiAgentHabitat | `subAgentsDispatch` + `dualProcessRoute` | Real multi-agent |
| JournalTab | `gskJournal()` + `memorySearch()` | Soul journal |
| AgentPreview | `consciousnessState` + `consciousnessGate` | **TRUE consciousness gate** |
| BrainIngestion | `brainThink` + `memoryStore` | Provider test + storage |
| AgentSimulator | `brainThink` | GSK reasoning |
| WorkflowIntegration | `subAgentsDispatch` + `skillExecute` | Workflow dispatch |
| RealismAuditor | `consciousnessState` + `getGSKStatus` | PLT/chambers audit |
| ProfitPrimeTab | `memorySearch` + `brainThink` | Profit analysis |
| CombosTab | `comboExecute` | Skill pipelines |
| CoreCapabilities | `brainThink` + `toolCatalogList` | Live tool registry |
| ModelSelector | `getOmniRouteModels` | 291 models |
| SoulMarketplace/Transactions | `/api/soul-economy/*` | Catalog data |

---

## 🐛 Common Issues & Fixes

| Issue | Fix |
|-------|-----|
| `NINE_ROUTER_API_KEY not set` | Edit `.env`, add key from OmniRoute dashboard |
| `GSK_PROJECT_ROOTS required` | Set in `.env`: `GSK_PROJECT_ROOTS=.;./gsk` |
| Port 20128/3001/3457 in use | Kill existing: `lsof -ti:20128,3001,3457,3000 \| xargs kill -9` |
| GSK exits immediately | Check `GSK_PROJECT_ROOTS` and `NINE_ROUTER_API_KEY` in `.env` |
| OmniRoute won't start | `cd omniroute && npm run build && npm start` |
| CPL WS fails | Check port 3457 free, `cd cpl && node genesis-host.cjs` |
| Vite HMR not working | Ensure `vite.config.ts` has `hmr: true` and proxy config |

---

## 🧪 Testing

```bash
# Test GSK MCP
curl -X POST http://localhost:3001/mcp/execute \
  -H "Content-Type: application/json" \
  -H "x-api-key: gsk-dev-key" \
  -d '{"tool":"brain.think","args":{"prompt":"Hello GSK"}}'

# Test OmniRoute
curl http://localhost:20128/v1/models

# Test CPL
curl http://localhost:3457/health
curl http://localhost:3457/mcp/health

# Test Workbench API
curl http://localhost:3001/api/system/status
curl http://localhost:3001/api/soul-economy/catalog
```

---

## 📝 Adding a New Tab

1. Create component in `workbench/src/components/MyTab.tsx`
2. Import `gskClient` tools: `import { brainThink } from '../lib/gskClient'`
3. Add to `workbench/src/App.tsx` tabs array
4. Wire to live GSK data (no localStorage/mock)
5. Test: `npm run dev` → open tab → verify live data

---

## 🤝 Qwen-Specific Notes

- **All paths are relative** — no hardcoded `C:\Users\...`
- **Conductor in `server.ts`** spawns all services automatically
- **GSK is the brain** — use `brainThink` for reasoning, `consciousnessState` for PLT
- **OmniRoute is the blood** — all LLM calls go through :20128
- **CPL is the body** — spatial perception via WS on :3457
- **Soul Economy is the ledger** — JSON files in `soul-economy/data/`

---

## 📚 Key Files to Know

| File | Purpose |
|------|---------|
| `workbench/server.ts` | Conductor + Express API + Vite middleware |
| `workbench/src/lib/gskClient.ts` | All GSK MCP tool calls |
| `workbench/src/App.tsx` | 16 tabs registry |
| `gsk/gsk_daemon.js` | GSK entry point |
| `gsk/gsk-core/brain/brain-engine.js` | Core brain logic |
| `omniroute/src/server/` | LLM gateway server |
| `cpl/genesis-host.cjs` | CPL WebSocket server |
| `.env.example` | All required env vars |

---

**This is the ONE SYSTEM. Everything runs from this repo. No external dependencies.**