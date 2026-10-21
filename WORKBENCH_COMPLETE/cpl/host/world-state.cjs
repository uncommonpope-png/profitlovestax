'use strict';
// world-state.cjs — CPL world state: buildings store (Assembly Phase 2)
// ============================================================================
// Dependency-free. The original genesis-host kept only in-memory,
// soul-shaped spawn records; the world had no building concept and every
// structure vanished on restart. This module is the CPL layer's buildings
// store: place/get/list of {id, type, name, position, createdBy, ts},
// persisted write-through (tmp file + rename) to a JSON file under the
// CPL data area so structures survive host restarts.

const fs = require('fs');
const path = require('path');

function createStore(file) {
  const store = {
    file,
    buildings: [],
    seq: 0,
  };

  store.load = function () {
    try {
      if (fs.existsSync(file)) {
        const data = JSON.parse(fs.readFileSync(file, 'utf8'));
        if (Array.isArray(data.buildings)) store.buildings = data.buildings;
        if (Number.isFinite(data.seq)) store.seq = data.seq;
      }
    } catch (e) {
      console.warn('[WorldState] could not load ' + file + ': ' + e.message);
    }
    return store;
  };

  store.save = function () {
    try {
      fs.mkdirSync(path.dirname(file), { recursive: true });
      const tmp = file + '.tmp';
      fs.writeFileSync(tmp, JSON.stringify({ buildings: store.buildings, seq: store.seq, savedAt: Date.now() }, null, 2));
      fs.renameSync(tmp, file);
    } catch (e) {
      console.warn('[WorldState] could not save ' + file + ': ' + e.message);
    }
  };

  store.place = function (input) {
    input = input || {};
    store.seq += 1;
    const building = {
      id: 'bldg-' + store.seq,
      type: String(input.type || 'tower'),
      name: String(input.name || 'Untitled'),
      position: input.position || { x: 0, y: 0, z: 0 },
      color: input.color || null,
      createdBy: input.createdBy || 'gsk',
      ts: Date.now(),
    };
    store.buildings.push(building);
    store.save();
    return building;
  };

  store.list = function () { return store.buildings.slice(); };

  store.find = function (key) {
    if (key == null) return null;
    const k = String(key);
    return store.buildings.find(b => b.id === k || b.name === k) || null;
  };

  return store.load();
}

module.exports = { createStore };
