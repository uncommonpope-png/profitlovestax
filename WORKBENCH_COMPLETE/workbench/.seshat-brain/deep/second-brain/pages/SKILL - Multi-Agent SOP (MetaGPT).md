# SKILL — Multi-Agent SOP Execution

slug:: multi_agent_sop
phase:: 6
status:: planned
source:: https://github.com/FoundationAgents/MetaGPT (69.2k⭐)
PLT:: Profit 0.9, Love 0.4, Tax 0.4

## Summary
WHEN a complex process must follow a standard operating procedure. The pipeline gun — citizens execute SOPs as a team: product spec, architecture, implementation, review, test. Role-based execution from MetaGPT. Archetype affinity: Architect, Engineer, Critic.

## Schema
- trigger: new_project || user_request || team_assembled
- inputs: { sop_template: "feature"|"bugfix"|"research"|"deploy", roles_assigned: { product_manager: Citizen, architect: Citizen, engineer: Citizen, reviewer: Citizen }, requirements: string }
- outputs: { specification: Document, architecture: Document, code: Codebase, review_report: string, test_results: TestResult[] }

## Consequence
The city builds real things. Citizens generate specs, architectures, code, and tests in a documented pipeline. Quality gates prevent bad output from reaching production. The civilization becomes a software factory.

## Feedback
SOP pipeline board shows stages with handoff checkmarks. Documents appear in a shared log. Terminal: "SOP started — PRODUCT_MANAGER defining spec. ARCHITECT waiting. ETA: 4 cycles."

## States
| State | Behavior | Visual |
|---|---|---|
| IDLE | Pipeline empty | Stages grey |
| ACTIVE | SOP executing, role active | Stage highlighted, progress bar |
| COOLDOWN | Document handoff, quality gate | Parchment seal animation |
| ERROR | Gate failed, rollback required | Red X on stage, revert |

## Composition
Combo with Agent Team Orchestration (forms the team that runs the SOP), AI NPC Character Engine (personality affects role quality), GSK Voice System (SOP documents follow voice).
