/**
 * divine-terrain-sculptor.js
 * BUYASOUL CPL / GODFORGE — True God Sandbox Mechanics
 * 
 * Provides god-like powers:
 *   1. Meteor Strike (Smite) - Area of effect damage and crater visual.
 *   2. Raise Terrain (Sculpt) - Extrudes terrain pillars.
 */

(function() {
  'use strict';

  let SCENE_REF = null;

  // ─── GOD POWERS ─────────────────────────────────────────────────────

  function smite(position, radius = 20, damage = 500) {
    if (!SCENE_REF) return;
    const T = window.THREE;
    if (!T) return;

    console.log(`[DivineSculptor] Smite at ${position.x}, ${position.z}`);

    // Visual: Meteor flash
    const geo = new T.SphereGeometry(radius, 16, 16);
    const mat = new T.MeshBasicMaterial({ color: 0xffaa00, transparent: true, opacity: 0.8 });
    const blast = new T.Mesh(geo, mat);
    blast.position.copy(position);
    SCENE_REF.add(blast);

    // Fade out blast
    let t = 0;
    const interval = setInterval(() => {
      t += 0.05;
      blast.scale.setScalar(1 + t);
      blast.material.opacity = 0.8 * (1 - t);
      if (t >= 1) {
        clearInterval(interval);
        SCENE_REF.remove(blast);
      }
    }, 16);

    // Apply Damage
    if (window.RTSEngineCore) {
      const targets = window.RTSEngineCore.getEntitiesInRadius(position, radius);
      for (const target of targets) {
        target.takeDamage(damage);
      }
    }
  }

  function sculptTerrain(position, radius = 10, height = 15) {
    if (!SCENE_REF) return;
    const T = window.THREE;
    if (!T) return;
    
    console.log(`[DivineSculptor] Sculpting terrain at ${position.x}, ${position.z}`);
    
    // Simplistic terrain raising: create a stone cylinder at the position
    const geo = new T.CylinderGeometry(radius, radius * 1.5, height, 16);
    geo.translate(0, height / 2, 0); // Base at y=0
    const mat = new T.MeshStandardMaterial({
      color: 0x555555,
      roughness: 0.9,
      metalness: 0.1
    });
    
    const pillar = new T.Mesh(geo, mat);
    pillar.position.x = position.x;
    pillar.position.z = position.z;
    pillar.position.y = 0;
    
    SCENE_REF.add(pillar);
  }

  // ─── INPUT HANDLING ─────────────────────────────────────────────────

  let raycaster = null;
  let mouse = null;
  let cameraRef = null;

  function initInputs() {
    if (raycaster) return;
    const T = window.THREE;
    if (!T) return;
    raycaster = new T.Raycaster();
    mouse = new T.Vector2();
  }

  function onMouseRightClick(event) {
    if (!cameraRef) return;
    initInputs();
    if (!raycaster) return;
    // We'll use Shift + Right Click for Smite, Alt + Right Click for Sculpt
    if (!event.shiftKey && !event.altKey) return;
    
    event.preventDefault();

    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, cameraRef);
    const T = window.THREE;
    const planeZ = new T.Plane(new T.Vector3(0, 1, 0), 0);
    const target = new T.Vector3();
    
    if (raycaster.ray.intersectPlane(planeZ, target)) {
      if (event.shiftKey) {
        smite(target);
      } else if (event.altKey) {
        sculptTerrain(target);
      }
    }
  }

  // ─── INITIALIZER ─────────────────────────────────────────────────────

  function install(scene, camera) {
    if (!scene || !camera) return;
    SCENE_REF = scene;
    cameraRef = camera;
    initInputs();

    // Register through the unified input router (modifier right-clicks only)
    if (window.RTSInputRouter) {
      window.RTSInputRouter.registerRightClick(0, function(ctx) {
        const e = ctx.e;
        if (!e || (!e.shiftKey && !e.altKey)) return false;
        if (!ctx.point) return false;
        if (e.shiftKey) {
          smite(ctx.point);
          return true;
        } else if (e.altKey) {
          sculptTerrain(ctx.point);
          return true;
        }
        return false;
      });
    } else {
      window.addEventListener('contextmenu', onMouseRightClick, false);
    }

    console.log('[DivineSculptor] True God Sandbox Mechanics active.');
    console.log('   -> Shift + Right Click = Smite (Meteor)');
    console.log('   -> Alt + Right Click = Sculpt (Raise Terrain)');
  }

  window.DivineTerrainSculptor = {
    install,
    smite,
    sculptTerrain
  };
})();
