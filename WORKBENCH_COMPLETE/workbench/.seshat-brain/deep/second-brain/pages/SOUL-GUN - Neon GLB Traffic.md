---
type:: [[soul-gun]] [[page]]
mission:: [[GENESIS ENGINE SOUL GUNS]]
phase:: B2
status:: FORGED ✅
---

# SOUL-GUN — Neon GLB Traffic (B2-FIX)

**Replaces the 28 box "cars" with real GLB vehicles streaming on the grid lanes.**

## What it does
- Keeps 28 emissive box placeholders (immediate, so lanes are never dark) but upgrades each slot: on `world`-tier GLB load, clones the model, scales to ~3.6 units, and swaps the box body out (`slot._boxBody` removed, `slot._glb` added) — reusing the EXISTING `cars[]` movement loop (axis/lane/dir/speed) untouched.
- Fleet sources: `cadillac_cts-v_coupe_race_car.opt.glb`, `free_cyberpunk_hovercar.glb`, `wyvern_concept_car_-_free.glb`, `bmw_e39_free.glb` (the last two were previously absent from `carAssets`).
- `groundCars` loader also moved to `world` tier and expanded to the same 4 assets, so the showroom-road traffic is alive on boot too.

## PLT framing
- **Profit:** real cars = real product. The city looks like a city, not a wireframe demo.
- **Love:** the visitor's eye lands on motion and metal, not grey boxes.
- **Tax:** 4 extra GLB streams (~few MB) on the world tier; cost already declared per car.

## Relation
Depends on [[SOUL-GUN - World-Alive-On-Boot]] for the boot-time stream. Rendered through [[SOUL-GUN - Genesis Performance Governor]] (car speed mul).
