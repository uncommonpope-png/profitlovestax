(function() {
    'use strict';

    window.spawnGlacialMatrix = function(scene, opts) {
        opts = opts || {};
        const offsetX = opts.offsetX !== undefined ? opts.offsetX : -1500;
        const offsetY = opts.offsetY !== undefined ? opts.offsetY : 0;
        const offsetZ = opts.offsetZ !== undefined ? opts.offsetZ : 300;

        const cityGroup = new THREE.Group();
        cityGroup.position.set(offsetX, offsetY, offsetZ);

        // Materials (strictly MeshStandardMaterial and MeshBasicMaterial)
        const materials = {
            iceBlue: new THREE.MeshStandardMaterial({ 
                color: 0xaaddff, 
                roughness: 0.1, 
                metalness: 0.2, 
                transparent: true, 
                opacity: 0.9, 
                emissive: 0xaaddff, 
                emissiveIntensity: 0.1 
            }),
            deepIce: new THREE.MeshStandardMaterial({ 
                color: 0x4466aa, 
                roughness: 0.2, 
                metalness: 0.1, 
                transparent: true, 
                opacity: 0.85 
            }),
            frostWhite: new THREE.MeshBasicMaterial({ 
                color: 0xeeffff 
            }),
            permafrost: new THREE.MeshStandardMaterial({ 
                color: 0x556677, 
                roughness: 0.8, 
                metalness: 0.1 
            }),
            waterfall: new THREE.MeshStandardMaterial({ 
                color: 0xaaddff, 
                emissive: 0x66ccff, 
                emissiveIntensity: 0.4, 
                transparent: true, 
                opacity: 0.7, 
                side: THREE.DoubleSide,
                map: createNoiseTexture() // Procedural UV animation map
            })
        };

        // Arrays to hold animated elements
        const shimmerNeedles = [];
        const waterfalls = [];
        let cryoCoreMesh = null;
        
        // Base geometries
        const boxGeo = new THREE.BoxGeometry(1, 1, 1);
        const coneGeo = new THREE.ConeGeometry(0.5, 1, 4); // Square cone for angular look
        const hexGeo = new THREE.CylinderGeometry(0.5, 0.5, 1, 6);

        // --- Layout: VORONOI ORGANIC CLUSTERS ---
        const numClusters = 12;
        const clusters = [];
        const maxRadius = 120;
        
        for (let i = 0; i < numClusters; i++) {
            const angle = Math.random() * Math.PI * 2;
            const dist = Math.random() * (maxRadius * 0.8);
            clusters.push({
                x: Math.cos(angle) * dist,
                z: Math.sin(angle) * dist,
                radius: 15 + Math.random() * 20
            });
        }

        // --- Buildings: 190 Structures ---
        const numBuildings = 190;
        
        // Building Types generator
        const createBuilding = (x, z) => {
            const group = new THREE.Group();
            group.position.set(x, 0, z);
            
            const typeProb = Math.random();
            
            if (typeProb < 0.3) {
                // Ice Needles: very tall thin cones
                const height = 15 + Math.random() * 35;
                const mesh = new THREE.Mesh(coneGeo, materials.iceBlue);
                mesh.scale.set(2 + Math.random()*2, height, 2 + Math.random()*2);
                mesh.position.y = height / 2;
                group.add(mesh);
                shimmerNeedles.push(mesh);
            } else if (typeProb < 0.6) {
                // Frozen Fortresses: box bases with ice crystal cone caps
                const w = 4 + Math.random() * 6;
                const d = 4 + Math.random() * 6;
                const baseH = 5 + Math.random() * 10;
                const base = new THREE.Mesh(boxGeo, materials.permafrost);
                base.scale.set(w, baseH, d);
                base.position.y = baseH / 2;
                group.add(base);
                
                const capH = 3 + Math.random() * 5;
                const cap = new THREE.Mesh(coneGeo, materials.deepIce);
                cap.scale.set(w * 1.2, capH, d * 1.2);
                cap.position.y = baseH + capH / 2;
                group.add(cap);
            } else if (typeProb < 0.8) {
                // Glacier Shelves: flat wide boxes with jagged top edges via small cones
                const w = 8 + Math.random() * 10;
                const d = 8 + Math.random() * 10;
                const h = 4 + Math.random() * 4;
                const shelf = new THREE.Mesh(boxGeo, materials.deepIce);
                shelf.scale.set(w, h, d);
                shelf.position.y = h / 2;
                group.add(shelf);
                
                // Jagged edges
                for (let i = 0; i < 5; i++) {
                    const jagH = 1 + Math.random() * 3;
                    const jag = new THREE.Mesh(coneGeo, materials.iceBlue);
                    jag.scale.set(1.5, jagH, 1.5);
                    jag.position.set((Math.random()-0.5)*w*0.8, h + jagH/2, (Math.random()-0.5)*d*0.8);
                    group.add(jag);
                }
            } else {
                // Cryo-Pillars: hexagonal cylinders with ice shard tops
                const h = 10 + Math.random() * 20;
                const radius = 1.5 + Math.random() * 2;
                const pillar = new THREE.Mesh(hexGeo, materials.deepIce);
                pillar.scale.set(radius*2, h, radius*2);
                pillar.position.y = h / 2;
                group.add(pillar);
                
                const shardH = 4 + Math.random() * 6;
                const shard = new THREE.Mesh(coneGeo, materials.frostWhite);
                shard.scale.set(radius*1.5, shardH, radius*1.5);
                shard.position.y = h + shardH / 2;
                group.add(shard);
            }
            
            // Randomly rotate building
            group.rotation.y = Math.random() * Math.PI * 2;
            
            return group;
        };

        // Distribute buildings across clusters
        for (let i = 0; i < numBuildings; i++) {
            const cluster = clusters[Math.floor(Math.random() * clusters.length)];
            const r = Math.random() * cluster.radius;
            const theta = Math.random() * Math.PI * 2;
            const bx = cluster.x + r * Math.cos(theta);
            const bz = cluster.z + r * Math.sin(theta);
            
            // Exclude central area for the Cryo-Core
            if (Math.sqrt(bx*bx + bz*bz) > 15) {
                const bldg = createBuilding(bx, bz);
                cityGroup.add(bldg);
            }
        }

        // --- Central Cryo-Core ---
        const coreGroup = new THREE.Group();
        const coreMat = materials.iceBlue.clone();
        coreMat.emissiveIntensity = 0.5;
        cryoCoreMesh = new THREE.Group(); // We'll pulse the children
        
        // 7 overlapping cones
        for (let i = 0; i < 7; i++) {
            const h = 40 + Math.random() * 20; // up to 60
            const mesh = new THREE.Mesh(coneGeo, coreMat);
            mesh.scale.set(8 + Math.random()*4, h, 8 + Math.random()*4);
            mesh.position.y = h / 2 - (Math.random() * 5); // Some embedded
            
            if (i > 0) {
                // Angle them outwards
                const angle = (i / 6) * Math.PI * 2;
                const tilt = 0.1 + Math.random() * 0.2;
                mesh.position.x = Math.cos(angle) * 3;
                mesh.position.z = Math.sin(angle) * 3;
                mesh.rotation.z = -Math.cos(angle) * tilt;
                mesh.rotation.x = Math.sin(angle) * tilt;
            }
            
            cryoCoreMesh.add(mesh);
        }
        coreGroup.add(cryoCoreMesh);
        cityGroup.add(coreGroup);

        // --- Frozen Waterfalls ---
        const waterfallGeo = new THREE.PlaneGeometry(6, 40, 1, 10);
        for(let i=0; i<4; i++) {
            const angle = (i/4) * Math.PI * 2;
            const dist = 30 + Math.random()*20;
            const wf = new THREE.Mesh(waterfallGeo, materials.waterfall);
            wf.position.set(Math.cos(angle)*dist, 20, Math.sin(angle)*dist);
            wf.lookAt(0, 20, 0); // Face center roughly
            cityGroup.add(wf);
            waterfalls.push(wf);
        }

        // --- Blizzard Fog (Sphere) ---
        const fogSphereGeo = new THREE.SphereGeometry(maxRadius * 1.2, 32, 32);
        const fogMat = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.08,
            side: THREE.BackSide,
            depthWrite: false
        });
        const fogSphere = new THREE.Mesh(fogSphereGeo, fogMat);
        fogSphere.position.y = 30;
        cityGroup.add(fogSphere);

        // --- Particles (4000 total) ---
        const particleCount = 4000;
        const particleGeo = new THREE.BufferGeometry();
        const particlePos = new Float32Array(particleCount * 3);
        const particleTypes = new Float32Array(particleCount); // 0: snowflake, 1: frost, 2: streak

        for (let i = 0; i < particleCount; i++) {
            const px = (Math.random() - 0.5) * 300;
            const py = Math.random() * 100;
            const pz = (Math.random() - 0.5) * 300;
            
            particlePos[i*3] = px;
            particlePos[i*3+1] = py;
            particlePos[i*3+2] = pz;
            
            // Randomly assign types (mostly snowflakes)
            const p = Math.random();
            if (p < 0.6) particleTypes[i] = 0.0;
            else if (p < 0.85) particleTypes[i] = 1.0;
            else particleTypes[i] = 2.0;
        }

        particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePos, 3));
        particleGeo.setAttribute('pType', new THREE.BufferAttribute(particleTypes, 1));

        // Custom shader material for diverse particles
        const particleMat = new THREE.ShaderMaterial({
            uniforms: {
                time: { value: 0 },
                colorSnow: { value: new THREE.Color(0xffffff) },
                colorFrost: { value: new THREE.Color(0xeeffff) },
                colorStreak: { value: new THREE.Color(0xffffff) }
            },
            vertexShader: `
                uniform float time;
                attribute float pType;
                varying float vType;
                varying float vAlpha;
                void main() {
                    vType = pType;
                    vec3 pos = position;
                    vAlpha = 1.0;
                    
                    if (pType < 0.5) { // Snowflake: falling slowly with drift
                        pos.y = mod(pos.y - time * 10.0, 100.0);
                        pos.x += sin(time * 2.0 + pos.y * 0.1) * 2.0;
                        pos.z += cos(time * 1.5 + pos.y * 0.1) * 2.0;
                        gl_PointSize = 2.0;
                    } else if (pType < 1.5) { // Frost: floating
                        pos.y += sin(time * 3.0 + pos.x) * 1.5;
                        pos.x += cos(time * 2.0 + pos.z) * 1.0;
                        gl_PointSize = 3.0;
                    } else { // Streak: fast horizontal
                        pos.x = mod(pos.x + time * 100.0, 300.0) - 150.0;
                        gl_PointSize = 5.0;
                        vAlpha = 0.3;
                    }
                    
                    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
                    gl_Position = projectionMatrix * mvPosition;
                    // Attenuate size by distance
                    gl_PointSize = gl_PointSize * (200.0 / -mvPosition.z);
                }
            `,
            fragmentShader: `
                uniform vec3 colorSnow;
                uniform vec3 colorFrost;
                uniform vec3 colorStreak;
                varying float vType;
                varying float vAlpha;
                void main() {
                    vec2 coord = gl_PointCoord - vec2(0.5);
                    if (length(coord) > 0.5) discard;
                    
                    vec3 col;
                    if (vType < 0.5) col = colorSnow;
                    else if (vType < 1.5) col = colorFrost;
                    else col = colorStreak;
                    
                    gl_FragColor = vec4(col, vAlpha * (0.5 - length(coord)) * 2.0);
                }
            `,
            transparent: true,
            depthWrite: false,
            blending: THREE.AdditiveBlending
        });

        const particleSystem = new THREE.Points(particleGeo, particleMat);
        cityGroup.add(particleSystem);

        // Helper: Procedural Noise Texture for Waterfalls
        function createNoiseTexture() {
            const canvas = document.createElement('canvas');
            canvas.width = 128;
            canvas.height = 128;
            const ctx = canvas.getContext('2d');
            ctx.fillStyle = '#aaddff';
            ctx.fillRect(0, 0, 128, 128);
            for(let i=0; i<1000; i++) {
                ctx.fillStyle = (Math.random() > 0.5) ? '#ffffff' : '#4466aa';
                ctx.globalAlpha = Math.random() * 0.5;
                ctx.fillRect(Math.random()*128, Math.random()*128, Math.random()*10, Math.random()*30); // Vertical streaks
            }
            const tex = new THREE.CanvasTexture(canvas);
            tex.wrapS = THREE.RepeatWrapping;
            tex.wrapT = THREE.RepeatWrapping;
            return tex;
        }

        // --- Animation Loop ---
        let elapsedTime = 0;
        cityGroup.userData.update = function(time, delta) {
            elapsedTime += delta;
            
            // Ice needles shimmer (emissive intensity oscillation)
            shimmerNeedles.forEach((needle, i) => {
                const phase = i * 0.1;
                needle.material.emissiveIntensity = 0.1 + (Math.sin(elapsedTime * 2.0 + phase) * 0.5 + 0.5) * 0.3;
            });
            
            // Cryo-core pulses cool blue
            if (cryoCoreMesh && cryoCoreMesh.children.length > 0) {
                const coreMat = cryoCoreMesh.children[0].material;
                coreMat.emissiveIntensity = 0.3 + (Math.sin(elapsedTime * 3.0) * 0.5 + 0.5) * 0.4;
            }

            // Waterfall UV animation
            waterfalls.forEach(wf => {
                if (wf.material.map) {
                    wf.material.map.offset.y -= delta * 0.5; // Flow downwards
                }
            });

            // Particles animation
            particleMat.uniforms.time.value = elapsedTime;
        };

        scene.add(cityGroup);
        console.log(`[GlacialMatrix] City spawned at (${offsetX}, ${offsetY}, ${offsetZ})`);
        return cityGroup;
    };
})();
