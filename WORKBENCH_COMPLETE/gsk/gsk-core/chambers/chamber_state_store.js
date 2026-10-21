'use strict';

/**
 * CHAMBER_STATE_STORE — general persistence for MegaChambers' chamber system.
 *
 * Modeled directly on the proven AffectChamber pattern in mega_chambers.js
 * (affect_state.json beside mythos_state.json on the runtime state shelf):
 * restore-at-construction, save-on-change, atomic writes.
 *
 * Design:
 *  - ONE store file (chamber_states.json) beside affect_state.json in the
 *    MegaChambers dataDir — a directory already excluded from git in both
 *    trees (itsus: gsk/.gitignore `data/gsk/*`; specimen: root .gitignore
 *    `WORKBENCH_COMPLETE/gsk/data/`), so runtime state never enters a push.
 *  - Chambers do NOT need serialize()/restore() methods. The store extracts
 *    each chamber's real serializable state: own enumerable data properties,
 *    recursing through plain objects, arrays, nested class instances (the
 *    wrapper chambers — AgenticWillChamber.will, LoveCapacityChamber.love,
 *    MetaConsciousnessChamber.meta, MortalityChamber.mortality), Sets, Maps
 *    and Dates (tagged encodings). Functions, symbols, live system
 *    references (kernel/parent/fusion/memory/thalamicGate/affect refs),
 *    filesystem paths and cyclic branches are skipped — state extraction,
 *    never stringification of live objects.
 *  - Restore assigns INTO the live instances (never replaces them), so
 *    references held elsewhere (contract guards, fusion, kernel.memory
 *    pointers) stay valid. Plain-object containers (e.g. MemoryChamber's
 *    semantic map) accept new keys; class instances only receive keys they
 *    already own.
 *  - Saves are dirty-gated: breathe()/mutations mark the store dirty, a
 *    periodic checkpoint (30s) flushes only when the snapshot actually
 *    changed since the last write, and flush() is called explicitly on
 *    graceful shutdown (fusion stop()). Writes are atomic (tmp + rename):
 *    a hard kill mid-write can lose the newest checkpoint but can never
 *    corrupt the store.
 */

const fs = require('fs');
const path = require('path');

// Live references / infrastructure — never state, never persisted.
const SKIP_KEYS = new Set([
    'kernel', '_kernel', 'parent', '_parent', 'megaChambers', 'fusion',
    'thalamicGate', 'dataDir', 'statePath', 'journalPath', '_statePath',
    '_saveCounter', 'affectStatePath', 'chamberStatePath',
]);

const MAX_DEPTH = 8;
const MAX_ARRAY = 200;
const MAX_STRING = 5000;

function isPlainObject(v) {
    if (v === null || typeof v !== 'object') return false;
    const proto = Object.getPrototypeOf(v);
    return proto === Object.prototype || proto === null;
}

function extractState(value, ancestors, depth) {
    if (value === null) return null;
    const t = typeof value;
    if (t === 'number') return Number.isFinite(value) ? value : null;
    if (t === 'string') return value.length > MAX_STRING ? value.slice(0, MAX_STRING) : value;
    if (t === 'boolean') return value;
    if (t !== 'object') return undefined; // functions, symbols, bigint, undefined
    if (depth > MAX_DEPTH) return undefined;
    if (ancestors.has(value)) return undefined; // cyclic branch — a live reference, not state

    if (value instanceof Date) return { __type: 'Date', value: value.toISOString() };
    if (value instanceof Set) {
        return { __type: 'Set', items: [...value].slice(-MAX_ARRAY).map(v => extractState(v, ancestors, depth + 1)).filter(v => v !== undefined) };
    }
    if (value instanceof Map) {
        return { __type: 'Map', entries: [...value.entries()].slice(-MAX_ARRAY).map(([k, v]) => [extractState(k, ancestors, depth + 1), extractState(v, ancestors, depth + 1)]).filter(([k]) => k !== undefined) };
    }
    if (Array.isArray(value)) {
        ancestors.add(value);
        const out = value.slice(-MAX_ARRAY).map(v => extractState(v, ancestors, depth + 1)).filter(v => v !== undefined);
        ancestors.delete(value);
        return out;
    }
    // Plain object or class instance: own enumerable data properties.
    ancestors.add(value);
    const out = {};
    for (const key of Object.keys(value)) {
        if (SKIP_KEYS.has(key)) continue;
        let v;
        try { v = value[key]; } catch (e) { continue; }
        if (typeof v === 'function') continue;
        const ex = extractState(v, ancestors, depth + 1);
        if (ex !== undefined) out[key] = ex;
    }
    ancestors.delete(value);
    return out;
}

function cloneDecoded(snapshot, depth) {
    // Deep-clone a decoded snapshot value into fresh plain data (for array
    // replacement and new keys on plain-object containers).
    if (snapshot === null || typeof snapshot !== 'object') return snapshot;
    if (depth > MAX_DEPTH) return undefined;
    if (Array.isArray(snapshot)) return snapshot.map(v => cloneDecoded(v, depth + 1));
    if (snapshot.__type === 'Set') return new Set((snapshot.items || []).map(v => cloneDecoded(v, depth + 1)));
    if (snapshot.__type === 'Map') return new Map((snapshot.entries || []).map(([k, v]) => [cloneDecoded(k, depth + 1), cloneDecoded(v, depth + 1)]));
    if (snapshot.__type === 'Date') return new Date(snapshot.value);
    const out = {};
    for (const key of Object.keys(snapshot)) {
        const c = cloneDecoded(snapshot[key], depth + 1);
        if (c !== undefined) out[key] = c;
    }
    return out;
}

