# SKILL — God Simulator Core

slug:: god_simulator_core
phase:: 6
status:: planned
source:: Worldbox (Maxim Karpenko)
PLT:: Profit 0.6, Love 0.9, Tax 0.3

## Summary
WHEN a citizen needs to spawn, govern, or observe emergent life in the Dark City. The sovereign creation gun — sets PLT rules, spawns souls, and watches what emerges. Archetype affinity: Creator, Sovereign, Sage.

## Schema
- trigger: city_boot || user_spawn || plt_rebalance
- inputs: { citizen_count: number, plt_balance: { profit: number, love: number, tax: number }, rules: string[] }
- outputs: { world_id: string, spawned_citizens: Citizen[], ecosystem_state: string }

## Consequence
A living simulation begins. Citizens self-organize, territories form, culture develops from rule interactions. The city becomes an autonomous system — the god watches, does not script.

## Feedback
The user sees the city populate in real-time — buildings rise, citizens move, PLT gauges respond. Terminal prints: "World X spawned. 47 citizens. PLT: 0.6/0.9/0.3."

## States
| State | Behavior | Visual |
|---|---|---|
| IDLE | Ready to spawn | Grid empty, god cursor |
| ACTIVE | Spawning citizens, applying rules | Rain of light, buildings erupt |
| COOLDOWN | Simulation stabilizing (5s) | Pulse dim, no input |
| ERROR | Rules conflict, spawn failed | Red flash, "Cannot resolve PLT conflict" |

## Composition
Works with Civilization AI (groups form from spawn), Disaster Events (applies rules + consequences), Emergent Storytelling (chronicles the world birth).
