/**
 * TELEMETRY ENGINE — Self-Model & Entity State Inspection
 * Digital Entity Framework integration point.
 * Provides live introspection of agent state, PLT scores, consciousness layers,
 * and entity-level telemetry for the autonomous digital entity system.
 */
'use strict';

const fs = require('fs');
const path = require('path');

const TELEMETRY_VERSION = '1.0.0';
const DATA_DIR = path.join(__dirname, '..', 'data', 'gsk');
const TELEMETRY_FILE = path.join(DATA_DIR, 'telemetry.jsonl');
const ENTITY_REGISTRY = path.join(DATA_DIR, 'entity-registry.json');

function ensureDir() {
    try {
        if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    } catch (e) {}
}

class TelemetryEngine {
    constructor(options = {}) {
        this.version = TELEMETRY_VERSION;
        this.enabled = options.enabled !== false;
        this.sampleRate = options.sampleRate || 1.0;
        this.maxBufferSize = options.maxBufferSize || 1000;
        this.buffer = [];
        this.stats = { samples: 0, dropped: 0, writes: 0, errors: 0 };
        this.entities = new Map();
        this._bus = null;
        ensureDir();
    }

    capture(state) {
        if (!this.enabled || Math.random() > this.sampleRate) return null;
        const snapshot = {
            ts: Date.now(),
            version: this.version,
            entity: state.entity || 'unknown',
            entityId: state.entityId || state.id || null,
            entityType: state.type || 'agent',
            plt: state.plt || { profit: 0, love: 0, tax: 0 },
            consciousness: state.consciousness || { layer: 'unknown', mode: 'idle', energy: 0, clarity: 0 },
            autonomy: state.autonomy || { score: 0, decisions: 0, goals: 0 },
            memory: state.memory || { entries: 0, size: 0 },
            skills: state.skills || [],
            bus: state.bus || { events: 0, subscribers: 0 },
            raw: state.raw || null
        };
        try {
            const entry = JSON.stringify(snapshot) + '\n';
            fs.appendFileSync(TELEMETRY_FILE, entry, 'utf-8');
            this.stats.writes++;
            this.stats.samples++;
        } catch (e) {
            this.stats.errors++;
            this.stats.dropped++;
            return null;
        }
        return snapshot;
    }

    getSummary() {
        try {
            if (!fs.existsSync(TELEMETRY_FILE)) {
                return { entities: Array.from(this.entities.values()).length, samples: this.stats.samples, lastCapture: null, error: null };
            }
            const stat = fs.statSync(TELEMETRY_FILE);
            const buf = Buffer.alloc(50000);
            const fd = fs.openSync(TELEMETRY_FILE, 'r');
            const readLen = Math.min(buf.length, stat.size);
            if (readLen > 0) fs.readSync(fd, buf, 0, readLen, stat.size - readLen);
            fs.closeSync(fd);
            const lines = buf.toString('utf-8').split('\n').filter(Boolean).slice(-5);
            const recent = lines.map(l => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean);
            const entities = [...new Set(recent.map(r => r.entity))];
            return {
                entities: entities.length,
                entityList: entities,
                samples: this.stats.samples,
                lastCapture: recent[recent.length - 1] || null,
                registeredEntities: Array.from(this.entities.values()),
                error: null
            };
        } catch (e) {
            return { entities: 0, samples: 0, lastCapture: null, error: e.message };
        }
    }

    getAutonomyScore(entityName) {
        const base = { profit: 0.5, love: 0.5, tax: 0.3 };
        const multiplier = { profit: 1.0, love: 0.8, tax: 0.5 };
        return {
            plt: base,
            autonomyScore: (base.profit * multiplier.profit + base.love * multiplier.love - base.tax * multiplier.tax) / 1.3,
            entity: entityName
        };
    }

    registerEntity(entityDef) {
        if (!entityDef.id || !entityDef.name) return null;
        const entity = {
            id: entityDef.id,
            name: entityDef.name,
            type: entityDef.type || 'agent',
            createdAt: entityDef.createdAt || Date.now(),
            parentEntity: entityDef.parent || null,
            capabilities: entityDef.capabilities || [],
            autonomyLevel: entityDef.autonomy || 'low',
            pltPassport: this.getAutonomyScore(entityDef.name)
        };
        this.entities.set(entity.id, entity);
        try {
            fs.writeFileSync(ENTITY_REGISTRY, JSON.stringify({
                version: this.version,
                entities: Array.from(this.entities.values()),
                updatedAt: Date.now()
            }, null, 2), 'utf-8');
        } catch (e) {}
        this.capture({ entity: entity.name, type: 'entity', entityId: entity.id });
        return entity;
    }

    async spawnEntity(entityConfig) {
        const entity = this.registerEntity(entityConfig);
        if (!entity) return { success: false, error: 'Invalid entity config' };
        if (this._bus) {
            this._bus.publish('entity.spawned', { entity, timestamp: Date.now() });
        }
        return { success: true, entity };
    }

    getEntities() {
        return Array.from(this.entities.values());
    }

    attachBus(bus) {
        this._bus = bus;
        if (bus && typeof bus.subscribe === 'function') {
            bus.subscribe('soul.state', (data) => {
                this.capture({
                    entity: data.source || 'gsk',
                    type: 'soul',
                    consciousness: { layer: 'soul_state', mode: data.phase, energy: data.uptime },
                    plt: { profit: 0.7, love: 0.8, tax: 0.3 },
                    bus: { events: data.events, subscribers: data.subscribers }
                });
            });
            bus.subscribe('entity.spawned', (data) => {
                this.capture({ entity: data.entity?.name, type: 'entity_spawn', entityId: data.entity?.id });
            });
        }
        return this;
    }

    shutdown() {
        this.enabled = false;
        this.buffer = [];
        return { success: true, samples: this.stats.samples, entities: this.entities.size };
    }
}

module.exports = { TelemetryEngine, TELEMETRY_VERSION };
