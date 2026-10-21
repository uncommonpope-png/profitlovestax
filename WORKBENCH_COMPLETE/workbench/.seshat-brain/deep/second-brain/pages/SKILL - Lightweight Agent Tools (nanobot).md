# SKILL — Lightweight Agent Tools

slug:: lightweight_agent_tools
phase:: 4
status:: planned
source:: https://github.com/nanobots-ai/nanobot (5.4k⭐)
PLT:: Profit 0.6, Love 0.5, Tax 0.2

## Summary
WHEN an agent needs small, focused utility tools — no heavy frameworks, just single-purpose functions for transforming data, formatting output, reading files, or making simple API calls. Archetype affinity: Builder, Merchant, Scribe.

## Schema
- trigger: agent invokes `nanobot.tool({ name, params })` or the tool dispatcher auto-resolves the best nanobot for a task
- inputs: { tool: string, params: object, context?: object, mode?: "sync" | "stream" }
- outputs: { result: any, toolName: string, duration: number, error?: string }

## Consequence
The Dark City's toolbelt expands without bloat. Every nanobot is a single-file, single-responsibility tool that any citizen can discover and invoke. The city becomes a composable toolkit — build complex pipelines from simple parts.

## Feedback
- IDLE: "Nanobot tool rack loaded ({n} tools)."
- DISPATCH: "Resolving tool: {tool}..."
- ACTIVE: "Running {tool} with params: {params}..."
- STREAM: "Streaming {tool} output..."
- COMPLETE: "Tool {tool} returned result."
- COOLDOWN: "Recycling tool worker..."
- ERROR: "Tool {tool} failed: {reason}"

## States
IDLE → DISPATCH → ACTIVE → COMPLETE → COOLDOWN → IDLE
IDLE → DISPATCH → ACTIVE → STREAM → COMPLETE → COOLDOWN → IDLE
Any → ERROR → IDLE

## Composition
- **Web Automation Agent (nanobrowser)** extracts data, this transforms it
- **Super-Agent Harness (deer-flow)** orchestrates tool pipelines across multiple nanobots
- **Code Generation and Refinement** generates new nanobot tools on demand
- **Universal Agent Memory (mem0)** caches tool outputs for reuse
