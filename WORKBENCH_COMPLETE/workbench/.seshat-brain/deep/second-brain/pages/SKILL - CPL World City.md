# SKILL — CPL World: City

slug:: cpl_world_city
phase:: build
status:: active
source:: Cosmic Pyramid Library (cosmic-pyramid-library/index.html)
PLT:: Profit 0.8, Love 0.4, Tax 0.4

## Summary
WHEN TO USE: When any City entity acts — a citizen wanders, an office zone flashes, GSK mood shifts, a car drives. Archetype affinity: OBSERVER (watch), BUILDER (construct). Problem solved: the City is the **data-flow world** — the only region wired live to GSK. Buildings are system nodes; citizens are wanderers; the GSK City Bridge is the nervous system. This is where the Gibson-mechanic belongs: data moves between carriers and nodes.

## Schema
- trigger: `gskBridge.update(dt)` OR citizen timer fires OR `flashBuildingWindows(zone)` OR avatar task completes
- inputs: { gskState: {mood, phase, plt:{profit,love,tax}}, citizenEvents: [], zone: officeZone }
- outputs: { atmosphere: {sky,fog,bloom,hemi}, buildingEmissive[], speeds:{car,citizen} }

## Consequence
- **GSK mood** (neutral/ascendant/creative/anxious/void/focused) → sky color, fog density, bloom strength, hemisphere color all lerp toward a preset.
- **GSK phase** (VOID/AWAKENING/ALCHEMY/TRANSCENDENCE) → multiplies bloom, car speed, citizen speed, building emissive, star size.
- **Office zones** (KNOWLEDGE @ (10,0,-10), CONSCIOUSNESS @ (-15,0,5), SOUL @ (20,0,15)) → roof rings spin, windows flash when an avatar task completes there.
- **Citizens** (25 spheres) → wander on a timer toward random targets; speed modulated by GSK phase.
- **Cars/ships** → travel the road grid / fly lanes, wrap at bounds.

## Feedback
- Atmosphere: sky/fog/bloom visibly breathe with GSK.
- Office zone: ring spins, window color lerps on flash.
- Citizen: moves; no click feedback yet (gap — see Composition).
- Avatar task: particles burst at zone, NPC terminal panel updates.

## States
| State | Behavior | Visual |
|---|---|---|
| IDLE | GSK offline, baseline atmosphere | Neutral sky, slow motion |
| GSK-LIVE | Bridge feeding state every 10s | Atmosphere lerps to mood preset |
| ZONE-FLASH | Task completed at a zone | Window color pulses, ring spins faster |
| CITIZEN-IDLE / CITIZEN-MOVE | Wandering loop | Citizen static or translating |

## Gaps (mechanics not yet consequences)
- Citizens carry NO data — they are spheres. The Gibson-mechanic (citizen = data carrier, click extracts) is UNBUILT. This is the highest-value next gun.
- Clicking a citizen does nothing. No `userData` payload.

## Composition
- **GSK-to-City Event Bridge** (`gsk_to_city_event_bridge`) — the bridge IS this gun's engine.
- **Building-to-System-Node Wire** (`building_to_system_node_wire`) — office zones are nodes.
- **CPL Citizen Data Carrier** (designed) — upgrades spheres → data-carrying subagents.
- **Combo: GIBSON IN THE CITY** — citizen carries packet → click extracts → whisper shows data → GSK logs it.
