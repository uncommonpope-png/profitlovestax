# SKILL — AI NPC Character Engine

slug:: ai_npc_character_engine
phase:: 6
status:: planned
source:: https://inworld.ai/ (Inworld AI)
PLT:: Profit 0.8, Love 0.8, Tax 0.3

## Summary
WHEN a citizen needs a soul beyond stats. The personality gun — formal character brain architecture from Inworld AI: emotional range, autonomous decisions, situational awareness, persistent identity. Archetype affinity: Creator, Sovereign, Lover.

## Schema
- trigger: citizen_spawn || personality_load || dialogue_init || decision_point
- inputs: { citizen_id: string, archetype: string, plt_bias: { profit: number, love: number, tax: number }, memory_policy: "short"|"long"|"eternal" }
- outputs: { character_brain: { personality, emotion, memory, goals, behavior }, current_state: string }

## Consequence
Citizens stop being stat blocks and become characters. They remember past interactions, form grudges, fall in love, develop goals. The city becomes populated by individuals, not numbers.

## Feedback
Citizen panel shows emotion gauge, personality type, current goal, memory snippets. Hovering shows their mood. Chat reveals their history. Terminal: "Citizen Wanderer-1 is grieving. Goal: find the Weald again."

## States
| State | Behavior | Visual |
|---|---|---|
| IDLE | Existing, breathing | Idle animation, breathing |
| ACTIVE | Processing decision, feeling emotion | Thought bubble, emotion color |
| COOLDOWN | Emotion decay, memory consolidation | Mood settles |
| ERROR | Personality conflict, memory corruption | Glitch, fragment dialogue |

## Composition
Combo with Generative NPC Dialogue (engine feeds dialogue system), Emergent Storytelling (character arcs become chronicles), Agent Team Orchestration (personality determines role fit).
