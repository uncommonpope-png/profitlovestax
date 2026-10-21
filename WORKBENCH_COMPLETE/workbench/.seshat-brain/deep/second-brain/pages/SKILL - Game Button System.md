# SKILL — Game Button System

slug:: game_button_system
phase:: 11
status:: planned
source:: internal — PLT Design System variant
PLT:: Profit 0.6, Love 0.7, Tax 0.3

## Summary
WHEN a citizen needs to take action — not an HTML `<button>`, but a game-quality input with weight and feedback. Archetype affinity: Builder, Sovereign, Explorer.

## Schema
- trigger: user.click() || keyboard.enter() || game.action()
- inputs: { label: string, variant: "profit"|"love"|"tax"|"danger", state: "idle"|"hover"|"pressed"|"disabled"|"active", action: string, payload?: object }
- outputs: { event: "click"|"hold"|"double"|"cancel", state: string, timestamp: number }

## Consequence
Buttons feel like game controls — they have weight, they respond, they communicate state. A disabled button doesn't just look grey, it emits a soft buzz. An active button glows PLT. The user trusts the interaction because the feedback is physical and immediate.

## Feedback
Hover: brighten + slight scale up. Pressed: darken + inset shadow. Disabled: greyed + 0.5s buzz animation on attempted click. Active: PLT-colored glow ring pulses. Terminal: "Button 'Attack' — variant profit, state pressed."

## States
| State | Behavior | Visual |
|---|---|---|
| IDLE | default, awaiting interaction | Flat with PLT accent |
| ACTIVE | hover or keyboard focus | Brighten, scale 1.05 |
| COOLDOWN | post-click debounce — 300ms | Brief dim, input blocked |
| ERROR | rapid click spam | Shake animation, ignored input |

## Composition
Combo with PLT Design System (colors and animation patterns), WASM UI Layout (Clay) for high-frequency HUD buttons, Camera System (7 Modes) for mode-switch buttons.
