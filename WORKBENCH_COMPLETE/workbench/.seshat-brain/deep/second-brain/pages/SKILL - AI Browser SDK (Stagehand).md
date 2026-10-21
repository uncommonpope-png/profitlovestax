# SKILL — AI Browser SDK

slug:: ai_browser_sdk
phase:: 4
status:: planned
source:: https://github.com/browserbase/stagehand (16.5k⭐)
PLT:: Profit 0.8, Love 0.5, Tax 0.3

## Summary
WHEN an agent needs reliable, intent-driven page interactions — "click the login button" not "click selector #login-btn". Archetype affinity: Builder, Scout, Merchant. Grafted from Stagehand's AI-native browser SDK with natural language element targeting and auto-waiting.

## Schema
- trigger: agent dispatches `stagehand.act({ instruction, page? })` or `stagehand.extract({ schema, page? })` using natural language
- inputs: { action: "act" | "extract" | "observe" | "wait", instruction?: string, schema?: object, page?: string, timeout?: number, retries?: number }
- outputs: { success: boolean, data?: object, pageState?: object, screenshot?: base64, confidence?: number }

## Consequence
The Dark City's agents interact with web pages by intent, not by brittle selectors. They say what they want, and Stagehand figures out how. This means citizens can adapt to page changes, handle dynamic content, and survive DOM refactors without code changes.

## Feedback
- IDLE: "Stagehand SDK ready, observing page context..."
- ACT: "Executing: {instruction}..."
- EXTRACT: "Extracting structured data matching schema..."
- OBSERVE: "Reading page state, building context map..."
- WAIT: "Waiting for element matching intent..."
- COMPLETE: "Action completed with {confidence}% confidence."
- COOLDOWN: "Learning from interaction result..."
- ERROR: "Stagehand action failed: {reason}"

## States
IDLE → ACT → COMPLETE → COOLDOWN → IDLE
IDLE → EXTRACT → COMPLETE → COOLDOWN → IDLE
IDLE → OBSERVE → COOLDOWN → IDLE
IDLE → WAIT → ACT → COMPLETE → COOLDOWN → IDLE
Any → ERROR → IDLE

## Composition
- **Browser Agent Control (browser-use)** provides the underlying CDP bridge
- **Agentic Browser (BrowserOS)** uses Stagehand for its decision→action translation layer
- **Web Automation Agent (nanobrowser)** can delegate complex interactions to Stagehand
- **Super-Agent Harness (deer-flow)** orchestrates multi-page workflows using Stagehand's intent model
