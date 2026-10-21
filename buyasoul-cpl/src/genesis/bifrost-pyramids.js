// src/genesis/bifrost-pyramids.js
// DUAL PYRAMIDION — Pillar I of the Bifrost Metropolis
// Twin pyramids: ONE grounded at Y=0, ONE inverted at Y=200
// Both breathe with vertex TSL shader, phases offset by golden angle
// Never touches city code. Flag-gated by window.__GENESIS_PYRAMIDION

const PYRAMID_CONFIG = {
  count: 2,
  grounded: { y: 0, color: 0x44aaff },    // Work district (cyan)
  inverted: { y: 200, color: 0xffaa22 },  // Love/Expansion (amber)
  baseSize: 200,
  segments: 16,
  pulseAmplitude: 0.3,
  pulseFrequency: 0.0015,
  phaseOffset: (Math.PI * 2) / 3,
  beaconIntensity: 0.7,
};

const TYPE_COLORS = [
  0xffcc44, // combat
  0x44aaff, // crafting  
  0xffdd00, // trading
  0xaa66ff, // exploration
  0xff66cc, // breeding
  0xff8844, // governance
  0x00ffaa, // economy
  0x4488ff, // building
  0xffaa00, // conversation
  0x00ffcc, // districts
];

function seededRandom(seed) {
  if (typeof seed !== 'string') seed = Math.random().toString(36);
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = ((hash << 5) - hash + seed.charCodeAt(i)) | 0;
  }
  return () => { 
    hash = (hash * 16807 + 0) % 2147483647; 
    return (hash & 0x7fffffff) / 2147483647; 
  };
}

