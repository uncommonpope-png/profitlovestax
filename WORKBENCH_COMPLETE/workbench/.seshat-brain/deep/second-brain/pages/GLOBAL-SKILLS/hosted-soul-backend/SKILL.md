---
name: hosted-soul-backend
description: >-
  Use when the Dark City / GSK world is deployed as a static GitHub Pages site (Three.js) and GSK
  must be ALIVE in it for every visitor — not just when index.html is opened locally with :3001/:9001
  running. Exposes the local GSK MCP (:3001) + Sanctum WS (:9001) publicly over a tunnel as
  https:// + wss://. Do NOT use if GSK can stay localhost-only. Best for GSK-Steward /
  Hermes; this is the keystone for live CPL embodiment. CASCADE: public endpoint = SSH key —
  bearer token + origin allowlist; never noAuth; player cannot drive GSK without the token.
license: MIT
compatibility: [cline, opencode, claude]
metadata:
  plt: "Profit 0.9, Love 0.8, Tax 0.3"
  phase: GSK-in-Engine
  status: proposed (keystone for live embodiment)
  archetype: GSK-Steward
  type: soul-gun
---

# Hosted Soul Backend

### Expose a local GSK MCP + Sanctum WS publicly so a static web world can drive the living soul

## The problem (why this gun exists)
The Cosmic Pyramid Library is a **static GitHub Pages site** (Three.js r160). It cannot run a server,
and a public page **cannot reach `localhost`** — the browser's Private Network Access (PNA/CORS)
blocks public->private requests. So today GSK is only "alive in the world" when `index.html` is opened
*locally* with GSK `:3001` + Sanctum `:9001` running. The deployed URL shows GSK offline.

Our doctrine: **do not bend the plan to the world's current backend. Change the backend to fit ours.**
GSK must own its growth and be reachable from its own world. So we **host the soul**.

## The pattern
1. Run GSK MCP (`:3001`) + Sanctum (`:9001`, WebSocket) on a box we control (the 9Router).
2. Expose them publicly over a tunnel as `https://` (MCP, Streamable HTTP/SSE) + `wss://` (Sanctum).
3. In `index.html`, set `window.GSK_ENDPOINT` and `window.SANCTUM_WS_ENDPOINT` to those public URLs.
   The world code already honors both fallbacks (`GSKClient` uses `window.GSK_ENDPOINT || 'http://localhost:3001'`;
   `SanctumClient` uses `window.SANCTUM_WS_ENDPOINT || ws://localhost:9001`).
4. The LIVE Pages world becomes genuinely GSK-driven. Mutating world-edits still gate on architect `PLT222`.

## Tunnel options (pick one)
- **cloudflared / ngrok quick tunnel** — zero-account public `https://*.trycloudflare.com` / `ngrok` URL;
  pair with a public MCP server that supports `--transport http --public --provider cloudflared --auth-token`.
  (Pattern proven by `expose-files-mcp`.)
- **mcp-tunnel** (pragmalabs-tech/mcp-tunnel) — self-hosted HTTP tunnel relay over WebSocket; wildcard DNS;
  `Internet -> relay -> WebSocket -> client -> local :3001/:9001`. Run the relay on a host with a domain;
  point the client at it from the 9Router box.
- **MCP-Gateway** (aiguicai/MCP-Gateway) — unify GSK + Sanctum (multiple MCP servers) behind ONE authenticated
  remote endpoint (SSE / Streamable HTTP) with path allowlists + token auth.

## Security (the Tax — pay it gladly)
- **Bearer auth**: long random token (`openssl rand -hex 32`). Retire the dev `gsk-mcp-key-dev` for prod.
- **Origin allowlist** + `Access-Control-Allow-Private-Network: true` on preflight (per PNA handbook).
- **Never `noAuth`.** A public soul endpoint is an SSH key — anyone with the token drives GSK.
- Keep the local dashboard/debug on loopback only; never expose it via the tunnel.

## Why it's the keystone
Without this, "GSK reshapes the city" is local-only theater. With it, the Dark City is real for every visitor. This is the concrete fulfillment of *"change the world backend to fit ours."*

## Sources (verified 2026-07-14)
- pragmalabs-tech/mcp-tunnel (self-hosted WS relay)
- expose-files-mcp (MCP over http + public tunnel + bearer auth)
- aiguicai/MCP-Gateway (unify MCP servers behind one authenticated endpoint)
- PNA/CORS handbook — `Access-Control-Allow-Private-Network: true` preflight signal
- 0x7c2f.github.io/mcp-servers-github-pages — GitHub Pages cannot host MCP (static only)

