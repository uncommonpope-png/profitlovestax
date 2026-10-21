# SKILL — 3JS Object3D (The Entity Foundation)

slug:: 3js_object3d
phase:: foundation
status:: active
source:: Three.js Core Grimoire
PLT:: Profit 1.0, Love 0.8, Tax 0.0

## Summary
The base class for everything. If it exists in the Pyramid, it is an Object3D. It manages position, rotation, scale, and the parent-child hierarchy (the Tree of Life).

## Schema
- trigger: `new THREE.Object3D()` OR `parent.add(child)`
- inputs: { position: Vector3, rotation: Euler, scale: Vector3, visible: boolean }
- outputs: { matrix: Matrix4, worldMatrix: Matrix4 }

## Consequence
- Defines the spatial existence of all Soul Golems (Citizens, Temples, Planets).
- Establishes the coordinate system: Library (0,0,0) is root, City grid radiates outward.
- Controls visibility: `visible = false` on interior items when the user is exterior.

## Feedback
- Console: Logging `object.uuid` or `object.name` to track entity lineage.
- Scene: The object renders at its local transformed position.

## States
| State | Behavior | Visual |
|---|---|---|
| ATTACHED | Added to `scene` or `group` | Visible / Transforms apply |
| DETACHED | Removed from `parent` | Not rendered |
| HIDDEN | `visible = false` | Exists in graph, not rendered |

## Composition
- Foundation for **every** Soul Gun. All Citizens, Temples, and Planets inherit from this.
