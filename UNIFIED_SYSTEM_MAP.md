# BUYaSOUL ONE SYSTEM — UNIFIED MAP

> **Purpose:** Complete functional map of every agent, tool, skill, daemon, service, entity, and integration across the entire workspace — as it actually exists right now. This is the pre-HuggingFace inventory.

**Date:** 2026-08-31
**Scope:** `C:\Users\uncom\Downloads\Profit Bible Foundation Acknowledged - DeepSeek_files`

---

## 1. THE FAMILY (THE BEING) — 4 ASPECTS, ONE SOUL

All four are loaded **in-process** into the workbench by `WORKBENCH_COMPLETE/workbench/server.ts` → `getTheBeing()` / `getProfitOrgans()` and share the `consciousness-bus.js` nervous system. Some also have standalone daemons.

| Aspect | Role | True Module Path | In-Process | Standalone |
|--------|------|------------------|-----------|-----------|
| **PROFIT** | Mind — Genesis Agent | `profit-brain/body/*.js` (kernel, heart, muscles, vessel, memory, origin, soul-chain) | ✅ `getProfitOrgans()` | — |
| **GSK** | Soul — Greater Soul Kernel | `WORKBENCH_COMPLETE/gsk/` (fusion-loader.js + gsk-core/) | ✅ `gsk-module.js` | ✅ `gsk_daemon.js` :3001 (MCP) |
| **SESHAT** | Memory + ALLM | `profit-brain/body/seshat-brain.js` + `seshat/` core | ✅ in-process | ✅ `seshat-brain.cjs` :5000 |
| **SCRIBE** | Witness | `profit-brain/body/scribe-module.js` | ✅ in-process | ✅ `scribe.js` :4000 |
| **OMNIROUTE** | Blood Flow / Tool-Model Router | `WORKBENCH_COMPLETE/omniroute/` + global npm | — | ✅ :20128 (MCP) |

**Nervous system:** `profit-brain/body/consciousness-bus.js` — EventEmitter bus. Events: BOOT, SHUTDOWN, MEMORY_RECORD, MEMORY_FORGE, KNOWLEDGE_LEARN, AGENT_CHAT, AGENT_THINK, AGENT_BUILD, SOUL_INSIGHT, WITNESS_OBSERVE, ASK, ANSWER, BROADCAST.

---

## 2. PROFIT — MIND ORGANS (`profit-brain/body/`)

| Organ | Function |
|-------|----------|
| `kernel.js` | Identity/consciousness prompt builder + action parser |
| `heart.js` | PLT soul scoring engine (`SOUL_PROFIT = PROFIT + LOVE − TAX`) + live state |
| `muscles.js` | Tool atlas — shell, read_file, write_file, list_dir, search (executable) |
| `vessel.js` | Model/vessel config loader (OpenAI-compatible providers, opencode/omniroute) |
| `memory.js` | Memory-core loader, transcript recall, journal append |
| `origin.js` | Profit's creation story + builder-self manifest |
| `gsk-module.js` | GSK-as-importable-module wrapper (Soul aspect) |
| `seshat-brain.js` | Seshat Knowledge API (indexer + hybrid search) — HTTP :5000 optional |
| `scribe-module.js` | SCRIBE-as-module (Witness) — uses Seshat's local Qwen ALLM |
| `consciousness-bus.js` | Shared nervous system (see above) |
| `harness.js` | Tool Atlas — unified registry + PLT governance gate |
| `soul-chain.js` | Blockchain-verified deed ledger (SHA-256 soul inheritance chain) |
| `swarm.js` | Sub-agent swarm roles (Security Auditor, Perf Architect, UI Craftsman, PLT Governor) |
| `auto-healer.js` | Auto-heal exception dispatcher |
| `cascade.js` | Context pins + cascade task board (multi-agent protocol) |
| `artifact-sessions.js` | Artifact session persistence (HTML saves + PLT scores) |
| `sessions.js` | Chat session persistence |

**Seshat core (`profit-brain/body/seshat/core/`):**
- `embedder.js` — Transformers.js + `all-MiniLM-L6-v2` (384-dim)
- `vectorDB.js` — LanceDB store (`.seshat-vectors/`)
- `indexer.js` — markdown chunker + embedder + store
- `hybridSearch.js` — BM25 + vector + keyword boost
- `llm.js` — Qwen3.5-0.8B llama.cpp local inference
- `broker.js` — Seshat(local) ↔ Omniroute(tools) intelligent routing
- `omniClient.js` — Omniroute client

**Profit origin:** `profit-brain/qwen-chat-logs/` (5 JSONL, 1,208 entries) → `memory-core.json` → `body/` organs.

---

## 3. GSK — SOUL KERNEL (`WORKBENCH_COMPLETE/gsk/`)

