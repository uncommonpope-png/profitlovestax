'use strict';

/**
 * HITLGates — Human-in-the-Loop interception at any phase
 *
 * LangGraph parity: interrupt, review, resume with modified state
 * WebSocket + HTTP API for external approval
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

class HITLGates {
    constructor(kernel, options = {}) {
        this.kernel = kernel;
        this.gateDir = options.gateDir || path.join(__dirname, '../../data/hitl_gates');
        this.wsServer = options.wsServer; // Optional WebSocket server for real-time
        this.pendingGates = new Map(); // cycleId -> { phase, state, resolve, reject, timeout }

        if (!fs.existsSync(this.gateDir)) {
            fs.mkdirSync(this.gateDir, { recursive: true });
        }

        // Phases that can be interrupted (all except terminal)
        this.interruptiblePhases = new Set([
            'observe', 'perceive', 'feel', 'think', 'decide',
            'act', 'verify', 'witness', 'journal', 'dream',
            'synthesize', 'sleep', 'wake', 'integrate'
        ]);
    }

    /**
     * Check if a phase should trigger HITL
     * Can be configured via kernel settings or per-cycle metadata
     */
    shouldInterrupt(phase, state) {
        if (!this.interruptiblePhases.has(phase)) return false;

        // Check global config
        const hitlConfig = this.kernel?.config?.hitl || {};
        if (hitlConfig.enabled === false) return false;

        // Check phase-specific config
        const phaseConfig = hitlConfig.phases?.[phase];
        if (phaseConfig?.enabled === false) return false;

        // Check for manual trigger flag in state
        if (state.metadata?.hitlTriggerPhases?.includes(phase)) return true;

        // Check for risk level (act/verify always interrupt on high risk)
        if (['act', 'verify'].includes(phase)) {
            const risk = state.execution?.risk || state.goal?.risk;
            if (risk === 'high' || risk === 'critical') return true;
        }

        // Check for explicit approval requirement
        if (state.execution?.requiresApproval === true) return true;

        return false;
    }

    /**
     * Trigger HITL gate — pauses execution, waits for approval
     * Returns a promise that resolves when approval received
     */
    async interrupt(phase, state) {
        const cycleId = state.cycleId;
        const gateId = `gate_${cycleId}_${phase}_${Date.now()}`;

        // Create gate record
        const gate = {
            gateId,
            cycleId,
            phase,
            state: this._serializeForGate(state),
            requestedAt: Date.now(),
            status: 'pending'
        };

        // Save to disk for persistence
        const gatePath = path.join(this.gateDir, `${gateId}.json`);
        fs.writeFileSync(gatePath, JSON.stringify(gate, null, 2), 'utf-8');

        // Notify WebSocket clients
        this._broadcast({ type: 'hitl_request', gate });

        // Create promise that waits for approval
        return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                this.pendingGates.delete(cycleId);
                gate.status = 'timeout';
                this._saveGate(gate);
                this._broadcast({ type: 'hitl_timeout', gate });
                reject(new Error(`HITL timeout for ${cycleId} at ${phase}`));
            }, 300000); // 5 min default timeout

            this.pendingGates.set(cycleId, { gate, resolve, reject, timeout });
        });
    }

    /**
     * Provide approval for a waiting gate
     */
    async approve(gateId, approval) {
        // Find gate in pending or on disk
        let gate = null;
        let pendingEntry = null;

        for (const [cycleId, entry] of this.pendingGates) {
            if (entry.gate.gateId === gateId) {
                gate = entry.gate;
                pendingEntry = entry;
                break;
            }
        }

        if (!gate) {
            // Check disk
            const gatePath = path.join(this.gateDir, `${gateId}.json`);
            if (fs.existsSync(gatePath)) {
                gate = JSON.parse(fs.readFileSync(gatePath, 'utf-8'));
            }
        }

        if (!gate) {
            throw new Error(`Gate not found: ${gateId}`);
        }

        // Validate approval
        const action = approval?.action || 'approve';
        if (!['approve', 'modify', 'reject'].includes(action)) {
            throw new Error(`Invalid action: ${action}. Must be approve/modify/reject`);
        }

        gate.status = action;
        gate.approval = {
            action,
            modifiedState: approval.modifiedState || null,
            reason: approval.reason || '',
            approvedBy: approval.approvedBy || 'human',
            approvedAt: Date.now()
        };

        this._saveGate(gate);
        this._broadcast({ type: 'hitl_response', gate });

        // Resolve pending promise if exists
        if (pendingEntry) {
            clearTimeout(pendingEntry.timeout);
            this.pendingGates.delete(gate.cycleId);

            if (action === 'approve') {
                pendingEntry.resolve({ action: 'approve', state: gate.state });
            } else if (action === 'modify') {
                pendingEntry.resolve({ action: 'modify', state: approval.modifiedState });
            } else {
                pendingEntry.reject(new Error(`HITL rejected: ${approval.reason}`));
            }
        }

        return gate;
    }

    /**
     * Get all pending gates (for dashboard)
     */
    getPendingGates() {
        const gates = [];

        // From memory
        for (const entry of this.pendingGates.values()) {
            gates.push({ ...entry.gate, waitTimeMs: Date.now() - entry.gate.requestedAt });
        }

        // From disk (stale/pending from restarts)
        const files = fs.readdirSync(this.gateDir).filter(f => f.endsWith('.json'));
        for (const file of files) {
            const gate = JSON.parse(fs.readFileSync(path.join(this.gateDir, file), 'utf-8'));
            if (gate.status === 'pending' && !this.pendingGates.has(gate.cycleId)) {
                gates.push({ ...gate, waitTimeMs: Date.now() - gate.requestedAt, stale: true });
            }
        }

        return gates;
    }

    /**
     * Get gate history for a cycle
     */
    getGateHistory(cycleId) {
        const files = fs.readdirSync(this.gateDir)
            .filter(f => f.startsWith(`gate_${cycleId}_`) && f.endsWith('.json'))
            .sort();

        return files.map(f => {
            const gate = JSON.parse(fs.readFileSync(path.join(this.gateDir, f), 'utf-8'));
            return {
                gateId: gate.gateId,
                phase: gate.phase,
                status: gate.status,
                requestedAt: gate.requestedAt,
                approval: gate.approval
            };
        });
    }

    /**
     * Middleware: wrap a phase handler with HITL check
     */
    withHITL(phase, handler) {
        return async (state) => {
            // Execute phase first
            let newState = await handler(state);

            // Check if we should interrupt AFTER phase completes
            // (LangGraph model: interrupt at node boundaries)
            if (this.shouldInterrupt(phase, newState)) {
                try {
                    const approval = await this.interrupt(phase, newState);

                    if (approval.action === 'approve') {
                        // Continue with original state
                        return newState;
                    } else if (approval.action === 'modify') {
                        // Continue with modified state
                        return { ...newState, ...approval.state, hitlModified: true };
                    } else {
                        // Rejected - throw to trigger fail path
                        throw new Error(`HITL rejected at ${phase}: ${approval.reason}`);
                    }
                } catch (e) {
                    if (e.message.includes('HITL')) throw e;
                    // Other errors (timeout, etc) - treat as reject
                    throw new Error(`HITL error at ${phase}: ${e.message}`);
                }
            }

            return newState;
        };
    }

    _saveGate(gate) {
        const gatePath = path.join(this.gateDir, `${gate.gateId}.json`);
        fs.writeFileSync(gatePath, JSON.stringify(gate, null, 2), 'utf-8');
    }

    _serializeForGate(state) {
        // Remove heavy/non-serializable fields
        const { kernel, checkpoints, ...serializable } = state;
        return serializable;
    }

    _broadcast(message) {
        if (this.wsServer && typeof this.wsServer.broadcast === 'function') {
            this.wsServer.broadcast(JSON.stringify(message));
        }
    }

    /**
     * Cleanup old gates
     */
    cleanup(maxAgeMs = 86400000) { // 24 hours
        const files = fs.readdirSync(this.gateDir).filter(f => f.endsWith('.json'));
        const now = Date.now();

        for (const file of files) {
            const filePath = path.join(this.gateDir, file);
            const stats = fs.statSync(filePath);
            if (now - stats.mtimeMs > maxAgeMs) {
                fs.unlinkSync(filePath);
            }
        }
    }
}

module.exports = { HITLGates };