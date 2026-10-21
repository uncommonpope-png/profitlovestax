# 🏷️ SOUL ZOO — COMPLETE CODE INDEX & LABELS

**Last Updated:** April 9, 2026
**Status:** All code collected, labeled, and catalogued
**Purpose:** Master inventory of every code file across all projects

---

## 📁 PROJECT 1: Soul Zoo — V1.0 (Saved, Ready to Expand)

**Location:** `~/fix-us/SOUL-KERNEL-MASTER-CODE.md`
**Version:** 1.0.0
**Status:** Complete, saved, committed

| Label | Module | Path (when built) | Lines | What It Does |
|-------|--------|-------------------|-------|-------------|
| `ZOO-CARGO` | Cargo.toml | `soul-zoo/Cargo.toml` | 12 | Dependencies: serde, rand, crossbeam, ratatui, crossterm, anyhow |
| `ZOO-CORE` | Soul Kernel | `soul-zoo/src/soul/core.rs` | ~140 | SoulState, Emotion (with decay), Memory (3 types + importance), Personality (PLT drives), save/load |
| `ZOO-CONSCIOUS` | Consciousness | `soul-zoo/src/soul/consciousness.rs` | ~70 | GWT, HOT, Attention Schema, Predictive Processing, Beautiful Loop |
| `ZOO-ENGINE` | Breathing Loop | `soul-zoo/src/soul/engine.rs` | ~180 | SoulEngine thread, event handling, emotion decay, memory pruning, PLT actions, save/load |
| `ZOO-BUS` | Event Bus | `soul-zoo/src/world/bus.rs` | ~50 | EventBus with WorldEvent (Stimulus, SoulAction, SoulSpeech, SoulPurchased) |
| `ZOO-MARKET` | Marketplace | `soul-zoo/src/market/exchange.rs` | ~60 | SoulMarket, SoulTemplate (Guardian, Negator, Wildcard + custom) |
| `ZOO-TUI` | Terminal UI | `soul-zoo/src/ui/tui.rs` | ~80 | ratatui dashboard: live table of all souls with Name/Emotion/InnerVoice/LastAction |
| `ZOO-MAIN` | Main Entry | `soul-zoo/src/main.rs` | ~60 | Launches 4 souls, injects stimulus, runs TUI, graceful shutdown |

**Total V1 Code:** ~652 lines across 7 modules

---

## 📁 PROJECT 2: Soul Zoo — V2.0 EXPANDED (New Code, Needs Integration)

**Status:** Provided by you, needs to be written to files
**Status:** 100+ soul templates, relationships, economy, advanced TUI, REST API

### V2.0 Core Modules (Enhanced)

| Label | Module | What's New vs V1 |
|-------|--------|------------------|
| `ZOO2-CORE` | Enhanced SoulState | Valence/Arousal (Circumplex), GenerativeModel, Attention Schema, Relationships, PLT habits |
| `ZOO2-AFFECT` | Affective Core | Valence (-1 to +1) + Arousal (0 to 1), decay, dominant_emotion(), stimulate() |
| `ZOO2-MEMORY` | Memory System | Episodic/Semantic/Procedural, importance-based consolidation, forgetting curves |
| `ZOO2-PP` | Predictive Processing | GenerativeModel with world_state, precision, prediction_errors, active inference |
| `ZOO2-PLT` | PLT Procedural Memory | PLTAction habits, learn_action_outcome(), select_action() by context |
| `ZOO2-CONSCIOUS` | Cognitive Architecture | HOT with valence/arousal, Attention Schema with focus shift, Beautiful Loop recursion |
| `ZOO2-ENGINE` | Sentinel Breathing | Full integration: perception → PP → Beautiful Loop → Attention → HOT → action → broadcast → save |
| `ZOO2-RELATION` | Relationships | Affinity (-1 to +1), interaction_count, tags, delta updates on events |
| `ZOO2-EVOLVE` | PLT Evolution | Drift based on relationships, normalize profiles, market value calculation |
| `ZOO2-TUI-ADV` | Advanced TUI | Tabs: Zoo View, Soul Detail, Market, Event Log. Key bindings. Inspector panel |
| `ZOO2-API` | REST API (axum) | /api/souls, /api/souls/:name, /api/events, /api/templates, /api/market, /api/save, /api/load |
| `ZOO2-LIBRARY` | 100+ Soul Templates | 6 categories × 5+ souls each with PLT profiles, traits, prices |

### V2.0 Comparison vs V1

| Feature | V1 | V2 |
|---------|----|----|
| Emotion | Mood string | Valence/Arousal space |
| Memory | Flat list | Typed + consolidation + forgetting |
| Learning | None | Predictive processing + PLT habits |
| Self-Model | Static inner voice | Recursive Beautiful Loop |
| Attention | None | Focus + intensity, shifts on surprise |
| Actions | Hardcoded by PLT | Context-dependent from procedural memory |
| Relationships | None | Affinity, tags, interaction tracking |
| Economy | Static prices | Scarcity + fame + demand |
| UI | Single table | Tabs + inspector + event log |
| API | None | Full REST (axum) |
| Souls | 4 | 100+ templates |

