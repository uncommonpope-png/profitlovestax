# SOUL-NOTE - Interaction Mechanics: The Trust Ledger

**Reference:** CITIZENS Planet, PERSISTENCE Cluster
**Purpose:** To define the formal system for tracking player-citizen trust relationships, driving NPC behavior, dialogue, and world-state consequences.

---
### The Void: Generic Relationships
Currently, citizens have a static, binary interaction state. They lack a meaningful, evolving relationship with the player. Trust is the mechanism that binds interactions to consequences.

### The Mechanics: The Trust Ledger
The `TRUST` ledger is a per-citizen, persistent metric (`-100` to `+100`) that tracks the quality of the relationship.

**Rules:**
1.  **Events Drive Score:** Specific player actions (interactions, favors, betrayals) trigger atomic updates to the `trustScore`.
2.  **State-Gating:** Dialogue and quests are gated by `trustScore` thresholds (e.g., `TRUST_FRIEND`, `TRUST_NEUTRAL`, `TRUST_HOSTILE`).
3.  **Persistence:** The `trustScore` is serialized into the citizen’s meta-data (`EntityRegistry`), ensuring relationship state persists across sessions (P24).

### Synergy (The Combo)
*   **+MEME (Memory):** Memories *justify* the score. (e.g., "I trust him because he helped me with task X").
*   **+MEMD (Dialogue Adapter):** Dialogue engines *query* the `TRUST` ledger to branch conversations.

---
### PLT Impact
*   **Profit:** Adds replayability and depth; high-trust relationships unlock unique quests and resources.
*   **Love:** Creates genuine emotional stakes for the player—betraying an NPC has real, lasting consequences.
*   **Tax:** Requires disciplined event-tracking and careful balancing of the `trustScore` impact for every action.
