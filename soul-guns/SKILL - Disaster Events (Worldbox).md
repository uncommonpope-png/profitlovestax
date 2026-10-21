# SKILL — Disaster Events

slug:: disaster_events
phase:: 6
status:: planned
source:: Worldbox (Maxim Karpenko)
PLT:: Profit 0.3, Love 0.3, Tax 0.9

## Summary
WHEN the city needs drama, adaptation, or cosmic consequence. The chaos gun — volcanoes, plagues, madness, meteors, droughts. Not bugs, features. Forces evolution through catastrophe. Archetype affinity: Destroyer, Weaver, Sage.

## Schema
- trigger: plt_extreme_imbalance || random_rare_event || user_input || error_count
- inputs: { disaster_type: "volcano"|"plague"|"madness"|"meteor"|"drought", severity: number, target: { district_id?: string, citizen_id?: string } }
- outputs: { destroyed_buildings: string[], affected_citizens: Citizen[], crater_sites: Position[], new_plt_balance: PLT }

## Consequence
Buildings collapse, citizens flee or die, districts become uninhabitable. Survivors adapt — new traits emerge, culture shifts toward survival. The city scars and heals, stronger or broken.

## Feedback
Screen shakes. Disaster animation plays. Terminal: "VOLCANO — District Profitus destroyed. 12 citizens lost. Crater remains." Recovery phase shown as rebuild timer. PLT gauges spike red.

## States
| State | Behavior | Visual |
|---|---|---|
| IDLE | Watching, waiting | Sky clear |
| ACTIVE | Disaster in progress | Screen shake, particle chaos |
| COOLDOWN | Recovery phase — rebuild timer | Rubble, grey overlay |
| ERROR | Cascade failure — too many simultaneous | System alert, emergency halt |

## Composition
Combo with Civilization AI (war follows disaster), Emergent Storytelling (chronicles the tragedy), AI NPC Dialogue (survivors tell their story), Camera System (cinematic disaster shot).
