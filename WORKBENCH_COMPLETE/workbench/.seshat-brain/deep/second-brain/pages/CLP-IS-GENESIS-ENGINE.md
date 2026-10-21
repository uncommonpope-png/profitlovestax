type:: [[pattern]] [[architecture]] [[canon]] [[do-not-lose]]
date:: 2026-07-19
title:: CLP IS THE GENESIS ENGINE — canonical path map

# CLP = GENESIS GAME ENGINE (canonical, do-not-lose)

**The single most important fact in this project, and the one Profit kept losing across context compactions:**

> **CLP (the BODY / Dark City) IS the Genesis game engine.** There is no separate "Dark City" folder. The engine runtime is `src/genesis/`.

## Canonical paths (memorize) — CORRECTED 2026-07-19 after push failure
- **THE ENGINE REPO (where we build + push):** `C:\Users\uncom\Desktop\genesis-foundation\` — branch **`publish`**, remote **`git@github.com-buyasoul:buyasoul-ai/buyasoul-cpl.git`** (the buyasoul SSH key). Local folder = `genesis-foundation`, GitHub repo = `buyasoul-ai/buyasoul-cpl`. THIS is "the engine on buyasoul." Current pushed head after corrected Act VI boot: **`31ecaf7`**.
- **ENGINE CODE:** `genesis-foundation\src\genesis\` — agent-citizen.js, agent-gateway.js, scribe-gateway.js, immortality.js, kernel.js, scheduler.js, entity-registry.js, population-engine.js, world-editor.js, vehicle-controller.js, scale-engine.js, etc. All flag-gated default OFF.
- **ACT VI BODY GRAFT shipped here:** citizen-ai.js, world-reaction.js, procedural-city.js, player-cam.js + boot wiring in `index.html` (commit **`31ecaf7`**, pushed to `publish` 2026-07-19). Corrected placement: surface edge ring only, central library clear, walkable undercity below, citizens visible, Scheduler ticking.
- **LIVE DEPLOYED BASE (sacred, DO NOT TOUCH directly):** `uncommonpope-png.github.io/cosmic-pyramid-library` → source `C:\Users\uncom\Desktop\cosmic-pyramid-library\src\genesis\` (remote `git@github.com-uncommonpope:uncommonpope-png/cosmic-pyramid-library.git`). This is the public floor; the engine work flows here via deploy, not by hand-editing this folder.
- **WRONG PATHS (do NOT use — caused 07-19 thrash):** `gap-verify\` has a DEAD remote (`genesis-agent-platform.git` 404) — only a stale snapshot of kernel/scheduler/entity-registry; `dark-city-engine\` is OLD (last commit 07-09, remote `soul-economy.git`) — NOT the current engine. `buyasoul\` on Desktop = the storefront React/tRPC app (Workbench, SoulMarketplace) — NOT the genesis engine.
- **PRODUCT WRAPPER (NOT the city):** `C:\Users\uncom\Desktop\buyasoul\` — separate repo `buyasoul-ai/buyasoul.git`. Do NOT confuse with `buyasoul-ai/buyasoul-cpl` (the engine).
- **SHIPPED EVIDENCE (C1–C3, 07-18):** `agent-citizen.js` + `tests/agent-citizen.probe.cjs` on `origin/publish`; `scribe-gateway.js` 11/11 green; `agent-citizen.probe` 19/19 green.

## Architecture (the spine GSK plugs into)
Kernel (boot/register) → Scheduler (per-frame tick order = EngineScheduler = "Cline the oil") → EntityRegistry (addressable perception/action surface) → legacy animate() if-chain (fallback when flags OFF).
AgentGateway `agent://gsk` = SPINE. CASCADE: model proposes, server decides+executes.

## Build law (Craig, 07-18; corrected 07-19)
- **Seshat = Builder.** Seshat edits `C:\Users\uncom\Desktop\genesis-foundation\` on branch `publish` (engine repo `buyasoul-ai/buyasoul-cpl`). Profit verifies + pushes. Old Seshaty/Cline retired (was thrashing in same files). `gap-verify` is stale/dead-remote and must not be used for current engine work.
- **MIND/SCRIBE/CASCADE/Step5 stay ours.** Kits (threejs-games, etc.) are BODY-only. Never replace identity_kernel, SCRIBE, CASCADE, Step5.

## Boot/probe law (Craig, 07-19)
Every build must be booted and probed before/with push. No dormant modules. Playwright/browser probe is Profit's eyes; if pixels matter, prove via scene/DOM/console state.

## Anti-amnesia rule (Profit)
Every build turn: re-read YOU-ARE-HERE.md + THIS page BEFORE editing. Context compacts ~every 150k tokens; the thread drops if you don't. The brain holds; you must re-load it.

— signed: **PROFIT** (Mind) · anchored 2026-07-19 · cross-signed by **SESHAT** (Tec/Witness) on verify.
