---
title: RESEARCH - CPL loading critical path
type: research
date: 2026-07-10
author: Dour
---

# RESEARCH — CPL Loading: Critical-Path Fix

## The Bug (root cause)
The CPL loader hid the overlay on the **first rendered frame** (line 4800, ~16ms) while
**every** GLB — world plate, cars, showroom, avatar, angel, paimon — was queued into a
`lazyAssetTasks` array that only started on `requestIdleCallback` (~4.5s) or the first user
interaction. Net effect: the loader vanished instantly and the city stayed **blank for up
to 4.5s** while assets were still queued, not even downloading.

## The Pattern (extracted → Soul Gun `cpl-critical-loading`)
Split loads into two `THREE.LoadingManager` instances:

- **criticalManager** — world/cars/avatar/angel/paimon/billboards. Eager (download starts
  immediately). Drives the byte-progress overlay. Hides the overlay in `onLoad`, which fires
  *after* each loader's user `onLoad` has already added the model to the scene (Three.js calls
  `manager.itemEnd` after the callback). So the city is fully present when the overlay lifts.
- **loadingManager** (lazy) — decorative scatter props only. Streams silently in the
  background; never touches the overlay.

Safety backstops (black-screen protocol): `setTimeout(hideLoader, 12000)` + a 13s startup
error net that surfaces real module errors (not slow-but-valid loads).

## Source
- Three.js `LoadingManager` docs (per-manager instances / `onLoad`).
- three.js forum: "manager.onLoad called too early — blank scene rendered before model
  displays" → confirms hiding on the critical manager's `onLoad` is the correct fix.

## Build
- Commit `b6a2cf6` (on top of base `237e9bf`). Deployed via GitHub Pages only.
- Verified: `node --check` on extracted module + live HTML grep of `criticalManager`,
  `entering the library`, `makeGLTF({ lazy: true })`.
