# SKILL — 3JS Camera (The Observer)

slug:: 3js_camera
phase:: foundation
status:: active
source:: Three.js Core Grimoire
PLT:: Profit 0.5, Love 0.6, Tax 0.0

## Summary
The lens. The eye of the observer. Defines what the user sees of the Pyramid Library. PerspectiveCamera is the default, providing depth and parallax.

## Schema
- trigger: `new THREE.PerspectiveCamera(fov, aspect, near, far)`
- inputs: { fov, aspect, near, far, position, rotation }
- outputs: { projectionMatrix: Matrix4 }

## Consequence
- Renders the scene from a specific viewpoint.
- `fov` controls the intensity of the perspective — low fov = zoomed/distant, high fov = distorted/wide.
- `near` / `far` clips the world — things outside this range are invisible.

## Feedback
- View of the pyramid shifts as the user moves.

## States
| State | Behavior | Visual |
|---|---|---|
| ORBIT | Moving around central pyramid | 3D motion |
| FIRST-PERSON | Locked to a citizen/avatar | Subjective world view |
| CINEMATIC | Pre-defined path tween | Guided tour |

## Composition
- Controlled by `OrbitControls` for user exploration.
- Targeted by the `Tween` system for `startReading()` fly-ins.
