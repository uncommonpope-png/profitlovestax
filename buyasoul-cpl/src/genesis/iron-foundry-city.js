(function() {
    'use strict';

    window.spawnIronFoundry = function(scene, opts) {
        const options = Object.assign({
            offsetX: -800,
            offsetY: 0,
            offsetZ: -600,
            scale: 1,
            buildingCount: 200,
            particleCount: 3000
        }, opts);

        const cityGroup = new THREE.Group();
        cityGroup.position.set(options.offsetX, options.offsetY, options.offsetZ);
        cityGroup.scale.setScalar(options.scale);
        
        // --- Materials ---
        const matSteel = (window.__genesisStd || function(c){ return new THREE.MeshStandardMaterial(c); })({ color: 0x555566, metalness: 0.7, roughness: 0.6 });
        const matHazard = new THREE.MeshBasicMaterial({ color: 0xff6600 });
        const matRust = (window.__genesisStd || function(c){ return new THREE.MeshStandardMaterial(c); })({ color: 0x884422, metalness: 0.4, roughness: 0.8 });
        const matDarkIron = (window.__genesisStd || function(c){ return new THREE.MeshStandardMaterial(c); })({ color: 0x333344, metalness: 0.8, roughness: 0.5 });
        const matMolten = new THREE.MeshBasicMaterial({ color: 0xffaa44 });
        
        // --- Geometries ---
        const boxGeo = new THREE.BoxGeometry(1, 1, 1);
        const cylGeo = new THREE.CylinderGeometry(0.5, 0.5, 1, 16);
        const coneGeo = new THREE.ConeGeometry(0.5, 1, 16);
        const planeGeo = new THREE.PlaneGeometry(1, 1);
        
        const animatedElements = [];
        const pistonArms = [];
        const conveyors = [];

        // --- Terraced Ziggurat Layout ---
        const numTiers = 4;
        const tierHeight = 15;
        const tierRadiusStep = 80;

        for (let t = 0; t < numTiers; t++) {
            const currentRadius = tierRadiusStep * (numTiers - t);
            const currentY = t * tierHeight;
            
            // Create tier platform
            const platformMesh = new THREE.Mesh(new THREE.CylinderGeometry(currentRadius, currentRadius + 5, tierHeight, 32), matDarkIron);
            platformMesh.position.y = currentY - (tierHeight / 2);
            cityGroup.add(platformMesh);

            // Add ramps between tiers
            if (t > 0) {
                const prevRadius = tierRadiusStep * (numTiers - t + 1);
                for(let r=0; r<4; r++) {
                    const angle = (Math.PI / 2) * r;
                    const ramp = new THREE.Mesh(boxGeo, matRust);
                    ramp.scale.set(10, tierHeight * 1.5, 20);
                    const midR = (currentRadius + prevRadius) / 2;
                    ramp.position.set(Math.cos(angle) * midR, currentY - tierHeight/2, Math.sin(angle) * midR);
                    ramp.lookAt(0, currentY - tierHeight/2, 0);
                    ramp.rotation.x = Math.PI / 4;
                    cityGroup.add(ramp);
                }
            }
        }
        
        // --- Central Blast Furnace ---
        const furnaceHeight = 55;
        const furnaceGroup = new THREE.Group();
        
        const furnaceBase = new THREE.Mesh(new THREE.CylinderGeometry(20, 25, 20, 32), matDarkIron);
        furnaceBase.position.y = 10 + (numTiers-1) * tierHeight;
        furnaceGroup.add(furnaceBase);
        
        const furnaceCore = new THREE.Mesh(new THREE.CylinderGeometry(18, 18, 15, 32), matMolten);
        furnaceCore.position.y = 27.5 + (numTiers-1) * tierHeight;
        furnaceGroup.add(furnaceCore);
        animatedElements.push({
            mesh: furnaceCore,
            type: 'furnace',
            baseScale: new THREE.Vector3(1, 1, 1)
        });
        
        const furnaceTop = new THREE.Mesh(new THREE.ConeGeometry(20, 20, 32), matSteel);
        furnaceTop.position.y = 45 + (numTiers-1) * tierHeight;
        furnaceGroup.add(furnaceTop);
        
        cityGroup.add(furnaceGroup);

        // --- Buildings & Structures ---
        const structureTypes = ['ziggurat', 'coolingTower', 'gantryCrane', 'pipeBundle'];
        
        for (let i = 0; i < options.buildingCount; i++) {
            // Pick a tier
            const tier = Math.floor(Math.random() * numTiers);
            const rMax = tierRadiusStep * (numTiers - tier) - 10;
            const rMin = tier === numTiers - 1 ? 30 : tierRadiusStep * (numTiers - tier - 1) + 10;
            
            const radius = rMin + Math.random() * (rMax - rMin);
            const angle = Math.random() * Math.PI * 2;
            const x = Math.cos(angle) * radius;
            const z = Math.sin(angle) * radius;
            const baseY = tier * tierHeight;
            
            const bGroup = new THREE.Group();
            bGroup.position.set(x, baseY, z);
            
            const type = structureTypes[Math.floor(Math.random() * structureTypes.length)];
            
            if (type === 'ziggurat') {
                const steps = 3 + Math.floor(Math.random() * 4);
                let w = 15 + Math.random() * 10;
                let d = 15 + Math.random() * 10;
                let h = 5 + Math.random() * 5;
                let currentY = h / 2;
                
                for (let s = 0; s < steps; s++) {
                    const stepMesh = new THREE.Mesh(boxGeo, Math.random() > 0.8 ? matRust : matSteel);
                    stepMesh.scale.set(w, h, d);
                    stepMesh.position.y = currentY;
                    bGroup.add(stepMesh);
                    
                    // Add hazard strip on some steps
                    if (Math.random() > 0.7) {
                        const strip = new THREE.Mesh(boxGeo, matHazard);
                        strip.scale.set(w + 0.2, h * 0.1, d + 0.2);
                        strip.position.y = currentY;
                        bGroup.add(strip);
                    }
                    
                    currentY += h / 2;
                    w *= 0.8;
                    d *= 0.8;
                    h = 4 + Math.random() * 4;
                    currentY += h / 2;
                }
            } else if (type === 'coolingTower') {
                const height = 20 + Math.random() * 20;
                const bottomR = 8 + Math.random() * 4;
                const topR = 5 + Math.random() * 3;
                
                const towerGeo = new THREE.CylinderGeometry(topR, bottomR, height, 16);
                const tower = new THREE.Mesh(towerGeo, matDarkIron);
                tower.position.y = height / 2;
                bGroup.add(tower);
                
                // Add steam vent
                const vent = new THREE.Mesh(coneGeo, matSteel);
                vent.scale.set(topR * 2, 5, topR * 2);
                vent.position.y = height + 2.5;
                bGroup.add(vent);
            } else if (type === 'gantryCrane') {
                const mastH = 30 + Math.random() * 20;
                const mast = new THREE.Mesh(boxGeo, matRust);
                mast.scale.set(3, mastH, 3);
                mast.position.y = mastH / 2;
                bGroup.add(mast);
                
                const armL = 40 + Math.random() * 20;
                const arm = new THREE.Mesh(boxGeo, matHazard);
                arm.scale.set(armL, 2, 2);
                arm.position.y = mastH - 5;
                bGroup.add(arm);
                
                // Add a piston
                const piston = new THREE.Mesh(cylGeo, matSteel);
                piston.scale.set(2, 10, 2);
                piston.position.y = mastH / 2;
                piston.position.x = armL / 4;
                bGroup.add(piston);
                pistonArms.push({ mesh: piston, baseY: piston.position.y, speed: 2 + Math.random() * 3 });
                
            } else if (type === 'pipeBundle') {
                const numPipes = 3 + Math.floor(Math.random() * 5);
                for(let p=0; p<numPipes; p++) {
                    const ph = 15 + Math.random() * 15;
                    const pr = 1 + Math.random() * 2;
                    const pipe = new THREE.Mesh(cylGeo, Math.random() > 0.5 ? matRust : matSteel);
                    pipe.scale.set(pr * 2, ph, pr * 2);
                    pipe.position.set((Math.random()-0.5)*10, ph/2, (Math.random()-0.5)*10);
                    bGroup.add(pipe);
                }
            }
            
            bGroup.rotation.y = Math.random() * Math.PI * 2;
            cityGroup.add(bGroup);
        }

        // --- Conveyor Bridges ---
        for (let b = 0; b < 15; b++) {
            const bridgeL = 40 + Math.random() * 40;
            const bridge = new THREE.Mesh(boxGeo, matDarkIron);
            bridge.scale.set(bridgeL, 3, 5);
            
            const tier = Math.floor(Math.random() * (numTiers - 1));
            const yPos = (tier + 1) * tierHeight;
            const radius = tierRadiusStep * (numTiers - tier) - 20;
            const angle = Math.random() * Math.PI * 2;
            
            bridge.position.set(Math.cos(angle)*radius, yPos, Math.sin(angle)*radius);
            bridge.rotation.y = angle + Math.PI/2;
            cityGroup.add(bridge);
        }

        // --- Particles ---
        const particleGeo = new THREE.BufferGeometry();
        const particlePos = new Float32Array(options.particleCount * 3);
        const particleColors = new Float32Array(options.particleCount * 3);
        const particleData = [];

        const colorSteam = new THREE.Color(0xdddddd);
        const colorSpark = new THREE.Color(0xffaa00);
        const colorSoot = new THREE.Color(0x222222);

        for (let i = 0; i < options.particleCount; i++) {
            const typeRand = Math.random();
            let pType = 'steam';
            let c = colorSteam;
            
            if (typeRand > 0.8) {
                pType = 'spark';
                c = colorSpark;
            } else if (typeRand > 0.5) {
                pType = 'soot';
                c = colorSoot;
            }

            // Scatter across tiers
            const r = Math.random() * (tierRadiusStep * numTiers);
            const a = Math.random() * Math.PI * 2;
            const x = Math.cos(a) * r;
            const z = Math.sin(a) * r;
            const y = Math.random() * (numTiers * tierHeight + 60);

            particlePos[i*3] = x;
            particlePos[i*3+1] = y;
            particlePos[i*3+2] = z;

            particleColors[i*3] = c.r;
            particleColors[i*3+1] = c.g;
            particleColors[i*3+2] = c.b;

            particleData.push({
                type: pType,
                x: x, y: y, z: z,
                speedY: (pType === 'spark' ? -10 - Math.random()*20 : (pType === 'steam' ? 5 + Math.random()*10 : 2 + Math.random()*5)),
                driftX: (Math.random() - 0.5) * 5,
                driftZ: (Math.random() - 0.5) * 5,
                life: Math.random()
            });
        }

        particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePos, 3));
        particleGeo.setAttribute('color', new THREE.BufferAttribute(particleColors, 3));

        const particleMat = new THREE.PointsMaterial({
            size: 1.5,
            vertexColors: true,
            transparent: true,
            opacity: 0.8,
            blending: THREE.AdditiveBlending
        });

        const particles = new THREE.Points(particleGeo, particleMat);
        cityGroup.add(particles);

        // --- Animation Loop ---
        cityGroup.userData.update = function(time, delta) {
            // Furnace pulsing
            animatedElements.forEach(el => {
                if (el.type === 'furnace') {
                    const scale = 1 + Math.sin(time * 3) * 0.05;
                    el.mesh.scale.set(el.baseScale.x * scale, el.baseScale.y, el.baseScale.z * scale);
                    el.mesh.material.color.setHSL(0.1 + Math.sin(time*2)*0.02, 1, 0.5 + Math.sin(time*2)*0.2);
                }
            });
            
            // Pistons pumping
            pistonArms.forEach(p => {
                p.mesh.position.y = p.baseY + Math.sin(time * p.speed) * 4;
            });

            // Particles
            const positions = particles.geometry.attributes.position.array;
            for (let i = 0; i < options.particleCount; i++) {
                const pd = particleData[i];
                pd.life += delta * 0.2;
                
                pd.y += pd.speedY * delta;
                pd.x += pd.driftX * delta;
                pd.z += pd.driftZ * delta;
                
                if (pd.type === 'spark' && pd.y < 0) {
                    pd.y = numTiers * tierHeight + 40;
                    pd.life = 0;
                } else if (pd.y > numTiers * tierHeight + 100) {
                    pd.y = 0;
                    pd.life = 0;
                }

                positions[i*3] = pd.x;
                positions[i*3+1] = pd.y;
                positions[i*3+2] = pd.z;
            }
            particles.geometry.attributes.position.needsUpdate = true;
        };

        if (scene) {
            scene.add(cityGroup);
        }

        console.log(`[IronFoundry] City spawned at (${options.offsetX}, ${options.offsetY}, ${options.offsetZ})`);

        return cityGroup;
    };
})();
