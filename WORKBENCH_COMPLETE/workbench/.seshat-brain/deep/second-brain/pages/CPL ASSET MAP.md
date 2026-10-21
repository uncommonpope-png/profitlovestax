# CPL ASSET MAP — Cosmic Pyramid Library (Grafted Reality)

type:: [[pattern]]
source:: cosmic-pyramid-library/index.html + C:\Users\uncom\Downloads
updated:: 2026-07-10
PLT:: Profit 0.9, Love 0.4, Tax 0.4

## Purpose
The single source of truth for every real asset grafted into the Cosmic Pyramid Library world:
where the file lives, where it sits in the world, which [[Soul Gun]] governs it, and its status.
Graft protocol: load via `GLTFLoader` (HTTP server required, NOT `file://`), auto-normalize with `Box3`,
self-light characters (metallic GLBs render black without envMap), place, then extract the gun.

## Active Grafts (in the world now)

| Asset | Source / Download | File in project | World Location | Soul Gun | Status |
|---|---|---|---|---|---|
| Porsche 911 GT3 RS (2017) | User Download (GLB) | `assets/porsche-gt3-rs/2017_porsche_911_991_gt3_rs.glb` | (10, 0, 0) city road, faces traffic | [[SKILL - gt3rs]] | ✅ Active (verified) |
| Cadillac CTS-V Coupe Race Car | User Download (GLB) | `assets/cadillac/cadillac_cts-v_coupe_race_car.glb` | (-10, 0, 0) city road, opposite Porsche | [[SKILL - gt3rs]] | ✅ Active (verified) |
| Car Showroom | User Download (`car_showroom.glb`) | `assets/car-showroom/car_showroom.glb` | Swaps nearest procedural building to (-21, 21); removes full parts manifest (box/windows/spines/roof/antenna) | [[SKILL - swap-building]] + [[SKILL - clear-obstruction]] | ✅ Active (verified cleanup) |
| Paimon (Genshin Impact) | User Download (GLB) | `assets/paimon/genshin_impact_paimon.glb` | Wanders from (18, 0, 18); locator beacon ON | [[SKILL - paimon]] | ✅ Active (walking + self-lit) |
| Angel | User Download (`angel.glb`) | `assets/angel/angel.glb` | In HEAVEN — floating sky-city (×7 orbiting/bobbing at (0,40,-95)) | [[SKILL - heaven-city]] | ✅ Active (verified — "fucking perfect") |
| Computer (`simple_computer_placeholder`) | User Download | `assets/computers/simple_computer_placeholder.glb` | Scattered random CLEAR ground (×2) | [[SKILL - scatter]] | ✅ Active (verified) |
| Ifa (Anemo, Genshin) | User Download (`-_genshin_impact_-_anemo_-_ifa.glb`) | `assets/ifa/` | Scattered CLEAR ground (×1) | [[SKILL - scatter]] | ✅ Active (verified) |
| Mystery prop (`unequal_marriage-1.glb`) | User Download | `assets/misc/unequal_marriage-1.glb` | Scattered CLEAR ground (×1) | [[SKILL - scatter]] | ✅ Active (verified) |
| WORLD (big environment) | User Download (`world.glb`, 66 MB) | `assets/world/world.glb` | Flush at +X city edge (x≈35), grid-snapped, base on ground | [[SKILL - world-plate]] | ✅ Active (verified) |

## Procedural Sky Layer (system — not a downloaded asset)

Populates the dome ABOVE the city plates, radiating from the central library (the "actual library in the middle of the city"). Built as one `skyLayer` group; all elements animate in the render loop. Grafted via [[SKILL - sky-layer]].

| System | Count | World Location | Soul Gun | Status |
|---|---|---|---|---|
| Sky clouds (drifting lobed clusters) | 18 | dome over city, y 18–52, radius 22–77 | [[SKILL - sky-layer]] | ✅ Active |
| Sky worlds (floating planets, some ringed) | 8 | y 24–52, orbiting central axis | [[SKILL - sky-layer]] | ✅ Active |
| Sky galaxies (reused `createSpiralGalaxy`, scaled ×2.2) | 5 | y 30–50, embedded in sky dome | [[SKILL - sky-layer]] | ✅ Active |
| Sky cities (glowing disc + pillars + point light) | 4 | y 26–42, radius 30–50 | [[SKILL - sky-layer]] | ✅ Active |

## Extracted (gun exists, NOT applied to CPL city per Pope)

| Asset | Source | Soul Gun | Status |
|---|---|---|---|
| Kenney Retro Urban Kit (125 modular GLBs) | kenney.nl/assets/retro-urban-kit (CC0) | [[SKILL - brickghetto]] | ✅ Extracted — Pope declined aesthetic for CPL; reusable for other worlds |

## Deferred (CRASH RISK — do NOT batch-load)

~40–45 MB Porsche GLBs crashed the whole scene when loaded together with other assets
(GLTFLoader 0.128 / GPU context loss). Test ONE at a time, or upgrade loader.
Still in `C:\Users\uncom\Downloads` (not yet moved):

| Asset | Source | File | Note |
|---|---|---|---|
| Porsche 992 GT3R "rexy" | User Download | `porsche_992_gt3r_rexy.glb` (39 MB) | Moved to `assets/porsche-extra/` — DEFERRED |
| Porsche 992 GT3R "roxy" | User Download | `porsche_992_gt3r-_roxy.glb` (39 MB) | Still in Downloads — DEFERRED |
| 2024 Manthey Racing GT3 RS | User Download | `2024_manthey_racing_porsche_911_gt3_rs.glb` (45 MB) | Moved to `assets/porsche-extra/` — DEFERRED |
| Porsche 992 GT3 R (vecarz) | User Download | `porsche_992_gt3_r__www.vecarz.com.glb` (43 MB) | Still in Downloads — DEFERRED |
| Porsche 911 GT3 RS (2017, original) | User Download | `2017_porsche_911_991_gt3_rs.glb` (9 MB) | ✅ Already active as `gt3rs` |

## Lessons (write these into guns)
- **Black screen = module parse error or null deref.** Always push a valid mesh; async load failures only warn.
- **Metallic GLBs render black** without envMap → self-light (PointLight) + kill metalness.
- **No skeletal clips** → fake life with float-bob (`position.y = 0.15 + sin(t*2)*0.08`).
- **Heavy GLBs (~40MB) crash the tab** when batched. Load one at a time; consider DRACOLoader/newer three.
- **Local server required**: `python -m http.server 8000 --directory C:\Users\uncom\Desktop`; open `http://localhost:8000/cosmic-pyramid-library/index.html`.

## License (Pope directive)
All our assets are **open source, not for resale**. Build and share freely.