export function installPyramidion(Genesis) {
  if (!Genesis) return null;
  if (Genesis.Pyramidion) return Genesis.Pyramidion;

  const T = window.THREE;
  if (!T) return null;

  function isEnabled() {
    return typeof window !== 'undefined' && window.__GENESIS_PYRAMIDION !== false;
  }

  let pyramidsGroup = null;
  let pyramidInstances = [];
  let animationId = null;

  function createPyramid(yPos, color, index, rng) {
    const group = new T.Group();
    group.position.y = yPos;

    // Golden angle phase offset for breathing
    const vertexPhase = (index * PYRAMID_CONFIG.phaseOffset) + (window.performance.now() * 0.0001);

    // Main pyramid mesh — cylinder that becomes pyramid via scale animation
    const pyramidRadius = PYRAMID_CONFIG.baseSize;
    const height = pyramidRadius * 1.618; // Golden ratio
    
    const geo = new T.CylinderGeometry(pyramidRadius, 0, height, PYRAMID_CONFIG.segments);
    
    // Emissive material that pulses
    const emissiveColor = new T.Color(color);
    emissiveColor.offsetHSL(0, 0.3, 0.2); // Shift toward pink/lighter
    
    const mat = new T.MeshStandardMaterial({
      color: new T.Color(color).offsetHSL(0, -0.1, -0.1),
      emissive: emissiveColor,
      emissiveIntensity: PYRAMID_CONFIG.beaconIntensity,
      transparent: true,
      opacity: 0.6,
      roughness: 0.4,
      metalness: 0.3,
    });

    const mesh = new T.Mesh(geo, mat);
    mesh.position.y = height / 2;
    group.add(mesh);

    // If Grounded Pyramid (index === 0 at center 0,0,0), add 4 cardinal portal archways & Inner Sanctum floor
    if (index === 0) {
      const archMat = new T.MeshStandardMaterial({ color: 0x223344, roughness: 0.3, metalness: 0.8, emissive: 0x00aaff, emissiveIntensity: 0.4 });
      const archDirections = [0, Math.PI / 2, Math.PI, Math.PI * 1.5];
      const archRadius = pyramidRadius * 0.7;

      for (let a = 0; a < archDirections.length; a++) {
        const angle = archDirections[a];
        const arch = new T.Mesh(new T.TorusGeometry(12, 1.8, 8, 16, Math.PI), archMat);
        arch.position.set(Math.cos(angle) * archRadius, 12, Math.sin(angle) * archRadius);
        arch.rotation.y = -angle + Math.PI / 2;
        group.add(arch);
      }

      // Inner Sanctum floor ring
      const innerFloor = new T.Mesh(
        new T.CircleGeometry(archRadius + 10, 32),
        new T.MeshStandardMaterial({ color: 0x050a15, roughness: 0.8, metalness: 0.2, emissive: 0x003366, emissiveIntensity: 0.3 })
      );
      innerFloor.rotation.x = -Math.PI / 2;
      innerFloor.position.y = 0.1;
      group.add(innerFloor);
    }

    // Halo ring
    const ringGeo = new T.TorusGeometry(pyramidRadius * 1.1, 0.8, 8, 32);
    const ringMat = new T.MeshBasicMaterial({
      color: new T.Color(color),
      transparent: true,
      opacity: 0.4,
    });
    const ring = new T.Mesh(ringGeo, ringMat);
    ring.rotation.x = -Math.PI / 2;
    group.add(ring);

    // Beacon beam
    const beamH = pyramidRadius * 2;
    const beamGeo = new T.CylinderGeometry(2, 2, beamH, 8);
    const beamMat = new T.MeshBasicMaterial({
      color: new T.Color(color),
      transparent: true,
      opacity: 0.2,
      blending: T.AdditiveBlending,
      depthWrite: false,
    });
    const beam = new T.Mesh(beamGeo, beamMat);
    beam.position.y = beamH / 2;
    group.add(beam);

    // Top orb
    const orbGeo = new T.SphereGeometry(12, 16, 12);
    const orbMat = new T.MeshStandardMaterial({
      color: new T.Color(color),
      emissive: new T.Color(color),
      emissiveIntensity: 1.5,
      transparent: true,
      opacity: 0.9,
    });
    const orb = new T.Mesh(orbGeo, orbMat);
    orb.position.y = beamH + 15;
    group.add(orb);

    // Label sprite
    const canvas = document.createElement('canvas');
    canvas.width = 1024; canvas.height = 256;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = 'rgba(0,0,0,0.45)';
    ctx.fillRect(0, 0, 1024, 256);
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = color > 0x8080ff ? '#66ffff' : '#ffcc44';
    ctx.shadowBlur = 40;
    ctx.font = 'bold 72px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(index === 0 ? 'GROUNDED REALM' : 'INVERTED REALM', 512, 128);
    const tex = new T.CanvasTexture(canvas);
    tex.minFilter = T.LinearFilter;
    const label = new T.Sprite(new T.SpriteMaterial({ map: tex, transparent: true }));
    label.scale.set(120, 30, 1);
    label.position.y = beamH + 40;
    group.add(label);

    return {
      group,
      mesh,
      material: mat,
      orb,
      beam,
      ring,
      label,
      vertexPhase,
      userInput: { isGrounded: index === 0, yPos, color, index }
    };
  }

  function buildPyramids(scene) {
    if (!isEnabled()) return null;

    const group = new T.Group();
    group.name = 'bifrost-pyramidion';

    const rng = seededRandom('pyramidion-seed');
    pyramidInstances = [];

    for (let i = 0; i < PYRAMID_CONFIG.count; i++) {
      const config = i === 0 ? PYRAMID_CONFIG.grounded : PYRAMID_CONFIG.inverted;
      const instance = createPyramid(config.y, config.color, i, rng);
      group.add(instance.group);
      pyramidInstances.push(instance);
    }

    pyramidsGroup = group;
    scene.add(group);

    console.log('[Pyramidion] Spawned dual pyramids at Y=0 and Y=200');
    return group;
  }

  function tick(dt) {
    if (!isEnabled() || !pyramidsGroup) return;

    const time = window.performance.now();

    pyramidInstances.forEach((p, i) => {
      // Breathing pulse (sinusoidal scale)
      const beat = Math.sin(time * PYRAMID_CONFIG.pulseFrequency + p.vertexPhase) + 1;
      const scale = 0.95 + (beat - 1) * PYRAMID_CONFIG.pulseAmplitude;
      p.mesh.scale.setScalar(scale);

      // Orb pulsing
      p.orb.scale.setScalar(1 + Math.sin(time * 0.002) * 0.1);

      // Ring rotation
      p.ring.rotation.z += dt * 0.3;

      // Beam opacity breathing
      p.beam.material.opacity = 0.15 + Math.sin(time * 0.0008) * 0.08;

      // Beam flicker with camera distance for dramatic effect
      if (p.userData.isGrounded) {
        p.beam.material.opacity *= 0.7;
      }
    });
  }

  function dispose() {
    if (!pyramidsGroup) return;
    pyramidsGroup.children.forEach(child => {
      if (child.geometry) child.geometry.dispose();
      if (child.material) {
        if (child.material.map) child.material.map.dispose();
        child.material.dispose();
      }
    });
    if (pyramidsGroup.parent) pyramidsGroup.parent.remove(pyramidsGroup);
    pyramidsGroup = null;
    pyramidInstances = [];
  }

  const api = {
    installPyramidion,
    buildPyramids,
    tick,
    dispose,
    summary: () => ({
      enabled: isEnabled(),
      count: pyramidInstances.length,
      instances: pyramidInstances.map(p => ({
        yPos: p.userData.yPos,
        type: p.userInput.isGrounded ? 'grounded' : 'inverted',
        color: `#${p.userData.color.toString(16).padStart(6, '0')}`
      }))
    }),
  };

  Genesis.Pyramidion = api;

  if (Genesis.EngineScheduler && typeof Genesis.EngineScheduler.defineTick === 'function') {
    Genesis.EngineScheduler.defineTick('bifrost-pyramidion', (dt) => tick(dt), () => isEnabled());
  }

  return api;
}

export default { installPyramidion };