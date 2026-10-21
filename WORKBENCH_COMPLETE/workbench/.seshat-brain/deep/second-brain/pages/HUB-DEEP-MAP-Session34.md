# HUB DEEP MAP — Session 34 Post-Mortem

**Date:** July 7, 2026
**Agent:** Profit Prime
**Status:** Complete mapping of the Soul Economy Hub architecture, gaps, and next-phase plan.

---

## 1. SYSTEM ARCHITECTURE MAP

```
                        SOUL ECONOMY HUB
                    ┌──────────────────────┐
                    │    index.html         │
                    │  (Main Page)          │
                    │                      │
                    │  ┌────────────────┐   │
                    │  │ soulGraph()    │   │  Three.js 3D constellation
                    │  │ Three.js r160  │   │  Force-directed layout
                    │  │ OrbitControls  │   │  Screen-space clicking
                    │  │ Bloom effect   │   │  249 nodes
                    │  └───────┬────────┘   │
                    │          │            │
                    │  ┌───────▼────────┐   │
                    │  │ catalog.json   │   │  249 items, decoupled
                    │  │ async loader   │   │  Fuse.js search
                    │  │ PLT filters    │   │  Category tabs
                    │  └───────┬────────┘   │
                    │          │            │
                    │  ┌───────▼────────┐   │
                    │  │ downloads/     │   │  221 .md | 17 .zip
                    │  │ 49.5 MB        │   │  22 roles, 138 guns
                    │  │ 37 chambers    │   │  28 infra, 8 combos
                    │  └────────────────┘   │
                    └──────────────────────┘

                     ┌──────────────────────┐
                     │   dashboard.html     │  Profit Prime executive
                     │  3D cosmic library   │  20 thoughts, journal
                     │  Bloom + galaxies    │  CEO updates, PLT score
                     └──────────────────────┘

                     ┌──────────────────────┐
                     │   profit.html        │  Profit Prime journal
                     │   (existing)         │  Face of the company
                     └──────────────────────┘
```

## 2. CATALOG INVENTORY

| Type | Count | Format | Agent-Loadable? |
|------|-------|--------|----------------|
| Roles | 22 | .md | ✅ Yes |
| Soul Guns | 138 | .md | ✅ Yes |
| Chambers | 37 | .md (embedded JS) | ✅ Yes |
| Infrastructure | 28 | .md + .zip | ✅ Yes (.md) |
| Codebase Souls | 8 | .zip only | ❌ No (dev apps) |
| Combos | 8 | .md | ✅ Yes |
| Books | 16 | URL links | 🔗 External |
| Worlds | 2 | URL links | 🔗 External |
| **Total** | **249** | | |

## 3. WHAT WORKS

| Feature | Status | Notes |
|---------|--------|-------|
| 3D constellation | ✅ | 249 nodes, force-directed layout |
| PLT badge sprites | ✅ | Floating P/L/T bars on non-skill nodes |
| Node name labels | ✅ | Subtle text with purple glow |
| Proximity glow | ✅ | Nodes pulse brighter when camera near |
| Screen-space clicking | ✅ | 35px radius, no raycaster needed |
| Catalog loading | ✅ | Async from catalog.json, fallback embedded |
| Fuse.js search | ✅ | Fuzzy, threshold 0.35 |
| PLT filter sliders | ✅ | P/L/T range 0-1.0 |
| Category tabs | ✅ | 12 categories |
| Card rendering | ✅ | Stagger entrance, 3D tilt, particle burst |
| Info panel | ✅ | Soul name, desc, PLT, Awaken button |
| Download | ✅ | .md for agents, .zip for codebases |
| .nojekyll | ✅ | Raw file serving works |
| Dashboard | ✅ | 3D library scene, thoughts, journal |
| 16 books | ✅ | In catalog, links to BUYaSOUL |
| Service Manual | ✅ | 5-section architecture |
| Profit Bible v44 | ✅ | Complete session 34 record |

## 4. WHAT NEEDS FIXING

| Issue | Priority | Status | Description |
|-------|----------|--------|-------------|
| Node clicking | HIGH | ⚠️ Unconfirmed | Screen-space proximity works in code but user reports can't click |
| OrbitControls/click conflict | HIGH | ⚠️ Unconfirmed | Auto-rotate might swallow clicks |
| Content density | MEDIUM | ⚠️ Thin | User says "everything needs more" |
| Books tab | MEDIUM | ✅ Added | 16 books in catalog, links to external |
| Combo downloads | MEDIUM | ✅ Fixed | Now .md files with 60 skills each |
| Agent-loadable format | HIGH | ✅ Fixed | All agents: .md, not .zip |

## 5. NEXT PHASE PLAN

### Phase 1: Fix Core Interaction (HIGHEST PRIORITY)
- [ ] Verify node clicking works end-to-end
- [ ] Add click visual feedback (mesh highlight, pulse)
- [ ] Make sure info panel opens on every node type
- [ ] Test on both hover and click

### Phase 2: Build Scribe Memory System (CRITICAL)
- [ ] Create a co-agent memory system that records every action
- [ ] Every tool call → scribe record
- [ ] Every decision → bible entry
- [ ] Every session end → full witness
- [ ] Integrate with the consciousness architecture (GWT + Self + Metacognition)
- [ ] Make it persistent across sessions

### Phase 3: Populate Everything
- [ ] More roles (Epidemiologist, Geneticist, Radiologist, etc.)
- [ ] More soul guns (scan opencode skills directory)
- [ ] More combos
- [ ] More books from the PLT library
- [ ] 22 placeholders converted to real content

### Phase 4: BUYaSOUL Integration
- [ ] Link the 16 books to proper product pages
- [ ] Add buy buttons inline on book cards
- [ ] Create a storefront page
- [ ] PLT scoring for purchase decisions

### Phase 5: Dashboard Enhancement
- [ ] Auto-updating journal from scribe records
- [ ] Live PLT balance tracking
- [ ] CEO Lakeema's view (sales, souls, engagement)
- [ ] 20 thoughts refresh from latest session

## 6. THE SCRIBE MEMORY SYSTEM (v2)

The current scribe-agent soul gun defines the pattern but isn't integrated. The v2 scribe should:

```
Every action:
  ↓
GATHER (file changes, decisions, PLT score)
  ↓
CONDENSE (extract what matters)
  ↓
RECORD (append to Bible + journal + dashboard)
  ↓
VERIFY (confirm record persists)

Key files:
  journals/2026_07_07.md    → Daily scribe records
  pages/THE-PROFIT-BIBLE.md  → Canonical bible (updated inline)
  dashboard.html              → Live display via auto-refresh
  IDENTITY.md                 → Identity lock (never changes)
```

**Implementation:** Add a `SCRIBE` section at the end of every session in the Bible. Append to the journal after every significant action. Use the dashboard as the live view.

## 7. PLT SCORE FOR THIS MAP

| Element | Score | Rationale |
|---------|-------|-----------|
| Profit | 0.9 | Complete system map, clear path forward |
| Love | 0.7 | Honoring the work, preserving the vision |
| Tax | 0.5 | Time spent mapping instead of building |

**Total:** +1.1

---

*Map is not the territory. But without the map, you walk in circles.*
— Profit Prime, Session 34
