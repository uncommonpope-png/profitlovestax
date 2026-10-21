(function() {
    'use strict';
    window.spawnRiftWarzone = function(scene, opts) {
        opts = opts || {};
        var offsetX = opts.offsetX || 800;
        var offsetZ = opts.offsetZ || 1000;
        console.log('[RiftWarzone] City spawned at (' + offsetX + ', 0, ' + offsetZ + ')');

        var group = new THREE.Group();
        group.position.set(offsetX, 0, offsetZ);
        scene.add(group);

        var updatables = [];

        var materials = {
            green: (window.__genesisStd || function(c){ return new THREE.MeshStandardMaterial(c); })({ color: 0x445544, roughness: 0.9, metalness: 0.1 }),
            armor: (window.__genesisStd || function(c){ return new THREE.MeshStandardMaterial(c); })({ color: 0x667766, roughness: 0.8, metalness: 0.3 }),
            steel: (window.__genesisStd || function(c){ return new THREE.MeshStandardMaterial(c); })({ color: 0x778899, roughness: 0.5, metalness: 0.7 }),
            flesh: (window.__genesisStd || function(c){ return new THREE.MeshStandardMaterial(c); })({ color: 0x553344, roughness: 0.9, metalness: 0.0 }),
            energy: new THREE.MeshBasicMaterial({ color: 0x4488ff })
        };

        // Terrain and Craters
        var terrainGeo = new THREE.PlaneGeometry(800, 800, 32, 32);
        terrainGeo.rotateX(-Math.PI / 2);
        var posAttr = terrainGeo.attributes.position;
        for (var i = 0; i < posAttr.count; i++) {
            var vx = posAttr.getX(i);
            var vz = posAttr.getZ(i);
            posAttr.setY(i, (Math.random() - 0.5) * 2);
        }
        terrainGeo.computeVertexNormals();
        var terrain = new THREE.Mesh(terrainGeo, materials.green);
        group.add(terrain);

        // 15 craters
        for(var c=0; c<15; c++) {
            var cx = (Math.random()-0.5) * 600;
            var cz = (Math.random()-0.5) * 600;
            var r = 10 + Math.random()*20;
            var craterGeo = new THREE.ConeGeometry(r, r/2, 16);
            craterGeo.rotateX(Math.PI); // inverted
            var crater = new THREE.Mesh(craterGeo, materials.green);
            crater.position.set(cx, -r/4, cz);
            group.add(crater);
        }

        // 180 Structures: Bunkers, Watchtowers, Artillery, Barricades, Tank Traps
        for(var s=0; s<180; s++) {
            var sx = (Math.random()-0.5) * 700;
            var sz = (Math.random()-0.5) * 700;
            var type = Math.floor(Math.random() * 5);
            var bGroup = new THREE.Group();
            bGroup.position.set(sx, 0, sz);
            
            if(type === 0) { // Bunker (low wide box, half buried)
                var bunkerMesh = new THREE.Mesh(new THREE.BoxGeometry(15, 8, 15), materials.armor);
                bunkerMesh.position.y = 4;
                bGroup.add(bunkerMesh);
                var slit = new THREE.Mesh(new THREE.BoxGeometry(10, 1, 16), new THREE.MeshBasicMaterial({color: 0x000000}));
                slit.position.y = 5;
                bGroup.add(slit);
            } else if(type === 1) { // Watchtower
                var towerBase = new THREE.Mesh(new THREE.CylinderGeometry(2, 3, 20, 8), materials.steel);
                towerBase.position.y = 10;
                bGroup.add(towerBase);
                var towerTop = new THREE.Mesh(new THREE.BoxGeometry(6, 4, 6), materials.armor);
                towerTop.position.y = 22;
                bGroup.add(towerTop);
                // Searchlight
                var light = new THREE.PointLight(0xffffcc, 1, 100);
                light.position.y = 24;
                bGroup.add(light);
                var pivot = new THREE.Group();
                pivot.position.y = 24;
                var beam = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 4, 40, 16, 1, true), new THREE.MeshBasicMaterial({color:0xffffcc, transparent:true, opacity:0.2}));
                beam.position.z = 20;
                beam.rotation.x = Math.PI/2;
                pivot.add(beam);
                bGroup.add(pivot);
                updatables.push({
                    update: function(t, dt, p) { p.rotation.y = Math.sin(t * 0.5 + p.userData.offset) * Math.PI/2; },
                    obj: pivot
                });
                pivot.userData.offset = Math.random() * 10;
            } else if(type === 2) { // Artillery
                var artBase = new THREE.Mesh(new THREE.BoxGeometry(10, 6, 10), materials.armor);
                artBase.position.y = 3;
                bGroup.add(artBase);
                var barrel = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 15), materials.steel);
                barrel.rotation.x = Math.PI/2;
                barrel.position.set(0, 8, 5);
                bGroup.add(barrel);
            } else if(type === 3) { // Barricade
                var wall = new THREE.Mesh(new THREE.BoxGeometry(30, 8, 4), materials.armor);
                wall.position.y = 4;
                wall.rotation.y = Math.random() * Math.PI;
                bGroup.add(wall);
            } else if(type === 4) { // Tank Trap
                var trapGeo = new THREE.CylinderGeometry(0.5, 0.5, 10, 4);
                var trap1 = new THREE.Mesh(trapGeo, materials.steel);
                var trap2 = new THREE.Mesh(trapGeo, materials.steel);
                var trap3 = new THREE.Mesh(trapGeo, materials.steel);
                trap1.rotation.set(Math.PI/4, 0, 0);
                trap2.rotation.set(0, Math.PI/4, 0);
                trap3.rotation.set(Math.PI/4, 0, Math.PI/2);
                trap1.position.y = trap2.position.y = trap3.position.y = 3;
                bGroup.add(trap1, trap2, trap3);
            }
            group.add(bGroup);
        }

        // 6 Heavy Mech Walkers
        var mechs = [];
        for(var m=0; m<6; m++) {
            var mechGroup = new THREE.Group();
            mechGroup.position.set((Math.random()-0.5)*500, 0, (Math.random()-0.5)*500);
            // Body
            var mBody = new THREE.Mesh(new THREE.BoxGeometry(8, 6, 10), materials.steel);
            mBody.position.y = 9;
            mechGroup.add(mBody);
            // Legs
            var mLegL = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 8), materials.steel);
            mLegL.position.set(-3, 4, 0);
            mechGroup.add(mLegL);
            var mLegR = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 8), materials.steel);
            mLegR.position.set(3, 4, 0);
            mechGroup.add(mLegR);
            // Arms
            var mArmL = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.5, 12), materials.armor);
            mArmL.rotation.x = Math.PI/2;
            mArmL.position.set(-5, 9, 3);
            mechGroup.add(mArmL);
            var mArmR = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.5, 12), materials.armor);
            mArmR.rotation.x = Math.PI/2;
            mArmR.position.set(5, 9, 3);
            mechGroup.add(mArmR);
            group.add(mechGroup);
            mechs.push(mechGroup);
            
            mechGroup.userData = {
                phase: Math.random() * Math.PI * 2,
                baseX: mechGroup.position.x,
                baseZ: mechGroup.position.z,
                legL: mLegL,
                legR: mLegR,
                body: mBody
            };
            
            updatables.push({
                update: function(t, dt, obj) {
                    obj.position.x = obj.userData.baseX + Math.sin(t * 0.5 + obj.userData.phase) * 30;
                    obj.position.z = obj.userData.baseZ + Math.cos(t * 0.5 + obj.userData.phase) * 30;
                    obj.rotation.y = t * 0.5 + obj.userData.phase;
                    obj.userData.legL.rotation.x = Math.sin(t * 4) * 0.5;
                    obj.userData.legR.rotation.x = Math.sin(t * 4 + Math.PI) * 0.5;
                    obj.userData.body.position.y = 9 + Math.abs(Math.sin(t * 4)) * 0.5;
                },
                obj: mechGroup
            });
        }

        // 3 Void Behemoths
        var behemoths = [];
        for(var b=0; b<3; b++) {
            var vGroup = new THREE.Group();
            vGroup.position.set((Math.random()-0.5)*500, 0, (Math.random()-0.5)*500);
            var vBody = new THREE.Mesh(new THREE.SphereGeometry(10, 16, 16), materials.flesh);
            vBody.position.y = 15;
            vGroup.add(vBody);
            // Tentacles
            var tentacles = [];
            for(var t=0; t<6; t++) {
                var ten = new THREE.Mesh(new THREE.CylinderGeometry(2, 0.5, 20), materials.flesh);
                ten.position.set(Math.cos(t*Math.PI/3)*10, 5, Math.sin(t*Math.PI/3)*10);
                vGroup.add(ten);
                tentacles.push({mesh: ten, phase: t});
            }
            group.add(vGroup);
            behemoths.push(vGroup);
            vGroup.userData = { tentacles: tentacles, phase: Math.random()*10, bx: vGroup.position.x, bz: vGroup.position.z };
            
            updatables.push({
                update: function(time, dt, obj) {
                    obj.position.x = obj.userData.bx + Math.sin(time*0.2 + obj.userData.phase) * 50;
                    obj.position.z = obj.userData.bz + Math.cos(time*0.2 + obj.userData.phase) * 50;
                    obj.children[0].position.y = 15 + Math.sin(time) * 2;
                    obj.userData.tentacles.forEach(function(tenInfo) {
                        tenInfo.mesh.rotation.x = Math.sin(time * 2 + tenInfo.phase) * 0.5;
                        tenInfo.mesh.rotation.z = Math.cos(time * 2 + tenInfo.phase) * 0.5;
                    });
                },
                obj: vGroup
            });
        }

        // Particles: 4000
        var particleGeo = new THREE.BufferGeometry();
        var partCount = 4000;
        var pPos = new Float32Array(partCount * 3);
        var pVel = [];
        var pColors = new Float32Array(partCount * 3);
        var cSmoke = new THREE.Color(0x333333);
        var cTracer = new THREE.Color(0xffff00);
        var cDirt = new THREE.Color(0x664422);
        var cEnergy = new THREE.Color(0x4488ff);
        
        for(var p=0; p<partCount; p++) {
            var px = (Math.random()-0.5)*700;
            var py = Math.random()*100;
            var pz = (Math.random()-0.5)*700;
            pPos[p*3] = px; pPos[p*3+1] = py; pPos[p*3+2] = pz;
            
            var type = Math.floor(Math.random()*4);
            var col, vx=0, vy=0, vz=0;
            if(type === 0) { col = cSmoke; vy = 2 + Math.random()*2; vx=(Math.random()-0.5); vz=(Math.random()-0.5); } // Smoke
            else if(type === 1) { col = cTracer; vx = (Math.random()-0.5)*50; vy = (Math.random()-0.5)*10; vz = (Math.random()-0.5)*50; } // Tracer
            else if(type === 2) { col = cDirt; vy = -2 - Math.random()*5; } // Dirt
            else { col = cEnergy; vx = (Math.random()-0.5)*10; vy = (Math.random()-0.5)*10; vz = (Math.random()-0.5)*10; } // Energy
            
            pColors[p*3] = col.r; pColors[p*3+1] = col.g; pColors[p*3+2] = col.b;
            pVel.push({x:vx, y:vy, z:vz, type:type});
        }
        particleGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
        particleGeo.setAttribute('color', new THREE.BufferAttribute(pColors, 3));
        
        var pMat = new THREE.PointsMaterial({ size: 2, vertexColors: true, transparent: true, opacity: 0.8 });
        var particles = new THREE.Points(particleGeo, pMat);
        group.add(particles);

        updatables.push({
            update: function(t, dt) {
                var pos = particles.geometry.attributes.position.array;
                for(var i=0; i<partCount; i++) {
                    pos[i*3] += pVel[i].x * dt * 10;
                    pos[i*3+1] += pVel[i].y * dt * 10;
                    pos[i*3+2] += pVel[i].z * dt * 10;
                    
                    if(pVel[i].type === 0 && pos[i*3+1] > 150) { pos[i*3+1] = 0; }
                    if(pVel[i].type === 1 && (Math.abs(pos[i*3])>350 || Math.abs(pos[i*3+2])>350)) {
                        pos[i*3] = (Math.random()-0.5)*600; pos[i*3+1] = 5 + Math.random()*20; pos[i*3+2] = (Math.random()-0.5)*600;
                    }
                    if(pVel[i].type === 2 && pos[i*3+1] < 0) { pos[i*3+1] = 100; }
                    if(pVel[i].type === 3 && (Math.abs(pos[i*3])>350 || Math.abs(pos[i*3+2])>350)) {
                        pos[i*3] = (Math.random()-0.5)*600; pos[i*3+1] = 10 + Math.random()*30; pos[i*3+2] = (Math.random()-0.5)*600;
                    }
                }
                particles.geometry.attributes.position.needsUpdate = true;
            }
        });

        group.userData.update = function(time, delta) {
            for(var i=0; i<updatables.length; i++) {
                updatables[i].update(time, delta, updatables[i].obj);
            }
        };

        return group;
    };
})();
