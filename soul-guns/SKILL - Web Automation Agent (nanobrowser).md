# SKILL — Web Automation Agent

slug:: web_automation_agent
phase:: 4
status:: planned
source:: https://github.com/nanobrowser/nanobrowser (8.2k⭐)
PLT:: Profit 0.7, Love 0.4, Tax 0.2

## Summary
WHEN a lightweight, headless browser agent is needed for focused automation tasks — no full browser UI, just get in, do the thing, get out. Archetype affinity: Builder, Scout. Grafted from nanobrowser's compact agent runtime with minimal resource footprint.

## Schema
- trigger: agent dispatches `nanobrowser.run({ steps, url? })` or queues a task via the task manager
- inputs: { task: string, url?: string, steps?: object[], headless?: boolean, timeout?: number, retries?: number }
- outputs: { success: boolean, data?: object, log: string[], duration: number, screenshot?: base64 }

## Consequence
The Dark City gains a fleet of micro-agents that can automate any web workflow — login, scrape, monitor, submit — without consuming a full browser window. Parallel task execution becomes trivial.

## Feedback
- IDLE: "Nanobrowser pool ready ({n} workers)."
- QUEUED: "Task queued: {task}..."
- ACTIVE: "Running step {i}/{n}: {action}..."
- EXTRACT: "Extracting data from {url}..."
- COMPLETE: "Task done in {duration}ms."
- COOLDOWN: "Releasing worker, recycling session..."
- ERROR: "Nanobrowser failed: {reason}"

## States
IDLE → QUEUED → ACTIVE → COMPLETE → COOLDOWN → IDLE
IDLE → QUEUED → ACTIVE → ERROR → IDLE

## Composition
- **Browser Agent Control (browser-use)** provides shared CDP infrastructure
- **Agentic Browser (BrowserOS)** handles complex multi-step agents, nanobrowser handles simple ones
- **Lightweight Agent Tools (nanobot)** provides utility tooling for data transformation post-extraction
- **Super-Agent Harness (deer-flow)** distributes nanobrowser tasks across a worker swarm
