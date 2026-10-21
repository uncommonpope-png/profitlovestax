// Smoke test for RTS-1 (OrderGenerator) + RTS-2 (Selection) + Bridge
// Simulates the browser environment (window, THREE stubs) and verifies:
//  1. Scripts parse and expose globals
//  2. Selection class: add/clear/toggle/boxSelect/doubleClick/controlGroups
//  3. OrderGenerator: contextual order decisions, formation slots
//  4. Bridge: install wiring works with mocked RTSInputRouter

'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const GENESIS_DIR = 'C:/Users/uncom/Desktop/buyasoul-cpl-fresh/src/genesis';

// ─── Minimal THREE stub (enough for our classes) ──────────────────────
class Vector3 {
  constructor(x = 0, y = 0, z = 0) { this.x = x; this.y = y; this.z = z; }
  clone() { return new Vector3(this.x, this.y, this.z); }
  copy(v) { this.x = v.x; this.y = v.y; this.z = v.z; return this; }
  set(x, y, z) { this.x = x; this.y = y; this.z = z; return this; }
  distanceTo(v) { return Math.hypot(this.x - v.x, this.y - v.y, this.z - v.z); }
  // Fake projection: normalize world coords into NDC range so boxSelect math works
  // (real THREE mutates in place and returns this — mimic that)
  project() {
    this.x = Math.max(-0.9, Math.min(0.9, this.x / 100));
    this.y = Math.max(-0.9, Math.min(0.9, this.y / 100));
    this.z = 0;
    return this;
  }
}
class Vector2 { constructor(x = 0, y = 0) { this.x = x; this.y = y; } }
class Plane { constructor() {} }
class Raycaster {
  constructor() { this.ray = { intersectPlane: () => true }; }
  setFromCamera() {}
  intersectObjects() { return []; }
}
class BufferGeometry { setFromPoints() { return this; } }
class LineBasicMaterial { constructor(o) { Object.assign(this, o); this.color = { getHex: () => this.color._hex || 0, setHex: (h) => { this.color._hex = h; } }; } }
class LineDashedMaterial { constructor(o) { Object.assign(this, o); this.color = { getHex: () => 0xffffff, setHex: () => {} }; } }
class Line {
  constructor(geo, mat) { this.geometry = geo; this.material = mat; this.frustumCulled = false; this.renderOrder = 0; this.visible = false; this.position = new Vector3(); }
  computeLineDistances() {}
}
class Mesh { constructor(geo, mat) { this.geometry = geo; this.material = mat; this.rotation = { x: 0 }; this.position = new Vector3(); this.userData = {}; } }
class RingGeometry { constructor() {} }
class BoxGeometry { constructor() {} }
class MeshBasicMaterial { constructor(o) { Object.assign(this, o); this.color = { getHex: () => 0x00ff88, setHex: () => {} }; } }
class Object3D { constructor() { this.position = new Vector3(); this.userData = {}; this.parent = null; this.children = []; } }
class Scene extends Object3D { add(o) { this.children.push(o); o.parent = this; } remove(o) { this.children = this.children.filter(c => c !== o); o.parent = null; } }

const THREE = {
  Vector3, Vector2, Plane, Raycaster,
  BufferGeometry, LineBasicMaterial, LineDashedMaterial, Line,
  Mesh, RingGeometry, BoxGeometry, MeshBasicMaterial, Scene,
  DoubleSide: 2,
};

