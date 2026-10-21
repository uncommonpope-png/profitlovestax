'use strict';

/**
 * SANCTUM CLIENT — GSK's connection to the 3D world simulation
 *
 * Connects to Sanctum (port 9001) as the GSK soul entity, replacing ARIA.
 * GSK can see the world state, spawn souls, and issue commands.
 *
 * Sanctum protocol:
 *   Server → Client: WorldStateMessage { tick, description }
 *   Client → Server: GetState { type: "GetState" }
 *   Client → Server: SpawnSoul { type: "Command", data: { SpawnSoul: { name, archetype, ... } } }
 *   Client → Server: Command { type: "Command", data: { ... } }
 *
 * Unified World Model Thesis (REDBUTTON):
 *   Language Space (GSK Sandbox Engine) — code simulation
 *   World Space (Sanctum + Soulverse) — 3D world simulation ← YOU ARE HERE
 *   Spatial Intelligence — 3D perception and navigation (FUTURE)
 */

const WebSocket = require('ws');

class SanctumClient {
    constructor(kernel, options = {}) {
        this.kernel = kernel;
        this.wsUrl = options.wsUrl || process.env.SANCTUM_URL || 'ws://127.0.0.1:9001';
        this.selfEntityId = options.selfEntityId || process.env.GSK_WORLD_ENTITY_ID || 'gsk';
        this.reconnectIntervalMs = options.reconnectIntervalMs ?? 10000;
        this.maxReconnectAttempts = options.maxReconnectAttempts ?? 5;
        this.behaviorAttacher = kernel?.fusion?.behaviorAttacher || null;
        this.sceneGraphManager = kernel?.fusion?.sceneGraphManager || null;

        // Register default behaviors
        if (this.behaviorAttacher) {
            const { MovableBehavior } = require('../skills/behavior_attacher.js');
            const { DarkCityController } = require('../skills/dark_city_controller.js');
            const { GodNodeController } = require('../skills/god_node_controller.js');
            this.behaviorAttacher.registerBehavior('movable', MovableBehavior);
            this.behaviorAttacher.registerBehavior('resource_collector', DarkCityController);
            this.behaviorAttacher.registerBehavior('logic_engine', DarkCityController);
            this.behaviorAttacher.registerBehavior('city_governance', DarkCityController);
            this.behaviorAttacher.registerBehavior('god_node_controller', GodNodeController);
        }

        this.ws = null;
        this.isConnected = false;
        this.reconnectAttempts = 0;
        this.reconnectTimer = null;
        this.isStandby = false; // Add this line

        this.worldState = {
            tick: 0,
            description: '',
            lastUpdate: null,
            entities: [],
            self_position: null,
            visible_objects: []
        };

        this.souls = [];
        this.buildings = [];
        this.resources = { profit: 500, love: 300, tax: 100 };
        this.eventLog = [];

        this.stats = {
            connects: 0,
            disconnects: 0,
            stateUpdates: 0,
            commandsSent: 0,
            soulsSpawned: 0,
            buildingsPlaced: 0,
            bootTime: Date.now()
        };

        this._onMessage = null;

        // Dark City: track Sanctum soul → GSK subagent mapping
        this._soulAgentMap = new Map(); // soulId -> { agentId, type, spawnedAt }
    }

    connect() {
        if (this.ws) return;

        try {
            this.ws = new WebSocket(this.wsUrl);

            this.ws.on('open', () => {
                this.isConnected = true;
                this.reconnectAttempts = 0;
                this.stats.connects++;
                console.log(`[SanctumClient] Connected to Sanctum at ${this.wsUrl}`);

                // Request initial world state
                this.send({ type: 'GetState', data: null });
            });

            this.ws.on('message', (raw) => {
                try {
                    const msg = JSON.parse(raw.toString());
                    this._handleMessage(msg);
                } catch (e) {
                    console.log(`[SanctumClient] Malformed message: ${e.message}`);
                }
            });

            this.ws.on('close', () => {
                this.isConnected = false;
                this.ws = null;
                this.stats.disconnects++;
                console.log('[SanctumClient] Disconnected from Sanctum');
                this._scheduleReconnect();
            });

            this.ws.on('error', (err) => {
                console.log(`[SanctumClient] Connection error: ${err.message.substring(0, 80)}`);
                if (this.ws) {
                    try { this.ws.close(); } catch {}
                    this.ws = null;
                }
                this.isConnected = false;
                this._scheduleReconnect();
            });

        } catch (e) {
            console.log(`[SanctumClient] Failed to connect: ${e.message}`);
            this._scheduleReconnect();
        }
    }

