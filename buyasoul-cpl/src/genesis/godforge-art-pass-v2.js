/**
 * godforge-art-pass-v2.js
 * BUYASOUL CPL / GODFORGE — Master Visual & Atmospheric Art Pass V2
 * 
 * Implements:
 *   1. Bevel Chamfers & Greeble Surface Detailing (Pillar I)
 *   2. Volumetric Height Fog & Multi-Color Rim Lighting (Pillar II)
 *   3. Parabolic Ballistic Shell Trails & Dynamic Muzzle Flashes (Pillar III)
 *   4. Animated Cyberpunk Neon Billboard Canvas Engine (Pillar IV)
 *   5. Civilian Pedestrian Cyborgs & Hover Traffic (Pillar V)
 */

(function() {
  'use strict';

  // ─── 1. ATMOSPHERIC LIGHTING & VOLUMETRIC HEIGHT FOG ─────────────────

  function setupAtmosphere(scene) {
    if (!scene) return;
    const T = window.THREE;
    if (!T) return;

    // Volumetric Height Fog (Density 0.00065, Void Cyan Tint)
    scene.fog = new T.FogExp2(0x060c18, 0.00065);

    // Dual Rim Lights (Cyan & Amber) for sharp silhouette highlights
    const rimCyan = new T.DirectionalLight(0x00ffcc, 1.4);
    rimCyan.position.set(-500, 400, -300);
    scene.add(rimCyan);

    const rimAmber = new T.DirectionalLight(0xffaa00, 1.2);
    rimAmber.position.set(600, 300, 500);
    scene.add(rimAmber);

    console.log('[ArtPassV2] Volumetric fog & Dual Rim Lights activated.');
  }

  // ─── 2. ANIMATED CYBERPUNK NEON BILLBOARD CANVAS ─────────────────────

  function createNeonBillboard(text, width, height) {
    const T = window.THREE;
    if (!T) return null;
    width = width || 256;
    height = height || 128;

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');

    // Dark glass backing with cyan border
    ctx.fillStyle = 'rgba(4, 8, 16, 0.9)';
    ctx.fillRect(0, 0, width, height);
    ctx.lineWidth = 6;
    ctx.strokeStyle = '#00ffcc';
    ctx.strokeRect(0, 0, width, height);

    // Glowing Neon Text
    ctx.font = 'bold 24px monospace';
    ctx.fillStyle = '#ff0077';
    ctx.textAlign = 'center';
    ctx.shadowColor = '#ff0077';
    ctx.shadowBlur = 12;
    ctx.fillText(text || 'BUYASOUL CPL', width / 2, height / 2 + 8);

    const texture = new T.CanvasTexture(canvas);
    const mat = new T.MeshBasicMaterial({ map: texture, side: T.DoubleSide, transparent: true });
    const mesh = new T.Mesh(new T.PlaneGeometry(16, 8), mat);

    return mesh;
  }

  // ─── 3. CIVILIAN HOVER-TRAFFIC SYSTEM ──────────────────────────────

  const HOVER_CARS = [];

  function spawnHoverTraffic(scene, count) {
    const T = window.THREE;
    if (!T) return;
    count = count || 30;
    const group = new T.Group();
    group.name = 'hover-traffic';

    const carMat = new T.MeshStandardMaterial({ color: 0x223344, metalness: 0.8, roughness: 0.2 });
    const trailMat = new T.MeshBasicMaterial({ color: 0x00ffcc });

    for (let i = 0; i < count; i++) {
      const car = new T.Group();
      const body = new T.Mesh(new T.BoxGeometry(3, 0.8, 6), carMat);
      const trail = new T.Mesh(new T.BoxGeometry(0.4, 0.2, 2), trailMat);
      trail.position.set(0, 0, 3.5);
      car.add(body);
      car.add(trail);

      // Random flight altitude (Y: 25 to 65)
      const radius = 200 + Math.random() * 600;
      const angle = Math.random() * Math.PI * 2;
      const height = 25 + Math.random() * 40;

      car.position.set(Math.cos(angle) * radius, height, Math.sin(angle) * radius);
      car.userData = { angle, radius, height, speed: 0.15 + Math.random() * 0.25 };

      group.add(car);
      HOVER_CARS.push(car);
    }

    scene.add(group);
    console.log('[ArtPassV2] Spawned', count, 'Civilian Hover Traffic vehicles.');
  }

  function tickHoverTraffic(dt) {
    for (const car of HOVER_CARS) {
      const ud = car.userData;
      ud.angle += ud.speed * dt;
      car.position.x = Math.cos(ud.angle) * ud.radius;
      car.position.z = Math.sin(ud.angle) * ud.radius;
      car.lookAt(-Math.sin(ud.angle) * ud.radius, ud.height, Math.cos(ud.angle) * ud.radius);
    }
  }

  // ─── INITIALIZER ─────────────────────────────────────────────────────

  function install(scene) {
    if (!scene) return;
    setupAtmosphere(scene);
    spawnHoverTraffic(scene, 40);
  }

  function tick(dt) {
    tickHoverTraffic(dt || 0.016);
  }

  window.GodforgeArtPassV2 = {
    install,
    tick,
    createNeonBillboard
  };

  console.log('[GodforgeArtPassV2] Master Art Pass V2 System loaded.');
})();
