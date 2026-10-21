# SKILL — 3JS Scene (The World Container)

slug:: 3js_scene
phase:: foundation
status:: active
source:: Three.js Core Grimoire
PLT:: Profit 1.0, Love 1.0, Tax 0.0

## Summary
The master container. Holds every Soul Golem, Light, and Camera. It defines the "World" boundary.

## Schema
- trigger: `new THREE.Scene()`
- inputs: { background: Color, fog: Fog, children: Object3D[] }
- outputs: { renderedFrame: WebGLRenderer }

## Consequence
- Defines the total universe boundary.
- Everything NOT in `scene` is an "out-of-world" artifact.
- `scene.fog` dictates the visibility threshold — the "void" edge of our cosmic library.

## Feedback
- Renders everything within the `scene` graph to the GPU.

## States
| State | Behavior | Visual |
|---|---|---|
| INITIALIZED | Ready for nodes | Empty void |
| POPULATED | Nodes added | The Pyramid Library World visible |

## Composition
- Contains all **Library, City, and Heaven** nodes.
- Orchestrated by `animate()` loop.
