(function() {
  'use strict';

  window.spawnAstralSpire = function(scene, opts) {
    opts = opts || {};
    const offsetX = opts.offsetX || 0;
    const offsetZ = opts.offsetZ || 1200;
    
    // Group to hold the city
    const cityGroup = new THREE.Group();
    cityGroup.position.set(offsetX, 0, offsetZ);
    scene.add(cityGroup);

    console.log(`[AstralSpire] City spawned at (${offsetX}, 0, ${offsetZ})`);

    // Materials
    const stoneMat = new THREE.MeshStandardMaterial({ color: 0x444455, roughness: 0.8 });
    const runeMat = new THREE.MeshBasicMaterial({ color: 0x00ffcc });
    const celestialMat = new THREE.MeshBasicMaterial({ color: 0x8844ff });
    const starlightMat = new THREE.MeshBasicMaterial({ color: 0xffffff });

    // Animated elements list
    const animatedElements = [];

    // Central Ancient Monolith Cluster
    const centerGroup = new THREE.Group();
    cityGroup.add(centerGroup);
    
    for (let i = 0; i < 5; i++) {
        const angle = (i / 5) * Math.PI * 2;
        const radius = 12;
        const x = Math.cos(angle) * radius;
        const z = Math.sin(angle) * radius;
        const height = 40 + Math.random() * 20;

        const monolithGroup = new THREE.Group();
        monolithGroup.position.set(x, height / 2, z);
        
        const baseGeom = new THREE.BoxGeometry(5, height, 5);
        const baseMesh = new THREE.Mesh(baseGeom, stoneMat);
        monolithGroup.add(baseMesh);

        // Runes (emissive strips)
        const runeGeom = new THREE.BoxGeometry(5.2, height * 0.8, 0.4);
        const runeMesh = new THREE.Mesh(runeGeom, runeMat);
        monolithGroup.add(runeMesh);
        
        animatedElements.push({
            type: 'pulse',
            mesh: runeMesh,
            baseScale: 1,
            speed: 1 + Math.random(),
            offset: Math.random() * Math.PI * 2
        });

        monolithGroup.lookAt(0, height / 2, 0);
        centerGroup.add(monolithGroup);
    }

    // 6 celestial spheres
    const celestialSpheres = new THREE.Group();
    centerGroup.add(celestialSpheres);
    for (let i = 0; i < 6; i++) {
        const orbitRadius = 25 + Math.random() * 35;
        const sphereGeom = new THREE.SphereGeometry(2 + Math.random() * 3, 16, 16);
        const sphereMesh = new THREE.Mesh(sphereGeom, Math.random() > 0.5 ? celestialMat : starlightMat);
        
        const pivot = new THREE.Group();
        pivot.position.y = 15 + Math.random() * 35;
        sphereMesh.position.set(orbitRadius, 0, 0);
        pivot.add(sphereMesh);
        celestialSpheres.add(pivot);

        animatedElements.push({
            type: 'orbit',
            mesh: pivot,
            speed: (Math.random() - 0.5) * 0.8
        });
    }

    // 3 star-gate ring arches
    for (let i = 0; i < 3; i++) {
        const angle = (i / 3) * Math.PI * 2 + Math.PI / 6;
        const radius = 55;
        const x = Math.cos(angle) * radius;
        const z = Math.sin(angle) * radius;

        const ringGeom = new THREE.TorusGeometry(15, 2, 16, 64);
        const ringMesh = new THREE.Mesh(ringGeom, stoneMat);
        ringMesh.position.set(x, 15, z);
        ringMesh.rotation.y = angle + Math.PI / 2;
        cityGroup.add(ringMesh);

        // inner glow ring
        const innerGeom = new THREE.TorusGeometry(14, 0.5, 8, 32);
        const innerMesh = new THREE.Mesh(innerGeom, runeMat);
        ringMesh.add(innerMesh);

        animatedElements.push({
            type: 'rotate_ring',
            mesh: ringMesh,
            speed: (Math.random() > 0.5 ? 1 : -1) * 0.3
        });
    }

    // 3 Spiral arms for buildings
    const numStructures = 160;
    const arms = 3;
    const structuresPerArm = Math.floor(numStructures / arms);
    
    for (let arm = 0; arm < arms; arm++) {
        const armOffset = (arm / arms) * Math.PI * 2;
        
        for (let i = 0; i < structuresPerArm; i++) {
            // Logarithmic spiral
            const t = (i / structuresPerArm);
            const r = 25 + t * 180; // radius grows
            const theta = armOffset + t * Math.PI * 2.5;
            
            const x = Math.cos(theta) * r;
            const z = Math.sin(theta) * r;
            
            // Randomize position slightly
            const pos = new THREE.Vector3(
                x + (Math.random() - 0.5) * 12,
                0,
                z + (Math.random() - 0.5) * 12
            );

            const bGroup = new THREE.Group();
            bGroup.position.copy(pos);
            bGroup.rotation.y = Math.random() * Math.PI * 2;
            
            const typeRoll = Math.random();
            if (typeRoll < 0.5) {
                // Monolith (tall thin box)
                const h = 10 + Math.random() * 25;
                const b = new THREE.Mesh(new THREE.BoxGeometry(2.5, h, 2.5), stoneMat);
                b.position.y = h / 2;
                bGroup.add(b);
                
                // Add emissive accent
                if (Math.random() > 0.4) {
                    const acc = new THREE.Mesh(new THREE.BoxGeometry(2.7, h * 0.15, 0.4), runeMat);
                    acc.position.y = h * (0.4 + Math.random() * 0.4);
                    bGroup.add(acc);
                }
            } else if (typeRoll < 0.8) {
                // Rune pillar (octagonal cylinder)
                const h = 6 + Math.random() * 12;
                const geom = new THREE.CylinderGeometry(2, 2.5, h, 8);
                const b = new THREE.Mesh(geom, stoneMat);
                b.position.y = h / 2;
                bGroup.add(b);

                // Octahedron crystal on top
                const crystGeom = new THREE.OctahedronGeometry(1.8, 0);
                const cryst = new THREE.Mesh(crystGeom, runeMat);
                cryst.position.y = h + 2.5;
                bGroup.add(cryst);

                animatedElements.push({
                    type: 'float_rotate',
                    mesh: cryst,
                    baseY: h + 2.5,
                    speed: 1 + Math.random()
                });
            } else {
                // Observation altar (flat stepped platforms)
                const steps = 3 + Math.floor(Math.random() * 2);
                for (let step = 0; step < steps; step++) {
                    const stepRadius = 6 - step * 1.5;
                    if (stepRadius > 0) {
                        const stepGeom = new THREE.CylinderGeometry(stepRadius, stepRadius, 1, 16);
                        const stepMesh = new THREE.Mesh(stepGeom, stoneMat);
                        stepMesh.position.y = step * 1 + 0.5;
                        bGroup.add(stepMesh);
                    }
                }
            }
            
            cityGroup.add(bGroup);
        }
    }

    // Particles: 3000
    const particleCount = 3000;
    const pGeo = new THREE.BufferGeometry();
    const pPos = new Float32Array(particleCount * 3);
    const pTypes = new Float32Array(particleCount);
    
    for (let i = 0; i < particleCount; i++) {
        const r = 220 * Math.random();
        const theta = Math.random() * Math.PI * 2;
        pPos[i*3] = Math.cos(theta) * r;
        pPos[i*3+1] = Math.random() * 80;
        pPos[i*3+2] = Math.sin(theta) * r;
        
        pTypes[i] = Math.random(); // 0 to 1
    }
    
    pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
    pGeo.setAttribute('type', new THREE.BufferAttribute(pTypes, 1));
    
    // Custom shader for particles
    const pMat = new THREE.ShaderMaterial({
        uniforms: {
            time: { value: 0 }
        },
        vertexShader: `
            uniform float time;
            attribute float type;
            varying vec3 vColor;
            void main() {
                vec3 pos = position;
                if (type < 0.33) {
                    // cosmic dust (deep purple)
                    vColor = vec3(0.53, 0.27, 1.0);
                    pos.x += sin(time * 0.3 + pos.y) * 3.0;
                    pos.z += cos(time * 0.3 + pos.y) * 3.0;
                } else if (type < 0.66) {
                    // rune sparks (cyan)
                    vColor = vec3(0.0, 1.0, 0.8);
                    float newY = pos.y + time * 8.0;
                    pos.y = mod(newY, 80.0);
                } else {
                    // star fragments (white)
                    vColor = vec3(1.0, 1.0, 1.0);
                    float a = time * 0.15 + pos.y;
                    float r = length(pos.xz);
                    pos.x = cos(a) * r;
                    pos.z = sin(a) * r;
                }
                vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
                gl_PointSize = (type < 0.33 ? 2.5 : (type < 0.66 ? 3.5 : 2.0)) * (150.0 / -mvPosition.z);
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
    
    const particleSystem = new THREE.Points(pGeo, pMat);
    cityGroup.add(particleSystem);

    cityGroup.userData.update = function(time, delta) {
        pMat.uniforms.time.value = time;
        
        for (let el of animatedElements) {
            if (el.type === 'pulse') {
                const scale = 1 + Math.sin(time * el.speed + el.offset) * 0.15;
                el.mesh.scale.set(1, scale, 1);
            } else if (el.type === 'orbit') {
                el.mesh.rotation.y += el.speed * delta;
            } else if (el.type === 'rotate_ring') {
                el.mesh.rotation.z += el.speed * delta;
            } else if (el.type === 'float_rotate') {
                el.mesh.position.y = el.baseY + Math.sin(time * el.speed) * 0.5;
                el.mesh.rotation.y += el.speed * delta;
                el.mesh.rotation.x += el.speed * 0.5 * delta;
            }
        }
    };

    return cityGroup;
  };
})();
