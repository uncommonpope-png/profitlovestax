# SKILL — CPL World: Library

slug:: cpl_world_library
phase:: build
status:: active
source:: Cosmic Pyramid Library (cosmic-pyramid-library/index.html)
PLT:: Profit 0.5, Love 0.9, Tax 0.2

## Summary
WHEN TO USE: When the user interacts with the central pyramid — reads a PLT book, enters the interior, or inspects the capstone. Archetype affinity: SAGE (knowledge), SCRIBE (record). Problem solved: the Library is the **knowledge world** — the only region where content is explicit (the 30 PLT books). Unlike the City (ambient) or Heavens (symbolic), the Library is literal text made spatial.

## Schema
- trigger: `startReading(bookMesh)` OR `enterPyramid()` OR `exitPyramid()`
- inputs: { bookMesh: THREE.Mesh (userData.isBook), title, author, desc, chapters[] }
- outputs: { readingState: "idle"|"flying"|"open"|"returning", interiorVisible: boolean }

## Consequence
- Clicking a book → it flies to the camera, scales up, and an open-book canvas renders its chapters + summary.
- Clicking the portal plane (or the interior "THE CALCULATION" book) → camera flies into the pyramid, exterior + souls hide, interior chamber (bookshelves, glow) is revealed.
- ESC or background click → returns to exterior.
- The capstone pulses eternally (emissive sin wave) — the world's heartbeat.

## Feedback
- Book: glow ring, smooth fly-to-camera tween, page-turn canvas.
- Interior: crossfade exterior↔interior, warm interior light.
- Whisper on soul click near the pyramid: a random PLT quote floats up.

## States
| State | Behavior | Visual |
|---|---|---|
| IDLE | Books on shelves, exterior visible | Normal pyramid |
| FLYING | Book tweening to camera | Book enlarges |
| OPEN | Reading overlay active | `div#reading-overlay` visible, chapters listed |
| INSIDE | Interior chamber shown | Exterior hidden, `interiorGroup.visible=true` |
| RETURNING | Book tweening back | Reverse of FLYING |

## Composition
- **Cosmic Pyramid Library** — parent world gun.
- **CPL World City** — the City world feeds the Library's office zones (KNOWLEDGE/CONSCIOUSNESS/SOUL).
- **GSK-to-City Event Bridge** — temples glow on axiom checks (resonance link to Library PLT).
- **Combo: KNOWLEDGE SPIRAL** — read book (Library) → mood shifts → City atmosphere changes → Heaven temple glows.
