# SKILL — Delta Persistence

slug:: delta_persistence
phase:: build
status:: grafted
source:: No Man's Sky (Hello Games) — Player modification storage model
PLT:: Profit 0.5, Love 0.4, Tax 0.5

## Summary
Store only agent/player modifications. The baseline world is regenerated from seed. When a soul places a building, only the delta is stored: `{position, building_type, placed_by}`. The terrain, roads, base architecture — all regenerated from seed. This makes save data tiny and the universe infinite.

## How It Works
1. Sanctum baseline state is generated from `darkCitySeed` + position
2. Agent actions (spawnSoul, placeBuilding, moveSoul, updateResource) are stored as **deltas**
3. WorldStateMessage includes: `{ baseline: { seed }, deltas: { souls: [...], buildings: [...] } }`
4. Soulverse HTML renders: baseline seed-generated city + delta overrides on top
5. When a delta is removed, the baseline instantly reappears

## Delta Types
| Action | Delta Record |
|---|---|
| Place building | `{type: 'building', id, x, z, name, placedBy, createdAt}` |
| Spawn soul | `{type: 'soul', id, name, archetype, x, z, spawnedBy}` |
| Move soul | `{type: 'move', soulId, x, z}` |
| Remove building | `{type: 'remove', buildingId}` |
| Update resource | `{type: 'resource', profit, love, tax}` |

## Implementation
- Store deltas as JSONL in Sanctum's `data/aria_sanctum_deltas.jsonl`
- On Sanctum restart, replay deltas on top of seed-generated baseline
- Expose through sanctumClient.getWorldState() as merged view
