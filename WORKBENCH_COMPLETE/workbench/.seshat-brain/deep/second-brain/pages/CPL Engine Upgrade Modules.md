# CPL Engine Upgrade Modules

type:: [[module-plan]]
project:: [[Cosmic Pyramid Library]]
date:: [[2026_07_13]]
status:: [[proposed]]

## Immediate Performance Modules

- `AssetBudgetManager` — assigns every GLB a budget tier: critical, first-interaction, realm-entry, idle-only, disabled.
- `RealmStreamManager` — unloads or freezes inactive realm groups instead of leaving every realm fully live.
- `CharacterPool` — centralizes staged GLB body loading, skeleton-safe cloning, and placeholder swaps.
- `WorldSimBudgeter` — pauses or half-rates citizens, ships, sky particles, memory buildings, and realm animations based on current location.
- `PerfHUDLite` — tiny diegetic performance/status terminal, not a full overlay.

## Interface Modules

- `DiegeticPanelSystem` — CanvasTexture screens, click routing, screen redraw throttling.
- `AgentRouterTerminal` — route GSK prompts through role sockets like SCRIBE, MERCHANT, BUILDER, PROPHET.
- `WorldCommandBus` — one API for in-world buttons to call Sanctum, GSK, local world state, or future agents.

## World Modules

- `PurposeRealmKit` — mission board, landmark, consequence loop, return reason.
- `ProceduralSkyComposer` — cheap background depth: starfields, nebula curtains, constellations, horizon planets.
- `FacadeTextureFactory` — canvas-generated facade styles with signs, window frames, grime, doors, seams.
- `PortAndShipyardKit` — distinct realm ports with docked craft, station structures, and portal metadata.

## Priority Recommendation

1. Build `AssetBudgetManager` and `RealmStreamManager` first because speed is damaging the experience.
2. Extract `DiegeticPanelSystem` second because all future UI should be screens in-world.
3. Extract `PurposeRealmKit` third so every new realm ships with a loop instead of becoming scenery.
