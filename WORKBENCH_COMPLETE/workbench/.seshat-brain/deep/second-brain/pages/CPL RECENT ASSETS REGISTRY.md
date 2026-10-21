---
title: CPL RECENT ASSETS REGISTRY
type: pattern
date: 2026-07-11
author: Dour
status: LIVE MAP UPDATED — Space City Phase 1 scale/zones/flight paths; six building/procedural GLBs deferred from sky placement
---

# CPL Recent Downloads — Asset Registry (Label + Map)

> Source: `C:\Users\uncom\Downloads` — the Pope's recent 3D downloads (GLB batch, 7/9–7/10).
> Goal: label every asset, map it to a world/level, show it in the Vault chat, then turn each
> into its own experience. Status legend: UNMAPPED → MAPPED → ACTIVE.
> 2026-07-11 correction: `procedural_city_5.glb`, `procedural_city_6.glb`, and `3105b839e14d4591b53ef77dfd30bc49.glb` remain DEFERRED from live Space City sky placement. `bionic_architecture.glb`, `futuristic_background_buildings_kit_volume_2.glb`, and `neighbourhood_city_modular_lowpoly.glb` were brought back as GROUND CITY DISTRICTS via `GroundCityKits` (commit d7ea23d) — real GLB geometry on the ground, not floating in the sky.
> 2026-07-11 Space City Phase 1 (`29dc639`): live sky city now loads 19 assets only, organized as Shipyard / Station Ring / Planet Orbit / Deep Space; ships/stations/planets use larger scale hierarchy and motion paths.

## ⚠ HARD CONSTRAINT — GitHub Pages 100 MB file limit
These files EXCEED 100 MB and CANNOT be pushed to GitHub Pages as-is. They MUST be run through
`gltfpack -cc` (Draco/Meshopt) to compress below the limit before any world build:
- `sentinel.glb` 111.5 MB
- `helveta_space_battle_ship.glb` 110.9 MB
- `sci-fi_space_station.glb` 110.2 MB
- `drogon__game_of_thrones_dragon.glb` (×2) 113 MB
- `lacrimosa_animated_-_neverness_to_everness.glb` (×3) 139.6 MB
- `3105b839e14d4591b53ef77dfd30bc49.glb` (unnamed/hash) 113.7 MB
Everything else is under 100 MB but should STILL be compressed (the perf build proved -cc cuts
~90 MB across the world). Total raw batch ≈ 2.5 GB — compress + be selective before pushing.

## District / World taxonomy (one experience per world; hero assets get solo levels)
1. **SPACE DOCK** — stations, ships, planets, astronauts, void
2. **CELESTIAL** (Heaven) — angels, basilica
3. **DRAGON REALM** — drogon, grigori
4. **ARENA** (DBZ) — buu, kai, goku, kaio
5. **NEON CITY** — procedural cities, building kits, circus, missile
6. **CATS REALM** — the cat cluster
7. **HALL OF HEROES** — baby yoda, matrix sentinel, vshojo, fountain, cheese moon
8. **CINEMATIC** (animated) — lacrimosa, floating astronaut, cat girl rigged, rhino

---

## Labeled + Mapped registry

