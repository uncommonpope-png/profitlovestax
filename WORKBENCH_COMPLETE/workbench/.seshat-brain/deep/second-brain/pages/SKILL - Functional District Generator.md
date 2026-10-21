# SKILL — Functional District Generator

slug:: functional_district_generator
phase:: build
status:: active
source:: Dark City Spatial OS — Session 33
PLT:: Profit 0.7, Love 0.7, Tax 0.2

## Summary
WHEN TO USE: On Soulverse initialization, on each midnight tuning cycle, or when a new GSK subsystem registers. Archetype affinity: ARCHITECT (city builder), SAGE (knowledge organizer). Problem solved: replace 9 generic grid cells with 9 themed districts that visually map to GSK subsystems — each district has unique identity, building types, and behavior.

## Schema
- trigger: `Soulverse.init()` call OR `GSK.subsystem.register()` event OR midnight tuning cycle timer
- inputs: {
    districtTypes: string[] | null,  // override which districts to generate (default: all 9)
    seed: number | null,             // procedural generation seed
    eventLog: object[] | null        // recent GSK events to influence district state
  }
- outputs: {
    success: boolean,
    districts: [{ name, bounds, color, buildings: [{ type, position }] }],
    totalBuildings: number,
    cityLayout: { width, depth, roadGraph }
  }

## Consequence
- The Soulverse HTML renders 9 distinct districts instead of a uniform grid
- Each district has unique colors, road patterns, building styles, and atmospheric effects
- District boundaries are EventBus roads — traffic between districts = data flow between subsystems
- New districts can be added when new subsystems register
- Midnight tuning reshuffles The Weald district procedurally

## Feedback
- User sees: the city transform from grid to themed districts with colored boundaries and unique architecture
- User hears: ambient sound per district (Knowledge = pages flipping, Skill = hammering, Portal = wind, etc.)
- Console: `[DISTRICT] Generated <name> with <n> buildings`

## States
| State | Behavior | Visual |
|---|---|---|
| IDLE | City fully rendered, all districts stable | Normal themed appearance |
| ACTIVE | Generating or regenerating districts | Buildings rise from ground with scaffold animation |
| COOLDOWN | 5s lock between regenerations | District entrances show "stabilizing" sign |
| ERROR | District generation fails (bad seed, missing subsystem) | District shows as grey void with error marker |

## Composition
- **Building-to-System-Node Wire** — buildings inside districts get wired to GSK nodes
- **GSK-to-City Event Bridge** — district animations respond to subsystem events
- **Spatial World Interaction** — clicking a district highlights all its GSK-connected buildings
- **Combo: LIVING-CITY** — Functional District Generator + Perception-Action Loop + Browser Citizen Runtime = districts that self-organize based on citizen activity
