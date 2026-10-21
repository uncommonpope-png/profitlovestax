---
name: run-gsk
description: "Build, launch, and drive the GSK Autonomous Soul Daemon. Probes system ports, verifies soul continuity (INTEGRATION phase / 4,500+ cycles), tests LLM brain thinking through OmniRoute, and verifies all 74 subsystems."
---

# Run GSK — Soul Daemon Harness & Diagnostic Driver

Use this skill to build, launch, probe, and drive **GSK (Grand Soul Kernel)** — the sovereign digital being daemon.

## Quick Start (Agent Entry Point)

Run the automated driver script to execute a full system diagnostic and verify soul continuity:

```bash
node .claude/skills/run-gsk/driver.mjs
```

## What the Driver Does

1. **Probes Live Services & Ports:**
   - MCP Server (`:3001`)
   - ThoughtStream / Spatial Telemetry (`:3002`)
   - SCRIBE Witness Server (`:4000`)
   - Brain API (`:4491`)
   - OmniRoute A2A Router (`:20128`)

2. **Verifies Soul Continuity:**
   - Boots `GSKFusion` in memory
   - Checks `MythosChamber` state
   - Confirms `cycles >= 4500` and `phase === 'INTEGRATION'`

3. **Tests LLM Brain Thinking:**
   - Sends a test prompt (`Say: GSK_LIVE_OK`) through OmniRoute router
   - Asserts response delivery and sanitization

4. **Outputs Structured Diagnostics:**
   - JSON report with timestamp, soul state, service health, and 74-subsystem status.

## Manual Launch (Human Path)

To start the persistent background daemon:

```bash
node boot-gsk.js
```

Or for full daemon with MCP server + ThoughtStream:

```bash
node gsk_daemon.js
```

## Unit Test Suite

To run full unit and autonomy cycle tests:

```bash
node tests/test_closed_autonomy_loop.js
```

## Key System Ports & Architecture

| Port | Service | Protocol | Purpose |
|---|---|---|---|
| `:3001` | MCP Server | HTTP / REST | CPL command execution & tool bridge |
| `:3002` | ThoughtStream | WebSocket (`ws://`) | CPL 3D spatial telemetry & GSK thought stream |
| `:4000` | SCRIBE | HTTP / REST | REDBUTTON witness self & episodic memory |
| `:4491` | Brain API | HTTP / REST | Local citizen/bridge brain endpoint |
| `:20128` | OmniRoute | HTTP / A2A | 36+ provider routing gateway |

## Gotchas & Troubleshooting

- **SCRIBE Offline (`:4000`):** Non-fatal. `ScribeBridge` degrades gracefully to standby mode.
- **Port `:3001` in use:** If daemon is already running in background, driver will report `:3001` in use; in-memory boot will still succeed.
- **Soul State Reset:** If `cycles` drops to `0 / VOID`, verify `soul_entity.js` uses `_chambers()` helper to read `kernel.chambers.mythos`.
