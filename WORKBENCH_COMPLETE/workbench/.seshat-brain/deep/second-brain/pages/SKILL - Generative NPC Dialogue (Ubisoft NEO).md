# SKILL — Generative NPC Dialogue

slug:: generative_npc_dialogue
phase:: 6
status:: planned
source:: https://news.ubisoft.com/en-gb/article/5qXdxhshJBXoanFZApdG3L/ (Ubisoft NEO NPCs)
PLT:: Profit 0.5, Love 0.9, Tax 0.2

## Summary
WHEN a citizen speaks and the conversation is real. The voice gun — no dialogue trees. Citizens generate responses dynamically from personality, memory, situation, and relationship. Archetype affinity: Poet, Lover, Sage.

## Schema
- trigger: user_chat || citizen_to_citizen || narrative_event
- inputs: { speaker_id: string, listener_id: string, context: string, relationship_history: RelationshipEntry[], emotional_state: string }
- outputs: { response: string, emotional_delta: number, relationship_delta: number, memory_created: boolean }

## Consequence
Conversations feel alive. Citizens remember what was said. Relationships deepen or sour. Dialogue becomes a mechanic — persuade, bargain, befriend, betray. The city's social fabric is woven in words.

## Feedback
Chat bubble appears with citizen's portrait. Text types out character-by-character. Emotion icon shifts during conversation. Terminal logs: "Wanderer-1: 'I remember you. You were there when the volcano came.'"

## States
| State | Behavior | Visual |
|---|---|---|
| IDLE | Silent, waiting | Chat bubble hidden |
| ACTIVE | Generating response | Text typing, thought indicator |
| COOLDOWN | Processing relationship delta | Subtle glow fade |
| ERROR | Context overflow, incoherent response | Gibberish, reset |

## Composition
Combo with AI NPC Character Engine (feeds personality + memory), Emergent Storytelling (dialogue becomes chronicle entries), GSK Voice System (consistent tonal layer).
