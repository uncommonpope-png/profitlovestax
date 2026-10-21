# SOUL-GUN: Seshat Lore Query Interface (SLQI)

**Registry ID:** GUN-SLQI
**Purpose:** Enable GSK and other agents to query the `Seshat Second Brain` for canonical lore, philosophy (REDBUTTON), and architecture documentation, eliminating hallucination.
**Grafted From:** RAG (Retrieval-Augmented Generation) patterns.
**Superpower:** Grounded, canonical world knowledge for agents.
**Status:** PROPOSED
**Integrations:** 
- `Seshat Second Brain` (Data Source)
- `GSK daemon` (Consumer)

---
### The Weapon
A lightweight MCP tool (`seshat_lore_query`) that enables any agent within the GSK ecosystem to search the Second Brain's markdown pages and return accurate, context-aware information.

### Key Methods
*   `queryLore(query, options)`: Performs a semantic search across the `pages/` directory.
*   `fetchCanonicalPage(pageTitle)`: Returns the raw text of a specific bible page (e.g., `THE-PROFIT-BIBLE`).
*   `getLivingState()`: Returns the current canonical state from `YOU-ARE-HERE.md`.

### Build Law & Gate
*   **Gate:** Any response returned by the `Seshat Lore Query Interface` is considered *absolute truth* for the engine. No agent may override this lore during a response; if the agent disagrees, it must propose an update via the `CRITIC` gate.
*   **Performance:** All queries must be performed via local file-system access (within the GSK daemon context), not network calls.
