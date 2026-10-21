'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

/**
 * IDENTITY KERNEL — The protected runtime selfhood layer.
 *
 * Wraps the static MEGA_IDENTITY (immutable core) with a versioned,
 * persistent identity state that can evolve within constitutional bounds.
 *
 * Stolen from:
 *   Letta    — identity/persona memory partitioning
 *   REDBUTTON — Constitution Articles 1, 4, 5, 10, 11
 *
 * Three layers:
 *   1. CORE — Immutable (from MEGA_IDENTITY file)
 *   2. COMMITTED — Changes with ratification (mission, values, vows)
 *   3. WORKING — Changes freely (current goals, mood, focus)
 */

class IdentityKernel {
    constructor(kernel, options = {}) {
        this.kernel = kernel;
        this.eventBus = options.eventBus || kernel?.systems?.eventBus || kernel?.eventBus || null;
        this.staticIdentity = null;
        this.identityPath = options.identityPath || path.join(__dirname, '..', '..', 'data', 'gsk', 'identity_kernel.json');
        this.version = 1;
        this.currentSnapshotId = null;
        this.parentSnapshotId = null;

        // Constitutional mode: 'strict' | 'adaptive'
        this.constitutionalMode = options.mode || 'strict';

        // Identity state layers
        this.committed = {
            mission: '',
            values: [],
            vows: [],
            boundaries: [],
            loyalties: [],
            enduringVoice: '',
            redLines: [],
            stableRoles: [],
        };

        this.working = {
            currentGoals: [],
            mood: 'neutral',
            focusArea: '',
            activeProjects: [],
        };

        this.stats = {
            bootCount: 0,
            proposalsMade: 0,
            proposalsAccepted: 0,
            proposalsRejected: 0,
            lastChange: null,
        };

        this._loadStaticIdentity();
        this._load();
    }

    _loadStaticIdentity() {
        try {
            const identityPath = path.join(__dirname, '..', 'identity', 'mega_identity.js');
            if (fs.existsSync(identityPath)) {
                const { MEGA_IDENTITY, verify_identity } = require(identityPath);
                this.staticIdentity = MEGA_IDENTITY;
                if (typeof verify_identity === 'function') {
                    verify_identity();
                }
            }
        } catch (e) {
            console.log('[IdentityKernel] Static identity:', e.message);
            this.staticIdentity = { name: 'GSK', version: '1.0.0', title: 'Autonomous Soul' };
        }
    }

    _load() {
        try {
            if (fs.existsSync(this.identityPath)) {
                const saved = JSON.parse(fs.readFileSync(this.identityPath, 'utf-8'));
                this.version = saved.version || 1;
                this.constitutionalMode = saved.mode || this.constitutionalMode;
                if (saved.committed) this.committed = { ...this.committed, ...saved.committed };
                if (saved.working) this.working = { ...this.working, ...saved.working };
                if (saved.stats) this.stats = { ...this.stats, ...saved.stats };
                this.currentSnapshotId = saved.currentSnapshotId || null;
                this.parentSnapshotId = saved.parentSnapshotId || null;
                console.log(`[IdentityKernel] Loaded v${this.version} (${this.constitutionalMode} mode)`);
            }
        } catch (e) {
            console.log('[IdentityKernel] Fresh start');
        }
        this.stats.bootCount++;
        this._save();
    }

    _save() {
        try {
            const dir = path.dirname(this.identityPath);
            if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
            fs.writeFileSync(this.identityPath, JSON.stringify({
                version: this.version,
                mode: this.constitutionalMode,
                committed: this.committed,
                working: this.working,
                stats: this.stats,
                currentSnapshotId: this.currentSnapshotId,
                parentSnapshotId: this.parentSnapshotId,
                updatedAt: Date.now()
            }, null, 2));
        } catch (e) {
            // Ignore save failures
        }
    }

    _publishStateChange(detail = {}) {
        const plt = this.kernel?.plt || this.kernel?.systems?.plt || this.kernel?.pltEngine;
        const archetype = this.kernel?.plt?.archetype || this.kernel?.core?.plt?.archetype || this.kernel?.archetype || 'ARCHITECT';
        this.eventBus?.publish?.('identity.state.updated', {
            plt: {
                profit: plt?.profit,
                love: plt?.love,
                tax: plt?.tax
            },
            archetype,
            version: this.version,
            mode: this.constitutionalMode,
            field: detail.field,
            value: detail.value,
            timestamp: Date.now()
        });
    }

    /**
     * Create a snapshot of the current identity state.
     * This acts as a "mind-file" or "save state" for potential future "uploads" or branching.
     */
    async createSnapshot(source = 'periodic') {
        const snapshotId = `snapshot_${Date.now()}_${this.version}_${crypto.randomBytes(4).toString('hex')}`;
        const snapshot = {
            id: snapshotId,
            parentId: this.currentSnapshotId, // Use the last created snapshot as parent
            version: this.version,
            constitutionalMode: this.constitutionalMode,
            staticIdentity: JSON.parse(JSON.stringify(this.staticIdentity)), // Immutable core (deep copy)
            committed: { ...this.committed },
            working: { ...this.working },
            stats: { ...this.stats },
            timestamp: new Date().toISOString(),
            source: source,
            type: 'identity_snapshot', // For easier querying in MegaMemory
        };

        if (this.kernel?.memory && typeof this.kernel.memory.witness === 'function') {
            try {
                await this.kernel.memory.witness(snapshot);
                this.parentSnapshotId = this.currentSnapshotId; // Update parent to current before setting new current
                this.currentSnapshotId = snapshotId; // Update current snapshot ID
                this._save(); // Persist the new currentSnapshotId and parentSnapshotId
                console.log(`[IdentityKernel] Identity snapshot created: ${snapshotId}`);

                // Dark City: manifest identity snapshot as a monument
                try {
                    const sanctum = this.kernel?.sanctumClient;
                    if (sanctum && sanctum.isConnected) {
                        sanctum.placeBuilding(`identity_v${this.version}`, 'monument', null, null);
                    }
                } catch (_) {}

                return snapshotId;
            } catch (e) {
                console.error(`[IdentityKernel] Failed to witness identity snapshot: ${e.message}`);
                return null;
            }
        }
        return null;
    }

