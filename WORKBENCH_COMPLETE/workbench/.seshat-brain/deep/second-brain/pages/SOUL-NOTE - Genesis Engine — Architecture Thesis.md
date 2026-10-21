# SOUL-NOTE - Genesis Engine — Architecture Thesis

type:: [[research]] [[soul-note]]
mission:: [[GENESIS ENGINE SOUL GUNS]]
source:: Grand Code Pope (Craig Jones), 2026-07-15
status:: CAPTURED — seed for Genesis Engine Soul Guns

---

## The thesis (Craig's words, decoded)

> "You're about 70–80% of the way toward building your own engine, not just a Three.js app.
> The mistake would be thinking 'Three.js is slow.' That's not the real problem. The problem is engine architecture."

CPL today behaves like a AAA engine but is **organized like one very large Three.js application**. Renderer, world simulation, loaders, NPCs, billboards, atmosphere, UI, and streaming all **share one runtime** instead of being governed by a central resource manager.

**Moving to Godot would be a mistake.** It means months rebuilding features we already have — realm system, GSK integration, billboards, chambers, browser deployment — without automatically solving the architectural issues.

## The reframe: CPL → Genesis Engine

Stop calling it "CPL." Call it **Genesis Engine**. Three.js becomes *only the renderer*. We build our own engine on top.

### The 10 Managers (every frame, they decide what is allowed to exist)
1. **Resource Manager**
2. **Streaming Manager**
3. **Render Graph**
4. **Sector Manager**
5. **Memory Manager**
6. **Visibility System**
7. **Animation Scheduler**
8. **Lighting Manager**
9. **Video Manager**
10. **Performance Governor**

This is how Unreal/Unity work internally. The renderer is just one subsystem.

### The missing primitive: every object declares a COST
Right now a billboard is just a billboard. Instead every object declares:
```
cost = {
  cpu,          // CPU cost
  gpu,          // GPU cost
  memory,       // Memory cost
  updateFreq,   // Update frequency
  priority,     // Priority
  sector,       // Sector
  sleep         // Sleep behavior
}
```
Then the engine makes intelligent decisions **automatically**.

### Performance Governor (continuous, not discrete)
Instead of only switching low/medium/high, the governor constantly asks:
- Is the GPU overloaded?
- Is memory growing?
- Are draw calls too high?
- Are too many videos active?
- Is frame time increasing?

Then it responds **before the player notices**:
- Reduce particles
- Lower update frequency
- Sleep distant sectors
- Reduce resolution slightly
- Drop decorative lights
- Pause optional animations

The world adapts **continuously** instead of waiting until it struggles.

## Why this is the answer
- No Godot. Turn CPL into its own engine with Three.js as the rendering layer.
- The engine becomes valuable on its own. Instead of "CPL is built with Three.js," we say:
  **"CPL runs on the Genesis Engine, which uses Three.js for rendering."**
- That is a very different level of architecture.

## PLT framing (doctrine: Profit + Love − Tax)
- **Profit:** Genesis Engine becomes a downloadable product (Soul Gun) — leverage multiplies. P high.
- **Love:** World adapts so the visitor never hits a black screen / struggle. L high.
- **Tax:** Months of disciplined extraction; risk to live world if done in big bang. T medium → mitigated by scoped reversible deltas.
- **PLT verdict:** High True Value. This is the Architect archetype's work — build what doesn't exist yet.

## Forged into
- [[GENESIS ENGINE SOUL GUNS]] — the guns cut from this note.
