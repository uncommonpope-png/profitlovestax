# SKILL — 3JS Vector3 (The Position & Direction)

slug:: 3js_vector3
phase:: foundation
status:: active
source:: Three.js Core Grimoire
PLT:: Profit 0.9, Love 0.7, Tax 0.0

## Summary
The fundamental unit of spatial information. Defines position, direction, and scale in 3D. All movement, placement, and size are dictated by Vector3s.

## Schema
- trigger: `new THREE.Vector3(x, y, z)` OR `object.position.copy(anotherVector)`
- inputs: { x: number, y: number, z: number }
- outputs: { length: number, normalizedVector: Vector3 }

## Consequence
- All Soul Golems (Citizens, Buildings, Planets) occupy a specific point in space.
- Movement is calculated by adding/subtracting vectors.
- Raycasting relies on vectors to define the ray and intersection points.

## Feedback
- Not directly visual, but changes to vectors result in visible object transformations.

## States
| State | Behavior | Visual |
|---|---|---|
| IDLE | Stationary | Object at fixed position |
| MOVING | Vector components change | Object translates/rotates |

## Composition
- Used by `Object3D.position`, `rotation`, `scale`.
- Central to `Raycaster` for origin and direction.
- Foundation for all `animate()` loop calculations for movement.
