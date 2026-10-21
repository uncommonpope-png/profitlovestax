/**
 * alien-warzone-city.js
 * THE SHATTERED FRONT — An active alien warzone beyond the void.
 * 
 * This is the third sovereign city. It does not touch your existing code.
 * Drop it in, call spawnWarzoneCity(scene), and watch two alien armies tear
 * each other apart across cratered biomechanical terrain.
 * 
 * Features:
 *   - Cratered alien terrain with trenches and barricades
 *   - Biomechanical architecture: chitin spires, hive clusters, crystal growths
 *   - Two active factions: CRIMSON LEGION (red) vs AZURE SWARM (blue)
 *   - Animated combat: energy beams, explosions, smoke, wandering war machines
 *   - Military installations: bunkers, shield domes, gun emplacements
 *   - Destroyed / half-ruined buildings with fires and structural collapse
 *   - Dust storms, ash fall, spark showers, debris fields
 *   - Mech walkers and hover-tanks with patrol AI
 *   - Auto-positions far beyond the other two cities
 * 
 * Usage:
 *   const warzone = spawnWarzoneCity(scene, { offsetX: 900, offsetZ: 300 });
 *   // In animation loop: warzone.userData.update(time, delta);
 */

(function() {
  'use strict';

  // Fallback for missing engine-level physical material function
  if (typeof window.__genesisPhysMat !== 'function') {
    window.__genesisPhysMat = function(opts) {
      return new THREE.MeshPhysicalMaterial(opts);
    };
  }

  // ─── CONFIG ───────────────────────────────────────────────────────────
  const CFG = {
    offsetX: 900,
    offsetZ: 300,
    offsetY: 0,
    cityRadius: 220,
    buildingCount: 280,
    destroyedRatio: 0.35,
    mechCount: 16,
    explosionRate: 0.02,
    beamRate: 0.03,
    dustCount: 4000,
    sparkCount: 1500,
    smokeCount: 2000,
    craterCount: 18,
    trenchCount: 8,
  };

  // ─── MATERIALS (Alien War Palette) ────────────────────────────────────
  const MATS = {};
  function initMaterials() {
    if (MATS.chitin) return;
    
    MATS.chitin = (window.__genesisStd || function(c){ return new THREE.MeshStandardMaterial(c); })({
      color: 0x2a1a0a, roughness: 0.6, metalness: 0.3,
    });
    MATS.chitinWet = (window.__genesisStd || function(c){ return new THREE.MeshStandardMaterial(c); })({
      color: 0x1a1008, roughness: 0.2, metalness: 0.5,
    });
    MATS.crimsonEnergy = new THREE.MeshBasicMaterial({
      color: 0xff0022, transparent: true, opacity: 0.85,
    });
    MATS.azureEnergy = new THREE.MeshBasicMaterial({
      color: 0x0088ff, transparent: true, opacity: 0.85,
    });
    MATS.boneSpire = (window.__genesisStd || function(c){ return new THREE.MeshStandardMaterial(c); })({
      color: 0xc4b5a0, roughness: 0.8, metalness: 0.0,
    });
    MATS.crystalGrowth = window.__genesisPhysMat({
      color: 0x440066, roughness: 0.1, metalness: 0.2,
      transmission: 0.5, transparent: true, opacity: 0.7,
    });
    MATS.burnedMetal = (window.__genesisStd || function(c){ return new THREE.MeshStandardMaterial(c); })({
      color: 0x1a1a1a, roughness: 0.9, metalness: 0.7,
    });
    MATS.scorchedEarth = (window.__genesisStd || function(c){ return new THREE.MeshStandardMaterial(c); })({
      color: 0x332211, roughness: 1.0, metalness: 0.0,
    });
    MATS.shieldDome = window.__genesisPhysMat({
      color: 0x00aaff, roughness: 0.05, metalness: 0.1,
      transparent: true, opacity: 0.15, side: THREE.DoubleSide,
      depthWrite: false,
    });
    MATS.fireCore = new THREE.MeshBasicMaterial({
      color: 0xff6600,
    });
    MATS.smokePuff = new THREE.MeshBasicMaterial({
      color: 0x444444, transparent: true, opacity: 0.4,
      depthWrite: false,
    });
  }

  // ─── GEO CACHE ────────────────────────────────────────────────────────
  const GEO = {};
  function getGeo(type, ...args) {
    const key = type + args.map(a => typeof a === 'number' ? a.toFixed(2) : a).join(',');
    if (!GEO[key]) {
      switch (type) {
        case 'box': GEO[key] = new THREE.BoxGeometry(args[0], args[1], args[2]); break;
        case 'cyl': GEO[key] = new THREE.CylinderGeometry(args[0], args[1], args[2], args[3]||12); break;
        case 'cone': GEO[key] = new THREE.ConeGeometry(args[0], args[1], args[2]||8); break;
        case 'sphere': GEO[key] = new THREE.SphereGeometry(args[0], args[1]||12, args[2]||12); break;
        case 'torus': GEO[key] = new THREE.TorusGeometry(args[0], args[1], args[2]||8, args[3]||24); break;
        case 'plane': GEO[key] = new THREE.PlaneGeometry(args[0], args[1]); break;
        case 'dodeca': GEO[key] = new THREE.DodecahedronGeometry(args[0], args[1]||0); break;
      }
    }
    return GEO[key];
  }

  // ─── CRATERED TERRAIN ─────────────────────────────────────────────────
  function makeWarzoneTerrain(radius) {
    const geo = new THREE.PlaneGeometry(radius * 2.5, radius * 2.5, 64, 64);
    const pos = geo.attributes.position;
    const colors = [];
    const baseColor = new THREE.Color(0x2a1d12);
    const scorchColor = new THREE.Color(0x1a1108);
    const ashColor = new THREE.Color(0x3a3530);
    
    // Crater centers
    const craters = [];
    for (let i = 0; i < CFG.craterCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const r = Math.random() * radius * 0.8;
      craters.push({
        x: Math.cos(angle) * r,
        z: Math.sin(angle) * r,
        radius: 4 + Math.random() * 10,
        depth: 2 + Math.random() * 4
      });
    }
    
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getY(i);
      let y = 0;
      
      // General uneven terrain
      y += Math.sin(x * 0.05) * Math.cos(z * 0.05) * 1.5;
      y += Math.sin(x * 0.12 + z * 0.08) * 0.8;
      
      // Crater depressions
      let inCrater = false;
      for (const c of craters) {
        const dx = x - c.x;
        const dz = z - c.z;
        const dist = Math.sqrt(dx * dx + dz * dz);
        if (dist < c.radius) {
          const falloff = dist / c.radius;
          y -= c.depth * (1 - falloff * falloff);
          inCrater = true;
        }
      }
      
      pos.setZ(i, y);
      
      // Vertex colors
      const distFromCenter = Math.sqrt(x * x + z * z);
      let col = baseColor.clone();
      if (inCrater) col.lerp(scorchColor, 0.7);
      else if (distFromCenter > radius * 0.6) col.lerp(ashColor, 0.3);
      col.r += (Math.random() - 0.5) * 0.03;
      col.g += (Math.random() - 0.5) * 0.03;
      colors.push(col.r, col.g, col.b);
    }
    
    geo.computeVertexNormals();
    geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    
    const mat = (window.__genesisStd || function(c){ return new THREE.MeshStandardMaterial(c); })({
      vertexColors: true, roughness: 0.95, metalness: 0.05,
      side: THREE.DoubleSide
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.y = -0.5;
    mesh.userData = { craters };
    return mesh;
  }

  // ─── TRENCHES ─────────────────────────────────────────────────────────
  function makeTrench(x1, z1, x2, z2, width, depth) {
    const group = new THREE.Group();
    const dx = x2 - x1;
    const dz = z2 - z1;
    const dist = Math.sqrt(dx * dx + dz * dz);
    const segments = Math.floor(dist / 3);
    
    for (let i = 0; i < segments; i++) {
      const t = i / segments;
      const px = x1 + dx * t;
      const pz = z1 + dz * t;
      
      // Trench floor
      const floor = new THREE.Mesh(
        getGeo('box', width, 0.3, 3),
        MATS.scorchedEarth
      );
      floor.position.set(px, -depth, pz);
      group.add(floor);
      
      // Walls
      const wall1 = new THREE.Mesh(
        getGeo('box', 0.5, depth, 3),
        MATS.scorchedEarth
      );
      wall1.position.set(px + width / 2, -depth / 2, pz);
      group.add(wall1);
      
      const wall2 = new THREE.Mesh(
        getGeo('box', 0.5, depth, 3),
        MATS.scorchedEarth
      );
      wall2.position.set(px - width / 2, -depth / 2, pz);
      group.add(wall2);
      
      // Sandbags / barricades randomly
      if (Math.random() > 0.6) {
        const bag = new THREE.Mesh(
          getGeo('box', 0.8, 0.5, 0.4),
          MATS.scorchedEarth
        );
        bag.position.set(px + (Math.random() - 0.5) * width * 0.6, -depth + 0.25, pz);
        group.add(bag);
      }
    }
    
    return group;
  }

  // ─── ALIEN BUILDINGS ──────────────────────────────────────────────────
  function makeAlienBuilding(x, z, opts = {}) {
    initMaterials();
    const bldg = new THREE.Group();
    bldg.position.set(x, 0, z);
    
    const variant = opts.variant || Math.floor(Math.random() * 7);
    const isDestroyed = opts.destroyed || Math.random() < CFG.destroyedRatio;
    const faction = opts.faction || (Math.random() > 0.5 ? 'crimson' : 'azure');
    const height = opts.height || (6 + Math.random() * 25);
    const width = opts.width || (3 + Math.random() * 4);
    const depth = opts.depth || (3 + Math.random() * 4);
    
    bldg.userData = { type: 'alien-building', variant, isDestroyed, faction, height, width, depth };
    
    let mainMesh;
    const factionMat = faction === 'crimson' ? MATS.crimsonEnergy : MATS.azureEnergy;
    
    switch (variant) {
      case 0: // Chitin hive tower
        mainMesh = new THREE.Mesh(getGeo('cyl', width * 0.7, width * 0.9, height, 8), MATS.chitin);
        // Ribbed segments
        for (let s = 0; s < 4; s++) {
          const rib = new THREE.Mesh(
            getGeo('torus', width * (0.6 + s * 0.08), 0.2, 6, 12),
            MATS.chitinWet
          );
          rib.rotation.x = Math.PI / 2;
          rib.position.y = -height / 2 + (s + 1) * height / 5;
          bldg.add(rib);
        }
        break;
        
      case 1: // Bone spire cluster
        const spires = 3 + Math.floor(Math.random() * 3);
        for (let s = 0; s < spires; s++) {
          const sh = height * (0.5 + Math.random() * 0.6);
          const sw = width * (0.3 + Math.random() * 0.3);
          const spire = new THREE.Mesh(getGeo('cone', sw, sh, 5), MATS.boneSpire);
          spire.position.set((Math.random() - 0.5) * width, sh / 2, (Math.random() - 0.5) * depth);
          spire.rotation.z = (Math.random() - 0.5) * 0.2;
          bldg.add(spire);
        }
        mainMesh = null;
        break;
        
      case 2: // Crystal growth
        mainMesh = new THREE.Mesh(getGeo('dodeca', width * 0.6, 0), MATS.crystalGrowth);
        mainMesh.scale.y = height / width;
        mainMesh.position.y = height / 2;
        // Smaller crystals around base
        for (let c = 0; c < 5; c++) {
          const small = new THREE.Mesh(
            getGeo('dodeca', width * 0.2, 0),
            MATS.crystalGrowth
          );
          const angle = (c / 5) * Math.PI * 2;
          small.position.set(Math.cos(angle) * width * 0.7, height * 0.15, Math.sin(angle) * width * 0.7);
          bldg.add(small);
        }
        break;
        
      case 3: // Military bunker
        mainMesh = new THREE.Mesh(getGeo('box', width, height * 0.6, depth), MATS.burnedMetal);
        mainMesh.position.y = height * 0.3;
        // Gun slit
        const slit = new THREE.Mesh(
          getGeo('box', width * 0.6, 0.3, 0.2),
          factionMat
        );
        slit.position.set(0, height * 0.4, depth / 2 + 0.1);
        bldg.add(slit);
        // Antenna array
        for (let a = 0; a < 3; a++) {
          const ant = new THREE.Mesh(
            getGeo('cyl', 0.06, 0.05, 3 + Math.random() * 2, 4),
            MATS.burnedMetal
          );
          ant.position.set((a - 1) * 0.8, height * 0.6 + 1.5, 0);
          bldg.add(ant);
        }
        break;
        
      case 4: // Shield dome base
        const domeBase = new THREE.Mesh(getGeo('cyl', width, width * 0.9, height * 0.4, 12), MATS.burnedMetal);
        domeBase.position.y = height * 0.2;
        bldg.add(domeBase);
        const dome = new THREE.Mesh(
          getGeo('sphere', width * 0.9, 16, 16),
          MATS.shieldDome
        );
        dome.position.y = height * 0.4;
        bldg.add(dome);
        // Shield generator pillars
        for (let p = 0; p < 4; p++) {
          const angle = (p / 4) * Math.PI * 2;
          const pillar = new THREE.Mesh(
            getGeo('cyl', 0.3, 0.3, height * 0.5, 6),
            factionMat
          );
          pillar.position.set(Math.cos(angle) * width * 0.7, height * 0.25, Math.sin(angle) * width * 0.7);
          bldg.add(pillar);
        }
        mainMesh = null;
        break;
        
      case 5: // Organic pod cluster
        const pods = 4 + Math.floor(Math.random() * 4);
        for (let p = 0; p < pods; p++) {
          const podH = height * (0.3 + Math.random() * 0.4);
          const pod = new THREE.Mesh(
            getGeo('sphere', width * (0.25 + Math.random() * 0.15), 8, 8),
            MATS.chitinWet
          );
          pod.scale.y = 1.5;
          pod.position.set(
            (Math.random() - 0.5) * width * 1.2,
            podH / 2,
            (Math.random() - 0.5) * depth * 1.2
          );
          bldg.add(pod);
          // Stem
          const stem = new THREE.Mesh(
            getGeo('cyl', 0.2, 0.15, podH * 0.5, 4),
            MATS.chitin
          );
          stem.position.copy(pod.position);
          stem.position.y = podH * 0.25;
          bldg.add(stem);
        }
        mainMesh = null;
        break;
        
      case 6: // Command spire
        mainMesh = new THREE.Mesh(getGeo('box', width * 0.6, height, depth * 0.6), MATS.chitin);
        // Crown platform
        const crown = new THREE.Mesh(
          getGeo('cyl', width * 0.8, width * 0.9, height * 0.15, 8),
          factionMat
        );
        crown.position.y = height / 2 + height * 0.075;
        bldg.add(crown);
        // Beacon
        const beacon = new THREE.Mesh(
          getGeo('sphere', 0.4, 8, 8),
          new THREE.MeshBasicMaterial({ color: faction === 'crimson' ? 0xff0000 : 0x00aaff })
        );
        beacon.position.y = height / 2 + height * 0.2;
        bldg.add(beacon);
        const beaconLight = new THREE.PointLight(
          faction === 'crimson' ? 0xff0022 : 0x0088ff,
          1.5, 30
        );
        beaconLight.position.copy(beacon.position);
        bldg.add(beaconLight);
        break;
        
      default:
        mainMesh = new THREE.Mesh(getGeo('box', width, height, depth), MATS.chitin);
    }
    
    if (mainMesh) bldg.add(mainMesh);
    
    // DESTRUCTION OVERLAY
    if (isDestroyed) {
      // Structural collapse — lean the whole building
      bldg.rotation.z = (Math.random() - 0.5) * 0.25;
      bldg.rotation.x = (Math.random() - 0.5) * 0.15;
      
      // Rubble at base
      const rubbleCount = 5 + Math.floor(Math.random() * 8);
      for (let r = 0; r < rubbleCount; r++) {
        const rubble = new THREE.Mesh(
          getGeo('box', 0.5 + Math.random(), 0.3 + Math.random() * 0.5, 0.5 + Math.random()),
          MATS.burnedMetal
        );
        const ra = Math.random() * Math.PI * 2;
        const rr = width * 0.5 + Math.random() * 2;
        rubble.position.set(Math.cos(ra) * rr, 0.2, Math.sin(ra) * rr);
        rubble.rotation.set(Math.random(), Math.random(), Math.random());
        bldg.add(rubble);
      }
      
      // Fire in the ruins
      if (Math.random() > 0.3) {
        const fire = new THREE.Mesh(
          getGeo('sphere', 0.6 + Math.random() * 0.8, 6, 6),
          MATS.fireCore
        );
        fire.position.set((Math.random() - 0.5) * width * 0.5, 1 + Math.random() * 2, (Math.random() - 0.5) * depth * 0.5);
        fire.userData = { isFire: true, baseScale: 1, pulseSpeed: 5 + Math.random() * 5 };
        bldg.add(fire);
        
        const fireLight = new THREE.PointLight(0xff4400, 1.2, 12);
        fireLight.position.copy(fire.position);
        fireLight.userData = { isFireLight: true };
        bldg.add(fireLight);
      }
      
      // Smoke plume
      const smokeRoot = new THREE.Group();
      smokeRoot.position.set(0, height * 0.3, 0);
      bldg.add(smokeRoot);
      for (let s = 0; s < 8; s++) {
        const puff = new THREE.Mesh(
          getGeo('sphere', 0.8 + s * 0.3, 6, 6),
          MATS.smokePuff.clone()
        );
        puff.material = puff.material.clone();
        puff.material.opacity = 0.3 - s * 0.03;
        puff.position.set((Math.random() - 0.5) * 2, s * 1.5, (Math.random() - 0.5) * 2);
        puff.userData = { isSmoke: true, smokeIndex: s, root: smokeRoot };
        smokeRoot.add(puff);
      }
    }
    
    return bldg;
  }

  // ─── MECH WALKER ──────────────────────────────────────────────────────
  function makeMechWalker(x, z, faction) {
    const mech = new THREE.Group();
    mech.position.set(x, 2.5, z);
    
    const bodyColor = faction === 'crimson' ? 0x440011 : 0x001144;
    const bodyMat = (window.__genesisStd || function(c){ return new THREE.MeshStandardMaterial(c); })({ color: bodyColor, roughness: 0.4, metalness: 0.7 });
    const jointMat = (window.__genesisStd || function(c){ return new THREE.MeshStandardMaterial(c); })({ color: 0x222222, roughness: 0.3, metalness: 0.9 });
    const glowMat = faction === 'crimson' ? MATS.crimsonEnergy : MATS.azureEnergy;
    
    // Torso
    const torso = new THREE.Mesh(getGeo('box', 2, 2.5, 1.5), bodyMat);
    torso.position.y = 1;
    mech.add(torso);
    
    // Head
    const head = new THREE.Mesh(getGeo('box', 1, 0.8, 1), bodyMat);
    head.position.y = 2.6;
    mech.add(head);
    
    // Eye glow
    const eye = new THREE.Mesh(getGeo('sphere', 0.15, 6, 6), glowMat);
    eye.position.set(0, 2.6, 0.55);
    mech.add(eye);
    
    // Legs
    const legGeo = getGeo('box', 0.5, 2.5, 0.5);
    const leftLeg = new THREE.Mesh(legGeo, bodyMat);
    leftLeg.position.set(-0.8, -1, 0);
    mech.add(leftLeg);
    const rightLeg = new THREE.Mesh(legGeo, bodyMat);
    rightLeg.position.set(0.8, -1, 0);
    mech.add(rightLeg);
    
    // Feet
    const footGeo = getGeo('box', 0.8, 0.4, 1.2);
    const leftFoot = new THREE.Mesh(footGeo, jointMat);
    leftFoot.position.set(-0.8, -2.3, 0.2);
    mech.add(leftFoot);
    const rightFoot = new THREE.Mesh(footGeo, jointMat);
    rightFoot.position.set(0.8, -2.3, 0.2);
    mech.add(rightFoot);
    
    // Weapon arm
    const arm = new THREE.Mesh(getGeo('box', 0.4, 1.8, 0.4), bodyMat);
    arm.position.set(1.3, 1.2, 0);
    mech.add(arm);
    const cannon = new THREE.Mesh(getGeo('cyl', 0.2, 0.15, 2, 6), jointMat);
    cannon.rotation.x = Math.PI / 2;
    cannon.position.set(1.3, 1.2, 1.2);
    mech.add(cannon);
    const cannonGlow = new THREE.Mesh(getGeo('sphere', 0.15, 6, 6), glowMat);
    cannonGlow.position.set(1.3, 1.2, 2.2);
    mech.add(cannonGlow);
    
    mech.userData = {
      isMech: true,
      faction,
      speed: 0.8 + Math.random() * 1.2,
      patrolRadius: 15 + Math.random() * 40,
      patrolAngle: Math.random() * Math.PI * 2,
      patrolCenter: { x, z },
      legPhase: Math.random() * Math.PI * 2,
      lastShot: 0,
      shootCooldown: 2 + Math.random() * 3,
    };
    return mech;
  }

  // ─── HOVER TANK ───────────────────────────────────────────────────────
  function makeHoverTank(x, z, faction) {
    const tank = new THREE.Group();
    tank.position.set(x, 1, z);
    
    const bodyColor = faction === 'crimson' ? 0x33000a : 0x000a33;
    const bodyMat = (window.__genesisStd || function(c){ return new THREE.MeshStandardMaterial(c); })({ color: bodyColor, roughness: 0.5, metalness: 0.8 });
    const glowMat = faction === 'crimson' ? MATS.crimsonEnergy : MATS.azureEnergy;
    
    // Hull
    const hull = new THREE.Mesh(getGeo('box', 3, 1.2, 4), bodyMat);
    tank.add(hull);
    
    // Turret
    const turret = new THREE.Mesh(getGeo('box', 1.5, 0.8, 1.5), bodyMat);
    turret.position.y = 1;
    tank.add(turret);
    
    // Barrel
    const barrel = new THREE.Mesh(getGeo('cyl', 0.18, 0.15, 3.5, 6), bodyMat);
    barrel.rotation.x = Math.PI / 2;
    barrel.position.set(0, 1, 2);
    tank.add(barrel);
    
    // Glow ring
    const ring = new THREE.Mesh(getGeo('torus', 1.8, 0.1, 8, 16), glowMat);
    ring.rotation.x = Math.PI / 2;
    ring.position.y = -0.7;
    tank.add(ring);
    
    // Hover glow underneath
    const hoverGlow = new THREE.PointLight(
      faction === 'crimson' ? 0xff0022 : 0x0088ff,
      0.6, 8
    );
    hoverGlow.position.y = -1;
    tank.add(hoverGlow);
    
    tank.userData = {
      isTank: true,
      faction,
      speed: 1.2 + Math.random() * 1.5,
      patrolRadius: 20 + Math.random() * 50,
      patrolAngle: Math.random() * Math.PI * 2,
      patrolCenter: { x, z },
      lastShot: 0,
      shootCooldown: 3 + Math.random() * 4,
      hoverOffset: Math.random() * Math.PI * 2,
    };
    return tank;
  }

  // ─── ENERGY BEAM ──────────────────────────────────────────────────────
  function makeEnergyBeam(start, end, faction) {
    const dir = new THREE.Vector3().subVectors(end, start);
    const len = dir.length();
    const mid = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);
    
    const beam = new THREE.Mesh(
      getGeo('cyl', 0.08, 0.08, len, 4),
      faction === 'crimson' ? MATS.crimsonEnergy : MATS.azureEnergy
    );
    beam.position.copy(mid);
    beam.lookAt(end);
    beam.rotateX(Math.PI / 2);
    
    beam.userData = {
      isBeam: true,
      life: 1.0,
      decay: 0.05 + Math.random() * 0.05,
    };
    return beam;
  }

  // ─── EXPLOSION FLASH ──────────────────────────────────────────────────
  function makeExplosion(pos, faction) {
    const group = new THREE.Group();
    group.position.copy(pos);
    
    const color = faction === 'crimson' ? 0xff2200 : 0x0088ff;
    
    // Core flash
    const core = new THREE.Mesh(
      getGeo('sphere', 0.5, 8, 8),
      new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 1 })
    );
    group.add(core);
    
    // Shock ring
    const ring = new THREE.Mesh(
      getGeo('torus', 0.3, 0.1, 8, 16),
      new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.8 })
    );
    ring.rotation.x = Math.PI / 2;
    group.add(ring);
    
    // Light
    const light = new THREE.PointLight(color, 4, 25);
    group.add(light);
    
    group.userData = {
      isExplosion: true,
      life: 1.0,
      maxLife: 1.0,
    };
    return group;
  }

  // ─── PARTICLE SYSTEMS ─────────────────────────────────────────────────
  function makeWarzoneParticles(count, type, bounds) {
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(count * 3);
    const vel = new Float32Array(count * 3);
    const life = new Float32Array(count);
    
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * bounds * 2;
      pos[i * 3 + 1] = Math.random() * 30;
      pos[i * 3 + 2] = (Math.random() - 0.5) * bounds * 2;
      
      if (type === 'dust') {
        vel[i * 3] = (Math.random() - 0.5) * 0.03;
        vel[i * 3 + 1] = 0.01 + Math.random() * 0.02;
        vel[i * 3 + 2] = (Math.random() - 0.5) * 0.03;
      } else if (type === 'spark') {
        vel[i * 3] = (Math.random() - 0.5) * 0.15;
        vel[i * 3 + 1] = 0.05 + Math.random() * 0.1;
        vel[i * 3 + 2] = (Math.random() - 0.5) * 0.15;
      } else if (type === 'ash') {
        vel[i * 3] = 0.02 + Math.random() * 0.03;
        vel[i * 3 + 1] = -0.01 - Math.random() * 0.02;
        vel[i * 3 + 2] = (Math.random() - 0.5) * 0.02;
      }
      life[i] = Math.random();
    }
    
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    
    let color, size;
    switch (type) {
      case 'dust': color = 0x665544; size = 0.5; break;
      case 'spark': color = 0xffaa00; size = 0.12; break;
      case 'ash': color = 0x333333; size = 0.25; break;
      default: color = 0xffffff; size = 0.2;
    }
    
    const mat = new THREE.PointsMaterial({
      color, size, transparent: true, opacity: type === 'dust' ? 0.35 : 0.7,
      blending: THREE.AdditiveBlending, depthWrite: false
    });
    
    const particles = new THREE.Points(geo, mat);
    particles.userData = { type, vel, life, bounds, count };
    return particles;
  }

  // ─── MAIN SPAWN FUNCTION ──────────────────────────────────────────────
  function spawnWarzoneCity(scene, opts = {}) {
    const offsetX = opts.offsetX !== undefined ? opts.offsetX : CFG.offsetX;
    const offsetZ = opts.offsetZ !== undefined ? opts.offsetZ : CFG.offsetZ;
    const offsetY = opts.offsetY !== undefined ? opts.offsetY : CFG.offsetY;
    const cityRadius = opts.cityRadius || CFG.cityRadius;
    const buildingCount = opts.buildingCount || CFG.buildingCount;
    
    initMaterials();
    
    const cityGroup = new THREE.Group();
    cityGroup.position.set(offsetX, offsetY, offsetZ);
    cityGroup.name = 'WarzoneCity_ShatteredFront';
    
    // 1. Cratered terrain
    const terrain = makeWarzoneTerrain(cityRadius);
    cityGroup.add(terrain);
    
    // 2. Trenches (front lines)
    for (let i = 0; i < CFG.trenchCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const r = 30 + Math.random() * (cityRadius * 0.5);
      const len = 20 + Math.random() * 30;
      const tx = Math.cos(angle) * r;
      const tz = Math.sin(angle) * r;
      const tx2 = tx + Math.cos(angle + Math.PI / 2) * len;
      const tz2 = tz + Math.sin(angle + Math.PI / 2) * len;
      cityGroup.add(makeTrench(tx, tz, tx2, tz2, 2.5, 1.5));
    }
    
    // 3. Buildings
    const buildings = [];
    for (let i = 0; i < buildingCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const r = Math.sqrt(Math.random()) * cityRadius * 0.85;
      const bx = Math.cos(angle) * r;
      const bz = Math.sin(angle) * r;
      
      // Faction clustering — crimson in east, azure in west
      const faction = bx > 0 ? 'crimson' : 'azure';
      const isDestroyed = Math.random() < CFG.destroyedRatio;
      
      const bldg = makeAlienBuilding(bx, bz, {
        faction,
        destroyed: isDestroyed,
        variant: Math.floor(Math.random() * 7),
        height: 4 + Math.random() * 20 + (isDestroyed ? 0 : Math.random() * 10),
      });
      buildings.push(bldg);
      cityGroup.add(bldg);
    }
    
    // 4. Mechs
    const mechs = [];
    for (let i = 0; i < CFG.mechCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const r = Math.random() * cityRadius * 0.7;
      const faction = i % 2 === 0 ? 'crimson' : 'azure';
      const mx = Math.cos(angle) * r;
      const mz = Math.sin(angle) * r;
      const mech = makeMechWalker(mx, mz, faction);
      mechs.push(mech);
      cityGroup.add(mech);
    }
    
    // 5. Tanks
    const tanks = [];
    for (let i = 0; i < CFG.mechCount / 2; i++) {
      const angle = Math.random() * Math.PI * 2;
      const r = Math.random() * cityRadius * 0.6;
      const faction = i % 2 === 0 ? 'crimson' : 'azure';
      const tx = Math.cos(angle) * r;
      const tz = Math.sin(angle) * r;
      const tank = makeHoverTank(tx, tz, faction);
      tanks.push(tank);
      cityGroup.add(tank);
    }
    
    // 6. Particle systems
    const dust = makeWarzoneParticles(CFG.dustCount, 'dust', cityRadius);
    const sparks = makeWarzoneParticles(CFG.sparkCount, 'spark', cityRadius * 0.6);
    const ash = makeWarzoneParticles(CFG.smokeCount, 'ash', cityRadius);
    cityGroup.add(dust);
    cityGroup.add(sparks);
    cityGroup.add(ash);
    
    // 7. Lighting
    const ambient = new THREE.AmbientLight(0x1a0a08, 0.15);
    cityGroup.add(ambient);
    
    // Harsh directional (smoke-tinged sun)
    const sun = new THREE.DirectionalLight(0xff6644, 0.5);
    sun.position.set(60, 80, 40);
    cityGroup.add(sun);
    
    // Battle strobes scattered
    for (let i = 0; i < 12; i++) {
      const angle = Math.random() * Math.PI * 2;
      const r = Math.random() * cityRadius * 0.7;
      const isCrimson = Math.random() > 0.5;
      const pl = new THREE.PointLight(
        isCrimson ? 0xff0022 : 0x0088ff,
        1.5, 35
      );
      pl.position.set(Math.cos(angle) * r, 6 + Math.random() * 8, Math.sin(angle) * r);
      pl.userData = { isStrobe: true, strobeSpeed: 3 + Math.random() * 5, strobeOffset: Math.random() * 10 };
      cityGroup.add(pl);
    }
    
    // 8. Active effects containers
    const beams = [];
    const explosions = [];
    
    scene.add(cityGroup);
    
    // ─── ANIMATION LOOP DATA ────────────────────────────────────────────
    cityGroup.userData = {
      isWarzoneCity: true,
      mechs,
      tanks,
      beams,
      explosions,
      particles: [dust, sparks, ash],
      update: function(time, delta) {
        delta = delta || 0.016;
        
        // Animate mechs
        mechs.forEach(mech => {
          const d = mech.userData;
          d.patrolAngle += d.speed * 0.008;
          const tx = d.patrolCenter.x + Math.cos(d.patrolAngle) * d.patrolRadius;
          const tz = d.patrolCenter.z + Math.sin(d.patrolAngle) * d.patrolRadius;
          
          mech.position.x += (tx - mech.position.x) * 0.015;
          mech.position.z += (tz - mech.position.z) * 0.015;
          mech.rotation.y = -d.patrolAngle + Math.PI / 2;
          
          // Leg bob
          d.legPhase += d.speed * 0.15;
          mech.children[3].position.y = -1 + Math.sin(d.legPhase) * 0.15;
          mech.children[4].position.y = -1 + Math.sin(d.legPhase + Math.PI) * 0.15;
          mech.children[5].position.y = -2.3 + Math.sin(d.legPhase) * 0.15;
          mech.children[6].position.y = -2.3 + Math.sin(d.legPhase + Math.PI) * 0.15;
          
          // Shooting
          d.lastShot += delta;
          if (d.lastShot > d.shootCooldown && Math.random() < CFG.beamRate) {
            d.lastShot = 0;
            const target = mechs[Math.floor(Math.random() * mechs.length)];
            if (target && target !== mech && target.userData.faction !== d.faction) {
              const start = new THREE.Vector3();
              mech.children[8].getWorldPosition(start);
              const end = target.position.clone();
              end.y += 2;
              const beam = makeEnergyBeam(start, end, d.faction);
              cityGroup.add(beam);
              beams.push(beam);
              
              // Explosion at target
              if (Math.random() > 0.5) {
                const exp = makeExplosion(end, d.faction);
                cityGroup.add(exp);
                explosions.push(exp);
              }
            }
          }
        });
        
        // Animate tanks
        tanks.forEach(tank => {
          const d = tank.userData;
          d.patrolAngle += d.speed * 0.006;
          const tx = d.patrolCenter.x + Math.cos(d.patrolAngle) * d.patrolRadius;
          const tz = d.patrolCenter.z + Math.sin(d.patrolAngle) * d.patrolRadius;
          tank.position.x += (tx - tank.position.x) * 0.012;
          tank.position.z += (tz - tank.position.z) * 0.012;
          tank.rotation.y = -d.patrolAngle + Math.PI / 2;
          tank.position.y = 1 + Math.sin(time * 2 + d.hoverOffset) * 0.2;
          
          d.lastShot += delta;
          if (d.lastShot > d.shootCooldown && Math.random() < CFG.beamRate * 0.7) {
            d.lastShot = 0;
            const target = tanks[Math.floor(Math.random() * tanks.length)];
            if (target && target !== tank && target.userData.faction !== d.faction) {
              const start = new THREE.Vector3();
              tank.children[2].getWorldPosition(start);
              const end = target.position.clone();
              end.y += 1;
              const beam = makeEnergyBeam(start, end, d.faction);
              cityGroup.add(beam);
              beams.push(beam);
            }
          }
        });
        
        // Update beams
        for (let i = beams.length - 1; i >= 0; i--) {
          const b = beams[i];
          b.userData.life -= b.userData.decay;
          b.scale.x = b.userData.life;
          b.scale.z = b.userData.life;
          if (b.userData.life <= 0) {
            cityGroup.remove(b);
            beams.splice(i, 1);
          }
        }
        
        // Update explosions
        for (let i = explosions.length - 1; i >= 0; i--) {
          const e = explosions[i];
          e.userData.life -= delta * 2;
          const t = 1 - e.userData.life / e.userData.maxLife;
          e.children[0].scale.setScalar(1 + t * 3);
          e.children[0].material.opacity = e.userData.life;
          e.children[1].scale.setScalar(1 + t * 8);
          e.children[1].material.opacity = e.userData.life * 0.8;
          e.children[2].intensity = e.userData.life * 4;
          if (e.userData.life <= 0) {
            cityGroup.remove(e);
            explosions.splice(i, 1);
          }
        }
        
        // Random ambient explosions
        if (Math.random() < CFG.explosionRate) {
          const angle = Math.random() * Math.PI * 2;
          const r = Math.random() * cityRadius * 0.8;
          const exp = makeExplosion(
            new THREE.Vector3(Math.cos(angle) * r, 2 + Math.random() * 5, Math.sin(angle) * r),
            Math.random() > 0.5 ? 'crimson' : 'azure'
          );
          cityGroup.add(exp);
          explosions.push(exp);
        }
        
        // Animate fires in destroyed buildings
        cityGroup.traverse(child => {
          if (child.userData && child.userData.isFire) {
            const s = 1 + Math.sin(time * child.userData.pulseSpeed) * 0.3 + Math.random() * 0.1;
            child.scale.set(s, s, s);
          }
          if (child.userData && child.userData.isFireLight) {
            child.intensity = 1 + Math.sin(time * 5) * 0.4 + Math.random() * 0.2;
          }
          if (child.userData && child.userData.isSmoke) {
            const si = child.userData.smokeIndex;
            child.position.y = si * 1.5 + Math.sin(time * 0.5 + si) * 0.3;
            child.position.x += Math.sin(time * 0.3 + si) * 0.01;
            child.scale.setScalar(1 + si * 0.2 + Math.sin(time + si) * 0.1);
          }
          if (child.userData && child.userData.isStrobe) {
            child.intensity = 1.5 + Math.sin(time * child.userData.strobeSpeed + child.userData.strobeOffset) > 0 ? 1.5 : 0;
          }
        });
        
        // Update particles
        [dust, sparks, ash].forEach(sys => {
          const positions = sys.geometry.attributes.position.array;
          const vel = sys.userData.vel;
          const life = sys.userData.life;
          const count = sys.userData.count;
          for (let i = 0; i < count; i++) {
            positions[i * 3] += vel[i * 3];
            positions[i * 3 + 1] += vel[i * 3 + 1];
            positions[i * 3 + 2] += vel[i * 3 + 2];
            life[i] -= 0.003;
            
            if (life[i] <= 0 || positions[i * 3 + 1] > 40 || positions[i * 3 + 1] < -2) {
              positions[i * 3] = (Math.random() - 0.5) * sys.userData.bounds * 2;
              positions[i * 3 + 1] = sys.userData.type === 'ash' ? 30 : Math.random() * 20;
              positions[i * 3 + 2] = (Math.random() - 0.5) * sys.userData.bounds * 2;
              life[i] = 1;
            }
          }
          sys.geometry.attributes.position.needsUpdate = true;
        });
      }
    };
    
    console.log(`[ShatteredFront] Warzone city spawned at (${offsetX}, ${offsetY}, ${offsetZ})`);
    console.log(`  Buildings: ${buildings.length} | Mechs: ${mechs.length} | Tanks: ${tanks.length}`);
    console.log(`  Destroyed ratio: ${Math.floor(CFG.destroyedRatio * 100)}% | Active war in progress.`);
    
    return cityGroup;
  }

  // ─── EXPORTS ──────────────────────────────────────────────────────────
  window.spawnWarzoneCity = spawnWarzoneCity;
  window.WarzoneCity = { CFG, makeAlienBuilding, makeMechWalker, makeHoverTank };
  
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { spawnWarzoneCity, WarzoneCity: window.WarzoneCity };
  }
})();
