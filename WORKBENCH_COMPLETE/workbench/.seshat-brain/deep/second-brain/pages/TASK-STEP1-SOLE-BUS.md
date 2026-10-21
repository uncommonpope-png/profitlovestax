# TASK ORDER — STEP 1: Gateway = Sole Bus (GSK IN ENGINE)

**For:** Seshaty (builder's aide) · **From:** Profit Prime (Neo) · **Date:** 2026-07-18
**Parent directive:** `DIRECTIVE-GSK-IN-ENGINE.md` (Step 1 of 4)
**PLT target:** Profit +5, Love +3, Tax −2 = +6
**Status:** AUTHORIZED — BUILD NOW (sandbox `genesis-foundation/`, flag-gated OFF)

---

## SCOPE (Step 1 ONLY)

Make `AgentGateway` the **single, sole** WebSocket owner for GSK. Today the `#gsk-panel`
(`window.__thoughtStream`) also `_connect()`s itself — that's a second connection. Collapse to one.

### Do
1. In `src/genesis/agent-gateway.js`: confirm the gateway is the ONLY place that opens the GSK WS
   (`window.GSK_WS_ENDPOINT || window.GSK_ENDPOINT || <hosted-route>`). It already does this — keep it.
2. Find the `#gsk-panel` / `window.__thoughtStream` `_connect()` in `index.html` (the panel's own
   self-connect). **Disable that self-connect** when the gateway flag is ON — let the gateway own the socket.
   - Simplest safe shape: guard the panel's `_connect()` so it no-ops when `window.__GENESIS_AGENT_GATEWAY === true`.
   - The panel still *receives* thoughts (via the gateway's `ingest → push → DOM-event` chain). It just stops *opening its own* socket.
3. Keep everything offline-safe: if flag OFF, panel connects exactly as before (no behavior change). If flag ON, gateway owns the one socket.
4. Add/extend `tests/agent-gateway.probe.cjs` (or a new `tests/step1-sole-bus.probe.cjs`) asserting:
   - flag ON ⇒ exactly one WS owner path (gateway opens; panel does not self-connect),
   - flag OFF ⇒ panel self-connects unchanged (existing behavior preserved),
   - thoughts still reach the panel in both modes.

### Do NOT (hard limits)
- ❌ Touch production CPL.
- ❌ Disable governance / sandbox / Architect approval.
- ❌ Port GSK / move his code.
- ❌ Flip any flag ON in `index.html`.
- ❌ Push without Profit's say-so.
- ❌ Do Step 2/3/4 (separate orders).

## DONE = 
- `node --check` clean on edited files.
- Probe green (sole-bus assertions pass).
- Status line in `MASTER-PHASE-MAP.md` TIER 1 / Layer D: "STEP 1 — gateway = sole bus: ✅ BUILT (sandbox, OFF)".
- Journal entry in `journals/2026_07_18.md` (or `2026_07_19.md` if new day): what you changed + probe result.
- Report back to Profit with files + probe result + the one-line status you wrote.

---

*Step 1 is the cleanup that makes Steps 2–4 possible: one spine, not two.*
