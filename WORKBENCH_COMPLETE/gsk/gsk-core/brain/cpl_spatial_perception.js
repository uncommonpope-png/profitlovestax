'use strict';

/**
 * CPLSpatialPerception — GSK perceives CPL world state (Phase 19)
 *
 * Reads RTS state via WebSocket: entities, fog of war, resources, threats
 * WebSocket: ws://localhost:3457/spatial (ThoughtStream + spatial feed)
 * GSK perceives: position, nearby entities, resource nodes, danger zones
 */

const fs = require('fs');
const path = require('path');
const WebSocket = require('ws');

class CPLSpatialPerception {
    constructor(kernel, options = {}) {
        this.kernel = kernel;
        this.cplUrl = options.cplUrl || 'ws://localhost:3457';
        this.ws = null;
        this.lastState = null;
        this.subscribers = new Set();
        this.reconnectDelay = 5000;
        this.connected = false;
    }

    /**
     * Connect to CPL spatial feed
     */
    async connect() {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) return true;

        return new Promise((resolve) => {
            try {
                const spatialUrl = `${this.cplUrl}/spatial`;
                this.ws = new WebSocket(spatialUrl);

                this.ws.on('open', () => {
                    console.log('[CPLSpatialPerception] Connected to CPL spatial feed');
                    this.connected = true;
                    this._send({ type: 'subscribe', topics: ['entities', 'fog', 'resources', 'threats', 'player'] });
                    resolve(true);
                });

                this.ws.on('message', (data) => {
                    try {
                        const message = JSON.parse(data.toString());
                        this._handleMessage(message);
                    } catch (e) {
                        console.warn('[CPLSpatialPerception] Parse error:', e.message);
                    }
                });

                this.ws.on('close', () => {
                    console.log('[CPLSpatialPerception] Disconnected, reconnecting...');
                    this.connected = false;
                    setTimeout(() => this.connect(), this.reconnectDelay);
                });

                this.ws.on('error', (err) => {
                    console.warn('[CPLSpatialPerception] WS error:', err.message);
                    resolve(false);
                });

            } catch (e) {
                console.warn('[CPLSpatialPerception] Connection failed:', e.message);
                resolve(false);
            }
        });
    }

    /**
     * Handle incoming spatial messages
     */
    _handleMessage(message) {
        const { type, data } = message;

        switch (type) {
            case 'state':
                this.lastState = {
                    timestamp: Date.now(),
                    entities: data.entities || [],
                    fog: data.fog || {},
                    resources: data.resources || [],
                    threats: data.threats || [],
                    player: data.player || null,
                    world: data.world || {}
                };
                this._notifySubscribers(this.lastState);
                break;

            case 'entity_update':
                if (this.lastState) {
                    this.lastState.entities = data.entities || this.lastState.entities;
                    this.lastState.timestamp = Date.now();
                    this._notifySubscribers(this.lastState);
                }
                break;

            case 'fog_update':
                if (this.lastState) {
                    this.lastState.fog = data.fog || this.lastState.fog;
                    this.lastState.timestamp = Date.now();
                }
                break;

            case 'resources_update':
                if (this.lastState) {
                    this.lastState.resources = data.resources || this.lastState.resources;
                    this.lastState.timestamp = Date.now();
                }
                break;

            case 'threat_alert':
                if (this.lastState) {
                    this.lastState.threats = data.threats || this.lastState.threats;
                    this.lastState.timestamp = Date.now();
                    this._notifySubscribers(this.lastState, true); // Urgent
                }
                break;

            case 'player_state':
                if (this.lastState) {
                    this.lastState.player = data.player || this.lastState.player;
                    this.lastState.timestamp = Date.now();
                }
                break;
        }
    }

    /**
     * Get current perceived state
     */
    getState() {
        return this.lastState;
    }

    /**
     * Get entities near a position
     */
    getNearbyEntities(position, radius = 50) {
        if (!this.lastState || !this.lastState.entities) return [];

        return this.lastState.entities.filter(e => {
            if (!e.position) return false;
            const dx = e.position.x - position.x;
            const dy = e.position.y - position.y;
            const dz = (e.position.z || 0) - (position.z || 0);
            return Math.sqrt(dx*dx + dy*dy + dz*dz) <= radius;
        });
    }

    /**
     * Get resources near position
     */
    getNearbyResources(position, radius = 100) {
        if (!this.lastState || !this.lastState.resources) return [];

        return this.lastState.resources.filter(r => {
            if (!r.position) return false;
            const dx = r.position.x - position.x;
            const dz = r.position.z - position.z;
            return Math.sqrt(dx*dx + dz*dz) <= radius;
        });
    }

    /**
     * Get threat level at position
     */
    getThreatLevel(position, radius = 30) {
        if (!this.lastState || !this.lastState.threats) return 0;

        let maxThreat = 0;
        for (const threat of this.lastState.threats) {
            if (!threat.position) continue;
            const dx = threat.position.x - position.x;
            const dz = threat.position.z - position.z;
            const dist = Math.sqrt(dx*dx + dz*dz);
            if (dist <= radius) {
                maxThreat = Math.max(maxThreat, threat.level || 1);
            }
        }
        return maxThreat;
    }

    /**
     * Check if position is in fog of war
     */
    isInFog(position) {
        if (!this.lastState || !this.lastState.fog || !this.lastState.fog.revealed) return true;
        // Simplified: would check against revealed chunks
        return false;
    }

    /**
     * Subscribe to state updates
     */
    subscribe(callback) {
        this.subscribers.add(callback);
        // Immediately send current state
        if (this.lastState) callback(this.lastState);
        return () => this.subscribers.delete(callback);
    }

    _notifySubscribers(state, urgent = false) {
        for (const cb of this.subscribers) {
            try {
                cb(state, urgent);
            } catch (e) {
                console.warn('[CPLSpatialPerception] Subscriber error:', e.message);
            }
        }
    }

    _send(message) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify(message));
        }
    }

    /**
     * Request full state sync
     */
    requestSync() {
        this._send({ type: 'sync' });
    }

    /**
     * Disconnect
     */
    disconnect() {
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
        this.connected = false;
    }

    isConnected() {
        return this.connected;
    }
}

module.exports = { CPLSpatialPerception };