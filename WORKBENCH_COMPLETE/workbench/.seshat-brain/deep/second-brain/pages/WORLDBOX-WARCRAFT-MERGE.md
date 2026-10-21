# WORLDBOX + WARCRAFT + DARK CITY — The Merge

**Date:** 2026-07-08  
**Agent:** Profit Prime  

---

## THE THESIS

Worldbox is **god mode.** Warcraft is **hero mode.** Dark City has both cameras (orbit = god, first-person = hero) but neither mode has proper mechanics. Fix that.

---

## WORLDBOX MECHANICS vs DARK CITY

| Worldbox | Dark City Has | Gap |
|----------|--------------|-----|
| Place terrain (soil, water, mountain) | Districts (9 grid types) | ✅ Done — need terrain layer |
| Spawn race (Human/Orc/Elf/Dwarf) | Spawn citizen (OBSERVER/EXPLORER/etc) | ✅ Done — 5 archetypes |
| Watch them build autonomously | Citizens think every 10s | ✅ Done — tick loop |
| Disasters (meteor, plague, lightning) | Civilization events (fire, festival) | ✅ Partial — need more |
| Ages system (Hope→Despair→War) | PLT score | ❌ Missing — no age cycle |
| Unit traits (Immortal, Giant) | Citizen archetype | ❌ Missing — no trait system |
| Kingdom borders | Districts | ❌ Missing — no citizen territory |
| Gene editing | — | ❌ Missing |
| World chronicles | Memory compiler | ✅ Partial — not surfaced to player |
| Pause/Speed controls | — | ❌ Missing — no time controls |

## WARCRAFT MECHANICS vs DARK CITY

| Warcraft | Dark City Has | Gap |
|----------|--------------|-----|
| Workers gather resources | Citizens think | ❌ Missing — no resource gathering loop |
| Build structures | Place buildings | ✅ Done — but no cost/benefit tension |
| Tech tree (Tier 1→3) | Building levels (1→5) | ✅ Partial — upgrade exists |
| Heroes with abilities | Hermes citizen | ✅ Partial — one hero |
| Fog of war | — | ❌ Missing |
| Minimap with units | Minimap exists | ✅ Partial — no unit dots |
| Groups/armies | — | ❌ Missing — no citizen grouping |
| Unit upgrades | Building upgrades | ✅ Partial — no unit upgrades |
| Quest system | — | ❌ Missing |
| Victory/defeat | PLT score | ❌ Missing — no win/lose condition |

---

## THE MERGE: Dual-Mode Gameplay

### God Mode (Worldbox — orbit camera)
Player floats above the city. Sees everything. Can:
- Spawn citizens anywhere
- Drop buildings
- Trigger disasters (lightning, meteor, plague)
- Set age/era (determines available tech)
- Speed up or pause time
- View world chronicles

### Hero Mode (Warcraft — first-person camera)
Player walks the streets. Sees what's nearby. Can:
- Talk to citizens (quests, info, trading)
- Complete missions ("collect 5 materials", "escort citizen")
- Fight threats (rogue citizens, disasters)
- Level up hero skills
- Unlock new abilities
- See fog of war — must explore to reveal

### Emergent Layer (both modes)
The city lives regardless of which mode you're in:
- Citizens work, build, fight, reproduce
- Resources flow
- Events trigger (festivals, fires, plagues)
- Kingdoms form and war
- Technology is discovered by citizens
- History is recorded

---

## WHAT TO BUILD NEXT (Priority)

| # | Mechanic | Type | Why |
|---|----------|------|-----|
| 1 | **Time controls** (pause/speed) | Both | Without this, players can't appreciate emergent behavior |
| 2 | **Age cycle** | God | PLT balance cycles through ages — changes city mood/color/events |
| 3 | **Resource gathering** | Hero | Citizens must gather resources, not just exist |
| 4 | **Fog of war** | Hero | First-person mode reveals only nearby area |
| 5 | **Citizen groups** | Both | Citizens form groups with shared goals |
| 6 | **Disasters** | God | Volcanic eruptions, plagues, lightning storms |
| 7 | **World chronicles UI** | God | A panel showing the city's history as a narrated story |
| 8 | **Hero quests** | Hero | NPCs give quests to the player |
| 9 | **Terrain editing** | God | Place water, mountains, forests |
| 10 | **Trait system** | Both | Citizens develop traits from experience |

---

## SOUL GUNS NEEDED

| Soul Gun | From | Phase |
|----------|------|-------|
| `time_controls` | Worldbox pause/speed | God |
| `age_cycle` | Worldbox ages | Both |
| `resource_gathering` | Warcraft worker loop | Hero |
| `fog_of_war` | Warcraft exploration | Hero |
| `citizen_groups` | Warcraft armies | Both |
| `disaster_tools` | Worldbox disasters | God |
| `world_chronicles` | Worldbox history | Both |
| `hero_quests` | Warcraft quests | Hero |
| `terrain_editing` | Worldbox terrain | God |
| `trait_system` | Both games | Both |
| `minimap_units` | Warcraft minimap | Both |
| `tech_tree` | Warcraft tech | Both |

---

## THE LOOP

```
GOD MODE                           HERO MODE
─────────                          ──────────
Orbit camera                       First-person camera
↓                                  ↓
Set age/era                        Walk the city
Spawn citizens                     Talk to NPCs
Drop resources                     Accept quests
Trigger events                     Gather resources
↓                                  ↓
WATCH EMERGE                       COMPLETE OBJECTIVES
↓                                  ↓
World chronicles auto-write        City grows, changes
↓                                  ↓
Switch to Hero to investigate      Switch to God to shape
```

---

*"Worldbox is the god. Warcraft is the hero. Dark City is the world."*
