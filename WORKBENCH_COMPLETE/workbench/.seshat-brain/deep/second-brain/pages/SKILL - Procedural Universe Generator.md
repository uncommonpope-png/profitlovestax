# SKILL — Procedural Universe Generator

slug:: procedural_universe_generator
phase:: build
status:: grafted
source:: No Man's Sky (Hello Games) — Deterministic Seed Chain Architecture
PLT:: Profit 0.7, Love 0.5, Tax 0.2

## Summary
Generate galaxy-scale worlds from a single seed. The entire Dark City universe — districts, buildings, souls, resources — is a deterministic function of a single seed and position: `f(seed, position) → world`. Nothing is stored. Everything is math.

## How It Works
1. Accept a `darkCitySeed` (64-bit integer) in Sanctum state
2. For any district at (x,z): `hash(seed, x, z) → district_type, biome, resource_density`
3. For any building position: `hash(seed, x, z, district_id) → building_type, size, color, level`
4. For any NPC/soul at position: `hash(seed, x, z, district_id, index) → archetype, name_seed, behavior_tags`
5. All rendering is deterministic — same seed + same position = same world every time

## Implementation
- Add `seed` field to Sanctum state
- Modify `createCityGrid()` in Soulverse HTML to accept seed parameter
- Replace `getSimCityBuildings(type)` with `getProceduralBuildings(seed, grid_id, x, z)`
- Use `xxhash` or simple FNV-1a hash for speed
