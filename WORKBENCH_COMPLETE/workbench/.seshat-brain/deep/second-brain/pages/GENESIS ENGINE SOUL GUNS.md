# GENESIS ENGINE SOUL GUNS

type:: [[mission]] [[page]]
source-note:: [[SOUL-NOTE - Genesis Engine — Architecture Thesis]]
status:: 5/8 GENIE ENGINE PHASES SHIPPED ✅ — P-A, P-F, P-D live on `60e0442`; P-B live on `470472a`; P-C live on `51f3ebd`; current Genesis publish head `64dc750`
law:: Soul Notes → Soul Guns → used ON GSK/CPL → populated TO Hub
plt:: Profit + Love − Tax (every gun scored; engine becomes a downloadable product)

---

## MISSION CHARTER (Genie Engine Graft — AoE → GSK/CPL)

We are building an **8-phase Genie Engine graft** from Age of Empires (AoE) principles into GSK/CPL. This roadmap closes the **AGENTIC "real gap"** (vs wilds.ai / GoCodeo) by giving citizens independent trust, behavior, and persistence.

**Reframe (canonical):** *"CPL runs on the Genesis Engine, which uses Three.js for rendering."*

**Scope:** Full 8-Phase Genie Engine Roadmap.
**PLT:** front-and-center on every gun and every delta.

---

## GENIE ENGINE ROADMAP (8 Phases)

| Phase | Manager / Feature | Responsibility | Status |
|---|---|---|---|
| P-A | **Trust Ledger** (`trust-ledger.js`) | Per-citizen -100..+100 trust, HOSTILE/NEUTRAL/FRIEND bands, emits `trust:change`/`betrayal`. | ✅ SHIPPED (`60e0442`) |
| P-B | **Betrayal Recall** (`betrayal-recall.js`) | Specific betrayal event memory, recall dialogue, gossip, EventBridge, Immortality, FLEE/THREATEN behavior wire. | ✅ SHIPPED (`470472a`) |
| P-C | **Trust-Gated Dialogue** (`trust-dialogue.js`) | Dialogue logic influenced by Trust Ledger bands and personality tone. | ✅ SHIPPED (`51f3ebd`) |
| P-D | **Sovereign Agent FSM** (`perception_action_loop.js` + `behavior-attacher.js`) | Perceived→plan→act→react loop, behavior registry, trust-gated citizen actions. | ✅ SHIPPED (`60e0442`) |
| P-E | **Resource→World Upgrades** (`resource-upgrades.js`) | Citizen-driven world changes based on collected resources. | ⏳ OPEN |
| P-F | **Event Bridge** (`event-bridge.js`) | Always-on emit/on/once/registerTrigger spine for inter-manager communication. | ✅ SHIPPED (`60e0442`) |
| P-G | **Persistent History** (`immortality.js` / `history-manager.js`) | Hardened historical memory for agents and world state. | ⏳ OPEN |
| P-H | **Discovery/LOS** (`los-manager.js`) | Line of Sight / Fog of War for agents' perception. | ⏳ OPEN |

---

## SOUL GUNS (Forged for the Genie Engine)

| Gun | Purpose | State |
|---|---|---|
| [[SOUL-GUN - Genie Event Bridge]] | `event-bridge.js` - always-on consequence spine | FORGED ✅ (P-F `60e0442`) |
| [[SOUL-GUN - Genie Trust Ledger]] | `trust-ledger.js` - per-citizen trust, bands | FORGED ✅ (P-A `60e0442`) |
| [[SOUL-GUN - Genie Sovereign Agent FSM]] | `perception_action_loop.js` + `behavior-attacher.js` - agentic loop | FORGED ✅ (P-D `60e0442`) |
| [[SOUL-GUN - Genie Betrayal Recall]] | `betrayal-recall.js` - specific event recall + gossip + behavior dialogue | FORGED ✅ (P-B `470472a`) |
| [[SOUL-GUN - Genie Trust-Gated Dialogue]] | `trust-dialogue.js` - trust-band dialogue + personality tone | FORGED ✅ (P-C `51f3ebd`) |
| [[SOUL-GUN - Genie Resource to World Upgrades]] | `resource-upgrades.js` - economy-driven world change | TODO |
| [[SOUL-GUN - Genie Persistent History]] | `history-manager.js` - durable agent/world memory | TODO |
| [[SOUL-GUN - Genie Discovery LOS]] | `los-manager.js` - perception for agents | TODO |

> Each gun is written as a `SOUL-GUN - Genie *.md` page, then USED on `genesis-foundation/` via the phased build,
> then POPULATED to the Hub as a downloadable engine module.

---

## PHASED BUILD (Genie Engine Mission)

- **P-A Trust Ledger:** ✅ SHIPPED (`60e0442`). `src/genesis/trust-ledger.js` — per-citizen trust -100..+100, HOSTILE/NEUTRAL/FRIEND bands, emits `trust:change`/`betrayal`.
- **P-F Event Bridge:** ✅ SHIPPED (`60e0442`). `src/genesis/event-bridge.js` — always-on consequence spine.
- **P-D Sovereign Agent FSM:** ✅ SHIPPED (`60e0442`). `perception_action_loop.js` + `behavior-attacher.js` — spawns 5 visible named citizens (Allie/ARIA/Brasi/Pope/Sudo) with proxy bodies, runs perceive→plan→act→react gated by trust band. Closes "no visible bodies" + "engine-tick loop" gaps.
- **P-B Betrayal Recall:** ✅ SHIPPED (`470472a`). `src/genesis/betrayal-recall.js` — specific betrayal events, severity recall, event-type dialogue, FRIEND-band gossip, EventBridge hooks, Immortality persistence, FLEE/THREATEN behavior integration.
- **P-C Trust-Gated Dialogue:** ✅ SHIPPED (`51f3ebd`). `src/genesis/trust-dialogue.js` — trust-band dialogue with personality tone; SOCIALIZE/TRADE use trust-aware speech.
- **P-E Resource→World Upgrades:** ⏳ NEXT. Citizens drive world changes via collected resources.
- **P-G Persistent History:** ⏳ NEXT. Hardened historical memory for agents and world state.
- **P-H Discovery/LOS:** ⏳ NEXT. Line of Sight / Fog of War for agents' perception.

Each phase = scoped, reversible delta; appends a PHASE LOG to [[GENESIS-ENGINE-GAP]]; scored by PLT.

---

## PLT SCORE (mission-level, running)
- **Profit:** A complete agentic engine with persistent memory, consequence, and autonomous citizens. HIGH.
- **Love:** Citizens can form relationships (trust) and react realistically (betrayal). Immersive. HIGH.
- **Tax:** Detailed integration, dependency management. MEDIUM (mitigated by phased delivery).
- **True Value:** HIGH. The core of a living, breathing social simulation.