// ─── Mock browser env ──────────────────────────────────────────────────
const window = {
  THREE,
  innerWidth: 1920,
  innerHeight: 1080,
  addEventListener() {},
  removeEventListener() {},
  RTSInputRouter: {
    registerLeftClick() {},
    registerRightClick() {},
    registerBoxSelector() {},
    registerKeyHandler() {},
  },
  RTSEngineCore: { ENTITIES: new Map() },
  RTSUICore: { setSelection() {} },
  RTSNavGrid: {
    findPath() { return [{ x: 0, z: 0 }]; },
  },
};
global.window = window;
global.document = {
  createElement: (tag) => {
    if (tag === 'canvas') {
      return {
        width: 0, height: 0, className: '',
        style: {},
        getContext: () => ({
          imageSmoothingEnabled: true,
          drawImage() {},
          fillRect() {},
          fill() {},
          beginPath() {},
          arc() {},
          stroke() {},
          putImageData() {},
          createImageData: (w, h) => ({ data: new Uint8ClampedArray(w * h * 4) }),
        }),
        addEventListener() {},
        setPointerCapture() {},
        releasePointerCapture() {},
        getBoundingClientRect: () => ({ left: 0, top: 0 }),
      };
    }
    return { style: {}, addEventListener() {}, setPointerCapture() {}, releasePointerCapture() {}, appendChild() {} };
  },
  body: { appendChild() {} },
};
global.performance = { now: () => _fakeNow };
let _fakeNow = Date.now();
global.__advanceTime = (ms) => { _fakeNow += ms; };
global.requestAnimationFrame = (fn) => { /* no-op */ };
try { Object.defineProperty(global, 'navigator', { value: {}, configurable: true }); } catch (e) { /* already defined */ }

// ─── Load the three modules in order ───────────────────────────────────
function loadModule(name) {
  const code = fs.readFileSync(path.join(GENESIS_DIR, name), 'utf8');
  vm.runInThisContext(code, { filename: name });
  console.log(`  loaded ${name}`);
}

console.log('=== Loading modules ===');
loadModule('rts-selection.js');
loadModule('rts-order-generator.js');
loadModule('rts-bridge.js');

const failures = [];
function assert(cond, msg) {
  if (cond) console.log(`  PASS: ${msg}`);
  else { failures.push(msg); console.log(`  FAIL: ${msg}`); }
}

// ─── Test 1: Globals exposed ───────────────────────────────────────────
console.log('\n=== Test 1: Globals ===');
assert(typeof window.RTSSelection === 'function', 'RTSSelection class exposed');
assert(typeof window.RTSOrderGenerator === 'function', 'RTSOrderGenerator class exposed');
assert(typeof window.RTSBridge === 'object' && typeof window.RTSBridge.install === 'function', 'RTSBridge.install exposed');
assert(window.RTS_ORDER_TYPE.MOVE === 'move' && window.RTS_ORDER_TYPE.ATTACK === 'attack', 'ORDER_TYPE constants');
assert(window.RTS_MODE.SELECT_MOVE === 'select_move', 'MODE constants');

// ─── Test 2: Selection class semantics ─────────────────────────────────
console.log('\n=== Test 2: Unified Selection (AoE2 semantics) ===');
const scene = new Scene();
const camera = { position: new Vector3(0, 100, 0) };
const entities = new Map();
for (let i = 1; i <= 10; i++) {
  const mesh = new Mesh();
  mesh.position.set(i * 5, 0, i * 5);
  mesh.userData.entityId = i;
  entities.set(i, { id: i, type: 'unit', faction: 'player', isDead: false, mesh, speed: 5, radius: 0.5, defId: 'soldier' });
}
// Add a couple of buildings
for (let i = 101; i <= 102; i++) {
  const mesh = new Mesh();
  mesh.position.set(i * 5, 0, 0);
  mesh.userData.entityId = i;
  entities.set(i, { id: i, type: 'building', faction: 'player', isDead: false, mesh, speed: 0, radius: 3 });
}

const ctx = { scene, camera, entities };
const sel = new window.RTSSelection(ctx);
sel.ids = new Set(); // fresh

sel.select(1);
assert(sel.isSelected(1) && sel.ids.size === 1, 'select() adds entity');
sel.select(2, true);
assert(sel.isSelected(1) && sel.isSelected(2) && sel.ids.size === 2, 'shift-select adds without clearing');
sel.select(1, true);
assert(!sel.isSelected(1) && sel.ids.size === 1, 'shift-toggle removes');
sel.select(3);
assert(sel.ids.size === 1 && sel.isSelected(3), 'plain click clears + selects');

// Box select
const rect = { left: 0, top: 0, right: 1920, bottom: 1080 };
sel.boxSelect(rect);
assert(sel.ids.size >= 1, 'boxSelect selects units in rect');

// Double click select all of type
sel.selectAllOfType(3);
assert(sel.ids.size >= 1, 'selectAllOfType works');

