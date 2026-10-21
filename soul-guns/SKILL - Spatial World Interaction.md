# SKILL — Spatial World Interaction

slug:: spatial_world_interaction
phase:: build
status:: active
source:: Dark City Spatial OS — Session 33
PLT:: Profit 0.8, Love 0.6, Tax 0.3

## Summary
WHEN TO USE: User clicks/right-clicks any entity in the Dark City, or a Browser Citizen needs to manipulate the world. Archetype affinity: WITNESS (inspect), ARCHITECT (place/destroy). Problem solved: give the user tactile control over the 3D city — click to inspect, right-click to delete, drag to move, portal to fetch — and let Browser Citizens interact at their own level.

## Schema
- trigger: User gesture (click | right-click | drag | hover) on city entity OR citizen PAL loop act phase
- inputs: {
    interactionType: "inspect" | "delete" | "move" | "fetch" | "chat" | "edit",
    targetEntity: { id: string, type: string, position: { x, z } },
    source: "user" | "citizen",
    params: object | null  // e.g. { editMode: "code" | "config" }
  }
- outputs: {
    success: boolean,
    action: string,
    resultData: object | null,  // inspected data, deletion confirmation, etc.
    entityUpdated: boolean
  }

## Consequence
- Clicking a building opens inspect panel with node data (type, GSK ID, recent events)
- Right-clicking shows context menu (Delete, Edit, Inspect, Chat)
- Citizens interact at two levels: (1) reading Sanctum state to perceive the world, (2) calling bridge tools to act in it
- User interactions and citizen interactions share the same spatial coordinate system
- All interactions are logged to EventBus for other guns to react to

## Feedback
- User sees: highlight on hover, inspect panel slides in on click, deletion animation with particle burst
- User hears: click = select sound, delete = crumbling sound, inspect = paper rustle
- Console: `[SPATIAL] <source> <action> <entityType> at (<x>, <z>)`

## States
| State | Behavior | Visual |
|---|---|---|
| IDLE | All entities interactable, no active cursor | Normal city, default cursor |
| ACTIVE | User interacting with entity or citizen acting | Entity highlighted, panel open, action VFX |
| COOLDOWN | 300ms debounce between interactions | Cursor shows loading spinner briefly |
| ERROR | Entity not found, permission denied, bridge timeout | Red flash on entity, error toast |

## Composition
- **Building-to-System-Node Wire** — click entity → read node data through the wire
- **Spatial Code Editor** — click-edit opens CodeMirror with the building's source code
- **City Terminal** — right-click an entity → "Open in Terminal" runs shell commands on its context
- **Agent Communication Bus** — user interactions can trigger citizen responses
- **Combo: TOUCH-THE-CITY** — Spatial World Interaction + Building-to-System-Node Wire + City Terminal = full bidirectional control of GSK through 3D gestures