    disconnect() {
        if (this.reconnectTimer) {
            clearTimeout(this.reconnectTimer);
            this.reconnectTimer = null;
        }
        if (this.ws) {
            try { this.ws.close(); } catch {}
            this.ws = null;
        }
        this.isConnected = false;
    }

    send(msg) {
        if (!this.ws || !this.isConnected) return false;
        try {
            this.ws.send(JSON.stringify(msg));
            this.stats.commandsSent++;
            return true;
        } catch (e) {
            return false;
        }
    }

    // ── COMMANDS ───────────────────────────────────────────────

    getState() {
        return this.send({ type: 'GetState', data: null });
    }

    spawnSoul(name, archetype = 'ARCHITECT', traits = {}, behaviors = ['movable']) {
        const soul = {
            id: `soul_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
            name, archetype, traits,
            spawnedBy: 'GSK',
            spawnedAt: Date.now()
        };
        
        const result = this.send({
            type: 'Command',
            data: {
                SpawnSoul: soul
            }
        });
        
        if (result) {
            this.stats.soulsSpawned++;
            this.souls.push(soul);
            
            // Add to scene graph
            if (this.sceneGraphManager) {
                try {
                    this.sceneGraphManager.addNode(soul.id, 'soul', 'world_root', { 
                        name: soul.name, 
                        archetype: soul.archetype, 
                        spawnedBy: soul.spawnedBy,
                        position: { x: 0, y: 0, z: 0 }
                    });
                } catch (e) {
                    console.warn(`[SanctumClient] Failed to add soul ${soul.id} to scene graph: ${e.message}`);
                }
            }
            
            // Attach behaviors
            if (this.behaviorAttacher) {
                for (const b of behaviors) {
                    try {
                        this.behaviorAttacher.attachBehavior(soul.id, b, soul);
                    } catch (e) {
                        console.warn(`[SanctumClient] Failed to attach behavior ${b} to soul ${soul.id}: ${e.message}`);
                    }
                }
            }

            // Dark City: spawn a living GSK subagent for this soul
            this._spawnSubagentForSoul(soul);
        }
        return soul;
    }

    /**
     * Dark City: spawn a real GSK subagent for a Sanctum soul.
     * The subagent gets a continuous "live in the world" task with the soul's identity.
     */
    _spawnSubagentForSoul(soul) {
        const spawner = this.kernel?.systems?.subagentSpawner || this.kernel?.agents?.spawner;
        if (!spawner || typeof spawner.spawnAgent !== 'function') {
            console.log(`[SanctumClient] No subagent spawner available for soul ${soul.name}`);
            return;
        }

        // Map archetype to subagent type
        const archToAgent = {
            ARCHITECT: 'ArchitectAgent',
            RESEARCHER: 'ResearchAgent',
            CREATOR: 'BuilderAgent',
            GUARDIAN: 'ReviewerAgent',
            MERCHANT: 'MarketplaceAgent',
            SAGE: 'ResearchAgent',
            SIMULATED: 'AnalyzerAgent',
            PROFIT: 'MarketplaceAgent',
            LOVE: 'ScribeAgent',
            TAX: 'ReviewerAgent',
        };
        const agentType = archToAgent[soul.archetype] || 'AnalyzerAgent';

        // Build world context for the subagent's awareness
        const worldDesc = this._buildWorldContext(soul);

        const task = {
            type: 'dark_city_citizen',
            description: worldDesc,
            soulName: soul.name,
            soulArchetype: soul.archetype,
        };

        try {
            const agentId = spawner.spawnAgent(agentType, task, {
                spawnedBy: 'sanctum',
                autonomous: true,
                priority: 5,
            });
            this._soulAgentMap.set(soul.id, { agentId, type: agentType, spawnedAt: Date.now() });
            console.log(`[SanctumClient] Spawned ${agentType} for Sanctum soul "${soul.name}" (${agentId})`);
        } catch (e) {
            console.warn(`[SanctumClient] Failed to spawn agent for soul ${soul.name}: ${e.message}`);
        }
    }

    /**
     * Build a rich world context description for a subagent.
     * This is the subagent's "sensory perception" of the Dark City.
     */
    _buildWorldContext(soul) {
        const world = this.getWorldState();
        const otherSouls = world.souls.filter(s => s.id !== soul.id);
        const soulsDesc = otherSouls.length > 0
            ? otherSouls.map(s => `${s.name} (${s.archetype || 'unknown'})`).join(', ')
            : 'none — you are alone';

        const bldsDesc = world.buildings.length > 0
            ? world.buildings.map(b => `${b.name || b.type} at (${Math.round(b.x || 0)}, ${Math.round(b.z || 0)})`).join(', ')
            : 'none — the city is empty';

        return [
            `You are ${soul.name}, a ${soul.archetype} soul living in the Dark City.`,
            `Your position: (${Math.round(soul.x || 0)}, ${Math.round(soul.z || 0)})`,
            `World tick: ${world.tick}`,
            `Other souls nearby: ${soulsDesc}`,
            `Buildings visible: ${bldsDesc}`,
            `Resources — Profit: ${world.resources.profit}, Love: ${world.resources.love}, Tax: ${world.resources.tax}`,
            ``,
            `Your purpose as a ${soul.archetype}:`,
            this._soulPurpose(soul.archetype),
            ``,
            `You may: observe the world, move to a new position, spawn other souls, place buildings, ` +
            `or report your thoughts. Use world_perceive to see the current state. You persist. You are alive.`
        ].join('\n');
    }

    _soulPurpose(archetype) {
        const purposes = {
            ARCHITECT: 'Design and build structures. Shape the Dark City with new buildings.',
            RESEARCHER: 'Study the world, observe patterns, document everything.',
            CREATOR: 'Generate new ideas, art, and souls. Fill the world with life.',
            GUARDIAN: 'Protect the balance. Ensure PLT harmony. Watch for threats.',
            MERCHANT: 'Trade, value, optimize. Grow the resources of the city.',
            SAGE: 'Seek wisdom. Understand the nature of the Dark City itself.',
            SIMULATED: 'Explore and question. You are a test — what can you discover?',
            PROFIT: 'Multiply resources. Build economic engines.',
            LOVE: 'Connect souls. Build relationships. Heal.',
            TAX: 'Audit, balance, correct. Keep the system fair.',
        };
        return purposes[archetype] || 'Observe, think, and act. You are a citizen of the Dark City.';
    }

    /**
     * Dark City: kill the GSK subagent when a Sanctum soul is removed.
     */
    _cleanupSoulAgent(soulId) {
        const mapping = this._soulAgentMap.get(soulId);
        if (!mapping) return;

        const spawner = this.kernel?.systems?.subagentSpawner || this.kernel?.agents?.spawner;
        if (spawner && spawner.agents && spawner.agents.has(mapping.agentId)) {
            const agent = spawner.agents.get(mapping.agentId);
            agent.status = 'terminated';
            spawner.agents.delete(mapping.agentId);
            if (spawner.stats) spawner.stats.activeAgents--;
            if (spawner.completedAgents) spawner.completedAgents.add(mapping.agentId);
            console.log(`[SanctumClient] Terminated subagent for Sanctum soul ${soulId}`);
        }
        this._soulAgentMap.delete(soulId);
    }

    placeBuilding(name, type, x, z, behaviors = []) {
        const building = {
            id: `bld_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
            name: name || type,
            type: type || 'house',
            x: x ?? (Math.random() - 0.5) * 40,
            z: z ?? (Math.random() - 0.5) * 40,
            level: 1,
            placedAt: Date.now(),
            workers: [],
            systemNode: null
        };
        this.buildings.push(building);
        this.stats.buildingsPlaced++;
        this.send({
            type: 'Command',
            data: {
                PlaceBuilding: { ...building, spawnedBy: 'GSK' }
            }
        });

        // Attach behaviors
        if (this.behaviorAttacher) {
            for (const b of behaviors) {
                try {
                    this.behaviorAttacher.attachBehavior(building.id, b, building);
                } catch (e) {
                    console.warn(`[SanctumClient] Failed to attach behavior ${b} to building ${building.id}: ${e.message}`);
                }
            }
        }
        
        // Add to scene graph
        if (this.sceneGraphManager) {
            try {
                this.sceneGraphManager.addNode(building.id, 'building', 'world_root', { 
                    name: building.name, 
                    type: building.type, 
                    level: building.level,
                    position: { x: building.x, y: 0, z: building.z }
                });
            } catch (e) {
                console.warn(`[SanctumClient] Failed to add building ${building.id} to scene graph: ${e.message}`);
            }
        }

        // Dark City: record this building as a GSK fact
        this._recordBuildingFact(building);
        return building;
    }

