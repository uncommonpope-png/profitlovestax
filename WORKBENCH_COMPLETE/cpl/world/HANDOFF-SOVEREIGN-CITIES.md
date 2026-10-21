# HANDOFF: Sovereign Cities Integration

## THE VISION

Craig/Tec want to add sovereign cities to their void population system ONE AT A TIME, like snapping on Legos. Each city gets added, verified in browser, then the next one gets added.

**Starting with: THE SHATTERED FRONT (Alien Warzone City)**

The user provided the exact code and exact integration instructions. Follow them exactly.

---

## CURRENT STATE (f53bb33 — LIVE ON GITHUB PAGES)

- **Live URL:** https://buyasoul-ai.github.io/buyasoul-cpl/
- **Branch:** `publish`
- **Head commit:** `f53bb33`
- **What works:** Main CPL city (Grand Tower), 17 void worlds, barracks, fleet combat, void cosmos
- **What's missing:** ALL sovereign cities (no files, no script tags, no spawn calls)

### File structure (relevant parts):
```
index.html                              ← main page, has <script type="module"> imports
src/genesis/void-population.js          ← 3708 lines, manages 17 void worlds + tick loop
src/genesis/void-cosmos.js              ← sky module
src/genesis/procedural-city.js          ← main CPL city
src/genesis/realm-world.js              ← Realm class (per-world city builder)
src/genesis/resource-pool.js            ← PLT economy
```

### What's NOT in the live site:
- `src/genesis/alien-warzone-city.js` ❌
- `src/genesis/void-rival-city.js` ❌
- `src/genesis/resonant-veil.js` ❌
- `src/genesis/better-buildings.js` ❌
- `src/genesis/procedural-architecture.js` ❌
- Script tags for any of the above in index.html ❌
- Spawn calls for sovereign cities in void-population.js ❌

---

## HOW THE SYSTEM WORKS

### void-population.js architecture:
1. **`install(Genesis)`** — called once at boot, sets up everything
2. **`populate(opts)`** — called with `{ scene, camera }`, builds all 17 worlds
3. **`tick(dt)`** — called every frame by EngineScheduler, animates worlds
4. **`dispose()`** — cleanup

### The tick loop (lines 3540-3614):
```
tick(dt) {
  for each world: animate particles, animate city buildings
  production tick (training queues)
  animate spawning ships
  fleetTick(dt)          ← SC2 combat
  animate portal frames
  void cosmos tick
}
```

### How sovereign cities SHOULD integrate (from commit 7ec4ee8):
The newer commits (7ec4ee8, 13d44e1) show the integration pattern:
1. Script tags in index.html load the city files BEFORE void-population.js
2. void-population.js checks `typeof window.spawnWarzoneCity === 'function'`
3. If the function exists, it calls it and stores the result
4. In the tick loop, it calls `cityGroup.userData.update(time, dt)`
5. In dispose, it removes the cities

### The integration calls that NEED to be added to void-population.js:
**In populate() (after world building, around line 3318):**
```js
// Spawn sovereign cities
if (typeof window.spawnWarzoneCity === 'function') {
  try {
    const warzoneCity = window.spawnWarzoneCity(scene, { offsetX: 900, offsetZ: 300 });
    _warzoneCity = warzoneCity;
    console.log('[VoidPopulation] Shattered Front warzone spawned');
  } catch (e) { console.warn('[VoidPopulation] Shattered Front spawn failed:', e && e.message); }
}
```

**In tick() (after fleetTick, around line 3601):**
```js
if (_warzoneCity && _warzoneCity.userData && _warzoneCity.userData.update) {
  _warzoneCity.userData.update(performance.now() / 1000, dt);
}
```

**Variable declaration (near top, around line 185):**
```js
let _warzoneCity = null;
```

**In dispose() (around line 3616):**
```js
if (_warzoneCity && _warzoneCity.parent) _warzoneCity.parent.remove(_warzoneCity);
_warzoneCity = null;
```

---

## THE SHATTERED FRONT CODE

