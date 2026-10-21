(function() {
    'use strict';

    window.spawnObsidianSpire = function(scene, opts) {
        opts = opts || {};
        const offsetX = opts.offsetX !== undefined ? opts.offsetX : 400;
        const offsetY = opts.offsetY !== undefined ? opts.offsetY : 0;
        const offsetZ = opts.offsetZ !== undefined ? opts.offsetZ : 0;
        const scale = opts.scale || 1.0;

        const cityGroup = new THREE.Group();
        cityGroup.position.set(offsetX, offsetY, offsetZ);
        cityGroup.scale.set(scale, scale, scale);

        console.log(`[ObsidianSpire] City spawned at (${offsetX}, ${offsetY}, ${offsetZ})`);

        const animatedObjects = [];

        // Palettes
        const colors = {
            obsidian: 0x1a0a2e,
            lava: 0xff4400,
            crimson: 0xcc0000,
            darkPurple: 0x2d1b4e,
            ember: 0xff6600
        };

        const obsidianMaterial = (window.__genesisStd || function(c){ return new THREE.MeshStandardMaterial(c); })({
            color: colors.obsidian,
            roughness: 0.2,
            metalness: 0.8,
            emissive: 0x0a0014
        });

        const darkPurpleMaterial = (window.__genesisStd || function(c){ return new THREE.MeshStandardMaterial(c); })({
            color: colors.darkPurple,
            roughness: 0.3,
            metalness: 0.6
        });

        const lavaMaterial = (window.__genesisStd || function(c){ return new THREE.MeshStandardMaterial(c); })({
            color: colors.lava,
            emissive: colors.lava,
            emissiveIntensity: 0.8,
            roughness: 1.0
        });

        const crimsonMaterial = new THREE.MeshBasicMaterial({
            color: colors.crimson
        });
        
        // --- Central Mega-Pyramid ---
        const centerGroup = new THREE.Group();
        cityGroup.add(centerGroup);

        const megaPyramidHeight = 60;
        const megaSteps = 5;
        for (let i = 0; i < megaSteps; i++) {
            const stepSize = 40 - (i * 7);
            const stepHeight = megaPyramidHeight / megaSteps;
            const yPos = (stepHeight / 2) + (i * stepHeight);
            
            const stepGeo = new THREE.BoxGeometry(stepSize, stepHeight, stepSize);
            const stepMesh = new THREE.Mesh(stepGeo, obsidianMaterial);
            stepMesh.position.y = yPos;
            centerGroup.add(stepMesh);

            // Lava channels between steps
            if (i < megaSteps - 1) {
                const channelGeo = new THREE.BoxGeometry(stepSize + 0.5, stepHeight * 0.1, stepSize + 0.5);
                const channelMesh = new THREE.Mesh(channelGeo, lavaMaterial);
                channelMesh.position.y = yPos + stepHeight / 2;
                centerGroup.add(channelMesh);
                
                // Animate channels
                animatedObjects.push({
                    mesh: channelMesh,
                    type: 'flicker',
                    baseIntensity: 0.8,
                    speed: 2 + Math.random() * 3
                });
            }
        }
        
        // Pyramid cap
        const capGeo = new THREE.ConeGeometry(5, 15, 4);
        const capMesh = new THREE.Mesh(capGeo, obsidianMaterial);
        capMesh.position.y = megaPyramidHeight + 7.5;
        capMesh.rotation.y = Math.PI / 4;
        centerGroup.add(capMesh);

        // Orbiting lava rings
        const ringGroup = new THREE.Group();
        ringGroup.position.y = megaPyramidHeight / 2;
        centerGroup.add(ringGroup);

        for (let i = 0; i < 3; i++) {
            const radius = 25 + i * 5;
            const ringGeo = new THREE.TorusGeometry(radius, 0.5, 8, 32);
            const ringMesh = new THREE.Mesh(ringGeo, lavaMaterial);
            ringMesh.rotation.x = Math.PI / 2 + (Math.random() - 0.5) * 0.5;
            ringMesh.rotation.y = (Math.random() - 0.5) * 0.5;
            ringGroup.add(ringMesh);
            
            animatedObjects.push({
                mesh: ringMesh,
                type: 'rotate',
                axis: new THREE.Vector3(0, 1, 0).normalize(),
                speed: (0.5 + Math.random() * 0.5) * (i % 2 === 0 ? 1 : -1)
            });
        }

        // --- Defense Obelisks ---
        const numObelisks = 12;
        const obeliskRadius = 55;
        
        for (let i = 0; i < numObelisks; i++) {
            const angle = (i / numObelisks) * Math.PI * 2;
            const obeliskX = Math.cos(angle) * obeliskRadius;
            const obeliskZ = Math.sin(angle) * obeliskRadius;
            
            const obeliskGroup = new THREE.Group();
            obeliskGroup.position.set(obeliskX, 0, obeliskZ);
            cityGroup.add(obeliskGroup);
            
            const oHeight = 25;
            const oBaseGeo = new THREE.CylinderGeometry(2, 3, oHeight, 4);
            const oBaseMesh = new THREE.Mesh(oBaseGeo, obsidianMaterial);
            oBaseMesh.position.y = oHeight / 2;
            oBaseMesh.rotation.y = Math.PI / 4;
            obeliskGroup.add(oBaseMesh);
            
            const oCrystalGeo = new THREE.OctahedronGeometry(2);
            const oCrystalMesh = new THREE.Mesh(oCrystalGeo, crimsonMaterial);
            oCrystalMesh.position.y = oHeight + 2;
            obeliskGroup.add(oCrystalMesh);
            
            animatedObjects.push({
                mesh: oCrystalMesh,
                type: 'pulse_scale',
                speed: 3 + Math.random(),
                minScale: 0.8,
                maxScale: 1.2
            });
            
            animatedObjects.push({
                mesh: oCrystalMesh,
                type: 'rotate',
                axis: new THREE.Vector3(0, 1, 0),
                speed: 1.0
            });
        }

        // --- Buildings (Concentric Rings) ---
        const totalBuildings = 200;
        const rings = 3;
        const buildingPerRing = Math.floor(totalBuildings / rings);
        
        for (let r = 0; r < rings; r++) {
            const currentRadius = 80 + r * 35;
            const numInRing = buildingPerRing + (r * 10) - 15; // Varying density
            
            for (let i = 0; i < numInRing; i++) {
                const angle = (i / numInRing) * Math.PI * 2 + (r * 0.5);
                const jitter = (Math.random() - 0.5) * 10;
                
                const bX = Math.cos(angle) * (currentRadius + jitter);
                const bZ = Math.sin(angle) * (currentRadius + jitter);
                
                const bGroup = new THREE.Group();
                bGroup.position.set(bX, 0, bZ);
                // Look at center
                bGroup.lookAt(0, 0, 0);
                cityGroup.add(bGroup);
                
                const bHeight = 8 + Math.random() * 32; // 8 to 40
                
                // Building base (box)
                const bWidth = 4 + Math.random() * 4;
                const bDepth = 4 + Math.random() * 4;
                const baseGeo = new THREE.BoxGeometry(bWidth, bHeight * 0.7, bDepth);
                const baseMesh = new THREE.Mesh(baseGeo, Math.random() > 0.3 ? obsidianMaterial : darkPurpleMaterial);
                baseMesh.position.y = (bHeight * 0.7) / 2;
                bGroup.add(baseMesh);
                
                // Building cap (pyramid)
                const capGeo2 = new THREE.ConeGeometry(Math.max(bWidth, bDepth) * 0.7, bHeight * 0.3, 4);
                const capMesh2 = new THREE.Mesh(capGeo2, obsidianMaterial);
                capMesh2.position.y = (bHeight * 0.7) + (bHeight * 0.3) / 2;
                capMesh2.rotation.y = Math.PI / 4;
                bGroup.add(capMesh2);
                
                // Greebles: Lava channel or energy ring
                if (Math.random() > 0.5) {
                    const cGeo = new THREE.BoxGeometry(bWidth + 0.2, 0.5, bDepth + 0.2);
                    const cMesh = new THREE.Mesh(cGeo, lavaMaterial);
                    cMesh.position.y = bHeight * 0.7;
                    bGroup.add(cMesh);
                    animatedObjects.push({
                        mesh: cMesh,
                        type: 'flicker',
                        baseIntensity: 0.6,
                        speed: Math.random() * 5
                    });
                } else {
                    const rGeo = new THREE.TorusGeometry(Math.max(bWidth, bDepth) * 0.8, 0.2, 4, 16);
                    const rMesh = new THREE.Mesh(rGeo, lavaMaterial);
                    rMesh.position.y = bHeight * 0.85;
                    rMesh.rotation.x = Math.PI / 2;
                    bGroup.add(rMesh);
                }
                
                // Greebles: Corner pillars
                if (Math.random() > 0.6) {
                    const pGeo = new THREE.CylinderGeometry(0.3, 0.3, bHeight, 4);
                    for (let px of [-1, 1]) {
                        for (let pz of [-1, 1]) {
                            const pMesh = new THREE.Mesh(pGeo, obsidianMaterial);
                            pMesh.position.set(px * bWidth/2, bHeight/2, pz * bDepth/2);
                            bGroup.add(pMesh);
                        }
                    }
                }
            }
        }
        
        // --- Particles (Embers & Ash) ---
        const particleCount = 3000;
        const particleGeo = new THREE.BufferGeometry();
        const particlePositions = new Float32Array(particleCount * 3);
        const particleVelocities = [];
        const particleColors = new Float32Array(particleCount * 3);
        
        const emberColor = new THREE.Color(colors.ember);
        const lavaColor = new THREE.Color(colors.lava);
        
        for (let i = 0; i < particleCount; i++) {
            const i3 = i * 3;
            // Distribute over city area
            const r = Math.sqrt(Math.random()) * 200;
            const theta = Math.random() * Math.PI * 2;
            
            particlePositions[i3] = Math.cos(theta) * r;
            particlePositions[i3 + 1] = Math.random() * 80; // height
            particlePositions[i3 + 2] = Math.sin(theta) * r;
            
            // Embers rise, ash falls
            const isEmber = Math.random() > 0.4;
            const vy = isEmber ? (Math.random() * 10 + 2) : -(Math.random() * 5 + 1);
            particleVelocities.push({
                x: (Math.random() - 0.5) * 5,
                y: vy,
                z: (Math.random() - 0.5) * 5,
                isEmber: isEmber
            });
            
            const pColor = isEmber ? (Math.random() > 0.5 ? emberColor : lavaColor) : new THREE.Color(0x333333);
            particleColors[i3] = pColor.r;
            particleColors[i3 + 1] = pColor.g;
            particleColors[i3 + 2] = pColor.b;
        }
        
        particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
        particleGeo.setAttribute('color', new THREE.BufferAttribute(particleColors, 3));
        
        const particleMat = new THREE.PointsMaterial({
            size: 0.8,
            vertexColors: true,
            transparent: true,
            opacity: 0.8,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });
        
        const particleSystem = new THREE.Points(particleGeo, particleMat);
        cityGroup.add(particleSystem);
        
        // --- Update Function ---
        cityGroup.userData.update = function(time, delta) {
            // Animate objects
            for (let obj of animatedObjects) {
                if (obj.type === 'flicker') {
                    if (obj.mesh.material.emissiveIntensity !== undefined) {
                        obj.mesh.material.emissiveIntensity = obj.baseIntensity + Math.sin(time * obj.speed) * 0.2;
                    }
                } else if (obj.type === 'rotate') {
                    obj.mesh.rotateOnAxis(obj.axis, obj.speed * delta);
                } else if (obj.type === 'pulse_scale') {
                    const s = obj.minScale + (Math.sin(time * obj.speed) * 0.5 + 0.5) * (obj.maxScale - obj.minScale);
                    obj.mesh.scale.set(s, s, s);
                }
            }
            
            // Animate particles
            const positions = particleSystem.geometry.attributes.position.array;
            for (let i = 0; i < particleCount; i++) {
                const i3 = i * 3;
                const v = particleVelocities[i];
                
                positions[i3] += v.x * delta;
                positions[i3 + 1] += v.y * delta;
                positions[i3 + 2] += v.z * delta;
                
                // Wrap around
                if (v.isEmber && positions[i3 + 1] > 100) {
                    positions[i3 + 1] = 0;
                } else if (!v.isEmber && positions[i3 + 1] < 0) {
                    positions[i3 + 1] = 100;
                }
                
                // Keep within bounds
                const distSq = positions[i3]*positions[i3] + positions[i3+2]*positions[i3+2];
                if (distSq > 40000) { // 200 radius squared
                    const angle = Math.atan2(positions[i3+2], positions[i3]);
                    const newR = Math.random() * 200;
                    positions[i3] = Math.cos(angle) * newR;
                    positions[i3+2] = Math.sin(angle) * newR;
                }
            }
            particleSystem.geometry.attributes.position.needsUpdate = true;
        };

        if (scene) {
            scene.add(cityGroup);
        }

        return cityGroup;
    };

})();
