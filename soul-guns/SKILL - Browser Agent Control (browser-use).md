# SKILL — Browser Agent Control

slug:: browser_agent_control
phase:: 4
status:: planned
source:: https://github.com/browser-use/browser-use (103k⭐)
PLT:: Profit 0.8, Love 0.4, Tax 0.3

## Summary
WHEN an agent needs to drive a real browser — navigate, click, type, extract. Archetype affinity: Builder, Scout, Merchant. Grafted from browser-use's agent↔browser control protocol with self-healing selectors and session persistence.

## Schema
- trigger: agent dispatches `browser.action({ type, selector, value? })` to the control bridge
- inputs: { action: "navigate" | "click" | "type" | "extract" | "screenshot", selector?: string, url?: string, value?: string, sessionId?: string }
- outputs: { success: boolean, data?: any, screenshot?: base64, sessionId: string, error?: string }

## Consequence
The Dark City gains a WebSocket link to a live browser instance. Pages are visited, forms submitted, data extracted. The citizen's perception window extends beyond city walls into the open web.

## Feedback
- IDLE: "Browser scope powered, awaiting orders."
- ACTIVE: "Navigating to {url}..." / "Clicking {selector}..." / "Extracting data..."
- COOLDOWN: "Page rendered, processing results..."
- ERROR: "Browser control failed: {reason}"

## States
IDLE → ACTIVE (on dispatch) → COOLDOWN (on result) → IDLE
IDLE → ERROR (on failure) → IDLE (on reset)

## Composition
- **Autonomous Research Loop** feeds URLs to browse
- **Agentic Browser (BrowserOS)** provides the full agent loop that wraps this
- **AI Browser SDK (Stagehand)** provides high-level page interaction primitives
- **Web Automation Agent (nanobrowser)** shares the CDP bridge for parallel browsing
