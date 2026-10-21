(function() {
  'use strict';

  let SCENE = null;
  let panelEl = null;
  let selectedBuildingId = null;

  const QUEUES = new Map();

  const UNIT_TEMPLATES = {
    scout:    { name: 'Scout Drone',    cost: 100,             time: 3,  color: 0x00ffcc, hp: 80,  attackDamage: 5,  attackRange: 5,  speed: 6,   desc: 'Fast light scout unit',             unitType: 'scout' },
    marine:   { name: 'Void Raider',    cost: 150,             time: 5,  color: 0xaa00ff, hp: 120, attackDamage: 10, attackRange: 5,  speed: 4.5, desc: 'Medium assault combat unit',        unitType: null },
    spearman: { name: 'Spearman',       cost: { food: 35, wood: 25 }, time: 5,  color: 0x88cc44, hp: 30,  attackDamage: 3,  attackRange: 3,  speed: 3.5, desc: '+150% bonus vs cavalry',            unitType: 'spearman' },
    swordsman:{ name: 'Swordsman',      cost: { food: 60, aether: 20 }, time: 7,  color: 0xddaa33, hp: 40,  attackDamage: 6,  attackRange: 3,  speed: 3.5, desc: 'Solid infantry fighter',            unitType: 'swordsman' },
    archer:   { name: 'Archer',         cost: { food: 25, wood: 45 }, time: 6,  color: 0x44aaff, hp: 30,  attackDamage: 4,  attackRange: 5,  speed: 3,   desc: '+100% bonus vs infantry',           unitType: 'archer' },
    knight:   { name: 'Knight',         cost: { food: 60, aether: 75 }, time: 10, color: 0xff6600, hp: 100, attackDamage: 10, attackRange: 3,  speed: 5.5, desc: '+50% bonus vs archers',             unitType: 'knight' },
  };

  // --- Cost helpers ---
  const COST_ICONS = { food: '🍖', wood: '🪵', aether: '💎', profit: '💰', love: '❤️' };

  function formatCost(cost) {
    if (typeof cost === 'number') return `${cost} PLT`;
    return Object.entries(cost).map(([k, v]) => `${COST_ICONS[k] || ''}${v}`).join(' ');
  }

  function canAfford(cost) {
    if (!window.RTSEconomySystem) return true;
    if (typeof cost === 'number') return window.RTSEconomySystem.spendResource('profit', cost);
    for (const [res, amt] of Object.entries(cost)) {
      if (!window.RTSEconomySystem.spendResource(res, amt)) return false;
    }
    return true;
  }

  function refundCost(cost) {
    if (!window.RTSEconomySystem) return;
    if (typeof cost === 'number') { window.RTSEconomySystem.addResource('profit', cost); return; }
    for (const [res, amt] of Object.entries(cost)) {
      window.RTSEconomySystem.addResource(res, amt);
    }
  }

  function createProductionPanel() {
    if (panelEl) return;
    panelEl = document.createElement('div');
    panelEl.id = 'rts-production-panel';
    Object.assign(panelEl.style, {
      position: 'fixed', bottom: '24px', left: '50%', transform: 'translateX(-50%) translateY(120%)', display: 'flex', flexDirection: 'column', gap: '12px', width: '420px', background: 'var(--gf-bg-glass)', border: '1px solid var(--gf-border-cyan)', boxShadow: '0 12px 40px rgba(0, 0, 0, 0.8), 0 0 20px rgba(0, 255, 204, 0.15)', borderRadius: '16px', padding: '16px', zIndex: '120', fontFamily: 'var(--gf-font-main)', backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)', color: '#ffffff', transition: 'transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)', pointerEvents: 'auto'
    });
    document.body.appendChild(panelEl);
  }

  function showPanel(buildingId) { selectedBuildingId = buildingId; updatePanelUI(); if (panelEl) panelEl.style.transform = 'translateX(-50%) translateY(0%)'; }
  function hidePanel() { selectedBuildingId = null; if (panelEl) panelEl.style.transform = 'translateX(-50%) translateY(120%)'; }

  function updatePanelUI() {
    if (!panelEl || !selectedBuildingId) return;
    const ent = window.RTSEngineCore ? window.RTSEngineCore.getEntity(selectedBuildingId) : null;
    if (!ent) { hidePanel(); return; }
    const isBarracks = ent.mesh && ent.mesh.userData && ent.isPlayerBuilt;
    if (!isBarracks) { hidePanel(); return; }

    let qData = QUEUES.get(selectedBuildingId);
    if (!qData) { qData = { queue: [], activeProgress: 0 }; QUEUES.set(selectedBuildingId, qData); }

    const queueHtml = qData.queue.map((item, idx) => {
      const def = UNIT_TEMPLATES[item.unitId];
      return `<span style="background:rgba(0,255,204,0.12); border:1px solid rgba(0,255,204,0.25); padding:4px 8px; border-radius:8px; font-size:11px; display:inline-flex; gap:8px; align-items:center;">${def.name} <button class=\"cancel-queue\" data-idx=\"${idx}\" style=\"margin-left:6px;background:transparent;border:none;color:#ff8888;cursor:pointer;font-weight:700;\">×</button></span>`;
    }).join(' ');

    let activeHTML = '';
    if (qData.queue.length > 0) {
      const activeUnit = UNIT_TEMPLATES[qData.queue[0].unitId];
      const pct = Math.min(100, Math.round((qData.activeProgress / activeUnit.time) * 100));
      activeHTML = `
        <div style="margin-top:8px;">
          <div style="display:flex; justify-content:space-between; font-size:12px; margin-bottom:4px; color:#aaa;"><span>Training: ${activeUnit.name}</span><span>${pct}%</span></div>
          <div style="width:100%; height:6px; background:rgba(255,255,255,0.08); border-radius:3px; overflow:hidden;"><div style="width:${pct}%; height:100%; background:#00ffcc; box-shadow:0 0 8px #00ffcc; transition: width 0.1s linear;"></div></div>
        </div>
      `;
    }

    panelEl.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 8px;">
        <span style="font-weight:700; color:#00ffcc; letter-spacing:0.5px;">⚔️ BARRACKS PRODUCTION</span>
        <button id="rts-prod-close" style="background:none; border:none; color:#ff3355; cursor:pointer; font-size:16px; font-weight:700;">×</button>
      </div>
      <div style="font-size:12px; color:#aaa; margin:4px 0;">Train units to defend the Grand Tower.</div>
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-top:8px;">
        ${Object.entries(UNIT_TEMPLATES).map(([id, def]) => `
          <button class="prod-btn" data-unit="${id}" style="background:rgba(255,255,255,0.04); border:1px solid rgba(0,255,204,0.3); color:#fff; border-radius:10px; padding:8px; cursor:pointer; text-align:left;">
            <div style="font-weight:600; font-size:13px; color:#00ffcc;">${def.name}</div>
            <div style="font-size:10px; color:#888; margin:2px 0;">${def.desc}</div>
            <div style="font-size:11px; color:#ffd700; font-weight:700; margin-top:4px;">${formatCost(def.cost)}</div>
          </button>
        `).join('')}
      </div>
      ${activeHTML}
      <div style="display:flex; gap:6px; flex-wrap:wrap; margin-top:8px; align-items:center;"><span style="font-size:11px; color:#888;">Queue:</span>${queueHtml || '<span style="font-size:11px; color:#666;">Empty</span>'}</div>
    `;

    document.getElementById('rts-prod-close').onclick = hidePanel;
    panelEl.querySelectorAll('.prod-btn').forEach(btn => btn.onclick = () => enqueueUnit(btn.dataset.unit));
    panelEl.querySelectorAll('.cancel-queue').forEach(btn => {
      btn.onclick = (e) => {
        const idx = parseInt(btn.dataset.idx, 10);
        cancelQueueItem(selectedBuildingId, idx);
      };
    });
  }

  function enqueueUnit(unitId) {
    const def = UNIT_TEMPLATES[unitId];
    if (!def) return;
    if (!canAfford(def.cost)) {
      console.warn('[RTS Production] Not enough resources!');
      return;
    }
    let qData = QUEUES.get(selectedBuildingId);
    if (!qData) { qData = { queue: [], activeProgress: 0 }; QUEUES.set(selectedBuildingId, qData); }
    qData.queue.push({ unitId: unitId, costPaid: def.cost });
    updatePanelUI();
  }

  function cancelQueueItem(buildingId, idx) {
    const qData = QUEUES.get(buildingId);
    if (!qData || idx < 0 || idx >= qData.queue.length) return;
    const item = qData.queue.splice(idx, 1)[0];
    refundCost(item.costPaid);
    updatePanelUI();
  }

  function spawnTrainedUnit(buildingId, unitId) {
    if (!SCENE || !window.AdvancedNPCEngine || !window.RTSEngineCore) return;
    const building = window.RTSEngineCore.getEntity(buildingId);
    if (!building || !building.mesh) return;
    const def = UNIT_TEMPLATES[unitId];
    const mesh = window.AdvancedNPCEngine.createHumanoidRig(def.color, false);
    const spawnAngle = Math.random() * Math.PI * 2;
    const spawnDist = building.radius + 6;
    mesh.position.set(building.mesh.position.x + Math.cos(spawnAngle) * spawnDist, 0, building.mesh.position.z + Math.sin(spawnAngle) * spawnDist);
    SCENE.add(mesh);
    const ent = window.RTSEngineCore.registerEntity(mesh, 'unit', 'voidCovenant', def.hp, 1.2, def.unitType || null);
    ent.attackDamage = def.attackDamage || 10;
    ent.attackRange = def.attackRange || 5;
    ent.speed = def.speed || 4.5;
    const T = window.THREE;
    if (T) {
      ent.targetPos = new T.Vector3(mesh.position.x + Math.cos(spawnAngle) * 5, 0, mesh.position.z + Math.sin(spawnAngle) * 5);
    }
    ent.state = 'moving';
    window.dispatchEvent(new CustomEvent('rts:unit-spawned', { detail: { unitId } }));
    console.log(`[RTS Production] Trained and spawned ${def.name} for player.`);
  }

  function tick(dt) {
    for (const [buildingId, qData] of QUEUES.entries()) {
      const bEnt = window.RTSEngineCore ? window.RTSEngineCore.getEntity(buildingId) : null;
      if (!bEnt || bEnt.isDead) { QUEUES.delete(buildingId); if (selectedBuildingId === buildingId) hidePanel(); continue; }
      if (qData.queue.length > 0) {
        const activeUnitId = qData.queue[0].unitId;
        const activeUnit = UNIT_TEMPLATES[activeUnitId];
        qData.activeProgress += dt;
        if (selectedBuildingId === buildingId) updatePanelUI();
        if (qData.activeProgress >= activeUnit.time) {
          const item = qData.queue.shift();
          qData.activeProgress = 0;
          spawnTrainedUnit(buildingId, item.unitId);
          if (selectedBuildingId === buildingId) updatePanelUI();
        }
      }
    }
  }

  function install(scene) { SCENE = scene; createProductionPanel(); window.addEventListener('rts:building-selected', (e) => { if (e.detail && e.detail.buildingId) showPanel(e.detail.buildingId); else hidePanel(); }); console.log('[RTS Production System] Ready.'); }

  window.RTSProductionSystem = { install, tick, showPanel, hidePanel };
})();