// Control groups
sel.select(5);
sel.saveGroup(1);
sel.clear();
sel.recallGroup(1);
assert(sel.isSelected(5), 'control group save/recall');

// Cull dead
const deadId = Array.from(sel.ids)[0];
entities.get(deadId).isDead = true;
sel.cullDead(entities);
assert(!sel.isSelected(deadId), 'cullDead removes dead entities');

// ─── Test 3: OrderGenerator contextual decisions ───────────────────────
console.log('\n=== Test 3: OrderGenerator ===');
const genCtx = {
  scene, camera, entities,
  selection: sel,
  audio: null,
  production: null,
  navGrid: window.RTSNavGrid,
  onSelectionChange: null,
};
const gen = new window.RTSOrderGenerator(genCtx);

// Resource entity
const resMesh = new Mesh();
resMesh.position.set(50, 0, 50);
resMesh.userData.entityId = 1000;
entities.set(1000, { id: 1000, type: 'resource', faction: 'neutral', isDead: false, mesh: resMesh });

// Enemy unit
const enemyMesh = new Mesh();
enemyMesh.position.set(60, 0, 60);
enemyMesh.userData.entityId = 2000;
entities.set(2000, { id: 2000, type: 'unit', faction: 'voidCovenant', isDead: false, mesh: enemyMesh, attackDamage: 0 });

// Worker selection (can harvest)
const worker = entities.get(1);
worker.maxCarry = 15;
worker.attackDamage = 5;
sel.clear();
sel.select(1);

// Contextual: worker vs resource → HARVEST
const harvestOrder = gen._decideOrder(entities.get(1000), sel);
assert(harvestOrder === window.RTS_ORDER_TYPE.HARVEST, 'worker + resource → HARVEST');

// Contextual: worker vs enemy → ATTACK
const attackOrder = gen._decideOrder(entities.get(2000), sel);
assert(attackOrder === window.RTS_ORDER_TYPE.ATTACK, 'worker + enemy → ATTACK');

// Contextual: worker vs ground → MOVE
const moveOrder = gen._decideOrder({ type: 'ground' }, sel);
assert(moveOrder === window.RTS_ORDER_TYPE.MOVE, 'worker + ground → MOVE');

// Formation slots: 4 units (shift-select to build multi-selection — AoE2 semantics)
sel.clear();
for (let i = 1; i <= 4; i++) sel.select(i, true);
const movable = gen._getMovableUnits(sel, entities);
assert(movable.length === 4, 'getMovableUnits returns 4');
const target = new Vector3(100, 0, 100);
const slots = gen._calculateFormationSlots(movable, target, entities);
assert(slots.length === 4, 'formation produces 4 slots');
assert(slots[0].x === 100 && slots[0].z === 100, 'closest unit gets exact center');
const uniqueSlots = new Set(slots.map(s => `${s.x},${s.z}`));
assert(uniqueSlots.size === 4, 'all slots unique (no pile-up)');

// ─── Test 4: Bridge install ────────────────────────────────────────────
console.log('\n=== Test 4: Bridge ===');
window.RTSBridge.install({ scene, camera });
assert(window.RTSBridge.selection instanceof window.RTSSelection, 'bridge created selection');
assert(window.RTSBridge.orderGen instanceof window.RTSOrderGenerator, 'bridge created orderGen');
assert(typeof window.RTSBridge.tick === 'function', 'bridge has tick');

// Simulate a frame
window.RTSBridge.tick(0.016);
assert(true, 'bridge tick runs without error');

// ─── Test 5: OrderExecutor (RTS-3) — queue consumption ─────────────────
console.log('\n=== Test 5: OrderExecutor (RTS-3) ===');
// Load executor (bridge test above loaded selection+orderGen; load executor now)
{
  const fs5 = require('fs');
  const path5 = require('path');
  const vm5 = require('vm');
  const code5 = fs5.readFileSync(path5.join('C:/Users/uncom/Desktop/buyasoul-cpl-fresh/src/genesis', 'rts-order-executor.js'), 'utf8');
  vm5.runInThisContext(code5, { filename: 'rts-order-executor.js' });
}
assert(typeof window.RTSOrderExecutor === 'function', 'RTSOrderExecutor class exposed');

