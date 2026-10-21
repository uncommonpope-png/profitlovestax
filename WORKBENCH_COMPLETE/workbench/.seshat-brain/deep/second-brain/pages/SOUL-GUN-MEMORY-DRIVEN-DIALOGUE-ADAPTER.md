# SOUL GUN: Memory-Driven Dialogue Adapter (CM-MEME)

**Registry ID:** GUN-CM-MEME
**Purpose:** Provide a standardized interface for dialogue engines (e.g., Ink.js) to query and interpret a Citizen's Episodic Memory (`MEME`) for dynamic, context-aware conversations.
**Grafted From:** Context-aware dialogue systems, LLM RAG patterns.
**Superpower:** Enables NPCs to have personalized, history-aware conversations.
**Status:** PROPOSED
**Integrations:** 
- `Episodic Citizen Memory (MEME)` (Input)
- `CitizenAI` (Host)
- `Ink.js Dialogue Engine` (Consumer)

---
### The Weapon
A lightweight JavaScript module (`citizen-dialogue-adapter.js`) that extends `CitizenAI`. It exposes methods for a dialogue engine to:
1.  **Query Episodic Memory:** Retrieve specific memories based on keywords, participants, timeframes, or sentiment.
2.  **Contextualize Memories:** Provide a summary or specific data points from `MEME` relevant to the current dialogue context.
3.  **Influence Dialogue State:** Translate memory data into parameters or flags that `Ink.js` can use to branch its narrative.

### Key Methods
*   `getRelevantMemories(citizenId, query, currentContext)`: Returns a ranked list of memories.
*   `synthesizeMemorySummary(memories, topic)`: Generates a concise summary from selected memories for injection into dialogue.
*   `updateDialogueFlags(citizenId, memories)`: Sets flags (e.g., `trust_high`, `betrayed_player`) in the dialogue engine based on memory content.

### Redbutton Gate
Dialogue engine must operate strictly on memory data provided by this adapter and cannot directly modify raw episodic memory. All modifications to memory must be proposed through `CitizenAI` and gated by `CASCADE`.