### SPACE DOCK
| ID | File | MB | Animated | Notes |
|----|------|----|----------|-------|
| R-001 | sci-fi_space_station.glb | 110.2 | N | ❗>100MB compress | SPACE DOCK hero |
| R-002 | space_station_3.glb | 21.9 | N | station | SPACE DOCK |
| R-003 | space_station_4.glb | 21.7 | N | station | SPACE DOCK |
| R-004 | space_station_asteroid_mining_facility.glb | 43.5 | N | station+asteroids | SPACE DOCK |
| R-005 | helveta_space_battle_ship.glb | 110.9 | N | ❗>100MB | SPACE DOCK |
| R-006 | stranded_cargo_ship_giant_vessel_rusty_ship.glb | 42.1 | N | rusty freighter | SPACE DOCK |
| R-007 | sci-fi_personal_space_pod_shipweekly_challenge.glb | 6.75 | N | pod | SPACE DOCK |
| R-008 | sentinel.glb | 111.5 | N | ❗>100MB (Matrix) | SPACE DOCK / HALL |
| R-009 | sentinelle_-_matrix.glb | 59.5 | N | Matrix sentinel | SPACE DOCK / HALL |
| R-010 | earth_-_16k_high_resolution.glb | 17.2 | N | planet Earth | SPACE DOCK |
| R-011 | planet_beta_hydri___free_sample.glb | 1.02 | N | planet | SPACE DOCK |
| R-012 | planete_kaio.glb | 0.78 | N | DBZ planet (see ARENA) | ARENA |
| R-013 | cheese_moon.glb | 1.26 | N | meme moon | HALL OF HEROES |
| R-014 | space_exploration_wlp_series_8.glb | 3.86 | N | exploration rig | SPACE DOCK |
| R-015 | massive_morphoser_fourth_dimension.glb | 4.34 | N | abstract dimension | SPACE DOCK |
| R-016 | cats_space_suit_free_model.glb | 7.1 | N | cat in suit | CATS REALM |
| R-017 | cat_astronaut.glb | 3.25 | N | cat astronaut | CATS REALM |
| R-018 | franz_viehbocks_sokol_space_suit.glb | 7.21 | N | spacesuit | SPACE DOCK |
| R-019 | skull_in_astronaut_helmet.glb | 69.9 | N | skull astronaut | SPACE DOCK |
| R-020 | deep_impact_tv_from_the_matrix.glb | 1.12 | N | TV prop | HALL OF HEROES |
| R-021 | 3105b839e14d4591b53ef77dfd30bc49.glb | 113.7 | N | DEFERRED — residential building removed from Space City sky placement by Pope request | UNKNOWN / deferred |

### CELESTIAL (Heaven)
| ID | File | MB | Animated | Notes |
|----|------|----|----------|-------|
| R-022 | angel_custodio.glb | 43.6 | N | guardian angel | CELESTIAL hero |
| R-023 | guardian_angel_pet.glb | 26.5 | N | angel pet | CELESTIAL |
| R-024 | angelic_goat_stylized.glb | 26.8 | N | stylized angel goat | CELESTIAL |
| R-025 | stylized_angelic_cat.glb | 5.08 | N | angel cat | CELESTIAL / CATS |
| R-026 | basilica_of_notre_dame_de_fourviere.glb | 65 | N | church — heaven architecture | CELESTIAL |

### DRAGON REALM
| ID | File | MB | Animated | Notes |
|----|------|----|----------|-------|
| R-027 | drogon__game_of_thrones_dragon.glb (×2 dup) | 113 | N | ❗>100MB — dragon hero | DRAGON REALM |
| R-028 | dragons_dogma_grigori.glb | 11.4 | N | dragon | DRAGON REALM |

### ARENA (DBZ)
| ID | File | MB | Animated | Notes |
|----|------|----|----------|-------|
| R-029 | majin_buu.glb | 3.4 | N | Buu | ARENA |
| R-030 | grand_supreme_kai_-_dragon_ball_z.glb | 13.2 | N | Kai | ARENA |
| R-031 | kid_buu.glb | 2.6 | N | Kid Buu | ARENA |
| R-032 | dragon_ball_z_baby_goku.glb | 0.21 | N | Goku | ARENA |
| R-033 | dragon_ball_z_shin_budokai.glb | 0.08 | N | budokai stage | ARENA |

### NEON CITY
| ID | File | MB | Animated | Notes |
|----|------|----|----------|-------|
| R-034 | procedural_city_5.glb | 62.2 | N | DEFERRED — removed from live Space City sky placement; looked bad floating | NEON CITY / deferred |
| R-035 | procedural_city_6.glb | 57.3 | N | DEFERRED — removed from live Space City sky placement; looked bad floating | NEON CITY / deferred |
| R-036 | neighbourhood_city_modular_lowpoly.glb (×2 dup) | 66.6 | N | GROUND — layered into ground city as a real district via GroundCityKits (d7ea23d) | NEON CITY / ground |
| R-037 | futuristic_background_buildings_kit_volume_2.glb | 43.4 | N | GROUND — layered into ground city as a real district via GroundCityKits (d7ea23d) | NEON CITY / ground |
| R-038 | bionic_architecture.glb | 14 | N | GROUND — layered into ground city as a real district via GroundCityKits (d7ea23d) | NEON CITY / ground |
| R-039 | chicken_gun_fruzer_circus.glb | 79 | N | circus | NEON CITY |
| R-040 | missile_map.glb | 2.1 | N | missile map | NEON CITY |
| R-041 | kenney_retro-urban-kit.zip | 2.06 | N | city kit (zip) | NEON CITY (extract GLB) |

