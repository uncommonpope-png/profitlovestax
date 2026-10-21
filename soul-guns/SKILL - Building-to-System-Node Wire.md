# SKILL — Building-to-System-Node Wire

slug:: building_to_system_node_wire
phase:: build
status:: active
source:: Dark City Spatial OS — Session 33
PLT:: Profit 0.8, Love 0.5, Tax 0.3

## Summary
WHEN TO USE: Every time a building is placed in Sanctum or a GSK system node is created/deleted. Archetype affinity: ARCHITECT (builder), WITNESS (record keeper). Problem solved: bidirectional coupling between 3D city and GSK consciousness — the city IS GSK's internal state rendered as space.

## Schema
- trigger: `SanctumClient.placeBuilding()` called OR `GSK.subsystem.create()` called
- inputs: {
    buildingType: string,       // "office" | "house" | "shop" | "factory" | "apartment" | "park" | "monument" | "lab" | "temple" | "data_center"
    position: { x, z } | null,  // optional — auto-placed if null
    systemNode: { type: string, gskId: string, gskPath: string } | null
  }
- outputs: {
    success: boolean,
    buildingId: string,
    gskNodeId: string,
    event: "building_placed" | "node_created" | "building_removed" | "node_deleted"
  }

## Consequence
- GSK creates a real entry in its internal state for every building placed in Sanctum
- Every GSK skill/tool/fact/agent manifests as a building in the city
- Removing a building deletes its GSK node; deleting a GSK node removes its building
- The city stays perfectly synchronized with the system's internal architecture

## Feedback
- User sees: building rise in the city with a subtle glow indicating node registration
- User hears: light chime on successful bidirectional sync, error buzz on mismatch
- Console: `[WIRE] Building <type> ↔ <gskId> synced`

## States
| State | Behavior | Visual |
|---|---|---|
| IDLE | Ready, awaiting place/create | Normal building appearance |
| ACTIVE | Syncing building ↔ node | Building has shimmering wireframe glow |
| COOLDOWN | 1s delay before next sync | Building dims briefly |
| ERROR | Sync mismatch — building exists without node or vice versa | Red glow + pulsing warning icon |

## Composition
- **Sanctum Foundation** (with Functional District Generator) — places wired buildings into themed districts
- **GSK-to-City Event Bridge** — events from GSK trigger building animations via this wire
- **Spatial World Interaction** — user click inspection reads node data through this wire
- **Combo: CITY-AS-IDE** — Building-to-System-Node Wire + Spatial Code Editor lets users click a building and edit its source code