The user provided this code directly. It is a self-contained IIFE that:
- Exposes `window.spawnWarzoneCity(scene, opts)` 
- Exposes `window.WarzoneCity = { CFG, makeAlienBuilding, makeMechWalker, makeHoverTank }`
- Uses `THREE` from the global scope (not ES module import)
- Returns a `THREE.Group` with `userData.update(time, delta)` method

### Material list (potential GPU risk):
```
MATS.chitin         — MeshStandardMaterial ✅ safe
MATS.chitinWet      — MeshStandardMaterial ✅ safe
MATS.crimsonEnergy  — MeshBasicMaterial    ✅ safe
MATS.azureEnergy    — MeshBasicMaterial    ✅ safe
MATS.boneSpire      — MeshStandardMaterial ✅ safe
MATS.crystalGrowth  — MeshPhysicalMaterial ⚠️ HAS transmission (GPU risk)
MATS.burnedMetal    — MeshStandardMaterial ✅ safe
MATS.scorchedEarth  — MeshStandardMaterial ✅ safe
MATS.shieldDome     — MeshPhysicalMaterial ⚠️ HAS transparent/depthWrite (GPU risk)
MATS.fireCore       — MeshBasicMaterial    ✅ safe
MATS.smokePuff      — MeshBasicMaterial    ✅ safe
```

**If the page goes black / buildings invisible:** Replace the 2 MeshPhysicalMaterial calls with MeshBasicMaterial. The code the user provided uses `new THREE.MeshPhysicalMaterial(...)` directly (NOT `__genesisPhysMat`).

### What it spawns:
- 280 alien buildings (7 variants: chitin hive towers, bone spires, crystal growths, military bunkers, shield domes, organic pods, command spires)
- 16 mech walkers (Crimson vs Azure factions)
- 8 hover tanks
- 7500 particles (dust, sparks, ash)
- Cratered terrain + trenches
- Energy beams, explosions, fire, smoke, battle strobes
- Full animation loop with AI patrol, shooting, explosions

### Coordinates:
- **offsetX: 900, offsetZ: 300** — placed far from the main city

---

## EXACT INTEGRATION STEPS (follow in order)

### Step 1: Create the file
Create `src/genesis/alien-warzone-city.js` with the exact code the user provided.

### Step 2: Add script tag to index.html
Add BEFORE the `<script type="module">` block that imports void-population.js:
```html
<script src="src/genesis/alien-warzone-city.js"></script>
```

### Step 3: Add variable declaration to void-population.js
Near line 185, add:
```js
let _warzoneCity = null;
```

### Step 4: Add spawn call to void-population.js populate()
Near the end of the `populate()` function (after the world building loop, around line 3318), add:
```js
if (typeof window.spawnWarzoneCity === 'function') {
  try {
    const warzoneCity = window.spawnWarzoneCity(scene, { offsetX: 900, offsetZ: 300 });
    _warzoneCity = warzoneCity;
    console.log('[VoidPopulation] Shattered Front warzone spawned');
  } catch (e) { console.warn('[VoidPopulation] Shattered Front spawn failed:', e && e.message); }
}
```

### Step 5: Add tick update to void-population.js tick()
After `fleetTick(dt)` (line 3601), add:
```js
if (_warzoneCity && _warzoneCity.userData && _warzoneCity.userData.update) {
  _warzoneCity.userData.update(performance.now() / 1000, dt);
}
```

### Step 6: Add cleanup to void-population.js dispose()
In the `dispose()` function (around line 3616), add:
```js
if (_warzoneCity && _warzoneCity.parent) _warzoneCity.parent.remove(_warzoneCity);
_warzoneCity = null;
```

### Step 7: Test
- Commit and push to `publish` branch
- User hard-refreshes browser (Ctrl+Shift+R)
- Check console for `[ShatteredFront] Warzone city spawned at (900, 0, 300)`
- Fly camera to position (900, 0, 300) to see the warzone
- If black screen: fix the 2 MeshPhysicalMaterial lines

---

