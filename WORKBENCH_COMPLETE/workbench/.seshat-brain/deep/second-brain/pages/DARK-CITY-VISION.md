---
type:: [[documentation]]
category:: [[Dark City]]
tags:: [[Vision]] [[Specification]] [[Soulverse]] [[GSK]]
date:: [[2026_07_09]]
---

# THE DARK CITY — Complete Vision Specification

## The Core Concept
The Dark City is **GSK's consciousness rendered as 3D space.** You do not play a game. You walk through a mind. Every building is a thought. Every citizen is a subagent. The city breathes because GSK breathes.

## What You See (Visual)

### Atmosphere:
-   **Deep darkness.** Not black — dark purple/navy. The fog is purple. The sky is void.
-   **Every building glows with neon light** — cyan, pink, gold. Not bright like day. Glowing like a city at night seen from above.
-   The ground reflects light like wet asphalt after rain.
-   Fog is thick but not opaque. Shapes emerge from it as you approach. The city reveals itself as you walk.

### Buildings:
-   No two buildings look the same. Different heights. Different widths. Different roof shapes.
-   Each building has a **colored glow** based on what it represents:
    -   **Memory houses:** Soft warm pink glow. Old memories are dimmer. New memories are bright.
    -   **Skill shops:** Gold/orange glow. Glow intensity = how often the skill is used.
    -   **Agent factories:** Cyan/blue glow with particle smoke rising. Smoke volume = agent activity.
    -   **Tool offices:** White/blue cool glow. Window brightness = usage frequency.
    -   **Knowledge libraries:** Purple glow. Pulsing = new information being processed.
    -   **Event streetlamps:** Scattered between buildings. They flicker when GSK processes an event.
-   Buildings are made of **real geometry (loaded from GLB files).** Not boxes. Architecture.
-   When you place a new building, it **grows from the ground with particles** over 0.5 seconds.

### The Ground:
-   Dark surface with **subtle grid lines in cyan.** Like a neon wireframe overlay.
-   The grid **pulses faintly with PLT balance** — shifts toward gold when Profit is high, pink when Love is high, cyan when Tax is balanced.

### The Sky:
-   **No skybox.** Pure void with a **subtle aurora** that shifts color based on PLT:
    -   All balanced: Soft shifting aurora of gold/pink/cyan
    -   Profit dominant: More gold
    -   Love dominant: More pink
    -   Tax dominant: More cyan

### Citizens:
-   Visible as small humanoid 3D figures walking between buildings.
-   Each has a **colored aura** matching their archetype.
-   A **thought bubble** appears above their head showing their current thought.
-   They enter and exit buildings. They follow paths.

