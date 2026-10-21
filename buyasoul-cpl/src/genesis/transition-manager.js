// src/genesis/transition-manager.js
// TRANSITION MANAGER — cinematic bubble-zoom + dip-to-black crossfade between Hub and Realms.
// Phase 1: camera flies to target node while it scales up; others fade out.
// Phase 2: CSS overlay crossfade swaps scenes and repositions camera.
// Disables OrbitControls during flight.

import * as THREE from 'three';

export class TransitionManager {
  constructor(ctx) {
    this.THREE = ctx.THREE || window.THREE;
    this.camera = ctx.camera;
    this.controls = ctx.controls;
    this.renderer = ctx.renderer;
    this.hub = ctx.hub;
    this.onComplete = ctx.onComplete || (() => {});

    this.transitioning = false;
    this.phase = 0;        // 1 = zoom, 2 = crossfade
    this.progress = 0;     // 0..1 across whole transition
    this.duration = 2.4;   // total seconds

    this.fromRealm = null;
    this.toRealm = null;

    this._startPos = new this.THREE.Vector3();
    this._startQuat = new this.THREE.Quaternion();
    this._phase1Target = new this.THREE.Vector3();
    this._realmCamPos = new this.THREE.Vector3();
    this._realmCamLookAt = new this.THREE.Vector3();
    this._swapped = false;
    this._overlay = null;
  }

  _ensureOverlay() {
    if (this._overlay) return;
    const div = document.createElement('div');
    div.style.cssText = [
      'position: fixed', 'top: 0', 'left: 0', 'width: 100%', 'height: 100%',
      'background: #000000', 'opacity: 0', 'pointer-events: none',
      'z-index: 2000', 'transition: none'
    ].join(';');
    document.body.appendChild(div);
    this._overlay = div;
  }

  startTransition(fromRealm, toRealm) {
    if (this.transitioning) return;
    if (!this.hub || !this.camera) {
      if (typeof console !== 'undefined') console.warn('[TransitionManager] Missing hub or camera');
      return;
    }

    this.transitioning = true;
    this.fromRealm = fromRealm || null;
    this.toRealm = toRealm || null;
    this.phase = 1;
    this.progress = 0;
    this._swapped = false;

    this._ensureOverlay();
    if (this._overlay) this._overlay.style.opacity = '0';

    // Disable controls
    if (this.controls) this.controls.enabled = false;

    // Record camera state
    this._startPos.copy(this.camera.position);
    this._startQuat.copy(this.camera.quaternion);

    // Phase 1 target: fly toward the destination node (or hub overview)
    if (toRealm && toRealm.node) {
      const nodePos = new this.THREE.Vector3();
      toRealm.node.getWorldPosition(nodePos);
      const offset = new this.THREE.Vector3(0, 8, 35);
      this._phase1Target.copy(nodePos).add(offset);
    } else if (toRealm && toRealm.isHub) {
      this._phase1Target.set(0, 120, 700);
    } else {
      this._phase1Target.copy(this._startPos);
    }

    // Destination camera pose for the realm (used during swap)
    const cfg = (toRealm && !toRealm.isHub) ? toRealm.config : null;
    if (cfg && cfg.cameraSpawn) {
      this._realmCamPos.set(cfg.cameraSpawn[0], cfg.cameraSpawn[1], cfg.cameraSpawn[2]);
    } else {
      this._realmCamPos.set(0, 20, 80);
    }
    if (cfg && cfg.cameraLookAt) {
      this._realmCamLookAt.set(cfg.cameraLookAt[0], cfg.cameraLookAt[1], cfg.cameraLookAt[2]);
    } else {
      this._realmCamLookAt.set(0, 0, 0);
    }

    if (this.hub.hideReturnButton) this.hub.hideReturnButton();

    if (typeof console !== 'undefined') console.log('[TransitionManager] Start', this.fromRealm?.id || 'hub', '->', this.toRealm?.id || 'hub');
  }

