(function() {
  'use strict';

  window.spawnSolarForge = function(scene, opts) {
    opts = opts || {};
    const offsetX = opts.offsetX !== undefined ? opts.offsetX : -900;
    const offsetY = opts.offsetY !== undefined ? opts.offsetY : 0;
    const offsetZ = opts.offsetZ !== undefined ? opts.offsetZ : -300;

    const cityGroup = new THREE.Group();
    cityGroup.position.set(offsetX, offsetY, offsetZ);
    scene.add(cityGroup);

    const updatables = [];

    // Colors & Materials (Standard & Basic ONLY)
    const colorCopper = 0xcc6600;
    const colorPlasma = 0xffeeaa;
    const colorSolarGold = 0xffaa00;
    const colorBronze = 0x442200;
    const colorWhiteHot = 0xffffff;

    const matCopper = (window.__genesisStd || function(c){ return new THREE.MeshStandardMaterial(c); })({
      color: colorCopper,
      roughness: 0.2,
      metalness: 0.9
    });
    
    const matBronze = (window.__genesisStd || function(c){ return new THREE.MeshStandardMaterial(c); })({
      color: colorBronze,
      roughness: 0.4,
      metalness: 0.8
    });

    const matSolarGold = (window.__genesisStd || function(c){ return new THREE.MeshStandardMaterial(c); })({
      color: colorSolarGold,
      roughness: 0.1,
      metalness: 1.0
    });

    const matPlasmaGlow = new THREE.MeshBasicMaterial({
      color: colorPlasma
    });
    
    const matWhiteHot = new THREE.MeshBasicMaterial({
      color: colorWhiteHot
    });

    // 1. Central Plasma Reactor
    const coreGroup = new THREE.Group();
    coreGroup.position.y = 50;
    cityGroup.add(coreGroup);

    const coreSphereGeo = new THREE.SphereGeometry(30, 32, 32);
    const coreSphere = new THREE.Mesh(coreSphereGeo, matWhiteHot);
    coreGroup.add(coreSphere);

    const ring1Geo = new THREE.TorusGeometry(50, 4, 16, 64);
    const ring1 = new THREE.Mesh(ring1Geo, matSolarGold);
    coreGroup.add(ring1);

    const ring2Geo = new THREE.TorusGeometry(70, 3, 16, 64);
    const ring2 = new THREE.Mesh(ring2Geo, matCopper);
    ring2.rotation.x = Math.PI / 2;
    coreGroup.add(ring2);

    const ring3Geo = new THREE.TorusGeometry(90, 2, 16, 64);
    const ring3 = new THREE.Mesh(ring3Geo, matPlasmaGlow);
    ring3.rotation.y = Math.PI / 2;
    coreGroup.add(ring3);

    const baseGeo = new THREE.CylinderGeometry(40, 60, 50, 16);
    const baseMesh = new THREE.Mesh(baseGeo, matBronze);
    baseMesh.position.y = -25;
    coreGroup.add(baseMesh);

    updatables.push((time, delta) => {
      ring1.rotation.x += delta * 0.5;
      ring1.rotation.y += delta * 0.2;
      ring2.rotation.y += delta * 0.6;
      ring2.rotation.z += delta * 0.3;
      ring3.rotation.x += delta * 0.4;
      ring3.rotation.z += delta * 0.7;
    });

    // 2. Buildings (Spiral Layout - 4 Arms)
    const buildingGeos = [];
    const numArms = 4;
    const buildingsPerArm = 45; // 180 total
    const spiralA = 40;
    const spiralB = 0.15;

    const dishes = [];

    for (let arm = 0; arm < numArms; arm++) {
      const armOffset = (Math.PI * 2 / numArms) * arm;
      
      for (let i = 0; i < buildingsPerArm; i++) {
        const t = (i / buildingsPerArm) * Math.PI * 6 + 1.0; // t from 1 to ~19.8
        const r = spiralA * Math.exp(spiralB * t);
        const theta = t + armOffset;

        const x = r * Math.cos(theta);
        const z = r * Math.sin(theta);

        // Building height decreases further out
        const maxH = 150 - (i * 2);
        const h = Math.max(30, maxH + (Math.random() * 40 - 20));

        const bGroup = new THREE.Group();
        bGroup.position.set(x, h/2, z);
        bGroup.rotation.y = Math.random() * Math.PI;

        const type = Math.random();
        
        if (type < 0.3) {
          // Reactor Tower
          const cyl = new THREE.Mesh(new THREE.CylinderGeometry(10, 15, h, 8), matBronze);
          const cap = new THREE.Mesh(new THREE.SphereGeometry(12, 16, 16), matPlasmaGlow);
          cap.position.y = h/2;
          bGroup.add(cyl);
          bGroup.add(cap);
        } else if (type < 0.6) {
          // Forge Building
          const box = new THREE.Mesh(new THREE.BoxGeometry(20, h, 20), matCopper);
          bGroup.add(box);
          // Chimney
          const chim = new THREE.Mesh(new THREE.CylinderGeometry(2, 2, h + 20, 8), matBronze);
          chim.position.y = 10;
          chim.position.x = 8;
          bGroup.add(chim);
        } else {
          // Pylon
          const pylon = new THREE.Mesh(new THREE.CylinderGeometry(5, 8, h, 6), matSolarGold);
          const ring = new THREE.Mesh(new THREE.TorusGeometry(10, 1.5, 8, 16), matPlasmaGlow);
          ring.position.y = h/2 - 10;
          ring.rotation.x = Math.PI/2;
          bGroup.add(pylon);
          bGroup.add(ring);
        }

        // 8 Special Mega-dishes
        if (i === 10 || i === 25) {
           const dishGroup = new THREE.Group();
           dishGroup.position.set(x, h + 20, z);
           
           const dishStem = new THREE.Mesh(new THREE.CylinderGeometry(4, 4, 20, 8), matBronze);
           dishStem.position.y = -10;
           dishGroup.add(dishStem);

           const dishHead = new THREE.Group();
           const dishCone = new THREE.Mesh(new THREE.ConeGeometry(30, 10, 16), matSolarGold);
           dishCone.rotation.x = Math.PI/2;
           dishHead.add(dishCone);
           
           const dishRing = new THREE.Mesh(new THREE.TorusGeometry(30, 2, 8, 32), matCopper);
           dishHead.add(dishRing);
           
           const dishCenter = new THREE.Mesh(new THREE.SphereGeometry(5, 16, 16), matWhiteHot);
           dishCenter.position.z = 5;
           dishHead.add(dishCenter);

           dishGroup.add(dishHead);
           cityGroup.add(dishGroup);

           dishes.push(dishHead);
        }

        cityGroup.add(bGroup);
      }
    }

    updatables.push((time, delta) => {
      dishes.forEach((dish, idx) => {
        const speed = 0.5 + (idx % 3) * 0.2;
        dish.lookAt(coreGroup.position.x, coreGroup.position.y + Math.sin(time * speed) * 50, coreGroup.position.z);
      });
    });

    // 3. Particles
    const particleCount = 3500;
    const partGeo = new THREE.BufferGeometry();
    const partPos = new Float32Array(particleCount * 3);
    const partVels = [];

    for (let i = 0; i < particleCount; i++) {
      const pr = Math.random() * 800;
      const pth = Math.random() * Math.PI * 2;
      partPos[i * 3] = Math.cos(pth) * pr;
      partPos[i * 3 + 1] = Math.random() * 200;
      partPos[i * 3 + 2] = Math.sin(pth) * pr;

      partVels.push({
        y: Math.random() * 20 + 10,
        spiralTh: (Math.random() - 0.5) * 0.1,
        radiusMult: 0.999 + Math.random() * 0.002
      });
    }
    partGeo.setAttribute('position', new THREE.BufferAttribute(partPos, 3));
    
    const partMat = new THREE.PointsMaterial({
      color: colorPlasma,
      size: 1.5,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending
    });
    
    const particles = new THREE.Points(partGeo, partMat);
    cityGroup.add(particles);

    updatables.push((time, delta) => {
      const pos = particles.geometry.attributes.position.array;
      for (let i = 0; i < particleCount; i++) {
        const px = pos[i*3];
        let py = pos[i*3+1];
        const pz = pos[i*3+2];
        const v = partVels[i];
        
        py += v.y * delta;
        if (py > 250) py = 0;
        
        pos[i*3+1] = py;
        
        // slight spiral
        const r = Math.sqrt(px*px + pz*pz) * v.radiusMult;
        const th = Math.atan2(pz, px) + v.spiralTh * delta;
        
        pos[i*3] = r * Math.cos(th);
        pos[i*3+2] = r * Math.sin(th);
      }
      particles.geometry.attributes.position.needsUpdate = true;
    });

    cityGroup.userData.update = function(time, delta) {
      for (let i = 0; i < updatables.length; i++) {
        updatables[i](time, delta);
      }
    };

    console.log('[SolarForge] City spawned at (' + offsetX + ', ' + offsetY + ', ' + offsetZ + ')');
    
    return cityGroup;
  };

})();
