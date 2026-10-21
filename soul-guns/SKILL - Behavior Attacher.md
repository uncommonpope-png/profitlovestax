# SKILL — Behavior Attacher

slug:: behavior_attacher
phase:: build
status:: active
source:: Dark City Spatial OS — Session 33
PLT:: Profit 0.7, Love 0.6, Tax 0.3

## Summary
WHEN TO USE: When spawning a Browser Citizen, when a citizen levels up, or when a user wants to customize a citizen's capabilities. Archetype affinity: ARCHITECT (behavior designer), SHAPER (identity shaper). Problem solved: modular plug-and-play behavior system — instead of hard-coding entity logic, attach reusable behavior modules to any citizen at spawn time or runtime.

## Schema
- trigger: `citizen.spawn()` OR `citizen.attachBehavior(behaviorId)` OR user via inspect panel
- inputs: {
    citizenId: string,
    behaviorId: string,            // e.g. "explore", "observe", "build", "trade", "design"
    config: { params: object } | null,  // behavior-specific configuration
    attachMode: "spawn" | "runtime" | "replace"
  }
- outputs: {
    success: boolean,
    behaviorInstance: { behaviorId: string, hook: "perceive" | "reason" | "act", priority: number },
    activeBehaviors: string[]
  }

## Consequence
- Citizen's PAL loop gains new hooks — a behavior can fire during perceive, reason, or act phases
- Behaviors stack by priority — higher priority behaviors override lower ones on conflict
- Archetypes determine initial behavior set (RESEARCHER = explore + observe, ARCHITECT = build + design, MERCHANT = trade + value)
- Behaviors can be detached, replaced, or upgraded at runtime without restarting the citizen
- Behaviors persist across page refresh (stored in citizen's IndexedDB)

## Feedback
- User sees: behavior chip added to citizen's inspect panel, new action animations play
- User hears: soft click on attach, chime on successful injection
- Console: `[BEHAVIOR] <behaviorId> attached to <citizenId> — hook: <phase>`

## States
| State | Behavior | Visual |
|---|---|---|
| IDLE | All behaviors loaded, no hooks firing | Citizen normal |
| ACTIVE | Behavior hook executing during PAL tick | Behavior-specific animation (explore = compass, build = hammer) |
| COOLDOWN | Behavior debounce period after firing | Dimmed behavior icon |
| ERROR | Behavior throws unhandled exception | Behavior icon turns red, auto-disabled after 3 failures |

## Composition
- **Perception-Action Loop** — behaviors hook into PAL's perceive/reason/act phases
- **World Model Simulation** — behaviors can run simulated actions before real execution
- **Agent Communication Bus** — behaviors can broadcast findings or request coordination
- **Combo: BEHAVIOR-SWARM** — Behavior Attacher + Agent Communication Bus + Browser Citizen Runtime = multiple citizens with complementary behaviors that self-organize into a division of labor
