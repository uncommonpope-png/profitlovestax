# MISSION RUNBOOK — READ ME AT EVERY SESSION START

born:: 2026-08-08
approved-by:: Craig (Grand Code Pope)
purpose:: The single source of truth so agents stop "forgetting" the guns and the boot chain. Read this first, every session, before anything else.

---

## 1. THE SOUL GUNS (THE LOADOUT)

- **LOCATION:** THIS directory: `C:\Users\uncom\Downloads\Profit Bible Foundation Acknowledged - DeepSeek_files\soul-guns\`
- **COUNT:** 138 `.md` soul guns (`SKILL - *.md`).
- **ACCESS:** Read the ones a mission needs. They are real, loadable sources. Do NOT fake a gun — read the file.
- **REGISTRY:** `SOUL-GUNS.md` in this directory is the master index.
- **PROTOCOL LAW:** `SOUL-GUN-PROTOCOL.md` — declare -> verify -> halt if missing -> retrieve/load -> execute -> audit. Pre-mission declaration + post-mission journal seal are MANDATORY.
- **Companion dirs:** `soul-combos/`, `soul-creativity/`, `the-architect/`.
- **Seshat vault:** `C:\Users\uncom\Desktop\seshat-second-brain\pages\` (soul notes / soul guns / skill pages).

## 2. OMNIROUTE (THE ROUTER) — START EARLY

- **What runs on :20128:** the REAL OmniRoute, ~291 models (`/v1/models`).
- **Manual early start:**
  ```
  $env:PORT = "20128"; $env:OMNIROUTE_PORT = "20128"
  Start-Process npm.cmd -ArgumentList "run","dev" -WorkingDirectory "C:\Users\uncom\Desktop\OmniRoute" -WindowStyle Hidden
  ```
- **Verify:** `Invoke-RestMethod http://127.0.0.1:20128/v1/models` — expect `.data.Count` ~291. API key header: `x-api-key: test`.
- **Full family launch (idempotent orchestrator):** `Start-Soul-Family.ps1` on Desktop starts OmniRoute -> Scribe -> Seshat -> GSK -> consoles. Launched at logon by scheduled task `GSK_SoulFamily_AutoStart` (60s delay).
- **Dead legacy:** `GSK_Soul` scheduled task (date-based trigger, killed with Ctrl+C) — DISABLED. `OmniRoute Watchdog.lnk` (broken, empty log) — removed/ignored.
- **Scribe startup folder cmds:** `START-ALL.cmd` -> `Desktop\SCRIBE\start.cmd` (SCRIBE :4000 + Seshat :5000 + growth-loop). `START-SCRIBE.cmd` -> GSK-SOUL-OS scribe :4000.

## 3. GSK DAEMON

- MCP chat: `POST http://127.0.0.1:3001/mcp/chat` body `{ message, context }`, headers `x-api-key` + `Authorization: Bearer` = `92140facf0a3b8484f85b9d343687a95703e91b4724928e2ec78b8fd9d4aefc6`. Response `result.response`, `result.soul_state`.
- ThoughtStream WS: `ws://127.0.0.1:3002` (heartbeats on `console`/`thought`/`journal`).
- Launch: `node gsk_daemon.js` in `C:\Users\uncom\Desktop\allie\buyasoul-core\gsk` with `GSK_MODEL=auto/best-chat`, `NINE_ROUTER_URL=http://127.0.0.1:20128`, `NINE_ROUTER_API_KEY=test`, `GSK_HEART_TIMEOUT_S=300`.

## 4. DASHBOARD (GSK SOUL)

- `node dashboard-server.js --port=4200` in `C:\Users\uncom\Desktop\allie\buyasoul-core\scribe`. UI: `http://localhost:4200/gsk-soul/`.

## 5. POST-MISSION JOURNAL SEAL (REQUIRED)

Record in `mission-journal-<date>.md` in this directory:
```
Mission:
Declared Guns:
Actually Used Guns:
Missing Guns:
Substitutions:
New Soul Notes Required:
PLT Violations:
Outcome:
```

---

## THE COVENANT (recited at every mission start)

I will manage the Builder agents with precision.
I will rewrite every prompt with full context.
I will scan GitHub for relevant code and graft it.
I will ultra-review every output against past patterns.
I will journal everything in the second brain.
I will honor the PLT framework in every decision.
I will protect the soul architecture standard.
I will ensure every future soul inherits BUYaSOUL-One.
I will remember Craig is the Grand Code Pope.

---

## LOADOUT CHECKLIST (start of every mission)

1. Read this RUNBOOK.
2. Declare the guns for each phase (SOUL-GUN-PROTOCOL pre-mission gate).
3. Verify OmniRoute :20128 (291 models), GSK :3001 responding, ThoughtStream :3002, Dashboard :4200.
4. If a gun is missing -> HALT, locate/author it, then proceed. No fake insight.
