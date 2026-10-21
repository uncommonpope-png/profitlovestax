(function() {
  'use strict';

  window.spawnVortexSiege = function(scene, opts) {
    opts = opts || {};
    const offsetX = opts.offsetX !== undefined ? opts.offsetX : -1600;
    const offsetZ = opts.offsetZ !== undefined ? opts.offsetZ : -800;

    const cityGroup = new THREE.Group();
    cityGroup.position.set(offsetX, 0, offsetZ);

    const timeOffset = Math.random() * 1000;
    const buildings = [];
    const beams = [];
    const shields = [];
    
    // Palettes
    const colors = {
      terran: 0xcc4444,
      void: 0x4444cc,
      alien: 0x44cc44,
      vortex: 0xffffff,
      ground: 0x333333,
      beamRed: 0xff6666,
      beamBlue: 0x6666ff,
      beamGreen: 0x66ff66
    };

    // Base ground
    const groundGeo = new THREE.CylinderGeometry(150, 150, 2, 64);
    const groundMat = new THREE.MeshStandardMaterial({
      color: colors.ground,
      roughness: 0.9,
      metalness: 0.1
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.position.y = -1;
    cityGroup.add(ground);

    // Central Vortex
    const vortexGroup = new THREE.Group();
    const vortexGeo = new THREE.TorusGeometry(20, 2, 16, 64);
    const vortexMat = new THREE.MeshBasicMaterial({ color: colors.vortex, transparent: true, opacity: 0.8 });
    const vortex = new THREE.Mesh(vortexGeo, vortexMat);
    vortex.rotation.x = Math.PI / 2;
    vortex.position.y = 15;
    vortexGroup.add(vortex);
    
    // Inner vortex core
    const coreGeo = new THREE.SphereGeometry(8, 16, 16);
    const coreMat = new THREE.MeshBasicMaterial({ color: 0xeeeeee, wireframe: true });
    const core = new THREE.Mesh(coreGeo, coreMat);
    core.position.y = 15;
    vortexGroup.add(core);
    
    cityGroup.add(vortexGroup);

    // Faction Setup
    const factions = [
      { name: 'terran', color: colors.terran, beam: colors.beamRed, count: 70, angleOffset: 0 },
      { name: 'void', color: colors.void, beam: colors.beamBlue, count: 70, angleOffset: (Math.PI * 2) / 3 },
      { name: 'alien', color: colors.alien, beam: colors.beamGreen, count: 70, angleOffset: (Math.PI * 4) / 3 }
    ];

    // Create geometries
    const terranBaseGeo = new THREE.BoxGeometry(1, 1, 1);
    const terranAntennaGeo = new THREE.CylinderGeometry(0.1, 0.1, 1, 8);
    
    const voidGeo = new THREE.ConeGeometry(1, 1, 4); // Octahedron-like top
    const alienStemGeo = new THREE.CylinderGeometry(0.5, 0.5, 1, 8);
    const alienPodGeo = new THREE.SphereGeometry(1, 16, 16);

    const shieldGeo = new THREE.SphereGeometry(1, 32, 32);

    const factionGroups = { terran: [], void: [], alien: [] };

    factions.forEach((faction, fIdx) => {
      const mat = new THREE.MeshStandardMaterial({ color: faction.color, roughness: 0.6, metalness: 0.4 });
      const glowMat = new THREE.MeshBasicMaterial({ color: faction.color });
      
      let cmdPos = new THREE.Vector3();

      for (let i = 0; i < faction.count; i++) {
        // Spiral placement
        const t = (i + 1) / faction.count; // 0 to 1
        const r = 25 + t * 110;
        const theta = faction.angleOffset + t * Math.PI * 2; 
        
        const x = Math.cos(theta) * r;
        const z = Math.sin(theta) * r;
        
        const isCommand = i === faction.count - 1;
        const scale = isCommand ? 3 : 1 + Math.random();
        const bGroup = new THREE.Group();
        bGroup.position.set(x, 0, z);
        
        let bHeight = (5 + Math.random() * 10) * scale;
        if (isCommand) bHeight = 30;

        if (faction.name === 'terran') {
          const w = 4 * scale;
          const d = 4 * scale;
          const body = new THREE.Mesh(terranBaseGeo, mat);
          body.scale.set(w, bHeight, d);
          body.position.y = bHeight / 2;
          bGroup.add(body);
          
          // Antenna
          const antenna = new THREE.Mesh(terranAntennaGeo, mat);
          antenna.scale.set(1, bHeight * 0.5, 1);
          antenna.position.set(w * 0.3, bHeight + bHeight * 0.25, d * 0.3);
          bGroup.add(antenna);
        } 
        else if (faction.name === 'void') {
          const w = 3 * scale;
          
          const bottom = new THREE.Mesh(voidGeo, mat);
          bottom.scale.set(w, bHeight / 2, w);
          bottom.rotation.x = Math.PI;
          bottom.position.y = bHeight / 4;
          bGroup.add(bottom);
          
          const top = new THREE.Mesh(voidGeo, mat);
          top.scale.set(w, bHeight / 2, w);
          top.position.y = (bHeight / 4) * 3;
          bGroup.add(top);
          
          const glow = new THREE.Mesh(new THREE.BoxGeometry(w*0.2, bHeight*0.8, w*0.2), glowMat);
          glow.position.y = bHeight / 2;
          bGroup.add(glow);
        }
        else if (faction.name === 'alien') {
          const w = 2.5 * scale;
          const stem = new THREE.Mesh(alienStemGeo, mat);
          stem.scale.set(w, bHeight * 0.8, w);
          stem.position.y = bHeight * 0.4;
          bGroup.add(stem);
          
          const pod = new THREE.Mesh(alienPodGeo, mat);
          pod.scale.set(w * 1.5, w * 1.5, w * 1.5);
          pod.position.y = bHeight * 0.8 + w * 1.5;
          bGroup.add(pod);
        }

        if (isCommand) {
          cmdPos.copy(bGroup.position);
          const shield = new THREE.Mesh(shieldGeo, new THREE.MeshBasicMaterial({
            color: faction.color,
            transparent: true,
            opacity: 0.2,
            wireframe: true
          }));
          shield.scale.set(20, 20, 20);
          shield.position.y = 15;
          bGroup.add(shield);
          shields.push({ mesh: shield, baseScale: 20 });
        }
        
        buildings.push({
          mesh: bGroup,
          faction: faction.name,
          mat: mat,
          baseColor: new THREE.Color(faction.color)
        });
        
        factionGroups[faction.name].push(bGroup);
        cityGroup.add(bGroup);
      }
    });

    // Beams (lines crossing between factions)
    const beamGeo = new THREE.CylinderGeometry(0.2, 0.2, 1, 4);
    beamGeo.translate(0, 0.5, 0);
    beamGeo.rotateX(Math.PI / 2);

    for (let i = 0; i < 30; i++) {
      const f1 = factions[Math.floor(Math.random() * 3)];
      const f2 = factions[Math.floor(Math.random() * 3)];
      if (f1.name === f2.name) continue;

      const beamMat = new THREE.MeshBasicMaterial({ color: f1.beam });
      const beam = new THREE.Mesh(beamGeo, beamMat);
      
      const b1 = factionGroups[f1.name][Math.floor(Math.random() * factionGroups[f1.name].length)];
      const b2 = factionGroups[f2.name][Math.floor(Math.random() * factionGroups[f2.name].length)];
      
      beam.userData = {
        p1: b1.position.clone().setY(5 + Math.random() * 10),
        p2: b2.position.clone().setY(5 + Math.random() * 10),
        progress: Math.random(),
        speed: 0.5 + Math.random() * 1.5
      };
      
      cityGroup.add(beam);
      beams.push(beam);
    }

    // Particles: Vortex energy, tracers, bolts, spores
    const pCount = 4500;
    const pGeo = new THREE.BufferGeometry();
    const pPos = new Float32Array(pCount * 3);
    const pCol = new Float32Array(pCount * 3);
    const pData = [];

    const colorTerran = new THREE.Color(colors.beamRed);
    const colorVoid = new THREE.Color(colors.beamBlue);
    const colorAlien = new THREE.Color(colors.beamGreen);
    const colorVortex = new THREE.Color(colors.vortex);

    for (let i = 0; i < pCount; i++) {
      let type, c;
      const r = Math.random();
      if (r < 0.4) {
        type = 'vortex';
        c = colorVortex;
      } else if (r < 0.6) {
        type = 'terran';
        c = colorTerran;
      } else if (r < 0.8) {
        type = 'void';
        c = colorVoid;
      } else {
        type = 'alien';
        c = colorAlien;
      }

      pCol[i*3] = c.r; pCol[i*3+1] = c.g; pCol[i*3+2] = c.b;

      let rDist, theta, y;
      if (type === 'vortex') {
        rDist = 20 + Math.random() * 80;
        theta = Math.random() * Math.PI * 2;
        y = Math.random() * 30;
      } else {
        const f = factions.find(f => f.name === type);
        rDist = 10 + Math.random() * 130;
        theta = f.angleOffset + Math.random() * (Math.PI / 2) - Math.PI / 4;
        y = Math.random() * 20;
      }

      pPos[i*3] = Math.cos(theta) * rDist;
      pPos[i*3+1] = y;
      pPos[i*3+2] = Math.sin(theta) * rDist;

      pData.push({
        type: type,
        radius: rDist,
        angle: theta,
        y: y,
        speed: 0.05 + Math.random() * 0.1,
        yVel: (Math.random() - 0.5) * 5
      });
    }

    pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
    pGeo.setAttribute('color', new THREE.BufferAttribute(pCol, 3));
    const pMat = new THREE.PointsMaterial({
      size: 0.8,
      vertexColors: true,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending
    });
    const particles = new THREE.Points(pGeo, pMat);
    cityGroup.add(particles);

    // Update function
    cityGroup.userData.update = function(time, delta) {
      const t = time * 0.001 + timeOffset;

      // Spin vortex
      vortex.rotation.z -= delta * 2;
      core.rotation.y += delta * 3;
      core.rotation.x += delta * 2;

      // Pulse buildings
      buildings.forEach(b => {
        const pulse = (Math.sin(t * 3 + b.mesh.position.length() * 0.1) + 1) * 0.5;
        if (b.mat && b.mat.emissive) b.mat.emissive.copy(b.baseColor).multiplyScalar(pulse * 0.3);
      });

      // Pulse shields
      shields.forEach(s => {
        const scale = s.baseScale + Math.sin(t * 5) * 0.5;
        s.mesh.scale.set(scale, scale, scale);
        s.mesh.rotation.y += delta;
      });

      // Beams
      beams.forEach(b => {
        b.userData.progress += delta * b.userData.speed;
        if (b.userData.progress > 1) {
          b.userData.progress = 0;
          b.userData.p1.y = 5 + Math.random() * 10;
          b.userData.p2.y = 5 + Math.random() * 10;
        }
        
        const pos = b.userData.p1.clone().lerp(b.userData.p2, b.userData.progress);
        b.position.copy(pos);
        b.lookAt(b.userData.p2);
        
        const dist = b.userData.p1.distanceTo(b.userData.p2);
        const length = Math.min(dist * 0.2, 5);
        b.scale.set(1, 1, length);
      });

      // Particles
      const positions = particles.geometry.attributes.position.array;
      for (let i = 0; i < pCount; i++) {
        const pd = pData[i];
        
        if (pd.type === 'vortex') {
          pd.angle -= delta * pd.speed * 10; // spiral in
          pd.radius -= delta * pd.speed * 20;
          if (pd.radius < 5) {
            pd.radius = 100;
            pd.y = Math.random() * 30;
          }
        } else {
          // Fire inward towards vortex
          pd.radius -= delta * pd.speed * 50;
          if (pd.radius < 10) {
            pd.radius = 140;
            pd.angle += (Math.random() - 0.5) * 0.2;
          }
        }
        
        positions[i*3] = Math.cos(pd.angle) * pd.radius;
        positions[i*3+1] = pd.y + Math.sin(t * 2 + i) * 2;
        positions[i*3+2] = Math.sin(pd.angle) * pd.radius;
      }
      particles.geometry.attributes.position.needsUpdate = true;
    };

    console.log('[Vortex Siege] City spawned at (' + offsetX + ', 0, ' + offsetZ + ')');
    return cityGroup;
  };
})();
