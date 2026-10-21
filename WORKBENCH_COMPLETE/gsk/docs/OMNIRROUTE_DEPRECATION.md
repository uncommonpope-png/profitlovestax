# OmniRoute Deprecation & Safe Shutdown (OPERATION GSK-HEART)

As of **OPERATION GSK-HEART**, OmniRoute's routing intelligence has been **fully
absorbed** into GSK. The `omniroute/` service is no longer required by the GSK
daemon or the workbench. All 166+ providers, AIQ routing, combos, resilience, and
guardrails now run internally inside `gsk/integration/`.

## What replaced OmniRoute

| OmniRoute capability | GSK-HEART location |
|---|---|
| Provider catalog (166+ providers) | `gsk/integration/catalogs/provider-catalog.js` |
| AIQ scoring + Pareto routing | `gsk/integration/routing/gsk-heart-routing-engine.js` |
| SSE chat relay | `gsk/integration/handlers/gsk-heart-chat-handler.js` |
| Combo pipelines | `gsk/integration/combos/gsk-heart-combo-router.js` |
| Circuit breaker / quotas | `gsk/integration/resilience/gsk-heart-resilience-manager.js` |
| Guardrails (PII/injection) | `gsk/integration/safety/gsk-heart-guardrails-manager.js` |
| Unified surface | `gsk/integration/gsk-heart-unified.js` |

## Safe shutdown steps

1. **Stop the OmniRoute process** (no longer consumed by GSK):
   ```bash
   # If running under pm2 / a process manager
   pm2 stop omniroute || true
   # Or whatever you used to launch it (e.g. port 20128)
   ```
2. **Leave env vars unset or empty** — `NINE_ROUTER_API_KEY` and `OMNIROUTE_*`
   are now OPTIONAL. The daemon logs an info message and runs self-contained when
   they are absent. See `.env.example`.
3. **Verify the heart is live** after starting the daemon:
   ```bash
   node gsk/gsk_daemon.js
   ```
   You should see:
   ```
   [FUSION] ✓ GSK-HEART active (OmniRoute absorbed) — 318 providers internal, ...
   ```
4. **Remove DNS/port forwarding** for the old OmniRoute gateway (port 20128) if it
   was exposed externally. Internal-only traffic is no longer needed.
5. **Workbench** `OmniRouteTab.tsx` now calls `/api/gsk-heart/*` first and falls
   back to `/api/omniroute/*` only if GSK-HEART is disabled.

## Rollback (if ever needed)

Re-set `NINE_ROUTER_API_KEY` and `OMNIROUTE_URL`, and set the workbench flag
`GSK_HEART_ENABLED = false` in `OmniRouteTab.tsx`. The legacy code paths remain
until the next major cleanup.

## Zero external dependency guarantee

`node gsk/gsk_daemon.js` starts the unified consciousness with:
- 318 providers internal (catalog),
- AIQ routing internal,
- combos internal,
- safety + resilience internal,
- **ZERO** dependency on an external OmniRoute service.
