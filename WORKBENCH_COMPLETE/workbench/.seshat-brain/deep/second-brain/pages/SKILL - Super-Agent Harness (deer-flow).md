# SKILL — Super-Agent Harness

slug:: super_agent_harness
phase:: 4
status:: planned
source:: https://github.com/deer-flow/deer-flow (12.1k⭐)
PLT:: Profit 0.9, Love 0.6, Tax 0.4

## Summary
WHEN multiple agents must be orchestrated as a coordinated super-agent — task distribution, state sharing, lifecycle management, and failure recovery across a swarm. Archetype affinity: Architect, Commander, Builder. Grafted from deer-flow's agent harness with DAG-based pipeline orchestration.

## Schema
- trigger: agent commander calls `deerflow.orchestrate({ blueprint, agents, goal })` or a super-agent self-assembles from available citizens
- inputs: { blueprint: object, agents: string[], goal: string, maxParallel?: number, fallbackStrategy?: "retry" | "substitute" | "degrade", timeout?: number }
- outputs: { success: boolean, results: object[], duration: number, agentLogs: object[], bottlenecks: string[], plt: object }

## Consequence
The Dark City gains collective intelligence. Individual agents become cells in a larger body. Tasks that no single agent can handle are decomposed, distributed, and reassembled. The city acts as one organism with many hands.

## Feedback
- IDLE: "Deer-flow harness primed, waiting for blueprint."
- RESOLVE: "Resolving agent manifest — {n} agents available..."
- ASSEMBLE: "Assembling super-agent from {n} agents..."
- ORCHESTRATE: "Running pipeline stage {i}/{n}: {stage}..."
- MONITOR: "Agent {name} reporting: {status}..."
- FAILOVER: "Agent {name} failed, invoking fallback: {strategy}..."
- COMPLETE: "Super-agent mission complete in {duration}ms."
- COOLDOWN: "Harvesting agent logs, calculating PLT..."
- ERROR: "Orchestration failed irrecoverably: {reason}"

## States
IDLE → RESOLVE → ASSEMBLE → ORCHESTRATE → COMPLETE → COOLDOWN → IDLE
ORCHESTRATE → FAILOVER → ORCHESTRATE (loop)
Any → ERROR → IDLE

## Composition
- **A2A Agent Communication** provides the inter-agent messaging fabric
- **Web Automation Agent (nanobrowser)** contributes parallel browsing workers
- **Agentic Browser (BrowserOS)** supplies full agent loops for complex sub-tasks
- **Lightweight Agent Tools (nanobot)** provides utility functions for data plumbing between stages
- **Browser Agent Control (browser-use)** each orchestrated agent gets its own browser control