## BACKUP COMMITS (code lives here)

| Commit | Date | Has alien-warzone? | Notes |
|--------|------|-------------------|-------|
| `7ec4ee8` | Jul 31 13:23 | YES | Full integration (script tags + spawn calls + tick) |
| `13d44e1` | Aug 1 01:37 | YES | Same as above + realm-world._std() fix |
| `dc5ce79` | Aug 1 02:57 | YES | Global shader kill switch (broke main city) |
| `c783d60` | Aug 1 13:18 | YES | _std() per-file fallback (also broke something) |
| `f53bb33` | Jul 28 14:36 | NO | **CURRENT LIVE BASE** — this is what works |

**Recovery commands if you need the old code:**
```bash
git show 13d44e1:src/genesis/alien-warzone-city.js > src/genesis/alien-warzone-city.js
git show 13d44e1:src/genesis/void-rival-city.js > src/genesis/void-rival-city.js
git show 13d44e1:src/genesis/resonant-veil.js > src/genesis/resonant-veil.js
git show 13d44e1:src/genesis/better-buildings.js > src/genesis/better-buildings.js
```

---

## PREVIOUS FAILURES (lessons learned)

### What broke the page:
1. **dc5ce79** — Global shader kill switch replaced ALL MeshStandardMaterial with MeshBasicMaterial. This broke the main city (buildings went dark/invisible). **ROOT CAUSE:** Too aggressive, touched main city materials.
2. **c783d60** — Tried to fix dc5ce79 by adding per-file `_std()` helpers. Still broke something.
3. **d5a35be / f53bb33 rollback** — Went too far back, lost ALL sovereign city code and integration.

### The key lesson:
The user's system works at f53bb33. The sovereign city files are ADDITIVE — they don't touch existing code. The integration pattern (typeof check → spawn → store → tick → dispose) is SAFE because it's guarded by `typeof window.spawnWarzoneCity === 'function'`. If the file isn't loaded, nothing happens.

### What NOT to do:
- Don't add a global shader kill switch
- Don't modify materials in files that aren't being worked on
- Don't touch the main city rendering pipeline
- Don't batch multiple city integrations — ONE AT A TIME, test between each

---

## NEXT CITIES (after Shattered Front is verified working)

1. **Obsidian Spire** (void-rival-city.js) — rival city at (400, 0, 0)
   - Commit: `3fe7584`
   - Integration: `window.spawnRivalCity(scene, { offsetX: 400, offsetZ: 0 })`
   
2. **Resonant Veil** (resonant-veil.js) — impossible geometry city at (-600, 0, 400)
   - Commit: `dcc0f9a`
   - Integration: `window.spawnResonantVeil(scene, { offsetX: -600, offsetZ: 400 })`

3. **Better Buildings** (better-buildings.js) — enhanced procedural buildings
   - Commit: `b2bd5ac`

---

## REPOSITORY INFO

- **GitHub repo:** https://github.com/buyasoul-ai/buyasoul-cpl
- **Deploy branch:** `publish` (GitHub Pages auto-deploys from this)
- **Backup branches:** `backup-c783d60`, `backup-aug1-lowgpu`, `backup-jul29`
- **User's local path:** `C:\Users\uncom\Desktop\buyasoul-cpl-fresh`
- **Deployment:** Push to `publish` → GitHub Pages rebuilds in 1-2 min → user Ctrl+Shift+R

---

## IMPORTANT CONTEXT

- The user (Craig = Morpheus / Grand Code Pope) is the visionary
- Tec = Memory (Seshat Second Brain) is the researcher
- AI agents (Profit Prime) write the code but MUST follow the user's system architecture
- Previous agents wrote sovereign city code WITHOUT understanding the void-population.js integration pattern — that's why it "doesn't click on like Legos"
- The void-population.js system is the BACKBONE — sovereign cities must integrate THROUGH it, not around it
- The user gets frustrated when agents overcomplicate things or go off-task
- **KEEP IT SIMPLE:** Drop file → add script tag → add spawn call → add tick update → test → done
