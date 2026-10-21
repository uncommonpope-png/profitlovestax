(function() {
    'use strict';

    window.spawnAetheriumSkylands = function(scene, opts) {
        opts = opts || {};
        const offsetX = opts.offsetX || 1500;
        const offsetY = opts.offsetY || 0;
        const offsetZ = opts.offsetZ || 0;

        const cityGroup = new THREE.Group();
        cityGroup.position.set(offsetX, offsetY, offsetZ);

        console.log('[Aetherium Skylands] City spawned at (' + offsetX + ', ' + offsetY + ', ' + offsetZ + ')');

        // --- Materials ---
        const marbleMat = (window.__genesisStd || function(c){ return new THREE.MeshStandardMaterial(c); })({
            color: 0xeeeeff,
            roughness: 0.3,
            metalness: 0.1
        });
        const stoneMat = (window.__genesisStd || function(c){ return new THREE.MeshStandardMaterial(c); })({
            color: 0x998877,
            roughness: 0.9,
            metalness: 0.0
        });
        const goldMat = (window.__genesisStd || function(c){ return new THREE.MeshStandardMaterial(c); })({
            color: 0xffcc44,
            roughness: 0.2,
            metalness: 0.8
        });
        const deepBlueMat = (window.__genesisStd || function(c){ return new THREE.MeshStandardMaterial(c); })({
            color: 0x2233aa,
            roughness: 0.5,
            metalness: 0.2
        });
        const aetherGlowMat = new THREE.MeshBasicMaterial({
            color: 0x4488ff
        });
        const gardenGlowMat = new THREE.MeshBasicMaterial({
            color: 0x44ff88
        });

        // --- Shared Geometries ---
        const islandGeo = new THREE.CylinderGeometry(1, 0.7, 1, 32);
        const towerGeo = new THREE.CylinderGeometry(1, 1, 1, 16);
        const domeGeo = new THREE.SphereGeometry(1, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2);
        const balconyGeo = new THREE.TorusGeometry(1.2, 0.1, 8, 16);
        const bridgeNodeGeo = new THREE.SphereGeometry(0.5, 8, 8);
        const gardenPodGeo = new THREE.CylinderGeometry(1, 1, 0.2, 16);

        const animatedElements = [];
        const islands = [];
        
        // Setup 9 islands
        const islandData = [];
        for (let i = 0; i < 9; i++) {
            let x = 0;
            let z = 0;
            let y = -20 + Math.random() * 45; // -20 to +25
            let r = 30 + Math.random() * 30; // 30 to 60 radius
            
            if (i > 0) {
                const angle = (i / 8) * Math.PI * 2 + (Math.random() * 0.2);
                const dist = 90 + Math.random() * 80;
                x = Math.cos(angle) * dist;
                z = Math.sin(angle) * dist;
            } else {
                r = 65; // Central island
                y = 0;
            }
            
            islandData.push({ x, y, z, r, phase: Math.random() * Math.PI * 2 });
        }

        // Build Islands and Buildings
        const totalBuildings = 180;
        let buildingCount = 0;

        islandData.forEach((data, index) => {
            const islandGroup = new THREE.Group();
            islandGroup.position.set(data.x, data.y, data.z);
            islandGroup.userData.phase = data.phase;
            islandGroup.userData.baseY = data.y;
            cityGroup.add(islandGroup);
            islands.push(islandGroup);

            // The island platform
            const platformHeight = 3 + Math.random() * 2;
            const platform = new THREE.Mesh(islandGeo, stoneMat);
            platform.scale.set(data.r, platformHeight, data.r);
            platform.position.y = -platformHeight / 2;
            islandGroup.add(platform);
            
            // Central beacon for island 0
            if (index === 0) {
                const beaconHeight = 60;
                const beacon = new THREE.Mesh(towerGeo, marbleMat);
                beacon.scale.set(4, beaconHeight, 4);
                beacon.position.y = beaconHeight / 2;
                islandGroup.add(beacon);

                const beaconTop = new THREE.Mesh(domeGeo, aetherGlowMat);
                beaconTop.scale.set(4.5, 4.5, 4.5);
                beaconTop.position.y = beaconHeight;
                islandGroup.add(beaconTop);

                animatedElements.push({ obj: beaconTop, type: 'beacon' });
            }

            // Distribute buildings on this island
            const bldgCountForIsland = (index === 0) ? 30 : Math.floor((totalBuildings - 30) / 8);
            for (let b = 0; b < bldgCountForIsland; b++) {
                const angle = Math.random() * Math.PI * 2;
                const dist = Math.random() * (data.r * 0.8);
                if (index === 0 && dist < 6) continue; // Keep clear of central beacon
                
                const bX = Math.cos(angle) * dist;
                const bZ = Math.sin(angle) * dist;
                
                const bType = Math.random();
                const bGroup = new THREE.Group();
                bGroup.position.set(bX, 0, bZ);
                islandGroup.add(bGroup);

                if (bType < 0.5) {
                    // Arcology tower
                    const segments = 3 + Math.floor(Math.random() * 4);
                    const segHeight = 4 + Math.random() * 2;
                    const r = 1.5 + Math.random();
                    
                    for (let s = 0; s < segments; s++) {
                        const segY = s * segHeight + (segHeight / 2);
                        const body = new THREE.Mesh(towerGeo, marbleMat);
                        body.scale.set(r, segHeight * 0.9, r);
                        body.position.y = segY;
                        bGroup.add(body);
                        
                        if (s < segments - 1 || Math.random() > 0.5) {
                            const balcony = new THREE.Mesh(balconyGeo, goldMat);
                            balcony.scale.set(r, r, r);
                            balcony.position.y = segY + segHeight * 0.45;
                            balcony.rotation.x = Math.PI / 2;
                            bGroup.add(balcony);
                        }
                    }
                    if (Math.random() > 0.5) {
                        const cap = new THREE.Mesh(domeGeo, deepBlueMat);
                        cap.scale.set(r, r, r);
                        cap.position.y = segments * segHeight;
                        bGroup.add(cap);
                    }
                } else if (bType < 0.8) {
                    // Observation dome
                    const r = 3 + Math.random() * 3;
                    const baseHeight = 2 + Math.random() * 2;
                    
                    const base = new THREE.Mesh(towerGeo, marbleMat);
                    base.scale.set(r, baseHeight, r);
                    base.position.y = baseHeight / 2;
                    bGroup.add(base);
                    
                    const dome = new THREE.Mesh(domeGeo, aetherGlowMat);
                    dome.scale.set(r, r, r);
                    dome.position.y = baseHeight;
                    bGroup.add(dome);
                } else {
                    // Garden pod
                    const r = 2 + Math.random() * 2;
                    const height = 1 + Math.random() * 2;
                    
                    const base = new THREE.Mesh(towerGeo, stoneMat);
                    base.scale.set(r, height, r);
                    base.position.y = height / 2;
                    bGroup.add(base);
                    
                    const top = new THREE.Mesh(gardenPodGeo, gardenGlowMat);
                    top.scale.set(r, 1, r);
                    top.position.y = height;
                    bGroup.add(top);
                    
                    animatedElements.push({ obj: top, type: 'garden' });
                }
            }
        });

        // --- Energy Bridges ---
        const bridges = [];
        // Connect center to 4 others, and some perimeter connections
        const connections = [
            [0, 1], [0, 2], [0, 3], [0, 4],
            [1, 2], [2, 3], [3, 4], [4, 5],
            [5, 6], [6, 7], [7, 8], [8, 1]
        ];

        connections.forEach(pair => {
            const i1 = islandData[pair[0]];
            const i2 = islandData[pair[1]];
            
            const dx = i2.x - i1.x;
            const dy = i2.y - i1.y;
            const dz = i2.z - i1.z;
            const dist = Math.sqrt(dx*dx + dy*dy + dz*dz);
            
            const numNodes = Math.floor(dist / 4);
            const bridgeNodes = [];
            
            for (let n = 1; n < numNodes; n++) {
                const t = n / numNodes;
                const nx = i1.x + dx * t;
                const ny = i1.y + dy * t + Math.sin(t * Math.PI) * (dist * 0.1); // arc
                const nz = i1.z + dz * t;
                
                const node = new THREE.Mesh(bridgeNodeGeo, aetherGlowMat);
                node.position.set(nx, ny, nz);
                cityGroup.add(node);
                bridgeNodes.push(node);
            }
            bridges.push({ nodes: bridgeNodes, i1: islands[pair[0]], i2: islands[pair[1]], p1: i1, p2: i2, dist: dist });
        });

        // --- Particles ---
        const particleCount = 3500;
        const particleGeo = new THREE.BufferGeometry();
        const particlePos = new Float32Array(particleCount * 3);
        const particleTypes = new Float32Array(particleCount);
        
        for (let i = 0; i < particleCount; i++) {
            const r = Math.random() * 200;
            const theta = Math.random() * Math.PI * 2;
            const y = -60 + Math.random() * 120;
            
            particlePos[i*3] = Math.cos(theta) * r;
            particlePos[i*3+1] = y;
            particlePos[i*3+2] = Math.sin(theta) * r;
            
            particleTypes[i] = Math.random(); // 0-0.3: wisp, 0.3-0.7: dust, 0.7-1.0: mote
        }
        
        particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePos, 3));
        particleGeo.setAttribute('type', new THREE.BufferAttribute(particleTypes, 1));
        
        // Custom shader for particles to handle multiple colors/behaviors
        const particleMat = new THREE.ShaderMaterial({
            uniforms: {
                time: { value: 0 },
                colorWisp: { value: new THREE.Color(0xddffff) },
                colorDust: { value: new THREE.Color(0x8844cc) },
                colorMote: { value: new THREE.Color(0xffdd44) }
            },
            vertexShader: `
                uniform float time;
                attribute float type;
                varying vec3 vColor;
                uniform vec3 colorWisp;
                uniform vec3 colorDust;
                uniform vec3 colorMote;
                void main() {
                    vec3 pos = position;
                    if (type < 0.33) {
                        vColor = colorWisp;
                        pos.x += sin(time + pos.y * 0.1) * 2.0;
                        pos.z += cos(time + pos.y * 0.1) * 2.0;
                    } else if (type < 0.66) {
                        vColor = colorDust;
                        pos.y -= mod(time * 10.0 + pos.x, 120.0);
                        if (pos.y < -60.0) pos.y += 120.0;
                    } else {
                        vColor = colorMote;
                        pos.y += mod(time * 5.0 + pos.z, 120.0);
                        if (pos.y > 60.0) pos.y -= 120.0;
                    }
                    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
                    gl_PointSize = (type < 0.33 ? 4.0 : 2.0) * (300.0 / -mvPosition.z);
                    gl_Position = projectionMatrix * mvPosition;
                }
            `,
            fragmentShader: `
                varying vec3 vColor;
                void main() {
                    vec2 coord = gl_PointCoord - vec2(0.5);
                    if (length(coord) > 0.5) discard;
                    gl_FragColor = vec4(vColor, 1.0);
                }
            `,
            transparent: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });
        
        const particleSystem = new THREE.Points(particleGeo, particleMat);
        cityGroup.add(particleSystem);


        // --- Update Function ---
        cityGroup.userData.update = function(time, delta) {
            // Bob islands
            islands.forEach(island => {
                island.position.y = island.userData.baseY + Math.sin(time + island.userData.phase) * 3;
            });
            
            // Update bridges to match island positions
            bridges.forEach(bridge => {
                const p1 = bridge.i1.position;
                const p2 = bridge.i2.position;
                const dx = p2.x - p1.x;
                const dy = p2.y - p1.y;
                const dz = p2.z - p1.z;
                
                const numNodes = bridge.nodes.length + 1;
                bridge.nodes.forEach((node, idx) => {
                    const t = (idx + 1) / numNodes;
                    const nx = p1.x + dx * t;
                    const ny = p1.y + dy * t + Math.sin(t * Math.PI) * (bridge.dist * 0.1);
                    const nz = p1.z + dz * t;
                    node.position.set(nx, ny, nz);
                    
                    // Pulse scale
                    const pulse = 1 + Math.sin(time * 5 + t * 10) * 0.3;
                    node.scale.set(pulse, pulse, pulse);
                });
            });
            
            // Animate building elements
            animatedElements.forEach(el => {
                if (el.type === 'beacon') {
                    el.obj.rotation.y += delta * 0.5;
                } else if (el.type === 'garden') {
                    el.obj.rotation.y += delta * 0.2;
                }
            });
            
            // Update particles
            particleMat.uniforms.time.value = time;
        };

        return cityGroup;
    };
})();