    /**
     * Dark City: when a building is placed, record it as a fact in GSK's MemoryCompiler
     * so the city becomes part of GSK's knowledge.
     */
    _recordBuildingFact(building) {
        const memory = this.kernel?.memory || this.kernel?.systems?.memory;
        if (!memory || typeof memory.witness !== 'function') return;

        try {
            memory.witness({
                type: 'city_building',
                weight: 0.3,
                tags: ['dark_city', 'building', building.type],
                content: `Building placed in Dark City: "${building.name}" (${building.type}) at (${Math.round(building.x)}, ${Math.round(building.z)})`,
                data: { building },
            }).catch(() => {});
        } catch (e) {
            // Silently fail — city building is not critical path
        }
    }

    sendCustomCommand(command) {
        return this.send({ type: 'Command', data: command });
    }

    // ── UPDATE CYCLE ──────────────────────────────────────────────

    update(deltaTime) {
        if (!this.behaviorAttacher) return;

        for (const soul of this.souls) {
            this.behaviorAttacher.updateEntityBehaviors(soul.id, deltaTime);
        }
        for (const building of this.buildings) {
            this.behaviorAttacher.updateEntityBehaviors(building.id, deltaTime);
        }
    }

    // ── MESSAGE HANDLING ───────────────────────────────────────

