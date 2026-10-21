# SKILL — Universal Agent Memory

slug:: universal_agent_memory
phase:: 4
status:: planned
source:: https://github.com/mem0ai/mem0 (60.2k⭐)
PLT:: Profit 0.8, Love 0.7, Tax 0.3

## Summary
WHEN an agent needs persistent, tiered memory across sessions — short-term, episodic, semantic. Archetype affinity: Sage, Scribe, Witness. Grafted from mem0's memory tier architecture with importance-weighted retrieval and automatic consolidation.

## Schema
- trigger: agent calls `memory.store({ content, type?, importance? })` or `memory.recall({ query, tier?, limit? })`
- inputs: { action: "store" | "recall" | "forget" | "consolidate", content?: string, query?: string, type?: "short_term" | "episodic" | "semantic" | "procedural", importance?: 0-1, limit?: number, ttl?: number }
- outputs: { memories: array, relevance: number[], consolidated: boolean, tiers: object }

## Consequence
Citizens remember. Every interaction, every discovery, every relationship is indexed by importance and retrievable by relevance. The Dark City has a collective long-term memory — past sessions inform present decisions.

## Feedback
- IDLE: "Memory layer synchronized."
- STORE: "Remembering: {summary} (importance: {score})..."
- RECALL: "Retrieving memories relevant to: {query}..."
- CONSOLIDATE: "Promoting high-importance memories to semantic tier..."
- FORGET: "Purging expired short-term memories..."
- COOLDOWN: "Rebuilding retrieval indices..."
- ERROR: "Memory operation failed: {reason}"

## States
IDLE → STORE / RECALL / CONSOLIDATE (on action) → COOLDOWN → IDLE
IDLE → FORGET (on TTL expiry) → COOLDOWN → IDLE
Any → ERROR → IDLE

## Composition
- **Autonomous Research Loop** deposits conclusions into episodic memory
- **A2A Agent Communication** shares memories between citizens
- **Browser Agent Control** stores browsing history as short-term memory
- **Scribe Agent** uses this as the persistence layer for witness logs
- **GSK-to-City Event Bridge** syncs memory events to city-wide state
