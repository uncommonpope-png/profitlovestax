// GENESIS ENGINE — Premium Slice (Phase A — subsystem #2)
// Flag-gated dynamic-import mirror of the inline Genesis.PremiumSlice manager.
// When window.__GENESIS_PREMIUM_SLICE === false the inline install is a no-op
// and this module is never loaded. This module builds ONE CC0-pending premium
// street sector (procedural placeholders marking where CC0 GLBs drop in later).
// Loaded via:
//   import('./src/genesis/premium-slice.js').then(m => m.install(window.Genesis, THREE, camera, scene, cityGroup))
// Mirror only — the inline manager in index.html is authoritative.

import * as THREE from 'three';

// install signature matches the other Genesis manager modules. The build()
// routine is invoked by the inline manager only when the slice flag is ON.
export function install(Genesis, THREE, camera, scene, cityGroup) {
  if (!Genesis) return null;

  let built = null; // { root, registeredWithSector, registeredWithVisibility }

  // Reuse the existing procedural facade generator if present on window.
  const getFacade = (typeof window !== 'undefined' && typeof window.getFacadeTexture === 'function')
    ? window.getFacadeTexture
    : null;

  function build() {
    if (built) return built;
    if (!cityGroup) {
      if (typeof console !== 'undefined') console.warn('[PremiumSlice] cityGroup not ready; slice deferred');
      return null;
    }

    const root = new THREE.Group();
    root.name = 'Premium Street Root';

    // Road: plane 40 (length) x 8 (width) at y=0.
    const road = new THREE.Mesh(
      new THREE.PlaneGeometry(40, 8),
      new THREE.MeshStandardMaterial({ color: 0x14151c, roughness: 0.55, metalness: 0.35, emissive: 0x05060a, emissiveIntensity: 0.25 })
    );
    road.name = 'Premium Street Road';
    road.rotation.x = -Math.PI / 2;
    road.position.set(0, 0, 0);
    road.receiveShadow = true;
    road.userData.premiumSlice = 'street';
    root.add(road);

    // Two curbs: thin boxes along the long edges.
    const curbMat = new THREE.MeshStandardMaterial({ color: 0x2a2d3a, roughness: 0.7, metalness: 0.2 });
    for (const z of [-4.1, 4.1]) {
      const curb = new THREE.Mesh(new THREE.BoxGeometry(40, 0.25, 0.3), curbMat);
      curb.name = 'Premium Street Curb ' + (z < 0 ? 'L' : 'R');
      curb.position.set(0, 0.12, z);
      curb.castShadow = true; curb.receiveShadow = true;
      curb.userData.premiumSlice = 'street';
      root.add(curb);
    }

    // A few lamp posts: cylinders.
    const lampMat = new THREE.MeshStandardMaterial({ color: 0x3a3f55, roughness: 0.5, metalness: 0.6, emissive: 0x111522, emissiveIntensity: 0.4 });
    for (let i = -1; i <= 1; i++) {
      const lamp = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.16, 3.2, 8), lampMat);
      lamp.name = 'Premium Street Lamp ' + i;
      lamp.position.set(i * 14, 1.6, 4.6);
      lamp.castShadow = true;
      lamp.userData.premiumSlice = 'street';
      root.add(lamp);
    }

    // One building exterior: box with emissive windows (reuse getFacadeTexture if available).
    let buildingMat;
    if (getFacade) {
      const facadeTex = getFacade('tower', 0x223355, Math.floor(Math.random() * 4));
      if (facadeTex && facadeTex.isTexture) {
        buildingMat = new THREE.MeshStandardMaterial({ map: facadeTex, roughness: 0.6, metalness: 0.3, emissive: 0x0a1430, emissiveIntensity: 0.35 });
      }
    }
    if (!buildingMat) {
      buildingMat = new THREE.MeshStandardMaterial({ color: 0x1b2030, roughness: 0.6, metalness: 0.4, emissive: 0x0a1430, emissiveIntensity: 0.35 });
    }
    const building = new THREE.Mesh(new THREE.BoxGeometry(10, 14, 8), buildingMat);
    building.name = 'Premium Street Building';
    building.position.set(0, 7, -10);
    building.castShadow = true; building.receiveShadow = true;
    building.userData.premiumSlice = 'street';
    root.add(building);

    // Cost + sector metadata so SectorManager/Visibility/ResourceManager can govern it.
    root.userData.cost = { cpu: 2, gpu: 3, memory: 1, updateFreq: 0, priority: 6, sector: 'premium-street', sleep: 'distance' };
    root.userData.premiumSlice = 'street';

    // Attach to scene graph.
    cityGroup.add(root);

    // Register with Sector + Visibility managers (guarded).
    let registeredWithSector = false;
    let registeredWithVisibility = false;
    if (Genesis.SectorManager && typeof Genesis.SectorManager.register === 'function') {
      Genesis.SectorManager.register('premium-street', root, { maxDistance: 200, autoSleep: true });
      registeredWithSector = true;
    }
    if (Genesis.Visibility && typeof Genesis.Visibility.register === 'function') {
      Genesis.Visibility.register('premium-street', root, { priority: 6, maxDistance: 200 });
      registeredWithVisibility = true;
    }

    built = { root, registeredWithSector, registeredWithVisibility };
    if (typeof console !== 'undefined') console.log('[PremiumSlice] street sector built (childCount=' + root.children.length + ')');
    return built;
  }

  function summary() {
    if (!built) return { enabled: true, childCount: 0, registeredWithSector: false, registeredWithVisibility: false, built: false };
    return {
      enabled: true,
      childCount: built.root.children.length,
      registeredWithSector: built.registeredWithSector,
      registeredWithVisibility: built.registeredWithVisibility,
      built: true
    };
  }

  Genesis.PremiumSlice = Object.assign(Genesis.PremiumSlice || {}, { build, summary });
  return Genesis.PremiumSlice;
}

export default { install };
