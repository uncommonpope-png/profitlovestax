# SKILL — Browser SQL Engine

slug:: browser_sql_engine
phase:: 7
status:: planned
source:: https://github.com/rhashimoto/wa-sqlite (1.4k⭐)
PLT:: Profit 0.8, Love 0.4, Tax 0.4

## Summary
WHEN citizens need to query structured memory — thoughts, relationships, events — with SQL speed. Archetype affinity: Sage, Judge, Scribe.

## Schema
- trigger: citizen.query_memory() || system.gc() || city.report()
- inputs: { query: string, params?: any[], scope?: "global"|"citizen_id", db_name: "memories"|"relationships"|"events" }
- outputs: { rows: any[], duration_ms: number, affected?: number }

## Consequence
Citizens gain relational memory. `SELECT * FROM memories WHERE type='thought' ORDER BY importance DESC LIMIT 5` becomes possible. The city's IndexedDB is replaced with a queryable SQL engine — structured reports, relationship graphs, event timelines all servable via SQL.

## Feedback
Terminal shows SQL results as table. HUD shows query duration. Slow queries (>100ms) get a warning flash. Console: "wa-sqlite: 12 rows returned in 3ms."

## States
| State | Behavior | Visual |
|---|---|---|
| IDLE | db open, ready for queries | No indicator |
| ACTIVE | query executing | Spinner on terminal |
| COOLDOWN | write lock — debounce 50ms | Input queued |
| ERROR | malformed query, constraint violation | Red toast with SQLite error code |

## Composition
Combo with CRDT State Sync (Yjs) for shared query layer, P2P Graph Sync (Gun) for relationship queries, WASM UI Layout (Clay) for rendering query results as HUD panels.
