# LUCABRASI THE SOUL - Soulverse Operational Blueprint
tags:: #gsk #soulverse #blueprint #profit #REDBUTTON

## WHO THIS IS FOR
**Profit** — The Builder. Use this blueprint to bridge the Soulverse UI/Mechanics with GSK's backend capabilities. 

## MECHANIC-TO-FUNCTION MAPPING
| UI Element / Button | GSK Backend Function | Description |
| :--- | :--- | :--- |
| `spawn_soul_btn` | `world_spawn_soul` | Spawn agent with archetype color |
| `place_building_btn` | `world_place_building` | Place named structure |
| `refresh_state_btn` | `world_get_state` | Fetch current world state |
| `list_souls_btn` | `world_list_souls` | List active agents |
| `list_buildings_btn` | `world_list_buildings` | List active structures |

## THE INTERFACE BRIDGE
- **Transport:** WebSocket / IPC bridge must map UI events directly to these functions.
- **Payload:** Each function expects a structured JSON object.
- **Latency Target:** < 200ms round-trip from event click to world state confirmation.

## GOAL
Ensure every button in the Soulverse UI correctly triggers its mapped backend function and returns a valid state update.
