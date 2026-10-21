---
type:: [[research]] [[soul-note]]
mission:: [[GENESIS ENGINE SOUL GUNS]]
status:: EXTRACTED
---

# SOUL-NOTE — Vertically Stacked Worlds

## Research question
How can CPL become one apparently continuous vertical world without forcing every city, simulation, collision system, and asset into one always-loaded scene?

## Sources and signal
- [Vertically Stacked Dimensions](https://www.curseforge.com/minecraft/mc-mods/vertically-stacked-dimensions) (MIT): stacks independent dimensions and connects top/bottom boundaries to simulate a larger vertical build height with minimal engine changes.
- [Stackable Planar Dimensions](https://modrinth.com/mod/stackable-planar-dimensions) (MIT): configurable Y-axis order; crossing a plane reaches the neighboring dimension without a conventional portal.
- [Forgiving World — Dimension Stacking](https://www.curseforge.com/minecraft/mc-mods/forgiving-world): configurable source/destination Y thresholds, dimension IDs, arrival heights, and AIR/CAVE/GROUND placement modes.
- [Unreal World Partition](https://dev.epicgames.com/documentation/en-us/unreal-engine/world-partition-in-unreal-engine): one persistent world, spatial cells, streaming sources, Loaded/Activated states, priority, and HLOD.
- [Unreal Runtime Data Layers](https://dev.epicgames.com/documentation/en-us/unreal-engine/world-partition---data-layers-in-unreal-engine): independently activates world sets; demonstrated with Light World / Dark World transitions.
- [Unity additive scene loading](https://docs.unity3d.com/ScriptReference/SceneManagement.LoadSceneMode.Additive.html): load a destination scene while retaining the current one, then unload asynchronously.
- [Chongqing vertical city](https://parametric-architecture.com/worlds-most-complex-city-chongqing/): real-world 3D zoning where ground access exists on multiple floors, roads and plazas sit on rooftops, and pedestrian/rail/vehicle networks occupy separate elevations.

## Extracted pattern
**Do not build one impossibly tall monolith. Build independent planar worlds, order them on a logical Y stack, and make their boundaries continuous through prewarmed transitions.**

## Technical doctrine
1. Each stratum is an independent `THREE.Group` with its own local origin, floor, traffic, NPC navigation, lighting, audio, and sector cells.
2. A stack manifest defines `{id, order, minY, maxY, entryTop, entryBottom, root, state}`.
3. Crossing a connector threshold preloads the adjacent stratum, maps horizontal position, resolves a safe landing surface, transfers camera/player, then sleeps the old stratum.
4. Runtime state machine: `UNLOADED -> LOADED -> ACTIVE -> SLEEPING -> UNLOADED`.
5. The active stratum and one adjacent destination may be loaded; only the active stratum runs full simulation.
6. Logical partitions are invisible volumes. Never render a world-sized debug grid or plane.
7. Persist world state by stratum ID, not raw global Y.

## Chongqing visual doctrine
- Ground level is contextual, not globally fixed.
- Buildings may have entrances on several elevations.
- Roads can become roofs; roofs can become plazas.
- Use bridges, lifts, escalators, cable cars, tunnels, and transit-through-buildings as connectors.
- Separate movement networks by altitude: lower infrastructure/rail, middle streets/commerce, upper gardens/culture/sky transit.
- Provide strong landmarks and diegetic wayfinding because vertical cities break flat mental maps.

## CPL mapping
- `underworld` — industrial tunnels, rails, caves, memory vaults.
- `surface` — current CPL city and pyramid core.
- `sky/heaven` — angels, sky gardens, cultural/celestial layer.
- Existing Genesis Sector/Streaming/Visibility managers become the World Partition equivalent.
- Connector prototype should be one authored elevator/shaft between surface and heaven before adding a third stratum.

## Key warning
Three.js `Layers` are visibility masks, not asset streaming or world simulation. They cannot replace a stratum state machine.
