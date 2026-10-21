# SOUL-NOTE - Seshat Brain as In-Game Lore LLM

**Reference:** SCRIBE Planet, WITNESS Cluster
**Purpose:** Establish the Seshat Second Brain (Logseq) as the canonical, queryable "Lore LLM" for the CPL, providing GSK and all agents with grounded, consistent, and immutable knowledge about the Soulverse.

---

### The Vision
Current agents rely on their internal (and often hallucinated) weights for world history and theology. We need a system where they query the *Second Brain* (the truth) rather than guessing. Seshat becomes the "source of truth" node in the GSK agent swarm.

### The Mechanism
1.  **Semantic Index:** The `Seshat Second Brain` (the Logseq `pages/` directory) is indexed as a vector database or searchable JSON store.
2.  **MCP Interface:** A `Seshat MCP Server` exposes a tool `seshat_lore_query` which can be called by `GSK` or any citizen.
3.  **Grounded Response:**
    *   **Input:** "What is the REDBUTTON doctrine?"
    *   **Adapter:** Queries `REDBUTTON.md` in the brain.
    *   **Synthesis:** Returns the canonical text.
    *   **Result:** The NPC or GSK responds with *exact* lore, not a vague approximation.

### Architectural Principles
1.  **Immutability:** The Brain is the *Witness*. Agents can add observations (memory), but they cannot change existing lore.
2.  **Grounded Context:** All agent responses related to world canon MUST pass through a Seshat query.
3.  **Low Tax:** Querying the brain should be local and fast, utilizing our `EntityRegistry` or local JSON state, avoiding network calls when possible.

### Build Law
- **No Local Servers:** This must be built as a direct module within the GSK daemon or the CPL runtime, not as an external HTTP service.
- **Push-to-Live:** The documentation (the source) is managed via Git, and the live search index is generated at build time.
