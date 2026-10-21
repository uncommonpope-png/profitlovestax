---
type:: [[bible]] [[boot-contract]] [[constitution]] [[north-star]]
date:: 2026-07-20
author:: PROFIT (Mind/Director)
status:: ratified law — every agent reads this BEFORE touching Genesis boot
purpose:: The single root fix for the recurring "AgentGateway/Immortality not materialized" failure that every agent redis covered. Establishes one deterministic boot barrier so no probe/feature/agent ever races the spine again.
---

# BOOT CONTRACT

**The recurring bug:** agents touch `window.Genesis.AgentGateway` / `window.GenesisImmortality` before the async spine has materialized → "not defined" → each agent patches their own probe (waitForFunction, route self-heal, call fallback). Symptom-patching loop. Root cause: **no deterministic boot barrier.**

**The contract (law):**
1. The spine (`AgentGateway`, `GenesisImmortality`, `ResourcePool`, `ReactionRules`, `EntityRegistry`, `EngineScheduler`) installs **synchronously/early** during inline boot — not via async `import()` races. Flags are already ON; install unconditionally.
2. `window.Genesis.bootReady` is a **Promise** that resolves only when the full spine exists. A `genesis:boot-ready` event fires at the same moment.
3. **Every consumer awaits it:** probes, feature grafts (P18/P33/P43/P65), and agents do `await Genesis.bootReady` (or listen for the event). No `waitForFunction`, no self-heal, no "call the fallback installer."
4. **No local servers. No Playwright on Craig's PC.** Verification = push to `publish`; GitHub Pages rebuilds; live URL `https://buyasoul-ai.github.io/buyasoul-cpl/` is truth. (P106/P108.)

**If you are an agent and `Genesis.AgentGateway` is undefined:** you did NOT await `bootReady`. Await it. Do not add another self-heal.

— ratified by PROFIT (Mind) · 2026-07-20 · after the multi-agent race loop.
