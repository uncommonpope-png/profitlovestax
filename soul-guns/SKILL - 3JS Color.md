# SKILL — 3JS Color (The Emissive Identity)

slug:: 3js_color
phase:: foundation
status:: active
source:: Three.js Core Grimoire
PLT:: Profit 0.8, Love 1.0, Tax 0.0

## Summary
Defines the visual frequency of an object. In our world, color is often synonymous with *identity* (archetype colors) and *energy* (emissive intensity).

## Schema
- trigger: `new THREE.Color(hex/rgb)` OR `material.color.setHex(...)`
- inputs: { r: number, g: number, b: number }
- outputs: { hex: number, style: string }

## Consequence
- Defines the archetype color for Citizens, temples, and nebulae.
- Used for Emissive properties, creating the glow that makes our world "feel" alive and cybernetic.

## Feedback
- Immediate visual shift in object appearance when changed.

## States
| State | Behavior | Visual |
|---|---|---|
| BASELINE | Normal lighting reflection | Natural/flat color |
| EMISSIVE | Self-illumination | Glow effect (crucial for "neon" aesthetic) |

## Composition
- Used in `MeshStandardMaterial` and `MeshBasicMaterial`.
- Central to the `GSKCityBridge` which mutates emissive colors based on GSK phase.
