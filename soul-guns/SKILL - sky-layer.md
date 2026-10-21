# SKILL — sky-layer (Sky Dome Above the Plates)

**type:: [[skill]]**
**author:: Dour**
**date:: 2026-07-10**
**links:: [[DOUR-BIBLE]] [[neodownloadable]] [[CPL ASSET MAP]] [[graphics-color]] [[graphics-ibl]] [[heaven-city]]**

---

## What It Is

A single `THREE.Group` (`skyLayer`) added to the scene that fills the **empty dome above the city plates** — the part of the world the Pope said was "not populated enough." It radiates from the **central library** (the "actual library in the middle of the city"), so the sky reads as belonging to the city, not a flat backdrop.

Four layered systems, all animated in the render loop:

1. **Sky clouds** — 18 drifting lobed-sphere clusters (`MeshStandardMaterial`, transparent, `depthWrite:false`), spread across a dome (radius 22–77, height 18–52), each bobbing on a sine + slow spin.
2. **Sky worlds** — 8 large floating planets (radius 1.8–4.0), some ringed (`TorusGeometry`), emissive + additive aura, slowly orbiting the central axis and self-rotating.
3. **Sky galaxies** — 5 `createSpiralGalaxy(...)` spirals (reused from the base star-field builder), scaled ×2.2, embedded high in the sky dome (y 30–50), slowly rotating.
4. **Sky cities** — 4 small floating realms (glowing disc + 8 pillars + a colored `PointLight`), drifting + rotating, honoring "more cities in the sky."

---

## Why (Mountain → Foothills)

Pope: *"the layer above the plates is not populated enough — the sky should have clouds and worlds and galaxys like the actual library in the middle of the city."*

The original world had galaxies/planets parked **low** near the library base and clouds only in the far `heavenGroup`. The sky dome was empty. This gun puts the sky *where the eye expects it* — above the buildings, around the library.

---

## How To Apply (the graft)

Insert the build block **after** the `heavenGroup` block (before `// ========== AVATAR SYSTEM ==========`) and the animate block **after** the existing `// --- rotate galaxies ---` loop.

```js
// ========== SKY LAYER — clouds, worlds, galaxies, sky-cities above the plates ==========
const skyLayer = new THREE.Group();
scene.add(skyLayer);

// SKY CLOUDS
const skyCloudMat = new THREE.MeshStandardMaterial({
  color: 0xdfe6ff, emissive: 0x3a4a7a, emissiveIntensity: 0.12,
  transparent: true, opacity: 0.4, depthWrite: false
});
const skyClouds = [];
for (let i = 0; i < 18; i++) {
  const cg = new THREE.Group();
  const lobes = 4 + Math.floor(Math.random() * 4);
  for (let j = 0; j < lobes; j++) {
    const lobe = new THREE.Mesh(new THREE.SphereGeometry(2 + j * 0.18, 10, 10), skyCloudMat);
    lobe.position.set((Math.random() - 0.5) * 3.5, (Math.random() - 0.5) * 0.6, (Math.random() - 0.5) * 2.5);
    lobe.scale.y = 0.32;
    cg.add(lobe);
  }
  const ang = Math.random() * Math.PI * 2;
  const rad = 22 + Math.random() * 55;
  const y = 18 + Math.random() * 34;
  cg.position.set(Math.cos(ang) * rad, y, -3 + Math.sin(ang) * rad);
  cg.scale.setScalar(0.8 + Math.random() * 1.4);
  skyLayer.add(cg);
  skyClouds.push({ obj: cg, baseY: y, phase: Math.random() * Math.PI * 2, drift: 0.2 + Math.random() * 0.5 });
}

// SKY WORLDS
const skyWorlds = [];
const skyWorldData = [ /* 8 {r,c,e,x,y,z,ring?,ringC?} */ ];
for (const d of skyWorldData) {
  const wm = new THREE.MeshStandardMaterial({ color: d.c, emissive: d.e, emissiveIntensity: 0.7, roughness: 0.35, metalness: 0.25 });
  const wmesh = new THREE.Mesh(new THREE.SphereGeometry(d.r, 48, 48), wm);
  wmesh.position.set(d.x, d.y, d.z);
  const aura = new THREE.Mesh(new THREE.SphereGeometry(d.r * 1.4, 24, 24),
    new THREE.MeshBasicMaterial({ color: d.c, transparent: true, opacity: 0.18, blending: THREE.AdditiveBlending, depthWrite: false }));
  wmesh.add(aura);
  skyLayer.add(wmesh);
  let ring = null;
  if (d.ring) { /* TorusGeometry ring, rotation.x = PI/2.3 */ skyLayer.add(ring); }
  const rad = Math.sqrt(d.x * d.x + d.z * d.z);
  skyWorlds.push({ mesh: wmesh, ring, baseAng: Math.atan2(d.z, d.x), rad, y: d.y, spin: 0.002 + Math.random() * 0.004, orbit: 0.02 + Math.random() * 0.05, phase: Math.random() * 6.28 });
}

// SKY GALAXIES (reuse existing builder)
const skyGalaxies = [ createSpiralGalaxy(20,34,-6,0.60,0.78,9000,0.7,0.9), /* ... 4 more ... */ ];
skyGalaxies.forEach(g => { g.scale.setScalar(2.2); skyLayer.add(g); });

// SKY CITIES
const skyCities = [];
const skyCityColors = [0x66ccff, 0xff77cc, 0xffcc66, 0x99ffcc];
for (let i = 0; i < 4; i++) { /* disc + 8 pillars + PointLight, placed radius 30-50, y 26-42 */ skyCities.push({ obj: cg, baseY: y, phase: Math.random()*Math.PI*2, spin: 0.05 + Math.random()*0.08 }); }
window.__skyLayer = skyLayer;
```