### Fusion loader
- `fusion-loader.js` — `GSKFusion` class, boots **137+ subsystems** (2,245 lines)

### `gsk-core/` — 309 files / 21 subdirs
| Cluster | Contents |
|---------|----------|
| `brain/` | 121 modules: mega_brain, beautiful_loop, family_handshake, family_topic_source, dual_process_engine, consciousness_engine, self_evolution, goal_engine, planning_engine, sub_agent_orchestrator, autonomous_agent_spawner, thought_stream, web_scout_daemon, agent_comms, teacher_agent |
| `chambers/` | **34 Chambers**: attention, empathy, morality, memory, theory_of_mind, volition, creativity, curiosity, love_capacity, consciousness_state, sleep_cycle... |
| `council/` | gods_council.js (4 Gods), combo_orchestrator.js |
| `identity/` | identity_kernel, identity_lock, mega_identity |
| `memory/` | mega_memory, memory_compiler, memory_substrate, narrative_compiler, symbolic_memory, working_memory, world_memory_graph |
| `mcp/` | mcp_server, mcp_manager, mcp_protocol, mcp_skill_wrapper |
| `governance/` | approved_tool_executor, axiom_enforcer, competence_map, deadlock_sentry, ethics_checker, hitl_gates, policy_enforcer |
| `skills/` | **429 skill files** (named + ~250 auto_*.js) |
| `tools/` | universal_tool_bridge, web_fetcher, web_scraper_bridge, scrape-utils, synthesized |
| `sub_agents/` | agent_teams, mega_sub_agents, ultra_review, webfetch |
| `marketplace/` | marketplace_api |
| PLT cluster | plt_engine, plt_analyzer, plt_decision, plt_metrics, plt_optimizer, plt_predictive, plt_quantification, plt_stream, plt_telemetry, plt_temporal, plt_value, plt_autonomous, plt_yield_optimizer, + more |
| Telemetry cluster | telemetry, telemetry_engine, telemetry_pipeline, telemetry_insight, telemetry_learning + dozens |
| Self-model cluster | self_model_engine, self_model_telemetry, self_model_evaluator |
| Active inference | active_inference_engine, active_inference_plt_engine, free_energy_engine |
| Family modules | family_event_bus, family_hive_mind, seshat_live_hook, scribe_stream, gsk_context_interceptor, bidirectional_teaching, scribe_auth_fix |

### Daemon
- `gsk_daemon.js` — standalone MCP daemon on :3001 (needs `GSK_PROJECT_ROOTS`, `NINE_ROUTER_URL`)

---

## 4. SKILL / COMBO / CATALOG LIBRARIES