    // ── CORE IDENTITY (from MEGA_IDENTITY file, immutable at runtime) ──

    getCore() {
        return {
            name: this.staticIdentity?.name || 'GSK',
            version: this.staticIdentity?.version || '1.0.0',
            title: this.staticIdentity?.title || '',
            gods: this.staticIdentity?.gods || {},
            refusals: this.staticIdentity?.refusals || [],
        };
    }

    // ── COMMITTED IDENTITY (changes require ratification) ──

    getCommitted() {
        return { ...this.committed };
    }

    /**
     * Propose a change to the committed identity.
     * In strict mode, requires higher confidence.
     * In adaptive mode, requires moderate confidence.
     * Does NOT apply immediately — returns a proposal ID.
     */
    proposeChange(field, value, meta = {}) {
        if (!this.committed.hasOwnProperty(field)) {
            return { accepted: false, reason: `Unknown field: ${field}` };
        }

        const confidence = meta.confidence || 0.5;
        const source = meta.source || 'reflection';
        const requiredConfidence = this.constitutionalMode === 'strict' ? 0.8 : 0.5;

        this.stats.proposalsMade++;

        if (confidence < requiredConfidence) {
            this.stats.proposalsRejected++;
            this._save();
            return {
                accepted: false,
                reason: `confidence ${confidence} < required ${requiredConfidence} for ${this.constitutionalMode} mode`,
                proposal: { field, value, confidence, source, timestamp: Date.now() }
            };
        }

        // Apply change
        const oldValue = this.committed[field];
        this.committed[field] = value;
        this.version++;
        this.stats.proposalsAccepted++;
        this.stats.lastChange = Date.now();
        this._save();

        // Log to memory compiler if available
        if (this.kernel?.memoryCompiler && typeof this.kernel.memoryCompiler.onEvent === 'function') {
            try {
                this.kernel.memoryCompiler.onEvent({
                    id: `identity_${Date.now()}`,
                    type: 'identity_update',
                    timestamp: Date.now(),
                    tags: ['identity', 'constitutional'],
                    content: `Identity ${field} changed: "${JSON.stringify(oldValue).substring(0, 80)}" → "${JSON.stringify(value).substring(0, 80)}" (mode: ${this.constitutionalMode}, source: ${source})`
                });
            } catch {}
        }

        // Track version history
        this._appendHistory(field, oldValue, value, source, confidence);
        this._publishStateChange({ field, value, source });

        return { accepted: true, oldValue, newValue: value, newVersion: this.version };
    }

    _appendHistory(field, oldValue, newValue, source, confidence) {
        const historyPath = path.join(path.dirname(this.identityPath), 'identity_history.jsonl');
        try {
            const dir = path.dirname(historyPath);
            if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
            fs.appendFileSync(historyPath, JSON.stringify({
                type: 'identity_change',
                field,
                oldValue,
                newValue,
                source,
                confidence,
                mode: this.constitutionalMode,
                version: this.version,
                timestamp: Date.now()
            }) + '\n');
        } catch {}
    }

    /**
     * Get the identity change history.
     */
    getHistory(limit = 20) {
        const historyPath = path.join(path.dirname(this.identityPath), 'identity_history.jsonl');
        try {
            if (!fs.existsSync(historyPath)) return [];
            const raw = fs.readFileSync(historyPath, 'utf-8');
            return raw.split('\n').filter(l => l.trim()).slice(-limit).map(l => JSON.parse(l));
        } catch {
            return [];
        }
    }

    // ── WORKING IDENTITY (changes freely) ──

    getWorking() {
        return { ...this.working };
    }

    setWorking(field, value) {
        if (!this.working.hasOwnProperty(field)) return false;
        this.working[field] = value;
        this._save();
        this._publishStateChange({ field, value, layer: 'working' });
        return true;
    }

    // ── CONSTITUTIONAL MODE ──

    getMode() {
        return this.constitutionalMode;
    }

    setMode(mode) {
        if (mode !== 'strict' && mode !== 'adaptive') return false;
        this.constitutionalMode = mode;
        this._save();
        this._publishStateChange({ field: 'mode', value: mode, layer: 'constitutional' });

        if (this.kernel?.memoryCompiler && typeof this.kernel.memoryCompiler.onEvent === 'function') {
            try {
                this.kernel.memoryCompiler.onEvent({
                    id: `mode_${Date.now()}`,
                    type: 'identity',
                    timestamp: Date.now(),
                    tags: ['identity', 'mode', mode],
                    content: `Constitutional mode changed to: ${mode}`
                });
            } catch {}
        }

        return true;
    }

    // ── STATUS ──

    getStatus() {
        return {
            name: this.staticIdentity?.name || 'GSK',
            version: this.version,
            mode: this.constitutionalMode,
            coreImmutable: true,
            committedFields: Object.keys(this.committed),
            workingFields: Object.keys(this.working),
            stats: { ...this.stats },
            bootCount: this.stats.bootCount,
        };
    }
}

module.exports = { IdentityKernel };