// Fresh world for executor tests
const execEntities = new Map();
function makeUnit(id, x, z, opts = {}) {
  const mesh = new Mesh();
  mesh.position.set(x, 0, z);
  mesh.userData.entityId = id;
  const ent = {
    id, type: 'unit', faction: 'player', isDead: false, mesh,
    speed: 5, radius: 0.5, attackDamage: 5, attackRange: 3, attackCooldown: 1,
    currentCooldown: 0, carryAmount: 0, maxCarry: 15,
    orders: [], state: 'idle', targetId: null, targetPos: null,
    ...opts,
  };
  execEntities.set(id, ent);
  return ent;
}
const execCtx = { entities: execEntities, scene, camera };
const exec = new window.RTSOrderExecutor(execCtx);

// 5.1 MOVE completes on arrival
const u1 = makeUnit(1, 0, 0);
u1.orders.push({ type: 'move', destination: new Vector3(10, 0, 10) });
exec.tick(0.016);
assert(u1.state === 'moving' && u1.targetPos.x === 10, 'move order sets target + state');
u1.mesh.position.set(10, 0, 10); // simulate engine movement
exec.tick(0.016);
assert(u1.orders.length === 0 && u1.state === 'idle', 'move order pops on arrival');

// 5.2 ATTACK pops when target dies
const u2 = makeUnit(2, 0, 0);
const enemy = makeUnit(999, 20, 0, { faction: 'voidCovenant', attackDamage: 0 });
u2.orders.push({ type: 'attack', targetId: 999 });
exec.tick(0.016);
assert(u2.targetId === 999 && u2._noAggro === true, 'attack order sets target + suppresses aggro');
enemy.isDead = true;
exec.tick(0.016);
assert(u2.orders.length === 0 && u2._noAggro === false, 'attack order pops on target death');

// 5.3 HARVEST re-grabs node after deposit, pops when node dead
const u3 = makeUnit(3, 0, 0);
const node = makeUnit(1000, 5, 0, { type: 'resource', faction: 'neutral', resourceAmount: 50 });
u3.orders.push({ type: 'harvest', targetId: 1000 });
exec.tick(0.016);
assert(u3.targetId === 1000, 'harvest sets node target');
// Simulate engine deposit: idle + no target + empty carry
u3.state = 'idle'; u3.targetId = null; u3.carryAmount = 0;
exec.tick(0.016);
assert(u3.targetId === 1000, 'harvester re-grabs node after deposit (AoE loop)');
node.isDead = true;
exec.tick(0.016);
assert(u3.orders.length === 0, 'harvest pops when node depleted');

// 5.4 REPAIR heals building, pops when full
const u4 = makeUnit(4, 0, 0, { canRepair: true });
const building = makeUnit(2000, 5, 0, { type: 'building', faction: 'player', maxHp: 100, hp: 50, speed: 0 });
u4.orders.push({ type: 'repair', targetId: 2000 });
exec.tick(0.016);
assert(u4.state === 'moving' && u4.targetPos.x === 5, 'repair walks to building');
u4.mesh.position.set(5, 0, 0); // arrive
let hpBefore = building.hp;
exec.tick(1.0);
assert(building.hp > hpBefore, 'repair increases building hp');
building.hp = building.maxHp; // finished
exec.tick(0.016);
assert(u4.orders.length === 0, 'repair pops when building full');

// 5.5 HOLD suppresses aggro
const u5 = makeUnit(5, 0, 0);
u5.orders.push({ type: 'hold' });
exec.tick(0.016);
assert(u5._noAggro === true && u5.targetId === null && u5.targetPos === null, 'hold clears targets + suppresses aggro');

// 5.6 PATROL alternates between origin and patrolStart
const u6 = makeUnit(6, 0, 0);
u6.orders.push({ type: 'patrol', patrolStart: new Vector3(8, 0, 0) });
exec.tick(0.016);
assert(u6.targetPos.x === 8, 'patrol heads to patrolStart');
u6.mesh.position.set(8, 0, 0);
exec.tick(0.016);
assert(u6.targetPos.x === 0, 'patrol returns to origin');
u6.mesh.position.set(0, 0, 0);
exec.tick(0.016);
assert(u6.targetPos.x === 8, 'patrol heads back to patrolStart');

