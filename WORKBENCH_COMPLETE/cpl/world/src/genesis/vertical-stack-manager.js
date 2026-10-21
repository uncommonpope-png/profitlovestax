import * as THREE from 'three';

export const STRATUM_STATES = Object.freeze({
  UNLOADED: 'UNLOADED',
  LOADED: 'LOADED',
  ACTIVE: 'ACTIVE',
  SLEEPING: 'SLEEPING'
});

const VALID_STATES = new Set(Object.values(STRATUM_STATES));

export function createVerticalStackManager(ctx = {}) {
  const strata = new Map();
  const connectors = new Map();
  const now = () => (typeof performance !== 'undefined' && performance.now ? performance.now() : Date.now());
  let activeId = null;
  let transitionPromise = null;
  let exteriorVisible = true;
  let lastTransition = null;
  let applyCount = 0;
  let refreshCount = 0;
  let tickCount = 0;
  let idleTickCount = 0;

  function resolveRoots(record) {
    if (!record || !record.root) return [];
    let companions = record.options.companionRoots || [];
    if (typeof companions === 'function') {
      try { companions = companions() || []; } catch (_) { companions = []; }
    }
    const seen = new Set();
    const entries = [{ root: record.root, role: record.options.role || record.id }];
    for (const entry of Array.isArray(companions) ? companions : []) {
      const root = entry && entry.root ? entry.root : entry;
      if (root) entries.push({ root, role: (entry && entry.root && entry.role) || 'companion' });
    }
    return entries.filter((entry) => {
      if (!entry.root || seen.has(entry.root)) return false;
      seen.add(entry.root);
      return true;
    });
  }

  function rootsFor(record) {
    return record && Array.isArray(record.roots) ? record.roots : [];
  }

  function visibleInTree(root) {
    let node = root;
    while (node) {
      if (node.visible === false) return false;
      node = node.parent;
    }
    return true;
  }

  function getObjectStratumId(object) {
    let node = object;
    while (node) {
      if (node.userData && node.userData.verticalStratumId) return node.userData.verticalStratumId;
      node = node.parent;
    }
    return null;
  }

  function isSimulationActive(object) {
    let node = object;
    while (node) {
      const data = node.userData;
      if (data && data.verticalStratumId) return data.verticalState === STRATUM_STATES.ACTIVE && data.verticalSimulationActive === true;
      node = node.parent;
    }
    return true;
  }

  function applyState(record) {
    if (!record || !record.root) return;
    applyCount++;
    const stateVisible = record.state === STRATUM_STATES.ACTIVE || record.state === STRATUM_STATES.LOADED;
    for (const entry of rootsFor(record)) {
      const root = entry.root;
      root.userData.__genesisVisibilityOwner = 'vertical-stack';
      root.userData.verticalStratumId = record.id;
      root.userData.verticalStratumRole = entry.role;
      root.userData.verticalState = record.state;
      root.userData.verticalSimulationActive = record.state === STRATUM_STATES.ACTIVE;
      const shouldShow = exteriorVisible && !root.userData.__verticalExteriorHidden && stateVisible;
      if (!shouldShow) {
        if (!record.hiddenRoots.has(root)) record.visibilityBeforeHide.set(root, root.visible !== false);
        record.hiddenRoots.add(root);
        root.visible = false;
      } else if (record.hiddenRoots.has(root)) {
        root.visible = record.visibilityBeforeHide.get(root) !== false;
        record.hiddenRoots.delete(root);
        record.visibilityBeforeHide.delete(root);
      }
    }
  }

  function setRecordState(record, state) {
    if (!record || !VALID_STATES.has(state)) return false;
    record.state = state;
    record.changedAt = now();
    applyState(record);
    if (typeof record.options.onStateChange === 'function') {
      try { record.options.onStateChange(state, record.id); } catch (_) {}
    }
    return true;
  }

  function registerStratum(id, root, options = {}) {
    if (!id || !root) throw new Error('registerStratum requires id and root');
    const state = VALID_STATES.has(options.state) ? options.state : STRATUM_STATES.UNLOADED;
    const record = { id, root, options: { ...options }, state, changedAt: now(), roots: [], hiddenRoots: new Set(), visibilityBeforeHide: new Map() };
    record.roots = resolveRoots(record);
    strata.set(id, record);
    if (state === STRATUM_STATES.ACTIVE) {
      if (activeId && activeId !== id) setRecordState(strata.get(activeId), STRATUM_STATES.SLEEPING);
      activeId = id;
    }
    applyState(record);
    return id;
  }

  function registerConnector(id, spec = {}) {
    if (!id || !spec.from || !spec.to) throw new Error('registerConnector requires id, from, and to');
    connectors.set(id, { ...spec, id });
    return id;
  }

  function getActive() { return activeId; }

  function getStratum(id) {
    const record = strata.get(id);
    return record ? { id: record.id, root: record.root, state: record.state, options: { ...record.options } } : null;
  }

  function refreshCompanions(id) {
    const records = id ? [strata.get(id)] : [...strata.values()];
    let refreshed = 0;
    for (const record of records) {
      if (!record) continue;
      record.roots = resolveRoots(record);
      refreshCount++;
      refreshed++;
      applyState(record);
    }
    return refreshed;
  }

  function setState(id, state) {
    const record = strata.get(id);
    if (!record || !VALID_STATES.has(state)) return false;
    refreshCompanions(id);
    if (state === STRATUM_STATES.ACTIVE && activeId && activeId !== id) {
      setRecordState(strata.get(activeId), STRATUM_STATES.SLEEPING);
    }
    if (state === STRATUM_STATES.ACTIVE) activeId = id;
    else if (activeId === id) activeId = null;
    return setRecordState(record, state);
  }

  function findConnector(from, to, connectorId) {
    if (connectorId && connectors.has(connectorId)) return connectors.get(connectorId);
    for (const connector of connectors.values()) {
      if (connector.from === from && connector.to === to) return connector;
      if (connector.bidirectional && connector.from === to && connector.to === from) return connector;
    }
    return null;
  }

  function nextFrame() {
    return new Promise((resolve) => {
      const raf = ctx.requestAnimationFrame || (typeof requestAnimationFrame === 'function' ? requestAnimationFrame : null);
      if (raf) raf(() => resolve());
      else setTimeout(resolve, 16);
    });
  }

  async function transitionTo(id, context = {}) {
    if (transitionPromise) return transitionPromise;
    if (!strata.has(id)) throw new Error('Unknown stratum: ' + id);
    if (activeId === id) return summary();
    const sourceId = activeId;
    const source = sourceId ? strata.get(sourceId) : null;
    const destination = strata.get(id);
    if (source) refreshCompanions(source.id);
    refreshCompanions(destination.id);
    const connector = findConnector(sourceId, id, context.connectorId);
    const previousDestinationState = destination.state;
    const trace = {
      from: sourceId,
      to: id,
      connector: connector ? connector.id : null,
      startedAt: now(),
      destinationVisibleBeforeTransfer: false,
      completedAt: 0,
      ok: false
    };
    lastTransition = trace;

    transitionPromise = (async () => {
      try {
        setRecordState(destination, STRATUM_STATES.LOADED);
        if (typeof context.prepare === 'function') await context.prepare({ source, destination, connector });
        else if (connector && typeof connector.prepare === 'function') await connector.prepare({ source, destination, connector });
        await nextFrame();
        const prewarmMs = Number(context.prewarmMs != null ? context.prewarmMs : (connector && connector.prewarmMs)) || 0;
        if (prewarmMs > 0) await new Promise((resolve) => setTimeout(resolve, prewarmMs));
        trace.destinationVisibleBeforeTransfer = !!(destination.root && destination.root.parent && destination.root.visible);
        if (!trace.destinationVisibleBeforeTransfer) throw new Error('Destination was not visible before transfer: ' + id);
        const ready = typeof context.ready === 'function'
          ? await context.ready({ source, destination, connector })
          : connector && typeof connector.ready === 'function'
            ? await connector.ready({ source, destination, connector })
            : true;
        if (!ready) throw new Error('Destination not ready: ' + id);
        const transfer = context.transfer || (connector && connector.transfer);
        if (typeof transfer === 'function') await transfer({ from: sourceId, to: id, source, destination, connector, context });
        setRecordState(destination, STRATUM_STATES.ACTIVE);
        activeId = id;
        if (source && source.id !== id) setRecordState(source, STRATUM_STATES.SLEEPING);
        trace.ok = true;
        trace.completedAt = now();
        return summary();
      } catch (error) {
        if (source) { setRecordState(source, STRATUM_STATES.ACTIVE); activeId = source.id; }
        setRecordState(destination, previousDestinationState);
        trace.error = error && error.message ? error.message : String(error);
        trace.completedAt = now();
        throw error;
      } finally {
        transitionPromise = null;
      }
    })();
    return transitionPromise;
  }

  function setExteriorVisible(visible) {
    const nextVisible = !!visible;
    if (nextVisible === exteriorVisible) return false;
    exteriorVisible = nextVisible;
    for (const record of strata.values()) {
      record.roots = resolveRoots(record);
      refreshCount++;
      for (const entry of rootsFor(record)) entry.root.userData.__verticalExteriorHidden = !exteriorVisible;
      applyState(record);
    }
    return true;
  }

  function connectorSummary() {
    return [...connectors.values()].map((connector) => ({
      id: connector.id,
      from: connector.from,
      to: connector.to,
      bidirectional: !!connector.bidirectional,
      endpoints: connector.endpoints ? Object.keys(connector.endpoints) : []
    }));
  }

  function summary() {
    const stratumSummary = {};
    for (const [id, record] of strata) {
      const roots = rootsFor(record);
      stratumSummary[id] = {
        state: record.state,
        visible: visibleInTree(record.root),
        simulationActive: record.state === STRATUM_STATES.ACTIVE,
        rootName: record.root.name || '',
        contentType: record.options.contentType || id,
        parentType: record.root.parent ? record.root.parent.type : null,
        order: record.options.order == null ? 0 : record.options.order,
        roots: roots.map((entry) => ({
          role: entry.role,
          name: entry.root.name || '',
          visible: visibleInTree(entry.root),
          directSceneChild: !!(ctx.scene && entry.root.parent === ctx.scene)
        }))
      };
    }
    return {
      active: activeId,
      transitioning: !!transitionPromise,
      exteriorVisible,
      strata: stratumSummary,
      connectors: connectorSummary(),
      lastTransition: lastTransition ? { ...lastTransition } : null,
      performance: { applyCount, refreshCount, tickCount, idleTickCount, applyPolicy: 'state-or-refresh-only' }
    };
  }

  function tick(context = {}) {
    tickCount++;
    if (typeof context.exteriorVisible === 'boolean' && context.exteriorVisible !== exteriorVisible) {
      setExteriorVisible(context.exteriorVisible);
    } else {
      idleTickCount++;
    }
    return activeId;
  }

  return Object.freeze({
    states: STRATUM_STATES,
    registerStratum,
    registerConnector,
    getActive,
    getStratum,
    getObjectStratumId,
    isSimulationActive,
    transitionTo,
    setState,
    setExteriorVisible,
    refreshCompanions,
    endpoints: connectorSummary,
    summary,
    tick
  });
}

export function install(Genesis, _THREE = THREE, _camera, _scene) {
  if (!Genesis) return null;
  const manager = createVerticalStackManager({ scene: _scene });
  Genesis.VerticalStackManager = manager;
  Genesis.isSimulationActive = manager.isSimulationActive;
  Genesis.getObjectStratumId = manager.getObjectStratumId;
  return manager;
}
