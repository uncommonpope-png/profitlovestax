# SKILL — CRDT State Sync

slug:: crdt_state_sync
phase:: 7
status:: planned
source:: https://github.com/yjs/yjs (22.1k⭐)
PLT:: Profit 0.6, Love 0.8, Tax 0.3

## Summary
WHEN multiple citizens need to edit the same state and both changes must survive — no conflicts, no last-write-wins. Archetype affinity: Sage, Sovereign, Builder.

## Schema
- trigger: citizen.edit_shared_state() || provider.sync() || awareness.broadcast()
- inputs: { doc_id: string, update?: Uint8Array, awareness?: object, provider_type: "webrtc"|"websocket"|"memory" }
- outputs: { state: object, peers: number, clock: number, awareness: Map }

## Consequence
Two citizens edit the same building and both changes merge automatically. No conflicts, no data loss. The shared document model means every browser sees the same city — changes propagate in real-time via CRDT merge magic.

## Feedback
Edit indicators show who is editing what. Cursor positions visible for shared documents. Terminal: "Yjs: doc 'city-state' — 3 peers, clock 142, merge OK."

## States
| State | Behavior | Visual |
|---|---|---|
| IDLE | doc synced, awaiting edits | Green sync dot |
| ACTIVE | update propagating to peers | Blue pulse on merge |
| COOLDOWN | awareness throttle — debounce 50ms | Brief hold |
| ERROR | provider disconnected, doc diverged | Red dot, auto-reconnect |

## Composition
Combo with JSON CRDT Sync (Automerge) as fallback for identity documents, P2P Graph Sync (Gun) for relationship awareness, Browser SQL Engine (wa-sqlite) for persistent local snapshot.
