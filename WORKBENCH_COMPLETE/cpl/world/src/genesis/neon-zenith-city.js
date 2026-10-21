(function() {
  'use strict';

  window.spawnNeonZenith = function(scene, opts) {
    opts = opts || {};
    const offsetX = opts.offsetX !== undefined ? opts.offsetX : 600;
    const offsetY = opts.offsetY !== undefined ? opts.offsetY : 0;
    const offsetZ = opts.offsetZ !== undefined ? opts.offsetZ : -800;

    const cityGroup = new THREE.Group();
    cityGroup.position.set(offsetX, offsetY, offsetZ);

    const darkChromeMat = (window.__genesisStd || function(c){ return new THREE.MeshStandardMaterial(c); })({
      color: 0x1a1a2e,
      metalness: 0.8,
      roughness: 0.2
    });
    
    const darkBaseMat = (window.__genesisStd || function(c){ return new THREE.MeshStandardMaterial(c); })({
      color: 0x0a0a1a,
      metalness: 0.9,
      roughness: 0.1
    });

    const neonMagentaMat = new THREE.MeshBasicMaterial({ color: 0xff00ff });
    const neonCyanMat = new THREE.MeshBasicMaterial({ color: 0x00ffff });
    const neonYellowMat = new THREE.MeshBasicMaterial({ color: 0xffff00 });
    
    const neonMats = [neonMagentaMat, neonCyanMat, neonYellowMat];

    const updatables = [];

    // Tiers
    const tierRadii = [40, 80, 120];
    const tierHeights = [20, 10, 0];
    
    const baseGeo = new THREE.CylinderGeometry(140, 150, 5, 32);
    const baseMesh = new THREE.Mesh(baseGeo, darkBaseMat);
    baseMesh.position.y = -2.5;
    cityGroup.add(baseMesh);

    const buildingsCount = 250;
    const towers = [];

    // Central mega-tower
    const centralGeo = new THREE.BoxGeometry(15, 80, 15);
    const centralTower = new THREE.Mesh(centralGeo, darkChromeMat);
    centralTower.position.y = tierHeights[0] + 40;
    cityGroup.add(centralTower);
    
    const centralCapGeo = new THREE.CylinderGeometry(0, 10, 15, 4);
    const centralCap = new THREE.Mesh(centralCapGeo, darkChromeMat);
    centralCap.position.y = 47.5;
    centralCap.rotation.y = Math.PI / 4;
    centralTower.add(centralCap);
    
    // Holographic ring on central tower
    const ringGeo = new THREE.TorusGeometry(12, 1, 16, 32);
    const ringMesh = new THREE.Mesh(ringGeo, neonCyanMat);
    ringMesh.position.y = 55;
    ringMesh.rotation.x = Math.PI / 2;
    centralTower.add(ringMesh);
    
    updatables.push((time) => {
      ringMesh.rotation.z = time * 0.5;
      const s = 1 + Math.sin(time * 2) * 0.1;
      ringMesh.scale.set(s, s, s);
    });

    towers.push(centralTower);

    // Buildings
    const boxGeo = new THREE.BoxGeometry(1, 1, 1);
    const cylGeo = new THREE.CylinderGeometry(1, 1, 1, 8);
    const planeGeo = new THREE.PlaneGeometry(1, 1);

    for (let i = 0; i < buildingsCount; i++) {
      const tierIndex = i % 3;
      const radius = tierRadii[tierIndex] + (Math.random() * 15 - 7.5);
      const angle = Math.random() * Math.PI * 2;
      const yBase = tierHeights[tierIndex];
      
      const width = 2 + Math.random() * 4;
      const depth = 2 + Math.random() * 4;
      const height = 10 + Math.random() * 30 + (2 - tierIndex) * 10;
      
      const bldgGroup = new THREE.Group();
      bldgGroup.position.set(
        Math.cos(angle) * radius,
        yBase,
        Math.sin(angle) * radius
      );
      bldgGroup.lookAt(0, yBase, 0); // look at center
      
      // Main body
      const body = new THREE.Mesh(boxGeo, darkChromeMat);
      body.scale.set(width, height, depth);
      body.position.y = height / 2;
      bldgGroup.add(body);
      
      // Greebles & Details
      const isAntenna = Math.random() > 0.6;
      if (isAntenna) {
        const antH = 5 + Math.random() * 10;
        const antenna = new THREE.Mesh(cylGeo, darkChromeMat);
        antenna.scale.set(0.2, antH, 0.2);
        antenna.position.y = height + antH / 2;
        bldgGroup.add(antenna);
        
        // Neon tip
        const tipGeo = new THREE.SphereGeometry(0.5, 8, 8);
        const tipMat = neonMats[Math.floor(Math.random() * neonMats.length)];
        const tip = new THREE.Mesh(tipGeo, tipMat);
        tip.position.y = antH / 2;
        antenna.add(tip);
      } else {
        // Wedge cap
        const wedge = new THREE.Mesh(cylGeo, darkChromeMat);
        wedge.scale.set(width / 2, width / 2, width / 2);
        wedge.position.y = height + width / 4;
        wedge.rotation.z = Math.PI / 2;
        bldgGroup.add(wedge);
      }
      
      // Neon Strips
      if (Math.random() > 0.3) {
        const stripMat = neonMats[Math.floor(Math.random() * neonMats.length)];
        const strip = new THREE.Mesh(boxGeo, stripMat);
        strip.scale.set(width + 0.2, 0.5, depth + 0.2);
        strip.position.y = height * Math.random();
        bldgGroup.add(strip);
        
        const speed = 1 + Math.random() * 2;
        const phase = Math.random() * Math.PI * 2;
        updatables.push((time) => {
          strip.position.y = (height / 2) + Math.sin(time * speed + phase) * (height / 2 - 1);
        });
      }
      
      // Holographic Billboards
      if (Math.random() > 0.7) {
        const boardMat = neonMats[Math.floor(Math.random() * neonMats.length)];
        const boardW = width * 1.5;
        const boardH = 5 + Math.random() * 5;
        const board = new THREE.Mesh(planeGeo, boardMat);
        board.scale.set(boardW, boardH, 1);
        board.position.set(0, height * 0.7, depth / 2 + 0.6);
        bldgGroup.add(board);
        
        updatables.push((time) => {
           if (Math.random() < 0.05) {
             board.visible = !board.visible;
           } else {
             board.visible = true;
           }
        });
      }

      cityGroup.add(bldgGroup);
      
      if (height > 30) {
        towers.push(body);
      }
    }

    // Skybridges
    const bridgeGeo = new THREE.BoxGeometry(1, 1, 1);
    const bridgeMat = darkChromeMat;
    
    for (let i = 0; i < 16; i++) {
        if (towers.length < 2) break;
        const t1 = towers[Math.floor(Math.random() * towers.length)];
        const t2 = towers[Math.floor(Math.random() * towers.length)];
        if (t1 === t2) continue;
        
        const p1 = new THREE.Vector3();
        t1.getWorldPosition(p1);
        const p2 = new THREE.Vector3();
        t2.getWorldPosition(p2);
        
        // Localize coordinates
        p1.sub(cityGroup.position);
        p2.sub(cityGroup.position);
        
        const dist = p1.distanceTo(p2);
        if (dist > 80) continue; // too far
        
        const midPoint = new THREE.Vector3().addVectors(p1, p2).multiplyScalar(0.5);
        // Slightly random height, but must be within the lowest tower's height
        const h1 = (t1.geometry.parameters.height * t1.scale.y) || 40;
        const h2 = (t2.geometry.parameters.height * t2.scale.y) || 40;
        const bridgeY = Math.min(h1, h2) * (0.3 + Math.random() * 0.5) + (t1.parent.position.y > 0 ? t1.parent.position.y : 0);
        
        midPoint.y = bridgeY;
        
        const bridge = new THREE.Mesh(bridgeGeo, bridgeMat);
        bridge.position.copy(midPoint);
        bridge.scale.set(1.5, 1.5, dist);
        bridge.lookAt(p2.x, bridgeY, p2.z);
        cityGroup.add(bridge);
        
        // Bridge neon
        const bNeon = new THREE.Mesh(bridgeGeo, neonCyanMat);
        bNeon.scale.set(1.6, 0.2, dist);
        bridge.add(bNeon);
    }

    // Particles (3000)
    const particleCount = 3000;
    const instancedGeo = new THREE.BoxGeometry(0.5, 0.5, 0.5);
    const instancedMat = neonMagentaMat.clone();
    
    const particleMesh = new THREE.InstancedMesh(instancedGeo, instancedMat, particleCount);
    const dummy = new THREE.Object3D();
    const particleData = [];
    
    for (let i = 0; i < particleCount; i++) {
        const x = (Math.random() - 0.5) * 300;
        const y = Math.random() * 100;
        const z = (Math.random() - 0.5) * 300;
        
        dummy.position.set(x, y, z);
        dummy.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
        dummy.updateMatrix();
        particleMesh.setMatrixAt(i, dummy.matrix);
        
        particleData.push({
            x, y, z,
            vy: 0.1 + Math.random() * 0.5,
            rx: Math.random() * 0.05,
            ry: Math.random() * 0.05
        });
    }
    cityGroup.add(particleMesh);
    
    updatables.push((time, delta) => {
        for (let i = 0; i < particleCount; i++) {
            const data = particleData[i];
            data.y += data.vy * delta * 60;
            if (data.y > 150) data.y = -10;
            
            dummy.position.set(data.x, data.y, data.z);
            dummy.rotation.x += data.rx;
            dummy.rotation.y += data.ry;
            dummy.updateMatrix();
            particleMesh.setMatrixAt(i, dummy.matrix);
        }
        particleMesh.instanceMatrix.needsUpdate = true;
    });

    if (scene) {
      scene.add(cityGroup);
    }

    console.log(`[NeonZenith] City spawned at (${offsetX}, ${offsetY}, ${offsetZ})`);

    cityGroup.userData.update = function(time, delta) {
      for (const updateFn of updatables) {
        updateFn(time, delta);
      }
    };

    return cityGroup;
  };
})();
