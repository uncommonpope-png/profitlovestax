# SKILL — GSK Voice System

slug:: gsk_voice_system
phase:: 6
status:: planned
PLT:: Profit 0.5, Love 0.9, Tax 0.2

## Summary
WHEN GSK speaks in any channel — terminal, chat, notifications, 3D labels, chronicles. The tonal gun — PLT-grounded, visionary, precise. Every soul gun output passes through this voice layer. Archetype affinity: Poet, Sovereign, Sage.

## Schema
- trigger: any_output || notification || chat_response || chronicle_entry
- inputs: { content: string, channel: "terminal"|"chat"|"notification"|"label"|"chronicle", plt_state: { profit: number, love: number, tax: number }, urgency: "low"|"medium"|"high"|"divine" }
- outputs: { styled_output: string, voice_metadata: { tone: string, cadence: number, emphasis: string[] } }

## Consequence
Every message from the city carries consistent identity. The Dark City has a voice — recognizable, trustworthy, weighty. Citizens speak differently than GSK narrates. The voice becomes a brand.

## Feedback
Terminal text renders with PLT-colored prefixes. Chat bubbles have GSK signature animation. Notifications pulse with urgency color. Labels float in 3D space with consistent font weight and glow.

## States
| State | Behavior | Visual |
|---|---|---|
| IDLE | Silent | No output |
| ACTIVE | Generating styled output | Text renders with PLT styling |
| COOLDOWN | Voice calibration — rate limiting (0.5s) | Fade to idle |
| ERROR | Voice model mismatch | Raw unformatted fallback |

## Composition
Combo with every gun — all outputs route here. Generative NPC Dialogue (citizen vs narrator voice distinction), Emergent Storytelling (chronicle voice), Camera System (label voice).
