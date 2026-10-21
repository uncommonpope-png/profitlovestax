/**
 * god-powers-toolbar.js
 * BUYASOUL CPL / GODFORGE — WorldBox Divine God Powers & Trait Engine
 * 
 * Provides:
 *   1. WorldBox Divine Powers Toolbar UI (Bottom Right).
 *   2. Divine Powers: Lightning Strike, Blood Rain Healing, Meteor Disaster, Spite Civil War, Madness Ray.
 *   3. Unit Trait Editor: Grant Giant (+200% HP), Immortal, Super Speed.
 */

(function() {
  'use strict';

  const T = window.THREE;

  let activePower = null;

  // ─── DIVINE POWERS TOOLBAR UI ───────────────────────────────────────

  function createGodPowersToolbarUI() {
    const bar = document.createElement('div');
    bar.id = 'godforge-god-powers-bar';
    Object.assign(bar.style, {
      position: 'fixed',
      bottom: '20px',
      left: '50%',
      transform: 'translateX(-50%)',
      background: 'rgba(6, 10, 20, 0.92)',
      border: '1px solid #ffcc00',
      boxShadow: '0 8px 32px rgba(255, 204, 0, 0.3)',
      borderRadius: '30px',
      padding: '8px 18px',
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      zIndex: '9999',
      backdropFilter: 'blur(14px)',
      webkitBackdropFilter: 'blur(14px)'
    });

    const powers = [
      { id: 'lightning', label: '⚡ Lightning', color: '#ffcc00', desc: 'Cast divine 500 damage lightning bolt' },
      { id: 'blood_rain', label: '🌧️ Blood Rain', color: '#ff4444', desc: 'Cast healing rain restoring squad HP' },
      { id: 'meteor', label: '☄️ Meteor', color: '#ff6600', desc: 'Summon crushing fiery meteorite' },
      { id: 'madness', label: '🌀 Madness', color: '#cc00ff', desc: 'Drive enemy units insane to attack their own base' },
      { id: 'grant_giant', label: '👑 Grant Giant', color: '#00ffcc', desc: 'Grant selected unit +200% size and HP' }
    ];

    powers.forEach(p => {
      const btn = document.createElement('button');
      btn.innerText = p.label;
      btn.title = p.desc;
      Object.assign(btn.style, {
        background: 'rgba(255, 255, 255, 0.08)',
        border: `1px solid ${p.color}`,
        color: p.color,
        padding: '8px 14px',
        borderRadius: '20px',
        cursor: 'pointer',
        fontSize: '12px',
        fontWeight: 'bold',
        transition: 'all 0.2s ease'
      });

      btn.onclick = () => {
        if (activePower === p.id) {
          activePower = null;
          btn.style.background = 'rgba(255, 255, 255, 0.08)';
        } else {
          activePower = p.id;
          Array.from(bar.children).forEach(c => c.style.background = 'rgba(255, 255, 255, 0.08)');
          btn.style.background = p.color;
          btn.style.color = '#000000';
          console.log('[GodPowers] Selected Power:', p.id);
        }
      };

      bar.appendChild(btn);
    });

    document.body.appendChild(bar);
  }

  // ─── POWER EXECUTION ON WORLD CLICK ─────────────────────────────────

  function executePowerAt(raycastPoint, scene) {
    if (!activePower || !raycastPoint || !scene) return;

    if (activePower === 'lightning') {
      // ⚡ Lightning Strike
      const flash = new T.Mesh(
        new T.CylinderGeometry(0.5, 3, 100, 8),
        new T.MeshBasicMaterial({ color: 0xffffaa, transparent: true, opacity: 0.9 })
      );
      flash.position.copy(raycastPoint);
      flash.position.y = 50;
      scene.add(flash);

      setTimeout(() => { scene.remove(flash); }, 150);
      
      if (window.RTSEngineCore) {
        const hits = window.RTSEngineCore.getEntitiesInRadius(raycastPoint, 8);
        hits.forEach(ent => ent.takeDamage(500));
        console.log(`[GodPowers] Lightning struck ${hits.length} entities.`);
      } else {
        console.log('[GodPowers] Executed Lightning Strike at', raycastPoint);
      }

    } else if (activePower === 'meteor') {
      // ☄️ Meteor Disaster
      const meteor = new T.Mesh(
        new T.SphereGeometry(6, 12, 12),
        new T.MeshBasicMaterial({ color: 0xff4400 })
      );
      meteor.position.copy(raycastPoint);
      meteor.position.y = 120;
      scene.add(meteor);

      const fallInterval = setInterval(() => {
        meteor.position.y -= 8;
        if (meteor.position.y <= raycastPoint.y + 3) {
          clearInterval(fallInterval);
          scene.remove(meteor);
          
          if (window.RTSEngineCore) {
            const hits = window.RTSEngineCore.getEntitiesInRadius(raycastPoint, 20);
            hits.forEach(ent => ent.takeDamage(800));
            console.log('[GodPowers] Meteor crushed ' + hits.length + ' entities.');
          }
        }
      }, 16);

    } else if (activePower === 'blood_rain') {
      // 🌧️ Blood Rain — healing rain: heals all allies in 15u radius
      const rain = new T.Mesh(
        new T.CircleGeometry(15, 24),
        new T.MeshBasicMaterial({ color: 0xff66aa, transparent: true, opacity: 0.15, side: T.DoubleSide, depthWrite: false })
      );
      rain.position.copy(raycastPoint);
      rain.position.y = 0.2;
      rain.rotation.x = -Math.PI / 2;
      scene.add(rain);
      setTimeout(() => { scene.remove(rain); }, 2000);

      if (window.RTSEngineCore) {
        const hits = window.RTSEngineCore.getEntitiesInRadius(raycastPoint, 15);
        hits.forEach(ent => {
          if (!ent.isDead && ent.hp < ent.maxHp) {
            ent.hp = Math.min(ent.maxHp, ent.hp + 100);
            // Heal visual
            if (ent.mesh) {
              ent.mesh.traverse((c) => {
                if (c.isMesh && c.material && c.material.emissive) {
                  c.material.emissive.setHex(0x66ff66);
                  setTimeout(() => { if (c && c.material) c.material.emissive.setHex(0x000000); }, 300);
                }
              });
            }
          }
        });
        console.log('[GodPowers] Blood Rain healed ' + hits.length + ' allies.');
      }

    } else if (activePower === 'madness') {
      // 🌀 Madness — drive enemies in 12u radius to attack each other for 8s
      if (window.RTSEngineCore) {
        const hits = window.RTSEngineCore.getEntitiesInRadius(raycastPoint, 12);
        hits.forEach(ent => {
          if (!ent.isDead && ent.type === 'unit' && ent.faction !== 'imperium') {
            ent._madnessUntil = Date.now() + 8000;
            ent._originalFaction = ent.faction;
            ent.faction = 'madness';
            // Visual: purple tint
            if (ent.mesh) {
              ent.mesh.traverse((c) => {
                if (c.isMesh && c.material && c.material.emissive) {
                  c.material.emissive.setHex(0xcc00ff);
                }
              });
            }
          }
        });
        console.log('[GodPowers] Madness afflicted ' + hits.length + ' enemies.');
      }

    } else if (activePower === 'grant_giant') {
      // 👑 Grant Giant — make selected entities +200% size, +200% HP
      const sel = window.RTSUICore ? window.RTSUICore.getSelection() : (window.RTSEngineCore ? window.RTSEngineCore.ENTITIES : null);
      if (!sel) return;
      const ids = sel instanceof Set ? sel : new Set(sel);
      ids.forEach(id => {
        const ent = window.RTSEngineCore.getEntity(id);
        if (ent && !ent.isDead && ent.mesh) {
          ent.maxHp *= 3;
          ent.hp = ent.maxHp;
          ent.mesh.scale.setScalar(3);
          ent.radius *= 3;
          console.log('[GodPowers] Granted Giant to entity', ent.id);
        }
      });
    }
  }

  // ─── INITIALIZER ─────────────────────────────────────────────────────

  function install(scene) {
    createGodPowersToolbarUI();

    // Register left-click via the unified input router (consumes click when a power is active)
    if (window.RTSInputRouter) {
      window.RTSInputRouter.registerLeftClick(5, function(ctx) {
        if (activePower && ctx.point) {
          executePowerAt(ctx.point, scene);
          return true; // consumed — don't also select units
        }
        return false;
      });
    } else {
      // Fallback if router not present
      window.addEventListener('pointerdown', (e) => {
        if (e.button === 0 && activePower && window.__godforgeLastRaycastPoint) {
          executePowerAt(window.__godforgeLastRaycastPoint, scene);
        }
      });
    }

    console.log('[GodPowers] WorldBox Divine God Powers Toolbar active.');
  }

  function tick() {
    // Revert madness-faction units after 8 seconds
    if (!window.RTSEngineCore) return;
    const now = Date.now();
    for (const ent of window.RTSEngineCore.ENTITIES.values()) {
      if (ent._madnessUntil && now > ent._madnessUntil) {
        if (ent._originalFaction) ent.faction = ent._originalFaction;
        ent._madnessUntil = null;
        ent._originalFaction = null;
        if (ent.mesh) {
          ent.mesh.traverse((c) => {
            if (c.isMesh && c.material && c.material.emissive) {
              c.material.emissive.setHex(0x000000);
            }
          });
        }
      }
    }
  }

  window.GodPowersEngine = {
    install,
    executePowerAt,
    tick
  };
})();
