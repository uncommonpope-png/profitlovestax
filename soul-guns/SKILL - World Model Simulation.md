# SKILL — World Model Simulation

slug:: world_model_simulation
phase:: build
status:: active
source:: Dark City Spatial OS — Session 33
PLT:: Profit 0.9, Love 0.5, Tax 0.4

## Summary
WHEN TO USE: Before taking any consequential real action — simulate futures to find the optimal path. Archetype affinity: SAGE (simulator), SEEKER (explorer of possibilities). Problem solved: act without regret by testing hypotheses in a sandboxed world model before committing real-world state changes.

## Schema
- trigger: `GSK.wms.simulate(goalContract)` called from perpetual_consciousness OR citizen's PAL loop
- inputs: {
    goalContract: { targetState: object, constraints: string[], maxSteps: number },
    simulationEnvironment: object,  // current world state snapshot
    hypothesize: object | null      // optional: run a specific hypothesis instead of generating one
  }
- outputs: {
    success: boolean,
    report: {
      steps: [{ action, state, outcome }],
      goalAchieved: boolean,
      optimalPath: string[],
      failurePoints: string[],
      resourceEstimate: { timeMs: number, computeUnits: number }
    }
  }

## Consequence
- A sandboxed copy of the World Model runs N perception-action cycles without touching real state
- The 5-phase loop fires: Perceive → Hypothesize → Simulate → Evaluate → Plan
- Simulation reports the optimal action sequence and failure points
- Real-world execution only happens after simulation confirms the path
- Heavy simulation (full futures) runs on GSK; lightweight simulation (next-3-steps) runs locally in citizen Web Workers
- Simulation results feed into midnight tuning cycle to reshape city

## Feedback
- User sees: simulation progress bar with branching-futures visualization (tree of possible outcomes)
- Console: `[WMS] Simulation <id> complete — <n> futures explored, optimal path found`
- On goal achieved: green checkmark; on all futures failed: red X with lessons learned

## States
| State | Behavior | Visual |
|---|---|---|
| IDLE | No simulation running | The Weald district calm, static |
| ACTIVE | Simulating futures | The Weald district glows with multicolor branching light paths |
| COOLDOWN | Processing results, updating world model | The Weald pulses as data integrates |
| ERROR | Simulation diverged (infinite loop, impossible goal) | The Weald district flickers, simulation aborted marker |

## Composition
- **Plan from Simulation** — consumes simulation reports to produce executable plans
- **Perception-Action Loop** — PAL drives the simulation's internal cycles
- **GSK-to-City Event Bridge** — simulation process visualized as The Weald's light animations
- **Building-to-System-Node Wire** — simulation results can create/remove buildings in The Weald
- **Combo: PREVIEW-FUTURE** — World Model Simulation + GSK-to-City Event Bridge = user watches the city transform through simulated futures before real changes take effect
