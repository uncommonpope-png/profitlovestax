// src/genesis/void-cosmos.js
// VOID COSMOS — the void's own sky, separate from the city's cosmic layer.
// Sun, planet, moon, starfield, nebula, and void sky dome for the Lost Worlds region.
// Never touches index.html or any city code. Called by void-population.js.
// Flag-gated by window.__GENESIS_VOID_COSMOS (default ON).

const COSMOS_CONFIG = {
  starCount: 4000,
  starRadiusMin: 1500,
  starRadiusMax: 3500,
  nebulaCount: 4,
  sunRadius: 6,
  planetRadiusMin: 10,
  planetRadiusMax: 18,
  moonCountPerPlanet: 2,
  moonRadiusMin: 2.5,
  moonRadiusMax: 5,
  skyDomeRadius: 8000,
  skyDomeTint: 0x050510,
  cosmosGroupRadius: 300,
  orbitBaseSpeed: 0.0003,
  pyramidBaseSize: 150,
  pyramidPulseAmplitude: 0.25,
};

const NEBULA_PALETTES = [
  { core: [120, 50, 200], outer: [40, 150, 255] },
  { core: [200, 80, 180], outer: [100, 30, 180] },
  { core: [40, 200, 200], outer: [20, 100, 220] },
  { core: [220, 100, 50], outer: [180, 40, 100] },
];

// PYRAMIDION CONSTANTS
const PYRAMIDION_COLORS = {
  grounded: 0x44aaff,   // cyan — Work district
  inverted: 0xffaa22,   // amber — Love/Expansion
};

function seededRandom(seed) {
  let s = 0;
  for (let i = 0; i < seed.length; i++) s = ((s << 5) - s + seed.charCodeAt(i)) | 0;
  return () => { s = (s * 16807 + 0) % 2147483647; return (s & 0x7fffffff) / 2147483647; };
}

function createNebulaTexture(T, palette) {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  const cx = 256;
  const cy = 256;
  ctx.globalCompositeOperation = 'lighter';
  const outerGrad = ctx.createRadialGradient(cx, cy, 512 * 0.15, cx, cy, 512);
  outerGrad.addColorStop(0, `rgba(${palette.core[0]},${palette.core[1]},${palette.core[2]},0.35)`);
  outerGrad.addColorStop(0.5, `rgba(${palette.outer[0]},${palette.outer[1]},${palette.outer[2]},0.15)`);
  outerGrad.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = outerGrad;
  ctx.fillRect(0, 0, 512, 512);
  const coreGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, 512 * 0.3);
  coreGrad.addColorStop(0, `rgba(${palette.core[0]},${palette.core[1]},${palette.core[2]},0.75)`);
  coreGrad.addColorStop(0.5, `rgba(${palette.core[0]},${palette.core[1]},${palette.core[2]},0.2)`);
  coreGrad.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = coreGrad;
  ctx.fillRect(0, 0, 512, 512);
  ctx.globalCompositeOperation = 'source-over';
  return new T.CanvasTexture(canvas);
}