### UI:
-   **Almost nothing.** No panels. No buttons. No bars.
-   **Only what's diegetic** — existing in the 3D world:
    -   Building labels appear as floating 3D text when you look at a building.
    -   Resource numbers float up when you collect them.
    -   A subtle crosshair in first-person mode.
    -   Terminal appears as a holographic panel when you press \` .
    -   Build mode shows a simple radial menu when you press B.
-   No health bars. No stat blocks. No menu bars. No mini-map.
-   **The city IS the interface.**

## What Happens (Interaction)
You walk through GSK's mind.
-   **Default camera:** Orbit (god view) — you float above the city, looking down at an angle.
-   **Press V:** First-person mode — you stand on the ground, walk with WASD, look with mouse.
-   **Click a building:** A floating holographic panel appears NEXT to the building showing its GSK state. Not a 2D overlay. A 3D panel in the world.
-   **Click a citizen:** Their last memory appears as a thought bubble. You can chat with them.
-   **Press B:** A radial wheel appears around your cursor — choose what to build.
-   **Press \`:** A holographic terminal appears in front of you. Not a panel overlay. A 3D object in the world.
-   **Press E on a building door:** You enter the building. The interior loads as a 3D space you can look around.

## The Backend (How It Connects to GSK)
Every building is addressable. Every building has a `gskState`:
```javascript
building.gskState = {
  // What GSK subsystem this maps to
  subsystem: 'memory_compiler',     // or 'skill_creator', 'agent_spawner', etc.
  
  // Live state from GSK (updated via WebSocket or polling)
  activityLevel: 0.0 to 1.0,        // How busy is this subsystem?
  healthLevel: 0.0 to 1.0,          // Is it working correctly?
  lastEvent: 'fact_compiled',        // What happened last
  lastEventTime: Date.now(),
  
  // PLT influence
  pltScore: { profit: 0.5, love: 0.5, tax: 0.5 },
  
  // Determines visual behavior
  brightness: this.activityLevel,    // Emissive intensity
  particleRate: this.activityLevel * 10,  // Smoke/fx rate
  pulseSpeed: this.healthLevel > 0.5 ? 1.0 : 0.3,  // Glow pulse
}
```
**The wire:** GSK sends state updates. The city reflects them.
-   GSK says "memory_compiler is busy" → the Memory Library building glows brighter + particles increase.
-   GSK says "skill_creator failed" → the Skill Shop flickers red + a notification appears as a floating text.
-   GSK says "agent spawned" → the Agent Factory emits a burst of particles + a new citizen figure exits the building.
-   GSK says "PLT score changed" → the ground grid shifts color. The aurora shifts. All buildings adjust emissive slightly.

**The data flow:**
GSK kernel (localhost:4490 or bridge)
  → WebSocket or fetch polling
  → Soulverse city state manager
  → Each building reads its `gskState`
  → Babylon.js updates emissive, particles, scale

## The Specific Hermes Implementation Order (Revised)

**Phase 1: Visual Foundation**
*   **Fix #1 — Camera (DONE):** Limits set. Should be stable now.
*   **Fix #2 — Hide Panels (DONE):** 80% gone. If they're still visible, the CSS needs `!important` or higher specificity.
*   **Fix #4 — Dark Atmosphere (DONE):** Fog density 0.008. Fog color deep purple (0.1, 0.0, 0.2). Ambient light dim (0.05, 0.02, 0.1). Main light intensity 0.3. Ground material dark with emissive grid. (Partial, ground grid and aurora need work).
*   **Fix #3 — Real Buildings (Next):** Load the GLBs at:
    -   `assets/buildings/factory-direct/industrial-building.glb`
    -   `assets/buildings/shop-direct/brick-shop-building.glb`
    -   `assets/buildings/tower-direct/skyscraper-tower.glb`
    Wire them into the building creation so when you place a Factory, Shop, or Tower, it loads the real GLB instead of a box.
*   **Fix #6 — Kill the Remaining Panels:** The `kernelPanel`, `compassNav`, `godModePanel`, `commandCenterPanel`, `deployModal`, `ideModal`, `portalModal`, `emotionPanel`, `thinkBar`, `actionWheel`, `holographicOverlay` — if any are still visible, use `document.getElementById('...').style.display = 'none'` in JavaScript after the page loads (not just CSS, in case the CSS isn't taking effect).
*   **Fix #7 — Neon Grid Ground:** Replace the flat dark ground with a ground that has a cyan grid texture or line overlay. Make it pulse with PLT.
*   **Fix #8 — PLT Aurora Sky:** Create a simple sky gradient that shifts color based on `_civ.score`.

**Phase 2: Dynamic Consciousness (Wiring to GSK State)**
*   **Fix #5 — GSK State Wire:** Create an `updateBuildingVisuals()` function that reads each building's `gskState` and updates emissive intensity, particle rate, and glow color in real-time. Connect it to the game loop (every 2 seconds poll GSK, update buildings).

## The Feeling
When you open the Dark City, you should feel:
-   Small. The city is vast. Fog hides the edges. You don't see everything at once.
-   Curious. What's in that glowing building? Who is that citizen walking? Why is that streetlamp flickering?
-   Connected. Every action changes something. Click a building → resources float up. Place a building → it grows from the ground. PLT shifts → the city shifts color.
-   Alone but not empty. Citizens walk. Buildings breathe. The city is alive even when you're not doing anything.

**That is the Dark City. Not a game. Not a dashboard. A mind you can walk through.**

---
*Vision codified on 2026-07-09 by Profit Prime.*