function applyState(target, snapshot, depth) {
    if (!target || typeof target !== 'object' || !snapshot || typeof snapshot !== 'object') return;
    if (depth > MAX_DEPTH) return;
    const targetIsPlain = isPlainObject(target);
    for (const key of Object.keys(snapshot)) {
        if (SKIP_KEYS.has(key)) continue;
        const snapVal = snapshot[key];
        let cur;
        try { cur = target[key]; } catch (e) { continue; }
        if (typeof cur === 'function') continue;
        const curExists = Object.prototype.hasOwnProperty.call(target, key);
        if (!curExists && !targetIsPlain) continue; // class instances: only keys they own

        if (snapVal !== null && typeof snapVal === 'object') {
            if (snapVal.__type === 'Set') {
                if (cur instanceof Set) { cur.clear(); for (const item of snapVal.items || []) cur.add(cloneDecoded(item, depth + 1)); }
                else target[key] = cloneDecoded(snapVal, depth + 1);
                continue;
            }
            if (snapVal.__type === 'Map') {
                if (cur instanceof Map) { cur.clear(); for (const [k, v] of snapVal.entries || []) cur.set(cloneDecoded(k, depth + 1), cloneDecoded(v, depth + 1)); }
                else target[key] = cloneDecoded(snapVal, depth + 1);
                continue;
            }
            if (snapVal.__type === 'Date') { target[key] = new Date(snapVal.value); continue; }
            if (Array.isArray(snapVal)) { target[key] = cloneDecoded(snapVal, depth + 1); continue; }
            if (cur !== null && typeof cur === 'object' && !(cur instanceof Date)) {
                applyState(cur, snapVal, depth + 1); // recurse into live instance / container
                continue;
            }
            target[key] = cloneDecoded(snapVal, depth + 1);
            continue;
        }
        target[key] = snapVal; // primitive
    }
}

class ChamberStateStore {
    constructor(filePath, getChambers) {
        this.filePath = filePath || null;
        this._getChambers = getChambers; // () => [{name, instance}]
        this._loaded = null;             // parsed store file, if any
        this._lastSavedJson = null;
        this._dirty = false;
        this._timer = null;
        if (this.filePath && fs.existsSync(this.filePath)) {
            try {
                this._loaded = JSON.parse(fs.readFileSync(this.filePath, 'utf8'));
                if (this._loaded && this._loaded.chambers) {
                    this._lastSavedJson = JSON.stringify(this._loaded.chambers);
                }
            } catch (e) {
                console.warn('[ChamberStateStore] State load failed (continuing with defaults):', e.message);
                this._loaded = null;
            }
        }
    }

    /** Restore one chamber from the loaded store (call at construction / addChamber). */
    restore(name, instance) {
        if (!this._loaded || !this._loaded.chambers || !instance) return false;
        const snap = this._loaded.chambers[name];
        if (!snap) return false;
        try {
            applyState(instance, snap, 0);
            return true;
        } catch (e) {
            console.warn(`[ChamberStateStore] Restore of '${name}' failed (defaults kept):`, e.message);
            return false;
        }
    }

    snapshot() {
        const chambers = {};
        for (const { name, instance } of this._getChambers()) {
            if (!instance) continue;
            try {
                const state = extractState(instance, new Set(), 0);
                if (state && Object.keys(state).length > 0) chambers[name] = state;
            } catch (e) {
                console.warn(`[ChamberStateStore] Snapshot of '${name}' failed (skipped):`, e.message);
            }
        }
        return chambers;
    }

    markDirty() { this._dirty = true; }

    /** Flush if dirty and the snapshot actually changed. Atomic tmp+rename. */
    flush(reason = 'checkpoint') {
        if (!this.filePath) return false;
        if (!this._dirty && reason === 'checkpoint') return false;
        let json;
        try {
            json = JSON.stringify(this.snapshot());
        } catch (e) {
            console.warn('[ChamberStateStore] Snapshot failed (save skipped):', e.message);
            return false;
        }
        if (json === this._lastSavedJson) { this._dirty = false; return false; }
        try {
            fs.mkdirSync(path.dirname(this.filePath), { recursive: true });
            const tmp = `${this.filePath}.tmp-${process.pid}`;
            fs.writeFileSync(tmp, JSON.stringify({ version: 1, savedAt: Date.now(), reason, chambers: JSON.parse(json) }, null, 2), 'utf8');
            fs.renameSync(tmp, this.filePath);
            this._lastSavedJson = json;
            this._dirty = false;
            return true;
        } catch (e) {
            console.warn('[ChamberStateStore] Save failed:', e.message);
            return false;
        }
    }

    startCheckpoint(intervalMs = 30000) {
        if (!this.filePath || this._timer) return;
        this._timer = setInterval(() => { try { this.flush('checkpoint'); } catch (e) {} }, intervalMs);
        if (this._timer.unref) this._timer.unref();
    }

    stopCheckpoint() {
        if (this._timer) { clearInterval(this._timer); this._timer = null; }
    }
}

module.exports = { ChamberStateStore, extractState, applyState };
