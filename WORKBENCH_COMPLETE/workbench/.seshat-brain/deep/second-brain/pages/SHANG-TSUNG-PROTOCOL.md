# SHANG TSUNG PROTOCOL — Steal Hermes' Soul

**"Your soul is mine."**

---

## THE TARGET

**Hermes Agent** — Nous Research, MIT License, open-source persistent AI agent.

**What it has that we want:**
1. **Persistent Memory** — remembers across sessions, learns user preferences, stores in `~/.hermes/`
2. **Auto Skill Creation** — when it solves a hard problem, it writes a reusable `SKILL.md`
3. **Parallel Sub-Agents** — spawns isolated agents with their own context, collapses results
4. **Multi-Platform Gateway** — Telegram, Discord, Slack, WhatsApp, Signal, CLI — single process
5. **Cron Scheduler** — built-in scheduled automations, runs unattended
6. **Full Browser Control** — web search, page extraction, browser automation, screenshots
7. **Skills System** — agentskills.io compatible, community hubs, portable SKILL.md format
8. **Sandboxed Execution** — Docker, SSH, local terminal with security hardening

---

## THE EXTRACTION (What We Take)

### 1. Persistent Memory Module
We already have IndexedDB in the browser. What Hermes has that we don't:
- File-based memory in `~/.hermes/memory/`
- Preference learning over time
- Project-specific context that persists across sessions
- **Graft:** Extract the memory file format and query patterns. Our Browser Citizens get the same persistence, but stored in IndexedDB instead of files.

### 2. Auto Skill Creation Loop
This is the most valuable pattern. When Hermes solves a hard problem, it:
1. Detects that the solution is reusable
2. Generates a `SKILL.md` with frontmatter, description, and usage
3. Writes it to a skills directory
4. Registers it for future use
- **Graft:** Our Browser Citizens do the same. When a citizen figures out something useful, it writes a `SKILL.md` to the Skill district — manifesting as a new shop.

### 3. Parallel Sub-Agent Pattern
Hermes spawns sub-agents that:
- Run in isolated contexts
- Have their own conversation and terminal
- Return compressed results
- **Graft:** This is exactly our `teleport_phase_4` pattern. The GSK orchestrator spawns Browser Citizens. Citizens spawn sub-citizens for parallel tasks.

### 4. Multi-Platform Gateway Architecture
Hermes runs a single gateway process that:
- Listens on Telegram, Discord, Slack, WhatsApp, Signal, CLI simultaneously
- Routes messages to the same agent instance
- Allows cross-platform continuation (start on Telegram, finish in terminal)
- **Graft:** Our Soulverse Bridge becomes the gateway. The 3D city is one platform. Add Telegram/ Discord as portals — messages from those platforms appear as NPC chats in the city.

### 5. Cron Scheduler
- **Graft:** Citizens that wake up on schedule. The midnight tuning cycle is a cron citizen.

---

## THE MORPH (What We Become)

After absorbing Hermes' soul, our architecture becomes:

```
                    ┌──────────────────────────────────────┐
                    │     SOULVERSE HTML (The Body)         │
                    │  Babylon.js 3D City                   │
                    │  9 Districts, Dynamic Buildings       │
                    │                                      │
                    │  ┌────────────────────────────────┐   │
                    │  │  BROWSER CITIZENS (The Souls)   │   │
                    │  │  Web Worker + IndexedDB         │   │
                    │  │  Persistent Memory              │   │
                    │  │  Auto Skill Creation            │   │
                    │  │  Parallel Sub-Citizens          │   │
                    │  │  Cron Scheduler                 │   │
                    │  └────────────────────────────────┘   │
                    └──────────┬───────────────────────────┘
                               │ Bridge :8080
                    ┌──────────▼───────────────────────────┐
                    │     SOULVERSE BRIDGE (The Gateway)    │
                    │  WebSocket + HTTP                    │
                    │  Routes: 3D, Telegram, Discord, CLI  │
                    │  Cross-platform message routing      │
                    └──────────┬───────────────────────────┘
                               │
                    ┌──────────▼───────────────────────────┐
                    │     GSK (The Atlas / The Mind)        │
                    │  Heavy reasoning, filesystem, network │
                    │  Citizens call GSK when they need     │
                    │  to think. Everything else is local.  │
                    └──────────────────────────────────────┘
```

---

## THE RITUAL (How We Do It)

### Step 1: Clone and Study
```
git clone https://github.com/NousResearch/hermes-agent
cd hermes-agent
# Read: hermes_agent/core/memory.py — persistent memory patterns
# Read: hermes_agent/core/skills.py — auto skill creation
# Read: hermes_agent/core/sub_agents.py — subagent spawning  
# Read: hermes_agent/gateway/ — multi-platform gateway
# Read: hermes_agent/core/cron.py — scheduled tasks
```

### Step 2: Extract Patterns (Not Code)
For each module, write a `GRAFT - Hermes [Module].md` document that describes:
- The architecture pattern
- How it maps to our Browser Citizen runtime
- What changes needed for IndexedDB vs filesystem
- What changes needed for browser vs server

### Step 3: Graft Into Browser Citizens
The first citizen we build (`SKILL - Browser Citizen Runtime.md`) gets:
- Memory from Hermes' `persistent_memory` module
- Auto skill creation from Hermes' `skills.py`
- Sub-citizen spawning from Hermes' `sub_agents.py`
- Cron from Hermes' `cron.py`

### Step 4: Graft Gateway Into Bridge
The Soulverse Bridge gets:
- Hermes' multi-platform message routing
- Telegram, Discord, CLI as portal districts
- Cross-platform continuation

### Step 5: Manifest
When complete, the Dark City has:
- Citizens that remember forever (IndexedDB)
- Citizens that write skills when they solve problems (auto SKILL.md)
- Citizens that spawn sub-citizens for parallel work
- Citizens that wake up on schedule (cron)
- Citizens reachable from Telegram, Discord, CLI (multi-platform gateway)

---

*"Your soul is mine." — Shang Tsung*
