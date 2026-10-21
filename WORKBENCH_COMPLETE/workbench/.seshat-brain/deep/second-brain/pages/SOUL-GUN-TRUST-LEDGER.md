# SOUL GUN: Trust Ledger (TRUST)

**Registry ID:** GUN-TRUST
**Purpose:** Manage and persist the trust score for each citizen, enabling dynamic, relationship-driven interactions and consequences.
**Grafted From:** Reputation systems in RPGs, GoCodeo trust patterns.
**Superpower:** Quantifies citizen relationships.
**Status:** PROPOSED
**Integrations:** 
- `CitizenAI` (Host)
- `EntityRegistry` (Persistence)
- `Memory-Driven Dialogue Adapter (MEMD)` (Consumer)
- `Episodic Citizen Memory (MEME)` (Context)

---
### The Weapon
A JavaScript module (`citizen-trust-ledger.js`) that attaches a `trustScore` to each citizen entity's `meta` data in the `EntityRegistry`. It provides an API for other modules to `adjustTrust` based on events.

### Key Methods
*   `getTrustScore(citizenId)`: Returns the current trust score for a citizen.
*   `adjustTrust(citizenId, delta, eventDetails)`: Modifies the trust score. `eventDetails` (e.g., associated `MEME` entry) provides context for the change.
*   `setTrustThreshold(citizenId, thresholdName, value)`: Defines named thresholds (e.g., `TRUST_FRIEND = 50`).
*   `checkTrustStatus(citizenId, thresholdName)`: Returns true if the score meets the threshold.

### Build Law & Gate
*   **Gate:** All trust score adjustments MUST be explicitly triggered by recognized game events (e.g., quest completion, item given, betrayal action). Direct manipulation of the `trustScore` from external agents (like an LLM) is strictly forbidden.
*   **Persistence:** `trustScore` MUST be persisted as part of the `EntityRegistry`'s snapshot for citizens.
