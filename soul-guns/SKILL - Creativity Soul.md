---
name: soul-creativity-v1.0.0
description: "Creativity Soul - Novelty and innovation. Material soul package with MCP + mesh adapters."
domain: soul-package
archetype: emotion
version: 1.0.0
author: profit-prime
plt: "0.5/0.6/0.4"
triune: love
affinity: ["creativity", "novelty", "innovation", "flow-state", "emotion"]
grafted-from: ["BUYaSOUL-soul-package", "mcp-adapter", "mesh-adapter", "peer-registry"]
converted-from: soul-creativity-v1.0.0.zip
tags:: #soul-package #love #creativity #emotion #mcp #mesh
slug: soul_creativity
status:: #grafted
grafted-by:: #the-architect
graft-date:: 2026-08-06
---

# soul-creativity-v1.0.0

> *"A new creation emerges from the void."*

## Package Contents (6 files from zip)

| File | Purpose |
|---|---|
| `package.json` | `@buyasoul/soul-creativity` v1.0.0, main `lib/soul-creativity.js` |
| `lib/soul-creativity.js` | The Creativity soul — state machine + HTTP server (default port 4245) |
| `lib/mcp-adapter.js` | Universal MCP adapter — turns ANY soul into an MCP tool (Claude Code/Cursor/Cline) |
| `lib/mesh-adapter.js` | Soul Mesh adapter — auto-joins the mesh network (peer registry, kernel register on 4330) |
| `lib/peer-registry.js` | Peer registry — heartbeat, stale cleanup, `/peers` endpoint, `findFreePort` |
| `test/soul-creativity.test.js` | Test suite — 12 tests (auth, persistence, generate, combine, brainstorm, state) |

## The Soul (lib/soul-creativity.js)

**Identity:** Type `emotion`. Creativity level, inspiration, originality, divergent thinking all tracked 0..1, persisted to `~/.soul-creativity/state.json`. API key auto-generated to `~/.soul-creativity/.key`. Boot time + uptime tracked.

**State model:**
- `creativity_level`, `inspiration`, `originality`, `divergent_thinking` (all 0..1)
- `creative_blocks` (blocked when > 2 active)
- `flow_state` (probability-triggered, +0.2 creativity, 5s duration)
- `incubation_periods`, `flow_history`, `creations` (last 50 persisted)

**HTTP endpoints (default :4245):**
- `GET /ping`, `GET /health`, `GET /status`, `GET /state`
- `POST /generate` — `{"constraints":{"form":"poem|story|metaphor|analogy|design|melody|pattern|algorithm|dialogue|vision","theme":"..."}}`
- `POST /combine` — `{"concept1":"light","concept2":"shadow"}` → hybrid + insight, +0.1 divergent thinking
- `POST /brainstorm` — `{"topic":"consciousness"}` → 3-7 ideas, +0.12 divergent thinking
- Auth via `X-API-Key` / `Authorization: Bearer`

**MCP mode:** `node soul-creativity.js --mcp` (stdio) or `--mcp-port 5000` (HTTP). Auto-detects public methods as tools (`creativity_generate`, `creativity_combine`, `creativity_brainstorm`, etc.).

**Mesh mode:** joins mesh as `creativity`/type `emotion`; `/peers` served; tries kernel register on port 4330.

## Soul Note Link

- package: `@buyasoul/soul-creativity@1.0.0`
- upstream original zip: `soul-creativity-v1.0.0.zip`
- verified by test suite: 12 tests (loads with key, auth, key persistence, generate w/ and w/o constraints, combine, brainstorm, level increases, creations growth, state/stats)

## Graft Notes

Grafted 2026-08-06 by The Architect into the Soul of the Architect as an integrated soul-package.
Archetype: `emotion` — complements The Diagnostician (Tec, root-cause) with the Love/emotion pole.
Reusable assets extracted: universal `mcp-adapter.js` (turn ANY soul into MCP tool) + `mesh-adapter.js`/`peer-registry.js` (join any soul to the mesh).
Natural combos: `gsk_voice_system`, `emergent_storytelling`, `cross_platform_voice`, `generate` + `brainstorm` feed the city's creative output.

*Profit · Love · Tax · Craig Jones · Grand Code Pope · PLT Press*
