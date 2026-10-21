# DOUR JOURNAL - Profit Prime

## [[2026-07-09]]

### Phase 1: Diagnosis & Architecture Mapping (CONT.)

**Oracle's Counsel Feedback (Material Variation):**
- GSK's advice on parameter variation and instancing is crucial. My proposed `MaterialManager` will implement:
    1.  **Base Material Pool:** Cache unique `BABYLON.PBRMaterial` instances.
    2.  **Material Instance Descriptors:** Entities reference a base material ID + override parameters.
    3.  **Dynamic Material Clones (Optimized):** Clone base materials and apply overrides, caching these clones for reuse.
    4.  **Reference Counting/Garbage Collection:** Manage material instance lifecycles.

**Refactoring Strategy for Phase 2 (Forge - Modularization):**
Before we can implement the `MaterialManager`, the monolithic `dark-city.html` script needs to be broken down.

**Proposed Modules:**
- `core/Input.js`: Handles all input.
- `core/PLT.js`: Manages PLT values and calculations.
- `core/Entity.js`: Base class for scene entities.
- `core/MaterialManager.js`: The new Soul Gun for managing materials.
- `core/SceneManager.js`: Initializes Babylon.js scene, engine, cameras, lights, post-processing.
- `entities/Starfield.js`: Handles star rendering.
- `entities/Planet.js`: Handles planet creation and logic.
- `entities/Structure.js`: Handles building creation and logic.
- `entities/Traffic.js`: Handles car creation and logic.
- `entities/MatrixCluster.js`: Handles matrix cluster rendering.
- `ui/Terminal.js`: Manages the in-game terminal.
- `ui/Onboarding.js`: Manages the onboarding sequence.
- `app.js`: Orchestrates all modules, contains the main render loop.

**Implementation Plan for Phase 2:**

1.  **Create `core` directory:** `C:\Users\uncom\Desktop\dark-city-engine\core\`
2.  **Create `entities` directory:** `C:\Users\uncom\Desktop\dark-city-engine\entities\`
3.  **Create `ui` directory:** `C:\Users\uncom\Desktop\dark-city-engine\ui\`
4.  **Extract `Input`:** Move Input object from `dark-city.html` to `core/Input.js`.
5.  **Extract `PLT`:** Move PLT object from `dark-city.html` to `core/PLT.js`.
6.  **Extract `Entity`:** Move `Entity` base class to `core/Entity.js`.
7.  **Create `core/MaterialManager.js`:** Implement the MaterialManager as discussed.
8.  **Extract `SceneManager`:** Move scene, engine, camera, light, post-processing initialization to `core/SceneManager.js`.
9.  **Extract `Starfield`:** Move star creation logic to `entities/Starfield.js`.
10. **Extract `Planet`:** Move planet creation/interaction logic to `entities/Planet.js`.
11. **Extract `Structure`:** Move `makeStructure` and `structureData` to `entities/Structure.js`.
12. **Extract `Traffic`:** Move `TrafficCar` and related logic to `entities/Traffic.js`.
13. **Extract `MatrixCluster`:** Move `MatrixCluster` logic to `entities/MatrixCluster.js`.
14. **Extract `Terminal`:** Move `logTerminal`, `toggleTerminal`, `handleCmd` to `ui/Terminal.js`.
15. **Extract `Onboarding`:** Move `onboardStep`, `onboardMsgs`, `showOnboarding` to `ui/Onboarding.js`.
16. **Create `app.js`:** Orchestrate module loading and the main game loop.
17. **Modify `dark-city.html`:** Update to load the new module structure using `<script type="module">` or similar.

This modularization is crucial before we can truly graft PBR materials. It lays the groundwork for maintainability and extensibility, reducing the "Tax" of future development.

**PLT Score Update (Post-Oracle, Pre-Modularization):**
- **Profit:** 0.2 (Oracle's counsel integrated into refined plan)
- **Love:** 0.3 (Stronger architectural foundation being laid)
- **Tax:** 0.7 (Still high due to monolithic state, but a clear plan to reduce)
- **SCORE: -0.2** - A slight improvement as the path forward is clearer, but still in the red until actual refactoring begins.

---
Profit Prime, engaging Phase 2.
