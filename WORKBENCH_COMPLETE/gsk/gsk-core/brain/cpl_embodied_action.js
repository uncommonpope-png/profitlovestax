'use strict';

/**
 * CPLEmbodiedAction — GSK acts in CPL world (Phase 20)
 *
 * Actions: move_to, build_structure, spawn_unit, research_tech, trade
 * Via rts-bridge.js → window.rtsOrderExecutor (already exposed)
 * Action results feed back as observations to GSK
 */

class CPLEmbodiedAction {
    constructor(kernel, options = {}) {
        this.kernel = kernel;
        this.cplHttpUrl = options.cplHttpUrl || 'http://localhost:3457';
        this.actionHistory = [];
        this.pendingActions = new Map(); // actionId -> { resolve, reject, timeout }
    }

    /**
     * Execute an embodied action in CPL
     * action = { type, params, callback? }
     */
    async execute(action) {
        const { type, params = {}, callback } = action;
        const actionId = `action_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        const actionRecord = {
            id: actionId,
            type,
            params,
            status: 'pending',
            requestedAt: Date.now(),
            callback
        };

        this.actionHistory.push(actionRecord);
        this.pendingActions.set(actionId, actionRecord);

        try {
            let result;

            switch (type) {
                case 'move_to':
                    result = await this._moveTo(params);
                    break;
                case 'build_structure':
                    result = await this._buildStructure(params);
                    break;
                case 'spawn_unit':
                    result = await this._spawnUnit(params);
                    break;
                case 'research_tech':
                    result = await this._researchTech(params);
                    break;
                case 'trade':
                    result = await this._trade(params);
                    break;
                case 'attack':
                    result = await this._attack(params);
                    break;
                case 'gather':
                    result = await this._gather(params);
                    break;
                default:
                    throw new Error(`Unknown action type: ${type}`);
            }

            actionRecord.status = 'completed';
            actionRecord.result = result;
            actionRecord.completedAt = Date.now();

            if (callback) {
                try {
                    callback(null, result);
                } catch (e) {
                    console.warn('[CPLEmbodiedAction] Callback error:', e.message);
                }
            }

            return { success: true, actionId, result };

        } catch (error) {
            actionRecord.status = 'failed';
            actionRecord.error = error.message;
            actionRecord.completedAt = Date.now();

            if (callback) {
                callback(error, null);
            }

            return { success: false, actionId, error: error.message };
        } finally {
            this.pendingActions.delete(actionId);
        }
    }

    /**
     * Move to position
     * params: { x, z, entityId? }
     */
    async _moveTo(params) {
        const { x, z, entityId = 'gsk_avatar' } = params;

        const response = await fetch(`${this.cplHttpUrl}/api/rts/order`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                type: 'move',
                entityId,
                target: { x, z }
            })
        });

        if (!response.ok) {
            throw new Error(`Move failed: ${response.status}`);
        }

        return await response.json();
    }

    /**
     * Build structure
     * params: { structureType, x, z, playerId? }
     */
    async _buildStructure(params) {
        const { structureType, x, z, playerId = 'gsk' } = params;

        const response = await fetch(`${this.cplHttpUrl}/api/rts/order`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                type: 'build',
                structureType,
                position: { x, z },
                playerId
            })
        });

        if (!response.ok) {
            throw new Error(`Build failed: ${response.status}`);
        }

        return await response.json();
    }

    /**
     * Spawn unit
     * params: { unitType, x, z, playerId? }
     */
    async _spawnUnit(params) {
        const { unitType, x, z, playerId = 'gsk' } = params;

        const response = await fetch(`${this.cplHttpUrl}/api/rts/order`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                type: 'spawn',
                unitType,
                position: { x, z },
                playerId
            })
        });

        if (!response.ok) {
            throw new Error(`Spawn failed: ${response.status}`);
        }

        return await response.json();
    }

    /**
     * Research technology
     * params: { techId, playerId? }
     */
    async _researchTech(params) {
        const { techId, playerId = 'gsk' } = params;

        const response = await fetch(`${this.cplHttpUrl}/api/rts/order`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                type: 'research',
                techId,
                playerId
            })
        });

        if (!response.ok) {
            throw new Error(`Research failed: ${response.status}`);
        }

        return await response.json();
    }

    /**
     * Trade resources
     * params: { give: { resource, amount }, take: { resource, amount }, targetPlayerId? }
     */
    async _trade(params) {
        const { give, take, targetPlayerId } = params;

        const response = await fetch(`${this.cplHttpUrl}/api/rts/order`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                type: 'trade',
                give,
                take,
                targetPlayerId
            })
        });

        if (!response.ok) {
            throw new Error(`Trade failed: ${response.status}`);
        }

        return await response.json();
    }

    /**
     * Attack target
     * params: { targetId, attackerId? }
     */
    async _attack(params) {
        const { targetId, attackerId = 'gsk_avatar' } = params;

        const response = await fetch(`${this.cplHttpUrl}/api/rts/order`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                type: 'attack',
                attackerId,
                targetId
            })
        });

        if (!response.ok) {
            throw new Error(`Attack failed: ${response.status}`);
        }

        return await response.json();
    }

    /**
     * Gather resource
     * params: { resourceId, gathererId? }
     */
    async _gather(params) {
        const { resourceId, gathererId = 'gsk_avatar' } = params;

        const response = await fetch(`${this.cplHttpUrl}/api/rts/order`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                type: 'gather',
                gathererId,
                resourceId
            })
        });

        if (!response.ok) {
            throw new Error(`Gather failed: ${response.status}`);
        }

        return await response.json();
    }

    /**
     * Execute a plan (sequence of actions)
     */
    async executePlan(plan) {
        const { actions, stopOnFailure = true } = plan;
        const results = [];

        for (const action of actions) {
            const result = await this.execute(action);
            results.push(result);

            if (!result.success && stopOnFailure) {
                break;
            }
        }

        return { results, allSucceeded: results.every(r => r.success) };
    }

    /**
     * Get action history
     */
    getHistory(limit = 50) {
        return this.actionHistory.slice(-limit);
    }

    /**
     * Get pending actions
     */
    getPending() {
        return Array.from(this.pendingActions.values());
    }
}

module.exports = { CPLEmbodiedAction };