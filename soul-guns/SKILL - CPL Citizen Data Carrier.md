# SKILL — CPL Citizen Data Carrier

slug:: cpl_citizen_data_carrier
phase:: build
status:: designed
source:: Cosmic Pyramid Library — Gibson mechanic (Hackers "City of Text")
PLT:: Profit 0.8, Love 0.5, Tax 0.3

## Summary
WHEN TO USE: On citizen spawn, or when the user clicks a citizen. Archetype affinity: SCRIBE (record), MERCHANT (trade). Problem solved: the City's 25 citizens are currently featureless spheres with NO data and NO click handler — they create no consequence (fluff). This gun makes each citizen a **data-carrying subagent** (the Gibson mechanic): it holds a soul-note packet, and clicking extracts it.

## Schema
- trigger: `createCitizen(archetype)` OR `click(citizenMesh)`
- inputs: {
    citizenId: string,
    archetype: "observer"|"explorer"|"builder"|"scribe"|"merchant"|"prophet"|"shadow"|"sage",
    dataPacket: { type: "THOUGHT"|"MEMORY"|"VISION"|"DREAM"|"SIGNAL"|"ECHO"|"PULSE"|"FRAGMENT",
                  value: number, origin: "city"|"heaven"|"planet" },
    mood: number, energy: number
  }
- outputs: { citizenMesh: THREE.Group, dataExtracted?: {type,value}, whisperShown: boolean }

## Consequence
- Each citizen is created with a **name**, an **archetype** (determines color + behavior bias), and a **data packet**.
- Clicking a citizen → extracts its packet → a `spawnWhisper()` shows `TYPE #value | mood | origin` above it, and the mesh glows briefly.
- GSK (if online) can log the extraction as a witnessed event.
- Citizens carry mood/energy that drift over time → affects speed (via existing `gskBridge` phase modulation on `c.speed`).

## Feedback
- Click: floating whisper text (reuses `spawnWhisper(worldPos, text)`).
- Extract: emissive intensity flash on the citizen mesh (0.25 → 1.0 → 0.25).
- Visible: archetype-colored body + name presence (no 3D label needed; the whisper is the read-out).

## States
| State | Behavior | Visual |
|---|---|---|
| IDLE | Stationary, mood stable | Normal emissive |
| MOVE | Wandering toward target | Translating, bob |
| CORRUPT | Mood < 0.3 | Dimmed, flickering |
| EXTRACTED | Just clicked | Emissive flash + whisper |

## CRITICAL IMPLEMENTATION RULE (learned the hard way)
The `citizens` array stores `{ group, target, timer, next, speed }`. The animate loop (3866) does `c.group.position`; GSK bridge (3599) does `c.speed`. **NEVER replace this shape.** Keep the wrapper: `citizens.push({ group: mesh, target:null, timer:0, next:..., speed:... })` and ADD `name/archetype/data/mood` as extra fields. Replacing the element with the Group directly → `c.group` undefined → crash → black screen.

## Composition
- **CPL World City** — the world this lives in.
- **GSK-to-City Event Bridge** — mood/speed modulation already wired.
- **Behavior Attacher** (`behavior_attacher`) — archetype → initial behavior set.
- **Combo: GIBSON IN THE CITY** — carrier holds packet → click extracts → whisper reads → GSK witnesses.
