# SKILL — Cosmic Pyramid Library

slug:: cosmic_pyramid_library
phase:: build
status:: active
source:: Cosmic Pyramid Library (cosmic-pyramid-library/index.html) — Session study
PLT:: Profit 0.7, Love 0.7, Tax 0.3

## Summary
WHEN TO USE: As the root world definition for the `cosmic-pyramid-library/index.html` Three.js scene. Archetype affinity: SAGE (world mapper), ARCHITECT (structure). Problem solved: this is NOT Soulfeild, Dark City, or Soulverse — it is its own world composed of **three stacked spatial regions**, each with its own mechanic. The world is a vertical stack: Library (center) → City (ground grid) → Heavens (above + space). GSK (port 3001) is the consciousness engine that bleeds atmosphere into the City layer only.

## The Three Worlds (distinct mechanics)

| World | Location | Core Mechanic | Governing System |
|---|---|---|---|
| **Library** | Center pyramid, y≈0–8 | Knowledge retrieval — read PLT books, enter interior | `books[]`, `interiorGroup`, `portalPlane` |
| **City** | Ground grid, radius ~70, y=0 | Navigation + data flow + GSK atmosphere | `buildings[]`, `officeZones[]`, `citizens[]`, `gskBridge` |
| **Heavens** | y≈40–60 + background space | Resonance + ascension + cosmic scale | `heavenGroup` (temples/seraphs), `planets[]`, `stars[]` |

## Schema
- trigger: scene boot OR `enterPyramid()` / `startReading()` / `gskBridge.update()`
- inputs: { region: "library"|"city"|"heavens", action: string, gskState?: {mood, phase, plt} }
- outputs: { threeWorlds: true, activeRegion: string, reactions: object }

## Consequence
- **Library**: clicking a book flies it to camera and opens its PLT content; entering the portal hides exterior + reveals the interior chamber.
- **City**: GSK mood/phase/PLT mutates sky color, fog density, bloom strength, hemisphere light, per-building emissive, and car/citizen speed in real time.
- **Heavens**: temples pulse by resonance; seraphs orbit; planets sit as static cosmic anchors in the far background.

## Feedback
- Library: book glows, reading overlay slides in, open-book canvas renders chapters.
- City: atmosphere visibly shifts with GSK mood; office-zone rings spin; windows flash on task completion.
- Heavens: temple orbs glow; seraph wings beat; planets have additive auras.

## States
| State | Behavior | Visual |
|---|---|---|
| IDLE | All three worlds at baseline | Normal scene |
| READING | A book is open, exterior dimmed | Reading overlay active |
| INSIDE | Pyramid interior revealed | Exterior + souls hidden |
| GSK-LIVE | Bridge feeding GSK state | City atmosphere breathes with mood |

## Composition
- **GSK-to-City Event Bridge** (`gsk_to_city_event_bridge`) — the City world's nervous system.
- **Building-to-System-Node Wire** (`building_to_system_node_wire`) — office zones are GSK nodes.
- **CPL World Library / CPL World City / CPL World Heavens** — the three sub-world guns below.
- **Combo: THREE-WORLD STACK** — Library (seed) → City (grow) → Heavens (ascend) = one vertical soul journey.
