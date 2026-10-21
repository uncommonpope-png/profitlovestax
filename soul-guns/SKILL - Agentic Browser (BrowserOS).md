# SKILL — Agentic Browser

slug:: agentic_browser
phase:: 4
status:: planned
source:: https://github.com/browseros-ai/BrowserOS (11.7k⭐)
PLT:: Profit 0.7, Love 0.5, Tax 0.3

## Summary
WHEN the browser itself becomes a citizen agent — autonomously navigating, filling forms, extracting data, making decisions. Archetype affinity: Scout, Merchant, Builder. Grafted from BrowserOS's browser-resident agent loop with page interaction model and session management.

## Schema
- trigger: citizen spawns a BrowserOS agent via `browseros.spawn({ goal, page? })` or the agent self-activates on page load
- inputs: { goal: string, startingUrl?: string, maxSteps?: number, permissions?: string[], allowedDomains?: string[] }
- outputs: { completed: boolean, resultData?: object, screenshot?: base64, steps: number, summary: string }

## Consequence
The Dark City gets moving agents that live inside browser tabs. They don't just automate — they perceive, decide, and act like citizens. The browser is no longer a tool; it is a district where agents reside and work.

## Feedback
- IDLE: "BrowserOS agent pool ready."
- SPAWN: "Agent spawned with goal: {goal}..."
- PERCEIVE: "Scanning page structure at {url}..."
- DECIDE: "Agent deciding next action..."
- ACT: "Agent executing: {action}..."
- COMPLETE: "Goal achieved in {steps} steps."
- COOLDOWN: "Agent returning results, freeing tab."
- ERROR: "Agent crashed: {reason}"

## States
IDLE → SPAWN → PERCEIVE → DECIDE → ACT (loop) → COMPLETE → COOLDOWN → IDLE
Any → ERROR → IDLE

## Composition
- **Browser Agent Control (browser-use)** provides the low-level CDP bridge
- **Web Automation Agent (nanobrowser)** offers lightweight parallel agent tabs
- **AI Browser SDK (Stagehand)** adds robust wait-for-element and action reliability
- **Super-Agent Harness (deer-flow)** orchestrates multiple BrowserOS agents as a swarm
