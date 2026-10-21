// src/genesis/void-building-panel.js
// AoE-style building selection panel: shows garrison, production queue, tech upgrades when you click a void building.

(function () {
  'use strict';

  // Unit definitions for production
  const UNIT_DEFS = {
    spearman: { id: 'spearman', name: 'Spearman', hp: 50, attack: 8, speed: 3.5, time: 12, cost: { profit: 60, love: 0 } },
    archer: { id: 'archer', name: 'Archer', hp: 35, attack: 12, speed: 3.0, time: 18, cost: { profit: 80, love: 0 } },
    knight: { id: 'knight', name: 'Knight', hp: 100, attack: 20, speed: 4.5, time: 30, cost: { profit: 150, love: 20 } },
    villager: { id: 'villager', name: 'Villager', hp: 25, attack: 3, speed: 2.8, time: 8, cost: { profit: 50, love: 0 } },
    scout: { id: 'scout', name: 'Scout', hp: 40, attack: 6, speed: 5.0, time: 15, cost: { profit: 60, love: 10 } },
    catapult: { id: 'catapult', name: 'Catapult', hp: 80, attack: 60, speed: 1.5, time: 45, cost: { profit: 200, love: 0 } },
  };

  const TECH_DEFS = {
    masonry: { id: 'masonry', name: 'Masonry', cost: { profit: 200, aether: 50 }, desc: '+2 armor, +500 HP' },
    ballistics: { id: 'ballistics', name: 'Ballistics', cost: { profit: 300, aether: 100 }, desc: 'Improved accuracy' },
    feudalAge: { id: 'feudalAge', name: 'Feudal Age', cost: { profit: 800, love: 200 }, desc: 'Unlocks new buildings' },
    conscription: { id: 'conscription', name: 'Conscription', cost: { profit: 150, aether: 30 }, desc: '-25% train time' },
  };

  let selectedBuilding = null;
  let panelEl = null;

  function createPanel() {
    if (panelEl) return panelEl;
    panelEl = document.createElement('div');
    panelEl.id = 'void-building-panel';
    panelEl.style.cssText = `
      position:fixed;bottom:20px;left:50%;transform:translateX(-50%);
      background:rgba(8,10,20,0.92);border:1px solid rgba(0,255,204,0.4);
      border-radius:12px;padding:16px 24px;color:#e0f0ff;font-family:'Segoe UI',sans-serif;
      font-size:14px;min-width:340px;max-width:500px;z-index:10000;
      box-shadow:0 0 24px rgba(0,255,204,0.15);display:none;
      backdrop-filter:blur(8px);
    `;
    document.body.appendChild(panelEl);
    // Close button
    const closeBtn = document.createElement('button');
    closeBtn.textContent = '✕';
    closeBtn.style.cssText = 'position:absolute;top:8px;right:12px;background:none;border:none;color:#aaa;font-size:18px;cursor:pointer;';
    closeBtn.onclick = () => hidePanel();
    panelEl.appendChild(closeBtn);
    return panelEl;
  }

  function showPanel(building) {
    selectedBuilding = building;
    const panel = createPanel();
    panel.style.display = 'block';
    renderPanel(building, panel);
  }

  function hidePanel() {
    selectedBuilding = null;
    if (panelEl) panelEl.style.display = 'none';
  }

  function renderPanel(b, panel) {
    panel.innerHTML = '';
    // Close button
    const closeBtn = document.createElement('button');
    closeBtn.textContent = '✕';
    closeBtn.style.cssText = 'position:absolute;top:8px;right:12px;background:none;border:none;color:#aaa;font-size:18px;cursor:pointer;';
    closeBtn.onclick = () => hidePanel();
    panel.appendChild(closeBtn);

    // Header
    const header = document.createElement('div');
    header.style.cssText = 'font-size:18px;font-weight:600;color:#00ffcc;margin-bottom:8px;';
    header.textContent = b.type.charAt(0).toUpperCase() + b.type.slice(1) + ' — ' + (b.faction || 'neutral');
    panel.appendChild(header);

    // HP bar
    const hpPct = Math.max(0, Math.min(100, (b.hp / b.maxHp) * 100));
    const hpBar = document.createElement('div');
    hpBar.style.cssText = 'background:#1a1a2e;border-radius:4px;height:14px;margin-bottom:6px;overflow:hidden;';
    const hpFill = document.createElement('div');
    hpFill.style.cssText = `height:100%;width:${hpPct}%;background:linear-gradient(90deg,#00ffcc,#00aa88);border-radius:4px;`;
    hpBar.appendChild(hpFill);
    panel.appendChild(hpBar);
    const hpText = document.createElement('div');
    hpText.style.cssText = 'font-size:12px;color:#aaa;margin-bottom:10px;';
    hpText.textContent = `HP: ${Math.floor(b.hp)} / ${b.maxHp}  |  Armor: ${b.armor}`;
    panel.appendChild(hpText);

    // Garrison section
    if (b.garrisonMax > 0) {
      const garrDiv = document.createElement('div');
      garrDiv.style.cssText = 'margin-bottom:12px;';
      const garrTitle = document.createElement('div');
      garrTitle.style.cssText = 'font-weight:600;color:#ffaa00;margin-bottom:4px;';
      garrTitle.textContent = `Garrison (${b.garrison.length}/${b.garrisonMax})`;
      garrDiv.appendChild(garrTitle);
      // Garrison visual slots
      for (let i = 0; i < b.garrisonMax; i++) {
        const slot = document.createElement('span');
        slot.style.cssText = `display:inline-block;width:22px;height:22px;margin:2px;border-radius:4px;font-size:11px;line-height:22px;text-align:center;`;
        if (i < b.garrison.length) {
          slot.style.background = '#00ffcc';
          slot.style.color = '#080a14';
          slot.textContent = '👤';
        } else {
          slot.style.background = '#1a1a2e';
          slot.style.color = '#444';
          slot.textContent = '·';
        }
        garrDiv.appendChild(slot);
      }
      // Ungarrison button
      if (b.garrison.length > 0) {
        const unBtn = document.createElement('button');
        unBtn.textContent = '📤 Ungarrison All';
        unBtn.style.cssText = 'margin-top:6px;padding:4px 12px;background:#ffaa00;color:#080a14;border:none;border-radius:4px;cursor:pointer;font-weight:600;';
        unBtn.onclick = () => {
          if (window.VoidRTSBuildings) {
            const units = window.VoidRTSBuildings.unGarrisonAll(b);
            console.log('[BuildingPanel] Ungarrisoned', units.length, 'units');
            renderPanel(b, panel);
          }
        };
        garrDiv.appendChild(unBtn);
      }
      panel.appendChild(garrDiv);
    }

    // Production queue section
    if (b.productionMax > 0) {
      const prodDiv = document.createElement('div');
      prodDiv.style.cssText = 'margin-bottom:12px;';
      const prodTitle = document.createElement('div');
      prodTitle.style.cssText = 'font-weight:600;color:#4488ff;margin-bottom:4px;';
      prodTitle.textContent = `Production Queue (${b.productionQueue.length}/${b.productionMax})`;
      prodDiv.appendChild(prodTitle);
      // Show queue
      for (const item of b.productionQueue) {
        const itemEl = document.createElement('div');
        itemEl.style.cssText = 'background:#0d1117;border-radius:4px;padding:4px 8px;margin:2px 0;font-size:12px;display:flex;justify-content:space-between;';
        const pct = Math.floor((item.progress / item.total) * 100);
        itemEl.innerHTML = `<span>${item.def.name}</span><span style="color:#00ffcc;">${pct}%</span>`;
        prodDiv.appendChild(itemEl);
      }
      // Enqueue buttons (only if queue not full)
      if (b.productionQueue.length < b.productionMax) {
        const unitRow = document.createElement('div');
        unitRow.style.cssText = 'display:flex;flex-wrap:wrap;gap:4px;margin-top:6px;';
        for (const key of Object.keys(UNIT_DEFS)) {
          const def = UNIT_DEFS[key];
          const btn = document.createElement('button');
          btn.textContent = `${def.name} (${def.cost.profit}PLT)`;
          btn.style.cssText = 'padding:4px 8px;background:#1a2a3e;color:#e0f0ff;border:1px solid #00ffcc44;border-radius:4px;cursor:pointer;font-size:12px;';
          btn.onclick = () => {
            if (window.VoidRTSBuildings && window.RTSEconomySystem) {
              // Check cost
              if (window.RTSEconomySystem.RESOURCES.profit < def.cost.profit) return;
              window.RTSEconomySystem.spendResource('profit', def.cost.profit);
              window.VoidRTSBuildings.enqueueProduction(b, def);
              renderPanel(b, panel);
            }
          };
          unitRow.appendChild(btn);
        }
        prodDiv.appendChild(unitRow);
      }
      panel.appendChild(prodDiv);
    }

    // Tech section
    const techDiv = document.createElement('div');
    techDiv.style.cssText = 'margin-bottom:12px;';
    const techTitle = document.createElement('div');
    techTitle.style.cssText = 'font-weight:600;color:#ff66aa;margin-bottom:4px;';
    techTitle.textContent = 'Tech Upgrades';
    techDiv.appendChild(techTitle);
    const techRow = document.createElement('div');
    techRow.style.cssText = 'display:flex;flex-wrap:wrap;gap:4px;margin-top:4px;';
    for (const key of Object.keys(TECH_DEFS)) {
      const tech = TECH_DEFS[key];
      const res = document.createElement('button');
      res.textContent = `${tech.name}`;
      res.title = tech.desc;
      const done = b.techs.includes(key);
      res.style.cssText = `padding:4px 8px;border-radius:4px;cursor:pointer;font-size:12px;border:1px solid ${done ? '#00ff88' : '#00ffcc44'};`;
      if (done) {
        res.style.background = '#0a2a1a';
        res.style.color = '#00ff88';
        res.textContent += ' ✓';
        res.disabled = true;
      } else {
        res.style.background = '#1a1a2e';
        res.style.color = '#e0f0ff';
        res.onclick = () => {
          if (window.VoidRTSBuildings && window.RTSEconomySystem) {
            if (window.RTSEconomySystem.RESOURCES.profit < tech.cost.profit) return;
            window.RTSEconomySystem.spendResource('profit', tech.cost.profit);
            if (tech.cost.aether) window.RTSEconomySystem.spendResource('aether', tech.cost.aether);
            window.VoidRTSBuildings.researchTech(b, key);
            renderPanel(b, panel);
          }
        };
      }
      techRow.appendChild(res);
    }
    techDiv.appendChild(techRow);
    panel.appendChild(techDiv);
  }

  // Raycast to detect building clicks
  let _camera = null;
  let _raycaster = null;
  let _pointer = { x: 0, y: 0 };

  function setupClickDetection(camera) {
    _camera = camera;
    _raycaster = new window.THREE.Raycaster();
    window.addEventListener('pointermove', (e) => { _pointer.x = (e.clientX / window.innerWidth) * 2 - 1; _pointer.y = -(e.clientY / window.innerHeight) * 2 + 1; });
    window.addEventListener('click', (e) => {
      if (!window.RTSSpatialIndex || !_camera) return;
      // Don't open panel if user is selecting units or clicking UI
      const t = e.target;
      if (t && t.closest && (t.closest('#void-building-panel') || t.closest('#rts-minimap') || t.closest('.rts-hud'))) return;
      _raycaster.setFromCamera(_pointer, _camera);
      // Query nearby entities
      const camPos = _camera.position;
      const nearby = window.RTSSpatialIndex.queryEntities(camPos.x, camPos.z, 500);
      const meshes = nearby.filter(n => n && n.mesh && n.isDead === false).map(n => n.mesh);
      const hits = _raycaster.intersectObjects(meshes, true);
      if (hits.length > 0) {
        let obj = hits[0].object;
        // Walk up to find entity mesh
        while (obj && !obj.userData.entityId) obj = obj.parent;
        if (!obj) return;
        const ent = window.RTSEngineCore.getEntity(obj.userData.entityId);
        if (!ent || ent.type !== 'building') return;
        // Find corresponding VoidRTSBuildings building
        if (window.VoidRTSBuildings) {
          const all = window.VoidRTSBuildings.all();
          const match = all.find(b => b.mesh === ent.mesh || (b.mesh && b.mesh.parent === ent.mesh));
          if (match) { showPanel(match); return; }
        }
        // Fallback: register a temporary building record for non-void buildings
        if (ent.mesh) {
          const fakeBuilding = {
            id: -1,
            mesh: ent.mesh,
            type: 'building',
            faction: ent.faction,
            hp: ent.hp,
            maxHp: ent.maxHp,
            armor: 0,
            garrison: [],
            garrisonMax: 5,
            productionQueue: [],
            productionMax: 0,
            techs: [],
            upgrades: [],
          };
          showPanel(fakeBuilding);
        }
      }
    });
  }

  window.VoidBuildingPanel = {
    showPanel,
    hidePanel,
    setupClickDetection,
    UNIT_DEFS,
    TECH_DEFS,
  };
})();
