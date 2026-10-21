(function() {
    'use strict';

    window.spawnBioluminescentHive = function(scene, opts = {}) {
        const offsetX = opts.x !== undefined ? opts.x : 1200;
        const offsetY = opts.y !== undefined ? opts.y : 0;
        const offsetZ = opts.z !== undefined ? opts.z : -500;
        
        console.log(`[BioluminescentHive] City spawned at (${offsetX}, ${offsetY}, ${offsetZ})`);

        const cityGroup = new THREE.Group();
        cityGroup.position.set(offsetX, offsetY, offsetZ);
        scene.add(cityGroup);

        const updatables = [];

        // Color palette
        const palette = {
            bioluminescent: 0x00ff88,
            darkOrganic: 0x004433,
            cyanGlow: 0x00ffcc,
            chitin: 0x1a3322,
            sporeLight: 0x88ffaa
        };

        // Materials
        const organicMat = (window.__genesisStd || function(c){ return new THREE.MeshStandardMaterial(c); })({
            color: palette.darkOrganic,
            roughness: 0.3,
            metalness: 0.1
        });

        const chitinMat = (window.__genesisStd || function(c){ return new THREE.MeshStandardMaterial(c); })({
            color: palette.chitin,
            roughness: 0.6,
            metalness: 0.2,
            flatShading: true
        });

        const glowMat1 = new THREE.MeshBasicMaterial({ color: palette.bioluminescent });
        const glowMat2 = new THREE.MeshBasicMaterial({ color: palette.cyanGlow });
        const glowMat3 = new THREE.MeshBasicMaterial({ color: palette.sporeLight });

        // Geometries
        const sphereGeo = new THREE.SphereGeometry(1, 16, 16);
        const cylGeo = new THREE.CylinderGeometry(1, 1, 1, 16);
        const coneGeo = new THREE.ConeGeometry(1, 1, 16);
        
        // Central Mother Hive
        const motherHiveGroup = new THREE.Group();
        
        const coreSphere = new THREE.Mesh(new THREE.SphereGeometry(25, 32, 32), chitinMat);
        coreSphere.position.y = 25;
        motherHiveGroup.add(coreSphere);
        
        const veins = new THREE.Mesh(new THREE.SphereGeometry(25.5, 16, 16), glowMat2);
        veins.position.y = 25;
        veins.material.wireframe = true;
        motherHiveGroup.add(veins);

        // Pulsing animation for mother hive
        updatables.push((time) => {
            const scale = 1 + Math.sin(time * 2) * 0.05;
            veins.scale.set(scale, scale, scale);
            veins.material.opacity = 0.5 + Math.sin(time * 2) * 0.5;
            veins.material.transparent = true;
        });

        // 6 tendril mega-towers
        for (let i = 0; i < 6; i++) {
            const angle = (i / 6) * Math.PI * 2;
            const dist = 35;
            const x = Math.cos(angle) * dist;
            const z = Math.sin(angle) * dist;

            const tendrilGroup = new THREE.Group();
            tendrilGroup.position.set(x, 0, z);

            const base = new THREE.Mesh(new THREE.CylinderGeometry(2, 6, 40, 16), chitinMat);
            base.position.y = 20;
            tendrilGroup.add(base);

            const node = new THREE.Mesh(new THREE.SphereGeometry(8, 16, 16), glowMat1);
            node.position.y = 40;
            tendrilGroup.add(node);

            // Tendril sway animation
            updatables.push((time) => {
                const swayX = Math.sin(time * 1.5 + i) * 2;
                const swayZ = Math.cos(time * 1.5 + i) * 2;
                node.position.x = swayX;
                node.position.z = swayZ;
            });

            motherHiveGroup.add(tendrilGroup);
        }

        cityGroup.add(motherHiveGroup);

        // VORONOI ORGANIC Layout
        const numBuildings = 220;
        const points = [];
        for (let i = 0; i < 15; i++) {
            points.push(new THREE.Vector2((Math.random() - 0.5) * 400, (Math.random() - 0.5) * 400));
        }

        for (let i = 0; i < numBuildings; i++) {
            let x, z;
            let valid = false;
            let attempts = 0;
            while (!valid && attempts < 50) {
                const center = points[Math.floor(Math.random() * points.length)];
                const radius = 10 + Math.random() * 50;
                const angle = Math.random() * Math.PI * 2;
                
                x = center.x + Math.cos(angle) * radius;
                z = center.y + Math.sin(angle) * radius;
                
                if (x*x + z*z > 50*50) { // stay away from center
                    valid = true;
                }
                attempts++;
            }
            if (!valid) continue;

            const type = Math.random();
            const bGroup = new THREE.Group();
            bGroup.position.set(x, 0, z);

            if (type < 0.4) {
                // Spore pod
                const h = 5 + Math.random() * 10;
                const r = 2 + Math.random() * 3;
                
                const stem = new THREE.Mesh(cylGeo, organicMat);
                stem.scale.set(r*0.5, h, r*0.5);
                stem.position.y = h/2;
                bGroup.add(stem);

                const pod = new THREE.Mesh(sphereGeo, Math.random() > 0.5 ? glowMat1 : glowMat3);
                pod.scale.set(r, r*1.2, r);
                pod.position.y = h + r;
                bGroup.add(pod);

                // Breathing
                updatables.push((time) => {
                    const s = 1 + Math.sin(time * 3 + i) * 0.1;
                    pod.scale.set(r * s, r * 1.2 * s, r * s);
                });

            } else if (type < 0.7) {
                // Tendril tower
                const h = 15 + Math.random() * 25;
                const r = 3 + Math.random() * 2;
                
                const tower = new THREE.Mesh(new THREE.CylinderGeometry(r*0.3, r, h, 12), chitinMat);
                tower.position.y = h/2;
                bGroup.add(tower);

                const nodes = 3 + Math.floor(Math.random() * 4);
                for(let j=0; j<nodes; j++) {
                    const ny = h * (j+1)/(nodes+1);
                    const nr = r * 0.8 * (1 - j/nodes);
                    const n = new THREE.Mesh(sphereGeo, glowMat2);
                    n.scale.set(nr, nr, nr);
                    n.position.set((Math.random()-0.5)*r, ny, (Math.random()-0.5)*r);
                    bGroup.add(n);
                }
            } else {
                // Mushroom canopy
                const h = 8 + Math.random() * 12;
                const r = 4 + Math.random() * 6;
                
                const stalk = new THREE.Mesh(cylGeo, organicMat);
                stalk.scale.set(r*0.3, h, r*0.3);
                stalk.position.y = h/2;
                bGroup.add(stalk);

                const cap = new THREE.Mesh(coneGeo, chitinMat);
                cap.scale.set(r, r*0.5, r);
                cap.position.y = h + r*0.25;
                bGroup.add(cap);
                
                const underGlow = new THREE.Mesh(new THREE.CylinderGeometry(r*0.9, 0.1, 0.5, 16), glowMat1);
                underGlow.position.y = h;
                bGroup.add(underGlow);
            }

            bGroup.rotation.y = Math.random() * Math.PI * 2;
            cityGroup.add(bGroup);
        }

        // Particles
        const particleCount = 4000;
        const particleGeo = new THREE.BufferGeometry();
        const pPos = new Float32Array(particleCount * 3);
        const pVel = [];

        for (let i = 0; i < particleCount; i++) {
            const px = (Math.random() - 0.5) * 500;
            const py = Math.random() * 100;
            const pz = (Math.random() - 0.5) * 500;
            pPos[i*3] = px;
            pPos[i*3+1] = py;
            pPos[i*3+2] = pz;
            
            pVel.push({
                x: (Math.random() - 0.5) * 0.5,
                y: (Math.random() - 0.5) * 0.5 + 0.2,
                z: (Math.random() - 0.5) * 0.5
            });
        }
        
        particleGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
        const particleMat = new THREE.PointsMaterial({
            color: palette.sporeLight,
            size: 0.8,
            transparent: true,
            opacity: 0.8,
            blending: THREE.AdditiveBlending
        });

        const particleSystem = new THREE.Points(particleGeo, particleMat);
        cityGroup.add(particleSystem);

        updatables.push((time, delta) => {
            const posAttr = particleSystem.geometry.attributes.position;
            for (let i = 0; i < particleCount; i++) {
                let y = posAttr.getY(i);
                let x = posAttr.getX(i);
                let z = posAttr.getZ(i);

                x += pVel[i].x * delta * 5 + Math.sin(time + i) * 0.02;
                y += pVel[i].y * delta * 5;
                z += pVel[i].z * delta * 5 + Math.cos(time + i) * 0.02;

                if (y > 100) y = 0;
                if (x > 250) x = -250;
                if (x < -250) x = 250;
                if (z > 250) z = -250;
                if (z < -250) z = 250;

                posAttr.setXYZ(i, x, y, z);
            }
            posAttr.needsUpdate = true;
        });

        cityGroup.userData.update = function(time, delta) {
            updatables.forEach(fn => fn(time, delta));
        };

        return cityGroup;
    };
})();