export function installVoidCosmos(Genesis) {
  if (!Genesis) return null;
  if (Genesis.VoidCosmos) return Genesis.VoidCosmos;

  const T = window.THREE;
  if (!T) return null;

  function flagOn() {
    return typeof window !== 'undefined' && window.__GENESIS_VOID_COSMOS !== false;
  }

  function buildCosmos(worldPositions, scene) {
    if (!worldPositions || worldPositions.length === 0) return null;

    const cosmosGroup = new T.Group();
    cosmosGroup.name = 'void-cosmos';

    const rng = seededRandom('void-cosmos-seed');

    // --- Void Starfield ---
    const starCount = COSMOS_CONFIG.starCount;
    const starGeo = new T.BufferGeometry();
    const starPos = new Float32Array(starCount * 3);
    const starCols = new Float32Array(starCount * 3);
    const starPhases = new Float32Array(starCount);
    for (let i = 0; i < starCount; i++) {
      const r = COSMOS_CONFIG.starRadiusMin + rng() * (COSMOS_CONFIG.starRadiusMax - COSMOS_CONFIG.starRadiusMin);
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      starPos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      starPos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta) * 0.4;
      starPos[i * 3 + 2] = r * Math.cos(phi);
      const hueChoice = rng();
      let hue;
      if (hueChoice < 0.3) hue = 0.55 + rng() * 0.3;
      else if (hueChoice < 0.55) hue = 0.0 + rng() * 0.08;
      else if (hueChoice < 0.75) hue = 0.15 + rng() * 0.1;
      else hue = rng();
      const c = new T.Color().setHSL(hue, 0.5 + rng() * 0.4, 0.4 + rng() * 0.5);
      starCols[i * 3] = c.r;
      starCols[i * 3 + 1] = c.g;
      starCols[i * 3 + 2] = c.b;
      starPhases[i] = Math.random() * Math.PI * 2;
    }
    starGeo.setAttribute('position', new T.BufferAttribute(starPos, 3));
    starGeo.setAttribute('color', new T.BufferAttribute(starCols, 3));
    starGeo.setAttribute('phase', new T.BufferAttribute(starPhases, 1));
    const starMat = new T.PointsMaterial({
      size: 0.6,
      vertexColors: true,
      transparent: true,
      opacity: 0.9,
      blending: T.AdditiveBlending,
      depthWrite: false,
      fog: false,
      sizeAttenuation: true,
    });
    const stars = new T.Points(starGeo, starMat);
    stars.name = 'void-stars';
    cosmosGroup.add(stars);

    // --- Void Nebulae ---
    const nebulae = [];
    NEBULA_PALETTES.forEach((palette, i) => {
      const tex = createNebulaTexture(T, palette);
      const mat = new T.SpriteMaterial({
        map: tex,
        transparent: true,
        blending: T.AdditiveBlending,
        depthWrite: false,
        opacity: 0.15 + rng() * 0.1,
      });
      const sprite = new T.Sprite(mat);
      const angle = (i / NEBULA_PALETTES.length) * Math.PI * 2 + 0.5;
      const dist = 800 + rng() * 600;
      sprite.position.set(
        Math.cos(angle) * dist,
        (rng() - 0.5) * 100,
        Math.sin(angle) * dist
      );
      sprite.scale.set(400 + rng() * 200, 400 + rng() * 200, 1);
      sprite.name = 'void-nebula-' + i;
      cosmosGroup.add(sprite);
      nebulae.push(sprite);
    });

    // --- Suns, Planets, Moons per World ---
    const suns = [];
    const planets = [];
    const moons = [];

    worldPositions.forEach((pos, i) => {
      if (!pos) return;
      const worldIndex = i;

      // --- Sun ---
      const sunGroup = new T.Group();
      const sunColor = TYPE_COLORS_void[i % TYPE_COLORS_void.length];
      const sunRadius = COSMOS_CONFIG.sunRadius;
      const sunGeo = new T.SphereGeometry(sunRadius, 24, 24);
      const sunMat = new T.MeshBasicMaterial({ color: sunColor });
      const sunMesh = new T.Mesh(sunGeo, sunMat);
      sunGroup.add(sunMesh);

      const sunGlowGeo = new T.SphereGeometry(sunRadius * 3, 16, 16);
      const sunGlowMat = new T.SpriteMaterial({
        color: sunColor,
        transparent: true,
        opacity: 0.3,
        blending: T.AdditiveBlending,
        depthWrite: false,
      });
      const sunGlow = new T.Sprite(sunGlowMat);
      sunGlow.scale.set(sunRadius * 6, sunRadius * 6, 1);
      sunGroup.add(sunGlow);

      const sunLight = new T.PointLight(sunColor, 2.0, 500);
      sunGroup.add(sunLight);

      sunGroup.position.copy(pos);
      sunGroup.position.y += 60 + rng() * 40;
      sunGroup.name = 'void-sun-' + i;
      cosmosGroup.add(sunGroup);
      suns.push(sunGroup);

      // --- Planet ---
      const planetGroup = new T.Group();
      const planetHue = rng();
      const planetRadius = COSMOS_CONFIG.planetRadiusMin + rng() * (COSMOS_CONFIG.planetRadiusMax - COSMOS_CONFIG.planetRadiusMin);
      const planetGeo = new T.SphereGeometry(planetRadius, 32, 32);
      const planetColor = new T.Color().setHSL(planetHue, 0.4 + rng() * 0.4, 0.3 + rng() * 0.3);
      const planetEmissive = new T.Color().setHSL(planetHue, 0.6, 0.15);
      const planetMat = new T.MeshStandardMaterial({
        color: planetColor,
        emissive: planetEmissive,
        emissiveIntensity: 0.5,
        roughness: 0.5,
        metalness: 0.2,
      });
      const planetMesh = new T.Mesh(planetGeo, planetMat);
      planetGroup.add(planetMesh);

      const atmosRadius = planetRadius * 1.15;
      const atmosGeo = new T.SphereGeometry(atmosRadius, 32, 32);
      const atmosMat = new T.MeshBasicMaterial({
        color: sunColor,
        transparent: true,
        opacity: 0.08,
        side: T.BackSide,
        depthWrite: false,
      });
      const atmosMesh = new T.Mesh(atmosGeo, atmosMat);
      planetGroup.add(atmosMesh);

      const hasRing = rng() > 0.5;
      if (hasRing) {
        const ringInner = planetRadius * 1.3;
        const ringOuter = planetRadius * 2.2;
        const ringGeo = new T.RingGeometry(ringInner, ringOuter, 48);
        const ringMat = new T.MeshBasicMaterial({
          color: 0xffcc88,
          transparent: true,
          opacity: 0.5,
          side: T.DoubleSide,
          depthWrite: false,
        });
        const ringMesh = new T.Mesh(ringGeo, ringMat);
        ringMesh.rotation.x = Math.PI * 0.3 + rng() * 0.3;
        planetGroup.add(ringMesh);
      }

      planetGroup.position.copy(pos);
      planetGroup.position.x += 70 + rng() * 40;
      planetGroup.position.y += 100 + rng() * 60;
      planetGroup.position.z += 50 + rng() * 40;
      planetGroup.name = 'void-planet-' + i;
      cosmosGroup.add(planetGroup);
      planets.push({ group: planetGroup, mesh: planetMesh, baseY: planetGroup.position.y });

      // --- Moons ---
      for (let m = 0; m < COSMOS_CONFIG.moonCountPerPlanet; m++) {
        const moonGroup = new T.Group();
        const moonRadius = COSMOS_CONFIG.moonRadiusMin + rng() * (COSMOS_CONFIG.moonRadiusMax - COSMOS_CONFIG.moonRadiusMin);
        const moonGeo = new T.SphereGeometry(moonRadius, 16, 16);
        const moonColor = new T.Color().setHSL(rng(), 0.2, 0.5 + rng() * 0.3);
        const moonMat = new T.MeshStandardMaterial({ color: moonColor, roughness: 0.7, metalness: 0.1 });
        const moonMesh = new T.Mesh(moonGeo, moonMat);
        moonGroup.add(moonMesh);

        const orbitSpeed = COSMOS_CONFIG.orbitBaseSpeed * (0.7 + rng() * 0.8);
        const orbitRadius = planetRadius * 2.5 + rng() * planetRadius * 2;
        const orbitInclination = (rng() - 0.5) * 0.6;

        moonGroup.userData = { orbitSpeed, orbitRadius, orbitInclination, offset: rng() * Math.PI * 2, parentPlanetY: planetGroup.position.y };

        moonGroup.name = 'void-moon-' + i + '-' + m;
        planetGroup.add(moonGroup);
        moons.push(moonGroup);
      }
    });

    // --- Void Sky Dome ---
    const skyDomeGeo = new T.SphereGeometry(COSMOS_CONFIG.skyDomeRadius, 24, 16);
    const skyDomeMat = new T.MeshBasicMaterial({
      color: COSMOS_CONFIG.skyDomeTint,
      transparent: true,
      opacity: 0.04,
      side: T.BackSide,
      depthWrite: false,
    });
    const skyDome = new T.Mesh(skyDomeGeo, skyDomeMat);
    skyDome.name = 'void-sky-dome';
    cosmosGroup.add(skyDome);

    scene.add(cosmosGroup);
    return cosmosGroup;
  }

  const TYPE_COLORS_void = [0xffcc44, 0x44aaff, 0xff6644, 0x44ff88, 0xcc44ff, 0xff44aa, 0xffaa22, 0x22ffcc, 0x8866ff, 0xff8833];

  function tickCosmos(dt) {
    if (!flagOn()) return;
    const cosmosGroup = Genesis._voidCosmosGroup;
    if (!cosmosGroup) return;

    cosmosGroup.children.forEach(child => {
      if (child.name && child.name.startsWith('void-moon-')) {
        const ud = child.userData;
        if (ud && ud.orbitSpeed) {
          const angle = Date.now() * ud.orbitSpeed + (ud.offset || 0);
          child.position.x = Math.cos(angle) * ud.orbitRadius;
          child.position.z = Math.sin(angle) * ud.orbitRadius;
          child.position.y = Math.sin(angle * 0.7 + ud.offset) * ud.orbitInclination * ud.orbitRadius * 0.3;
        }
      }
      if (child.name && child.name.startsWith('void-nebula-')) {
        child.rotation.y += dt * 0.00005;
      }
      if (child.name && child.name.startsWith('void-sun-')) {
        const pulse = 1.0 + Math.sin(Date.now() * 0.001) * 0.05;
        child.scale.setScalar(pulse);
      }
      if (child.name && child.name.startsWith('void-planet-')) {
        if (child.children[0]) {
          child.children[0].rotation.y += dt * 0.01;
        }
      }
    });
  }

  function disposeCosmos() {
    const cosmosGroup = Genesis._voidCosmosGroup;
    if (!cosmosGroup) return;
    cosmosGroup.children.forEach(child => {
      child.traverse(obj => {
        if (obj.geometry) obj.geometry.dispose();
        if (obj.material) {
          if (obj.material.map) obj.material.map.dispose();
          obj.material.dispose();
        }
      });
    });
    if (cosmosGroup.parent) cosmosGroup.parent.remove(cosmosGroup);
    Genesis._voidCosmosGroup = null;
  }

  function populateCosmos(worldPositions, scene) {
    if (!flagOn()) return;
    if (Genesis._voidCosmosGroup) disposeCosmos();
    const group = buildCosmos(worldPositions, scene);
    Genesis._voidCosmosGroup = group;
  }

  function spawnPyramidion() {
    if (!flagOn() || !Genesis._voidCosmosGroup) return null;
    if (Genesis._pyramidionGroup) {
      if (Genesis._pyramidionGroup.parent) Genesis._pyramidionGroup.parent.remove(Genesis._pyramidionGroup);
      Genesis._pyramidionGroup = null;
    }

    const group = new T.Group();
    group.name = 'bifrost-pyramidion';

    const pyramidRadius = COSMOS_CONFIG.pyramidBaseSize;
    const height = pyramidRadius * 1.618;

    // Grounded pyramid at Y=0
    const groundGeo = new T.CylinderGeometry(pyramidRadius, 0, height, 24);
    const groundMat = new T.MeshStandardMaterial({
      color: new T.Color(PYRAMIDION_COLORS.grounded),
      emissive: new T.Color(PYRAMIDION_COLORS.grounded),
      emissiveIntensity: 0.5,
      transparent: true,
      opacity: 0.5,
      roughness: 0.4,
      metalness: 0.3,
    });
    const groundPyramid = new T.Mesh(groundGeo, groundMat);
    groundPyramid.position.y = height / 2;
    group.add(groundPyramid);

    // Halo ring for grounded
    const groundRingGeo = new T.RingGeometry(pyramidRadius * 1.1, pyramidRadius * 1.2, 48);
    const groundRingMat = new T.MeshBasicMaterial({ color: PYRAMIDION_COLORS.grounded, transparent: true, opacity: 0.3, side: T.DoubleSide });
    const groundRing = new T.Mesh(groundRingGeo, groundRingMat);
    groundRing.rotation.x = -Math.PI / 2;
    groundRing.position.y = height + 10;
    group.add(groundRing);

    // Inverted pyramid at Y=200
    const invGeo = new T.CylinderGeometry(pyramidRadius * 0.8, 0, height * 0.8, 24);
    const invMat = new T.MeshStandardMaterial({
      color: new T.Color(PYRAMIDION_COLORS.inverted),
      emissive: new T.Color(PYRAMIDION_COLORS.inverted),
      emissiveIntensity: 0.4,
      transparent: true,
      opacity: 0.5,
      roughness: 0.4,
      metalness: 0.3,
    });
    const invPyramid = new T.Mesh(invGeo, invMat);
    invPyramid.position.set(0, 200 + height * 0.4, 0);
    group.add(invPyramid);

    // Halo ring for inverted
    const invRingGeo = new T.RingGeometry(pyramidRadius * 0.9, pyramidRadius * 1.0, 48);
    const invRingMat = new T.MeshBasicMaterial({ color: PYRAMIDION_COLORS.inverted, transparent: true, opacity: 0.3, side: T.DoubleSide });
    const invRing = new T.Mesh(invRingGeo, invRingMat);
    invRing.rotation.x = -Math.PI / 2;
    invRing.position.set(0, 200, 0);
    group.add(invRing);

    Genesis._pyramidionGroup = group;
    Genesis._voidCosmosGroup.add(group);
    Genesis._pyramidInstances = Genesis._pyramidInstances || [];
    Genesis._pyramidInstances = [groundPyramid, invPyramid];

    console.log('[VoidCosmos] Pyramidion spawned: grounded at Y=0, inverted at Y=200');
    return group;
  }

  const api = {
    installVoidCosmos,
    populateCosmos,
    tickCosmos,
    disposeCosmos,
    spawnPyramidion,
    summary: () => ({ enabled: flagOn(), cosmosGroup: !!Genesis._voidCosmosGroup, pyramidion: !!Genesis._pyramidionGroup }),
  };

  Genesis.VoidCosmos = api;

  if (Genesis.EngineScheduler && typeof Genesis.EngineScheduler.defineTick === 'function') {
    Genesis.EngineScheduler.defineTick('void-cosmos', (dt) => tickCosmos(dt), () => flagOn());
  }

  return api;
}

export default { installVoidCosmos };