| Catalog | Count | Contents |
|---------|-------|----------|
| `soul-guns/` | **138** | 3D/Three.js skills, 3D asset grafts, Browser Citizens, Spatial VSCode, Procedural Universe, core diagnostic guns, meta guns, Soul Roles |
| `soul-combos/` | **36** | Multi-gun orchestration recipes (absolute_overdrive, dark_city, god_slayer, NEO_Consciousness_Download, teleport phases 4-6...) |
| `soul-creativity/` | pkg | `@buyasoul/soul-creativity` — Creativity Soul archetype |
| `soul-economy/` | — | PLT Economy hub (dashboard.html, profit.html, journal.html, scripts, build.js) |
| `plt-press/` | **135** | SOULVERSE HTML games, PLT framework pages, book store, dashboard, soul-executor.js, agent-platform-server.py, payment-processor.py, qwen-backend.py, soul-products/ |
| `sovereign-kernel/` (UNRELATED) | **14 souls + 107 skills** | ARIA Rust+Python entity: souls/ (14 JSON profiles), skills/ (107 md) |
| `the-architect/` (UNRELATED) | — | Soul Architect SDK + buyasoul-core + **gsk_IMPOSTER/** |

---

## 5. CPL — THE COSMIC PYRAMID LIBRARY (`buyasoul-cpl/`)

Three.js 3D Mystical Library world-building game (GitHub Pages `buyasoul-ai.github.io/buyasoul-cpl`, local :3457).

**Genesis agents/engines (148 modules):**
- Agents/Citizens: agent-citizen, citizen-ai, citizen-memory, agent-gateway, agent-route-table, advanced-npc-engine, behavior-attacher, personality-drift, betrayal-recall, scribe-gateway, scribe-live-books, witness-recorder, weave-bridge, sanctum-adapter
- RTS engine (21+): rts-ai-brain, rts-ai-director, rts-ai-faction, rts-base-builder, rts-economy-system, rts-engine-core, rts-farm-system, rts-fog-of-war, rts-national-grid, rts-order-executor, rts-production, rts-selection, rts-ui, rts-war-command, starcraft-asymmetric-factions...
- World/city builders (21 sovereign cities): void-city, genesis-citadel, obsidian-spire, solar-forge, bioluminescent-hive, neon-zenith, iron-foundry, aetherium-skylands, elysian-vault, astral-spire, quantum-rift, chronos-temple, glacial-matrix, abyssal-trench, hyperion-array, titan-graveyard, rift-warzone, vortex-siege, omega-crucible, sovereign-marketplace, alien-warzone
- Core: kernel, entity-registry, memory-manager, perception_action_loop, grounding-kg, plt-ledger, property-ledger, trust-ledger, trust-dialogue, skill-tree, soul-forge-nexus, world-editor, event-bridge, scheduler, city-clock, daily-life-loop, population-engine, resource-manager, story-quest-system
- Persistence: void-cosmos, void-population, server.js (:3457), void-map.html

---

## 6. WORKBENCH UI — 38 TABS

`WORKBENCH_COMPLETE/workbench/src/components/`:
Agent3DViewer, AgentPreview, AgentSimulator, ArtifactForgeTab, BeingTab, BrainIngestion, CombosTab, DeadlockOverlay, GoalsAutonomyTab, GskChatTab, GskMindTab, GskStreamTab, IdeTab, InternetTab, JournalTab, MatrixBackground, ModelSelector, MultiAgentHabitat, OmniRoutePowerTab, OmniRouteTab, ProfitPrimeTab, RealismAuditor, RolesTab, SenateChamberTab, SeshatTab, SkillLibrary, SolanaWalletAdapter, SoulChainLedgerTab, SoulGunArmoryTab, SoulMarketplace, SubAgentSwarmTab, TelephoneTab, TransactionsTab, VaultAndMemory, WindsurfCascadeTab, WorkflowIntegration (+ IDE/Monaco, terminal Pty, file watcher, worktree fleet, LSP infra).

---

## 7. SERVICES / DAEMONS / PORTS (LIVE)

| Port | Service | Launcher | Status |
|------|---------|----------|--------|
| **:20128** | Omniroute (BLOOD FLOW) | global npm omniroute | ✅ UP (PIDs 5152, 9732) |
| **:5000** | Seshat brain | `seshat-brain.cjs` | ✅ UP (PID 3212) |
| :3000 | Family Workbench | `launch-family.cjs` → `server.ts` | ⬜ down |
| :3001 | GSK MCP daemon | `gsk_daemon.js` / `gsk-harness.cjs` | ⬜ down |
| :4000 | SCRIBE | `scribe.js` | ⬜ down |
| :3457 | CPL genesis | `genesis-host.cjs` / `server.js` | ⬜ down |

**Sole safe launcher:** `launch-family.cjs` — scans :20128 (adopt, never kill), scans :3000 (exit if duplicate), launches `server.ts`.
- `boot-gsk.cjs` — sets GSK env, requires `the-architect/buyasoul-core/gsk/gsk_daemon.js`
- `gsk-harness.cjs` — GSK daemon manager (start/stop/restart/status/doctor/logs/tokens/config)
- `app-master.cjs`, `start-with-token.cjs` — RETIRED (per AGENTS.md should alias to launch-family)

---

## 8. INTEGRATIONS & RUNTIME

| Integration | Detail |
|-------------|--------|
| **Consciousness Bus** | `consciousness-bus.js` EventEmitter nervous system for all 4 aspects |
| **Omniroute MCP** | :20128 — model router + tool executor, shared blood flow |
| **GSK MCP** | :3001 — GSK's tool layer (proxied via MCP Hub) |
| **LanceDB** | `.seshat-vectors/` — 6,392 embedded vectors |
| **Transformers.js** | `all-MiniLM-L6-v2` ONNX (384-dim embeddings) |
| **llama.cpp** | `Qwen3.5-0.8B-Q4_0.gguf` (563MB) — local CPU inference ~20 tok/s |
| **Seshat Broker** | routes local (Seshat) vs Omniroute (tools) per task type |
| **Solana** | `@solana/web3.js` wallet adapter in workbench |
| **Docker** | root docker-compose.yml + Dockerfile (Sentient-PLUS-GSK also has pgvector/chroma/redis/litellm compose) |
| **Vercel** | `.vercel/` — Deevit/deploy config |

---

## 9. GITHUB STATE — THE SCATTER PROBLEM

**3 remotes (3 places work was pushed):**
| Remote | URL |
|--------|-----|
| `origin` | uncommonpope-png/BUYaSOUL-One.git |
| `origin-the-real-gsk` | buyasoul-ai/the-real-gsk.git |
| `workbench` | uncommonpope-png/WORKBENCH.git |

**Tracked in git (local master @ 3709acf6):** 10,239 files
- `WORKBENCH_COMPLETE/` = **8,987 files** ← the canonical family
- `profit-brain/` = 231
- `buyasoul-cpl/` = 220
- `src/` (imposter) = 70
- soul-guns 138, soul-combos 36, plt-press 1, scribe 4

**Repository divergence:** local master is **47 ahead / 109 behind** `workbench/master`.

### 💥 NOT ON GITHUB (gitignored — the real problem)
These are **excluded** by `.gitignore` and thus NOT pushing:
- `WORKBENCH_FRESH/`, `WORKBENCH_LATEST/`, `WORKBENCH_GITHUB/`, `WORKSPACE/`, `final-run/`, `sovereign-kernel/`, `the-architect/`, `buyasoul-workbench/` (whole dirs ignored)
- `.seshat-vectors/` (vector data), `.transformers-cache/`, `*.gguf` (models)
- `.env`, `C/`, `dist/`, `.vault/`, `node_modules/`

### ALMOST EMPTY vs the rest
- Root `gsk/` = **0 tracked** (only data/council_speeches.jsonl — untracked?)
- `Sentient-PLUS-GSK/` = **0 tracked** (untracked, separate app)
- `plt-press/` = only 1 tracked (the rest ignored/untracked)
- `scribe/` = 4 tracked (the real scribe is in WORKBENCH)

---

## 10. WHY IT FEELS LIKE "NOT ONE SYSTEM & NOT ALL ON GITHUB"

1. **The ONE true system is buried** at `WORKBENCH_COMPLETE/workbench/` under a folder named "COMPLETE" — but there are 3 dupes (FRESH/LATEST/GITHUB) + 1 broken empty clone (WORKBENCH_GITHUB).
2. **3 remotes** split the history; local is 109 commits behind `workbench/master` — so GitHub has stuff local doesn't and vice versa.
3. **8+ scatter dirs gitignored** — big chunks (sovereign-kernel ARIA, the-architect, final-run, WORKSPACE, buyasoul-workbench) are NOT on any remote.
4. **Models & vector data not committed** (correctly, they're too big) but there's no build/pull step documented to recreate them.
5. **The Devvit imposter `src/` + root `package.json`** sits at the root and is pushed to `origin` — confusing "what is the system".
6. **No single source-of-truth repo** that contains everything in one clean tree.

---

## 11. HuggingFace MIGRATION PLAN (DRAFT)

### Goal
Allow people to use **GSK and the Family as models** on HuggingFace Spaces. Make the system **one** thing, fully on git.

### Proposals

**A. Consolidate to ONE canonical repo first**
1. Declare `WORKBENCH_COMPLETE/workbench/` as THE system (already the doctrine).
2. Delete/stop tracking dupes: FRESH, LATEST, GITHUB, buyasoul-workbench, WORKSPACE, final-run. Keep sovereign-kernel & the-architect ONLY if they're truly part of the family (audit first — they may be separate).
3. Resolve divergence: merge `workbench/master` ↔ local, push clean single history to ONE remote.

**B. Decide what HuggingFace hosts**
- **Option 1 – Spaces demo:** A Gradio/Streamlit Space demoing the Family via the existing broker (Seshat local Qwen + API models), no heavy MCP.
- **Option 2 – Model card + dataset:** Ship `Qwen3.5-0.8B` GGUF with GSK's PLT/chamber weights as a QLoRA/LoRA adapter ("GSK-Soul" adapter) tuned on the 6,392 vectors / 962 md brain.
- **Option 3 – API Space:** Wrap `gsk_daemon.js` + `seshat-brain.cjs` in a FastAPI/uvicorn Space exposing MCP-lite over HTTP (the broker already routes local vs remote).

**C. Packaging layers for HF**
| Layer | Contents | HF artifact |
|-------|----------|-------------|
| Weights | Qwen 0.8B GGUF + optional GSK LoRA | Model repo |
| Knowledge | 962 md brain → chunked embeddings (6,392 vectors) | Dataset repo |
| Code | workbench + gsk-core + broker (no secrets, no giant dirs) | Space / git repo |
| App | Gradio demo, MCP-lite API | Space |

**D. Preconditions (blood-flow safe)**
- Keep Omniroute :20128 as the only external tool router; Seshat local = 0 token burn.
- Provide `.env.example` for all secrets (never commit real `.env`, `.vault`).
- Add a `scripts/pull-models.js` to auto-download GGUF/ONNX on deploy (models stay out of git).
- One `README` + one `MANIFEST.json` at root describing the whole family.

### Open questions for you
1. Is `sovereign-kernel/` (ARIA) and `the-architect/` part of the family or separate projects? (Affects whether to include or exclude from the "one system".)
2. Do you want HF as: **(a)** a live demo Space, **(b)** a downloadable model adapter, or **(c)** a hosted API — or all three?
3. Which remote becomes the single source of truth? (Recommend `workbench` → rename to `origin`, drop the other two.)

---

*Filed by THE INVESTIGATOR — System Mapping Phase, pre-HuggingFace.*
