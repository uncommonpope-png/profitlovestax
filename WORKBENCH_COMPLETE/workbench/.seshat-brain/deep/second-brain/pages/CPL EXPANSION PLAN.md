---
title: CPL EXPANSION PLAN — Many Worlds from One
type: decision
date: 2026-07-11
author: Dour
status: DRAFT — awaiting Pope confirmation
---

# CPL EXPANSION PLAN — Many Worlds from One Cathedral

> The Cathedral is alive (Gap 1-3 + thought stream shipped). Now we expand: every downloaded
> asset becomes its own experience. This is the bigger role. Plan first, build after sign-off.

## 0. The Asset Vault (what we actually have)
Scouted read-only across `C:\Users\uncom\Desktop`. Code-soul zips (`soul-*.zip`) excluded.
Highlights (full paths in `CPL ASSET MAP.md`):

**Crown jewels (the natural "own experience" seeds)**
- `cosmic-pyramid-library/assets/world/world.glb` — 66 MB — the cosmic pyramid world (SPACE/HEAVEN anchor)
- `cosmic-pyramid-library/assets/angel/angel.glb` — 4.97 MB — the HEAVEN anchor
- `cosmic-pyramid-library/assets/paimon/genshin_impact_paimon.glb` — 1.27 MB — floating companion (animated)
- `cosmic-pyramid-library/assets/ifa/...anemo_ifa.glb` — 4.73 MB — Genshin sky character (animated)
- `cosmic-pyramid-library/assets/porsche-gt3-rs/...gt3_rs.glb` — 9.1 MB — drivable hero car
- `cosmic-pyramid-library/assets/mercedes/1982_mercedes_w201.glb` — 20 MB; `cadillac/...cts-v.glb` — 3 MB; `porsche-extra/...gt3r.glb` — 45 MB — car fleet
- `cosmic-pyramid-library/assets/retro-urban-kit/` — 818 files (FBX+GLB+OBJ) — THE CITY KIT
- `allie/assets/models/` — 28 cyberpunk/city props (dragon, server-rack, scifi-corridor, neon, cesium-man[animated], etc.), ×3 duplicated trees
- `soul-verse-portfolio/` — a WHOLE OTHER finished Three.js world (areas, terrain, trees, weather systems, 92 sounds, 705 images)
- `cosmic-pyramid-library/assets/billboards/` — 13 promo JPGs

**Theme split (per the Pope's "space / heaven / animated")**
- SPACE: `world.glb`, `lava-planet.glb` (allie), `paimon`/`ifa` sky chars
- HEAVEN: `angel.glb`, `world.glb` (celestial)
- ANIMATED / NPC layer: `cesium-man`, `dragon`, `doctor-alien`, `alien-blobby`, Genshin chars — driven by `soul-verse-portfolio` particle/weather systems + 92-file sound lib
- CITY: `retro-urban-kit` (pick GLB) + cars + `allie` cyberpunk props + `billboards`
- NEIGHBORHOOD: absorb `soul-verse-portfolio` (areas, trees, holiday props, weather, sounds)

## 1. Labeling scheme (every asset gets an ID)
Registry row: `ID | Name | File | Size | Type | Theme | Animated | Source | Status | District`
- ID: `A-0xx` (sequential). Type: model / kit / texture / audio / world.
- Theme: SPACE | HEAVEN | CITY | NEIGHBORHOOD | ANIMATED | HUB.
- Animated: Y/N (rigged GLB or code-driven).
- Status: UNMAPPED → MAPPED → ACTIVE.
- Stored in `CPL ASSET MAP.md` (the live registry) + a machine-readable `assets.json` the world reads.

## 2. District taxonomy (turn each asset into its own experience)
Six worlds off one hub (the Cathedral):
1. **CATHEDRAL (HUB)** — current world; GSK alive. Travel nexus.
2. **HEAVEN** — `angel.glb` anchor; floating light realms, seraphs, the "quiet room."
3. **SPACE** — `world.glb` hub + `lava-planet` + sky chars; nebulae, orbits, void.
4. **CITY** — `retro-urban-kit` (GLB set) + car fleet + `allie` cyberpunk props + billboards.
5. **NEIGHBORHOOD** — absorb `soul-verse-portfolio` (areas, trees, weather, 92 sounds).
6. **SOULFORGE (animated)** — `cesium-man`, `dragon`, `doctor-alien`, Genshin chars as living NPCs.

Each district = its own lazily-loaded scene (per `cpl-critical-loading` discipline), entered via a
portal in the Cathedral hub. Black-screen protocol: one district loads at a time, overlay during load.

## 3. Show in chat (the Vault)
- Extend the existing in-world chat/terminal with an `/assets` command: list/filter by theme,
  preview an asset, teleport to its district. Each registry row renders as a chat card (thumbnail
  from the asset's cover/GLB snapshot + label + theme chip + "enter" button).
- A persistent "Vault" panel (collapsible) browses the full registry by theme.

## 4. Per-asset micro-experience (the "own experience" part)
Each major asset gets one signature interaction: dragon flies, porsche is drivable, angel sings,
lava-planet orbits, billboards stream covers, soul-verse weather reacts to GSK phase. Built as
soul guns, one per asset group, NOTARIZED per the standing discipline.

## 5. Build order (proposed)
- **Phase 0** — Asset registry (`assets.json` + `CPL ASSET MAP.md`) + `/assets` chat + Vault panel.
- **Phase 1** — Travel hub + portals (reuse pyramid-enter/portal pattern).
- **Phase 2** — First district build (Pope picks: HEAVEN or CITY suggested as highest-impact).
- **Phase 3+** — Remaining districts, then per-asset micro-experiences.

## 6. Open questions for the Pope
1. **District taxonomy** — keep these 6, or merge/trim? (e.g., is SPACE its own world or part of HEAVEN?)
2. **`world.glb`** — it is the biggest asset and dual-nature (space+heaven). Is it the SPACE hub,
   the HEAVEN hub, or the central CATHEDRAL hub?
3. **`soul-verse-portfolio`** — MERGE into the Library as the NEIGHBORHOOD district, or keep as a
   sibling world with a bridge portal?
4. **First district to build** — HEAVEN (angel) or CITY (retro-urban-kit) — which proves the model?
5. **Animation** — baked GLB clips where present, or code-driven (our existing pattern)?
6. **`retro-urban-kit`** — it ships FBX+GLB+OBJ (818 files). We keep GLB only (Three.js native)?
