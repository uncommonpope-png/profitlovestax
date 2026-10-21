(function() {
  'use strict';

  window.spawnHyperionArray = function(scene, opts) {
    opts = opts || {};
    var offsetX = opts.offsetX !== undefined ? opts.offsetX : -1000;
    var offsetZ = opts.offsetZ !== undefined ? opts.offsetZ : 1500;

    var group = new THREE.Group();
    group.position.set(offsetX, 0, offsetZ);
    scene.add(group);

    console.log('[Hyperion Array] City spawned at (' + offsetX + ', 0, ' + offsetZ + ')');

    // Materials
    var matGray = new THREE.MeshStandardMaterial({
      color: 0x667788,
      metalness: 0.6,
      roughness: 0.4
    });
    var matDark = new THREE.MeshStandardMaterial({
      color: 0x334455,
      metalness: 0.7,
      roughness: 0.5
    });
    var matYellow = new THREE.MeshBasicMaterial({ color: 0xffff00 });
    var matRed = new THREE.MeshBasicMaterial({ color: 0xff2200 });
    var matBlue = new THREE.MeshBasicMaterial({ 
      color: 0x4488ff,
      transparent: true,
      opacity: 0.6
    });

    var updatables = [];

    // Base Platform / Nexus
    var nexusGeom = new THREE.CylinderGeometry(20, 25, 30, 8);
    var nexus = new THREE.Mesh(nexusGeom, matDark);
    nexus.position.y = 15;
    group.add(nexus);

    var shieldGeom = new THREE.SphereGeometry(35, 32, 16);
    var shield = new THREE.Mesh(shieldGeom, matBlue);
    shield.position.y = 15;
    group.add(shield);
    
    updatables.push(function(t) {
      shield.material.opacity = 0.4 + Math.sin(t * 3) * 0.1;
      shield.scale.setScalar(1 + Math.sin(t * 5) * 0.02);
    });

    // Orbital Rings
    var ringRadii = [60, 120, 180];
    var ringMeshes = [];
    
    ringRadii.forEach(function(r, index) {
      var rGeom = new THREE.TorusGeometry(r, 4, 16, 64);
      var rMesh = new THREE.Mesh(rGeom, matGray);
      rMesh.rotation.x = Math.PI / 2;
      rMesh.position.y = 5 + index * 10;
      group.add(rMesh);
      ringMeshes.push({ mesh: rMesh, speed: (index % 2 === 0 ? 1 : -1) * (0.2 - index * 0.05) });
      
      // Add structures along rings
      var structures = 30 + index * 20;
      for (var i = 0; i < structures; i++) {
        var angle = (i / structures) * Math.PI * 2;
        var structGroup = new THREE.Group();
        structGroup.position.set(Math.cos(angle) * r, 2, Math.sin(angle) * r);
        structGroup.lookAt(0, 2, 0);
        
        var type = Math.random();
        if (type < 0.3) {
          // Weapon platform
          var base = new THREE.Mesh(new THREE.BoxGeometry(6, 4, 6), matDark);
          base.position.y = 2;
          structGroup.add(base);
          var barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 8), matGray);
          barrel.rotation.x = Math.PI / 2;
          barrel.position.set(0, 5, 4);
          structGroup.add(barrel);
        } else if (type < 0.6) {
          // Radar
          var mast = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 8), matGray);
          mast.position.y = 4;
          structGroup.add(mast);
          var dish = new THREE.Mesh(new THREE.ConeGeometry(4, 2, 16), matGray);
          dish.rotation.x = Math.PI / 2;
          dish.position.set(0, 8, 2);
          structGroup.add(dish);
          updatables.push((function(d, a) {
            return function(t) { d.rotation.z = t * 2 + a; };
          })(dish, angle));
        } else if (type < 0.8) {
          // Silo
          var silo = new THREE.Mesh(new THREE.CylinderGeometry(3, 3, 6), matGray);
          silo.position.y = 3;
          structGroup.add(silo);
          var cap = new THREE.Mesh(new THREE.ConeGeometry(3, 2, 16), matRed);
          cap.position.y = 7;
          structGroup.add(cap);
        } else {
          // Pylon
          var pylon = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 12), matGray);
          pylon.position.y = 6;
          structGroup.add(pylon);
          var pRing = new THREE.Mesh(new THREE.TorusGeometry(2, 0.2, 8, 16), matYellow);
          pRing.rotation.x = Math.PI / 2;
          pRing.position.y = 10;
          structGroup.add(pRing);
        }
        
        rMesh.add(structGroup);
      }
    });

    updatables.push(function(t, delta) {
      ringMeshes.forEach(function(rm) {
        rm.mesh.rotation.z += rm.speed * delta;
      });
    });

    // Beam Emitters
    var emitters = [];
    for (var e = 0; e < 8; e++) {
      var a = (e / 8) * Math.PI * 2;
      var eg = new THREE.Group();
      eg.position.set(Math.cos(a) * 40, 0, Math.sin(a) * 40);
      eg.lookAt(0, 0, 0);
      
      var eBase = new THREE.Mesh(new THREE.CylinderGeometry(3, 5, 20), matDark);
      eBase.position.y = 10;
      eg.add(eBase);
      
      var eTip = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 5), matYellow);
      eTip.position.set(0, 20, 0);
      eg.add(eTip);
      
      var beam = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 200), matYellow);
      beam.rotation.x = Math.PI / 2;
      beam.position.set(0, 20, -100);
      beam.visible = false;
      eg.add(beam);
      
      group.add(eg);
      emitters.push({ tip: eTip, beam: beam, offset: e });
    }
    
    updatables.push(function(t) {
      emitters.forEach(function(em) {
        var cycle = (t + em.offset) % 4;
        if (cycle > 3.8) {
          em.beam.visible = true;
          em.tip.scale.setScalar(1.5);
        } else {
          em.beam.visible = false;
          em.tip.scale.setScalar(1 + (cycle / 3.8) * 0.5);
        }
      });
    });

    // Particles
    var pGeom = new THREE.BufferGeometry();
    var pCount = 2500;
    var pPos = new Float32Array(pCount * 3);
    var pColor = new Float32Array(pCount * 3);
    var pData = [];
    
    var colYellow = new THREE.Color(0xffff00);
    var colRed = new THREE.Color(0xff2200);
    
    for (var i = 0; i < pCount; i++) {
      var tType = Math.random();
      var rad, an, y, c;
      if (tType < 0.6) {
        // sparks
        rad = ringRadii[Math.floor(Math.random() * ringRadii.length)] + (Math.random() - 0.5) * 10;
        an = Math.random() * Math.PI * 2;
        y = Math.random() * 20;
        c = colYellow;
        pData.push({ type: 0, rad: rad, an: an, speed: 0.5 + Math.random() });
      } else {
        // lasers
        rad = Math.random() * 200;
        an = Math.random() * Math.PI * 2;
        y = Math.random() * 100;
        c = colRed;
        pData.push({ type: 1, rad: rad, an: an, speed: (Math.random() - 0.5) * 2 });
      }
      pPos[i*3] = Math.cos(an) * rad;
      pPos[i*3+1] = y;
      pPos[i*3+2] = Math.sin(an) * rad;
      pColor[i*3] = c.r; pColor[i*3+1] = c.g; pColor[i*3+2] = c.b;
    }
    pGeom.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
    pGeom.setAttribute('color', new THREE.BufferAttribute(pColor, 3));
    
    var pMat = new THREE.PointsMaterial({
      size: 1.5,
      vertexColors: true,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending
    });
    
    var particles = new THREE.Points(pGeom, pMat);
    group.add(particles);
    
    updatables.push(function(t, delta) {
      var positions = particles.geometry.attributes.position.array;
      for (var i = 0; i < pCount; i++) {
        var dat = pData[i];
        if (dat.type === 0) {
          dat.an += dat.speed * delta;
          positions[i*3] = Math.cos(dat.an) * dat.rad;
          positions[i*3+2] = Math.sin(dat.an) * dat.rad;
        } else {
          positions[i*3+1] += dat.speed * delta * 50;
          if (positions[i*3+1] > 150) positions[i*3+1] = 0;
          if (positions[i*3+1] < 0) positions[i*3+1] = 150;
        }
      }
      particles.geometry.attributes.position.needsUpdate = true;
    });

    group.userData.update = function(time, delta) {
      for (var i = 0; i < updatables.length; i++) {
        updatables[i](time, delta);
      }
    };

    return group;
  };
})();
