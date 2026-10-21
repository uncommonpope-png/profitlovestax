# SKILL — Browser Citizen Runtime

slug:: browser_citizen_runtime
phase:: build
status:: active
source:: Dark City Spatial OS — Phase 4
PLT:: Profit 0.8, Love 0.7, Tax 0.3

## Summary
WHEN TO USE: On Soulverse page load — spawn persistent AI citizens as Web Workers. Archetype affinity: COMMANDER (shepherd of citizens), WITNESS (observe life). Problem solved: give the Dark City living inhabitants that persist across page refreshes, think via 9Router, perceive via Sanctum state, and act via the bridge — an undying population.

## Schema
- trigger: `Soulverse.boot()` — spawn configured citizens OR user clicks "Spawn Citizen" in Portal district
- inputs: {
    citizenConfig: {
      archetype: "RESEARCHER" | "ARCHITECT" | "MERCHANT" | "SHAPER" | "COMMANDER" | "WITNESS" | "SAGE" | "SEEKER" | "BUILDER",
      name: string | null,
      identityOverrides: object | null,
      behaviors: string[] | null  // initial behavior set (default from archetype)
    },
    spawnCount: number            // how many to spawn (default: 1)
  }
- outputs: {
    success: boolean,
    citizens: [{
      id: string,
      worker: Worker,
      identity: object,
      state: "idle" | "active" | "sleep" | "error",
      spawnPosition: { x, z }
    }]
  }

## Consequence
- Each citizen gets a Web Worker, an IndexedDB database, and a BroadcastChannel
- Identity, memory, messages, and state persist in IndexedDB — survive page refresh
- Each citizen runs the Perception-Action Loop on setInterval indefinitely
- Citizens think by fetching 9Router; perceive by reading Sanctum state; act by calling bridge
- Archetype determines: initial behaviors, appearance, spawn district, communication style
- Citizens can be terminated (worker.terminate() + IndexedDB wipe) or respawned (restore from last good state)
- Total spawn limit = 12 (one per archetype) to prevent browser overload

## Feedback
- User sees: citizens walking the city, speech bubbles above heads when thinking/chatting, glow on active
- Console: `[CITIZEN] <name> (<archetype>) spawned at (<x>, <z>) — behaviors: [<list>]`
- Inspect panel: click citizen → see identity, memory, recent loop ticks, messages

## States
| State | Behavior | Visual |
|---|---|---|
| IDLE | Between PAL ticks, standing | Citizen stands still, subtle breathing animation |
| ACTIVE | PAL tick in progress (perceive → think → act) | Citizen moves, thinking gear/spiral animation, action plays |
| SLEEP | Deep rest cycle (every 10th tick) | Citizen sits, Zzz particles, dimmed 50% opacity |
| ERROR | Web Worker crashed or IndexedDB corrupted | Citizen frozen, red aura, "Respawn" dialog, error logged |

## Composition
- **Perception-Action Loop** — citizens run PAL as their infinite runtime loop
- **Behavior Attacher** — citizens gain behaviors from their archetype
- **Agent Communication Bus** — citizens talk via BroadcastChannel
- **World Model Simulation** — citizens run lightweight simulations locally
- **Knowledge Absorption & Integration** — citizens can autonomously trigger research
- **Combo: LIVING-CIVILIZATION** — Browser Citizen Runtime + Agent Communication Bus + Behavior Attacher + Perception-Action Loop = a self-organizing population that divides labor, shares knowledge, and evolves collectively
