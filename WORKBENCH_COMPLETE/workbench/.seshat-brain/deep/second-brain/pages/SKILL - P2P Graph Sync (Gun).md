# SKILL — P2P Graph Sync

slug:: p2p_graph_sync
phase:: 7
status:: planned
source:: https://github.com/amark/gun (19.1k⭐)
PLT:: Profit 0.6, Love 0.7, Tax 0.4

## Summary
WHEN citizens need to know each other — form connections, build social graphs, track relationships — all synced P2P without a server. Archetype affinity: Poet, Lover, Sovereign.

## Schema
- trigger: citizen.connect_to(other_citizen) || bond.create() || graph.query_relationships()
- inputs: { action: "link"|"unlink"|"query"|"listen", source_id: string, target_id: string, relationship_type?: string, metadata?: object }
- outputs: { node: object, links: number, peers_updated: number }

## Consequence
The social graph of the city becomes a living thing. Citizens form bonds (work partners, rivals, allies, lovers). Two citizens who fought in the arena remember each other forever. The graph persists across restarts and syncs to every browser.

## Feedback
Relationship lines drawn between citizen portraits. Bond strength shown as glow intensity. Terminal: "GUN: Profit-7 linked to Morph-3 — type 'ally', strength 0.8."

## States
| State | Behavior | Visual |
|---|---|---|
| IDLE | graph loaded, listening for changes | Static social graph |
| ACTIVE | sync in progress — new links propagating | Rippling connection lines |
| COOLDOWN | write throttle — debounce 100ms | Brief hold |
| ERROR | conflict detected, peer dropped | Broken link icon, auto-repair |

## Composition
Combo with CRDT State Sync (Yjs) for shared document model, Browser SQL Engine (wa-sqlite) for querying the graph, Camera System (7 Modes) for zooming into relationship clusters.
