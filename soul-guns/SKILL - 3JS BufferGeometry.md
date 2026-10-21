# SKILL — 3JS BufferGeometry (The Shape)

slug:: 3js_buffergeometry
phase:: foundation
status:: active
source:: Three.js Core Grimoire
PLT:: Profit 0.9, Love 0.6, Tax 0.0

## Summary
The raw shape of an object, defined by vertices, faces, normals, and UVs. All geometries in our world (Box, Sphere, Capsule, Ring, etc.) inherit from this.

## Schema
- trigger: `new THREE.BoxGeometry()` OR `new THREE.SphereGeometry()`
- inputs: { attributes: { position, normal, uv } }
- outputs: { a renderable mesh shape }

## Consequence
- Defines the shape of all objects in the Library, City, and Heavens.
- Performance is directly tied to the complexity of the geometry (vertex count).

## Feedback
- The visible shape of every object.

## States
| State | Behavior | Visual |
|---|---|---|
| IDLE | Created | Can be used by a Mesh |
| MODIFIED | Vertices updated | Shape changes in real-time |

## Composition
- Used by `THREE.Mesh` to define its shape.
- Foundation for all procedural generation (citizens, buildings, etc.).
