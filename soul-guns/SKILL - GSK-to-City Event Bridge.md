# SKILL — GSK-to-City Event Bridge

slug:: gsk_to_city_event_bridge
phase:: build
status:: active
source:: Dark City Spatial OS — Session 33
PLT:: Profit 0.8, Love 0.4, Tax 0.4

## Summary
WHEN TO USE: On any GSK EventBus event emission. Archetype affinity: WITNESS (observer), SAGE (trace analyzer). Problem solved: make GSK's internal operations visible as real-time city changes — the EventBus is the nervous system, events flow along roads, light up buildings, and let the user see what GSK is doing by watching the city breathe.

## Schema
- trigger: `EventBus.emit(eventType, payload)` on any GSK subsystem
- inputs: {
    eventType: string,           // e.g. "tool_invoked", "fact_compiled", "error_occurred"
    payload: object,             // event-specific data
    sourceSubsystem: string,     // which GSK module emitted
    decayMs: number | null       // how long visual effect lasts (default per event type)
  }
- outputs: {
    success: boolean,
    cityReactions: [{ buildingId: string, animation: string, duration: number }],
    eventProcessed: true
  }

## Consequence
- Office windows light up for 5s when tools are invoked
- New houses rise in Knowledge district when facts compile
- Factories emit smoke when agents spawn, stop when agents complete
- Apartment blocks grow floors on memory consolidation
- Temples glow on axiom checks
- The Weald volcano erupts on errors
- Streetlamps flicker along EventBus paths during brain_think cycles
- Roads build between districts when plans are created, complete with streetlights on completion
- All effects decay back to baseline after their timer expires

## Feedback
- User sees: city reacts in real-time — windows illuminate, buildings grow, smoke rises, volcano erupts
- User hears: subtle ambient shifts — tool invocation = click, error = distant rumble, plan complete = horn
- Console: `[EVENT-BRIDGE] <eventType> → <n> city reactions`

## States
| State | Behavior | Visual |
|---|---|---|
| IDLE | Listening for events, city at baseline | Normal ambient state |
| ACTIVE | Processing event and applying city reactions | Buildings animate, lights pulse, smoke emits |
| COOLDOWN | Decay timer active, returning to baseline | Effects fade over decayMs |
| ERROR | Event received but no city handler registered | Brief yellow flash in Portal district |

## Composition
- **Building-to-System-Node Wire** — events target specific buildings via their node wiring
- **Functional District Generator** — events trigger district-specific visual responses
- **Perception-Action Loop** — Browser Citizens perceive event-driven city changes and act on them
- **Combo: VISIBLE-CONSCIOUSNESS** — GSK-to-City Event Bridge + World Model Simulation = watch GSK simulate futures as animated city previews