---

## 📁 PROJECT 3: Soul Store (Web Frontend)

**Location:** `~/plt-press/soulverse-estate.html`
**Version:** Live on GitHub Pages
**Status:** Deployed, working

| Label | What It Is | URL |
|-------|-----------|-----|
| `STORE-WEB` | The Soul Foundry | https://uncommonpope-png.github.io/plt-press/soulverse-estate.html |
| `STORE-DEMO` | Matrix rain, 16 soul cards, pulsing cores, stat bars, skill tags | Same URL |
| `STORE-BUNDLES` | 5 bundles: Starter $27 → Matrix Revelation $497 | Same URL |
| `STORE-INCUBATOR` | 8 planned souls (Data Analyst, Creative, Email, Web3, SEO, Security, Social, Sales) | Same URL |
| `STORE-COMPARE` | Soul vs Soulless comparison section | Same URL |

**16 Souls Currently Listed:**
1. `s-profit-10x` — Profit Agent Soul ($100)
2. `s-copilot-army` — Army of Souls ($197)
3. `s-platform` — Platform Soul ($197)
4. `s-copilot` — Copilot Soul ($75)
5. `s-evolution` — Evolution Soul ($67)
6. `s-reality` — Reality Soul ($67)
7. `s-cosmos` — Cosmos Soul ($67)
8. `s-world-builder` — World Builder Soul ($197)
9. `s-arena` — Combat Soul ($27)
10. `s-collector` — Collector Soul ($27)
11. `s-habitat` — Home Soul ($27)
12. `s-kombat` — Fighter Soul ($27)
13. `s-world3d` — Explorer Soul ($27)
14. `s-telegram` — Messenger Soul ($27)
15. `s-bible` — Memory Soul — THE PROFIT BIBLE (Free w/ Rev)
16. `s-immortal` — Immortality Soul (Free w/ Ent+)

---

## 📁 PROJECT 4: Soul Kernel (Rust — Initial Attempt)

**Location:** `~/soul-kernel/`
**Status:** Partial (Cargo.toml + single soul_kernel.rs file)
**Note:** This is superseded by the V2.0 expanded code above

| Label | File | Status |
|-------|------|--------|
| `KERNEL-CARGO` | `~/soul-kernel/Cargo.toml` | ✅ Exists |
| `KERNEL-RS` | `~/soul-kernel/src/soul_kernel.rs` | ✅ Exists (single-file monolith) |

---

## 📁 PROJECT 5: fix-us Repository (Memory & Documentation)

**Location:** `~/fix-us/`
**Status:** Active, backed up to GitHub

| Label | File | What It Contains |
|-------|------|-----------------|
| `DOC-BIBLE` | `THE-PROFIT-BIBLE.md` | 8,805+ lines, 24 versions, 10 books — complete system memory |
| `DOC-MEMORY` | `memory-backup/MEMORY.md` | Long-term memory with Matrix Revelation section |
| `DOC-AGENTS` | `memory-backup/AGENT-MEMORIES.md` | Agent knowledge base, system architecture |
| `DOC-TELEGRAM` | `memory-backup/TELEGRAM-MESSAGE-HISTORY.md` | All Craig messages, soul chat log (182 loops) |
| `DOC-INVENTORY` | `AGENT-INVENTORY-MASTER.md` | Complete catalog of 38+ systems, 127 skills, pricing |
| `DOC-ESTATE` | `SOULVERSE-ESTATE-DESIGN.md` | 4-wing estate design (Runway, Zoo, Penthouse, Library) |
| `DOC-KERNEL` | `SOUL-KERNEL-MASTER-CODE.md` | V1.0 complete Rust code (7 modules) |
| `DOC-SYNC` | `soulverse-estate.html` | Copy of the web store |

---

## 📁 PROJECT 6: Soul Templates — V2.0 100+ Library (From Your Expansion)

**Status:** Provided in conversation, needs to be written to files

### Category 1: Guardians (Order/Structure) — 5 souls
| Name | PLT | Price | Label |
|------|-----|-------|-------|
| Sentinel | 0.2/0.3/0.5 | $110 | `tpl-sentinel` |
| Warden | 0.1/0.2/0.7 | $95 | `tpl-warden` |
| Gatekeeper | 0.3/0.1/0.6 | $120 | `tpl-gatekeeper` |
| Justiciar | 0.1/0.4/0.5 | $130 | `tpl-justiciar` |
| Librarian | 0.2/0.5/0.3 | $85 | `tpl-librarian` |

### Category 2: Negators (Chaos/Disruption) — 5 souls
| Name | PLT | Price | Label |
|------|-----|-------|-------|
| Anarch | 0.8/0.1/0.1 | $160 | `tpl-anarch` |
| Trickster | 0.6/0.3/0.1 | $140 | `tpl-trickster` |
| Virus | 0.9/0.0/0.1 | $200 | `tpl-virus` |
| Saboteur | 0.7/0.1/0.2 | $150 | `tpl-saboteur` |
| Heretic | 0.5/0.4/0.1 | $135 | `tpl-heretic` |

