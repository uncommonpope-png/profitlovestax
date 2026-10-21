(function() {
    'use strict';

    window.spawnOmegaCrucible = function(scene, opts) {
        opts = opts || {};
        const offsetX = opts.offsetX !== undefined ? opts.offsetX : 2000;
        const offsetY = opts.offsetY !== undefined ? opts.offsetY : 0;
        const offsetZ = opts.offsetZ !== undefined ? opts.offsetZ : 0;

        const cityGroup = new THREE.Group();
        cityGroup.position.set(offsetX, offsetY, offsetZ);

        console.log(`[OmegaCrucible] City spawned at (${offsetX}, ${offsetY}, ${offsetZ})`);

        // Materials
        const ringMat = new THREE.MeshStandardMaterial({
            color: 0x8899aa,
            metalness: 0.7,
            roughness: 0.3,
            wireframe: false
        });
        const ringGreebleMat = new THREE.MeshStandardMaterial({
            color: 0x667788,
            metalness: 0.8,
            roughness: 0.4
        });
        const singularityMat = new THREE.MeshBasicMaterial({
            color: 0xffffff
        });
        const accretionMat = new THREE.MeshBasicMaterial({
            color: 0x44aaff,
            transparent: true,
            opacity: 0.8,
            side: THREE.DoubleSide
        });
        const energyMat = new THREE.MeshBasicMaterial({
            color: 0xffcc44
        });
        const voidMat = new THREE.MeshStandardMaterial({
            color: 0x111122,
            metalness: 0.9,
            roughness: 0.1
        });

        // Geometries
        const boxGeo = new THREE.BoxGeometry(1, 1, 1);
        const cylGeo = new THREE.CylinderGeometry(1, 1, 1, 16);
        const coneGeo = new THREE.ConeGeometry(1, 1, 16);
        const sphereGeo = new THREE.SphereGeometry(1, 16, 16);
        const torusGeo = new THREE.TorusGeometry(1, 0.2, 16, 32);
        
        // Singularity
        const singularity = new THREE.Mesh(sphereGeo, singularityMat);
        singularity.scale.set(5, 5, 5);
        cityGroup.add(singularity);

        // Accretion disk
        const accretionDisk = new THREE.Mesh(new THREE.TorusGeometry(30, 0.5, 2, 64), accretionMat);
        accretionDisk.rotation.x = Math.PI / 2;
        cityGroup.add(accretionDisk);

        // 3 Dyson Rings
        const rings = [];
        const ringRadii = [80, 130, 180];
        
        ringRadii.forEach((radius, index) => {
            const ringGroup = new THREE.Group();
            
            const ringMesh = new THREE.Mesh(new THREE.TorusGeometry(radius, 4, 16, 128), ringMat);
            ringGroup.add(ringMesh);
            
            // Distribute buildings along the ring
            const numBuildings = 80 + index * 10;
            for (let i = 0; i < numBuildings; i++) {
                const angle = (i / numBuildings) * Math.PI * 2;
                
                const bldgGroup = new THREE.Group();
                bldgGroup.position.x = Math.cos(angle) * radius;
                bldgGroup.position.y = Math.sin(angle) * radius;
                
                bldgGroup.rotation.z = angle;
                
                const type = Math.random();
                if (type < 0.5) {
                    // Habitation module
                    const hab = new THREE.Mesh(boxGeo, ringGreebleMat);
                    hab.scale.set(10, 6, 8);
                    bldgGroup.add(hab);
                    
                    if (Math.random() > 0.5) {
                        const dome = new THREE.Mesh(sphereGeo, voidMat);
                        dome.scale.set(3, 3, 3);
                        dome.position.y = 3;
                        bldgGroup.add(dome);
                    }
                } else {
                    // Energy collector
                    const base = new THREE.Mesh(cylGeo, ringGreebleMat);
                    base.scale.set(3, 8, 3);
                    base.position.y = 4;
                    bldgGroup.add(base);
                    
                    const dish = new THREE.Mesh(coneGeo, energyMat);
                    dish.scale.set(4, 2, 4);
                    dish.position.y = 8;
                    dish.rotation.x = -Math.PI / 2;
                    bldgGroup.add(dish);
                }
                
                ringGroup.add(bldgGroup);
            }
            
            cityGroup.add(ringGroup);
            rings.push(ringGroup);
        });

        // 6 containment pylons
        const pylonGroup = new THREE.Group();
        for (let i = 0; i < 6; i++) {
            const angle = (i / 6) * Math.PI * 2;
            const pylon = new THREE.Mesh(cylGeo, voidMat);
            pylon.scale.set(2, 60, 2);
            
            // position center of pylon at radius 40
            const pRadius = 40;
            pylon.position.x = Math.cos(angle) * pRadius;
            pylon.position.z = Math.sin(angle) * pRadius;
            
            // point towards singularity
            pylon.lookAt(0, 0, 0);
            pylon.rotateX(Math.PI / 2);
            
            // cap
            const cap = new THREE.Mesh(sphereGeo, energyMat);
            cap.scale.set(3, 3, 3);
            cap.position.y = 30;
            pylon.add(cap);
            
            pylonGroup.add(pylon);
        }
        cityGroup.add(pylonGroup);

        // Particles
        const particleCount = 5000;
        const particleGeo = new THREE.BufferGeometry();
        const particlePos = new Float32Array(particleCount * 3);
        const particleType = new Float32Array(particleCount);
        const particleSpeed = new Float32Array(particleCount);
        const particleAngle = new Float32Array(particleCount);
        const particleRadius = new Float32Array(particleCount);

        for (let i = 0; i < particleCount; i++) {
            const pType = Math.random();
            let x, y, z, s, a, r;
            
            if (pType < 0.4) {
                // accretion sparks
                particleType[i] = 0;
                r = 10 + Math.random() * 40;
                a = Math.random() * Math.PI * 2;
                x = Math.cos(a) * r;
                y = (Math.random() - 0.5) * 2;
                z = Math.sin(a) * r;
                s = 0.5 + Math.random() * 1.5;
            } else if (pType < 0.7) {
                // energy discharge
                particleType[i] = 1;
                r = ringRadii[Math.floor(Math.random() * 3)];
                a = Math.random() * Math.PI * 2;
                x = Math.cos(a) * r;
                y = Math.sin(a) * r;
                z = (Math.random() - 0.5) * 10;
                s = 0.2 + Math.random() * 0.8;
            } else if (pType < 0.9) {
                // hawking radiation
                particleType[i] = 2;
                r = 5 + Math.random() * 5;
                a = Math.random() * Math.PI * 2;
                const phi = Math.acos(2 * Math.random() - 1);
                x = r * Math.sin(phi) * Math.cos(a);
                y = r * Math.sin(phi) * Math.sin(a);
                z = r * Math.cos(phi);
                s = 0.1 + Math.random() * 0.3;
            } else {
                // stellar wind
                particleType[i] = 3;
                r = 50 + Math.random() * 150;
                a = Math.random() * Math.PI * 2;
                const phi = Math.acos(2 * Math.random() - 1);
                x = r * Math.sin(phi) * Math.cos(a);
                y = r * Math.sin(phi) * Math.sin(a);
                z = r * Math.cos(phi);
                s = 1.0 + Math.random() * 2.0;
            }
            
            particlePos[i * 3] = x;
            particlePos[i * 3 + 1] = y;
            particlePos[i * 3 + 2] = z;
            particleType[i] = pType;
            particleSpeed[i] = s;
            particleAngle[i] = a;
            particleRadius[i] = r;
        }

        particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePos, 3));
        
        // Use a single points material, although colored via vertex colors or just uniform
        // To simplify, we'll just use a uniform white basic material and let size vary if we used shaders,
        // but MeshBasicMaterial on Points is standard PointsMaterial.
        const particleMat = new THREE.PointsMaterial({
            color: 0xffffff,
            size: 0.5,
            transparent: true,
            opacity: 0.8,
            blending: THREE.AdditiveBlending
        });

        // Add some variation via colors
        const colors = new Float32Array(particleCount * 3);
        const colorAccretion = new THREE.Color(0x44aaff);
        const colorEnergy = new THREE.Color(0xffcc44);
        const colorHawking = new THREE.Color(0xaa44ff);
        const colorWind = new THREE.Color(0xffffff);

        for (let i = 0; i < particleCount; i++) {
            let c;
            if (particleType[i] < 0.4) c = colorAccretion;
            else if (particleType[i] < 0.7) c = colorEnergy;
            else if (particleType[i] < 0.9) c = colorHawking;
            else c = colorWind;
            
            colors[i*3] = c.r;
            colors[i*3+1] = c.g;
            colors[i*3+2] = c.b;
        }
        particleGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        particleMat.vertexColors = true;

        const particles = new THREE.Points(particleGeo, particleMat);
        cityGroup.add(particles);

        if (scene) {
            scene.add(cityGroup);
        }

        // Animation update
        cityGroup.userData.update = function(time, delta) {
            singularity.scale.setScalar(5 + Math.sin(time * 5) * 0.2);
            
            accretionDisk.rotation.z += delta * 2;
            
            rings[0].rotation.y = time * 0.1;
            rings[1].rotation.x = time * 0.05;
            rings[2].rotation.z = time * 0.02;
            
            rings[0].rotation.z = time * 0.03;
            rings[1].rotation.z = time * 0.06;
            
            // Rotate pylons slowly
            pylonGroup.rotation.y += delta * 0.2;
            
            // Animate particles
            const positions = particleGeo.attributes.position.array;
            for (let i = 0; i < particleCount; i++) {
                const type = particleType[i];
                const s = particleSpeed[i];
                let a = particleAngle[i];
                let r = particleRadius[i];
                
                if (type < 0.4) {
                    // accretion
                    a += delta * s;
                    r -= delta * s * 2;
                    if (r < 5) {
                        r = 50;
                        a = Math.random() * Math.PI * 2;
                    }
                    positions[i*3] = Math.cos(a) * r;
                    positions[i*3+2] = Math.sin(a) * r;
                    particleAngle[i] = a;
                    particleRadius[i] = r;
                } else if (type < 0.7) {
                    // energy discharge
                    a += delta * s * 0.5;
                    positions[i*3] = Math.cos(a) * r;
                    positions[i*3+1] = Math.sin(a) * r;
                    particleAngle[i] = a;
                } else if (type < 0.9) {
                    // hawking
                    positions[i*3+1] += delta * s * 10;
                    if (positions[i*3+1] > 20 || positions[i*3+1] < -20) {
                        positions[i*3+1] = 0;
                    }
                } else {
                    // wind
                    const px = positions[i*3];
                    const py = positions[i*3+1];
                    const pz = positions[i*3+2];
                    const dist = Math.sqrt(px*px + py*py + pz*pz);
                    const normX = px / dist;
                    const normY = py / dist;
                    const normZ = pz / dist;
                    
                    positions[i*3] += normX * s * delta * 20;
                    positions[i*3+1] += normY * s * delta * 20;
                    positions[i*3+2] += normZ * s * delta * 20;
                    
                    if (dist > 300) {
                        const newR = 50;
                        const newA = Math.random() * Math.PI * 2;
                        const phi = Math.acos(2 * Math.random() - 1);
                        positions[i*3] = newR * Math.sin(phi) * Math.cos(newA);
                        positions[i*3+1] = newR * Math.sin(phi) * Math.sin(newA);
                        positions[i*3+2] = newR * Math.cos(phi);
                    }
                }
            }
            particleGeo.attributes.position.needsUpdate = true;
        };

        return cityGroup;
    };
})();
