# Soulguns TypeScript Skill — Research Report

**Date:** June 2, 2026  
**Executor:** Profit Prime  
**Status:** Complete

## Method
1. Searched GitHub for top TypeScript repos by stars (+ architecture-focused)
2. Selected 5 repos covering different domains (editor, framework, compiler, workflow engine, web framework)
3. Read source code via GitHub API / repo browsing
4. Extracted patterns per category
5. Synthesized into formal SKILL.md in `.config/opencode/skills/soulguns-ts/`

## Repos Analyzed
| Repo | Stars | Domain | Key Learning |
|------|-------|--------|-------------|
| microsoft/vscode | 167k | Editor | Layered monolith, custom DI, Event<fn>, Proxy IPC |
| vercel/next.js | 139k | Web framework | Error handling, config split, monorepo tooling |
| microsoft/TypeScript | 108k | Compiler | Pipeline, bitflags, branded primitives, perf instrumentation |
| nestjs/nest | 75k | Framework | Decorator metadata, DI, observable pipeline |
| n8n-io/n8n | 59k | Automation | Workflow engine, Result<T,E> type, error hierarchy |

## Pattern Count: 12 categories, 30+ code examples

## File Created
`C:\Users\uncom\.config\opencode\skills\soulguns-ts\SKILL.md`

## Next Research Sessions Planned
- `soulguns-agent-patterns` — Agent orchestration frameworks (LangChain, AutoGen, CrewAI, etc.)
- `soulguns-mcp` — MCP protocol implementations
- `soulguns-architecture` — System design patterns (DDD, CQRS, event-driven)
