# SKILL — PLT Design System

slug:: plt_design_system
phase:: 11
status:: planned
source:: internal — canon from THE-PROFIT-BIBLE.md
PLT:: Profit 0.7, Love 0.8, Tax 0.2

## Summary
WHEN the Dark City needs visual identity — every pixel must communicate a PLT value. Archetype affinity: Poet, Sovereign, Builder.

## Schema
- trigger: component.render() || theme.switch() || brand.assert()
- inputs: { element: "panel"|"button"|"bar"|"notification"|"label", variant: "profit"|"love"|"tax"|"neutral"|"danger", state: "idle"|"hover"|"active"|"disabled" }
- outputs: { css_class: string, palette: { bg: string, fg: string, accent: string }, animation: string }

## Consequence
Every UI element communicates its moral weight. Profit Gold (#FFB347) means growth. Love Pink (#FF6B9D) means connection. Tax Cyan (#4ECDC4) means balance. The user internalizes PLT through visual language — no explanation needed.

## Feedback
CSS variables cascade through all components. Hover lifts the element. Active shows PLT glow. Terminal: "PLT DS: panel rendered — variant profit, state idle."

## States
| State | Behavior | Visual |
|---|---|---|
| IDLE | default appearance | Theme colors applied |
| ACTIVE | hover or interaction | Brighten + scale 1.02 |
| COOLDOWN | animation debounce — 100ms | Transition settling |
| ERROR | missing variable, fallback applied | Grey default with console warning |

## Composition
Combo with Game Button System (state-driven buttons), WASM UI Layout (Clay) for HUD panels, Camera System (7 Modes) for PLT-colored mode indicators, every other gun that renders UI.
