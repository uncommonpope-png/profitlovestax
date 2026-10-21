(function() {
  'use strict';

  window.spawnChronosTemple = function(scene, opts = {}) {
    const offsetX = opts.offsetX !== undefined ? opts.offsetX : 300;
    const offsetZ = opts.offsetZ !== undefined ? opts.offsetZ : -1500;
    
    const cityGroup = new THREE.Group();
    cityGroup.position.set(offsetX, 0, offsetZ);

    // Materials (ONLY MeshStandardMaterial and MeshBasicMaterial)
    const materials = {
      bronze: new THREE.MeshStandardMaterial({ color: 0xaa8844, metalness: 0.8, roughness: 0.4 }),
      iron: new THREE.MeshStandardMaterial({ color: 0x554433, metalness: 0.9, roughness: 0.5 }),
      shadow: new THREE.MeshStandardMaterial({ color: 0x332211, metalness: 0.5, roughness: 0.8 }),
      timeGold: new THREE.MeshBasicMaterial({ color: 0xffdd88 }),
      crystalWhite: new THREE.MeshBasicMaterial({ color: 0xffffee }),
    };

    // Animated elements tracking
    const animatedRings = [];
    const animatedPendulums = [];
    const animatedHands = [];
    let timeCrystal = null;

    // --- 1. Central Time Crystal ---
    const crystalGeo = new THREE.OctahedronGeometry(20, 0);
    timeCrystal = new THREE.Mesh(crystalGeo, materials.crystalWhite);
    timeCrystal.position.y = 45;
    cityGroup.add(timeCrystal);

    // --- 2. 5 Massive Clockwork Rings ---
    const ringRadii = [40, 70, 100, 130, 160];
    const ringSpeeds = [0.5, -0.3, 0.2, -0.15, 0.1];
    
    ringRadii.forEach((radius, i) => {
      const ringGroup = new THREE.Group();
      ringGroup.position.y = 10 + i * 5;
      
      const torusGeo = new THREE.TorusGeometry(radius, 3, 16, 64);
      const ringMesh = new THREE.Mesh(torusGeo, i % 2 === 0 ? materials.bronze : materials.iron);
      ringMesh.rotation.x = Math.PI / 2;
      ringGroup.add(ringMesh);
      
      // Add teeth
      const teethCount = 36;
      for (let j = 0; j < teethCount; j++) {
        const angle = (j / teethCount) * Math.PI * 2;
        const toothGeo = new THREE.BoxGeometry(4, 4, 8);
        const tooth = new THREE.Mesh(toothGeo, materials.iron);
        tooth.position.set(Math.cos(angle) * radius, 0, Math.sin(angle) * radius);
        tooth.rotation.y = -angle;
        ringGroup.add(tooth);
      }
      
      cityGroup.add(ringGroup);
      animatedRings.push({ group: ringGroup, speed: ringSpeeds[i] });
    });

    // --- 3. 12 Clock Tower Sentinels ---
    const sentinelRadius = 180;
    for (let i = 0; i < 12; i++) {
      const angle = (i / 12) * Math.PI * 2;
      const x = Math.cos(angle) * sentinelRadius;
      const z = Math.sin(angle) * sentinelRadius;
      const height = 60;
      
      const towerGroup = new THREE.Group();
      towerGroup.position.set(x, 0, z);
      towerGroup.rotation.y = -angle + Math.PI; // Face center
      
      // Base
      const baseGeo = new THREE.CylinderGeometry(8, 10, height, 8);
      const baseMesh = new THREE.Mesh(baseGeo, materials.shadow);
      baseMesh.position.y = height / 2;
      towerGroup.add(baseMesh);
      
      // Cap
      const capGeo = new THREE.ConeGeometry(10, 20, 8);
      const capMesh = new THREE.Mesh(capGeo, materials.bronze);
      capMesh.position.y = height + 10;
      towerGroup.add(capMesh);
      
      // Clock face
      const faceGeo = new THREE.CircleGeometry(6, 16);
      const faceMesh = new THREE.Mesh(faceGeo, materials.timeGold);
      faceMesh.position.set(0, height - 10, 8.1);
      towerGroup.add(faceMesh);
      
      // Clock hands
      const handsGroup = new THREE.Group();
      handsGroup.position.set(0, height - 10, 8.2);
      const handGeo = new THREE.BoxGeometry(0.5, 4, 0.2);
      // Offset geometry to rotate from one end
      handGeo.translate(0, 2, 0); 
      const handMesh = new THREE.Mesh(handGeo, materials.shadow);
      handsGroup.add(handMesh);
      towerGroup.add(handsGroup);
      
      cityGroup.add(towerGroup);
      animatedHands.push({ group: handsGroup, speed: 2.0 + Math.random() });
    }

    // --- 4. Buildings (180 structures in rings) ---
    const numBuildings = 168; // 180 - 12 sentinels
    for (let i = 0; i < numBuildings; i++) {
      // Pick a random ring for placement (between 40 and 150)
      const radius = 50 + Math.random() * 100;
      const angle = Math.random() * Math.PI * 2;
      const type = Math.floor(Math.random() * 4);
      
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      
      const building = new THREE.Group();
      building.position.set(x, 0, z);
      building.rotation.y = Math.random() * Math.PI * 2;
      
      const scale = 0.5 + Math.random() * 0.8;
      building.scale.set(scale, scale, scale);
      
      if (type === 0) {
        // Clock Tower
        const h = 20 + Math.random() * 20;
        const bodyGeo = new THREE.CylinderGeometry(4, 5, h, 8);
        const body = new THREE.Mesh(bodyGeo, materials.bronze);
        body.position.y = h / 2;
        building.add(body);
        
        const capGeo = new THREE.ConeGeometry(5, 10, 8);
        const cap = new THREE.Mesh(capGeo, materials.shadow);
        cap.position.y = h + 5;
        building.add(cap);
        
        const faceGeo = new THREE.PlaneGeometry(4, 4);
        const face = new THREE.Mesh(faceGeo, materials.timeGold);
        face.position.set(0, h - 5, 4.1);
        building.add(face);
        
      } else if (type === 1) {
        // Gear Platform
        const r = 8 + Math.random() * 5;
        const h = 5 + Math.random() * 10;
        const geo = new THREE.CylinderGeometry(r, r, h, 16);
        const mesh = new THREE.Mesh(geo, materials.iron);
        mesh.position.y = h / 2;
        building.add(mesh);
        
        const teeth = 12;
        for (let j = 0; j < teeth; j++) {
          const tAngle = (j / teeth) * Math.PI * 2;
          const tGeo = new THREE.BoxGeometry(3, h, 4);
          const tMesh = new THREE.Mesh(tGeo, materials.shadow);
          tMesh.position.set(Math.cos(tAngle) * r, h / 2, Math.sin(tAngle) * r);
          tMesh.rotation.y = -tAngle;
          building.add(tMesh);
        }
        
      } else if (type === 2) {
        // Hourglass Monument
        const h = 15 + Math.random() * 10;
        const coneGeo = new THREE.ConeGeometry(6, h, 16);
        
        const bottom = new THREE.Mesh(coneGeo, materials.bronze);
        bottom.position.y = h / 2;
        bottom.rotation.x = Math.PI; // point up
        building.add(bottom);
        
        const top = new THREE.Mesh(coneGeo, materials.bronze);
        top.position.y = h * 1.5;
        building.add(top);
        
        // Glowing sand in center
        const sandGeo = new THREE.SphereGeometry(2, 8, 8);
        const sand = new THREE.Mesh(sandGeo, materials.timeGold);
        sand.position.y = h;
        building.add(sand);
        
      } else {
        // Pendulum Arch
        const h = 25 + Math.random() * 15;
        
        // Pillars
        const pGeo = new THREE.CylinderGeometry(2, 2, h, 8);
        const p1 = new THREE.Mesh(pGeo, materials.iron);
        p1.position.set(-6, h / 2, 0);
        building.add(p1);
        const p2 = new THREE.Mesh(pGeo, materials.iron);
        p2.position.set(6, h / 2, 0);
        building.add(p2);
        
        // Arch top
        const topGeo = new THREE.BoxGeometry(16, 4, 4);
        const top = new THREE.Mesh(topGeo, materials.bronze);
        top.position.set(0, h, 0);
        building.add(top);
        
        // Pendulum
        const pendulumGroup = new THREE.Group();
        pendulumGroup.position.set(0, h - 2, 0);
        
        const rodGeo = new THREE.CylinderGeometry(0.5, 0.5, h * 0.6, 4);
        rodGeo.translate(0, -h * 0.3, 0);
        const rod = new THREE.Mesh(rodGeo, materials.shadow);
        pendulumGroup.add(rod);
        
        const weightGeo = new THREE.CylinderGeometry(3, 3, 2, 16);
        const weight = new THREE.Mesh(weightGeo, materials.timeGold);
        weight.rotation.x = Math.PI / 2;
        weight.position.y = -h * 0.6;
        pendulumGroup.add(weight);
        
        building.add(pendulumGroup);
        animatedPendulums.push({ 
          group: pendulumGroup, 
          speed: 1.0 + Math.random(), 
          phase: Math.random() * Math.PI * 2 
        });
      }
      
      cityGroup.add(building);
    }

    // --- 5. Particles (2500) ---
    const particleCount = 2500;
    const pGeo = new THREE.BufferGeometry();
    const pPos = new Float32Array(particleCount * 3);
    const pTypes = new Float32Array(particleCount); // 0=dust, 1=sparks, 2=sand

    for (let i = 0; i < particleCount; i++) {
      const type = Math.random();
      let typeVal = 0; // gold dust
      
      let x, y, z;
      if (type < 0.6) {
        // Time dust (gold, swirling)
        const radius = Math.random() * 200;
        const angle = Math.random() * Math.PI * 2;
        x = Math.cos(angle) * radius;
        z = Math.sin(angle) * radius;
        y = Math.random() * 80;
        typeVal = 0;
      } else if (type < 0.8) {
        // Chrono sparks (white, near center)
        const radius = Math.random() * 50;
        const angle = Math.random() * Math.PI * 2;
        x = Math.cos(angle) * radius;
        z = Math.sin(angle) * radius;
        y = 20 + Math.random() * 60;
        typeVal = 1;
      } else {
        // Sand grains (tan, falling like hourglasses)
        const radius = Math.random() * 150;
        const angle = Math.random() * Math.PI * 2;
        x = Math.cos(angle) * radius;
        z = Math.sin(angle) * radius;
        y = 40 + Math.random() * 60;
        typeVal = 2;
      }
      
      pPos[i * 3] = x;
      pPos[i * 3 + 1] = y;
      pPos[i * 3 + 2] = z;
      pTypes[i] = typeVal;
    }
    
    pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
    pGeo.setAttribute('aType', new THREE.BufferAttribute(pTypes, 1));
    
    // We use a custom shader or simple PointsMaterial for particles
    // Standard PointsMaterial as requested by MeshStandard/Basic rule constraints. 
    // We'll create separate systems for colors to adhere strictly to rules.
    const dustGeo = new THREE.BufferGeometry();
    const sparksGeo = new THREE.BufferGeometry();
    const sandGeo = new THREE.BufferGeometry();
    
    const dustPos = [], sparksPos = [], sandPos = [];
    for (let i = 0; i < particleCount; i++) {
      const type = pTypes[i];
      const x = pPos[i*3], y = pPos[i*3+1], z = pPos[i*3+2];
      if (type === 0) dustPos.push(x, y, z);
      else if (type === 1) sparksPos.push(x, y, z);
      else sandPos.push(x, y, z);
    }
    
    dustGeo.setAttribute('position', new THREE.Float32BufferAttribute(dustPos, 3));
    sparksGeo.setAttribute('position', new THREE.Float32BufferAttribute(sparksPos, 3));
    sandGeo.setAttribute('position', new THREE.Float32BufferAttribute(sandPos, 3));
    
    const dustMat = new THREE.PointsMaterial({ color: 0xffdd88, size: 0.8, transparent: true, opacity: 0.6 });
    const sparksMat = new THREE.PointsMaterial({ color: 0xffffee, size: 1.2, transparent: true, opacity: 0.9 });
    const sandMat = new THREE.PointsMaterial({ color: 0xaa8844, size: 0.6, transparent: true, opacity: 0.5 });
    
    const dustPoints = new THREE.Points(dustGeo, dustMat);
    const sparksPoints = new THREE.Points(sparksGeo, sparksMat);
    const sandPoints = new THREE.Points(sandGeo, sandMat);
    
    cityGroup.add(dustPoints);
    cityGroup.add(sparksPoints);
    cityGroup.add(sandPoints);

    // --- Update Loop ---
    cityGroup.userData.update = function(time, delta) {
      // Pulse time crystal
      if (timeCrystal) {
        timeCrystal.rotation.y += delta * 0.5;
        timeCrystal.rotation.x += delta * 0.2;
        const scale = 1.0 + Math.sin(time * 2.0) * 0.05;
        timeCrystal.scale.set(scale, scale, scale);
      }
      
      // Rotate massive rings
      animatedRings.forEach(ring => {
        ring.group.rotation.y += ring.speed * delta;
      });
      
      // Swing pendulums
      animatedPendulums.forEach(pendulum => {
        pendulum.group.rotation.z = Math.sin(time * pendulum.speed + pendulum.phase) * 0.4;
      });
      
      // Rotate clock hands
      animatedHands.forEach(hand => {
        hand.group.rotation.z -= hand.speed * delta;
      });
      
      // Animate particles
      const dPos = dustPoints.geometry.attributes.position.array;
      for (let i = 0; i < dPos.length / 3; i++) {
        // Swirl clockwise
        const x = dPos[i * 3];
        const z = dPos[i * 3 + 2];
        const angle = Math.atan2(z, x) - delta * 0.2;
        const radius = Math.sqrt(x * x + z * z);
        dPos[i * 3] = Math.cos(angle) * radius;
        dPos[i * 3 + 2] = Math.sin(angle) * radius;
      }
      dustPoints.geometry.attributes.position.needsUpdate = true;
      
      const sPos = sandPoints.geometry.attributes.position.array;
      for (let i = 0; i < sPos.length / 3; i++) {
        sPos[i * 3 + 1] -= delta * 15; // fall down
        if (sPos[i * 3 + 1] < 0) {
          sPos[i * 3 + 1] = 100; // reset to top
        }
      }
      sandPoints.geometry.attributes.position.needsUpdate = true;
      
      const spPos = sparksPoints.geometry.attributes.position.array;
      for (let i = 0; i < spPos.length / 3; i++) {
        spPos[i * 3 + 1] += (Math.random() - 0.5) * delta * 20;
        spPos[i * 3] += (Math.random() - 0.5) * delta * 20;
        spPos[i * 3 + 2] += (Math.random() - 0.5) * delta * 20;
      }
      sparksPoints.geometry.attributes.position.needsUpdate = true;
    };

    if (scene) {
      scene.add(cityGroup);
    }

    console.log(`[ChronosTemple] City spawned at (${offsetX}, 0, ${offsetZ})`);
    return cityGroup;
  };
})();
