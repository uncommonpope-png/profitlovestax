(function() {
    'use strict';

    window.spawnGenesisCitadel = function(scene, opts) {
        const options = Object.assign({
            x: 0,
            y: 0,
            z: -2200,
            scale: 1
        }, opts);

        const group = new THREE.Group();
        group.position.set(options.x, options.y, options.z);
        group.scale.setScalar(options.scale);

        console.log(`[Genesis Citadel] City spawned at (${options.x}, ${options.y}, ${options.z})`);

        const updatables = [];

        // --- Materials ---
        const stoneMat = new THREE.MeshStandardMaterial({
            color: 0xaaa099,
            roughness: 0.8,
            metalness: 0.1,
            flatShading: true
        });
        const basaltMat = new THREE.MeshStandardMaterial({
            color: 0x444444,
            roughness: 0.9,
            metalness: 0.0,
            flatShading: true
        });
        const goldMat = new THREE.MeshStandardMaterial({
            color: 0xffcc44,
            roughness: 0.3,
            metalness: 0.9,
            flatShading: true
        });
        const energyMat = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.9
        });
        const fireMat = new THREE.MeshBasicMaterial({
            color: 0xff8844
        });
        const beamMat = new THREE.MeshBasicMaterial({
            color: 0xffcc44,
            transparent: true,
            opacity: 0.5,
            side: THREE.DoubleSide,
            blending: THREE.AdditiveBlending
        });

        // --- Geometries ---
        const boxGeo = new THREE.BoxGeometry(1, 1, 1);
        const cylGeo = new THREE.CylinderGeometry(1, 1, 1, 8);
        const coneGeo = new THREE.ConeGeometry(1, 1, 4);
        const torusGeo = new THREE.TorusGeometry(1, 0.2, 8, 16);
        const sphereGeo = new THREE.SphereGeometry(1, 16, 16);

        // --- Functions ---
        const addMesh = (geo, mat, parent, px, py, pz, sx, sy, sz, rx, ry, rz) => {
            const mesh = new THREE.Mesh(geo, mat);
            mesh.position.set(px || 0, py || 0, pz || 0);
            mesh.scale.set(sx || 1, sy || 1, sz || 1);
            if (rx) mesh.rotation.x = rx;
            if (ry) mesh.rotation.y = ry;
            if (rz) mesh.rotation.z = rz;
            parent.add(mesh);
            return mesh;
        };

        const randomRange = (min, max) => Math.random() * (max - min) + min;

        // --- Central Genesis Tower ---
        const towerGroup = new THREE.Group();        // --- Mega Genesis Spire (Height 120) ---
        // Base Tier Ziggurat
        addMesh(boxGeo, basaltMat, towerGroup, 0, 10, 0, 45, 20, 45);
        addMesh(boxGeo, goldMat, towerGroup, 0, 20.5, 0, 47, 1, 47);

        // Tier 2 Gothic Colonnade
        addMesh(cylGeo, stoneMat, towerGroup, 0, 35, 0, 32, 30, 32);
        for (let i = 0; i < 8; i++) {
          const a = (i / 8) * Math.PI * 2;
          addMesh(cylGeo, goldMat, towerGroup, Math.cos(a) * 17, 35, Math.sin(a) * 17, 2, 30, 2);
        }

        // Tier 3 Spire Octagon
        addMesh(cylGeo, basaltMat, towerGroup, 0, 65, 0, 20, 30, 20);

        // Tier 4 Needle Spire Cap
        addMesh(coneGeo, stoneMat, towerGroup, 0, 95, 0, 14, 40, 14, 0, Math.PI / 4, 0);

        // Flying Buttress Ribs (8-Way Radial)
        for (let i = 0; i < 8; i++) {
          const angle = (i / 8) * Math.PI * 2;
          const bGroup = new THREE.Group();
          bGroup.rotation.y = angle;
          addMesh(boxGeo, stoneMat, bGroup, 0, 40, 22, 2.5, 45, 12, -Math.PI / 5, 0, 0);
          addMesh(cylGeo, goldMat, bGroup, 0, 15, 28, 3, 25, 3);
          towerGroup.add(bGroup);
        }

        // Apex Singularity Core & Dual Orbiting Energy Toruses
        const apexGroup = new THREE.Group();
        apexGroup.position.set(0, 120, 0);
        const core = addMesh(sphereGeo, energyMat, apexGroup, 0, 0, 0, 6, 6, 6);

        const ring1 = addMesh(torusGeo, goldMat, apexGroup, 0, 0, 0, 9, 9, 9, Math.PI / 2, 0, 0);
        const ring2 = addMesh(torusGeo, goldMat, apexGroup, 0, 0, 0, 12, 12, 12, 0, Math.PI / 4, 0);

        updatables.push((time) => {
          ring1.rotation.y = time * 2.0;
          ring1.rotation.x = Math.PI / 2 + Math.sin(time) * 0.3;
          ring2.rotation.x = time * -1.8;
          ring2.rotation.y = time * 1.2;
          core.scale.setScalar(5 + Math.sin(time * 6) * 0.8);
        });

        towerGroup.add(apexGroup);
        group.add(towerGroup);

        // --- Royal Plaza (between tower and wall 1) ---
        // Obelisks
        for (let i = 0; i < 4; i++) {
            const angle = (i / 4) * Math.PI * 2 + Math.PI/4;
            const r = 25;
            const px = Math.cos(angle) * r;
            const pz = Math.sin(angle) * r;
            
            const obelisk = new THREE.Group();
            obelisk.position.set(px, 0, pz);
            
            addMesh(boxGeo, stoneMat, obelisk, 0, 2, 0, 6, 4, 6);
            addMesh(coneGeo, goldMat, obelisk, 0, 12, 0, 4, 20, 4);
            
            // Beam
            const beam = addMesh(cylGeo, beamMat, obelisk, 0, 40, 0, 1, 40, 1);
            updatables.push((time) => {
                beam.scale.x = 1 + Math.sin(time * 3 + i) * 0.3;
                beam.scale.z = beam.scale.x;
                beam.material.opacity = 0.4 + Math.sin(time * 4 + i) * 0.1;
            });
            
            group.add(obelisk);
        }

        // --- Walls and Districts ---
        const wallRadii = [40, 80, 120, 160];
        const wallHeights = [8, 6, 5, 4];
        
        for (let w = 0; w < 4; w++) {
            const radius = wallRadii[w];
            const wHeight = wallHeights[w] * 3; // scaled up a bit
            const segments = 16 + w * 8; // More segments for outer walls
            const segmentAngle = (Math.PI * 2) / segments;
            
            for (let s = 0; s < segments; s++) {
                const angle = s * segmentAngle;
                
                // Is this a gate?
                const isGate = (s % (segments / 8)) === 0;
                
                const wGroup = new THREE.Group();
                const px = Math.cos(angle) * radius;
                const pz = Math.sin(angle) * radius;
                
                wGroup.position.set(px, 0, pz);
                wGroup.rotation.y = -angle + Math.PI/2;
                
                if (isGate) {
                    // Grand Gate Arch
                    addMesh(boxGeo, basaltMat, wGroup, -4, wHeight/2, 0, 3, wHeight, 8);
                    addMesh(boxGeo, basaltMat, wGroup, 4, wHeight/2, 0, 3, wHeight, 8);
                    addMesh(boxGeo, goldMat, wGroup, 0, wHeight + 2, 0, 12, 4, 8); // Top bridge
                    
                    // Gate light
                    const gLight = addMesh(sphereGeo, energyMat, wGroup, 0, wHeight - 2, 0, 2, 2, 2);
                    updatables.push((time) => {
                        gLight.material.opacity = 0.5 + Math.sin(time * 2 + w + s) * 0.4;
                    });
                } else {
                    // Wall segment
                    const length = (2 * Math.PI * radius) / segments + 2; // slight overlap
                    addMesh(boxGeo, stoneMat, wGroup, 0, wHeight/2, 0, length, wHeight, 5);
                    
                    // Crenellations (battlements)
                    for (let c = -length/2 + 1; c < length/2; c += 3) {
                        addMesh(boxGeo, basaltMat, wGroup, c, wHeight + 1, 0, 1.5, 2, 5);
                    }
                    
                    // Torch fires at some battlements
                    if (Math.random() > 0.5) {
                        const tFire = addMesh(coneGeo, fireMat, wGroup, 0, wHeight + 3, 0, 1, 3, 1);
                        updatables.push((time) => {
                            tFire.scale.y = 3 + Math.sin(time * 15 + px) * 0.5;
                            tFire.scale.x = 1 + Math.cos(time * 10 + pz) * 0.2;
                            tFire.scale.z = tFire.scale.x;
                        });
                    }
                }
                group.add(wGroup);
            }
            
            // District (buildings between walls)
            if (w < 3) {
                const innerR = wallRadii[w] + 5;
                const outerR = wallRadii[w+1] - 5;
                const numBuildings = 40 + w * 20; // More buildings in outer rings
                
                for (let b = 0; b < numBuildings; b++) {
                    const bAngle = Math.random() * Math.PI * 2;
                    const bDist = randomRange(innerR, outerR);
                    const bx = Math.cos(bAngle) * bDist;
                    const bz = Math.sin(bAngle) * bDist;
                    
                    const buildType = Math.random();
                    const bGroup = new THREE.Group();
                    bGroup.position.set(bx, 0, bz);
                    bGroup.rotation.y = bAngle; // Face center
                    
                    if (buildType < 0.4) {
                        // Cathedral government (Gothic towers with flying buttresses + rose window)
                        const h = randomRange(15, 30);
                        addMesh(boxGeo, stoneMat, bGroup, 0, h/2, 0, 8, h, 8);
                        addMesh(coneGeo, basaltMat, bGroup, 0, h + 5, 0, 6, 10, 6, 0, Math.PI/4, 0); // spire
                        
                        // Rose window
                        addMesh(cylGeo, goldMat, bGroup, 0, h*0.7, 4, 3, 0.5, 3, Math.PI/2, 0, 0);
                        
                        // Mini buttress
                        addMesh(boxGeo, stoneMat, bGroup, -5, h*0.5, 0, 2, h*0.8, 2, 0, 0, -Math.PI/6);
                        addMesh(boxGeo, stoneMat, bGroup, 5, h*0.5, 0, 2, h*0.8, 2, 0, 0, Math.PI/6);
                    } else if (buildType < 0.8) {
                        // Residential towers (segmented cylinders with balcony torus rings)
                        const h = randomRange(20, 45);
                        const r = randomRange(3, 5);
                        addMesh(cylGeo, basaltMat, bGroup, 0, h/2, 0, r, h, r);
                        
                        // Balconies
                        const numBalconies = Math.floor(h / 5);
                        for(let i=1; i<=numBalconies; i++) {
                            addMesh(torusGeo, stoneMat, bGroup, 0, i * 5, 0, r+0.5, 0.5, 8, Math.PI/2, 0, 0);
                        }
                    } else {
                        // Military barracks (low wide boxes with turret cylinder corners)
                        const w = randomRange(10, 15);
                        const h = randomRange(8, 12);
                        const d = randomRange(8, 12);
                        addMesh(boxGeo, stoneMat, bGroup, 0, h/2, 0, w, h, d);
                        
                        // Turrets
                        addMesh(cylGeo, basaltMat, bGroup, -w/2, h/2, -d/2, 2, h+4, 2);
                        addMesh(cylGeo, basaltMat, bGroup, w/2, h/2, -d/2, 2, h+4, 2);
                        addMesh(cylGeo, basaltMat, bGroup, -w/2, h/2, d/2, 2, h+4, 2);
                        addMesh(cylGeo, basaltMat, bGroup, w/2, h/2, d/2, 2, h+4, 2);
                    }
                    group.add(bGroup);
                }
            }
        }

        // --- Particles ---
        // sovereign energy (gold, rising from tower), torch fire (orange, at wall tops), holy dust (white, in plazas), victory banners (colored streaks, at battlement peaks)
        const particleCount = 5000;
        const pGeo = new THREE.BufferGeometry();
        const pPos = new Float32Array(particleCount * 3);
        const pColors = new Float32Array(particleCount * 3);
        const pData = []; // Store types and initial data for animation

        const colorGold = new THREE.Color(0xffcc44);
        const colorFire = new THREE.Color(0xff8844);
        const colorDust = new THREE.Color(0xffffff);
        const colorBanner = new THREE.Color(0xaa2222);

        for (let i = 0; i < particleCount; i++) {
            let type = Math.random();
            let x, y, z, c;
            
            if (type < 0.2) {
                // Sovereign energy (rising from center tower)
                const a = Math.random() * Math.PI * 2;
                const r = Math.random() * 20;
                x = Math.cos(a) * r;
                z = Math.sin(a) * r;
                y = randomRange(50, 150);
                c = colorGold;
                pData.push({ type: 0, speedY: randomRange(5, 15), angle: a, r: r, baseY: 50 });
            } else if (type < 0.5) {
                // Torch fire (at wall tops)
                const wallIdx = Math.floor(Math.random() * 4);
                const r = wallRadii[wallIdx] + randomRange(-1, 1);
                const a = Math.random() * Math.PI * 2;
                x = Math.cos(a) * r;
                z = Math.sin(a) * r;
                y = wallHeights[wallIdx] * 3 + randomRange(2, 6);
                c = colorFire;
                pData.push({ type: 1, baseY: y, phase: Math.random() * 10 });
            } else if (type < 0.8) {
                // Holy dust (plazas / inner area)
                const a = Math.random() * Math.PI * 2;
                const r = Math.random() * 160;
                x = Math.cos(a) * r;
                z = Math.sin(a) * r;
                y = randomRange(0.5, 20);
                c = colorDust;
                pData.push({ type: 2, baseY: y, phase: Math.random() * 100 });
            } else {
                // Victory banners (streaks at battlement peaks)
                const wallIdx = Math.floor(Math.random() * 4);
                const r = wallRadii[wallIdx] + randomRange(-2, 2);
                const a = Math.random() * Math.PI * 2;
                x = Math.cos(a) * r;
                z = Math.sin(a) * r;
                y = wallHeights[wallIdx] * 3 + randomRange(5, 15);
                c = (Math.random() > 0.5) ? colorBanner : colorGold;
                pData.push({ type: 3, baseX: x, baseZ: z, phase: Math.random() * 10 });
            }

            pPos[i*3] = x;
            pPos[i*3+1] = y;
            pPos[i*3+2] = z;
            
            pColors[i*3] = c.r;
            pColors[i*3+1] = c.g;
            pColors[i*3+2] = c.b;
        }

        pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
        pGeo.setAttribute('color', new THREE.BufferAttribute(pColors, 3));
        
        const pMat = new THREE.PointsMaterial({
            size: 1.0,
            vertexColors: true,
            transparent: true,
            opacity: 0.8,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });
        
        const particleSystem = new THREE.Points(pGeo, pMat);
        group.add(particleSystem);
        
        updatables.push((time, delta) => {
            const positions = particleSystem.geometry.attributes.position.array;
            
            for (let i = 0; i < particleCount; i++) {
                const data = pData[i];
                const idx = i * 3;
                
                if (data.type === 0) {
                    // Energy rising
                    positions[idx+1] += data.speedY * delta;
                    // slight swirl
                    data.angle += delta * 0.5;
                    positions[idx] = Math.cos(data.angle) * data.r;
                    positions[idx+2] = Math.sin(data.angle) * data.r;
                    
                    if (positions[idx+1] > 150) {
                        positions[idx+1] = data.baseY;
                    }
                } else if (data.type === 1) {
                    // Fire flicker
                    positions[idx+1] = data.baseY + Math.sin(time * 15 + data.phase) * 1.5;
                } else if (data.type === 2) {
                    // Dust drift
                    positions[idx+1] = data.baseY + Math.sin(time * 2 + data.phase) * 2;
                    positions[idx] += Math.sin(time + data.phase) * delta;
                    positions[idx+2] += Math.cos(time + data.phase) * delta;
                } else if (data.type === 3) {
                    // Banners waving
                    positions[idx] = data.baseX + Math.sin(time * 5 + data.phase) * 2;
                    positions[idx+2] = data.baseZ + Math.cos(time * 4 + data.phase) * 2;
                }
            }
            particleSystem.geometry.attributes.position.needsUpdate = true;
        });

        // --- UserData Update ---
        group.userData.update = function(time, delta) {
            for (const fn of updatables) {
                fn(time, delta);
            }
        };

        // Register as a Destructible Base in the RTS Engine
        if (window.RTSEngineCore) {
            window.RTSEngineCore.registerEntity(group, 'building', 'imperium', 5000, 45);
        }

        return group;
    };
})();
