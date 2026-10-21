(function() {
  'use strict';

  window.spawnQuantumRift = function(scene, opts) {
    opts = opts || {};
    const offsetX = opts.offsetX !== undefined ? opts.offsetX : -1200;
    const offsetZ = opts.offsetZ !== undefined ? opts.offsetZ : -1200;
    
    console.log(`[QuantumRift] City spawned at (${offsetX}, 0, ${offsetZ})`);

    const cityGroup = new THREE.Group();
    cityGroup.position.set(offsetX, 0, offsetZ);

    // Palette
    const colors = {
      metal: 0x667788,
      glitch: 0xffffff,
      voidPurple: 0x8800ff,
      staticGray: 0xaaaaaa,
      voidBlack: 0x000000
    };

    // Materials
    const matMetal = (window.__genesisStd || function(c){ return new THREE.MeshStandardMaterial(c); })({ color: colors.metal, roughness: 0.7, metalness: 0.8 });
    const matGlitch = new THREE.MeshBasicMaterial({ color: colors.glitch });
    const matVoid = new THREE.MeshBasicMaterial({ color: colors.voidPurple });
    const matVoidTrans = new THREE.MeshBasicMaterial({ color: colors.voidPurple, transparent: true, opacity: 0.5 });
    const matStatic = (window.__genesisStd || function(c){ return new THREE.MeshStandardMaterial(c); })({ color: colors.staticGray, roughness: 0.9 });
    const matGhost = (window.__genesisStd || function(c){ return new THREE.MeshStandardMaterial(c); })({ color: colors.metal, transparent: true, opacity: 0.3, wireframe: true });

    const islands = [];
    const islandCount = 7;
    const islandRadius = 300;
    
    // Generate Islands
    for (let i = 0; i < islandCount; i++) {
      const angle = (i / (islandCount - 1)) * Math.PI * 2;
      const dist = i === 0 ? 0 : 50 + Math.random() * islandRadius;
      const ix = i === 0 ? 0 : Math.cos(angle) * dist;
      const iz = i === 0 ? 0 : Math.sin(angle) * dist;
      const iy = i === 0 ? 0 : (Math.random() - 0.5) * 150;
      
      islands.push({ x: ix, y: iy, z: iz, radius: i === 0 ? 100 : 40 + Math.random() * 40 });
    }

    // Island bases
    const islandGeo = new THREE.CylinderGeometry(1, 0.7, 1, 8);
    islands.forEach(isl => {
      const mesh = new THREE.Mesh(islandGeo, matStatic);
      mesh.scale.set(isl.radius, 10 + Math.random() * 20, isl.radius);
      mesh.position.set(isl.x, isl.y - mesh.scale.y / 2, isl.z);
      mesh.rotation.y = Math.random() * Math.PI;
      cityGroup.add(mesh);
    });

    // Energy bridges
    const bridgesGeo = new THREE.BoxGeometry(1, 1, 1);
    const bridgeFlickerElements = [];
    for (let i = 1; i < islandCount; i++) {
      const from = islands[i];
      const to = islands[i > 1 ? i - 1 : 0]; // Connect to previous or center
      
      const dx = to.x - from.x;
      const dy = to.y - from.y;
      const dz = to.z - from.z;
      const dist = Math.sqrt(dx*dx + dy*dy + dz*dz);
      
      const bridge = new THREE.Mesh(bridgesGeo, matVoidTrans);
      bridge.position.set(from.x + dx/2, from.y + dy/2, from.z + dz/2);
      bridge.lookAt(to.x, to.y, to.z);
      bridge.scale.set(4, 1, dist);
      cityGroup.add(bridge);
      bridgeFlickerElements.push(bridge);
    }

    // Central Reality Tear
    const tearGeo = new THREE.PlaneGeometry(100, 150);
    const tear = new THREE.Mesh(tearGeo, matGlitch);
    tear.position.set(0, 75, 0);
    tear.rotation.y = Math.random() * Math.PI;
    tear.material.side = THREE.DoubleSide;
    const tearBorderGeo = new THREE.PlaneGeometry(110, 160);
    const tearBorder = new THREE.Mesh(tearBorderGeo, matVoid);
    tearBorder.position.copy(tear.position);
    tearBorder.position.z -= 1;
    tearBorder.rotation.copy(tear.rotation);
    tearBorder.material.side = THREE.DoubleSide;
    
    const tearGroup = new THREE.Group();
    tearGroup.add(tear);
    tearGroup.add(tearBorder);
    cityGroup.add(tearGroup);

    // Buildings
    const buildingCount = 150;
    const shiftSegments = [];
    const ghosts = [];
    const pylons = [];

    const boxGeo = new THREE.BoxGeometry(1, 1, 1);
    const cylGeo = new THREE.CylinderGeometry(1, 1, 1, 8);

    for (let i = 0; i < buildingCount; i++) {
      const island = islands[Math.floor(Math.random() * islands.length)];
      const angle = Math.random() * Math.PI * 2;
      const r = Math.random() * island.radius * 0.8;
      const bx = island.x + Math.cos(angle) * r;
      const bz = island.z + Math.sin(angle) * r;
      const by = island.y;

      const type = Math.random();
      
      if (type < 0.5) {
        // Phase-shifted tower
        const segCount = 4 + Math.floor(Math.random() * 5);
        let currY = by;
        const width = 5 + Math.random() * 5;
        
        for (let j = 0; j < segCount; j++) {
          const h = 10 + Math.random() * 15;
          currY += h / 2;
          
          const seg = new THREE.Mesh(boxGeo, matMetal);
          seg.scale.set(width, h, width);
          seg.position.set(bx, currY, bz);
          // Glitch rotation
          if (Math.random() > 0.5) {
            seg.rotation.y = (Math.random() - 0.5) * 0.5;
            seg.position.x += (Math.random() - 0.5) * 2;
            seg.position.z += (Math.random() - 0.5) * 2;
          }
          cityGroup.add(seg);
          shiftSegments.push({ mesh: seg, ox: seg.position.x, oz: seg.position.z });
          
          currY += h / 2;
        }

        // 4 phase-echo duplicates randomly
        if (ghosts.length < 4 && Math.random() > 0.9) {
          const ghostGroup = new THREE.Group();
          let gY = by;
          for (let j = 0; j < segCount; j++) {
            const h = 10 + 15; // approximate
            gY += h/2;
            const gm = new THREE.Mesh(boxGeo, matGhost);
            gm.scale.set(width, h, width);
            gm.position.set(0, gY - by, 0);
            ghostGroup.add(gm);
            gY += h/2;
          }
          ghostGroup.position.set(bx + 5 + Math.random()*5, by, bz + 5 + Math.random()*5);
          cityGroup.add(ghostGroup);
          ghosts.push(ghostGroup);
        }

      } else if (type < 0.8) {
        // Shattered monoliths
        const h = 40 + Math.random() * 60;
        const mono = new THREE.Mesh(boxGeo, matStatic);
        mono.scale.set(3, h, 8);
        mono.position.set(bx, by + h/2, bz);
        mono.rotation.y = Math.random() * Math.PI;
        mono.rotation.z = (Math.random() - 0.5) * 0.3;
        mono.rotation.x = (Math.random() - 0.5) * 0.3;
        cityGroup.add(mono);
      } else {
        // Rift pylons
        const h = 30 + Math.random() * 40;
        const pylon = new THREE.Mesh(cylGeo, matMetal);
        pylon.scale.set(4, h, 4);
        pylon.position.set(bx, by + h/2, bz);
        
        const top = new THREE.Mesh(cylGeo, matVoid);
        top.scale.set(3, 5, 3);
        top.position.set(0, h/2 + 2.5, 0);
        pylon.add(top);
        
        cityGroup.add(pylon);
        pylons.push(top);
      }
    }

    // Particles (3000) - using InstancedMesh for performance and material compliance
    const particleCount = 3000;
    const partGeo = new THREE.BoxGeometry(0.5, 0.5, 0.5);
    const glitchSparks = new THREE.InstancedMesh(partGeo, matGlitch, Math.floor(particleCount * 0.4));
    const voidTears = new THREE.InstancedMesh(partGeo, matVoid, Math.floor(particleCount * 0.3));
    const staticNoise = new THREE.InstancedMesh(partGeo, matStatic, Math.floor(particleCount * 0.3));

    const dummy = new THREE.Object3D();
    
    const initParticles = (instMesh, count, ySpread) => {
      const data = [];
      for (let i = 0; i < count; i++) {
        const x = (Math.random() - 0.5) * 600;
        const y = (Math.random() - 0.5) * ySpread + 100;
        const z = (Math.random() - 0.5) * 600;
        dummy.position.set(x, y, z);
        dummy.updateMatrix();
        instMesh.setMatrixAt(i, dummy.matrix);
        data.push({ x, y, z });
      }
      instMesh.instanceMatrix.needsUpdate = true;
      return data;
    };

    const sparksData = initParticles(glitchSparks, glitchSparks.count, 200);
    const tearsData = initParticles(voidTears, voidTears.count, 300);
    const noiseData = initParticles(staticNoise, staticNoise.count, 200);

    cityGroup.add(glitchSparks);
    cityGroup.add(voidTears);
    cityGroup.add(staticNoise);

    if (scene) {
      scene.add(cityGroup);
    }

    // Animation loop
    cityGroup.userData.update = function(time, delta) {
      // Bridges flicker
      bridgeFlickerElements.forEach(bridge => {
        bridge.material.opacity = 0.3 + Math.random() * 0.4;
      });

      // Shifting building segments
      shiftSegments.forEach(seg => {
        if (Math.random() > 0.95) {
          seg.mesh.position.x = seg.ox + (Math.random() - 0.5) * 1.5;
          seg.mesh.position.z = seg.oz + (Math.random() - 0.5) * 1.5;
        }
      });

      // Ghost copies oscillation
      ghosts.forEach((g, i) => {
        g.children.forEach(c => {
          c.material.opacity = 0.1 + Math.sin(time * 2 + i) * 0.1 + (Math.random() * 0.1);
        });
        g.position.y += Math.sin(time * 3 + i) * 0.05;
      });

      // Pylons pulse
      const pylonScale = 1 + Math.sin(time * 4) * 0.2;
      pylons.forEach(p => {
        p.scale.set(3 * pylonScale, 5 * pylonScale, 3 * pylonScale);
      });

      // Reality tear shimmer
      tear.scale.x = 1 + Math.random() * 0.05;
      tear.scale.y = 1 + Math.random() * 0.05;
      tear.rotation.z = Math.sin(time) * 0.02;

      // Particles animation
      for (let i = 0; i < glitchSparks.count; i++) {
        if (Math.random() > 0.9) { // rapid teleportation
          sparksData[i].x += (Math.random() - 0.5) * 20;
          sparksData[i].y += (Math.random() - 0.5) * 20;
          sparksData[i].z += (Math.random() - 0.5) * 20;
        }
        dummy.position.set(sparksData[i].x, sparksData[i].y, sparksData[i].z);
        dummy.updateMatrix();
        glitchSparks.setMatrixAt(i, dummy.matrix);
      }
      glitchSparks.instanceMatrix.needsUpdate = true;

      for (let i = 0; i < voidTears.count; i++) {
        tearsData[i].y -= delta * 50; // falling streaks
        if (tearsData[i].y < -50) tearsData[i].y = 250;
        dummy.position.set(tearsData[i].x, tearsData[i].y, tearsData[i].z);
        dummy.scale.set(0.2, 4, 0.2);
        dummy.updateMatrix();
        voidTears.setMatrixAt(i, dummy.matrix);
      }
      voidTears.instanceMatrix.needsUpdate = true;
      
      for (let i = 0; i < staticNoise.count; i++) {
        if (Math.random() > 0.5) { // flickering
          dummy.position.set(noiseData[i].x + (Math.random()-0.5)*2, noiseData[i].y + (Math.random()-0.5)*2, noiseData[i].z + (Math.random()-0.5)*2);
          dummy.scale.setScalar(Math.random() * 1.5);
          dummy.updateMatrix();
          staticNoise.setMatrixAt(i, dummy.matrix);
        }
      }
      staticNoise.instanceMatrix.needsUpdate = true;
    };

    return cityGroup;
  };

})();