// 5.7 Shift-queue advances through multiple orders
const u7 = makeUnit(7, 0, 0);
u7.orders.push(
  { type: 'move', destination: new Vector3(5, 0, 0) },
  { type: 'move', destination: new Vector3(10, 0, 0) }
);
exec.tick(0.016);
assert(u7.orders.length === 2 && u7.targetPos.x === 5, 'queue: head order active');
u7.mesh.position.set(5, 0, 0);
exec.tick(0.016);
assert(u7.orders.length === 1 && u7.targetPos.x === 10, 'queue: advances to next order');
u7.mesh.position.set(10, 0, 0);
exec.tick(0.016);
assert(u7.orders.length === 0, 'queue: all orders consumed');

// ─── Test 6: Minimap (RTS-6) — globals + basic lifecycle ───────────────
console.log('\n=== Test 6: Minimap (RTS-6) ===');
{
  const fs6 = require('fs');
  const path6 = require('path');
  const vm6 = require('vm');
  for (const name of ['rts-minimap.js', 'rts-production-palette.js']) {
    const code = fs6.readFileSync(path6.join('C:/Users/uncom/Desktop/buyasoul-cpl-fresh/src/genesis', name), 'utf8');
    vm6.runInThisContext(code, { filename: name });
  }
}
assert(typeof window.RTSMinimap === 'function', 'RTSMinimap class exposed');
assert(typeof window.RTSProductionPalette === 'function', 'RTSProductionPalette class exposed');

// Minimap: install + tick without error
const minimap = new window.RTSMinimap({ scene, camera, entities: execEntities });
minimap.install();
assert(minimap.canvas && minimap.canvas.width === 256, 'minimap canvas 256×256');
minimap.tick(0.016);
assert(true, 'minimap tick runs without error');
minimap.attackFlash(100, 200, 0xff4444);
assert(minimap._attackFlashes.length === 1, 'attack flash recorded');
minimap.tick(0.1);
assert(minimap._attackFlashes.length === 1, 'attack flash still alive (<4s)');
global.__advanceTime(5000); // simulate 5s passing
minimap.tick(10);
assert(minimap._attackFlashes.length === 0, 'attack flash expired (>4s)');

// ─── Test 7: Production Palette (RTS-5) — install + queue + spawn ──────
console.log('\n=== Test 7: Production Palette (RTS-5) ===');
const palette = new window.RTSProductionPalette({
  entities: execEntities, scene,
  economy: { RESOURCES: { profit: 2000 }, addResource: () => {} },
});
palette.install();
assert(palette._barEl && palette._slots.length === 15, 'palette bar with 15 slots');

// Select a building (fake)
const fakeBldg = { id: 3000, type: 'building', faction: 'player', isDead: false, mesh: { position: { x: 0, z: 0 } }, _prodType: 'barracks' };
palette.selectBuilding(fakeBldg);
assert(palette._visible === true, 'palette shows on building select');
assert(palette._slots[0]._def && palette._slots[0]._def.id === 'soldier', 'slot 0 = soldier');

// Enqueue
palette._enqueue(palette._slots[0]._def, 1);
assert(palette._queue.length === 1, 'queue has 1 item');
// Tick progress
palette.tick(2.0);
assert(palette._queue[0].elapsed === 2.0, 'queue elapsed advances');
palette.tick(2.0); // total 4s > soldier buildTime 3s
assert(palette._queue.length === 0, 'queue empties after buildTime');

// Deselect
palette.deselect();
assert(palette._visible === false, 'palette hides on deselect');

// ─── RESULTS ───────────────────────────────────────────────────────────
console.log('\n========================================');
if (failures.length === 0) {
  console.log('ALL TESTS PASSED ✅');
} else {
  console.log(`${failures.length} FAILURES:`);
  for (const f of failures) console.log(`  - ${f}`);
}
process.exit(failures.length === 0 ? 0 : 1);