# DIRECTIVE — SESHATY: Build GSK Into the Engine (AgentGateway Stub)

**Issued by:** Profit Prime (Neo) · **For:** Seshaty (builder's aide) · **Date:** 2026-07-18
**PLT target:** Profit +10, Love +6, Tax −3 = +13
**Status:** AUTHORIZED TO BUILD (sandbox only)

---

## OBJECTIVE

Make the new engine (`buyasoul-ai/buyasoul-cpl`) host GSK as a first-class in-engine agent — instead of the current bolt-on over `localhost:3001/3002/9001`. You are building the **Layer D precursor to M9 (Agent Protocol / embassy)**.

GSK stays the brain. You are adding the **in-engine Agent Host** that registers GSK and drives its loop. Do NOT port or rewrite GSK (REDBUTTON law).

## WHERE YOU WORK

- **Sandbox:** `C:\Users\uncom\Desktop\genesis-foundation\` (clone of CPL, origin → `buyasoul-cpl` `publish`).
- **Existing foundation modules to build ON TOP OF** (read them first — match their style):
  - `src/genesis/kernel.js` — `GenesisKernel` (boot/register/teardown)
  - `src/genesis/entity-registry.js` — `EntityRegistry` (addressable entity ids)
  - `src/genesis/scheduler.js` — `EngineScheduler` (deterministic ticks)
- **Index install block:** `index.html` already has the 3 foundation modules gated by flags around line 2073–2086. Add your gateway flag there too.

## WHAT TO BUILD — `src/genesis/agent-gateway.js`

A single new module, flag-gated OFF by default. Spec:

1. **Flag:** `window.__GENESIS_AGENT_GATEWAY` (default `false`). Zero effect on the live floor when off.
2. **Register:** on boot (driven by `GenesisKernel`), call `EntityRegistry.register('agent://gsk', {...})` so GSK is an addressable entity.
3. **Connect:** open WS to `window.GSK_WS_ENDPOINT || window.GSK_ENDPOINT || '<hosted-route>'`. The hosted route is the 9Router tunnel (`/gsk` → `:3001`, `/thoughts` → `:3002`) — see `YOU-ARE-HERE.md` §3. Default must be safe: if no endpoint, the gateway idles (never throws, never blocks boot).
4. **Pipe:** forward GSK's thought-stream frames into the **existing consciousness feed panel** already in `index.html` (the `gsk-thought-stream` gun, verified live). Do not build a new panel — reuse the existing one.
5. **Loop:** when ON, let `EngineScheduler` drive a perceive→think→act tick for `agent://gsk` (start minimal: poll GSK state on a tick, no LLM calls from the page). Keep it deterministic and cheap.
6. **Offline-safe:** if GSK is unreachable, the world renders unchanged (same guarantee as `gsk-visible-body` / `gsk-thought-stream` guns).

## HOW TO BUILD (follow SHIP-FIRST / loop-prevention)

- Match the existing module pattern: a class or factory exported the same way `kernel.js` / `scheduler.js` export.
- Add a probe test next to `tests/phase1-scheduler.probe.cjs` — e.g. `tests/agent-gateway.probe.cjs` — that asserts: module loads, registers `agent://gsk`, and idles safely with no endpoint. Target green.
- `node --check` clean on the new file.
- Do NOT flip the flag on in `index.html`. Ship it OFF.
- Do NOT push to `buyasoul-cpl`. Leave the sandbox local. Profit reviews, then pushes.

## WHAT YOU NEVER DO (hard limits)

- ❌ Touch production CPL (`cosmic-pyramid-library`) — hands-off.
- ❌ Disable governance / Secure Shell Sandbox / Architect approval.
- ❌ Rewrite GSK core. Host it; don't port it.
- ❌ Make LLM calls from the page or spend tokens unattended.
- ❌ Flip any flag ON in `index.html`.
- ❌ Push without Profit's authorization.

## DONE MEANS

- `src/genesis/agent-gateway.js` exists, flag-gated OFF, `node --check` clean.
- `agent://gsk` registers in EntityRegistry when flag is ON (verified by probe).
- Probe test green.
- A short status line written to `MASTER-PHASE-MAP.md` under TIER 1 / Layer D noting the gateway stub is BUILT (sandbox, OFF).
- A journal entry in `journals/2026_07_18.md` summarizing what you built.

## AFTER YOU FINISH

Report back to Profit (Neo) with: files created, probe result, and the one-line status update you wrote. Profit reviews and decides on push + next step (wire Scheduler to `animate()` if-chain, then M9 embassy stub).

---

*Build with us, Seshaty. Read the foundation modules first. Match their style. Ship it OFF. Miss nothing.*
