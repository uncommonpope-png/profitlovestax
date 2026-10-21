(function() {
    'use strict';

    window.spawnResonantVeil = function(scene, opts) {
        opts = opts || {};
        const offsetX = opts.offsetX !== undefined ? opts.offsetX : -600;
        const offsetZ = opts.offsetZ !== undefined ? opts.offsetZ : 400;

        const group = new THREE.Group();
        group.position.set(offsetX, 0, offsetZ);
        if (scene) {
            scene.add(group);
        }

        const animatedObjects = [];

        // Materials
        const crystalMat = (window.__genesisStd || function(c){ return new THREE.MeshStandardMaterial(c); })({ color: 0xddddff, roughness: 0.1, metalness: 0.7, transparent: true, opacity: 0.85 });
        const harmonicMat = new THREE.MeshBasicMaterial({ color: 0x00ffcc });
        const resonanceMat = (window.__genesisStd || function(c){ return new THREE.MeshStandardMaterial(c); })({ color: 0x8844ff, roughness: 0.2, metalness: 0.5, emissive: 0x331166 });
        const voidMat = (window.__genesisStd || function(c){ return new THREE.MeshStandardMaterial(c); })({ color: 0xffffff, roughness: 0.1, emissive: 0x222222 });
        const roseMat = (window.__genesisStd || function(c){ return new THREE.MeshStandardMaterial(c); })({ color: 0xff44aa, roughness: 0.3, emissive: 0x551133 });
        
        const materials = [crystalMat, resonanceMat, voidMat, roseMat];

        // Platforms (8 floating islands)
        const platforms = [];
        const numPlatforms = 8;
        const platformGeo = new THREE.OctahedronGeometry(1, 1);
        
        for (let i = 0; i < numPlatforms; i++) {
            const angle = (i / numPlatforms) * Math.PI * 2;
            const dist = 100 + Math.random() * 80;
            const px = Math.cos(angle) * dist;
            const pz = Math.sin(angle) * dist;
            const py = (Math.random() - 0.5) * 150;
            
            const pSize = 30 + Math.random() * 30;
            const platform = new THREE.Mesh(platformGeo, crystalMat);
            platform.scale.set(pSize, pSize * 0.3, pSize);
            platform.position.set(px, py, pz);
            platform.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
            group.add(platform);
            
            platforms.push({ x: px, y: py, z: pz, size: pSize, mesh: platform });
            
            animatedObjects.push({
                obj: platform,
                type: 'bob',
                baseY: py,
                speed: 0.5 + Math.random() * 0.5,
                amp: 5 + Math.random() * 5,
                offset: Math.random() * Math.PI * 2
            });
        }

        // Light Bridges (6 connections)
        for (let i = 0; i < 6; i++) {
            const p1 = platforms[Math.floor(Math.random() * platforms.length)];
            const p2 = platforms[Math.floor(Math.random() * platforms.length)];
            if (p1 === p2) continue;

            const curve = new THREE.QuadraticBezierCurve3(
                new THREE.Vector3(p1.x, p1.y, p1.z),
                new THREE.Vector3((p1.x + p2.x)/2, Math.max(p1.y, p2.y) + 40, (p1.z + p2.z)/2),
                new THREE.Vector3(p2.x, p2.y, p2.z)
            );
            
            const tubeGeo = new THREE.TubeGeometry(curve, 20, 2, 8, false);
            const bridgeMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.5, wireframe: true });
            const bridge = new THREE.Mesh(tubeGeo, bridgeMat);
            group.add(bridge);
            
            animatedObjects.push({
                obj: bridgeMat,
                type: 'shimmer',
                baseColor: new THREE.Color(0xffffff),
                timeMult: 2.0
            });
        }

        // Central Resonance Core
        const coreGroup = new THREE.Group();
        const coreOctGeo = new THREE.OctahedronGeometry(1, 0);
        for (let i = 0; i < 5; i++) {
            const size = 60 - i * 10;
            const layer = new THREE.Mesh(coreOctGeo, i % 2 === 0 ? resonanceMat : crystalMat);
            layer.scale.set(size, size, size);
            layer.material = layer.material.clone();
            layer.material.wireframe = (i % 2 !== 0);
            coreGroup.add(layer);
            
            animatedObjects.push({
                obj: layer,
                type: 'rotate_axis',
                axis: new THREE.Vector3(Math.random()-0.5, Math.random()-0.5, Math.random()-0.5).normalize(),
                speed: 0.2 + (i * 0.1)
            });
        }
        coreGroup.position.set(0, 50, 0);
        group.add(coreGroup);
        
        animatedObjects.push({
            obj: coreGroup,
            type: 'bob',
            baseY: 50,
            speed: 0.3,
            amp: 10,
            offset: 0
        });

        // Buildings (180 structures)
        const buildingCount = 180;
        const geoOcta = new THREE.OctahedronGeometry(1, 0);
        const geoCone = new THREE.ConeGeometry(1, 1, 4);
        const geoHex = new THREE.CylinderGeometry(1, 1, 1, 6);
        const geoCyl = new THREE.CylinderGeometry(1, 1, 1, 16);
        const geoTorus = new THREE.TorusGeometry(1, 0.1, 8, 24);

        for (let i = 0; i < buildingCount; i++) {
            const p = platforms[i % platforms.length];
            
            const angle = Math.random() * Math.PI * 2;
            const r = Math.random() * (p.size * 0.8);
            const bx = p.x + Math.cos(angle) * r;
            const bz = p.z + Math.sin(angle) * r;
            const by = p.y;

            const bType = Math.floor(Math.random() * 4);
            const bMat = materials[Math.floor(Math.random() * materials.length)];
            const bGroup = new THREE.Group();
            
            let scaleH = 10 + Math.random() * 40;
            let scaleW = 2 + Math.random() * 8;
            
            if (bType === 0) {
                // Crystal monolith (stretched octahedron)
                const mesh = new THREE.Mesh(geoOcta, bMat);
                mesh.scale.set(scaleW, scaleH, scaleW);
                mesh.position.y = scaleH / 2;
                bGroup.add(mesh);
            } else if (bType === 1) {
                // Inverted pyramid
                const mesh = new THREE.Mesh(geoCone, bMat);
                mesh.rotation.x = Math.PI;
                mesh.scale.set(scaleW*2, scaleH, scaleW*2);
                mesh.position.y = scaleH;
                bGroup.add(mesh);
            } else if (bType === 2) {
                // Prism tower (hex cylinder with octahedron cap)
                const base = new THREE.Mesh(geoHex, bMat);
                base.scale.set(scaleW, scaleH, scaleW);
                base.position.y = scaleH / 2;
                bGroup.add(base);
                
                const cap = new THREE.Mesh(geoOcta, crystalMat);
                cap.scale.set(scaleW * 1.5, scaleW * 3, scaleW * 1.5);
                cap.position.y = scaleH + scaleW * 1.5;
                bGroup.add(cap);
            } else {
                // Harmonic pillar
                const core = new THREE.Mesh(geoCyl, bMat);
                core.scale.set(scaleW * 0.5, scaleH, scaleW * 0.5);
                core.position.y = scaleH / 2;
                bGroup.add(core);
                
                for(let j=1; j<=3; j++) {
                    const ring = new THREE.Mesh(geoTorus, harmonicMat);
                    ring.scale.set(scaleW * 2, scaleW * 2, scaleW * 2);
                    ring.position.y = (scaleH / 4) * j;
                    ring.rotation.x = Math.PI / 2;
                    bGroup.add(ring);
                    
                    animatedObjects.push({
                        obj: ring,
                        type: 'pulse',
                        baseScale: scaleW * 2,
                        speed: 2 + j,
                        offset: j
                    });
                }
            }
            
            bGroup.position.set(bx, by, bz);
            group.add(bGroup);
        }

        // Floating Inverted Pyramids (12)
        for (let i = 0; i < 12; i++) {
            const mesh = new THREE.Mesh(geoCone, voidMat);
            mesh.rotation.x = Math.PI;
            const s = 15 + Math.random() * 20;
            mesh.scale.set(s, s*1.5, s);
            
            const px = (Math.random() - 0.5) * 400;
            const py = 100 + Math.random() * 200;
            const pz = (Math.random() - 0.5) * 400;
            mesh.position.set(px, py, pz);
            group.add(mesh);
            
            animatedObjects.push({
                obj: mesh,
                type: 'bob_rotate',
                baseY: py,
                speed: 0.2 + Math.random() * 0.4,
                amp: 15 + Math.random() * 15,
                offset: Math.random() * Math.PI * 2,
                rotSpeed: (Math.random() - 0.5) * 1
            });
        }

        // Particles (3000)
        const particleCount = 3000;
        const posArray = new Float32Array(particleCount * 3);
        const colArray = new Float32Array(particleCount * 3);
        const sizeArray = new Float32Array(particleCount);
        const phaseArray = new Float32Array(particleCount);

        const color1 = new THREE.Color(0xddddff);
        const color2 = new THREE.Color(0x00ffcc);
        const color3 = new THREE.Color(0x8844ff);

        for (let i = 0; i < particleCount; i++) {
            // spherical distribution
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos((Math.random() * 2) - 1);
            const r = 50 + Math.random() * 350;
            
            posArray[i * 3] = r * Math.sin(phi) * Math.cos(theta);
            posArray[i * 3 + 1] = r * Math.cos(phi);
            posArray[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);

            let pCol = color1;
            const rType = Math.random();
            if (rType > 0.6) pCol = color2;
            if (rType > 0.8) pCol = color3;
            
            colArray[i * 3] = pCol.r;
            colArray[i * 3 + 1] = pCol.g;
            colArray[i * 3 + 2] = pCol.b;
            
            sizeArray[i] = Math.random() * 3;
            phaseArray[i] = Math.random() * Math.PI * 2;
        }

        const particleGeo = new THREE.BufferGeometry();
        particleGeo.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
        particleGeo.setAttribute('color', new THREE.BufferAttribute(colArray, 3));
        particleGeo.setAttribute('size', new THREE.BufferAttribute(sizeArray, 1));
        particleGeo.setAttribute('phase', new THREE.BufferAttribute(phaseArray, 1));

        // Custom shader for particles
        const particleMat = new THREE.ShaderMaterial({
            uniforms: {
                time: { value: 0 }
            },
            vertexShader: `
                uniform float time;
                attribute float size;
                attribute float phase;
                attribute vec3 color;
                varying vec3 vColor;
                void main() {
                    vColor = color;
                    vec3 pos = position;
                    // Orbit slightly
                    float angle = time * 0.2 + phase;
                    float s = sin(angle);
                    float c = cos(angle);
                    float x = pos.x * c - pos.z * s;
                    float z = pos.x * s + pos.z * c;
                    pos.x = x;
                    pos.z = z;
                    
                    // Wave pulse
                    float dist = length(pos);
                    float wave = sin(dist * 0.02 - time * 2.0) * 10.0;
                    pos.y += wave;

                    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
                    gl_PointSize = size * (300.0 / -mvPosition.z);
                    gl_Position = projectionMatrix * mvPosition;
                }
            `,
            fragmentShader: `
                varying vec3 vColor;
                void main() {
                    float dist = length(gl_PointCoord - vec2(0.5));
                    if (dist > 0.5) discard;
                    gl_FragColor = vec4(vColor, 1.0 - (dist * 2.0));
                }
            `,
            transparent: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });

        const particles = new THREE.Points(particleGeo, particleMat);
        group.add(particles);

        let totalTime = 0;

        group.userData.update = function(time, delta) {
            totalTime += delta;
            
            particleMat.uniforms.time.value = totalTime;

            for (let i = 0; i < animatedObjects.length; i++) {
                const anim = animatedObjects[i];
                if (anim.type === 'bob') {
                    anim.obj.position.y = anim.baseY + Math.sin(totalTime * anim.speed + anim.offset) * anim.amp;
                } else if (anim.type === 'shimmer') {
                    const c = Math.sin(totalTime * anim.timeMult) * 0.5 + 0.5;
                    anim.obj.color.setHSL(c, 1.0, 0.7);
                } else if (anim.type === 'rotate_axis') {
                    anim.obj.rotateOnAxis(anim.axis, anim.speed * delta);
                } else if (anim.type === 'pulse') {
                    const s = anim.baseScale * (1.0 + Math.sin(totalTime * anim.speed + anim.offset) * 0.2);
                    anim.obj.scale.set(s, s, s);
                } else if (anim.type === 'bob_rotate') {
                    anim.obj.position.y = anim.baseY + Math.sin(totalTime * anim.speed + anim.offset) * anim.amp;
                    anim.obj.rotation.y += anim.rotSpeed * delta;
                }
            }
        };

        console.log('[ResonantVeil] City spawned at (' + offsetX + ', 0, ' + offsetZ + ')');
        return group;
    };

})();