Animate (inside the render loop, after `// --- rotate galaxies ---`):

```js
for (const c of skyClouds) { c.obj.position.y = c.baseY + Math.sin(time*0.3 + c.phase) * (1 + c.drift); c.obj.rotation.y += 0.0008 * c.drift; }
for (const w of skyWorlds) {
  w.mesh.rotation.y += w.spin; w.mesh.rotation.x += w.spin * 0.5;
  const a = w.baseAng + time * w.orbit * 0.016;
  w.mesh.position.x = Math.cos(a) * w.rad; w.mesh.position.z = Math.sin(a) * w.rad;
  w.mesh.position.y = w.y + Math.sin(time * 0.4 + w.phase) * 1.2;
  if (w.ring) { w.ring.position.copy(w.mesh.position); w.ring.rotation.z += 0.004; }
}
for (const g of skyGalaxies) { g.rotation.y += 0.0004; g.rotation.x += 0.0001; }
for (const c of skyCities) { c.obj.position.y = c.baseY + Math.sin(time * 0.25 + c.phase) * 1.5; c.obj.rotation.y += c.spin * 0.016; }
```

> The full data tables (8 worlds, 5 galaxies, 4 city positions) live in `cosmic-pyramid-library/index.html` — copy the block verbatim; do not retype.

---

## Black Screen Protocol (per base model)

- One system at a time. Build → `node --check` the extracted `<script type="module">` → serve → reload.
- `createSpiralGalaxy(...)` is defined earlier in the file (~line 906) — call it only AFTER that definition.
- Never reference an undefined array in the animate loop. All four arrays (`skyClouds`, `skyWorlds`, `skyGalaxies`, `skyCities`) are declared in the same scope as the loop.
- Galaxy `Points` use `depthWrite:false` + `AdditiveBlending` so they glow without occluding.

---

## Tuning

- **Density:** raise/lower the `for` loop counts (18 / 8 / 5 / 4) to fill or thin the sky.
- **Height:** the `y = 18 + Math.random()*34` band sits above the plates; push higher for a "deep space" feel.
- **GSK reactivity:** the atmosphere (sky/fog/bloom) is already driven by GSK mood/phase via `GSKCityBridge`; these sky elements ride on top of it. To make them GSK-reactive too, feed `gskBridge.currentMood` into cloud opacity or world emissive.

---

## Status

✅ Active — grafted into `cosmic-pyramid-library/index.html`, syntax-verified (`node --check` on the module), server live on `:8000`. Catalog total: **124** ([[neodownloadable]] SECTION 15). Recorded in [[CPL ASSET MAP]] (Procedural Sky Layer).

**License (Pope directive):** all our assets are open source, not for resale.
