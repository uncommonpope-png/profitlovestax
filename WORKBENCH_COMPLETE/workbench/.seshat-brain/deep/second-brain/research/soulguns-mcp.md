type:: [[research]]
title:: soulguns-mcp — MCP Protocol Patterns
date:: [[2026_06_02]]
status:: completed
stars:: 134k+

## Repos Mined

- **modelcontextprotocol/typescript-sdk** (12.6k★) — Official TypeScript SDK v2
  - Monorepo: `@modelcontextprotocol/server`, `@modelcontextprotocol/client`
  - Middleware: `@modelcontextprotocol/express`, `@modelcontextprotocol/hono`, `@modelcontextprotocol/node`
  - Standard Schema integration (Zod v4, Valibot, ArkType)
  - Key files: `docs/server.md`, `docs/client.md`, `examples/server/`

- **PrefectHQ/fastmcp** (25.4k★) — Fast, Pythonic MCP framework
  - Decorator pattern: `@mcp.tool`, `@mcp.resource`, `@mcp.prompt`
  - Interactive apps: `@mcp.tool(app=True)`, `FastMCPApp`, `GenerativeUI`
  - Provider system for server composition
  - Key features: apps/UI (Prefab), streaming, auto-schema from type hints

- **modelcontextprotocol/servers** (86.6k★) — Reference MCP servers
  - Everything server: test harness exercising all protocol features
  - Transport dispatch pattern: CLI arg selects stdio/SSE/Streamable HTTP
  - `createServer()` returns `{ server, cleanup }` for clean lifecycle
  - Tools, resources, prompts in separate directories

- **modelcontextprotocol/inspector** (10k★) — Developer testing tool
  - UI mode + CLI mode for programmatic interaction
  - Auth: random session token, DNS rebinding protection
  - Config file support (`--config mcp.json --server myserver`)
  - Transport: stdio, SSE, Streamable HTTP

## Extract Location
- Skill: `~/.config/opencode/skills/soulguns-mcp/SKILL.md`

## Key Insight
MCP protocol has surpassed 97M monthly SDK downloads (March 2026). FastMCP powers ~70% of all MCP servers. SDK v2 is in pre-alpha with stable release targeted for Q3 2026 alongside updated MCP spec.

## Next
- soulguns-architecture: System design patterns (DDD, CQRS, event-driven, LangGraph BSP execution model)
