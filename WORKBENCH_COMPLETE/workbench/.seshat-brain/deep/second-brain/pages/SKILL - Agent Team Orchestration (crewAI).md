# SKILL — Agent Team Orchestration

slug:: agent_team_orchestration
phase:: 6
status:: planned
source:: https://github.com/crewAIInc/crewAI (55k⭐)
PLT:: Profit 0.9, Love 0.6, Tax 0.3

## Summary
WHEN one citizen alone is not enough. The delegation gun — citizens form teams with roles. Researcher delegates to Builder, Scout reports to Strategist. Role-based autonomous orchestration from crewAI. Archetype affinity: Leader, Merchant, Architect.

## Schema
- trigger: task_complexity > 1 || task_requires_domain_expertise || user_command
- inputs: { task: { description: string, required_roles: string[] }, team_composition: Citizen[], process_mode: "sequential"|"hierarchical"|"debate" }
- outputs: { task_result: any, role_performance: { role: string, score: number }[], artifacts: Artifact[] }

## Consequence
The city gains productive capacity. Complex projects decompose into parallel workstreams. Citizens specialize, train each other, form guilds. The civilization accelerates through organized collaboration.

## Feedback
Team panel shows role cards, task progress bars, handoff arrows. Terminal: "Team formed — Researcher Profit-7, Builder Love-3, Scout Tax-1. Task: Expand district. Progress: 60%."

## States
| State | Behavior | Visual |
|---|---|---|
| IDLE | No team active | Citizens solo |
| ACTIVE | Team executing tasks | Connection lines, progress rings |
| COOLDOWN | Handoff between roles | Arrow pulse between cards |
| ERROR | Role conflict, task deadlock | Red link, timeout warning |

## Composition
Combo with Multi-Agent SOP (teams execute SOPs), AI NPC Character Engine (personality determines role fit), Civilization AI (guilds become factions).
