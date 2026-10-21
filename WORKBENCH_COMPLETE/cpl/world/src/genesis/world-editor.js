// GENESIS ENGINE — World Editor (Cross-cutting — explicit creation mode)
// Flag-gated dynamic-import mirror of the inline Genesis.WorldEditor manager.
// When window.__GENESIS_WORLD_EDITOR === true (default false) the inline manager
// loads this module. The editor itself NEVER auto-activates: even with the flag
// ON it stays dormant until an explicit user action (KeyP / window.__worldEditorEnter())
// toggles editor MODE on. Visitors see the normal world no matter what.
//
// Loaded via:
//   import('./src/genesis/world-editor.js').then(m => m.install(window.Genesis, THREE, camera, scene, renderer, cityGroup, controls))
//
// install signature mirrors the other Genesis manager modules (flag gate handled
// inline in index.html; this module always builds the real manager).

import * as THREE from 'three';

export function createWorldEditor(Genesis, THREE, camera, scene, renderer, cityGroup, controls) {
  let mode = false;                  // editor mode on/off (explicit gate)
  let selected = null;               // currently selected Object3D
  let selectionHelper = null;        // THREE.BoxHelper
  let matCloned = false;             // guard: clone material on first edit
  let domPanel = null;               // HTML panel
  let domColor = null;               // color input
  let domEmissive = null;            // emissive slider
  let domInfo = null;                // resource-cost info line
  let domSector = null;              // sector dropdown / readout
  let savedSceneBytes = 0;
  const debugHelpers = [];           // temporary helpers (navmesh/grid/colliders/sectors)
  let debugState = { navmesh: false, colliders: false, anim: false, sectors: false };
  const KEY = 'genesis-world-editor-scene';
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();

  // ---------- panel / DOM ----------
  function ensurePanel() {
    if (domPanel) return domPanel;
    const ns = 'http://www.w3.org/1999/xhtml';
    const panel = document.createElementNS(ns, 'div');
    panel.setAttribute('id', 'genesis-world-editor');
    panel.style.cssText = [
      'position:fixed', 'top:64px', 'right:12px', 'z-index:9999',
      'width:268px', 'max-height:calc(100vh - 96px)', 'overflow:auto',
      'background:rgba(14,16,24,0.92)', 'border:1px solid rgba(120,160,255,0.35)',
      'border-radius:10px', 'color:#cdd6ff', 'font:12px/1.4 ui-monospace,Menlo,Consolas,monospace',
      'padding:10px', 'backdrop-filter:blur(6px)', 'box-shadow:0 8px 30px rgba(0,0,0,0.45)',
      'display:none'
    ].join(';');
    panel.innerHTML = [
      '<div style="font-weight:700;letter-spacing:1px;margin-bottom:6px;color:#9fb4ff">WORLD EDITOR</div>',
      '<div class="we-row"><button data-act="save">Save</button><button data-act="load">Load</button><button data-act="deselect">Deselect</button></div>',
      '<div class="we-row">Name: <span id="we-name" style="opacity:.8">—</span></div>',
      '<div class="we-row">Color <input id="we-color" type="color" value="#8888ff"></div>',
      '<div class="we-row">Emissive <input id="we-emissive" type="range" min="0" max="3" step="0.05" value="0.4"></div>',
      '<div class="we-row">Sector <select id="we-sector"><option value="">—</option></select></div>',
      '<div class="we-row"><button data-act="navmesh">Navmesh</button><button data-act="colliders">Colliders</button></div>',
      '<div class="we-row"><button data-act="anim">AnimStates</button><button data-act="sectors">Sectors</button></div>',
      '<div class="we-row we-help" style="opacity:.6;font-size:11px">G move · R yaw(Q/E) · S scale(Z/X) · click select</div>',
      '<div id="we-info" class="we-row" style="white-space:pre-wrap;opacity:.85;margin-top:6px;border-top:1px solid rgba(255,255,255,.12);padding-top:6px"></div>'
    ].join('');
    document.body.appendChild(panel);
    domPanel = panel;
    domColor = panel.querySelector('#we-color');
    domEmissive = panel.querySelector('#we-emissive');
    domInfo = panel.querySelector('#we-info');
    domSector = panel.querySelector('#we-sector');
    domName = panel.querySelector('#we-name');
    panel.querySelectorAll('button[data-act]').forEach((b) => {
      b.addEventListener('click', () => handleAct(b.getAttribute('data-act')));
    });
    domColor.addEventListener('input', () => applyColor(domColor.value));
    domEmissive.addEventListener('input', () => applyEmissive(parseFloat(domEmissive.value)));
    domSector.addEventListener('change', () => assignSector(domSector.value));
    return panel;
  }

  let domName = null;

  function showPanel() { if (domPanel) domPanel.style.display = 'block'; refreshInfo(); }
  function hidePanel() { if (domPanel) domPanel.style.display = 'none'; }

  // ---------- selection ----------
  function select(obj) {
    deselect(false);
    selected = obj;
    matCloned = false;
    if (obj) {
      selectionHelper = new THREE.BoxHelper(obj, 0x44ff99);
      selectionHelper.name = 'WorldEditorSelection';
      scene.add(selectionHelper);
      if (domName) domName.textContent = obj.name || '(unnamed)';
      // populate sector dropdown current value
      if (domSector) {
        const cur = (obj.userData && obj.userData.cost && obj.userData.cost.sector) || '';
        domSector.value = cur;
      }
    }
    refreshInfo();
  }

  function deselect(refresh) {
    if (selectionHelper) { scene.remove(selectionHelper); selectionHelper.geometry.dispose(); selectionHelper = null; }
    selected = null;
    if (refresh !== false) refreshInfo();
  }

  // ---------- raycast pick ----------
  function pickAt(clientX, clientY) {
    if (!cityGroup) return null;
    const rect = renderer.domElement.getBoundingClientRect();
    pointer.x = ((clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(pointer, camera);
    const hits = raycaster.intersectObject(cityGroup, true);
    for (const h of hits) {
      // climb to a named top-level-ish node but accept any mesh/object under cityGroup
      return h.object;
    }
    return null;
  }

  // ---------- transform ----------
  function nudge(dx, dy, dz) {
    if (!selected) return;
    selected.position.x += dx; selected.position.y += dy; selected.position.z += dz;
    syncHelper();
  }
  function yaw(deg) {
    if (!selected) return;
    selected.rotation.y += THREE.MathUtils.degToRad(deg);
    syncHelper();
  }
  function scaleMul(f) {
    if (!selected) return;
    selected.scale.multiplyScalar(f);
    syncHelper();
  }
  function syncHelper() { if (selectionHelper) selectionHelper.update(); }

  // ---------- material edit (clone-on-first-edit) ----------
  function ensureOwnMaterial() {
    if (!selected || !selected.material) return false;
    if (!matCloned) {
      try { selected.material = selected.material.clone(); matCloned = true; } catch (e) { return false; }
    }
    return true;
  }
  function applyColor(hex) {
    if (!ensureOwnMaterial()) return;
    if (selected.material.color) selected.material.color.set(hex);
    refreshInfo();
  }
  function applyEmissive(v) {
    if (!ensureOwnMaterial()) return;
    selected.material.emissiveIntensity = v;
    refreshInfo();
  }

  // ---------- sector / cost assignment ----------
  function assignSector(sectorId) {
    if (!selected) return;
    const cost = (selected.userData && selected.userData.cost)
      ? Object.assign({}, selected.userData.cost)
      : { cpu: 0, gpu: 0, memory: 0, updateFreq: 0, priority: 0, sector: 'unknown', sleep: 'never' };
    if (sectorId) cost.sector = sectorId;
    cost.sleep = cost.sleep || 'distance';
    selected.userData.cost = cost;
    // (re)register root to SectorManager + Visibility (guarded)
    if (sectorId && Genesis.SectorManager && typeof Genesis.SectorManager.register === 'function') {
      try { Genesis.SectorManager.register(sectorId, selected, { maxDistance: 260, autoSleep: cost.sleep === 'never' ? false : true }); } catch (e) {}
    }
    if (Genesis.Visibility && typeof Genesis.Visibility.register === 'function') {
      try { Genesis.Visibility.register(sectorId || 'unknown', selected, { priority: cost.priority || 5, maxDistance: 260 }); } catch (e) {}
    }
    refreshInfo();
  }

  // ---------- scene JSON serialize / save / load ----------
  function serialize() {
    const out = [];
    if (!cityGroup) return out;
    cityGroup.traverse((node) => {
      if (!node.isMesh) return;
      const cost = (node.userData && node.userData.cost) ? node.userData.cost : null;
      const sector = cost ? cost.sector : null;
      out.push({
        name: node.name || '',
        position: node.position.toArray(),
        rotation: [node.rotation.x, node.rotation.y, node.rotation.z],
        scale: node.scale.toArray(),
        material: {
          color: node.material && node.material.color ? '#' + node.material.color.getHexString() : null,
          emissiveIntensity: node.material && typeof node.material.emissiveIntensity === 'number' ? node.material.emissiveIntensity : null
        },
        cost, sector
      });
    });
    return out;
  }

  function save() {
    const data = serialize();
    const json = JSON.stringify(data);
    savedSceneBytes = json.length;
    try { window.localStorage.setItem(KEY, json); } catch (e) {}
    // download via Blob + anchor
    try {
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = 'genesis-world-editor-scene.json';
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (e) {}
    refreshInfo();
  }

  function load() {
    let json = null;
    try { json = window.localStorage.getItem(KEY); } catch (e) {}
    if (!json) return;
    let data;
    try { data = JSON.parse(json); } catch (e) { return; }
    if (!Array.isArray(data)) return;
    const byName = new Map();
    cityGroup.traverse((node) => { if (node.isMesh && node.name) byName.set(node.name, node); });
    for (const rec of data) {
      if (!rec || !rec.name) continue;
      const node = byName.get(rec.name);
      if (!node) continue;
      // only edits transforms / materials / userData — never deletes world objects
      if (Array.isArray(rec.position)) node.position.fromArray(rec.position);
      if (Array.isArray(rec.rotation)) { node.rotation.set(rec.rotation[0], rec.rotation[1], rec.rotation[2]); }
      if (Array.isArray(rec.scale)) node.scale.fromArray(rec.scale);
      if (rec.material) {
        if (rec.material.color && node.material && node.material.color) node.material.color.set(rec.material.color);
        if (typeof rec.material.emissiveIntensity === 'number' && node.material) node.material.emissiveIntensity = rec.material.emissiveIntensity;
      }
      if (rec.cost) node.userData.cost = rec.cost;
    }
    if (selected) syncHelper();
    refreshInfo();
  }

  // ---------- resource-cost inspector ----------
  function refreshInfo() {
    if (!domInfo) return;
    let s = '';
    if (Genesis.ResourceManager && typeof Genesis.ResourceManager.summary === 'function') {
      const r = Genesis.ResourceManager.summary();
      s += 'RES total=' + (r.total || 0) + '\n';
    }
    if (Genesis.SectorManager && typeof Genesis.SectorManager.summary === 'function') {
      const sm = Genesis.SectorManager.summary();
      const keys = sm && typeof sm === 'object' ? Object.keys(sm) : [];
      s += 'SEC ' + keys.length + ' sectors\n';
    }
    const lm = Genesis.LightingManager && typeof Genesis.LightingManager.summary === 'function' ? Genesis.LightingManager.summary() : null;
    if (lm) s += 'LIGHT ' + (lm.count !== undefined ? lm.count : JSON.stringify(lm)) + '\n';
    if (selected && selected.userData && selected.userData.cost) {
      s += 'SEL ' + (selected.name || '(unnamed)') + '\n' + JSON.stringify(selected.userData.cost) + '\n';
    } else if (selected) {
      s += 'SEL ' + (selected.name || '(unnamed)') + ' (no cost)\n';
    } else {
      s += 'SEL —\n';
    }
    s += 'SAVED ' + savedSceneBytes + 'B';
    domInfo.textContent = s;
  }

  // ---------- engine debug views (temporary helpers) ----------
  function clearDebug() {
    for (const h of debugHelpers) {
      try { scene.remove(h); if (h.geometry) h.geometry.dispose(); } catch (e) {}
    }
    debugHelpers.length = 0;
    debugState = { navmesh: false, colliders: false, anim: false, sectors: false };
  }

  function addNavmeshDebug() {
    // Prefer PopulationEngine navmesh ref; else simple grid plane at y=0.
    let added = false;
    if (Genesis.PopulationEngine && typeof Genesis.PopulationEngine.getNavMeshDebug === 'function') {
      try {
        const nm = Genesis.PopulationEngine.getNavMeshDebug();
        if (nm && nm.isObject3D) { scene.add(nm); debugHelpers.push(nm); added = true; }
      } catch (e) {}
    }
    if (!added) {
      const grid = new THREE.GridHelper(300, 60, 0x2266ff, 0x113377);
      grid.position.y = 0.02; grid.name = 'WorldEditorNavmeshDebug';
      scene.add(grid); debugHelpers.push(grid);
    }
  }

  function addCollidersDebug() {
    // Rapier world (_rapWorld) is a module-local var; not reachable here. Skip gracefully.
    // (If a hook exposed it via Genesis.PhysicsWorld we would draw wireframe boxes.)
    return;
  }

  function addAnimDebug() {
    // list active mixers from AnimationScheduler.summary()
    const el = document.createElement('div');
    el.style.cssText = 'position:fixed;left:12px;bottom:12px;z-index:9999;background:rgba(14,16,24,.9);color:#bfe;border:1px solid rgba(120,200,255,.3);border-radius:8px;padding:6px 8px;font:11px ui-monospace,monospace;max-width:280px';
    let txt = 'ANIM STATES:\n';
    if (Genesis.AnimationScheduler && typeof Genesis.AnimationScheduler.summary === 'function') {
      const a = Genesis.AnimationScheduler.summary();
      txt += 'registered=' + (a.registered || 0) + ' activeThisTick=' + (a.activeThisTick || 0) + ' byOwner=' + JSON.stringify(a.byOwner || {});
    } else txt += '(no scheduler)';
    el.textContent = txt;
    document.body.appendChild(el);
    debugHelpers.push(el); // harmless: tracked for cleanup via remove()
    // override remove for DOM node
    el.remove = el.remove || (() => {});
  }

  function addSectorsDebug() {
    if (!Genesis.SectorManager || typeof Genesis.SectorManager.getRoots !== 'function') {
      // fallback: tint registered sector roots via bounding boxes is best-effort
      return;
    }
    try {
      const roots = Genesis.SectorManager.getRoots() || [];
      let i = 0;
      for (const r of roots) {
        if (!r || !r.isObject3D) continue;
        const box = new THREE.Box3().setFromObject(r);
        const helper = new THREE.Box3Helper(box, new THREE.Color().setHSL((i % 12) / 12, 0.7, 0.6));
        helper.name = 'WorldEditorSectorDebug';
        scene.add(helper); debugHelpers.push(helper); i++;
      }
    } catch (e) {}
  }

  function toggleDebug(kind) {
    if (kind === 'navmesh') { debugState.navmesh = !debugState.navmesh; if (debugState.navmesh) addNavmeshDebug(); }
    else if (kind === 'colliders') { debugState.colliders = !debugState.colliders; if (debugState.colliders) addCollidersDebug(); }
    else if (kind === 'anim') { debugState.anim = !debugState.anim; if (debugState.anim) addAnimDebug(); }
    else if (kind === 'sectors') { debugState.sectors = !debugState.sectors; if (debugState.sectors) addSectorsDebug(); }
    // removal: clear all + rebuild active ones (simplest, reversible)
    if (!debugState.navmesh || !debugState.colliders || !debugState.anim || !debugState.sectors) {
      // partial removal handled by rebuild
    }
    rebuildDebug();
  }

  function rebuildDebug() {
    // remove all current debug helpers
    for (const h of debugHelpers) {
      try {
        if (h.isObject3D) { scene.remove(h); if (h.geometry) h.geometry.dispose(); }
        else if (h.remove) h.remove();
        else if (h.parentNode) h.parentNode.removeChild(h);
      } catch (e) {}
    }
    debugHelpers.length = 0;
    if (debugState.navmesh) addNavmeshDebug();
    if (debugState.colliders) addCollidersDebug();
    if (debugState.anim) addAnimDebug();
    if (debugState.sectors) addSectorsDebug();
  }

  // ---------- actions ----------
  function handleAct(act) {
    if (!mode) return;
    if (act === 'save') save();
    else if (act === 'load') load();
    else if (act === 'deselect') deselect();
    else if (act === 'navmesh') toggleDebug('navmesh');
    else if (act === 'colliders') toggleDebug('colliders');
    else if (act === 'anim') toggleDebug('anim');
    else if (act === 'sectors') toggleDebug('sectors');
  }

  // ---------- mode toggle ----------
  function enable() {
    if (mode) return;
    mode = true;
    ensurePanel();
    showPanel();
    refreshInfo();
    if (typeof console !== 'undefined') console.log('[WorldEditor] MODE ON (explicit).');
  }
  function disable() {
    if (!mode) return;
    mode = false;
    deselect(false);
    clearDebug();
    hidePanel();
    if (typeof console !== 'undefined') console.log('[WorldEditor] MODE OFF.');
  }
  function toggle() { if (mode) disable(); else enable(); }

  // ---------- event wiring (only matters when flag ON; listeners are inert until mode) ----------
  function onPointerDown(e) {
    if (!mode) return;
    // ignore clicks on the panel itself
    if (domPanel && domPanel.contains(e.target)) return;
    if (e.button !== undefined && e.button !== 0) return;
    const obj = pickAt(e.clientX, e.clientY);
    if (obj) select(obj); else deselect();
  }
  function onKeyDown(e) {
    if (!mode || !selected) return;
    const step = 0.5;
    switch (e.key) {
      case 'g': case 'G': window.__weTool = 'move'; break;
      case 'r': case 'R': window.__weTool = 'rotate'; break;
      case 's': case 'S': window.__weTool = 'scale'; break;
      case 'w': case 'W': case 'ArrowUp': nudge(0, 0, -step); break;
      case 'a': case 'A': case 'ArrowLeft': nudge(-step, 0, 0); break;
      case 'd': case 'D': case 'ArrowRight': nudge(step, 0, 0); break;
      case 'x': case 'X': nudge(0, 0, step); break;
      case 'q': case 'Q': yaw(5); break;
      case 'e': case 'E': yaw(-5); break;
      case 'z': case 'Z': scaleMul(1.1); break;
      default: break;
    }
  }

  function wire() {
    window.addEventListener('pointerdown', onPointerDown, true);
    window.addEventListener('keydown', onKeyDown, true);
  }

  function summary() {
    let sectorCount = 0;
    if (Genesis.SectorManager && typeof Genesis.SectorManager.summary === 'function') {
      const sm = Genesis.SectorManager.summary();
      sectorCount = sm && typeof sm === 'object' ? Object.keys(sm).length : 0;
    }
    let lightCount = null;
    const lm = Genesis.LightingManager && typeof Genesis.LightingManager.summary === 'function' ? Genesis.LightingManager.summary() : null;
    if (lm && typeof lm.count === 'number') lightCount = lm.count;
    return {
      enabled: true,
      mode,
      selected: selected ? (selected.name || '(unnamed)') : null,
      sectorCount,
      lightCount,
      savedSceneBytes
    };
  }

  function exit() {
    disable();
    if (domPanel && domPanel.parentNode) domPanel.parentNode.removeChild(domPanel);
    domPanel = null; domColor = null; domEmissive = null; domInfo = null; domSector = null; domName = null;
  }

  return {
    enable, disable, toggle,
    enter: enable,
    select, deselect,
    save, load, serialize,
    assignSector, refreshInfo,
    wire, summary, exit,
    _pickAt: pickAt
  };
}

export function install(Genesis, THREE, camera, scene, renderer, cityGroup, controls) {
  if (!Genesis) return null;
  const editor = createWorldEditor(Genesis, THREE, camera, scene, renderer, cityGroup, controls);
  Genesis.WorldEditor = editor;
  // Wire listeners once (inert until mode toggled on via KeyP / __worldEditorEnter).
  try { editor.wire(); } catch (e) {}
  // Public explicit entry points (never auto-called).
  window.__worldEditorEnter = () => editor.enable();
  window.__worldEditorExit = () => editor.exit();
  return editor;
}

export default { install };
