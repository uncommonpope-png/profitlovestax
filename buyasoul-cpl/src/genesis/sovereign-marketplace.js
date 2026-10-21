// ═══════════════════════════════════════════════════════════════════════════════
//  src/genesis/sovereign-marketplace.js
//  BUYASOUL CPL / GODFORGE — Sovereign Marketplace Realm
//  A bustling bazaar for cloths, weapons, soldiers, tanks, NPCs, and warships.
//  Procedural. Zero external assets. GPU-safe.
// ═══════════════════════════════════════════════════════════════════════════════
(function() {
  'use strict';

  // ── helpers ──────────────────────────────────────────────────────────────────
  function rand(min, max) { return Math.random() * (max - min) + min; }
  function randInt(min, max) { return Math.floor(rand(min, max + 1)); }
  function choice(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

  // ── palette ──────────────────────────────────────────────────────────────────
  const PAL = {
    stone:   0x5a5a5a,
    darkStone: 0x3a3a3a,
    sand:    0xc2b280,
    bronze:  0xcd7f32,
    steel:   0x708090,
    gold:    0xffd700,
    crimson: 0x8b0000,
    emerald: 0x00a86b,
    cobalt:  0x0047ab,
    voidPurple: 0x4b0082,
    glowCyan: 0x00ffff,
    glowAmber: 0xffaa00,
    wood:    0x8b4513,
    clothRed: 0xaa2222,
    clothBlue: 0x2222aa,
    clothGreen: 0x22aa22,
    clothGold: 0xccaa00,
    leather: 0x8b5a2b,
  };

  // ── geometry cache ───────────────────────────────────────────────────────────
  const GEO_CACHE = {};
  function getGeo(type, ...args) {
    const key = type + args.join(',');
    if (!GEO_CACHE[key]) {
      switch (type) {
        case 'box':    GEO_CACHE[key] = new THREE.BoxGeometry(...args); break;
        case 'cyl':    GEO_CACHE[key] = new THREE.CylinderGeometry(...args); break;
        case 'cone':   GEO_CACHE[key] = new THREE.ConeGeometry(...args); break;
        case 'sphere': GEO_CACHE[key] = new THREE.SphereGeometry(...args); break;
        case 'torus':  GEO_CACHE[key] = new THREE.TorusGeometry(...args); break;
        case 'octa':   GEO_CACHE[key] = new THREE.OctahedronGeometry(...args); break;
      }
    }
    return GEO_CACHE[key];
  }

  // ── material factory ─────────────────────────────────────────────────────────
  const MAT_CACHE = {};
  function getMat(color, opts) {
    opts = opts || {};
    const key = color + JSON.stringify(opts);
    if (!MAT_CACHE[key]) {
      if (opts.emissive) {
        MAT_CACHE[key] = new THREE.MeshBasicMaterial({
          color: color,
          transparent: opts.transparent || false,
          opacity: opts.opacity || 1.0,
        });
      } else {
        MAT_CACHE[key] = new THREE.MeshStandardMaterial({
          color: color,
          roughness: opts.roughness !== undefined ? opts.roughness : 0.7,
          metalness: opts.metalness !== undefined ? opts.metalness : 0.3,
          transparent: opts.transparent || false,
          opacity: opts.opacity || 1.0,
        });
      }
    }
    return MAT_CACHE[key];
  }

  // ── shared particle system ───────────────────────────────────────────────────
  function makeParticles(count, color, spread, yBase) {
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3]     = (Math.random() - 0.5) * spread;
      pos[i * 3 + 1] = yBase + Math.random() * spread * 0.5;
      pos[i * 3 + 2] = (Math.random() - 0.5) * spread;
    }
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const mat = new THREE.PointsMaterial({
      color: color,
      size: 0.15,
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    return new THREE.Points(geo, mat);
  }

  // ═════════════════════════════════════════════════════════════════════════════
  //  DISTRICT BUILDERS
  // ═════════════════════════════════════════════════════════════════════════════

  // ── 1. GROUND PLAZA ──────────────────────────────────────────────────────────
  function buildPlaza() {
    const g = new THREE.Group();
    // main floor
    const floor = new THREE.Mesh(
      getGeo('box', 120, 1, 120),
      getMat(PAL.sand, { roughness: 0.9, metalness: 0.0 })
    );
    floor.position.y = -0.5;
    g.add(floor);

    // cobblestone tiles
    for (let x = -55; x <= 55; x += 5) {
      for (let z = -55; z <= 55; z += 5) {
        if (Math.random() > 0.6) {
          const tile = new THREE.Mesh(
            getGeo('box', 4.8, 0.05, 4.8),
            getMat(PAL.darkStone, { roughness: 0.95 })
          );
          tile.position.set(x, 0.03, z);
          g.add(tile);
        }
      }
    }

    // central fountain
    const fBase = new THREE.Mesh(
      getGeo('cyl', 6, 6, 1.5, 16),
      getMat(PAL.stone, { roughness: 0.8 })
    );
    fBase.position.y = 0.75;
    g.add(fBase);

    const fBowl = new THREE.Mesh(
      getGeo('cyl', 4.5, 5, 1, 16),
      getMat(PAL.bronze, { metalness: 0.6 })
    );
    fBowl.position.y = 2;
    g.add(fBowl);

    const fPillar = new THREE.Mesh(
      getGeo('cyl', 0.6, 0.6, 4, 8),
      getMat(PAL.gold, { metalness: 0.8 })
    );
    fPillar.position.y = 4.5;
    g.add(fPillar);

    const fOrb = new THREE.Mesh(
      getGeo('sphere', 1.2, 16, 16),
      getMat(PAL.glowCyan, { emissive: true })
    );
    fOrb.position.y = 7;
    g.add(fOrb);

    // fountain glow particles
    const fParticles = makeParticles(80, PAL.glowCyan, 3, 6);
    g.add(fParticles);
    g.userData.fountainParticles = fParticles;
    g.userData.fountainOrb = fOrb;

    // boundary walls (low)
    for (let i = 0; i < 4; i++) {
      const angle = (i / 4) * Math.PI * 2;
      const wx = Math.cos(angle) * 58;
      const wz = Math.sin(angle) * 58;
      const wall = new THREE.Mesh(
        getGeo('box', 4, 3, 120),
        getMat(PAL.stone, { roughness: 0.85 })
      );
      wall.position.set(wx, 1.5, wz);
      wall.rotation.y = -angle;
      g.add(wall);
    }

    // corner towers
    const corners = [[-58,-58], [58,-58], [58,58], [-58,58]];
    corners.forEach(([cx, cz]) => {
      const tower = new THREE.Mesh(
        getGeo('cyl', 3, 3, 12, 8),
        getMat(PAL.darkStone, { roughness: 0.8 })
      );
      tower.position.set(cx, 6, cz);
      g.add(tower);
      const tRoof = new THREE.Mesh(
        getGeo('cone', 4, 4, 8),
        getMat(PAL.bronze, { metalness: 0.5 })
      );
      tRoof.position.set(cx, 13, cz);
      g.add(tRoof);
      const tLight = new THREE.Mesh(
        getGeo('sphere', 0.8, 8, 8),
        getMat(PAL.glowAmber, { emissive: true })
      );
      tLight.position.set(cx, 14.5, cz);
      g.add(tLight);
    });

    return g;
  }

  // ── 2. CLOTH & ARMOR STALLS (North-West) ────────────────────────────────────
  function buildClothStalls() {
    const g = new THREE.Group();
    const clothColors = [PAL.clothRed, PAL.clothBlue, PAL.clothGreen, PAL.clothGold];

    for (let i = 0; i < 8; i++) {
      const sx = -40 + (i % 4) * 12;
      const sz = -40 + Math.floor(i / 4) * 12;
      const stall = new THREE.Group();
      stall.position.set(sx, 0, sz);

      // table
      const table = new THREE.Mesh(
        getGeo('box', 3, 0.8, 2),
        getMat(PAL.wood, { roughness: 0.9 })
      );
      table.position.y = 0.4;
      stall.add(table);

      // legs
      [-1.2, 1.2].forEach(lx => {
        [-0.7, 0.7].forEach(lz => {
          const leg = new THREE.Mesh(
            getGeo('box', 0.15, 0.8, 0.15),
            getMat(PAL.wood)
          );
          leg.position.set(lx, 0.4, lz);
          stall.add(leg);
        });
      });

      // canopy poles
      [-1.3, 1.3].forEach(px => {
        const pole = new THREE.Mesh(
          getGeo('cyl', 0.08, 0.08, 3.5, 6),
          getMat(PAL.wood)
        );
        pole.position.set(px, 1.75, 0);
        stall.add(pole);
      });

      // canopy cloth
      const canopy = new THREE.Mesh(
        getGeo('box', 3.2, 0.1, 2.4),
        getMat(choice(clothColors), { roughness: 0.6 })
      );
      canopy.position.y = 3.6;
      stall.add(canopy);

      // hanging cloth samples
      for (let c = 0; c < 3; c++) {
        const sample = new THREE.Mesh(
          getGeo('box', 0.6, 1.2, 0.05),
          getMat(choice(clothColors), { roughness: 0.6 })
        );
        sample.position.set(-0.8 + c * 0.8, 2.8, 1.1);
        stall.add(sample);
      }

      // armor stand (cylinder + sphere)
      const aStand = new THREE.Mesh(
        getGeo('cyl', 0.3, 0.3, 1.8, 8),
        getMat(PAL.steel, { metalness: 0.7 })
      );
      aStand.position.set(0, 1.3, -0.8);
      stall.add(aStand);
      const aHelm = new THREE.Mesh(
        getGeo('sphere', 0.35, 8, 8),
        getMat(PAL.steel, { metalness: 0.7 })
      );
      aHelm.position.set(0, 2.4, -0.8);
      stall.add(aHelm);

      g.add(stall);
    }
    return g;
  }

  // ── 3. WEAPON FORGE (North-East) ─────────────────────────────────────────────
  function buildWeaponForge() {
    const g = new THREE.Group();

    // forge building
    const forgeBase = new THREE.Mesh(
      getGeo('box', 18, 5, 14),
      getMat(PAL.darkStone, { roughness: 0.85 })
    );
    forgeBase.position.set(40, 2.5, -40);
    g.add(forgeBase);

    const forgeRoof = new THREE.Mesh(
      getGeo('cone', 12, 6, 4),
      getMat(PAL.bronze, { metalness: 0.5 })
    );
    forgeRoof.position.set(40, 8, -40);
    g.add(forgeRoof);

    // chimneys
    [-4, 4].forEach(cx => {
      const chimney = new THREE.Mesh(
        getGeo('cyl', 0.8, 0.8, 6, 8),
        getMat(PAL.darkStone)
      );
      chimney.position.set(40 + cx, 8, -40);
      g.add(chimney);
      // smoke particles
      const smoke = makeParticles(30, PAL.glowAmber, 2, 11);
      smoke.position.set(40 + cx, 11, -40);
      g.add(smoke);
    });

    // anvils
    for (let i = 0; i < 4; i++) {
      const ax = 32 + (i % 2) * 16;
      const az = -32 - Math.floor(i / 2) * 10;
      const anvilBase = new THREE.Mesh(
        getGeo('box', 1.5, 1.2, 1.5),
        getMat(PAL.stone)
      );
      anvilBase.position.set(ax, 0.6, az);
      g.add(anvilBase);
      const anvilTop = new THREE.Mesh(
        getGeo('box', 2, 0.6, 1.2),
        getMat(PAL.steel, { metalness: 0.8 })
      );
      anvilTop.position.set(ax, 1.5, az);
      g.add(anvilTop);

      // glowing weapon on anvil
      const blade = new THREE.Mesh(
        getGeo('box', 0.1, 2.5, 0.3),
        getMat(PAL.glowCyan, { emissive: true })
      );
      blade.position.set(ax, 2.8, az);
      blade.rotation.z = rand(-0.3, 0.3);
      g.add(blade);
    }

    // weapon racks (swords)
    for (let r = 0; r < 6; r++) {
      const rx = 28 + r * 4;
      const rz = -48;
      const rack = new THREE.Mesh(
        getGeo('box', 0.2, 3, 0.2),
        getMat(PAL.wood)
      );
      rack.position.set(rx, 1.5, rz);
      g.add(rack);
      const rack2 = new THREE.Mesh(
        getGeo('box', 0.2, 3, 0.2),
        getMat(PAL.wood)
      );
      rack2.position.set(rx, 1.5, rz + 1.5);
      g.add(rack2);
      const crossbar = new THREE.Mesh(
        getGeo('box', 0.2, 0.2, 1.7),
        getMat(PAL.wood)
      );
      crossbar.position.set(rx, 2.5, rz + 0.75);
      g.add(crossbar);

      // swords on rack
      for (let s = 0; s < 3; s++) {
        const sword = new THREE.Mesh(
          getGeo('box', 0.05, 1.8, 0.08),
          getMat(PAL.steel, { metalness: 0.8 })
        );
        sword.position.set(rx, 3.2, rz + 0.3 + s * 0.5);
        sword.rotation.z = rand(-0.1, 0.1);
        g.add(sword);
        const hilt = new THREE.Mesh(
          getGeo('box', 0.3, 0.1, 0.1),
          getMat(PAL.bronze, { metalness: 0.6 })
        );
        hilt.position.set(rx, 2.2, rz + 0.3 + s * 0.5);
        g.add(hilt);
      }
    }

    return g;
  }

  // ── 4. SOLDIER BARRACKS (South-West) ───────────────────────────────────────────
  function buildBarracks() {
    const g = new THREE.Group();

    // main barracks hall
    const hall = new THREE.Mesh(
      getGeo('box', 24, 6, 14),
      getMat(PAL.stone, { roughness: 0.8 })
    );
    hall.position.set(-40, 3, 35);
    g.add(hall);

    const hallRoof = new THREE.Mesh(
      getGeo('cone', 16, 7, 4),
      getMat(PAL.bronze, { metalness: 0.5 })
    );
    hallRoof.position.set(-40, 9.5, 35);
    g.add(hallRoof);

    // training dummies
    for (let i = 0; i < 6; i++) {
      const dx = -50 + i * 4;
      const dz = 48;
      const post = new THREE.Mesh(
        getGeo('cyl', 0.15, 0.15, 2.5, 6),
        getMat(PAL.wood)
      );
      post.position.set(dx, 1.25, dz);
      g.add(post);
      const dummy = new THREE.Mesh(
        getGeo('cyl', 0.5, 0.5, 1.2, 8),
        getMat(PAL.leather, { roughness: 0.8 })
      );
      dummy.position.set(dx, 2.8, dz);
      g.add(dummy);
      const dHead = new THREE.Mesh(
        getGeo('sphere', 0.3, 8, 8),
        getMat(PAL.leather)
      );
      dHead.position.set(dx, 3.6, dz);
      g.add(dHead);
    }

    // formation markers
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 5; col++) {
        const mx = -48 + col * 4;
        const mz = 22 + row * 4;
        const marker = new THREE.Mesh(
          getGeo('cyl', 0.3, 0.3, 0.1, 8),
          getMat(PAL.crimson, { emissive: true })
        );
        marker.position.set(mx, 0.05, mz);
        g.add(marker);
      }
    }

    // flagpoles with banners
    [-12, 12].forEach(fx => {
      const pole = new THREE.Mesh(
        getGeo('cyl', 0.15, 0.15, 10, 6),
        getMat(PAL.wood)
      );
      pole.position.set(-40 + fx, 5, 42);
      g.add(pole);
      const banner = new THREE.Mesh(
        getGeo('box', 3, 2, 0.1),
        getMat(PAL.crimson, { roughness: 0.6 })
      );
      banner.position.set(-40 + fx + 1.5, 8, 42);
      g.add(banner);
    });

    return g;
  }

  // ── 5. TANK DEPOT (South-East) ─────────────────────────────────────────────────
  function buildTankDepot() {
    const g = new THREE.Group();

    // depot hangar
    const hangar = new THREE.Mesh(
      getGeo('box', 28, 8, 20),
      getMat(PAL.steel, { metalness: 0.5, roughness: 0.6 })
    );
    hangar.position.set(40, 4, 40);
    g.add(hangar);

    const hangarRoof = new THREE.Mesh(
      getGeo('cone', 20, 10, 4),
      getMat(PAL.darkStone, { roughness: 0.8 })
    );
    hangarRoof.position.set(40, 12, 40);
    g.add(hangarRoof);

    // tanks on display
    for (let t = 0; t < 3; t++) {
      const tx = 28 + t * 12;
      const tz = 52;
      const tank = new THREE.Group();
      tank.position.set(tx, 0, tz);

      // treads
      [-1.2, 1.2].forEach(lx => {
        const tread = new THREE.Mesh(
          getGeo('box', 0.8, 0.6, 4),
          getMat(PAL.darkStone, { roughness: 0.9 })
        );
        tread.position.set(lx, 0.3, 0);
        tank.add(tread);
      });

      // hull
      const hull = new THREE.Mesh(
        getGeo('box', 2.8, 1.2, 3.5),
        getMat(PAL.steel, { metalness: 0.6 })
      );
      hull.position.y = 1.2;
      tank.add(hull);

      // turret
      const turret = new THREE.Mesh(
        getGeo('cyl', 1, 1, 0.8, 12),
        getMat(PAL.steel, { metalness: 0.6 })
      );
      turret.position.y = 2.2;
      tank.add(turret);

      // barrel
      const barrel = new THREE.Mesh(
        getGeo('cyl', 0.2, 0.2, 3.5, 8),
        getMat(PAL.darkStone)
      );
      barrel.position.set(0, 2.2, 2);
      barrel.rotation.x = Math.PI / 2;
      tank.add(barrel);

      // muzzle glow
      const muzzle = new THREE.Mesh(
        getGeo('sphere', 0.3, 8, 8),
        getMat(PAL.glowAmber, { emissive: true })
      );
      muzzle.position.set(0, 2.2, 3.8);
      tank.add(muzzle);
      tank.userData.muzzle = muzzle;

      g.add(tank);
      g.userData.tanks = g.userData.tanks || [];
      g.userData.tanks.push(tank);
    }

    // fuel drums
    for (let d = 0; d < 8; d++) {
      const drum = new THREE.Mesh(
        getGeo('cyl', 0.8, 0.8, 1.6, 12),
        getMat(PAL.bronze, { metalness: 0.5 })
      );
      drum.position.set(32 + (d % 4) * 3, 0.8, 30 + Math.floor(d / 4) * 3);
      g.add(drum);
    }

    return g;
  }

  // ── 6. NPC TAVERN / GATHERING HALL (Center-North) ──────────────────────────────
  function buildNPCHall() {
    const g = new THREE.Group();

    // tavern building
    const tavern = new THREE.Mesh(
      getGeo('box', 16, 7, 16),
      getMat(PAL.wood, { roughness: 0.85 })
    );
    tavern.position.set(0, 3.5, -35);
    g.add(tavern);

    const tRoof = new THREE.Mesh(
      getGeo('cone', 14, 8, 4),
      getMat(PAL.bronze, { metalness: 0.5 })
    );
    tRoof.position.set(0, 9, -35);
    g.add(tRoof);

    // tables & stools
    for (let i = 0; i < 6; i++) {
      const tx = -5 + (i % 3) * 5;
      const tz = -30 - Math.floor(i / 3) * 5;
      const table = new THREE.Mesh(
        getGeo('cyl', 1, 1, 0.1, 8),
        getMat(PAL.wood)
      );
      table.position.set(tx, 0.8, tz);
      g.add(table);
      const tLeg = new THREE.Mesh(
        getGeo('cyl', 0.1, 0.1, 0.8, 6),
        getMat(PAL.wood)
      );
      tLeg.position.set(tx, 0.4, tz);
      g.add(tLeg);

      // stools around table
      for (let s = 0; s < 4; s++) {
        const angle = (s / 4) * Math.PI * 2;
        const stool = new THREE.Mesh(
          getGeo('cyl', 0.3, 0.3, 0.5, 6),
          getMat(PAL.wood)
        );
        stool.position.set(tx + Math.cos(angle) * 1.2, 0.25, tz + Math.sin(angle) * 1.2);
        g.add(stool);
      }
    }

    // NPC figures (abstract — no external models)
    for (let n = 0; n < 10; n++) {
      const nx = -6 + Math.random() * 12;
      const nz = -42 + Math.random() * 12;
      const npc = new THREE.Group();
      npc.position.set(nx, 0, nz);

      const body = new THREE.Mesh(
        getGeo('cyl', 0.35, 0.35, 1.4, 8),
        getMat(choice([PAL.clothRed, PAL.clothBlue, PAL.clothGreen, PAL.leather]), { roughness: 0.7 })
      );
      body.position.y = 0.7;
      npc.add(body);

      const head = new THREE.Mesh(
        getGeo('sphere', 0.25, 8, 8),
        getMat(PAL.sand, { roughness: 0.8 })
      );
      head.position.y = 1.6;
      npc.add(head);

      // random hat/helm
      if (Math.random() > 0.5) {
        const hat = new THREE.Mesh(
          getGeo('cone', 0.3, 0.4, 8),
          getMat(PAL.bronze, { metalness: 0.5 })
        );
        hat.position.y = 1.9;
        npc.add(hat);
      }

      g.add(npc);
      g.userData.npcs = g.userData.npcs || [];
      g.userData.npcs.push(npc);
    }

    // tavern sign
    const signPole = new THREE.Mesh(
      getGeo('cyl', 0.1, 0.1, 4, 6),
      getMat(PAL.wood)
    );
    signPole.position.set(0, 2, -26);
    g.add(signPole);
    const signBoard = new THREE.Mesh(
      getGeo('box', 3, 1.2, 0.1),
      getMat(PAL.wood)
    );
    signBoard.position.set(0, 3.5, -26);
    g.add(signBoard);

    return g;
  }

  // ── 7. WARSHIP DRYDOCK (Far South) ─────────────────────────────────────────────
  function buildWarshipDock() {
    const g = new THREE.Group();

    // water basin
    const basin = new THREE.Mesh(
      getGeo('box', 50, 1.5, 30),
      getMat(PAL.cobalt, { roughness: 0.3, metalness: 0.2, transparent: true, opacity: 0.7 })
    );
    basin.position.set(0, -0.25, 60);
    g.add(basin);

    // dock walls
    [-25, 25].forEach(wx => {
      const wall = new THREE.Mesh(
        getGeo('box', 2, 4, 30),
        getMat(PAL.stone, { roughness: 0.85 })
      );
      wall.position.set(wx, 2, 60);
      g.add(wall);
    });

    // cranes
    [-15, 15].forEach(cx => {
      const craneBase = new THREE.Mesh(
        getGeo('box', 2, 1, 2),
        getMat(PAL.steel, { metalness: 0.6 })
      );
      craneBase.position.set(cx, 0.5, 45);
      g.add(craneBase);
      const craneTower = new THREE.Mesh(
        getGeo('box', 0.6, 12, 0.6),
        getMat(PAL.steel, { metalness: 0.6 })
      );
      craneTower.position.set(cx, 6.5, 45);
      g.add(craneTower);
      const craneArm = new THREE.Mesh(
        getGeo('box', 10, 0.4, 0.4),
        getMat(PAL.steel, { metalness: 0.6 })
      );
      craneArm.position.set(cx + 5, 12.5, 45);
      g.add(craneArm);
      // hook cable
      const cable = new THREE.Mesh(
        getGeo('cyl', 0.03, 0.03, 6, 4),
        getMat(PAL.steel, { metalness: 0.8 })
      );
      cable.position.set(cx + 9, 9.5, 45);
      g.add(cable);
    });

    // warships in drydock
    for (let w = 0; w < 2; w++) {
      const wx = -12 + w * 24;
      const wz = 60;
      const ship = new THREE.Group();
      ship.position.set(wx, 0.8, wz);

      // hull
      const hull = new THREE.Mesh(
        getGeo('box', 14, 2.5, 5),
        getMat(PAL.steel, { metalness: 0.5, roughness: 0.5 })
      );
      hull.position.y = 1.25;
      ship.add(hull);

      // bow
      const bow = new THREE.Mesh(
        getGeo('cone', 2.5, 5, 4),
        getMat(PAL.steel, { metalness: 0.5 })
      );
      bow.position.set(7, 1.25, 0);
      bow.rotation.z = -Math.PI / 2;
      ship.add(bow);

      // deck superstructure
      const deck = new THREE.Mesh(
        getGeo('box', 8, 2, 4),
        getMat(PAL.darkStone, { roughness: 0.8 })
      );
      deck.position.set(-1, 3.5, 0);
      ship.add(deck);

      // turrets
      [-3, 3].forEach(tx => {
        const turret = new THREE.Mesh(
          getGeo('cyl', 0.8, 0.8, 0.6, 8),
          getMat(PAL.steel, { metalness: 0.7 })
        );
        turret.position.set(tx, 4.8, 0);
        ship.add(turret);
        const gun = new THREE.Mesh(
          getGeo('cyl', 0.15, 0.15, 4, 6),
          getMat(PAL.darkStone)
        );
        gun.position.set(tx, 4.8, 2.2);
        gun.rotation.x = Math.PI / 2;
        ship.add(gun);
      });

      // mast
      const mast = new THREE.Mesh(
        getGeo('cyl', 0.15, 0.15, 8, 6),
        getMat(PAL.wood)
      );
      mast.position.set(2, 7, 0);
      ship.add(mast);

      // radar dish
      const radar = new THREE.Mesh(
        getGeo('sphere', 0.6, 8, 8, 0, Math.PI),
        getMat(PAL.steel, { metalness: 0.6 })
      );
      radar.position.set(2, 11, 0);
      ship.add(radar);
      ship.userData.radar = radar;

      // engine glow
      const engine = new THREE.Mesh(
        getGeo('sphere', 0.5, 8, 8),
        getMat(PAL.glowCyan, { emissive: true })
      );
      engine.position.set(-7, 1.5, 0);
      ship.add(engine);
      ship.userData.engineGlow = engine;

      g.add(ship);
      g.userData.ships = g.userData.ships || [];
      g.userData.ships.push(ship);
    }

    // water particles
    const waterParticles = makeParticles(200, PAL.glowCyan, 50, 0.5);
    waterParticles.position.set(0, 0.5, 60);
    g.add(waterParticles);
    g.userData.waterParticles = waterParticles;

    return g;
  }

  // ── 8. FLOATING PRICE TAGS / HOLO-SIGNS ────────────────────────────────────────
  function buildHoloSigns() {
    const g = new THREE.Group();
    const signData = [
      { pos: [-40, 5, -40], color: PAL.clothRed,    label: 'ARMOR' },
      { pos: [40, 6, -40],  color: PAL.glowCyan,    label: 'WEAPONS' },
      { pos: [-40, 6, 35],  color: PAL.crimson,     label: 'SOLDIERS' },
      { pos: [40, 8, 40],  color: PAL.glowAmber,   label: 'TANKS' },
      { pos: [0, 8, -35],  color: PAL.emerald,     label: 'TAVERN' },
      { pos: [0, 10, 60],  color: PAL.cobalt,      label: 'WARSHIPS' },
    ];

    signData.forEach(sd => {
      const sign = new THREE.Mesh(
        getGeo('box', 3, 0.8, 0.1),
        getMat(sd.color, { emissive: true })
      );
      sign.position.set(sd.pos[0], sd.pos[1], sd.pos[2]);
      g.add(sign);

      // floating ring
      const ring = new THREE.Mesh(
        getGeo('torus', 1.5, 0.05, 16, 32),
        getMat(sd.color, { emissive: true })
      );
      ring.position.set(sd.pos[0], sd.pos[1] + 1.5, sd.pos[2]);
      g.add(ring);
      g.userData.rings = g.userData.rings || [];
      g.userData.rings.push(ring);
    });

    return g;
  }

  // ═════════════════════════════════════════════════════════════════════════════
  //  MAIN SPAWN FUNCTION
  // ═════════════════════════════════════════════════════════════════════════════
  window.spawnSovereignMarketplace = function(scene, opts) {
    opts = opts || {};
    const group = new THREE.Group();
    group.position.set(opts.offsetX || 0, opts.offsetY || 0, opts.offsetZ || 0);

    // build all districts
    group.add(buildPlaza());
    group.add(buildClothStalls());
    group.add(buildWeaponForge());
    group.add(buildBarracks());
    group.add(buildTankDepot());
    group.add(buildNPCHall());
    group.add(buildWarshipDock());
    group.add(buildHoloSigns());

    // ambient floating lanterns
    const lanterns = [];
    for (let i = 0; i < 24; i++) {
      const lantern = new THREE.Mesh(
        getGeo('octa', 0.3, 0),
        getMat(PAL.gold, { emissive: true })
      );
      lantern.position.set(
        rand(-50, 50),
        rand(3, 10),
        rand(-50, 50)
      );
      group.add(lantern);
      lanterns.push({
        mesh: lantern,
        baseY: lantern.position.y,
        phase: rand(0, Math.PI * 2),
        speed: rand(0.5, 1.5),
      });
    }

    // ── UPDATE LOOP ─────────────────────────────────────────────────────────────
    group.userData.update = function(time, delta) {
      // fountain orb pulse
      const fOrb = group.children[0].userData.fountainOrb;
      if (fOrb) {
        fOrb.scale.setScalar(1 + Math.sin(time * 3) * 0.15);
        fOrb.rotation.y += delta * 0.5;
      }
      // fountain particles drift
      const fParts = group.children[0].userData.fountainParticles;
      if (fParts) {
        fParts.rotation.y += delta * 0.2;
        const positions = fParts.geometry.attributes.position.array;
        for (let i = 0; i < positions.length; i += 3) {
          positions[i + 1] += Math.sin(time * 2 + i) * 0.003;
        }
        fParts.geometry.attributes.position.needsUpdate = true;
      }

      // tank muzzle glow pulse
      const tankDepot = group.children[4];
      if (tankDepot && tankDepot.userData.tanks) {
        tankDepot.userData.tanks.forEach((tank, idx) => {
          if (tank.userData.muzzle) {
            tank.userData.muzzle.scale.setScalar(
              1 + Math.sin(time * 4 + idx) * 0.3
            );
          }
        });
      }

      // NPC idle sway
      const npcHall = group.children[5];
      if (npcHall && npcHall.userData.npcs) {
        npcHall.userData.npcs.forEach((npc, idx) => {
          npc.rotation.y = Math.sin(time * 0.5 + idx) * 0.3;
          npc.position.y = Math.sin(time * 1.5 + idx) * 0.05;
        });
      }

      // warship radar spin
      const dock = group.children[6];
      if (dock && dock.userData.ships) {
        dock.userData.ships.forEach((ship, idx) => {
          if (ship.userData.radar) {
            ship.userData.radar.rotation.y += delta * (1 + idx * 0.5);
          }
          if (ship.userData.engineGlow) {
            ship.userData.engineGlow.scale.setScalar(
              1 + Math.sin(time * 5 + idx) * 0.2
            );
          }
        });
      }

      // water particles
      if (dock && dock.userData.waterParticles) {
        const wp = dock.userData.waterParticles;
        wp.rotation.y += delta * 0.1;
        const wpos = wp.geometry.attributes.position.array;
        for (let i = 0; i < wpos.length; i += 3) {
          wpos[i + 1] += Math.sin(time * 1.5 + i) * 0.002;
        }
        wp.geometry.attributes.position.needsUpdate = true;
      }

      // holo-sign rings spin
      const holoSigns = group.children[7];
      if (holoSigns && holoSigns.userData.rings) {
        holoSigns.userData.rings.forEach((ring, idx) => {
          ring.rotation.x += delta * (0.5 + idx * 0.2);
          ring.rotation.y += delta * (0.3 + idx * 0.15);
        });
      }

      // floating lanterns bob
      lanterns.forEach(l => {
        l.mesh.position.y = l.baseY + Math.sin(time * l.speed + l.phase) * 0.8;
        l.mesh.rotation.y += delta * 0.3;
        l.mesh.rotation.x += delta * 0.2;
      });
    };

    scene.add(group);
    return group;
  };

})();
