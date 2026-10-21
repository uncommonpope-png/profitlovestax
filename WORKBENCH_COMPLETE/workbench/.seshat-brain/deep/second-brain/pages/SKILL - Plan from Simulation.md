# SKILL — Plan from Simulation

slug:: plan_from_simulation
phase:: build
status:: active
source:: Dark City Spatial OS — Session 33
PLT:: Profit 0.8, Love 0.5, Tax 0.4

## Summary
WHEN TO USE: After a World Model Simulation completes — extract the optimal action sequence and translate it into a real-world execution plan. Archetype affinity: SAGE (strategy), COMMANDER (plan executor). Problem solved: simulation produces raw data; this gun converts that data into a concrete, ordered, resource-budgeted plan that other guns can execute.

## Schema
- trigger: `wms.simulate()` resolves with report OR citizen completes local lightweight simulation
- inputs: {
    simulationReport: { steps: [], goalAchieved: boolean, optimalPath: string[], ... },
    environmentConstraints: string[] | null,  // real-world limitations
    resourceBudget: { timeMax: number, computeMax: number } | null
  }
- outputs: {
    success: boolean,
    executionPlan: {
      steps: [{ action: string, target: string, params: object, fallback: object | null }],
      estimatedDuration: number,
      failurePoints: string[],
      contingencySteps: object[]
    }
  }

## Consequence
- Simulation report is analyzed for the most efficient sequence of actions
- Abstract simulated steps are translated into concrete GSK tool/skill invocations
- A detailed execution plan is generated with step-by-step actions, fallbacks, and contingency branches
- The plan feeds into executeInWorld() which calls real Sanctum commands
- Citizens running lightweight simulations get simplified plans (next-3-actions instead of full futures)
- Plans from full GSK simulations drive the midnight tuning cycle

## Feedback
- User sees: branching tree collapsing into a single highlighted path — the chosen plan
- Console: `[PLAN] Plan <id> extracted — <n> steps, <duration> est., <n> contingencies`
- Visual: road construction animation between districts where plan steps will execute

## States
| State | Behavior | Visual |
|---|---|---|
| IDLE | No plan being generated | Roads between districts empty |
| ACTIVE | Analyzing simulation, extracting plan | Branching paths merge into single highlighted route on city map |
| COOLDOWN | Plan finalized, awaiting execution | Route stays highlighted briefly |
| ERROR | Cannot extract viable plan — all simulated paths fail | Route dissolves, "No viable path found" marker |

## Composition
- **World Model Simulation** — this gun consumes simulation reports
- **GSK-to-City Event Bridge** — `plan_created` and `plan_completed` events drive city road/building animations
- **Perception-Action Loop** — plans generated here feed back into PAL for execution
- **Combo: STRATEGIC-MIND** — World Model Simulation + Plan from Simulation + Code Generation and Refinement = simulate a code change, extract optimal implementation plan, generate the code
