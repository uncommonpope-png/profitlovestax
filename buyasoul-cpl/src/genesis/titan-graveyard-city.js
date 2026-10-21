(function() {
    'use strict';

    window.spawnTitanGraveyard = function(scene, opts) {
        opts = opts || {};
        const offsetX = opts.offsetX !== undefined ? opts.offsetX : 1800;
        const offsetZ = opts.offsetZ !== undefined ? opts.offsetZ : 600;

        const cityGroup = new THREE.Group();
        cityGroup.position.set(offsetX, 0, offsetZ);

        // Palettes and Materials
        const colorHull = 0x555544;
        const colorRust = 0x884422;
        const colorSalvage = 0x777766;
        const colorCoolant = 0x44ff44;
        const colorSparks = 0xff8800;

        const matHull = new THREE.MeshStandardMaterial({ color: colorHull, roughness: 0.8, metalness: 0.5 });
        const matRust = new THREE.MeshStandardMaterial({ color: colorRust, roughness: 0.9, metalness: 0.3 });
        const matSalvage = new THREE.MeshStandardMaterial({ color: colorSalvage, roughness: 0.7, metalness: 0.6 });
        const matCoolant = new THREE.MeshBasicMaterial({ color: colorCoolant });
        const matSpark = new THREE.MeshBasicMaterial({ color: colorSparks });

        const updatableElements = [];

        // Generates voronoi-like clusters
        const numClusters = 12;
        const clusters = [];
        for (let i = 0; i < numClusters; i++) {
            clusters.push({
                x: (Math.random() - 0.5) * 600,
                z: (Math.random() - 0.5) * 600,
                radius: 40 + Math.random() * 60
            });
        }

        const boxGeo = new THREE.BoxGeometry(1, 1, 1);
        const cylGeo = new THREE.CylinderGeometry(1, 1, 1, 16);

        // 3 Massive Titan Hulls
        const numHulls = 3;
        const hulls = [];
        for (let i = 0; i < numHulls; i++) {
            const hullGroup = new THREE.Group();
            const hx = (Math.random() - 0.5) * 400;
            const hz = (Math.random() - 0.5) * 400;
            hullGroup.position.set(hx, 0, hz);
            hulls.push({x: hx, z: hz});

            const hullW = 80 + Math.random() * 20;
            const hullH = 20 + Math.random() * 10;
            const hullD = 30 + Math.random() * 10;
            
            const mainHull = new THREE.Mesh(boxGeo, matHull);
            mainHull.scale.set(hullW, hullH, hullD);
            mainHull.position.y = hullH / 2;
            
            // Tilt the hull to make it look derelict
            hullGroup.rotation.x = (Math.random() * 0.5 - 0.25) * Math.PI;
            hullGroup.rotation.z = (Math.random() * 0.5 - 0.25) * Math.PI;
            hullGroup.rotation.y = Math.random() * Math.PI * 2;
            
            // Exposed internal decks
            const deckW = hullW * 0.8;
            const deckH = hullH * 0.8;
            const deckD = hullD * 0.8;
            const decks = new THREE.Mesh(boxGeo, matRust);
            decks.scale.set(deckW, deckH, deckD);
            decks.position.set(hullW*0.1, hullH/2 + 2, 0); // slightly offset
            
            hullGroup.add(mainHull);
            hullGroup.add(decks);
            
            // Salvage crane on the largest hull
            if (i === 0) {
                const craneGroup = new THREE.Group();
                craneGroup.position.set(0, hullH, 0);
                
                const craneBase = new THREE.Mesh(boxGeo, matSalvage);
                craneBase.scale.set(5, 10, 5);
                craneBase.position.y = 5;
                
                const craneArm = new THREE.Mesh(boxGeo, matRust);
                craneArm.scale.set(30, 2, 2);
                craneArm.position.set(15, 10, 0);
                
                craneGroup.add(craneBase);
                craneGroup.add(craneArm);
                
                updatableElements.push((t) => {
                    craneGroup.rotation.y = Math.sin(t * 0.5) * 1.5;
                });
                
                hullGroup.add(craneGroup);
            }
            
            cityGroup.add(hullGroup);
        }

        // Generate Wreckage Clusters and Salvage Camps
        const numStructures = 197; // +3 hulls = 200 total
        for (let i = 0; i < numStructures; i++) {
            let x, z;
            // Voronoi organic placement: pick a cluster, then place near it
            const cluster = clusters[Math.floor(Math.random() * clusters.length)];
            const r = Math.random() * cluster.radius;
            const theta = Math.random() * Math.PI * 2;
            x = cluster.x + Math.cos(theta) * r;
            z = cluster.z + Math.sin(theta) * r;

            const bType = Math.random();
            const bGroup = new THREE.Group();
            bGroup.position.set(x, 0, z);

            if (bType < 0.4) {
                // Hull segments
                const segW = 10 + Math.random() * 20;
                const segH = 5 + Math.random() * 10;
                const segD = 10 + Math.random() * 20;
                const segMesh = new THREE.Mesh(boxGeo, matHull);
                segMesh.scale.set(segW, segH, segD);
                bGroup.rotation.x = (Math.random() - 0.5) * Math.PI * 0.5;
                bGroup.rotation.y = Math.random() * Math.PI * 2;
                bGroup.rotation.z = (Math.random() - 0.5) * Math.PI * 0.5;
                // Half-buried
                bGroup.position.y = -segH * 0.2;
                bGroup.add(segMesh);
                
                // Sometimes add tumbling debris near hull segments
                if (Math.random() > 0.8) {
                    const debris = new THREE.Mesh(boxGeo, matRust);
                    debris.scale.set(2, 2, 2);
                    debris.position.set(Math.random()*10 - 5, segH + 5, Math.random()*10 - 5);
                    bGroup.add(debris);
                    updatableElements.push((t) => {
                        debris.rotation.x += 0.01;
                        debris.rotation.y += 0.02;
                    });
                }
            } else if (bType < 0.6) {
                // Engine nacelles
                const nacL = 15 + Math.random() * 15;
                const nacR = 5 + Math.random() * 5;
                const nacMesh = new THREE.Mesh(cylGeo, matRust);
                nacMesh.scale.set(nacR, nacL, nacR);
                // On their side
                bGroup.rotation.z = Math.PI / 2;
                bGroup.rotation.y = Math.random() * Math.PI * 2;
                bGroup.position.y = nacR * 0.8; 
                bGroup.add(nacMesh);
            } else if (bType < 0.9) {
                // Salvage shanties
                const shanW = 3 + Math.random() * 6;
                const shanH = 3 + Math.random() * 4;
                const shanD = 3 + Math.random() * 6;
                const shanty = new THREE.Mesh(boxGeo, matSalvage);
                shanty.scale.set(shanW, shanH, shanD);
                shanty.position.y = shanH / 2;
                bGroup.add(shanty);
                
                // Corrugated roof
                const roof = new THREE.Mesh(boxGeo, matRust);
                roof.scale.set(shanW * 1.2, 0.5, shanD * 1.2);
                roof.position.y = shanH + 0.25;
                roof.rotation.z = 0.1; // angled roof
                bGroup.add(roof);
            } else {
                // Debris piles
                const pileW = 5 + Math.random() * 10;
                const pileD = 5 + Math.random() * 10;
                for (let d = 0; d < 5; d++) {
                    const p = new THREE.Mesh(boxGeo, matRust);
                    const s = 1 + Math.random() * 3;
                    p.scale.set(s, s, s);
                    p.position.set((Math.random()-0.5)*pileW, s/2 + Math.random(), (Math.random()-0.5)*pileD);
                    p.rotation.set(Math.random()*Math.PI, Math.random()*Math.PI, Math.random()*Math.PI);
                    bGroup.add(p);
                }
            }

            cityGroup.add(bGroup);
        }

        // Particles System
        const numSparks = 800;
        const numDust = 1500;
        const numAsh = 800;
        const numCoolant = 400;

        const pGeo = new THREE.BufferGeometry();
        const pPos = new Float32Array((numSparks + numDust + numAsh + numCoolant) * 3);
        const pColors = new Float32Array((numSparks + numDust + numAsh + numCoolant) * 3);
        const pSizes = new Float32Array(numSparks + numDust + numAsh + numCoolant);
        const pTypes = []; // 0: spark, 1: dust, 2: ash, 3: coolant
        
        let pIdx = 0;
        let cIdx = 0;
        let sIdx = 0;

        const addParticle = (type, colorStr, size) => {
            const x = (Math.random() - 0.5) * 600;
            const y = Math.random() * 100;
            const z = (Math.random() - 0.5) * 600;
            
            pPos[pIdx++] = x;
            pPos[pIdx++] = y;
            pPos[pIdx++] = z;
            
            const color = new THREE.Color(colorStr);
            pColors[cIdx++] = color.r;
            pColors[cIdx++] = color.g;
            pColors[cIdx++] = color.b;
            
            pSizes[sIdx++] = size;
            pTypes.push({type: type, basex: x, basey: y, basez: z, life: Math.random() * 100});
        };

        for (let i = 0; i < numSparks; i++) addParticle(0, colorSparks, 1.5);
        for (let i = 0; i < numDust; i++) addParticle(1, 0x887755, 3.0);
        for (let i = 0; i < numAsh; i++) addParticle(2, 0x666666, 1.0);
        for (let i = 0; i < numCoolant; i++) addParticle(3, colorCoolant, 2.0);

        pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
        pGeo.setAttribute('color', new THREE.BufferAttribute(pColors, 3));
        pGeo.setAttribute('size', new THREE.BufferAttribute(pSizes, 1));

        const pMat = new THREE.PointsMaterial({
            size: 1.0,
            vertexColors: true,
            transparent: true,
            opacity: 0.8,
            sizeAttenuation: true
        });

        const points = new THREE.Points(pGeo, pMat);
        cityGroup.add(points);

        updatableElements.push((t, dt) => {
            const positions = points.geometry.attributes.position.array;
            let i3 = 0;
            for (let i = 0; i < pTypes.length; i++) {
                const pt = pTypes[i];
                pt.life += dt * 5;
                
                if (pt.type === 0) {
                    // Sparks (shower down from salvage points)
                    positions[i3 + 1] -= dt * 20; // falling fast
                    if (positions[i3 + 1] < 0) {
                        positions[i3 + 1] = 50 + Math.random() * 30; // reset height
                        positions[i3] = hulls[0].x + (Math.random() - 0.5) * 50; // near hull 0
                        positions[i3 + 2] = hulls[0].z + (Math.random() - 0.5) * 50;
                    }
                } else if (pt.type === 1) {
                    // Dust (drifting)
                    positions[i3] = pt.basex + Math.sin(t * 0.2 + pt.life) * 20;
                    positions[i3 + 2] = pt.basez + Math.cos(t * 0.2 + pt.life) * 20;
                } else if (pt.type === 2) {
                    // Ash (falling slowly)
                    positions[i3 + 1] -= dt * 5;
                    positions[i3] += Math.sin(t + pt.life) * 0.1;
                    if (positions[i3 + 1] < 0) positions[i3 + 1] = 100;
                } else if (pt.type === 3) {
                    // Coolant (pulse/flicker)
                    // We simulate pulsing by moving them slightly or we could just use a shader, but simple math works
                    positions[i3] = pt.basex + (Math.random() - 0.5) * Math.sin(t*5) * 2;
                    positions[i3 + 1] = pt.basey + (Math.random() - 0.5) * Math.sin(t*5) * 2;
                    positions[i3 + 2] = pt.basez + (Math.random() - 0.5) * Math.sin(t*5) * 2;
                }
                
                i3 += 3;
            }
            points.geometry.attributes.position.needsUpdate = true;
        });

        // userData update loop
        cityGroup.userData.update = function(t, dt) {
            updatableElements.forEach(fn => fn(t, dt));
        };

        console.log('[TitanGraveyard] City spawned at (1800, 0, 600)');
        return cityGroup;
    };

})();
