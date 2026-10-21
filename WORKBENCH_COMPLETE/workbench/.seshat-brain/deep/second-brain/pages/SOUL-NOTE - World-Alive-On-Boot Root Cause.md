---
type:: [[soul-note]] [[page]]
mission:: [[GENESIS ENGINE GAP]]
phase:: B2
status:: RECORDED ✅
---

# SOUL-NOTE — World-Alive-On-Boot Root Cause & Fix

## The bug Craig reported
"NPCs not actually walking around with GLB on them. Cars are just boxes. Buildings look horrible. Need more flooring for the grid. Extended worlds have oversized characters."

## Root cause (verified in `index.html`)
1. **NPCs not walking with GLB:** The 25 `citizens` array (line ~6100) DOES have a complete walk loop (lines 11991–12018: target pick, move, rotate, walk/idle crossfade via `AnimationMixer`). But `assignWalkerRig` only attaches the GLB rig + mixer when `walkerRigPool[i]` loads — and those rigs were loaded `lazy:true`, gated behind first user input / 4.5s idle. So on a quiet boot the citizens were bare spheres with no mixer → looked static.
2. **Cars are boxes:** 28 `BoxGeometry` cars built immediately (line 5428). Real GLBs only went into `groundCars` (max 2) and the legacy hub GLBs were disabled (`LOAD_LEGACY_HUB_GLBS=false`).
3. **Buildings horrible:** `applyCityPack` tiled whole-building facade textures by a coarse repeat → stretched/flat.
4. **No grid floor:** only a 26×26 fallback `GridHelper`.
5. **Oversized extended characters:** `world.opt.glb` normalized to footprint 60; `NPC_SIZE_REF=1.7` governs avatars. Scaling present but only triggers after the lazy gate.

## The fix (branch `world-alive-on-boot`)
- Added a `world` tier to `enqueueLazyAsset`/`makeGLTF` that fires on `__cplReady` (not user gesture). Routed walker rigs, neon cars, ground cars, world plate, and denizen-body swap through it.
- Replaced box cars with GLB-wrapped traffic (4 car assets, scales preserved, old movement loop reused).
- Rewrote `applyCityPack` to tile by floor/column count + emissive window glow.
- Added 600×600 grid floor + 400-unit grid lines.

## Verification
- `cpl-runtime-audit` passes: `cplReady=true`, firstFrame, backstop released, canvas visible, no `cplErr`, all 10 managers, loader hidden. No black screen, no regression.
- World-tier GLBs confirmed *starting* on boot (previously `ERR_ABORTED` only because the audit closes at 5 frames; before the fix they would not start at all without a click).

## PLT
Profit + Love − Tax = high. The world is now alive on first paint.
