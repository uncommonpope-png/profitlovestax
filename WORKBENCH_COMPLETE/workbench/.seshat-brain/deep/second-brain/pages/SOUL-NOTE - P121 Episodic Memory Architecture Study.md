# SOUL-NOTE - P121 Episodic Memory Architecture Study
**Reference:** NORTH STAR ODYSSEY - LIVE 100 PHASE TRACKER.md (P121)
**Purpose:** Document the architectural patterns for implementing episodic citizen memory in GSK.
**Key Concepts:**
-   **Citizen-centric Storage:** Memory instances are tied directly to individual NPCs (citizens), enabling unique biographical timelines.
-   **Event-based Recording:** Key interactions, observations, and decisions are recorded as discrete "episodes."
-   **Contextual Recall:** NPCs retrieve memories based on current context (location, interlocutor, topic), influencing their behavior and dialogue.
-   **Decay and Salience:** Mechanisms to manage memory decay (older/less relevant memories fade) and salience (important memories are more easily recalled).
-   **Storage Layer:** Investigating lightweight, embeddable solutions like SQLite or JSON files for local persistence within the GSK daemon.

---
### Architectural Principles
1.  **Modularity:** Episodic memory should be a distinct module within GSK, loosely coupled from core consciousness.
2.  **Scalability:** Design to handle a growing number of citizens and their associated memories without performance degradation.
3.  **Real-time Impact:** Memories should influence NPC behavior in real-time, making interactions dynamic and personalized.

### Research & Grafting Targets
-   **Stanford Smallville / Generative Agents:** Study their memory stream, reflection, and planning mechanisms.
-   **Psychology of Memory:** Apply concepts like episodic vs. semantic memory, long-term potentiation, and forgetting curves.
-   **Database Patterns:** Evaluate JSON-based document stores vs. relational (SQLite) for storing episodic data.
