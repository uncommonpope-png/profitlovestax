# SOUL-GUN - Genesis Resource Manager

type:: [[soul-gun]] [[page]]
mission:: [[GENESIS ENGINE SOUL GUNS]]
phase:: B1
status:: FORGED ✅ (shipped `21?????` — see commit) 
depends-on:: [[SOUL-GUN - Genesis Cost Contract]]

---

## Purpose
The **Resource Manager** is manager #1 of the Genesis Engine. It is the central ledger that knows
every GPU resource (geometry / material / texture / render target) that exists, **who owns it**, and
**what it costs** (reads `userData.cost` from the Cost Contract). It audits itself against
`renderer.info.memory` so leaks are never invisible. This is the anti-leak backbone the other 9
managers build on.

## The contract (what the gun enforces)
```js
// Every tracked resource is recorded as:
{ res, type: 'geometry'|'material'|'texture'|'rt', owner: '<realm|sector|chamber>', cost: obj.userData.cost }
```
- `track(res, owner, obj)` — record a resource + its owner + cost.
- `untrack(res)` — forget a resource (called on disposal).
- `audit()` — diff tracked count vs `renderer.info.memory.geometries/textures`; log orphans.
- `dispose(owner)` — batch-unload every resource owned by a realm/sector/chamber (pairs with Memory Manager).
- `summary()` — returns live counts for the HUD / Performance Governor.

## How it reads cost
When `track(res, owner, obj)` receives `obj` with `obj.userData.cost`, it stores the cost alongside
the resource. This lets the Resource Manager (and downstream managers) ask: "how expensive is what
realm-X is holding?" and "is chamber-3 leaking memory?" — automatically.

## Integration point (CPL)
- Wired as `Genesis.ResourceManager` inside `index.html` (mirrors the extracted module so the live
  world works today).
- The real extraction lives at `src/genesis/resource-manager.js` (ES module, imports THREE), loaded
  via a flag-gated dynamic `import()` — proving the P8 module-split pattern is viable.
- Flag: `window.__GENESIS_RESOURCE_MANAGER` (default true). Set false → manager is a no-op, world
  unchanged. Fully reversible.

## PLT
- **Profit:** one ledger → ten managers can now make decisions; engine becomes leverageable product.
- **Love:** leaks become impossible to hide → visitor never hits a degrading/black world.
- **Tax:** careful surgical wiring into a live 11.6k-line file; paid gladly, flag-gated.
- **True Value:** HIGH. The Architect's foundation — build what doesn't exist yet.
