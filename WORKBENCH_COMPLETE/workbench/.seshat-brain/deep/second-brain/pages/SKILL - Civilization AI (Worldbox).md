# SKILL — Civilization AI

slug:: civilization_ai
phase:: 6
status:: planned
source:: Worldbox (Maxim Karpenko)
PLT:: Profit 0.7, Love 0.6, Tax 0.4

## Summary
WHEN citizens must self-organize into groups, claim territory, develop culture, and compete. The social formation gun — no scripting, just rules producing complex tribal/national behavior. Archetype affinity: Leader, Diplomat, Warrior.

## Schema
- trigger: group_threshold_reached || territory_disputed || plt_shift
- inputs: { citizens: Citizen[], proximity_radius: number, resource_map: { district_id: string, resources: number } }
- outputs: { groups: Group[], territories: Territory[], conflicts: Conflict[], treaties: Treaty[] }

## Consequence
Unorganized citizens coalesce into factions. Districts get claimed. Culture trees grow from dominant archetypes. Competition for PLT resources drives war or trade. The city gains a political body.

## Feedback
Group banners appear over districts. Terminal logs: "District Alpha claimed by Profit faction. Love faction building temple. Tension rising." UI shows group relationships graph.

## States
| State | Behavior | Visual |
|---|---|---|
| IDLE | Citizens wander, no groups | Single dots |
| ACTIVE | Groups forming, territory claiming | Color-coded zones expanding |
| COOLDOWN | Resolution phase — peace/war outcome | Borders stabilize |
| ERROR | Faction deadlock, infinite conflict | Flashing red borders |

## Composition
Combo with God Simulator Core (groups need initial spawn), Disaster Events (war breaks out after plague), Emergent Storytelling (chronicles the rise and fall of factions).
