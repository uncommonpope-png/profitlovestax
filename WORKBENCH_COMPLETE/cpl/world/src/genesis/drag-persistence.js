// GENESIS ENGINE — Drag Persistence (P76)
// Saves DragControls object positions into worldState so dragged objects survive reload.

function vec(v) { return v ? [Number(v.x || 0), Number(v.y || 0), Number(v.z || 0)] : [0, 0, 0]; }
function applyVec(target, arr) { if (target && Array.isArray(arr) && arr.length >= 3) target.set(Number(arr[0]) || 0, Number(arr[1]) || 0, Number(arr[2]) || 0); }

export function install(Genesis, worldState, saveWorldState, initialObjects = [], initialControls = null) {
  if (!Genesis || !worldState || typeof saveWorldState !== 'function') return null;
  const bound = new WeakSet();
  worldState.dragPositions = worldState.dragPositions || {};

  function keyFor(obj, index = 0) {
    if (!obj) return null;
    obj.userData = obj.userData || {};
    if (!obj.userData.dragId) {
      const label = obj.userData.title || obj.userData.name || obj.name || obj.type || 'object';
      obj.userData.dragId = String(label).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') + '-' + index;
    }
    return obj.userData.dragId;
  }

  function restore(objects = []) {
    objects.forEach((obj, i) => {
      const key = keyFor(obj, i);
      const rec = key && worldState.dragPositions[key];
      if (!rec) return;
      applyVec(obj.position, rec.position);
      applyVec(obj.rotation, rec.rotation);
      applyVec(obj.scale, rec.scale);
    });
  }

  function record(obj, index = 0) {
    const key = keyFor(obj, index);
    if (!key) return null;
    const rec = { position: vec(obj.position), rotation: vec(obj.rotation), scale: vec(obj.scale), at: Date.now() };
    worldState.dragPositions[key] = rec;
    saveWorldState();
    try { window.dispatchEvent(new CustomEvent('genesis:drag:persist', { detail: { id: key, record: rec } })); } catch (_) {}
    return rec;
  }

  function bind(controls, objects = []) {
    restore(objects);
    if (!controls || bound.has(controls)) return false;
    bound.add(controls);
    controls.addEventListener('dragend', (ev) => {
      const obj = ev && ev.object ? ev.object : null;
      if (!obj) return;
      record(obj, objects.indexOf(obj));
    });
    return true;
  }

  const api = { bind, restore, record, summary: () => ({ persisted: Object.keys(worldState.dragPositions || {}).length }) };
  Genesis.DragPersistence = api;
  bind(initialControls, initialObjects);
  return api;
}

export default { install };
