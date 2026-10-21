---
type:: [[soul-gun]] [[page]]
mission:: [[GENESIS ENGINE SOUL GUNS]]
status:: FORGED
forged:: 2026-07-15
by:: [[Agent Deep]]
tags:: [genesis-engine, cost-contract, phase-a, plT]
---

# SOUL GUN — Genesis Cost Contract

**Class:** Genesis Engine primitive (Phase A — foundation)
**Purpose:** Every CPL object declares a `cost` so future managers can govern the world automatically.

---

## The Contract

Every object in the CPL world — billboard, building, NPC, chamber, video, particle system —
attaches a `cost` descriptor to its **root `Object3D`** via `obj.userData.cost`. The contract is
the single source of truth a manager needs to decide: *should this keep running, or should it
sleep?*

```
cost = {
  cpu:        number,   // estimated CPU cost (0..10)
  gpu:        number,   // estimated GPU cost: draw calls / tris weight (0..10)
  memory:     number,   // MB estimate
  updateFreq: number,   // updates per second (0 = static / never ticks)
  priority:   number,   // 0 (decorative) .. 10 (critical/always-on)
  sector:     string,   // owning sector id (e.g. 'city-core','realm-x','chamber-3')
  sleep:      string    // sleep behavior: 'never' | 'distance' | 'idle' | 'offscreen'
}
```

### Field meaning
- **cpu** — relative CPU burden per tick (animation, steering, logic).
- **gpu** — relative GPU burden (draw calls, triangulated weight, overdraw).
- **memory** — MB footprint (geometry + textures + buffers).
- **updateFreq** — how many times per second the object's update runs. `0` = fully static.
- **priority** — how critical to the experience. Decoration = 0, core engine = 10.
- **sector** — the owning region. Lets managers sleep whole sectors at once.
- **sleep** — the automatic sleep rule a manager applies:
  - `'never'` — always on (core soul, HUD).
  - `'distance'` — sleep when the camera is far (buildings, NPCs, particles).
  - `'idle'` — sleep when the chamber/realm is not active.
  - `'offscreen'` — sleep when not in view (videos).

---

## How it is applied

A helper merges partial cost into defaults and writes `userData.cost`:

```js
Genesis.declareCost = function (obj, partial) {
  if (!obj || !obj.userData) return;
  const def = { cpu:0, gpu:0, memory:0, updateFreq:0, priority:0, sector:'unknown', sleep:'never' };
  obj.userData.cost = Object.assign(def, partial || {});
};
```

Called at each object's creation point:

```js
if (window.__GENESIS_COST_CONTRACT !== false) Genesis.declareCost(group, { cpu:1, gpu:2, memory:0.5, updateFreq:0, priority:3, sector:'city', sleep:'distance' });
```

The `window.__GENESIS_COST_CONTRACT` flag (default `true`) makes the whole primitive
**reversible**: set it to `false` and every `declareCost` becomes a no-op — no call site changes
needed. Phase A ships the data; it is inert until a manager reads it.

---

## PLT — why this gun exists

- **Profit (leverage):** one descriptor, ten managers. The contract is the lever that lets the
  engine scale to thousands of objects without hand-tuning each one.
- **Love (protect the visitor):** by declaring cost up front, a future manager can shield the
  visitor from frame drops, overheating, and struggle — the world breathes instead of choking.
- **Tax (the price):** careful, surgical edits to a live 11k-line file. Paid gladly; reversible
  by design.

> The Cost Contract is clay before the breath. We declare the weight of every soul-thing now, so
> that when the managers wake, they already know what to carry.
