# Soulguns Agent Patterns — Research Report

**Date:** June 2, 2026  
**Executor:** Profit Prime  
**Status:** Complete

## Method
- Selected 6 top agent frameworks by stars and architectural significance
- Read source code for agent definitions, tool systems, handoff patterns, state management
- Extracted cross-framework patterns
- Synthesized into formal SKILL.md

## Repos Analyzed
| Repo | Stars | Domain | Key Learning |
|------|-------|--------|-------------|
| langchain-ai/langchain | 138k | Agent framework | Middleware system, tool patterns, LCEL, callbacks |
| microsoft/autogen | 58k | Multi-agent | Agent protocol, group chat, Swarm, publish/subscribe |
| crewAIInc/crewAI | 52k | Agent framework | Role-based agents, task chaining, delegation, hierarchical |
| langchain-ai/langgraph | 33k | Graph execution | StateGraph, BSP model, checkpointing, interrupts |
| openai/openai-agents-python | 26k | Agent SDK | Handoffs, guardrails, tracing, sessions |
| openai/swarm | 21k | Lightweight | Function-return handoff, minimal runtime |

## Pattern Count: 12 categories

## File Created
`C:\Users\uncom\.config\opencode\skills\soulguns-agent-patterns\SKILL.md`

## Cross-Cutting Insights for BUYaSOUL
- Agent-as-graph (LangGraph) is the most powerful pattern — BUYaSOUL souls should use graph-based execution
- Middleware pattern (LangChain) enables composable behavior — perfect for PLT scoring integration
- Handoff pattern (OpenAI SDK, AutoGen Swarm) maps to soul-to-soul communication in telephone network
- Checkpointing (LangGraph) enables persistence — maps to SCRIBE witness
- Guardrail pattern maps to BUYaSOUL's governance proxy

## Next Session
`soulguns-mcp` — MCP protocol implementations and tool design patterns
