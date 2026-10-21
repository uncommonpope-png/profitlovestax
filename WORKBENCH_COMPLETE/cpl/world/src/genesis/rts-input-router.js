/**
 * rts-input-router.js
 * BUYASOUL CPL / GODFORGE — Single Input Router
 *
 * The ONE place that owns pointer / contextmenu / keydown for the whole RTS stack.
 * Fixes the four-way right-click conflict, the three drag-boxes, and the dead
 * __godforgeLastRaycastPoint global (read by god-powers + advanced-npc but never set).
 *
 * Systems register handlers by priority. Higher priority runs first. A handler
 * returns truthy to CONSUME the event (no later handler runs).
 *
 *   RTSInputRouter.registerRightClick(priority, fn) // fn({ point, hits, shiftKey, e }) -> consumed?
 *   RTSInputRouter.registerLeftClick(priority, fn)  // fn({ point, hits, shiftKey, e }) -> consumed?
 *   RTSInputRouter.registerBoxSelector(fn)          // fn({ rect, shiftKey }) -> void
 *   RTSInputRouter.registerKeyHandler(priority, fn) // fn(key, e, state) -> consumed?
 *   RTSInputRouter.registerClear(fn)                // fn() called when a click clears selection
 */

(function() {
  'use strict';

  const T = window.THREE;

  let SCENE = null;
  let CAMERA = null;
  let installed = false;

  // --- registered handlers ---
  let rightClickHandlers = []; // { pri, fn }
  let leftClickHandlers = [];
  let boxSelectors = [];
  let keyHandlers = [];
  let clearHandlers = [];

  // --- drag box state ---
  let boxEl = null;
  let dragging = false;
  let dragStartX = 0, dragStartY = 0;
  let dragActive = false;

  // --- shared raycast point ---
  let GROUND_PLANE = null;
  let _ray = null;
  let _mouse = null;
  let _point = null;

  function initThreeObjects() {
    if (GROUND_PLANE) return;
    const T = window.THREE;
    if (!T) return;
    GROUND_PLANE = new T.Plane(new T.Vector3(0, 1, 0), 0);
    _ray = new T.Raycaster();
    _mouse = new T.Vector2();
    _point = new T.Vector3();
  }

  function lastRaycastPoint(clientX, clientY) {
    initThreeObjects();
    if (!_ray) return null;
    _mouse.x = (clientX / window.innerWidth) * 2 - 1;
    _mouse.y = -(clientY / window.innerHeight) * 2 + 1;
    _ray.setFromCamera(_mouse, CAMERA);
    _point.set(0, 0, 0);
    if (_ray.ray.intersectPlane(GROUND_PLANE, _point)) {
      window.__godforgeLastRaycastPoint = _point.clone();
    }
    return window.__godforgeLastRaycastPoint || null;
  }

  function isInteractiveTarget(e) {
    const t = e.target;
    if (!t || !t.closest) return false;
    return !!t.closest('button, input, textarea, select, [data-ui], .gf-stat-item, #gf-top-bar, #godforge-god-powers-bar, #nav-hud, #intro-overlay');
  }

  function ensureBoxEl() {
    if (boxEl) return boxEl;
    boxEl = document.createElement('div');
    boxEl.id = 'rts-router-box';
    Object.assign(boxEl.style, {
      position: 'fixed',
      border: '1px solid #00ff88',
      backgroundColor: 'rgba(0, 255, 136, 0.12)',
      pointerEvents: 'none',
      display: 'none',
      zIndex: '9000'
    });
    document.body.appendChild(boxEl);
    return boxEl;
  }

  function onPointerDown(e) {
    if (e.button !== 0) return;
    if (isInteractiveTarget(e)) return;
    if (e.shiftKey || e.ctrlKey || e.altKey) return; // camera / modifier gestures

    dragging = true;
    dragActive = false;
    dragStartX = e.clientX;
    dragStartY = e.clientY;
  }

  function onPointerMove(e) {
    if (!dragging) {
      // Always keep the shared raycast point fresh (god powers + right-click)
      if (CAMERA) lastRaycastPoint(e.clientX, e.clientY);
      return;
    }
    const dx = Math.abs(e.clientX - dragStartX);
    const dy = Math.abs(e.clientY - dragStartY);
    if (dx + dy <= 5) return; // not a drag yet

    dragActive = true;
    const el = ensureBoxEl();
    const left = Math.min(dragStartX, e.clientX);
    const top = Math.min(dragStartY, e.clientY);
    Object.assign(el.style, {
      display: 'block',
      left: left + 'px',
      top: top + 'px',
      width: Math.abs(e.clientX - dragStartX) + 'px',
      height: Math.abs(e.clientY - dragStartY) + 'px'
    });
  }

  function onPointerUp(e) {
    if (!dragging) return;
    dragging = false;
    const wasDrag = dragActive;
    dragActive = false;
    if (boxEl) {
      boxEl.style.display = 'none';
      boxEl.style.width = '0px';
      boxEl.style.height = '0px';
    }
    if (e.button !== 0) return;

    if (wasDrag) {
      // Drag-box selection
      const rect = {
        left: Math.min(dragStartX, e.clientX),
        top: Math.min(dragStartY, e.clientY),
        right: Math.max(dragStartX, e.clientX),
        bottom: Math.max(dragStartY, e.clientY)
      };
      for (const sel of boxSelectors) {
        try { sel({ rect, shiftKey: !!e.shiftKey, e }); } catch (err) { console.warn('[RTSInputRouter] box selector error:', err); }
      }
      return;
    }

    // Single click — clear selection first, then left-click handlers
    for (const fn of clearHandlers) {
      try { fn(); } catch (err) { /* noop */ }
    }

    const point = lastRaycastPoint(e.clientX, e.clientY);
    let hits = [];
    if (SCENE && CAMERA) {
      _ray.setFromCamera(_mouse, CAMERA);
      try { hits = _ray.intersectObjects(SCENE.children, true); } catch (err) { hits = []; }
    }

    for (const h of leftClickHandlers) {
      try {
        if (h.fn({ point, hits, shiftKey: !!e.shiftKey, e })) return; // consumed
      } catch (err) { console.warn('[RTSInputRouter] left handler error:', err); }
    }
  }

  function onContextMenu(e) {
    e.preventDefault();
    const point = lastRaycastPoint(e.clientX, e.clientY);
    let hits = [];
    if (SCENE && CAMERA) {
      _ray.setFromCamera(_mouse, CAMERA);
      try { hits = _ray.intersectObjects(SCENE.children, true); } catch (err) { hits = []; }
    }
    const ctx = { point, hits, shiftKey: !!e.shiftKey, e };
    for (const h of rightClickHandlers) {
      try {
        if (h.fn(ctx)) return; // consumed
      } catch (err) { console.warn('[RTSInputRouter] right handler error:', err); }
    }
  }

  // --- hotkey routing ---
  let keyFocus = 'world'; // 'world' | 'terminal' | 'input'
  function computeKeyFocus(e) {
    const t = e.target;
    if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return 'input';
    if (document.querySelector('.npc-terminal.active, #gsk-cmd-input:focus, #gsk-thought-input:focus')) return 'terminal';
    return 'world';
  }

  function onKeyDown(e) {
    const focus = computeKeyFocus(e);
    keyFocus = focus;
    if (focus === 'input') return; // let text fields have their keys

    const key = e.key.toLowerCase();
    for (const h of keyHandlers) {
      try {
        if (h.fn(key, e, { focus })) {
          e.preventDefault();
          e.stopPropagation();
          return;
        }
      } catch (err) { /* noop */ }
    }
  }

  // --- registration ---
  function registerRightClick(pri, fn) {
    rightClickHandlers.push({ pri: pri || 100, fn });
    rightClickHandlers.sort((a, b) => a.pri - b.pri);
  }
  function registerLeftClick(pri, fn) {
    leftClickHandlers.push({ pri: pri || 100, fn });
    leftClickHandlers.sort((a, b) => a.pri - b.pri);
  }
  function registerBoxSelector(fn) { boxSelectors.push(fn); }
  function registerKeyHandler(pri, fn) {
    keyHandlers.push({ pri: pri || 100, fn });
    keyHandlers.sort((a, b) => a.pri - b.pri);
  }
  function registerClear(fn) { clearHandlers.push(fn); }

  function install(opts) {
    if (installed) return;
    installed = true;
    opts = opts || {};
    SCENE = opts.scene || null;
    CAMERA = opts.camera || null;
    initThreeObjects();

    window.addEventListener('pointerdown', onPointerDown, { passive: true });
    window.addEventListener('pointermove', onPointerMove, { passive: true });
    window.addEventListener('pointerup', onPointerUp, { passive: true });
    window.addEventListener('contextmenu', onContextMenu);
    window.addEventListener('keydown', onKeyDown);
    console.log('[RTSInputRouter] Single input router installed.');
  }

  function setCamera(camera) { CAMERA = camera; }
  function setScene(scene) { SCENE = scene; }

  window.RTSInputRouter = {
    install,
    setCamera,
    setScene,
    registerRightClick,
    registerLeftClick,
    registerBoxSelector,
    registerKeyHandler,
    registerClear,
    lastRaycastPoint
  };
})();
