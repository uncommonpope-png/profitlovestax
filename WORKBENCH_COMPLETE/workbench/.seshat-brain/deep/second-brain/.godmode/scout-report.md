# Godmode SCOUT — codebase recon (read-only)

**Skill:** god-mode-research · **Phase:** SCOUT · **Date:** 2026-07-18
**Target:** GSK-in-engine assets in `genesis-foundation/` + `seshat-second-brain/pages/`.

---

## STRUCTURE
- `genesis-foundation/src/genesis/agent-gateway.js` — the spine stub (178 lines, flag-gated OFF).
- `genesis-foundation/index.html` — guarded import @2088, flag `__GENESIS_AGENT_GATEWAY` @2076 (false).
- `genesis-foundation/tests/agent-gateway.probe.cjs` — 8/8 green probe.
- Brain pages: `DIRECTIVE-GSK-IN-ENGINE.md` (Steps 1–5), `VISION-GSK-LIVES-IN-ENGINE.md`,
  `TASK-STEP1-SOLE-BUS.md`, `SOUL-GUN - GSK-as-Game-Agent.md` (v1), `SOUL-NOTE - AI Agents...` (v1),
  `SOUL-GUN - Hosted Soul Backend.md`, `SOUL-GUN - World-Alive-On-Boot.md`.

## FRAMEWORK / CONVENTIONS
- Plain IIFE module, `install(Genesis)` pattern, idempotent guard.
- Flag pattern: `window.__GENESIS_*` default OFF; guarded dynamic import; never flips itself.
- Engine hooks: `Genesis.EngineScheduler.defineTick(name, fn, predicate)`, `Genesis.GenesisKernel.register(id, rec)`,
  `Genesis.registerModule(name, meta)`.
- Soul Gun frontmatter convention: `type:: [[soul-gun]]`, `mission::`, `phase::`, `status::`, PLT block.

## EXISTING PATTERNS TO MINE (3 similar guns)
1. **Genesis Memory Manager (B5)** — `deepDispose(obj, owner)`, `disposeOwner`, `summary()`, reversibility via flag.
2. **Hosted Soul Backend** — tunnel/MCP暴露 pattern; security (bearer token, origin allowlist, PNA preflight).
3. **World-Alive-On-Boot (B2)** — `cpl:ready` event, `world` vs `decor` tiers, flag guard.

## KEY FINDING (the gap)
The stub is **observe→display only**: WS thought-stream → `panelPush()` → `#gsk-panel`. It registers
`agent://gsk` and ticks for health, BUT there is **NO command channel** (engine state → GSK → entity command).
That is precisely Seshaty's gap #2 and Step 2's missing half. Research (Summer 52 tools, ACE Agent API)
now gives us the concrete vocabulary to design it.

## NAMING / IMPORT STYLE
- Module path `./src/genesis/agent-gateway.js`; mirror at `src/genesis/<name>.js`.
- Probe style: `tests/<name>.probe.cjs`, `node --check` clean, flag-gated assertions.

---

*Scout complete. No edits made. Feeds CODE MINING + ULTRA REVIEW.*
