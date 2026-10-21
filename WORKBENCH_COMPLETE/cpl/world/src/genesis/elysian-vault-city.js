(function() {
    'use strict';

    window.spawnElysianVault = function(scene, opts) {
        opts = opts || {};
        const offsetX = opts.offsetX !== undefined ? opts.offsetX : 1000;
        const offsetZ = opts.offsetZ !== undefined ? opts.offsetZ : -1200;
        const offsetY = opts.offsetY !== undefined ? opts.offsetY : 0;
        
        console.log(`[ElysianVault] City spawned at (${offsetX}, ${offsetY}, ${offsetZ})`);

        const cityGroup = new THREE.Group();
        cityGroup.position.set(offsetX, offsetY, offsetZ);

        // Materials
        const materials = {
            marble: new THREE.MeshStandardMaterial({ color: 0xffffee, roughness: 0.2, metalness: 0.1 }),
            gold: new THREE.MeshStandardMaterial({ color: 0xffdd44, roughness: 0.1, metalness: 0.9 }),
            rose: new THREE.MeshStandardMaterial({ color: 0xffccdd, roughness: 0.3, metalness: 0.1 }),
            warmStone: new THREE.MeshStandardMaterial({ color: 0xeeddcc, roughness: 0.4, metalness: 0.0 }),
            divineWhite: new THREE.MeshBasicMaterial({ color: 0xffffff }),
            beam: new THREE.MeshBasicMaterial({ color: 0xffdd44, transparent: true, opacity: 0.6, blending: THREE.AdditiveBlending, side: THREE.DoubleSide }),
            halo: new THREE.MeshBasicMaterial({ color: 0xffdd44, transparent: true, opacity: 0.8, blending: THREE.AdditiveBlending })
        };

        // Geometries
        const boxGeo = new THREE.BoxGeometry(1, 1, 1);
        const cylGeo = new THREE.CylinderGeometry(0.5, 0.5, 1, 16);
        const coneGeo = new THREE.ConeGeometry(0.5, 1, 16);
        const domeGeo = new THREE.SphereGeometry(0.5, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2);
        const pyramidGeo = new THREE.ConeGeometry(0.5, 1, 4); // 4-sided cone
        const obeliskGeo = new THREE.CylinderGeometry(0.3, 0.5, 1, 4); // 4-sided tapered

        // Animated elements
        const animatedElements = [];
        
        // --- Helper to create composite buildings ---
        function createCathedral(scale) {
            const group = new THREE.Group();
            
            // Base
            const base = new THREE.Mesh(boxGeo, materials.marble);
            base.scale.set(6 * scale, 8 * scale, 10 * scale);
            base.position.y = 4 * scale;
            group.add(base);

            // Spire
            const spire = new THREE.Mesh(coneGeo, materials.marble);
            spire.scale.set(4 * scale, 12 * scale, 4 * scale);
            spire.position.y = (8 + 6) * scale;
            group.add(spire);

            // Spire tip (gold)
            const tip = new THREE.Mesh(coneGeo, materials.gold);
            tip.scale.set(1 * scale, 3 * scale, 1 * scale);
            tip.position.y = (8 + 12 + 1.5) * scale;
            group.add(tip);
            animatedElements.push({ mesh: tip, type: 'glow', baseScale: tip.scale.clone() });

            // Buttresses
            for (let i = -1; i <= 1; i += 2) {
                for (let j = -1; j <= 1; j++) {
                    const buttress = new THREE.Mesh(boxGeo, materials.warmStone);
                    buttress.scale.set(2 * scale, 6 * scale, 1 * scale);
                    buttress.position.set(i * 4 * scale, 3 * scale, j * 3 * scale);
                    buttress.rotation.z = i * -0.2;
                    group.add(buttress);
                }
            }

            return group;
        }

        function createRotunda(scale) {
            const group = new THREE.Group();
            
            // Base cylinder
            const base = new THREE.Mesh(cylGeo, materials.rose);
            base.scale.set(5 * scale, 6 * scale, 5 * scale);
            base.position.y = 3 * scale;
            group.add(base);

            // Dome
            const dome = new THREE.Mesh(domeGeo, materials.gold);
            dome.scale.set(5 * scale, 3 * scale, 5 * scale);
            dome.position.y = 6 * scale;
            group.add(dome);

            return group;
        }

        function createColonnade(scale) {
            const group = new THREE.Group();
            
            // Roof
            const roof = new THREE.Mesh(boxGeo, materials.marble);
            roof.scale.set(10 * scale, 1 * scale, 4 * scale);
            roof.position.y = 5 * scale;
            group.add(roof);

            // Columns
            for (let i = -4; i <= 4; i += 2) {
                for (let j = -1; j <= 1; j += 2) {
                    const col = new THREE.Mesh(cylGeo, materials.marble);
                    col.scale.set(0.5 * scale, 5 * scale, 0.5 * scale);
                    col.position.set(i * scale, 2.5 * scale, j * 1.2 * scale);
                    group.add(col);

                    const cap = new THREE.Mesh(boxGeo, materials.gold);
                    cap.scale.set(0.7 * scale, 0.2 * scale, 0.7 * scale);
                    cap.position.set(i * scale, 4.9 * scale, j * 1.2 * scale);
                    group.add(cap);
                    animatedElements.push({ mesh: cap, type: 'shimmer', offset: Math.random() * Math.PI * 2 });
                }
            }

            return group;
        }

        function createObelisk(scale) {
            const group = new THREE.Group();
            
            const shaft = new THREE.Mesh(obeliskGeo, materials.marble);
            shaft.scale.set(2 * scale, 12 * scale, 2 * scale);
            shaft.position.y = 6 * scale;
            shaft.rotation.y = Math.PI / 4;
            group.add(shaft);

            const cap = new THREE.Mesh(pyramidGeo, materials.gold);
            cap.scale.set(2.4 * scale, 2 * scale, 2.4 * scale);
            cap.position.y = (12 + 1) * scale;
            cap.rotation.y = Math.PI / 4;
            group.add(cap);

            return group;
        }

        // --- Central Grand Cathedral ---
        const centralCathedral = createCathedral(3);
        cityGroup.add(centralCathedral);

        // Light Beams
        const beams = [];
        for (let i = 0; i < 3; i++) {
            const beam = new THREE.Mesh(cylGeo, materials.beam);
            beam.scale.set(1, 100, 1);
            const angle = (i / 3) * Math.PI * 2;
            beam.position.set(Math.cos(angle) * 3, 50, Math.sin(angle) * 3);
            cityGroup.add(beam);
            beams.push({ mesh: beam, angle: angle });
        }
        animatedElements.push({ type: 'beams', items: beams });

        // Floating Halos
        const halos = [];
        for (let i = 0; i < 8; i++) {
            const radius = 10 + i * 5;
            const tube = 0.5 + Math.random() * 0.5;
            const haloGeo = new THREE.TorusGeometry(radius, tube, 8, 64);
            const halo = new THREE.Mesh(haloGeo, materials.halo);
            halo.position.y = 20 + i * 8;
            halo.rotation.x = Math.PI / 2;
            cityGroup.add(halo);
            halos.push({ mesh: halo, speed: (Math.random() - 0.5) * 0.5 });
        }
        animatedElements.push({ type: 'halos', items: halos });

        // --- Concentric Rings ---
        const numRings = 3;
        const structuresPerRing = [24, 40, 60];
        const ringRadii = [35, 65, 100];
        
        let buildingCount = 0;
        
        for (let r = 0; r < numRings; r++) {
            const count = structuresPerRing[r];
            const radius = ringRadii[r];
            
            for (let i = 0; i < count; i++) {
                const angle = (i / count) * Math.PI * 2;
                const x = Math.cos(angle) * radius;
                const z = Math.sin(angle) * radius;
                
                const typeRand = Math.random();
                let bldg;
                const scale = 0.5 + Math.random() * 1.0;
                
                if (typeRand < 0.3) {
                    bldg = createCathedral(scale * 0.5); // smaller cathedrals
                } else if (typeRand < 0.6) {
                    bldg = createRotunda(scale);
                } else if (typeRand < 0.8) {
                    bldg = createColonnade(scale);
                } else {
                    bldg = createObelisk(scale);
                }
                
                bldg.position.set(x, 0, z);
                // Point towards center
                bldg.rotation.y = -angle + Math.PI / 2;
                
                // Jitter
                bldg.position.x += (Math.random() - 0.5) * 5;
                bldg.position.z += (Math.random() - 0.5) * 5;
                
                cityGroup.add(bldg);
                buildingCount++;
            }
        }
        
        // Fill remaining with some random scattering
        for(let i=0; i < (200 - buildingCount - 1); i++) {
            const angle = Math.random() * Math.PI * 2;
            const rad = 15 + Math.random() * 120;
            const x = Math.cos(angle) * rad;
            const z = Math.sin(angle) * rad;
            
            const bldg = createObelisk(0.3 + Math.random() * 0.5);
            bldg.position.set(x, 0, z);
            cityGroup.add(bldg);
        }

        // --- Particles System ---
        const particleCount = 2500;
        const geom = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        const colors = new Float32Array(particleCount * 3);
        const sizes = new Float32Array(particleCount);
        const types = new Float32Array(particleCount); // 0: mote, 1: dust, 2: petal
        
        const cMote = new THREE.Color(0xffdd44);
        const cDust = new THREE.Color(0xffffff);
        const cPetal = new THREE.Color(0xffccdd);

        for (let i = 0; i < particleCount; i++) {
            positions[i * 3] = (Math.random() - 0.5) * 300;
            positions[i * 3 + 1] = Math.random() * 100;
            positions[i * 3 + 2] = (Math.random() - 0.5) * 300;
            
            const type = Math.random();
            types[i] = type;
            let c;
            if (type < 0.33) { c = cMote; sizes[i] = 2.0; }
            else if (type < 0.66) { c = cDust; sizes[i] = 1.0; }
            else { c = cPetal; sizes[i] = 3.0; }
            
            colors[i * 3] = c.r;
            colors[i * 3 + 1] = c.g;
            colors[i * 3 + 2] = c.b;
        }
        
        geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geom.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        geom.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
        geom.setAttribute('type', new THREE.BufferAttribute(types, 1));

        // Vertex shader for particles
        const vertexShader = `
            attribute float size;
            attribute vec3 color;
            varying vec3 vColor;
            void main() {
                vColor = color;
                vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
                gl_PointSize = size * (300.0 / -mvPosition.z);
                gl_Position = projectionMatrix * mvPosition;
            }
        `;
        
        const fragmentShader = `
            varying vec3 vColor;
            void main() {
                float dist = length(gl_PointCoord - vec2(0.5));
                if (dist > 0.5) discard;
                gl_FragColor = vec4(vColor, 1.0 - (dist * 2.0));
            }
        `;

        const particleMat = new THREE.ShaderMaterial({
            vertexShader,
            fragmentShader,
            transparent: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });

        const particles = new THREE.Points(geom, particleMat);
        cityGroup.add(particles);

        // --- Animation Loop ---
        cityGroup.userData.update = function(time, delta) {
            // Animate properties
            animatedElements.forEach(item => {
                if (item.type === 'glow') {
                    const s = 1 + Math.sin(time * 2) * 0.1;
                    item.mesh.scale.set(item.baseScale.x * s, item.baseScale.y, item.baseScale.z * s);
                } else if (item.type === 'shimmer') {
                    item.mesh.scale.y = 0.2 + Math.sin(time * 3 + item.offset) * 0.05;
                } else if (item.type === 'beams') {
                    item.items.forEach((beamObj, idx) => {
                        const pulse = 0.6 + Math.sin(time * 5 + beamObj.angle) * 0.4;
                        beamObj.mesh.material.opacity = pulse;
                        beamObj.mesh.rotation.y += delta * 0.5;
                    });
                } else if (item.type === 'halos') {
                    item.items.forEach(halo => {
                        halo.mesh.rotation.z += halo.speed * delta;
                        halo.mesh.position.y += Math.sin(time + halo.speed * 10) * 0.02;
                    });
                }
            });

            // Animate particles
            const posAttr = geom.attributes.position;
            const typeAttr = geom.attributes.type;
            
            for (let i = 0; i < particleCount; i++) {
                const t = typeAttr.array[i];
                let y = posAttr.array[i * 3 + 1];
                let x = posAttr.array[i * 3];
                let z = posAttr.array[i * 3 + 2];
                
                if (t < 0.33) {
                    // Motes rise
                    y += delta * 15;
                    x += Math.sin(time + i) * delta * 5;
                } else if (t < 0.66) {
                    // Dust drift
                    x += Math.sin(time * 0.5 + i) * delta * 10;
                    z += Math.cos(time * 0.5 + i) * delta * 10;
                } else {
                    // Petals fall gently
                    y -= delta * 10;
                    x += Math.sin(time * 2 + i) * delta * 10;
                    z += Math.cos(time * 1.5 + i) * delta * 10;
                }
                
                if (y > 150) y = 0;
                if (y < 0) y = 150;
                
                posAttr.array[i * 3 + 1] = y;
                posAttr.array[i * 3] = x;
                posAttr.array[i * 3 + 2] = z;
            }
            posAttr.needsUpdate = true;
        };

        return cityGroup;
    };

})();
