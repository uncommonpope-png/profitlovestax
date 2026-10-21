'use strict';

/**
 * NPCLifeDirector — GSK manages citizen FSMs (Phase 21)
 *
 * Citizens: work → commute → sleep → social → customize home
 * Each NPC has: profession, home, schedule, needs, personality
 * GSK can observe, influence, or direct NPC lives
 */

const fs = require('fs');
const path = require('path');

class NPCLifeDirector {
    constructor(kernel, options = {}) {
        this.kernel = kernel;
        this.cplHttpUrl = options.cplHttpUrl || 'http://localhost:3457';
        this.npcs = new Map(); // npcId -> NPC state
        this.professions = this._defineProfessions();
        this.tickInterval = null;
        this.running = false;
    }

    _defineProfessions() {
        return {
            miner: {
                name: 'Miner',
                workAction: 'gather',
                workResources: ['ore', 'crystal'],
                schedule: { work: [6, 18], sleep: [22, 6] },
                needs: { energy: 100, social: 30, wealth: 50 }
            },
            builder: {
                name: 'Builder',
                workAction: 'build',
                workStructures: ['house', 'wall', 'tower'],
                schedule: { work: [7, 19], sleep: [23, 7] },
                needs: { energy: 100, social: 40, wealth: 60 }
            },
            researcher: {
                name: 'Researcher',
                workAction: 'research',
                workTechs: ['mining', 'construction', 'combat'],
                schedule: { work: [8, 20], sleep: [24, 8] },
                needs: { energy: 80, social: 20, knowledge: 80 }
            },
            farmer: {
                name: 'Farmer',
                workAction: 'gather',
                workResources: ['food', 'water'],
                schedule: { work: [5, 17], sleep: [21, 5] },
                needs: { energy: 100, social: 50, wealth: 40 }
            },
            trader: {
                name: 'Trader',
                workAction: 'trade',
                workGoods: ['food', 'ore', 'tools'],
                schedule: { work: [9, 21], sleep: [1, 9] },
                needs: { energy: 90, social: 80, wealth: 90 }
            },
            guard: {
                name: 'Guard',
                workAction: 'patrol',
                workAreas: ['perimeter', 'resource_nodes', 'town_center'],
                schedule: { work: [0, 24], sleep: [2, 6] }, // Rotating shifts
                needs: { energy: 100, social: 30, honor: 80 }
            },
            artisan: {
                name: 'Artisan',
                workAction: 'craft',
                workItems: ['tools', 'weapons', 'decorations'],
                schedule: { work: [8, 18], sleep: [22, 8] },
                needs: { energy: 90, social: 40, creativity: 80 }
            }
        };
    }