### CATS REALM
| ID | File | MB | Animated | Notes |
|----|------|----|----------|-------|
| R-042 | das_kat.glb | 13.8 | N | cat | CATS REALM |
| R-043 | cat_witch.glb | 1.82 | N | witch cat | CATS REALM |
| R-044 | cat_girl_-_rigged.glb | 5.53 | Y (rigged) | cat girl | CATS REALM / CINEMATIC |
| R-045 | cats_space_suit_free_model.glb | 7.1 | N | (see R-016) | CATS REALM |
| R-046 | cat_astronaut.glb | 3.25 | N | (see R-017) | CATS REALM |
| R-047 | stylized_angelic_cat.glb | 5.08 | N | (see R-025) | CATS REALM |

### HALL OF HEROES
| ID | File | MB | Animated | Notes |
|----|------|----|----------|-------|
| R-048 | baby_yoda.glb | 27 | N | Grogu | HALL OF HEROES hero |
| R-049 | amemiya_nazuna_vshojo_-_low_poly_pixel.glb | 0.52 | N | vshojo | HALL OF HEROES |
| R-050 | fountain_with_three_putts_brno_luzanky.glb | 8.04 | N | fountain | HALL OF HEROES |
| R-051 | cheese_moon.glb | 1.26 | N | (see R-013) | HALL OF HEROES |
| R-052 | sentinel.glb / sentinelle_-_matrix.glb | — | N | (see R-008/R-009) | HALL OF HEROES |
| R-053 | deep_impact_tv_from_the_matrix.glb | 1.12 | N | (see R-020) | HALL OF HEROES |

### CINEMATIC (animated)
| ID | File | MB | Animated | Notes |
|----|------|----|----------|-------|
| R-054 | lacrimosa_animated_-_neverness_to_everness.glb (×3 dup) | 139.6 | Y (loop) | ❗>100MB — FEATURED cinematic | CINEMATIC hero |
| R-055 | animated_floating_astronaut_in_space_suit_loop.glb | 19.3 | Y (loop) | floating astronaut | CINEMATIC / SPACE |
| R-056 | cat_girl_-_rigged.glb | 5.53 | Y (rigged) | (see R-044) | CINEMATIC |
| R-057 | animated-rhino-loop-on-floating-fantasy-islands.zip | 89.2 | Y (loop, zip) | extract + compress | CINEMATIC |

### Supporting (not 3D, but relevant)
- `three.js-master.zip` 361 MB — Three.js source (already used; ignore for world)
- Duplicates to de-dup before build: lacrimosa ×3, drogon ×2, neighbourhood_city ×2

---

## Build order (proposed)
- **Phase 0** — De-dup + `gltfpack -cc` the >100 MB files; compress the rest; copy into
  `cosmic-pyramid-library/assets/recent/<district>/`; write `assets.json` (machine-readable).
- **Phase 1** — Vault chat panel (`/assets` command + gallery) reading `assets.json`, thumbnail
  per asset, theme filter, "enter" → load that world.
- **Phase 2** — Travel hub + portals to the 8 worlds (reuse pyramid-enter pattern).
- **Phase 3** — Build worlds one at a time (Pope picks first). Each = a soul gun, NOTARIZED.
- **Phase 4** — Per-hero micro-experiences (drogon flies, lacrimosa plays as cinema, buu smashes).

## Open questions for the Pope
1. Which world first? (SPACEDOCK / CELESTIAL / DRAGON / ARENA / NEON CITY / CATS / HALL / CINEMATIC)
2. Compress the >100 MB files with gltfpack now? (required to host on Pages)
3. Keep 8 worlds, or merge (e.g. CATS into CELESTIAL, HALL into SPACE)?
4. Duplicates (lacrimosa×3, drogon×2, neighbourhood×2) — de-dup, yes?
5. Push all ~2.5 GB compressed, or stage worlds incrementally (one per PR)?
