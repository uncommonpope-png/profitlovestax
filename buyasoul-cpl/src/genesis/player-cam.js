// player-cam.js — FREE-FLIGHT CAMERA SYSTEM (P77)
// Full 6DOF movement: fly everywhere, look from every angle, see the whole multiverse.
// No boundaries, no ground clamp, no orbit-only lock. The world is open.
//
// Controls:
//   WASD        — move forward/left/backward/right
//   Shift       — run (2.2x speed)
//   Space       — fly up
//   Q / Ctrl    — fly down
//   F           — toggle fly mode (removes ground lock)
//   Mouse drag  — orbit look (yaw + pitch)
//   Scroll      — zoom (adjusts follow distance)
//   G           — toggle free-flight mode (no third-person follow, camera IS the mover)
//   R           — reset camera to default position
//
// Flag: window.__GENESIS_PLAYER_CAM (default ON)
// CASCADE: movement is local/visual only, never mutates world GOVERNANCE.
// THREE r128/r160 compatible — only Camera.lookAt + Vector3 + Raycaster.
(function () {
  function install(Genesis) {
    if (!Genesis) return;
    if (Genesis.PlayerCam) return Genesis.PlayerCam;

    let camera = null;
    let dom = null;
    let scene = null;
    const keys = {};
    let yaw = 0, pitch = 0.3;
    let fly = true;
    let freeFlight = false;
    let dragging = false, lastX = 0, lastY = 0;
    let enabled = false;
    let dist = 14;
    let target = null;
    let playerProxy = null;
    let _prevYaw = 0, _prevPitch = 0;

    // Camera state for free-flight
    let freeCamPos = new THREE.Vector3(0, 12, 20);
    let freeCamLook = new THREE.Vector3(0, 1, 0);

    function flagOn() {
      return (typeof window !== 'undefined') && window.__GENESIS_PLAYER_CAM !== false;
    }
    function THREEOK() {
      return (typeof window !== 'undefined') && window.THREE;
    }

    function ensureTarget(s) {
      if (target) return target;
      if (!THREEOK() || !s) return null;
      const T = window.THREE;
      const geo = new T.SphereGeometry(1.2, 16, 12);
      const mat = new T.MeshStandardMaterial({ color: 0x66ccff, emissive: 0x113355, transparent: true, opacity: 0.3 });
      playerProxy = new T.Mesh(geo, mat);
      playerProxy.name = 'genesis-player-proxy';
      playerProxy.position.set(0, 1.2, 0);
      s.add(playerProxy);
      target = playerProxy;
      return target;
    }

    function onKeyDown(e) {
      const code = e.code || e.key;
      keys[code] = true;
      if (code === 'KeyF' && !e.repeat) fly = !fly;
      if (code === 'KeyG' && !e.repeat) { freeFlight = !freeFlight; if (typeof console !== 'undefined') console.log('[PlayerCam] free-flight:', freeFlight); }
      if (code === 'KeyR' && !e.repeat) resetCamera();
    }
    function onKeyUp(e) { keys[e.code || e.key] = false; }
    let clickStartX = 0, clickStartY = 0;
    let clickTime = 0;
    function onDown(e) { dragging = true; lastX = e.clientX; lastY = e.clientY; clickStartX = e.clientX; clickStartY = e.clientY; clickTime = Date.now(); }
    function onMove(e) {
      if (!dragging) return;
      yaw -= (e.clientX - lastX) * 0.004;
      pitch = Math.max(-1.4, Math.min(1.4, pitch + (e.clientY - lastY) * 0.004));
      lastX = e.clientX; lastY = e.clientY;
    }
    function onUp(e) {
      const dx = e.clientX - clickStartX;
      const dy = e.clientY - clickStartY;
      const dt = Date.now() - clickTime;
      const dist2 = Math.sqrt(dx * dx + dy * dy);
      // Click-to-jump: short click (< 300ms) with minimal drag (< 8px)
      if (dt < 300 && dist2 < 8 && camera && scene) {
        clickToJump(e.clientX, e.clientY);
      }
      dragging = false;
    }
    function onWheel(e) {
      if (!enabled) return;
      e.preventDefault();
      dist = Math.max(3, Math.min(2000, dist + e.deltaY * 0.02));
    }

    function clickToJump(clientX, clientY) {
      if (!camera || !scene) return;
      const T = window.THREE;
      if (!T) return;
      const raycaster = new T.Raycaster();
      const mouse = new T.Vector2(
        (clientX / window.innerWidth) * 2 - 1,
        -(clientY / window.innerHeight) * 2 + 1
      );
      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(scene.children, true);
      // Find first non-sky, non-particle hit
      for (const hit of intersects) {
        if (!hit.object) continue;
        const name = hit.object.name || '';
        const geoType = hit.object.geometry ? hit.object.geometry.type : '';
        // Skip sky dome, particles, sprites, lights, UI elements
        if (name.includes('sky') || name.includes('particle') || name.includes('sprite')) continue;
        if (geoType === 'BufferGeometry' && hit.object.isPoints) continue;
        if (hit.object.isSprite) continue;
        if (hit.object.isLight) continue;
        // Hit valid geometry — teleport there
        const p = hit.point;
        const jumpPos = { x: p.x, y: p.y + 2, z: p.z };
        teleportTo(jumpPos);
        spawnJumpBeam(p);
        return;
      }
    }

    function teleportTo(pos) {
      if (freeFlight) {
        freeCamPos.set(pos.x, pos.y + 5, pos.z);
        freeCamLook.set(pos.x, pos.y + 1, pos.z - 10);
      }
      if (target && target.position) {
        target.position.set(pos.x, pos.y, pos.z);
      }
      if (camera) {
        const dx = Math.sin(yaw) * Math.cos(pitch) * dist;
        const dz = Math.cos(yaw) * Math.cos(pitch) * dist;
        const dy = Math.sin(pitch) * dist + 2;
        camera.position.set(pos.x + dx, pos.y + dy, pos.z + dz);
        camera.lookAt(pos.x, pos.y + 1.5, pos.z);
      }
    }

    function spawnJumpBeam(pos) {
      const T = window.THREE;
      if (!T || !scene) return;
      const group = new T.Group();
      // Vertical beam
      const beamGeo = new T.CylinderGeometry(0.3, 0.3, 20, 6);
      const beamMat = new T.MeshBasicMaterial({ color: 0x66ffff, transparent: true, opacity: 0.6 });
      const beam = new T.Mesh(beamGeo, beamMat);
      beam.position.y = 10;
      group.add(beam);
      // Ground ring
      const ringGeo = new T.TorusGeometry(3, 0.15, 8, 24);
      const ringMat = new T.MeshBasicMaterial({ color: 0x66ffff, transparent: true, opacity: 0.8 });
      const ring = new T.Mesh(ringGeo, ringMat);
      ring.rotation.x = -Math.PI / 2;
      ring.position.y = 0.5;
      group.add(ring);
      // Top flash
      const flashGeo = new T.SphereGeometry(1.5, 12, 8);
      const flashMat = new T.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.9 });
      const flash = new T.Mesh(flashGeo, flashMat);
      flash.position.y = 20;
      group.add(flash);
      // Point light
      const light = new T.PointLight(0x66ffff, 2, 30);
      light.position.y = 10;
      group.add(light);
      group.position.set(pos.x, pos.y, pos.z);
      scene.add(group);
      // Fade out over 1.5s
      const start = performance.now();
      function fadeBeam() {
        const elapsed = (performance.now() - start) / 1500;
        if (elapsed >= 1) { scene.remove(group); return; }
        const a = 1 - elapsed;
        beamMat.opacity = a * 0.6;
        ringMat.opacity = a * 0.8;
        flashMat.opacity = a * 0.9;
        light.intensity = a * 2;
        flash.scale.setScalar(1 + elapsed * 0.5);
        requestAnimationFrame(fadeBeam);
      }
      fadeBeam();
    }

    function bind(domEl, s) {
      if (!domEl || typeof window === 'undefined') return false;
      dom = domEl; scene = s;
      window.addEventListener('keydown', onKeyDown);
      window.addEventListener('keyup', onKeyUp);
      dom.addEventListener('mousedown', onDown);
      window.addEventListener('mousemove', onMove);
      window.addEventListener('mouseup', onUp);
      dom.addEventListener('wheel', onWheel, { passive: false });
      return true;
    }
    function unbind() {
      if (typeof window === 'undefined' || !dom) return;
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      dom.removeEventListener('mousedown', onDown);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      dom.removeEventListener('wheel', onWheel);
    }

    function resetCamera() {
      yaw = 0; pitch = 0.3; dist = 14; freeFlight = false;
      if (target && target.position) {
        target.position.set(0, 1.2, 0);
      }
      freeCamPos.set(0, 12, 20);
      freeCamLook.set(0, 1, 0);
    }

    function tick(dt, serial, ctx) {
      if (!flagOn() || !enabled) return;
      if (!THREEOK() || !camera) return;
      const T = window.THREE;
      const s = ctx && ctx.scene || scene;
      if (!target && !playerProxy) ensureTarget(s);
      if (!target) return;

      dt = Math.min(0.05, dt || 0.016);
      const run = (keys['ShiftLeft'] || keys['ShiftRight']) ? 2.2 : 1;
      const sp = dt * 14 * run;

      // Movement direction relative to yaw
      let fx = 0, fz = 0;
      if (keys['KeyW'] || keys['ArrowUp']) fz -= 1;
      if (keys['KeyS'] || keys['ArrowDown']) fz += 1;
      if (keys['KeyA'] || keys['ArrowLeft']) fx -= 1;
      if (keys['KeyD'] || keys['ArrowRight']) fx += 1;

      const ca = Math.cos(yaw), sa = Math.sin(yaw);
      const moveX = fx * ca - fz * sa;
      const moveZ = fx * sa + fz * ca;

      if (freeFlight) {
        // Free-flight: camera IS the mover, no third-person follow
        if (moveX || moveZ || keys['Space'] || keys['KeyQ']) {
          const forward = new THREE.Vector3(moveX, 0, moveZ).normalize();
          if (keys['Space']) forward.y = 1;
          if (keys['KeyQ']) forward.y = -1;
          const len = forward.length();
          if (len > 0) forward.divideScalar(len);
          freeCamPos.add(forward.multiplyScalar(sp * (keys['Space'] || keys['KeyQ'] ? 1.5 : 1)));
          freeCamLook.add(forward.clone().multiplyScalar(sp * 0.5));
        }
        // Orbiting during free-flight (right-click drag rotates camera around look point)
        camera.position.copy(freeCamPos);
        camera.lookAt(freeCamLook);
      } else {
        // Third-person mode: move the target, camera follows
        if (moveX || moveZ) {
          target.position.x += moveX * sp;
          target.position.z += moveZ * sp;
        }
        if (keys['Space']) target.position.y = Math.min(200, target.position.y + sp * 1.5);
        if (keys['KeyQ']) target.position.y = Math.max(-300, target.position.y - sp * 1.5);

        // Third-person follow with orbiting
        const dx = Math.sin(yaw) * Math.cos(pitch) * dist;
        const dz = Math.cos(yaw) * Math.cos(pitch) * dist;
        const dy = Math.sin(pitch) * dist + 2;
        camera.position.set(target.position.x + dx, target.position.y + dy, target.position.z + dz);
        camera.lookAt(target.position.x, target.position.y + 1.5, target.position.z);
      }

      // Sync player proxy position for reference
      if (playerProxy && target.position) {
        playerProxy.position.copy(target.position);
      }
    }

    const PlayerCam = {
      flag: '__GENESIS_PLAYER_CAM',
      isEnabled() { return flagOn(); },
      isFreeFlight() { return freeFlight; },
      setFreeFlight(v) { freeFlight = !!v; },
      attach(cam, domEl, s) {
        camera = cam || null;
        scene = s || null;
        if (s) ensureTarget(s);
        if (domEl) bind(domEl, s);
        enabled = !!camera;
        return enabled;
      },
      detach() { unbind(); enabled = false; target = null; playerProxy = null; },
      getTarget() { return target; },
      getPlayerPosition() {
        try {
          if (target && target.position) return { x: target.position.x || 0, y: target.position.y || 0, z: target.position.z || 0 };
        } catch (_) {}
        return { x: 0, y: 1.2, z: 0 };
      },
      setPlayerPosition(pos, opts) {
        opts = opts || {};
        if (!target) ensureTarget(opts.scene || (typeof window !== 'undefined' && window.Genesis && window.Genesis.scene));
        if (!target || !target.position) return false;
        pos = pos || {};
        const x = Number(pos.x || 0);
        const y = Number(pos.y == null ? 1.2 : pos.y);
        const z = Number(pos.z || 0);
        target.position.set(x, y, z);
        freeCamPos.set(x + dist * Math.sin(yaw), y + 5, z + dist * Math.cos(yaw));
        if (camera && camera.position) {
          camera.position.set(x + dist * Math.sin(yaw) * Math.cos(pitch), y + 5 + Math.sin(pitch) * dist, z + dist * Math.cos(yaw) * Math.cos(pitch));
          try { camera.lookAt(opts.lookAt || { x, y: y + 1.4, z }); } catch (_) {}
        }
        return true;
      },
      flyTo(pos) {
        if (!pos || !camera) return false;
        const T = window.THREE;
        if (!T) return false;
        const p = new T.Vector3(Number(pos.x) || 0, Number(pos.y) || 10, Number(pos.z) || 0);
        freeCamPos.copy(p);
        freeCamLook.copy(p).add(new T.Vector3(0, 0, -1));
        target.position.copy(p);
        return true;
      },
      teleportTo,
      clickToJump,
      tick,
      summary() {
        return { enabled: flagOn(), attached: enabled, hasTarget: !!target, fly, freeFlight, yaw, pitch, dist };
      }
    };

    Genesis.PlayerCam = PlayerCam;

    if (Genesis.EngineScheduler && typeof Genesis.EngineScheduler.defineTick === 'function') {
      Genesis.EngineScheduler.defineTick('player-cam', function (dt) { tick(dt, 0, {}); },
        function () { return flagOn(); });
    }
    if (Genesis.GenesisKernel && typeof Genesis.GenesisKernel.registerSystem === 'function') {
      Genesis.GenesisKernel.registerSystem('player-cam', function (dt) { tick(dt || 0, 0, {}); });
    }
    if (typeof Genesis.registerModule === 'function') {
      Genesis.registerModule('player-cam', { status: 'validated', path: './src/genesis/player-cam.js', freeFlight: true });
    }
    return PlayerCam;
  }

  if (typeof module !== 'undefined' && module.exports) module.exports = { install };
  if (typeof window !== 'undefined' && window.Genesis) install(window.Genesis);
})();