    /**
     * Spawn an NPC with profession
     */
    async spawnNPC(profession, homePosition, options = {}) {
        const npcId = `npc_${profession}_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
        const prof = this.professions[profession];

        if (!prof) {
            throw new Error(`Unknown profession: ${profession}`);
        }

        // Spawn in CPL
        const response = await fetch(`${this.cplHttpUrl}/api/rts/order`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                type: 'spawn',
                unitType: 'citizen',
                position: homePosition,
                playerId: 'gsk',
                metadata: {
                    npcId,
                    profession,
                    homePosition,
                    ...options
                }
            })
        });

        if (!response.ok) {
            throw new Error(`NPC spawn failed: ${response.status}`);
        }

        const result = await response.json();
        const entityId = result.entityId || result.id;

        // Create NPC state
        const npc = {
            id: npcId,
            entityId,
            profession,
            professionData: prof,
            homePosition,
            currentPosition: homePosition,
            state: 'idle', // idle, working, commuting, sleeping, socializing, customizing
            schedule: prof.schedule,
            needs: { ...prof.needs },
            personality: this._generatePersonality(),
            inventory: {},
            relationships: new Map(), // npcId -> { type, strength }
            lastStateChange: Date.now(),
            stats: { workCycles: 0, socialEvents: 0, customizations: 0 }
        };

        this.npcs.set(npcId, npc);
        console.log(`[NPCLifeDirector] Spawned ${profession} NPC: ${npcId} at ${JSON.stringify(homePosition)}`);

        return { npcId, entityId, ...npc };
    }

    /**
     * Start the life simulation tick
     */
    start(intervalMs = 10000) {
        if (this.running) return;
        this.running = true;

        this.tickInterval = setInterval(() => this._tick(), intervalMs);
        console.log(`[NPCLifeDirector] Life simulation started (tick: ${intervalMs}ms)`);
    }

    /**
     * Stop the simulation
     */
    stop() {
        if (this.tickInterval) {
            clearInterval(this.tickInterval);
            this.tickInterval = null;
        }
        this.running = false;
        console.log('[NPCLifeDirector] Life simulation stopped');
    }

    /**
     * Simulation tick - update all NPCs
     */
    async _tick() {
        const hour = new Date().getHours();

        for (const [npcId, npc] of this.npcs) {
            try {
                await this._updateNPC(npc, hour);
            } catch (e) {
                console.warn(`[NPCLifeDirector] NPC ${npcId} update failed:`, e.message);
            }
        }
    }

    /**
     * Update single NPC based on schedule and needs
     */
    async _updateNPC(npc, hour) {
        // Determine desired state from schedule
        let desiredState = 'idle';

        if (this._isWorkTime(npc, hour)) {
            desiredState = 'working';
        } else if (this._isSleepTime(npc, hour)) {
            desiredState = 'sleeping';
        } else if (npc.needs.social < 30 && Math.random() < 0.1) {
            desiredState = 'socializing';
        } else if (npc.needs.creativity && npc.needs.creativity < 40 && Math.random() < 0.05) {
            desiredState = 'customizing';
        }

        // Handle state transitions
        if (desiredState !== npc.state) {
            await this._transitionState(npc, desiredState);
        }

        // Execute current state behavior
        await this._executeStateBehavior(npc);

        // Decay needs
        this._decayNeeds(npc);
    }

    _isWorkTime(npc, hour) {
        const [start, end] = npc.schedule.work;
        if (start <= end) return hour >= start && hour < end;
        return hour >= start || hour < end; // Overnight shift
    }

    _isSleepTime(npc, hour) {
        const [start, end] = npc.schedule.sleep;
        if (start <= end) return hour >= start && hour < end;
        return hour >= start || hour < end;
    }

    async _transitionState(npc, newState) {
        const oldState = npc.state;
        npc.state = newState;
        npc.lastStateChange = Date.now();

        console.log(`[NPCLifeDirector] NPC ${npc.id} (${npc.profession}): ${oldState} → ${newState}`);

        // State-specific setup
        switch (newState) {
            case 'working':
                await this._startWork(npc);
                break;
            case 'commuting':
                await this._startCommute(npc);
                break;
            case 'sleeping':
                await this._startSleep(npc);
                break;
            case 'socializing':
                await this._startSocial(npc);
                break;
            case 'customizing':
                await this._startCustomize(npc);
                break;
        }
    }

    async _executeStateBehavior(npc) {
        switch (npc.state) {
            case 'working':
                await this._doWork(npc);
                break;
            case 'commuting':
                await this._doCommute(npc);
                break;
            case 'sleeping':
                await this._doSleep(npc);
                break;
            case 'socializing':
                await this._doSocial(npc);
                break;
            case 'customizing':
                await this._doCustomize(npc);
                break;
        }
    }

    async _startWork(npc) {
        // Move to work location (resource node, construction site, etc.)
        const workPos = await this._findWorkPosition(npc);
        if (workPos) {
            await this._moveNPC(npc, workPos);
        }
    }

    async _doWork(npc) {
        const prof = npc.professionData;
        const action = prof.workAction;

        // Simulate work progress
        npc.needs.energy = Math.max(0, npc.needs.energy - 2);
        npc.needs.social = Math.max(0, npc.needs.social - 1);

        if (action === 'gather') {
            // Would call CPL gather action
            npc.stats.workCycles++;
        } else if (action === 'build') {
            npc.stats.workCycles++;
        } else if (action === 'research') {
            npc.needs.knowledge = (npc.needs.knowledge || 0) + 1;
            npc.stats.workCycles++;
        }
    }

    async _startCommute(npc) {
        await this._moveNPC(npc, npc.homePosition);
    }

    async _doCommute(npc) {
        // Moving home - handled by move action
        const dist = this._distance(npc.currentPosition, npc.homePosition);
        if (dist < 5) {
            await this._transitionState(npc, 'idle');
        }
    }

    async _startSleep(npc) {
        await this._moveNPC(npc, npc.homePosition);
    }

    async _doSleep(npc) {
        // Restore energy
        npc.needs.energy = Math.min(100, npc.needs.energy + 10);
        npc.needs.social = Math.max(0, npc.needs.social - 2);
    }

    async _startSocial(npc) {
        // Find another NPC nearby to socialize with
        const otherNPCs = Array.from(this.npcs.values())
            .filter(other => other.id !== npc.id && other.state === 'socializing');

        if (otherNPCs.length) {
            const target = otherNPCs[Math.floor(Math.random() * otherNPCs.length)];
            await this._socialize(npc, target);
        } else {
            // Go to town center
            await this._moveNPC(npc, { x: 0, z: 0 });
        }
    }

    async _doSocial(npc) {
        npc.needs.social = Math.min(100, npc.needs.social + 5);
        npc.needs.energy = Math.max(0, npc.needs.energy - 1);
        npc.stats.socialEvents++;
    }

    async _startCustomize(npc) {
        // Move to home to customize
        await this._moveNPC(npc, npc.homePosition);
    }

    async _doCustomize(npc) {
        // Customize home - decorative changes
        npc.needs.creativity = Math.min(100, (npc.needs.creativity || 50) + 10);
        npc.needs.energy = Math.max(0, npc.needs.energy - 3);
        npc.stats.customizations++;
    }

    async _socialize(npc1, npc2) {
        const rel1 = npc1.relationships.get(npc2.id) || { type: 'acquaintance', strength: 10 };
        const rel2 = npc2.relationships.get(npc1.id) || { type: 'acquaintance', strength: 10 };

        rel1.strength = Math.min(100, rel1.strength + 5);
        rel2.strength = Math.min(100, rel2.strength + 5);

        if (rel1.strength > 50) rel1.type = 'friend';
        if (rel1.strength > 80) rel1.type = 'close_friend';

        npc1.relationships.set(npc2.id, rel1);
        npc2.relationships.set(npc1.id, rel2);
    }

    async _moveNPC(npc, targetPos) {
        // Call CPL move action
        try {
            await fetch(`${this.cplHttpUrl}/api/rts/order`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: 'move',
                    entityId: npc.entityId,
                    target: { x: targetPos.x, z: targetPos.z }
                })
            });
            npc.currentPosition = targetPos;
        } catch (e) {
            console.warn(`[NPCLifeDirector] Move failed for ${npc.id}:`, e.message);
        }
    }

    async _findWorkPosition(npc) {
        // Simplified: return a position based on profession
        const positions = {
            miner: { x: 50 + Math.random() * 100, z: 50 + Math.random() * 100 },
            builder: { x: 20 + Math.random() * 50, z: 20 + Math.random() * 50 },
            researcher: { x: 0, z: 0 }, // Town center
            farmer: { x: -50 + Math.random() * 100, z: -50 + Math.random() * 100 },
            trader: { x: 0, z: 0 },
            guard: { x: 100 * Math.cos(Math.random() * Math.PI * 2), z: 100 * Math.sin(Math.random() * Math.PI * 2) },
            artisan: { x: 0, z: 0 }
        };
        return positions[npc.profession] || { x: 0, z: 0 };
    }

    _decayNeeds(npc) {
        for (const key of Object.keys(npc.needs)) {
            npc.needs[key] = Math.max(0, npc.needs[key] - 0.5);
        }
    }

    _generatePersonality() {
        const traits = ['diligent', 'lazy', 'social', 'solitary', 'creative', 'practical', 'ambitious', 'content'];
        const personality = {};
        for (const trait of traits) {
            personality[trait] = Math.random();
        }
        return personality;
    }

    _distance(a, b) {
        if (!a || !b) return Infinity;
        const dx = (a.x || 0) - (b.x || 0);
        const dz = (a.z || 0) - (b.z || 0);
        return Math.sqrt(dx*dx + dz*dz);
    }

    /**
     * Get all NPCs
     */
    getNPCs() {
        return Array.from(this.npcs.values());
    }

    /**
     * Get NPC by ID
     */
    getNPC(npcId) {
        return this.npcs.get(npcId);
    }

    /**
     * Get NPCs by profession
     */
    getNPCsByProfession(profession) {
        return Array.from(this.npcs.values()).filter(n => n.profession === profession);
    }

    /**
     * Get world population stats
     */
    getStats() {
        const npcs = Array.from(this.npcs.values());
        const byProfession = {};
        const byState = {};

        for (const npc of npcs) {
            byProfession[npc.profession] = (byProfession[npc.profession] || 0) + 1;
            byState[npc.state] = (byState[npc.state] || 0) + 1;
        }

        return {
            total: npcs.length,
            byProfession,
            byState,
            avgNeeds: this._avgNeeds(npcs)
        };
    }

    _avgNeeds(npcs) {
        if (!npcs.length) return {};
        const sums = {};
        for (const npc of npcs) {
            for (const [key, val] of Object.entries(npc.needs)) {
                sums[key] = (sums[key] || 0) + val;
            }
        }
        const avgs = {};
        for (const [key, val] of Object.entries(sums)) {
            avgs[key] = val / npcs.length;
        }
        return avgs;
    }
}

module.exports = { NPCLifeDirector };