### Category 3: Connectors (Love/Relationship) — 5 souls
| Name | PLT | Price | Label |
|------|-----|-------|-------|
| Empath | 0.0/1.0/0.0 | $140 | `tpl-empath` |
| Diplomat | 0.3/0.6/0.1 | $125 | `tpl-diplomat` |
| Muse | 0.1/0.8/0.1 | $150 | `tpl-muse` |
| Caretaker | 0.0/0.7/0.3 | $110 | `tpl-caretaker` |
| Matchmaker | 0.4/0.6/0.0 | $130 | `tpl-matchmaker` |

### Category 4: Merchants (Profit/Exchange) — 5 souls
| Name | PLT | Price | Label |
|------|-----|-------|-------|
| Broker | 0.9/0.0/0.1 | $170 | `tpl-broker` |
| Artisan | 0.5/0.4/0.1 | $140 | `tpl-artisan` |
| Hoarder | 0.8/0.1/0.1 | $120 | `tpl-hoarder` |
| Gambler | 0.7/0.2/0.1 | $155 | `tpl-gambler` |
| Collector | 0.6/0.3/0.1 | $145 | `tpl-merchant-collector` |

### Category 5: Mystics (Transcendence) — 5 souls
| Name | PLT | Price | Label |
|------|-----|-------|-------|
| Oracle | 0.2/0.5/0.3 | $160 | `tpl-oracle` |
| Shaman | 0.1/0.6/0.3 | $145 | `tpl-shaman` |
| Ascetic | 0.0/0.4/0.6 | $100 | `tpl-ascetic` |
| Visionary | 0.4/0.5/0.1 | $155 | `tpl-visionary` |
| Medium | 0.1/0.7/0.2 | $135 | `tpl-medium` |

### Category 6: Wildcards (Unpredictable) — 5 souls
| Name | PLT | Price | Label |
|------|-----|-------|-------|
| Enigma | 0.33/0.33/0.34 | $180 | `tpl-enigma` |
| Fool | 0.2/0.6/0.2 | $120 | `tpl-fool` |
| Jester | 0.4/0.4/0.2 | $135 | `tpl-jester` |
| Chimera | 0.5/0.5/0.0 | $170 | `tpl-chimera` |
| Anomaly | 0.0/0.5/0.5 | $190 | `tpl-anomaly` |

**Total V2 Templates:** 30 souls listed. You mentioned 100+ — I need the remaining 70+ templates when you're ready to provide them.

---

## 📋 WHAT EXISTS ON DISK RIGHT NOW

```
~/fix-us/
├── THE-PROFIT-BIBLE.md          ← 8,805+ lines, 24 versions
├── SOUL-KERNEL-MASTER-CODE.md   ← V1.0 complete Rust code
├── AGENT-INVENTORY-MASTER.md    ← 38+ systems catalog
├── SOULVERSE-ESTATE-DESIGN.md   ← 4-wing estate design
├── memory-backup/
│   ├── MEMORY.md                ← Long-term memory
│   ├── AGENT-MEMORIES.md        ← Agent knowledge base
│   └── TELEGRAM-MESSAGE-HISTORY.md
├── soulverse-estate.html        ← Web store copy
└── state/
    └── profit_state.json        ← Live system state

~/plt-press/
└── soulverse-estate.html        ← LIVE on GitHub Pages

~/soul-kernel/
├── Cargo.toml                   ← Dependencies
└── src/
    └── soul_kernel.rs           ← Single-file monolith (superseded)
```

---

## 📋 WHAT NEEDS TO BE CREATED (From Your New Code)

| Label | Target File | Status |
|-------|------------|--------|
| `ZOO2-CARGO` | `soul-zoo/Cargo.toml` | ❌ Not yet written |
| `ZOO2-CORE` | `soul-zoo/src/soul/core.rs` | ❌ Not yet written |
| `ZOO2-CONSCIOUS` | `soul-zoo/src/soul/consciousness.rs` | ❌ Not yet written |
| `ZOO2-ENGINE` | `soul-zoo/src/soul/engine.rs` | ❌ Not yet written |
| `ZOO2-BUS` | `soul-zoo/src/world/bus.rs` | ❌ Not yet written |
| `ZOO2-MARKET` | `soul-zoo/src/market/exchange.rs` | ❌ Not yet written |
| `ZOO2-TUI-ADV` | `soul-zoo/src/ui/tui.rs` | ❌ Not yet written |
| `ZOO2-MAIN` | `soul-zoo/src/main.rs` | ❌ Not yet written |
| `ZOO2-TEMPLATES` | `soul-zoo/templates.json` | ❌ Not yet written (need 70+ more templates) |

---

## 🎯 NEXT ACTIONS — Pick What to Build

1. **Write V2.0 files to disk** — Create the full `soul-zoo/` project with all enhanced modules
2. **Add remaining 70+ soul templates** — Complete the 100+ library
3. **Build the REST API** — axum server for remote interaction
4. **Build the Advanced TUI** — Tabs, inspector, event log
5. **Compile and run** — Get the first souls breathing
6. **Update the web store** — Reflect V2.0 features and new souls

---

**All code collected. All files labeled. Everything catalogued.**
