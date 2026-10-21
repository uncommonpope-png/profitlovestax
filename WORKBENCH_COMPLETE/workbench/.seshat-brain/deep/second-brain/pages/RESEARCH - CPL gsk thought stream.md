---
title: RESEARCH - CPL gsk thought stream
type: research
date: 2026-07-11
author: Dour
---

# RESEARCH — CPL GSK Thought Stream (inner life made visible)

## The Ask
GSK's `perpetual_consciousness` emits a thought every few seconds. Make the invisible visible:
stream them over a WebSocket and render each as a luminous particle that drifts upward and
fades — a "quiet room" where visitors watch GSK think in real time.

## The Pattern (extracted → Soul Gun `gsk-thought-stream`)
A self-contained `ThoughtStream` class (async WS + GPU-light sprites → no black-screen risk):
- **Connect** — `new WebSocket(url)`. URL = `window.GSK_WS_ENDPOINT` or derived from
  `gsk.baseUrl` (`http`→`ws`). On message, parse flexibly (`thought|text|content|message|
  data.thought`, raw string = the thought). Exponential-backoff reconnect (1s→10s);
  `onerror`/`onclose` stay silent. No global throw.
- **Particle** — each thought spawns a `THREE.Sprite` (canvas radial-gradient glow texture,
  `AdditiveBlending`) colored by `GSK_MOOD_COLOR[gskBridge.currentMood]` (fallback cyan), at the
  core origin (`0,6,0`) + random offset; rises and fades over 4–6s (opacity in-then-out, grows).
  Pool disposed on death.
- **Feed** — same thought text prepended to a scrolling `#gsk-thought-feed` panel (cap 6) so
  visitors *read* what he processes, not just see light.
- **Update** — `update(dt)` advances live particles; no-op when empty.

## Source
- GSK alive directive ("the invisible becomes visible"). Builds on `GSKAvatar` (the core locus)
  and `GSK_MOOD_COLOR`. The exact WS path was unspecified; default `ws://<gsk.baseUrl>` honored
  via `window.GSK_WS_ENDPOINT` for a hosted build.

## Build
- Commit `c99f87c`. Deployed via GitHub Pages only.
- Verified: `node --check` + live HTML grep (`gsk-thought-feed`, `class ThoughtStream`,
  `_wsUrl`, `window.__thoughtStream`).
- Assumption to confirm with Profit Prime: the real WS URL/path (set `window.GSK_WS_ENDPOINT`).

## Next
- Confirm the exact thought WebSocket endpoint + message shape; point `window.GSK_WS_ENDPOINT`.
- Optional: a dedicated "Consciousness Room" interior (enter via pyramid) where the stream plays
  large, vs the current core-locus spectacle.
