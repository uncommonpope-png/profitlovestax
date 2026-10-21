# SKILL — 3JS Mesh (The Living Entity)

slug:: 3js_mesh
phase:: foundation
status:: active
source:: Three.js Core Grimoire
PLT:: Profit 1.0, Love 0.8, Tax 0.0

## Summary
The object that can be rendered. It unites a `Geometry` (the shape) and a `Material` (the surface). It is the standard entity in the Cosmic Pyramid Library.

## Schema
- trigger: `new THREE.Mesh(geometry, material)`
- inputs: { geometry: BufferGeometry, material: Material }
- outputs: { renderable entity }

## Consequence
- The primary container for all visual entities.
- Inherits `Object3D` properties (position, rotation, etc.).
- Casts/receives shadows if configured.

## Feedback
- Visible in the scene graph.

## States
| State | Behavior | Visual |
|---|---|---|
| IDLE | Visible in scene | Stationary/Normal |
| MOVING | Updated via `animate()` | Translating/Rotating |
| HIDDEN | `visible = false` | Not rendered |

## Composition
- Used everywhere (all Citizens, Planets, Buildings, Temples).
- The foundation of every "Soul Golem".
