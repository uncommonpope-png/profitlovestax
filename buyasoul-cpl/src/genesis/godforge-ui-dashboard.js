/**
 * godforge-ui-dashboard.js
 * BUYASOUL CPL / GODFORGE — Premium Cyberpunk UI Design System & Live Dashboard
 *
 * Provides:
 *   1. Glassmorphism Design System (CSS tokens, neon glow, Outfit typography)
 *   2. War Room button injected into RTSUICore's unified HUD
 *   3. RTS War Room Dashboard Modal (live fleet, resource, faction stats)
 */

(function() {
  'use strict';

  // ─── INJECT GOOGLE FONTS & GLASSMORPHISM STYLES ─────────────────────

  function injectDesignSystem() {
    if (document.getElementById('godforge-ui-styles')) return;

    const fontLink = document.createElement('link');
    fontLink.rel = 'stylesheet';
    fontLink.href = 'https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;700&family=JetBrains+Mono:wght@400;600&display=swap';
    document.head.appendChild(fontLink);

    const style = document.createElement('style');
    style.id = 'godforge-ui-styles';
    style.textContent = `
      :root {
        --gf-bg-glass: rgba(6, 10, 20, 0.82);
        --gf-bg-card: rgba(12, 18, 34, 0.90);
        --gf-border-cyan: rgba(0, 255, 204, 0.35);
        --gf-border-gold: rgba(255, 204, 0, 0.35);
        --gf-neon-cyan: #00ffcc;
        --gf-neon-amber: #ffaa00;
        --gf-neon-magenta: #ff0077;
        --gf-neon-gold: #ffd700;
        --gf-font-main: 'Outfit', -apple-system, sans-serif;
        --gf-font-mono: 'JetBrains Mono', monospace;
      }

      .gf-stat-item {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 13px;
        font-weight: 600;
        letter-spacing: 0.5px;
      }

      .gf-stat-val {
        font-family: var(--gf-font-mono);
        font-weight: 700;
        font-size: 14px;
      }

      .gf-badge-plt {
        background: linear-gradient(135deg, rgba(255, 204, 0, 0.2), rgba(255, 102, 0, 0.2));
        border: 1px solid var(--gf-neon-gold);
        color: var(--gf-neon-gold);
        padding: 2px 8px;
        border-radius: 12px;
        font-size: 11px;
        white-space: nowrap;
      }

      /* War Room Trigger Button */
      #gf-warroom-btn {
        background: linear-gradient(135deg, rgba(0, 255, 204, 0.2), rgba(0, 150, 255, 0.2));
        border: 1px solid var(--gf-neon-cyan);
        color: #ffffff;
        padding: 6px 16px;
        border-radius: 20px;
        font-family: var(--gf-font-main);
        font-size: 12px;
        font-weight: 700;
        letter-spacing: 1px;
        cursor: pointer;
        transition: all 0.25s ease;
        display: flex;
        align-items: center;
        gap: 6px;
        white-space: nowrap;
      }

      #gf-warroom-btn:hover {
        background: linear-gradient(135deg, rgba(0, 255, 204, 0.4), rgba(0, 150, 255, 0.4));
        box-shadow: 0 0 20px rgba(0, 255, 204, 0.5);
        transform: translateY(-1px);
      }

      /* War Room Dashboard Modal */
      #gf-modal-overlay {
        position: fixed;
        inset: 0;
        background: rgba(2, 4, 10, 0.88);
        backdrop-filter: blur(12px);
        -webkit-backdrop-filter: blur(12px);
        z-index: 9500;
        display: none;
        align-items: center;
        justify-content: center;
        animation: gfFadeIn 0.3s ease;
      }

      #gf-modal-overlay.active {
        display: flex;
      }

      .gf-dashboard-card {
        width: 900px;
        max-width: 95vw;
        max-height: 90vh;
        background: var(--gf-bg-card);
        border: 1px solid var(--gf-border-cyan);
        border-radius: 24px;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.8), 0 0 40px rgba(0, 255, 204, 0.12);
        padding: 28px;
        display: flex;
        flex-direction: column;
        gap: 20px;
        font-family: var(--gf-font-main);
        color: #ffffff;
        overflow-y: auto;
      }

      .gf-dash-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        padding-bottom: 16px;
      }

      .gf-dash-title {
        font-size: 20px;
        font-weight: 700;
        letter-spacing: 1.5px;
        color: var(--gf-neon-cyan);
        display: flex;
        align-items: center;
        gap: 10px;
      }

      .gf-dash-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 16px;
      }

      .gf-widget {
        background: rgba(255, 255, 255, 0.03);
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 16px;
        padding: 16px;
        display: flex;
        flex-direction: column;
        gap: 8px;
        transition: border-color 0.3s;
      }

      .gf-widget:hover {
        border-color: rgba(0, 255, 204, 0.3);
      }

      .gf-widget-title {
        font-size: 11px;
        text-transform: uppercase;
        letter-spacing: 1.5px;
        color: #88aacc;
      }

      .gf-widget-val {
        font-size: 26px;
        font-weight: 700;
        font-family: var(--gf-font-mono);
      }

      .gf-widget-sub {
        font-size: 11px;
        opacity: 0.6;
        margin-top: 2px;
      }

      .gf-faction-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 8px 12px;
        background: rgba(255,255,255,0.03);
        border-radius: 10px;
        border: 1px solid rgba(255,255,255,0.06);
        margin-bottom: 6px;
      }

      .gf-faction-name { font-size: 12px; font-weight: 600; }
      .gf-faction-units { font-size: 11px; font-family: var(--gf-font-mono); }
      .gf-faction-hp { font-size: 10px; opacity: 0.6; margin-top: 2px; }

      /* Keyframes */
      @keyframes gfFadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }
    `;
    document.head.appendChild(style);
  }

  // ─── WAR ROOM BUTTON INJECTION ─────────────────────────────────────
  // Polls for the RTSUICore HUD to exist before injecting the button.
  // Never creates a competing top bar.

  let _injectAttempts = 0;

  function tryInjectWarRoomBtn() {
    if (document.getElementById('gf-warroom-btn')) return; // already there
    const hud = document.getElementById('rts-economy-hud');
    if (!hud) {
      // HUD not ready yet — retry up to 60 times (≈3 seconds)
      _injectAttempts++;
      if (_injectAttempts < 60) {
        setTimeout(tryInjectWarRoomBtn, 50);
      } else {
        console.warn('[GodforgeUI] RTSUICore HUD not found after 3s — War Room button not injected.');
      }
      return;
    }

    const btn = document.createElement('button');
    btn.id = 'gf-warroom-btn';
    btn.innerHTML = '<span>⚔️ WAR ROOM</span>';
    btn.onclick = function() {
      refreshWarRoomStats();
      const modal = document.getElementById('gf-modal-overlay');
      if (modal) modal.classList.toggle('active');
    };
    hud.appendChild(btn);
    console.log('[GodforgeUI] War Room button injected into RTSUICore HUD.');
  }

  // ─── LIVE STATS HELPERS ─────────────────────────────────────────────

  function getLiveStats() {
    const stats = {
      playerUnits: 0,
      enemyUnits: 0,
      bioHiveUnits: 0,
      imperiumUnits: 0,
      grandTowerHp: 0,
      grandTowerMaxHp: 0,
      bioHiveAlive: true,
      imperiumAlive: true,
      profit: 0,
      love: 0,
      tax: 0,
      aether: 0
    };

    if (window.RTSEngineCore && window.RTSEngineCore.ENTITIES) {
      for (const ent of window.RTSEngineCore.ENTITIES.values()) {
        if (ent.isDead) continue;
        if (ent.type === 'unit') {
          if (ent.faction === 'voidCovenant') stats.playerUnits++;
          else if (ent.faction === 'bioHive') { stats.enemyUnits++; stats.bioHiveUnits++; }
          else if (ent.faction === 'imperium') { stats.enemyUnits++; stats.imperiumUnits++; }
        }
        if (ent.isGrandTower) {
          stats.grandTowerHp = Math.floor(ent.hp);
          stats.grandTowerMaxHp = Math.floor(ent.maxHp);
        }
        if (ent.isEnemyBase) {
          if (ent.faction === 'bioHive') stats.bioHiveAlive = !ent.isDead;
          if (ent.faction === 'imperium') stats.imperiumAlive = !ent.isDead;
        }
      }
    }

    if (window.RTSEconomySystem && window.RTSEconomySystem.RESOURCES) {
      const r = window.RTSEconomySystem.RESOURCES;
      stats.profit = Math.floor(r.profit || 0);
      stats.love = Math.floor(r.love || 0);
      stats.tax = Math.floor(r.tax || 0);
      stats.aether = Math.floor(r.aether || 0);
    } else if (window.RTSUICore && window.RTSUICore.UI_STATE) {
      const r = window.RTSUICore.UI_STATE.resources;
      stats.profit = Math.floor(r.profit || 0);
      stats.love = Math.floor(r.love || 0);
      stats.tax = Math.floor(r.tax || 0);
      stats.aether = Math.floor(r.aether || 0);
    }

    return stats;
  }

  function refreshWarRoomStats() {
    const s = getLiveStats();

    const setEl = (id, val) => {
      const el = document.getElementById(id);
      if (el) el.textContent = val;
    };

    setEl('gf-wr-player-units', s.playerUnits);
    setEl('gf-wr-enemy-units', s.enemyUnits);
    setEl('gf-wr-profit', '💰 ' + s.profit.toLocaleString());
    setEl('gf-wr-aether', '✦ ' + s.aether.toLocaleString());

    // Grand Tower HP
    const gtEl = document.getElementById('gf-wr-gt-hp');
    if (gtEl) {
      if (s.grandTowerMaxHp > 0) {
        const pct = Math.round((s.grandTowerHp / s.grandTowerMaxHp) * 100);
        gtEl.textContent = s.grandTowerHp.toLocaleString() + ' / ' + s.grandTowerMaxHp.toLocaleString() + ' (' + pct + '%)';
        gtEl.style.color = pct > 50 ? '#00ff88' : pct > 25 ? '#ffcc00' : '#ff3355';
      } else {
        gtEl.textContent = 'Unknown';
      }
    }

    // Faction status
    const bioEl = document.getElementById('gf-wr-biohive');
    if (bioEl) {
      bioEl.textContent = s.bioHiveAlive ? ('🟢 Active — ' + s.bioHiveUnits + ' units') : '💀 Destroyed';
      bioEl.style.color = s.bioHiveAlive ? '#00ff88' : '#666';
    }

    const impEl = document.getElementById('gf-wr-imperium');
    if (impEl) {
      impEl.textContent = s.imperiumAlive ? ('🟢 Active — ' + s.imperiumUnits + ' units') : '💀 Destroyed';
      impEl.style.color = s.imperiumAlive ? '#ffaa44' : '#666';
    }
  }

  // ─── WAR ROOM DASHBOARD MODAL ───────────────────────────────────────

  function createWarRoomModal() {
    if (document.getElementById('gf-modal-overlay')) return;

    const overlay = document.createElement('div');
    overlay.id = 'gf-modal-overlay';
    overlay.innerHTML = `
      <div class="gf-dashboard-card">
        <div class="gf-dash-header">
          <div class="gf-dash-title">
            <span>🛡️</span>
            <span>GODFORGE WAR ROOM</span>
          </div>
          <button id="gf-modal-close" style="background:none;border:none;color:#aaa;font-size:22px;cursor:pointer;line-height:1;padding:4px 8px;border-radius:8px;transition:color 0.2s;" onmouseover="this.style.color='#fff'" onmouseout="this.style.color='#aaa'">✕</button>
        </div>

        <!-- Live stats grid -->
        <div class="gf-dash-grid">
          <div class="gf-widget">
            <div class="gf-widget-title">Your Combat Units</div>
            <div class="gf-widget-val" id="gf-wr-player-units" style="color:#00ffcc;">—</div>
            <div class="gf-widget-sub">Void Covenant forces</div>
          </div>
          <div class="gf-widget">
            <div class="gf-widget-title">Enemy Units Active</div>
            <div class="gf-widget-val" id="gf-wr-enemy-units" style="color:#ff4444;">—</div>
            <div class="gf-widget-sub">Bio Hive + Imperium</div>
          </div>
          <div class="gf-widget">
            <div class="gf-widget-title">Grand Tower HP</div>
            <div class="gf-widget-val" id="gf-wr-gt-hp" style="color:#00ff88;font-size:16px;">—</div>
            <div class="gf-widget-sub">Protect at all costs</div>
          </div>
        </div>

        <!-- Economy row -->
        <div class="gf-dash-grid">
          <div class="gf-widget">
            <div class="gf-widget-title">PLT Profit</div>
            <div class="gf-widget-val" id="gf-wr-profit" style="color:#ffd700;font-size:16px;">—</div>
          </div>
          <div class="gf-widget">
            <div class="gf-widget-title">Aether</div>
            <div class="gf-widget-val" id="gf-wr-aether" style="color:#aa66ff;font-size:16px;">—</div>
          </div>
          <div class="gf-widget">
            <div class="gf-widget-title">Match Status</div>
            <div class="gf-widget-val" style="color:#ff0077;font-size:16px;">ENGAGED</div>
            <div class="gf-widget-sub">Shattered Front warzone</div>
          </div>
        </div>

        <!-- Faction status -->
        <div>
          <div style="font-size:11px;text-transform:uppercase;letter-spacing:1.5px;color:#88aacc;margin-bottom:10px;">Enemy Faction Status</div>
          <div class="gf-faction-row">
            <div>
              <div class="gf-faction-name" style="color:#00ff88;">🧬 Bioluminescent Hive</div>
              <div class="gf-faction-hp">Organic Zerg-type, home: (1200, -500)</div>
            </div>
            <div class="gf-faction-units" id="gf-wr-biohive" style="color:#00ff88;">—</div>
          </div>
          <div class="gf-faction-row">
            <div>
              <div class="gf-faction-name" style="color:#ffaa44;">⚙️ Iron Foundry Imperium</div>
              <div class="gf-faction-hp">Terran heavy-armor, home: (-800, -600)</div>
            </div>
            <div class="gf-faction-units" id="gf-wr-imperium" style="color:#ffaa44;">—</div>
          </div>
        </div>

        <!-- Tactical buttons -->
        <div style="font-size:13px;font-weight:700;letter-spacing:1px;color:#ffcc44;">TACTICAL JUMP</div>
        <div style="display:flex;gap:12px;flex-wrap:wrap;">
          <button class="gf-tac-btn" style="flex:1;min-width:160px;padding:12px;background:rgba(0,255,204,0.1);border:1px solid #00ffcc;color:#00ffcc;border-radius:12px;cursor:pointer;font-weight:700;font-family:var(--gf-font-main);font-size:13px;" onclick="window.__voidJumpPos(900,20,300);window.toggleGodforgeWarRoom();">
            ⚔️ Shattered Front
          </button>
          <button class="gf-tac-btn" style="flex:1;min-width:160px;padding:12px;background:rgba(0,255,136,0.1);border:1px solid #00ff88;color:#00ff88;border-radius:12px;cursor:pointer;font-weight:700;font-family:var(--gf-font-main);font-size:13px;" onclick="window.__voidJumpPos(1200,20,-500);window.toggleGodforgeWarRoom();">
            🧬 Bio Hive Base
          </button>
          <button class="gf-tac-btn" style="flex:1;min-width:160px;padding:12px;background:rgba(255,170,68,0.1);border:1px solid #ffaa44;color:#ffaa44;border-radius:12px;cursor:pointer;font-weight:700;font-family:var(--gf-font-main);font-size:13px;" onclick="window.__voidJumpPos(-800,20,-600);window.toggleGodforgeWarRoom();">
            ⚙️ Iron Foundry
          </button>
          <button class="gf-tac-btn" style="flex:1;min-width:160px;padding:12px;background:rgba(255,204,0,0.1);border:1px solid #ffcc00;color:#ffcc00;border-radius:12px;cursor:pointer;font-weight:700;font-family:var(--gf-font-main);font-size:13px;" onclick="window.__voidJumpPos(-400,20,-900);window.toggleGodforgeWarRoom();">
            🛍️ Marketplace
          </button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);

    // Close button
    const closeBtn = document.getElementById('gf-modal-close');
    if (closeBtn) closeBtn.onclick = function() { overlay.classList.remove('active'); };

    // Click outside to close
    overlay.addEventListener('click', function(e) {
      if (e.target === overlay) overlay.classList.remove('active');
    });

    window.toggleGodforgeWarRoom = function() {
      refreshWarRoomStats();
      overlay.classList.toggle('active');
    };
  }

  // ─── INITIALIZATION ─────────────────────────────────────────────────

  function init() {
    injectDesignSystem();
    createWarRoomModal();
    // Start polling for RTSUICore's HUD to inject War Room button
    tryInjectWarRoomBtn();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  window.GodforgeUI = { init, refreshWarRoomStats, getLiveStats };
})();
