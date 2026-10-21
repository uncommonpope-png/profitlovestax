(function() {
  'use strict';

  window.spawnAbyssalTrench = function(scene, opts) {
    var options = opts || {};
    var offsetX = options.x !== undefined ? options.x : 0;
    var offsetZ = options.z !== undefined ? options.z : -1800;

    var cityGroup = new THREE.Group();
    cityGroup.position.set(offsetX, 0, offsetZ);

    // Materials
    var basaltMat = new THREE.MeshStandardMaterial({ color: 0x222233, roughness: 0.8, metalness: 0.2 });
    var bioGreenMat = new THREE.MeshBasicMaterial({ color: 0x00ff66 });
    var boneMat = new THREE.MeshStandardMaterial({ color: 0xccbbaa, roughness: 0.6, metalness: 0.1 });
    var voidMat = new THREE.MeshStandardMaterial({ color: 0x0a0a1a, roughness: 0.9, metalness: 0.0 });
    var deepGreenMat = new THREE.MeshStandardMaterial({ color: 0x004422, roughness: 0.7, metalness: 0.2 });

    // Trench Floor
    var floorGeo = new THREE.PlaneGeometry(600, 600);
    var floor = new THREE.Mesh(floorGeo, voidMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -40;
    cityGroup.add(floor);

    var animatedElements = [];
    var boneArches = [];

    // Central Leviathan Skeleton
    var skeletonGroup = new THREE.Group();
    skeletonGroup.position.y = -40;
    
    var torusGeo = new THREE.TorusGeometry(60, 4, 16, 32, Math.PI);
    for (var i = 0; i < 7; i++) {
        var rib = new THREE.Mesh(torusGeo, boneMat);
        rib.position.z = -120 + i * 40;
        rib.rotation.x = -Math.PI/2;
        rib.rotation.y = (Math.random() - 0.5) * 0.2;
        rib.scale.set(1 - Math.abs(3-i)*0.1, 1, 1 + Math.abs(3-i)*0.1);
        skeletonGroup.add(rib);
        boneArches.push({ mesh: rib, baseRotY: rib.rotation.y, phase: Math.random() * Math.PI * 2 });
    }
    cityGroup.add(skeletonGroup);

    // Coral Trees
    var createCoralTree = function() {
        var treeGroup = new THREE.Group();
        var stemMat = deepGreenMat;
        
        var baseGeo = new THREE.CylinderGeometry(2, 4, 15, 8);
        var base = new THREE.Mesh(baseGeo, stemMat);
        base.position.y = 7.5;
        treeGroup.add(base);

        for (var i = 0; i < 5; i++) {
            var branchGroup = new THREE.Group();
            branchGroup.position.y = 12 + Math.random() * 5;
            
            var branchGeo = new THREE.CylinderGeometry(0.5, 1.5, 10, 8);
            var branch = new THREE.Mesh(branchGeo, stemMat);
            branch.position.y = 5;
            branch.rotation.z = (Math.random() * 0.5 + 0.3) * (Math.random() > 0.5 ? 1 : -1);
            branch.rotation.x = (Math.random() * 0.5 + 0.3) * (Math.random() > 0.5 ? 1 : -1);
            
            var tipGeo = new THREE.SphereGeometry(2, 16, 16);
            var tip = new THREE.Mesh(tipGeo, bioGreenMat);
            tip.position.y = 10;
            branch.add(tip);
            
            branchGroup.add(branch);
            branchGroup.rotation.y = Math.random() * Math.PI * 2;
            treeGroup.add(branchGroup);
            
            animatedElements.push({ mesh: tip, type: 'coral', phase: Math.random() * Math.PI * 2, baseScale: 1 });
        }
        return treeGroup;
    };

    for (var i = 0; i < 8; i++) {
        var coralTree = createCoralTree();
        var angle = (i / 8) * Math.PI * 2;
        var rad = 30 + Math.random() * 80;
        coralTree.position.set(Math.cos(angle) * rad, -40, Math.sin(angle) * rad);
        cityGroup.add(coralTree);
    }

    // 170 Buildings - Terraced
    var hemiGeo = new THREE.SphereGeometry(6, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2);

    for (var i = 0; i < 170; i++) {
        var bldgGroup = new THREE.Group();
        
        // Determine tier (0 to 5)
        var tier = Math.floor(Math.random() * 6);
        // Map tier to distance from center. Center is a ravine, so higher tiers are further out.
        // tier 0 is deep (-35 Y), tier 5 is high (0 Y)
        var yLevel = -35 + tier * 7;
        
        var side = Math.random() > 0.5 ? 1 : -1;
        var zPos = (Math.random() - 0.5) * 400; // spread along Z axis
        // distance from center line (X axis) depends on tier
        var minX = 20 + tier * 25;
        var maxX = minX + 25;
        var xPos = side * (minX + Math.random() * (maxX - minX));

        bldgGroup.position.set(xPos, yLevel, zPos);

        var bType = Math.random();
        if (bType < 0.4) {
            // Basalt Column
            var height = 15 + Math.random() * 30;
            var colGeo = new THREE.CylinderGeometry(4, 5, height, 6);
            var col = new THREE.Mesh(colGeo, basaltMat);
            col.position.y = height / 2;
            bldgGroup.add(col);
            
            // Greeble
            if (Math.random() > 0.5) {
                var ringGeo = new THREE.TorusGeometry(5.5, 0.5, 8, 16);
                var ring = new THREE.Mesh(ringGeo, boneMat);
                ring.position.y = height * (0.5 + Math.random()*0.4);
                ring.rotation.x = Math.PI / 2;
                bldgGroup.add(ring);
            }
        } else if (bType < 0.7) {
            // Pressure Dome
            var baseHeight = 10 + Math.random() * 10;
            var base = new THREE.Mesh(new THREE.CylinderGeometry(6, 6, baseHeight, 16), basaltMat);
            base.position.y = baseHeight / 2;
            bldgGroup.add(base);
            
            var dome = new THREE.Mesh(hemiGeo, deepGreenMat);
            dome.position.y = baseHeight;
            bldgGroup.add(dome);
            
            var glowBox = new THREE.Mesh(new THREE.BoxGeometry(2, 2, 2), bioGreenMat);
            glowBox.position.y = baseHeight + 5;
            bldgGroup.add(glowBox);
            animatedElements.push({ mesh: glowBox, type: 'coral', phase: Math.random() * Math.PI * 2, baseScale: 1 });
            
        } else if (bType < 0.9) {
            // Coral Structure Building
            var stem = new THREE.Mesh(new THREE.CylinderGeometry(3, 4, 25, 8), deepGreenMat);
            stem.position.y = 12.5;
            bldgGroup.add(stem);
            
            for (var j=0; j<3; j++) {
                var pod = new THREE.Mesh(new THREE.SphereGeometry(3.5, 16, 16), basaltMat);
                pod.position.set((Math.random()-0.5)*8, 10 + Math.random()*12, (Math.random()-0.5)*8);
                bldgGroup.add(pod);
                
                if (Math.random() > 0.5) {
                    var glow = new THREE.Mesh(new THREE.SphereGeometry(1.5, 8, 8), bioGreenMat);
                    glow.position.copy(pod.position);
                    glow.position.x += (Math.random()>0.5?1:-1) * 3;
                    bldgGroup.add(glow);
                    animatedElements.push({ mesh: glow, type: 'coral', phase: Math.random() * Math.PI * 2, baseScale: 1 });
                }
            }
        } else {
            // Bone Arch Structure
            var bArchGeo = new THREE.TorusGeometry(15, 2, 8, 16, Math.PI);
            var bArch = new THREE.Mesh(bArchGeo, boneMat);
            bArch.position.y = 5;
            bArch.rotation.z = Math.random() * Math.PI;
            bldgGroup.add(bArch);
            
            var pillar = new THREE.Mesh(new THREE.CylinderGeometry(2, 2, 20, 8), basaltMat);
            pillar.position.y = 10;
            bldgGroup.add(pillar);
        }

        cityGroup.add(bldgGroup);
    }

    // Particles
    var particleCount = 3500;
    var particlesGeo = new THREE.BufferGeometry();
    var posArray = new Float32Array(particleCount * 3);
    var pTypes = new Float32Array(particleCount);
    
    for (var i = 0; i < particleCount; i++) {
        posArray[i * 3] = (Math.random() - 0.5) * 400; // x
        posArray[i * 3 + 1] = -40 + Math.random() * 80; // y
        posArray[i * 3 + 2] = (Math.random() - 0.5) * 500; // z
        
        var rand = Math.random();
        if (rand < 0.4) {
            pTypes[i] = 0; // Spores
        } else if (rand < 0.8) {
            pTypes[i] = 1; // Sediment
        } else {
            pTypes[i] = 2; // Bubbles
        }
    }
    particlesGeo.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
    particlesGeo.setAttribute('pType', new THREE.BufferAttribute(pTypes, 1));
    
    var colArray = new Float32Array(particleCount * 3);
    for (var i = 0; i < particleCount; i++) {
        var t = pTypes[i];
        if (t === 0) { // Green
            colArray[i*3] = 0.0; colArray[i*3+1] = 1.0; colArray[i*3+2] = 0.4;
        } else if (t === 1) { // Purple
            colArray[i*3] = 0.4; colArray[i*3+1] = 0.0; colArray[i*3+2] = 0.6;
        } else { // White
            colArray[i*3] = 0.8; colArray[i*3+1] = 0.8; colArray[i*3+2] = 0.8;
        }
    }
    particlesGeo.setAttribute('color', new THREE.BufferAttribute(colArray, 3));
    
    var particleMat = new THREE.PointsMaterial({
        size: 1.5,
        transparent: true,
        opacity: 0.8,
        vertexColors: true
    });
    
    var particleSystem = new THREE.Points(particlesGeo, particleMat);
    cityGroup.add(particleSystem);

    cityGroup.userData.update = function(time, delta) {
        var positions = particleSystem.geometry.attributes.position.array;
        var types = particleSystem.geometry.attributes.pType.array;
        
        for (var i = 0; i < particleCount; i++) {
            var t = types[i];
            if (t === 0) { // Spores rising
                positions[i*3+1] += delta * 2;
                positions[i*3] += Math.sin(time + i) * delta;
            } else if (t === 1) { // Sediment falling
                positions[i*3+1] -= delta * 3;
                positions[i*3+2] += Math.cos(time + i) * delta;
            } else { // Bubbles rising faster
                positions[i*3+1] += delta * 8;
                positions[i*3] += Math.sin(time*2 + i) * delta * 2;
            }
            
            if (positions[i*3+1] > 40) positions[i*3+1] = -40;
            if (positions[i*3+1] < -40) positions[i*3+1] = 40;
        }
        particleSystem.geometry.attributes.position.needsUpdate = true;
        
        for (var i = 0; i < animatedElements.length; i++) {
            var el = animatedElements[i];
            if (el.type === 'coral') {
                var scale = el.baseScale + Math.sin(time * 2 + el.phase) * 0.2;
                el.mesh.scale.set(scale, scale, scale);
            }
        }
        
        for (var i = 0; i < boneArches.length; i++) {
            var arch = boneArches[i];
            arch.mesh.rotation.y = arch.baseRotY + Math.sin(time * 0.5 + arch.phase) * 0.05;
        }
    };

    scene.add(cityGroup);
    console.log('[AbyssalTrench] City spawned at (' + offsetX + ', 0, ' + offsetZ + ')');
    return cityGroup;
  };
})();
