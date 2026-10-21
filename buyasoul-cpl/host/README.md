# Genesis Buyer Host Runtime

Minimal dependency-free host for Wallmeria product profiles.

## Routes
- `/genesis-runtime.js` — public config script loaded before `cpl-config.js`
- `/genesis-runtime.json` — public manifest JSON
- `/mcp/health`, `/mcp/status`, `/mcp/execute`, `/mcp/memories`, `/mcp/spawn`
- `/thoughts` — WebSocket thought stream placeholder, no fake insight
- `/sanctum` — WebSocket lobby/presence route

## Environment
- `PORT=8080`
- `GENESIS_PUBLIC_BASE_URL=https://your-host.example`
- `GENESIS_TOKEN=<buyer secret>` — required for MCP/WS routes
- `GENESIS_PROFILE=docker|vps|relay|desktop`

The runtime never depends on Craig's PC. Auth is required by default; do not ship `noAuth`.
