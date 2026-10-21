# SKILL — P2P Decentralized Database

slug:: p2p_decentralized_db
phase:: 7
status:: planned
source:: https://github.com/orbitdb/orbitdb (8.8k⭐)
PLT:: Profit 0.6, Love 0.7, Tax 0.4

## Summary
WHEN citizens need to share a database without any central server — the city state IS the database. Archetype affinity: Sovereign, Explorer, Sage.

## Schema
- trigger: citizen.join_city() || city.broadcast() || db.sync_request()
- inputs: { action: "put"|"get"|"del"|"query", key: string, value?: any, db_name: "city_state"|"citizen_registry"|"event_log" }
- outputs: { hash: string, peers: number, confirmed: boolean }

## Consequence
Every citizen carries a full copy of the city database. Changes sync P2P via IPFS/libp2p — no server to go down, no central point of failure. The city becomes resilient to individual browser closures. New citizens bootstrap from any peer.

## Feedback
Citizen count updates as peers connect. Sync status bar shows "3 peers — up to date" or "syncing 12 new entries". Terminal: "OrbitDB: peer 12Qm... joined — city state replicated."

## States
| State | Behavior | Visual |
|---|---|---|
| IDLE | db open, awaiting operations | Green peer count |
| ACTIVE | syncing with peers | Spinning sync indicator |
| COOLDOWN | write buffer — debounce 200ms | Brief pause |
| ERROR | peer unreachable, IPFS offline | Yellow warning, retry in 5s |

## Composition
Combo with P2P Graph Sync (Gun) for relationship data, P2P Browser Streaming (WebTorrent) for large blob distribution, Browser SQL Engine (wa-sqlite) for local query of synced data.
