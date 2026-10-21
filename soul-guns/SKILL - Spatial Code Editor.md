# SKILL — Spatial Code Editor

slug:: spatial_code_editor
phase:: build
status:: active
source:: Dark City Spatial OS — Phase 5
PLT:: Profit 0.9, Love 0.5, Tax 0.3

## Summary
WHEN TO USE: When a user clicks a building in Skill district (or any wired building with source code), or when a citizen needs to read/write a skill file. Archetype affinity: BUILDER (code smith), ARCHITECT (system editor). Problem solved: the inspect panel needs to become a full code editor — click any building to see and edit its source code, save writes back to GSK, and the building updates in real-time. The city IS the IDE.

## Schema
- trigger: User click on building with `systemNode.gskPath` property OR citizen PAL loop with `edit_skill` behavior
- inputs: {
    targetBuilding: { id: string, district: string, gskPath: string },
    editorMode: "codemirror" | "monaco",
    language: string | null,       // auto-detected from file extension
    cursorPosition: { line, col } | null
  }
- outputs: {
    buildingId: string,
    sourceLoaded: {
      path: string,
      content: string,
      language: string,
      lastModified: timestamp
    }
  }

## Consequence
- Click building → inspect panel opens with CodeMirror 6 (lightweight, embedded)
- Building's source code is fetched from GSK filesystem via the bridge
- User edits code → save → POST to GSK → file updated on filesystem
- Building's appearance updates to reflect new code (color shifts: green = fresh, blue = stable)
- Monaco Editor available for full IDE mode (IntelliSense, multi-language, debug)
- Citizens with `citizen_skill_writer` behavior (Hermes-grafted) can autonomously edit skills
- All edits are logged and reversible (git-style undo via GSK)

## Feedback
- User sees: CodeMirror panel slides up from building base, syntax highlighting on load, save button pulses
- Console: `[EDITOR] <path> opened for editing — <lines> lines — language: <lang>`
- On save: building construction animation plays, "Skill updated" toast
- On error: red error pane with line numbers, "Save failed — see console" toast

## States
| State | Behavior | Visual |
|---|---|---|
| IDLE | Editor closed, no building selected | All buildings normal |
| ACTIVE | Editor open, user typing | Selected building highlighted, editor panel open with cursor blink |
| COOLDOWN | File saved, syncing to GSK | Building shows save animation (brief glow) |
| ERROR | File not found, save rejected, bridge down | Red editor banner, building shows error stripe |

## Composition
- **Building-to-System-Node Wire** — provides the gskPath for source fetching
- **Code Generation and Refinement** — triggered when user clicks "Generate" or "Refactor" inside the editor
- **GSK-to-City Event Bridge** — editor save events trigger Skill district building animation
- **Spatial World Interaction** — click gesture on building opens the editor
- **Combo: CITY-IDE** — Spatial Code Editor + Building-to-System-Node Wire + Code Generation and Refinement + GSK-to-City Event Bridge = every building is a file, the city is the file tree, the 3D world is the IDE