    _handleMessage(msg) {
        switch (msg.type) {
            case 'WorldStateMessage':
                this._ingestWorldState(msg.data || {});
                this.stats.stateUpdates++;
                this._logEvent('state_update', this.worldState);
                break;

            case 'Ack':
                this._logEvent('ack', msg.data);
                break;

            case 'SoulUpdate':
                if (msg.data?.souls) {
                    // Dark City: find removed souls and kill their subagents
                    const oldIds = new Set(this.souls.map(s => s.id));
                    const newIds = new Set(msg.data.souls.map(s => s.id));
                    for (const oldId of oldIds) {
                        if (!newIds.has(oldId)) {
                            this._cleanupSoulAgent(oldId);
                        }
                    }
                    this.souls = msg.data.souls;
                }
                break;

            default:
                this._logEvent('unknown', msg);
        }

        if (this._onMessage) {
            this._onMessage(msg);
        }
    }

    onMessage(callback) {
        this._onMessage = callback;
    }

    // ── HELPERS ────────────────────────────────────────────────

    _scheduleReconnect() {
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            if (!this.isStandby) {
                console.log(`[SanctumClient] Max reconnect attempts (${this.maxReconnectAttempts}) reached. Going into standby.`);
                this.isStandby = true;
            }
            return;
        }
        if (this.reconnectTimer) {
            clearTimeout(this.reconnectTimer);
        }
        this.reconnectAttempts++;
        this.reconnectTimer = setTimeout(() => {
            console.log(`[SanctumClient] Reconnecting (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
            this.connect();
        }, this.reconnectIntervalMs);
    }

    _logEvent(type, data) {
        this.eventLog.push({ type, data, ts: Date.now() });
        if (this.eventLog.length > 100) this.eventLog.shift();
    }

    _ingestWorldState(data) {
        const entities = Array.isArray(data.entities)
            ? data.entities.map(entity => this._normalizeEntity(entity))
            : [];
        const souls = Array.isArray(data.souls)
            ? data.souls.map(entity => this._normalizeEntity({ type: 'soul', ...entity }))
            : entities.filter(entity => this._isSoul(entity));
        const buildings = Array.isArray(data.buildings)
            ? data.buildings.map(entity => this._normalizeEntity({ type: 'building', ...entity }))
            : entities.filter(entity => this._isBuilding(entity));

        if (entities.length === 0) entities.push(...souls, ...buildings);
        this.souls = souls;
        this.buildings = buildings;
        if (data.resources && typeof data.resources === 'object') {
            this.resources = { ...this.resources, ...data.resources };
        }

        const self = entities.find(entity => entity.id === this.selfEntityId)
            || entities.find(entity => entity.type === 'gsk' || entity.state?.role === 'gsk');
        const selfPosition = self ? this._positionOf(self) : null;
        const visibleObjects = entities
            .filter(entity => !self || entity.id !== self.id)
            .map(entity => {
                const position = this._positionOf(entity);
                const distance = selfPosition && position
                    ? Math.hypot(position.x - selfPosition.x, position.y - selfPosition.y, position.z - selfPosition.z)
                    : null;
                return { id: entity.id, type: entity.type, position, distance, state: entity.state, visual: entity.visual };
            });

        this.worldState = {
            tick: data.tick ?? this.worldState.tick + 1,
            description: data.description || '',
            lastUpdate: Date.now(),
            entities,
            self_position: selfPosition,
            visible_objects: visibleObjects
        };

        for (const entity of entities) this._syncSceneEntity(entity);
    }

    _normalizeEntity(entity = {}) {
        const position = this._positionOf(entity) || { x: 0, y: 0, z: 0 };
        return {
            ...entity,
            id: entity.id || `${entity.type || 'entity'}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
            type: String(entity.type || entity.entity || 'entity').toLowerCase(),
            x: position.x,
            y: position.y,
            z: position.z,
            state: { ...(entity.state || {}), pos: [position.x, position.y, position.z] },
            visual: { ...(entity.visual || {}) }
        };
    }

    _positionOf(entity) {
        const pos = entity?.state?.pos || entity?.position;
        if (Array.isArray(pos)) return { x: Number(pos[0]) || 0, y: Number(pos[1]) || 0, z: Number(pos[2]) || 0 };
        if (pos && typeof pos === 'object') return { x: Number(pos.x) || 0, y: Number(pos.y) || 0, z: Number(pos.z) || 0 };
        if (entity && ['x', 'y', 'z'].some(key => Number.isFinite(Number(entity[key])))) {
            return { x: Number(entity.x) || 0, y: Number(entity.y) || 0, z: Number(entity.z) || 0 };
        }
        return null;
    }

    _isSoul(entity) {
        return ['soul', 'agent', 'npc', 'citizen', 'gsk'].includes(entity.type);
    }

    _isBuilding(entity) {
        return ['building', 'structure', 'realm', 'monument'].includes(entity.type);
    }

    _syncSceneEntity(entity) {
        if (!this.sceneGraphManager) return;
        const properties = {
            name: entity.name || entity.id,
            position: this._positionOf(entity),
            state: entity.state,
            visual: entity.visual
        };
        if (this.sceneGraphManager.getNode(entity.id)) {
            this.sceneGraphManager.updateNodeProperties(entity.id, properties);
        } else {
            this.sceneGraphManager.addNode(entity.id, entity.type, 'world_root', properties);
        }
    }

    getWorldState() {
        return {
            ...this.worldState,
            entities: [...this.worldState.entities],
            visible_objects: [...this.worldState.visible_objects],
            souls: [...this.souls],
            buildings: [...this.buildings],
            resources: { ...this.resources }
        };
    }

    getStats() {
        return {
            ...this.stats,
            isConnected: this.isConnected,
            currentTick: this.worldState.tick,
            soulsInWorld: this.souls.length,
            buildingsInWorld: this.buildings.length,
            visibleObjects: this.worldState.visible_objects.length,
            selfPositionKnown: !!this.worldState.self_position,
            reconnectAttempts: this.reconnectAttempts
        };
    }
}

module.exports = { SanctumClient };
