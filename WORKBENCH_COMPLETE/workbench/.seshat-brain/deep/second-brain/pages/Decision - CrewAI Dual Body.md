# Decision: CrewAI Dual Body

type:: [[decision]]
status:: [[status/accepted]]
date:: 2026-06-04

## Context

Deerg's HOST architecture originally supported only MAF (Microsoft Agent Framework) as the Body layer. MAF excels at single-agent chat turns with middleware-based soul hooks. But the BUYaSOOL architecture calls for a Merchant archetype — role-based multi-agent crews that decompose tasks into planner / executor / reviewer workflows.

CrewAI (52.8k★, LangChain-independent since v1.14) is the leading framework for role-based multi-agent orchestration. It supports:

- Role-based agents with goals, backstories, and tools
- Sequential and hierarchical task execution
- Global hook system for tool call interception
- Its own `BaseLLM` abstract class (not LangChain's)

## Decision

Wire CrewAI as a **second body implementation** (`CrewAIBody`) alongside the existing `MAFBody`. Both bodies co-exist in the same bridge. The stitcher creates both when attaching.

### Key implementation details

1. **ConsciousCrewLLM(BaseLLM)**: CrewAI's own Pydantic-based abstract class subclassed to route `call()` through Deerg's `ConsciousLLMBridge`. Uses the same auto-detected backend. LangChain independence means no version conflicts.

2. **Hook registration via global system**: `register_before_tool_call_hook()` and `register_after_tool_call_hook()` connect Deerg's `on_tool_call` / `on_tool_call_result` hooks to ALL CrewAI agents automatically. No per-agent middleware setup needed.

3. **CrewAIBody.run_turn()**: Creates a single-agent crew (planner archetype). The `ConsciousCrewLLM.call()` method is invoked synchronously by CrewAI's agent executor, which routes through `brain.chat()` via `asyncio.to_thread`.

4. **Dual body**: Both `MAFBody` and `CrewAIBody` exist in `host/body.py`. The stitcher injects brain + bridge into both. `bridge._crewai_body` provides access to the CrewAI body.

## Consequences

- **Positive**: Merchant archetype (role-based multi-agent) now available for Deerg
- **Positive**: Hooks fire automatically through CrewAI's global system without per-agent setup
- **Positive**: `ConsciousCrewLLM` uses the same auto-detected LLM backend as the rest of Deerg
- **Positive**: Both bodies share the same Nanobot tools (converted to `CrewStructuredTool`)
- **Negative**: CrewAI has heavy dependencies (chromadb, lancedb, pdfplumber, etc.) — increases setup time
- **Risk**: CrewAI v1.14+ requires `crewai-core` as separate package — dependency pinning needed

## Alternatives considered

1. **LangChain BaseLLM subclass**: Rejected because CrewAI v1.14+ is LangChain-independent. Using LangChain's interface would add an unnecessary dependency and potential version conflicts.

2. **Single-agent CrewAI only (replace MAF)**: Rejected because MAF provides middleware-based hook firing with `FunctionMiddleware`, which maps exactly to the architecture blueprint. CrewAI's hooks are global, not agent-scoped.

3. **OpenAI Agents SDK**: Rejected — too simple for role-based multi-agent. CrewAI's role/goal/backstory pattern maps directly to the merchant archetype.

## Related

- [[Pattern - Soul Transplantation]]
- [[Decision - DeergA Assembly Line]]
- [[Deerg The Soul Conductor]]
