# SKILL — JSON CRDT Sync

slug:: json_crdt_sync
phase:: 7
status:: planned
source:: https://github.com/automerge/automerge (14.7k⭐)
PLT:: Profit 0.6, Love 0.8, Tax 0.3

## Summary
WHEN citizen identity needs conflict-free merging across tabs and devices — Automerge treats JSON as a CRDT so two edits to the same citizen file both survive. Archetype affinity: Scribe, Lover, Explorer.

## Schema
- trigger: citizen.identity_edit() || profile.update() || doc.merge()
- inputs: { doc_id: string, patch?: object, actor_id: string, merge_strategy: "last_write_wins"|"crdt_merge" }
- outputs: { doc: object, changes: number, peers: string[], history: object[] }

## Consequence
Citizen identity becomes immutable history. Edit one citizen.json from two tabs — both changes survive. The full edit history is preserved, enabling undo, replay, and accountability. Identity is a document, not a snapshot.

## Feedback
Diff view shows incoming changes from other peers. History slider lets you rewind identity state. Terminal: "Automerge: doc 'citizen-morph-3' — 2 pending changes merged."

## States
| State | Behavior | Visual |
|---|---|---|
| IDLE | doc loaded, no pending changes | Green checkmark |
| ACTIVE | merge in progress | Diff lines animate |
| COOLDOWN | change buffer — debounce 100ms | Brief pause |
| ERROR | merge conflict — actor clock skew | Yellow warning, manual resolution |

## Composition
Combo with CRDT State Sync (Yjs) for city-wide state (Automerge for identity-specific), P2P Decentralized DB (OrbitDB) for persistent storage of history, WASM UI Layout (Clay) for rendering edit history timeline.