  update(dt) {
    if (!this.transitioning) return;
    const dtClamped = Math.min(dt, 0.05);
    this.progress += dtClamped / this.duration;
    if (this.progress > 1) this.progress = 1;

    if (this.phase === 1) {
      // ---- Phase 1: Bubble Zoom (0% - 60%) ----
      const p = Math.min(this.progress / 0.6, 1);
      const ease = 1 - Math.pow(1 - p, 3); // ease-out cubic

      // Camera flies toward target
      this.camera.position.lerpVectors(this._startPos, this._phase1Target, ease);

      // Look-at blend
      const lookTarget = this._phase1Target.clone();
      const m = new this.THREE.Matrix4().lookAt(this.camera.position, lookTarget, this.camera.up);
      const targetQuat = new this.THREE.Quaternion().setFromRotationMatrix(m);
      this.camera.quaternion.slerp(targetQuat, ease * 0.35);

      // Target node grows (bubble effect)
      if (this.toRealm && this.toRealm.node) {
        const base = this.toRealm.node.userData.baseScale || 1;
        const grow = base * (1 + p * 3.5); // up to 4.5x
        this.toRealm.node.scale.setScalar(grow);
      }

      // Other realms fade out
      for (const r of this.hub.realms) {
        if (!r.node || r === this.toRealm) continue;
        const fade = Math.max(0.08, 1 - p);
        r.node.traverse(obj => {
          if (!obj.material) return;
          if (obj.material.transparent !== undefined) {
            if (obj.userData._origOpacity === undefined) obj.userData._origOpacity = obj.material.opacity;
            obj.material.opacity = (obj.userData._origOpacity || 1) * fade;
          }
          if (obj.material.emissiveIntensity !== undefined) {
            if (obj.userData._origEmissive === undefined) obj.userData._origEmissive = obj.material.emissiveIntensity;
            obj.material.emissiveIntensity = (obj.userData._origEmissive || 1) * fade;
          }
        });
        if (r.ring) r.ring.material.opacity = Math.max(0.05, (r.ring.userData.baseOpacity || 0.45) * fade);
        if (r.beam) r.beam.material.opacity = Math.max(0.02, (r.beam.userData.baseOpacity || 0.1) * fade);
        if (r.label) r.label.material.opacity = Math.max(0.25, fade);
        if (r.icon) r.icon.material.opacity = Math.max(0.3, fade);
      }

      if (this.progress >= 0.6) {
        this.phase = 2;
        this.progress = 0.6;
      }
    } else if (this.phase === 2) {
      // ---- Phase 2: Crossfade (60% - 100%) ----
      const local = (this.progress - 0.6) / 0.4; // 0..1 within phase 2

      // Dip-to-black curve
      let opacity = 0;
      if (local < 0.5) {
        opacity = local * 2; // 0 -> 1
      } else {
        opacity = 1 - (local - 0.5) * 2; // 1 -> 0
      }
      if (this._overlay) this._overlay.style.opacity = String(Math.max(0, Math.min(1, opacity)));

      // Swap at the dip when screen is fully black
      if (local >= 0.45 && !this._swapped) {
        this._swapped = true;
        this._performSwap();
      }

      if (this.progress >= 1) {
        this._finish();
      }
    }
  }

  _performSwap() {
    const isEnteringRealm = this.toRealm && !this.toRealm.isHub;
    const isReturning = this.toRealm && this.toRealm.isHub;

    if (isEnteringRealm) {
      this.hub.mode = 'realm';
      this.hub.activeRealm = this.toRealm;
      // Activate realm instance
      if (this.toRealm.realmInstance) {
        this.toRealm.realmInstance.enter();
      }
      // Place camera inside realm
      this.camera.position.copy(this._realmCamPos);
      const lookM = new this.THREE.Matrix4().lookAt(this._realmCamPos, this._realmCamLookAt, this.camera.up);
      this.camera.quaternion.setFromRotationMatrix(lookM);
      if (this.hub.showReturnButton) this.hub.showReturnButton();
    } else if (isReturning) {
      // Deactivate previous realm
      if (this.fromRealm && this.fromRealm.realmInstance) {
        this.fromRealm.realmInstance.exit();
      }
      this.hub.mode = 'hub';
      this.hub.activeRealm = null;
      this.camera.position.set(0, 120, 700);
      this.camera.lookAt(0, 0, 0);
      if (this.hub.hideReturnButton) this.hub.hideReturnButton();
    } else {
      this.hub.mode = 'hub';
      this.hub.activeRealm = null;
    }

    // Restore all node visuals
    for (const r of this.hub.realms) {
      if (!r.node) continue;
      r.node.scale.setScalar(r.node.userData.baseScale || 1);
      r.node.traverse(obj => {
        if (!obj.material) return;
        if (obj.userData._origOpacity !== undefined) {
          obj.material.opacity = obj.userData._origOpacity;
        }
        if (obj.userData._origEmissive !== undefined) {
          obj.material.emissiveIntensity = obj.userData._origEmissive;
        }
      });
      if (r.ring) r.ring.material.opacity = r.ring.userData.baseOpacity || 0.45;
      if (r.beam) r.beam.material.opacity = r.beam.userData.baseOpacity || 0.1;
      if (r.label) r.label.material.opacity = 1;
      if (r.icon) r.icon.material.opacity = 1;
    }
  }

  _finish() {
    this.transitioning = false;
    this.phase = 0;
    this.progress = 0;
    if (this._overlay) this._overlay.style.opacity = '0';
    if (this.controls) this.controls.enabled = true;
    try {
      this.onComplete(this.fromRealm, this.toRealm);
    } catch (e) {}
    if (typeof console !== 'undefined') console.log('[TransitionManager] Transition complete', this.toRealm?.id || 'hub');
  }

  get isTransitioning() {
    return this.transitioning;
  }
}

// Genesis registry install helper
export function install(Genesis, ctx) {
  if (!Genesis) return null;
  if (Genesis.TransitionManager) return Genesis.TransitionManager;
  const tm = new TransitionManager(ctx || {});
  Genesis.TransitionManager = tm;
  if (typeof Genesis.registerModule === 'function') {
    Genesis.registerModule('transition-manager', { status: 'validated', path: './src/genesis/transition-manager.js' });
  }
  if (typeof console !== 'undefined') console.log('[TransitionManager] Installed');
  return tm;
}
