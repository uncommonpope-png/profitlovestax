// procedural-city.js — Act VI BODY (P76) — Gen-from-code Dark City
// Flag-gated by window.__GENESIS_PROCEDURAL_CITY (default OFF).
// When OFF this file is never imported and the legacy animate() if-chain runs
// EXACTLY as today — zero behavioral delta on the live floor.
//
// WHAT IT DOES:
//   Generates a deterministic Dark City from code — blocks, towers, and a
//   heightmap — with ZERO external asset dependencies (the kit's dark-city /
//   city-* procedural generators, reimplemented vanilla r128/r160). The city
//   is registered into EntityRegistry so citizens (citizen-ai.js) can perceive
//   and mutate it. This validates ACT III "the world answers": citizens can
//   raise/lower a block and the registry reflects it.
//
// CASCADE: mutations to the city (add/remove/raise) go through proposeMutate();
//   the server CASCADE hook decides whether to apply. Model proposes, server
//   decides. No in-page LLM.
//
// THREE VERSION: vanilla r128/r160 compatible. Uses global THREE only.
//   NOTE: the original threejs-games kit targets its own Three version; this
//   reimplementation avoids any kit-version-specific API (no BufferGeometryUtils
//   imports, no postprocessing) so it is safe on r128 AND r160.
(function () {
  function install(Genesis) {
    if (!Genesis) return;
    if (Genesis.ProceduralCity) return; // idempotent

    let scene = null;          // THREE.Scene to attach generated meshes
    let root = null;           // THREE.Group holding the city
    let cascadeHook = null;    // (proposal) => boolean
    const blocks = new Map();  // id -> { mesh, baseY, kind }
    let seed = 1337;

    function flagOn() {
      return (typeof window !== 'undefined') && window.__GENESIS_PROCEDURAL_CITY === true;
    }
    function rng() { // deterministic LCG so rebuilds are reproducible
      seed = (seed * 1103515245 + 12345) & 0x7fffffff;
      return seed / 0x7fffffff;
    }
    function THREEOK() {
      return (typeof window !== 'undefined') && window.THREE;
    }

    // Build a single composite procedural tower/building with greebles and set-backs
    function makeBlock(x, z, w, d, h, color, yBase) {
      if (!THREEOK()) return null;
      const T = window.THREE;
      
      let mesh;
      const mat = new T.MeshStandardMaterial({ color: color || 0x222233, roughness: 0.7, metalness: 0.3, emissive: 0x080c18 });
      const accentMat = new T.MeshBasicMaterial({ color: 0x00ffcc, wireframe: false });
      
      // If ProceduralArchitecture engine is loaded, use composite typologies!
      if (window.ProceduralArchitecture) {
        const PA = window.ProceduralArchitecture;
        const styleRoll = (x * 37 + z * 17) % 3;
        const rng = PA.mulberry32(Math.abs(Math.floor(x * 100 + z * 10)));
        
        if (styleRoll === 0) {
          mesh = PA.buildGothicTower(h, w, mat, accentMat, rng);
        } else if (styleRoll === 1) {
          mesh = PA.buildArcologyTower(h, w, mat, accentMat, rng);
        } else {
          mesh = PA.buildIndustrialZiggurat(h, w, mat, accentMat, rng);
        }
        
        // Add rooftop and facade greebles
        PA.addGreebles(mesh, h, w, styleRoll, mat, rng);
        mesh.position.set(x, yBase || 0, z);
      } else {
        // Fallback: Box with roof spire
        mesh = new T.Group();
        const geo = new T.BoxGeometry(w, h, d);
        const bMesh = new T.Mesh(geo, mat);
        bMesh.position.y = h / 2;
        mesh.add(bMesh);
        
        // Spire cap
        const spire = new T.Mesh(new T.ConeGeometry(w * 0.3, h * 0.3, 4), accentMat);
        spire.position.y = h + h * 0.15;
        mesh.add(spire);
        mesh.position.set(x, yBase || 0, z);
      }
      
      return mesh;
    }

    function makeFloor(size, y, color) {
      if (!THREEOK()) return null;
      const T = window.THREE;
      const geo = new T.PlaneGeometry(size, size, 1, 1);
      const mat = new T.MeshStandardMaterial({ color: color || 0x080a14, roughness: 0.95, metalness: 0.05, emissive: 0x050716 });
      const mesh = new T.Mesh(geo, mat);
      mesh.rotation.x = -Math.PI / 2;
      mesh.position.set(0, y, 0);
      mesh.receiveShadow = true;
      return mesh;
    }

    // Generate the whole city into `opts.scene` (a THREE.Scene or Group).
    function generate(opts) {
      opts = opts || {};
      scene = opts.scene || null;
      if (!flagOn()) return { built: false, reason: 'flag-off' };
      if (!THREEOK()) return { built: false, reason: 'no-THREE' };
      const T = window.THREE;
      if (root) { if (root.parent) root.parent.remove(root); }
      root = new T.Group();
      root.name = 'genesis-procedural-city';
      blocks.clear();
      seed = opts.seed || 1337;

      // Surface build rule: do NOT cover the sacred library at the origin.
      // Populate only the edges/ring around the existing CPL world.
      const grid = opts.grid || 16;
      const spacing = opts.spacing || 28;
      const clearRadius = opts.centerClearRadius || 150;
      const outerRadius = opts.outerRadius || 360;
      const reg = Genesis.EntityRegistry;
      let added = 0;
      for (let i = 0; i < grid; i++) {
        for (let j = 0; j < grid; j++) {
          const x = (i - grid / 2) * spacing + (rng() - 0.5) * 4;
          const z = (j - grid / 2) * spacing + (rng() - 0.5) * 4;
          const dist = Math.hypot(x, z);
          if (dist < clearRadius || dist > outerRadius) continue;
          if (rng() < 0.14) continue;     // scattered edge plazas
          const isTower = rng() > 0.72;
          const w = isTower ? 8 + rng() * 6 : 14 + rng() * 8;
          const d = isTower ? 8 + rng() * 6 : 14 + rng() * 8;
          const h = isTower ? 40 + rng() * 90 : 10 + rng() * 26;
          const hue = 0x1a1a2e + Math.floor(rng() * 0x222222);
          const mesh = makeBlock(x, z, w, d, h, hue, 0);
          if (!mesh) continue;
          mesh.name = 'edge-city-' + i + '-' + j;
          root.add(mesh);
          const id = 'city_' + i + '_' + j;
          const rec = { mesh, baseY: h / 2, kind: isTower ? 'tower' : 'block', h };
          blocks.set(id, rec);
          if (reg) reg.register(mesh, { id, kind: rec.kind, owner: 'edge-city', tags: ['structure', 'edge-city', rec.kind] });
          added++;
        }
      }

      let underAdded = 0;
      if (opts.undercity !== false) {
        const underY = opts.underY || -52;
        const underSize = opts.underSize || 360;
        const floor = makeFloor(underSize, underY, 0x070916);
        if (floor) {
          floor.name = 'undercity-walkable-floor';
          root.add(floor);
          if (reg) reg.register(floor, { id: 'undercity_floor', kind: 'floor', owner: 'undercity', tags: ['undercity', 'walkable', 'floor'] });
        }
        // Four clear shafts mark how to descend, without blocking the central library.
        const shaftPts = [{x: 90, z: 90}, {x: -90, z: 90}, {x: 90, z: -90}, {x: -90, z: -90}];
        for (let s = 0; s < shaftPts.length; s++) {
          const p = shaftPts[s];
          const shaft = makeBlock(p.x, p.z, 7, 7, 52, 0x123355, underY);
          if (!shaft) continue;
          shaft.name = 'undercity-access-shaft-' + s;
          root.add(shaft);
          if (reg) reg.register(shaft, { id: 'undercity_shaft_' + s, kind: 'access-shaft', owner: 'undercity', tags: ['undercity', 'access'] });
        }
        const underGrid = opts.underGrid || 9;
        const underSpacing = opts.underSpacing || 28;
        for (let i = 0; i < underGrid; i++) {
          for (let j = 0; j < underGrid; j++) {
            const x = (i - underGrid / 2) * underSpacing + underSpacing / 2;
            const z = (j - underGrid / 2) * underSpacing + underSpacing / 2;
            if (Math.hypot(x, z) < 35) continue; // keep an under-plaza open
            if (rng() < 0.18) continue;
            const h = 8 + rng() * 32;
            const w = 7 + rng() * 8;
            const d = 7 + rng() * 8;
            const mesh = makeBlock(x, z, w, d, h, 0x0d1830 + Math.floor(rng() * 0x111133), underY);
            if (!mesh) continue;
            mesh.name = 'undercity-block-' + i + '-' + j;
            root.add(mesh);
            const id = 'undercity_' + i + '_' + j;
            blocks.set(id, { mesh, baseY: underY + h / 2, kind: 'undercity-block', h });
            if (reg) reg.register(mesh, { id, kind: 'undercity-block', owner: 'undercity', tags: ['structure', 'undercity'] });
            underAdded++;
          }
        }
      }
      if (scene && typeof scene.add === 'function') scene.add(root);
      return { built: true, blocks: added, undercityBlocks: underAdded, towers: Array.from(blocks.values()).filter((b) => b.kind === 'tower').length, centerClearRadius: clearRadius };
    }

    // Heightmap: deterministic undulating ground plane (realm terrain seed).
    function heightmap(opts) {
      opts = opts || {};
      const size = opts.size || 400;
      const seg = opts.segments || 64;
      const amp = opts.amp || 12;
      const out = [];
      for (let i = 0; i <= seg; i++) {
        const row = [];
        for (let j = 0; j <= seg; j++) {
          const u = i / seg, v = j / seg;
          const y = Math.sin(u * Math.PI * 3 + (opts.seed || 1)) * amp * 0.5
                  + Math.cos(v * Math.PI * 4) * amp * 0.5;
          row.push(y);
        }
        out.push(row);
      }
      return { size, seg, amp, data: out };
    }

    // Mutate a block (raise/lower). CASCADE-gated: model proposes, server decides.
    function proposeMutate(id, delta) {
      const rec = blocks.get(id);
      if (!rec) return { ok: false, reason: 'no-such-block' };
      let allowed = true;
      if (cascadeHook) {
        try { allowed = cascadeHook({ id, delta, kind: rec.kind }); } catch (_) { allowed = false; }
      }
      if (!allowed) return { ok: false, reason: 'cascade-rejected' };
      // Apply: change height by scaling the mesh.
      const nh = Math.max(4, rec.h + delta);
      rec.mesh.scale.y = nh / rec.h;
      rec.mesh.position.y = nh / 2;
      rec.h = nh;
      return { ok: true, id, newHeight: nh };
    }

    const ProceduralCity = {
      flag: '__GENESIS_PROCEDURAL_CITY',
      isEnabled() { return flagOn(); },
      registerCascade(fn) { cascadeHook = (typeof fn === 'function') ? fn : null; return !!cascadeHook; },
      clearCascade() { cascadeHook = null; },
      generate,
      heightmap,
      proposeMutate,
      blockCount() { return blocks.size; },
      // Return block ids (so a citizen/agent can mutate them).
      listBlocks() { return Array.from(blocks.keys()); },
      summary() {
        return {
          enabled: flagOn(),
          built: !!root,
          blockCount: blocks.size,
          cascadeRegistered: !!cascadeHook
        };
      }
    };

    Genesis.ProceduralCity = ProceduralCity;

    if (Genesis.EngineScheduler && typeof Genesis.EngineScheduler.defineTick === 'function') {
      Genesis.EngineScheduler.defineTick('procedural-city', function () {
        // Generation is event-driven (generate()); no per-frame work unless mutated.
      }, function () { return flagOn(); });
    }
    if (typeof Genesis.registerModule === 'function') {
      Genesis.registerModule('procedural-city', { status: 'candidate', path: './src/genesis/procedural-city.js', cascadeGuarded: true });
    }
  }

  if (typeof module !== 'undefined' && module.exports) module.exports = { install };
  if (typeof window !== 'undefined' && window.Genesis) install(window.Genesis);
})();
