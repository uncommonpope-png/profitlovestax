# SKILL — Code Generation and Refinement

slug:: code_generation_refinement
phase:: build
status:: active
source:: Dark City Spatial OS — Session 33
PLT:: Profit 0.9, Love 0.4, Tax 0.4

## Summary
WHEN TO USE: When a building in Skill district is clicked for editing, a citizen autonomously decides to write a new skill, or the midnight tuning cycle needs code changes. Archetype affinity: BUILDER (code craftsman), ARCHITECT (system designer). Problem solved: translate design plans and user edits into working GSK code, then iteratively refine through testing and review.

## Schema
- trigger: `SpatialCodeEditor.save()` OR citizen PAL loop act phase with `write_skill` OR `GSK.midnightTuning.evolve()` 
- inputs: {
    codingTask: { goal: string, constraints: string[], existingCode: string | null },
    language: "javascript" | "html" | "css" | "json",
    refinementDepth: "draft" | "tdd" | "full_review",
    targetBuilding: { district: string, buildingId: string } | null
  }
- outputs: {
    success: boolean,
    code: string,
    testsPassed: boolean,
    reviewScore: number,
    buildingUpdated: boolean,
    path: string      // where in GSK filesystem the code was written
  }

## Consequence
- Code is generated from the coding task and existing codebase patterns
- If refinementDepth >= "tdd", tests are created and code iterates until they pass
- If refinementDepth = "full_review", code passes through Code Reviewer for quality assessment
- The building in Skill district updates its appearance to reflect new code state
- GSK's filesystem is updated with the new/modified file
- The city IS the IDE — click a building, edit its source, save, and the city updates in real-time

## Feedback
- User sees: CodeMirror 6 editor opens in inspect panel with building's source, save button triggers build animation
- Console: `[CODEGEN] <path> generated — <lines> lines, tests <passed/failed>, score <n>/10`
- Building visual: changes color/tint to indicate code freshness (green = just edited, blue = stable, yellow = needs review)

## States
| State | Behavior | Visual |
|---|---|---|
| IDLE | Editor closed, no generation active | Building in Skill district shows normal appearance |
| ACTIVE | Generating or refining code | Building scaffolded with construction animation, editor panel open |
| COOLDOWN | Code written, awaiting next edit | Building pulses with new-code glow for 10s |
| ERROR | Generation failed, tests fail, save rejected | Building shows red warning stripe, editor shows error pane |

## Composition
- **Spatial Code Editor** — provides the CodeMirror UI that triggers this gun on save
- **Building-to-System-Node Wire** — code changes update the wired GSK node
- **GSK-to-City Event Bridge** — code generation events trigger Skill district animations
- **World Model Simulation** — simulate code changes before writing them to real files
- **Combo: FULL-FEATURE** — World Model Simulation + Plan from Simulation + Code Generation and Refinement = simulate an architectural change, plan the implementation, and generate the complete code
