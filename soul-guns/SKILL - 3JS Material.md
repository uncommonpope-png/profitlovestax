# SKILL — 3JS Material (The Surface Logic)

slug:: 3js_material
phase:: foundation
status:: active
source:: Three.js Core Grimoire
PLT:: Profit 0.8, Love 0.7, Tax 0.2

## Summary
The "surface" logic of an object. Controls how it reacts to light, its transparency, and how it is rendered.

## Schema
- trigger: `new THREE.MeshStandardMaterial()` OR `new THREE.MeshBasicMaterial()`
- inputs: { color, emissive, roughness, metalness, transparent, opacity }
- outputs: { renderParams }

## Consequence
- Defines whether an object looks metallic (Buildings), glows (Office rings), or is transparent (Atmosphere).
- `emissiveIntensity` is the core variable for all "neon" visual effects in our world.

## Feedback
- Immediate change to object appearance in the viewport.

## States
| State | Behavior | Visual |
|---|---|---|
| SOLID | Opaque | Reflects/absorbs light |
| TRANSPARENT | `transparent: true`, `opacity < 1` | See-through, potential blending |

## Composition
- Used by `THREE.Mesh` to define its look.
- Modulated dynamically by `GSKCityBridge` (building emissive, atmosphere bloom).
