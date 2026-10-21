/**
 * procedural-architecture-engine.js
 * Procedural Architecture Engine — Layout Generators, Building Typologies & Greeble System
 * 
 * Provides shared utilities for generating visually distinct, non-repetitive city layouts
 * and building silhouettes. Used by the Main CPL City and all 20 Sovereign Void Realms.
 * 
 * Layout Patterns: Concentric Citadel, Voronoi Organic, Spiral Galaxy, Terraced Ziggurat, Floating Archipelago
 * Building Styles: Gothic Cyberpunk, Biomechanical, Crystal Monolith, Brutalist Industrial, Modular Arcology
 */

(function() {
  'use strict';

  const T = window.THREE;

  // ─── SEEDED RNG ─────────────────────────────────────────────────────
  function mulberry32(seed) {
    return function() {
      seed |= 0; seed = seed + 0x6D2B79F5 | 0;
      let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }

  // ─── LAYOUT GENERATORS ──────────────────────────────────────────────

  /**
   * Concentric Citadel Layout
   * Central structure surrounded by circular rings of buildings with radial avenues
   */
  function layoutConcentric(count, radius, seed) {
    const rng = mulberry32(seed || 42);
    const positions = [];
    const rings = 4;
    const perRing = Math.floor(count / rings);

    for (let ring = 0; ring < rings; ring++) {
      const r = (radius * 0.15) + (radius * 0.85) * (ring / (rings - 1));
      const n = ring === 0 ? Math.max(1, Math.floor(perRing * 0.3)) : perRing + Math.floor(rng() * 6 - 3);
      for (let i = 0; i < n; i++) {
        const angle = (i / n) * Math.PI * 2 + rng() * 0.15;
        const jitterR = r + (rng() - 0.5) * radius * 0.06;
        positions.push({
          x: Math.cos(angle) * jitterR,
          z: Math.sin(angle) * jitterR,
          ring: ring,
          angle: angle,
          distFromCenter: jitterR / radius,
          height: ring === 0 ? 1.5 + rng() * 0.5 : 0.4 + rng() * 0.8
        });
      }
    }
    return positions;
  }

  /**
   * Voronoi Organic Layout
   * Cellular clusters with organic, winding road borders
   */
  function layoutVoronoi(count, radius, seed) {
    const rng = mulberry32(seed || 77);
    const positions = [];
    const clusters = 8 + Math.floor(rng() * 5);
    const centersX = [], centersZ = [];

    for (let c = 0; c < clusters; c++) {
      const angle = rng() * Math.PI * 2;
      const r = rng() * radius * 0.8;
      centersX.push(Math.cos(angle) * r);
      centersZ.push(Math.sin(angle) * r);
    }

    for (let i = 0; i < count; i++) {
      const ci = Math.floor(rng() * clusters);
      const spread = radius * 0.18;
      const x = centersX[ci] + (rng() - 0.5) * spread;
      const z = centersZ[ci] + (rng() - 0.5) * spread;
      const dist = Math.sqrt(x * x + z * z) / radius;
      positions.push({
        x, z,
        cluster: ci,
        distFromCenter: dist,
        height: 0.3 + rng() * 1.0
      });
    }
    return positions;
  }

  /**
   * Spiral Galaxy Layout
   * Buildings along logarithmic spiral arms from a central core
   */
  function layoutSpiral(count, radius, seed) {
    const rng = mulberry32(seed || 137);
    const positions = [];
    const arms = 4;
    const perArm = Math.floor(count / arms);
    const armOffset = (Math.PI * 2) / arms;

    for (let arm = 0; arm < arms; arm++) {
      for (let i = 0; i < perArm; i++) {
        const t = i / perArm;
        const angle = arm * armOffset + t * Math.PI * 2.5 + rng() * 0.2;
        const r = radius * 0.08 + t * radius * 0.85 + (rng() - 0.5) * radius * 0.08;
        positions.push({
          x: Math.cos(angle) * r,
          z: Math.sin(angle) * r,
          arm: arm,
          distFromCenter: r / radius,
          height: (1 - t) * 1.2 + rng() * 0.4
        });
      }
    }
    return positions;
  }

  /**
   * Terraced Ziggurat Layout
   * Multi-tier stepped platforms with buildings at different Y-levels
   */
  function layoutTerraced(count, radius, seed) {
    const rng = mulberry32(seed || 256);
    const positions = [];
    const tiers = 5;
    const perTier = Math.floor(count / tiers);

    for (let tier = 0; tier < tiers; tier++) {
      const tierRadius = radius * (1 - tier * 0.15);
      const yBase = tier * 8;
      for (let i = 0; i < perTier; i++) {
        const angle = rng() * Math.PI * 2;
        const r = rng() * tierRadius;
        positions.push({
          x: Math.cos(angle) * r,
          z: Math.sin(angle) * r,
          y: yBase,
          tier: tier,
          distFromCenter: r / radius,
          height: 0.3 + rng() * 0.6
        });
      }
    }
    return positions;
  }

  /**
   * Floating Archipelago Layout
   * Islands at varying Y-altitudes connected by energy bridges
   */
  function layoutArchipelago(count, radius, seed) {
    const rng = mulberry32(seed || 512);
    const positions = [];
    const islands = 7 + Math.floor(rng() * 4);
    const islandCenters = [];

    for (let isl = 0; isl < islands; isl++) {
      const angle = rng() * Math.PI * 2;
      const r = rng() * radius * 0.85;
      const y = -15 + rng() * 30;
      islandCenters.push({ x: Math.cos(angle) * r, z: Math.sin(angle) * r, y });
    }

    const perIsland = Math.floor(count / islands);
    for (let isl = 0; isl < islands; isl++) {
      const c = islandCenters[isl];
      const spread = radius * 0.12;
      for (let i = 0; i < perIsland; i++) {
        positions.push({
          x: c.x + (rng() - 0.5) * spread,
          z: c.z + (rng() - 0.5) * spread,
          y: c.y,
          island: isl,
          distFromCenter: Math.sqrt(c.x * c.x + c.z * c.z) / radius,
          height: 0.3 + rng() * 0.8
        });
      }
    }

    // Store island centers for bridge generation
    positions._islandCenters = islandCenters;
    return positions;
  }

  // ─── BUILDING GENERATORS ────────────────────────────────────────────

  /**
   * Gothic Cyberpunk Tower
   * Composite: box base + narrowing tiers + pointed spire cap + buttress wings + procedural art maps
   */
  function buildGothicTower(height, width, mat, accentMat, rng) {
    const group = new T.Group();
    const tiers = 2 + Math.floor(rng() * 3);
    let currentY = 0;
    let currentW = width;

    // Apply procedural art material if available
    const artMat = window.ProceduralArtEngine ? window.ProceduralArtEngine.createArtMaterial(0x1a1a2e, { hasWindows: true, emissiveColor: '#00ffcc' }) : mat;

    for (let t = 0; t < tiers; t++) {
      const tierH = height / tiers * (1 + (rng() - 0.5) * 0.3);
      const geo = new T.BoxGeometry(currentW, tierH, currentW);
      const mesh = new T.Mesh(geo, artMat);
      mesh.position.y = currentY + tierH / 2;
      group.add(mesh);

      // Ledge between tiers
      if (t < tiers - 1) {
        const ledge = new T.Mesh(
          new T.BoxGeometry(currentW + 1, 0.5, currentW + 1), accentMat
        );
        ledge.position.y = currentY + tierH;
        group.add(ledge);
      }

      currentY += tierH;
      currentW *= 0.8;
    }

    // Pointed spire cap
    const spire = new T.Mesh(
      new T.ConeGeometry(currentW * 0.5, height * 0.25, 4),
      accentMat
    );
    spire.position.y = currentY + height * 0.125;
    group.add(spire);

    // Buttress wings
    for (let s = 0; s < 2; s++) {
      const buttress = new T.Mesh(
        new T.BoxGeometry(0.8, height * 0.4, width * 0.2), artMat
      );
      buttress.position.set(
        (s === 0 ? 1 : -1) * (width * 0.55),
        height * 0.2,
        0
      );
      group.add(buttress);
    }

    return group;
  }

  /**
   * Biomechanical Spore Tower
   * Composite: cylinder stem + sphere pod clusters + tendril antennae
   */
  function buildBioTower(height, width, mat, glowMat, rng) {
    const group = new T.Group();

    // Main stem (tapered cylinder)
    const stem = new T.Mesh(
      new T.CylinderGeometry(width * 0.3, width * 0.5, height, 8),
      mat
    );
    stem.position.y = height / 2;
    group.add(stem);

    // Pod clusters along stem
    const pods = 2 + Math.floor(rng() * 4);
    for (let p = 0; p < pods; p++) {
      const py = height * 0.2 + (p / pods) * height * 0.6;
      const angle = rng() * Math.PI * 2;
      const pod = new T.Mesh(
        new T.SphereGeometry(width * (0.2 + rng() * 0.25), 8, 6),
        rng() > 0.5 ? glowMat : mat
      );
      pod.position.set(
        Math.cos(angle) * width * 0.4,
        py,
        Math.sin(angle) * width * 0.4
      );
      group.add(pod);
    }

    // Top cap (flattened sphere)
    const cap = new T.Mesh(
      new T.SphereGeometry(width * 0.5, 8, 6),
      glowMat
    );
    cap.position.y = height;
    cap.scale.y = 0.4;
    group.add(cap);

    return group;
  }

  /**
   * Crystal Monolith
   * Composite: octahedron base + floating shard fragments + torus energy ring
   */
  function buildCrystalMonolith(height, width, mat, glowMat, rng) {
    const group = new T.Group();

    // Main crystal (octahedron stretched vertically)
    const main = new T.Mesh(
      new T.OctahedronGeometry(width * 0.5, 0),
      mat
    );
    main.scale.y = height / width;
    main.position.y = height * 0.5;
    group.add(main);

    // Floating shard fragments
    const shards = 3 + Math.floor(rng() * 4);
    for (let s = 0; s < shards; s++) {
      const shard = new T.Mesh(
        new T.OctahedronGeometry(width * (0.08 + rng() * 0.12), 0),
        rng() > 0.5 ? glowMat : mat
      );
      const angle = rng() * Math.PI * 2;
      const r = width * 0.4 + rng() * width * 0.3;
      shard.position.set(
        Math.cos(angle) * r,
        height * 0.3 + rng() * height * 0.5,
        Math.sin(angle) * r
      );
      shard.rotation.set(rng() * Math.PI, rng() * Math.PI, rng() * Math.PI);
      shard.userData.floatSpeed = 0.5 + rng() * 1.5;
      shard.userData.floatOffset = rng() * Math.PI * 2;
      shard.userData.isFloatingShard = true;
      group.add(shard);
    }

    // Energy ring
    if (rng() > 0.3) {
      const ring = new T.Mesh(
        new T.TorusGeometry(width * 0.6, 0.15, 8, 16),
        glowMat
      );
      ring.position.y = height * 0.6;
      ring.rotation.x = Math.PI / 2;
      ring.userData.isEnergyRing = true;
      ring.userData.ringSpeed = 0.5 + rng();
      group.add(ring);
    }

    return group;
  }

  /**
   * Industrial Ziggurat
   * Composite: stepped box tiers + chimney stacks + pipe conduits + crane arms
   */
  function buildIndustrialZiggurat(height, width, mat, accentMat, rng) {
    const group = new T.Group();
    const steps = 3 + Math.floor(rng() * 3);
    let currentY = 0;

    for (let s = 0; s < steps; s++) {
      const stepW = width * (1 - s * 0.15);
      const stepH = height / steps;
      const step = new T.Mesh(
        new T.BoxGeometry(stepW, stepH, stepW * (0.8 + rng() * 0.4)),
        mat
      );
      step.position.y = currentY + stepH / 2;
      group.add(step);
      currentY += stepH;
    }

    // Chimney stacks
    const chimneys = 1 + Math.floor(rng() * 3);
    for (let c = 0; c < chimneys; c++) {
      const chimney = new T.Mesh(
        new T.CylinderGeometry(0.4, 0.6, height * 0.3, 6),
        accentMat
      );
      chimney.position.set(
        (rng() - 0.5) * width * 0.6,
        currentY + height * 0.15,
        (rng() - 0.5) * width * 0.6
      );
      group.add(chimney);
    }

    // Crane arm (on tall buildings)
    if (height > 15 && rng() > 0.5) {
      const arm = new T.Mesh(
        new T.BoxGeometry(width * 0.8, 0.3, 0.3), accentMat
      );
      arm.position.set(width * 0.2, currentY + 1, 0);
      group.add(arm);
      const mast = new T.Mesh(
        new T.CylinderGeometry(0.2, 0.2, 3, 4), accentMat
      );
      mast.position.set(-width * 0.1, currentY + 1.5, 0);
      group.add(mast);
    }

    return group;
  }

  /**
   * Arcology Module Tower
   * Composite: segmented cylinder sections + cantilevered balcony rings + antenna spire
   */
  function buildArcologyTower(height, width, mat, glassMat, rng) {
    const group = new T.Group();
    const segments = 3 + Math.floor(rng() * 4);
    let currentY = 0;

    for (let s = 0; s < segments; s++) {
      const segH = height / segments;
      const segR = width * 0.4 * (1 + (rng() - 0.5) * 0.3);
      const seg = new T.Mesh(
        new T.CylinderGeometry(segR * 0.9, segR, segH, 8),
        mat
      );
      seg.position.y = currentY + segH / 2;
      group.add(seg);

      // Balcony ring between segments
      if (s < segments - 1 && rng() > 0.3) {
        const balcony = new T.Mesh(
          new T.TorusGeometry(segR + 0.5, 0.3, 4, 12),
          glassMat
        );
        balcony.position.y = currentY + segH;
        balcony.rotation.x = Math.PI / 2;
        group.add(balcony);
      }
      currentY += segH;
    }

    // Antenna spire
    const antenna = new T.Mesh(
      new T.CylinderGeometry(0.1, 0.15, height * 0.2, 4),
      glassMat
    );
    antenna.position.y = currentY + height * 0.1;
    group.add(antenna);

    // Satellite dish
    if (rng() > 0.5) {
      const dish = new T.Mesh(
        new T.SphereGeometry(width * 0.2, 8, 4, 0, Math.PI * 2, 0, Math.PI * 0.5),
        glassMat
      );
      dish.position.set(width * 0.3, currentY - 2, 0);
      dish.rotation.x = -0.5;
      group.add(dish);
    }

    return group;
  }

  // ─── GREEBLE ENGINE ─────────────────────────────────────────────────

  /**
   * Add surface greebles to a building group based on height and style
   */
  function addGreebles(group, height, width, style, mat, rng) {
    const topY = height;

    // Roof elements
    if (rng() > 0.4) {
      // Antenna mast
      const mast = new T.Mesh(
        new T.CylinderGeometry(0.05, 0.08, 2 + rng() * 3, 4), mat
      );
      mast.position.set((rng() - 0.5) * width * 0.3, topY + 1.5, (rng() - 0.5) * width * 0.3);
      group.add(mast);
    }

    if (rng() > 0.6) {
      // Communication dish
      const dish = new T.Mesh(
        new T.ConeGeometry(0.5, 0.3, 8, 1, true), mat
      );
      dish.position.set((rng() - 0.5) * width * 0.3, topY + 0.5, (rng() - 0.5) * width * 0.3);
      dish.rotation.x = -0.8;
      group.add(dish);
    }

    if (height > 20 && rng() > 0.6) {
      // Helipad (flat cylinder on roof)
      const pad = new T.Mesh(
        new T.CylinderGeometry(width * 0.25, width * 0.25, 0.2, 8), mat
      );
      pad.position.y = topY + 0.1;
      group.add(pad);
    }

    // Facade conduits (vertical pipe on side)
    if (rng() > 0.5) {
      const pipe = new T.Mesh(
        new T.CylinderGeometry(0.1, 0.1, height * 0.6, 4), mat
      );
      pipe.position.set(width * 0.48, height * 0.3, 0);
      group.add(pipe);
    }

    // HVAC unit on lower roof
    if (height > 10 && rng() > 0.5) {
      const hvac = new T.Mesh(
        new T.BoxGeometry(1, 0.8, 0.6), mat
      );
      hvac.position.set((rng() - 0.5) * width * 0.3, topY + 0.4, (rng() - 0.5) * width * 0.3);
      group.add(hvac);
    }

    return group;
  }

  // ─── SKYBRIDGE GENERATOR ────────────────────────────────────────────

  function createSkybridge(startPos, endPos, mat) {
    const dir = new T.Vector3().subVectors(endPos, startPos);
    const length = dir.length();
    const mid = new T.Vector3().addVectors(startPos, endPos).multiplyScalar(0.5);

    const bridge = new T.Mesh(
      new T.BoxGeometry(0.8, 0.4, length),
      mat
    );
    bridge.position.copy(mid);
    bridge.lookAt(endPos);
    return bridge;
  }

  // ─── ENERGY BRIDGE GENERATOR (for archipelago) ──────────────────────

  function createEnergyBridge(startPos, endPos, glowMat) {
    const group = new T.Group();
    const dir = new T.Vector3().subVectors(endPos, startPos);
    const length = dir.length();
    const segments = Math.max(4, Math.floor(length / 8));

    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      const pos = new T.Vector3().lerpVectors(startPos, endPos, t);
      pos.y += Math.sin(t * Math.PI) * 3; // arc
      const node = new T.Mesh(
        new T.SphereGeometry(0.3, 6, 4),
        glowMat
      );
      node.position.copy(pos);
      group.add(node);
    }

    return group;
  }

  // ─── PARTICLE SYSTEM GENERATOR ──────────────────────────────────────

  function createParticleField(count, bounds, color, size, type) {
    const geo = new T.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const velocities = new Float32Array(count * 3);
    const lifetimes = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * bounds * 2;
      positions[i * 3 + 1] = Math.random() * bounds * 0.5;
      positions[i * 3 + 2] = (Math.random() - 0.5) * bounds * 2;

      if (type === 'rise') {
        velocities[i * 3] = (Math.random() - 0.5) * 0.02;
        velocities[i * 3 + 1] = 0.02 + Math.random() * 0.04;
        velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.02;
      } else if (type === 'fall') {
        velocities[i * 3] = (Math.random() - 0.5) * 0.01;
        velocities[i * 3 + 1] = -0.01 - Math.random() * 0.03;
        velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.01;
      } else {
        velocities[i * 3] = (Math.random() - 0.5) * 0.01;
        velocities[i * 3 + 1] = (Math.random() - 0.5) * 0.01;
        velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.01;
      }

      lifetimes[i] = Math.random();
    }

    geo.setAttribute('position', new T.BufferAttribute(positions, 3));

    const mat = new T.PointsMaterial({
      color: color,
      size: size || 0.3,
      transparent: true,
      opacity: 0.7,
      depthWrite: false
    });

    const points = new T.Points(geo, mat);
    points.userData = {
      vel: velocities,
      life: lifetimes,
      count: count,
      bounds: bounds,
      type: type || 'drift'
    };

    return points;
  }

  // ─── EXPORTS ────────────────────────────────────────────────────────

  window.ProceduralArchitecture = {
    // Layout generators
    layoutConcentric,
    layoutVoronoi,
    layoutSpiral,
    layoutTerraced,
    layoutArchipelago,

    // Building generators
    buildGothicTower,
    buildBioTower,
    buildCrystalMonolith,
    buildIndustrialZiggurat,
    buildArcologyTower,

    // Utilities
    addGreebles,
    createSkybridge,
    createEnergyBridge,
    createParticleField,
    mulberry32
  };

  console.log('[ProceduralArchitecture] Engine loaded — 5 layouts, 5 typologies, greeble system ready');
})();
