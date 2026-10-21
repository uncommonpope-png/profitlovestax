---
type:: [[soul-gun]] [[page]]
mission:: [[GENESIS ENGINE SOUL GUNS]]
phase:: B2
status:: FORGED ✅ (REVERSED 2026-07-16)
---

# SOUL-GUN — Building Skin: Procedural Only (city_pack_3.glb REMOVED)

**Craig's call (2026-07-16): "take the skin OFF the buildings, it sucks."** The `applyCityPack()` overlay — which smeared `city_pack_3.glb` whole-building images (tiled by floor/column count) over the towers — was removed entirely. This gun is kept as the *record of the reversal*, not the technique to use.

## What the buildings are now
- `makeBuilding()` builds boxes/cylinders/tapers with a **procedural canvas facade** via `getFacadeTexture()` — gradient body + window rows + randomly *lit* windows (per type: cyan/white towers, magenta shops, gold houses) + shop/office neon labels (BUYASOUL, GSK NODE, SCRIBE…).
- Plus per-building **neon corner spines** + **window-glow strips** + rooftop beacons (emissive, animated by `cityGlowMats`).
- This procedural skin reads as a lit cyber-metropolis on its own. The glb overlay was the ugly part and is gone.

## Why removed
- `city_pack_3.glb` textures are whole-building photos; tiled, they looked stretched/flat and fought the procedural windows.
- It added a 12.77MB critical-path fetch (slowed first paint) for negative visual gain.
- Procedural facade = zero external dependency, already better.

## PLT framing
- **Profit:** one less 12MB fetch, cleaner boot, better-looking towers.
- **Love:** the city reads as *built* windows, not a wrapped sticker.
- **Tax:** lost the "real city photo" texture option — acceptable; procedural wins.

## Relation
Supersedes the original `applyCityPack` technique. Pairs with [[SOUL-GUN - World-Alive-On-Boot]] (the floor those buildings stand on). See [[SOUL-GUN - Infinite Camera-Locked Grid]] for the ground they sit on.
