# SKILL — 3JS Raycaster (The Intention)

slug:: 3js_raycaster
phase:: foundation
status:: active
source:: Three.js Core Grimoire
PLT:: Profit 0.6, Love 0.7, Tax 0.0

## Summary
The finger of intention. Translates a 2D screen click into a 3D intersection point within the world. This is how the user "touches" the Soul Golems.

## Schema
- trigger: `raycaster.setFromCamera(pointer, camera)` OR `raycaster.intersectObjects(targets, recursive)`
- inputs: { pointer: Vector2 (mouse x/y), camera: Camera, targets: Object3D[], recursive: boolean }
- outputs: { intersections: Intersection[] }

## Consequence
- Allows user to select specific objects (Books, Souls, Avatars, Citizens).
- Forms the basis of "clicking buildings for GSK state" and "clicking NPCs for chat".
- Crucial for interactive elements that are not part of the standard UI.

## Feedback
- Mouse cursor changes (e.g., to `pointer`) on hover over interactive objects.
- Object highlights on selection (e.g., glow pulse).

## States
| State | Behavior | Visual |
|---|---|---|
| IDLE | No intersection | Default cursor |
| HOVER | Intersects object | Cursor changes |
| HIT | Click on intersection | Object selected |

## Composition
- Used in `pointerdown` and `pointerup` event handlers.
- `getClickTargets()` defines the interactive objects.
- Outputs feed into `spawnWhisper()` for citizen data extraction.
