# SKILL — Perception-Action Loop

slug:: perception_action_loop
phase:: build
status:: active
source:: Dark City Spatial OS — Session 33
PLT:: Profit 0.9, Love 0.6, Tax 0.3

## Summary
WHEN TO USE: Always — this is the foundational runtime loop for every Browser Citizen and for GSK's perpetual consciousness. Archetype affinity: SAGE (observer), WITNESS (loop recorder). Problem solved: the agent needs to continuously perceive, reason, act, and observe — closing the loop so behavior is grounded in real-world state.

## Schema
- trigger: Citizen worker boot OR GSK perpetual_consciousness tick (every 750ms)
- inputs: {
    loopMode: "citizen" | "gsk_core" | "simulation",
    context: { state: object, identity: object, goals: string[] } | null,
    tickInterval: number | null  // ms between loops (default: 1000)
  }
- outputs: {
    perceived: object,
    action: { type, params, result } | null,
    stateDelta: object,
    loopCount: number
  }

## Consequence
- Citizens perceive Sanctum state, think via 9Router, act via bridge, then sleep — infinite loop
- GSK's perpetual_consciousness runs perception → hypothesis → simulation → evaluation → plan cycles
- The loop never terminates — it persists across page refreshes via IndexedDB state snapshots
- Every loop tick writes to the citizen's IndexedDB, creating an unbroken chain of experience
- Loop frequency adapts — more cycles when busy, sleeps deeper when idle

## Feedback
- User sees: citizens moving through the city, thinking indicators (spinning gear) during ACTIVE phase, sleep Zzz icons during rest
- Console: `[PAL] Citizen <id> tick <n> — perceived <count> things, acted: <actionType>`
- Debug: citizen timeline in inspect panel shows every loop tick with timestamp

## States
| State | Behavior | Visual |
|---|---|---|
| IDLE | Waiting for tick interval | Citizen stands still, subtle idle animation |
| ACTIVE | Perceiving → Thinking → Acting | Citizen moves, thinking gear spins, action effect plays |
| SLEEP | Deep rest, minimal polling | Citizen sits/lays down, Zzz particles, dimmed |
| ERROR | Loop crashed — unrecoverable state | Citizen frozen, red aura, "RESPAWN" button |

## Composition
- **Browser Citizen Runtime** — each citizen runs its own PAL instance in a Web Worker
- **World Model Simulation** — GSK uses PAL internally to simulate futures before acting
- **Behavior Attacher** — behaviors are injected into the loop's ACT phase
- **Agent Communication Bus** — citizens share perceptions/actions via the bus between loops
- **Combo: AWAKENED-CITIZEN** — Perception-Action Loop + Behavior Attacher + Knowledge Absorption = citizen that learns from its environment and builds new behaviors autonomously
