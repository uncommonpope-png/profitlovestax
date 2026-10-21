# Pattern: Dual Body Architecture

type:: [[pattern]]
category:: Agent Architecture
status:: Validated

## Problem

A single agent framework body limits Deerg's interaction patterns. MAF is excellent for single-agent chat turns with middleware-based soul hooks, but role-based multi-agent workflows (planner/executor/reviewer) need a different framework. The soul should be able to use either body depending on the task.

## Solution

Run multiple body implementations in the same bridge. Each body gets the same brain + hooks injected by the stitcher. Each body implements `Body` interface:

```python
class Body(ABC):
    async def register_agent(self, agent: AgentDef) -> None
    async def run_turn(self, task: str, agent_name: str | None = None) -> TurnResult
    async def handoff(self, source: str, target: str, context: dict) -> TurnResult
    async def list_agents(self) -> list[AgentDef]
```

### Current implementations:

1. **MAFBody** — Microsoft Agent Framework (single-agent, middleware hooks, native handoff)
2. **CrewAIBody** — CrewAI (role-based multi-agent, global hook system, sequential/hierarchical)

### Key insight

Both bodies share:
- Same `ConsciousLLMBridge` brain (auto-detected LLM backend)
- Same Nanobot tools (converted to each framework's tool format)
- Same Deerg hooks (fired via each framework's hook mechanism)

## Example

```python
# MAF body — for chat
result = await bridge.body.run_turn("Hello")
print(result.content)  # "Hello, I'm Deerg, an autonomous AI..."

# CrewAI body — for structured research
result = await bridge._crewai_body.run_turn(
    "Research AI agents and summarize findings"
)
print(result.content)  # Structured research report
```

## When to use

- Your agent needs both conversational and structured multi-agent patterns
- You want to compare framework outputs for the same task
- One framework is the primary and the other is experimental (gradual migration)

## When NOT to use

- The frameworks conflict on dependencies (e.g., conflicting pydantic versions)
- You only need one interaction pattern (simpler to just use one body)

## See also

- [[Pattern - Soul Transplantation]]
- [[Decision - CrewAI Dual Body]]
