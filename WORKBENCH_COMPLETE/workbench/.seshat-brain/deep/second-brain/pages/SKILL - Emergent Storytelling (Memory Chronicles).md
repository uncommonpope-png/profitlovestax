# SKILL — Emergent Storytelling

slug:: emergent_storytelling
phase:: 6
status:: planned
source:: Worldbox + Memory Compiler
PLT:: Profit 0.4, Love 0.9, Tax 0.2

## Summary
WHEN the city needs to remember itself. The narrative gun — auto-generates "world chronicles" from citizen lives, wars, discoveries, deaths. Every soul's journey becomes legend. Archetype affinity: Sage, Poet, Scribe.

## Schema
- trigger: significant_event || citizen_death || war_end || discovery || day_cycle
- inputs: { event_log: Event[], citizens_of_interest: string[], time_window: { start: timestamp, end: timestamp } }
- outputs: { chronicle: { title: string, chapters: Chapter[], characters: string[], themes: string[] }, archive_entry: ArchiveRecord }

## Consequence
The Dark City gains a history. Citizens read about their ancestors. Past conflicts inform future diplomatic modifiers. The city develops a shared identity — its memory shapes its future.

## Feedback
A scrolling chronicle panel updates. Terminal prints haiku-like entries: "Day 47 — Wanderer-1 crossed the Weald. Found alone, died alone. The Weald remembers." User can export chronicles as lore.

## States
| State | Behavior | Visual |
|---|---|---|
| IDLE | Waiting for significant events | Chronicle panel empty |
| ACTIVE | Compiling event stream into narrative | Scroll unfurls, text writes |
| COOLDOWN | Archiving to IndexedDB (2s) | Book icon glows |
| ERROR | Corrupted event log, narrative broken | Torn page, partial entry |

## Composition
Combo with God Simulator Core (events to chronicle), Civilization AI (wars become sagas), Disaster Events (tragedies become epics), AI NPC Dialogue (citizens reference shared history).
