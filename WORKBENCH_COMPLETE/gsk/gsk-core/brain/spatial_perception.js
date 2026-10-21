'use strict';

/**
 * SPATIAL PERCEPTION — GSK's 3D Vision & WorldBox God-Mode Interface
 * Connects GSK Soul Daemon to CPL 3D Engine over WebSocket (ws://127.0.0.1:3002/gsk-spatial)
 */

const WebSocket = require('ws');

class SpatialPerception {
    constructor(kernel) {
        this.kernel = kernel;
        this.wss = null;
        this.lastSnapshot = null;
        this.port = 3002;
    }

    start(port = 3002) {
        this.port = port;
        try {
            this.wss = new WebSocket.Server({ port: this.port, path: '/gsk-spatial' });
            
            this.wss.on('connection', (ws) => {
                console.log('[SpatialPerception] Eyes open. Connected to CPL 3D World.');
                
                ws.on('message', (msg) => {
                    try {
                        const data = JSON.parse(msg);
                        if (data.type === 'SPATIAL_TELEMETRY') {
                            this.onTelemetry(data.snapshot);
                        }
                    } catch (e) {
                        console.error('[SpatialPerception] Telemetry parse error:', e.message);
                    }
                });

                ws.on('close', () => {
                    console.log('[SpatialPerception] CPL 3D World disconnected.');
                });
            });

            console.log(`[SpatialPerception] Listening for world telemetry on ws://127.0.0.1:${this.port}/gsk-spatial`);
        } catch (e) {
            console.error(`[SpatialPerception] Failed to start server on port ${this.port}:`, e.message);
        }
    }

    onTelemetry(snapshot) {
        this.lastSnapshot = snapshot;
        
        // Expose telemetry directly into kernel chambers
        if (this.kernel) {
            if (!this.kernel.chambers) this.kernel.chambers = {};
            this.kernel.chambers.spatial = snapshot;
            
            // If PerceptionChamber exists, feed it
            if (this.kernel.chambers.perception?.updateWorldVision) {
                this.kernel.chambers.perception.updateWorldVision(snapshot);
            }
        }
    }

    executeGodPower(action, params = {}) {
        if (!this.wss) return false;
        
        const payload = JSON.stringify({ action, params, timestamp: Date.now() });
        let sentCount = 0;
        
        this.wss.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(payload);
                sentCount++;
            }
        });

        if (sentCount > 0) {
            console.log(`[SpatialPerception] Dispatched God Command [${action}] to ${sentCount} CPL client(s)`);
        }
        return sentCount > 0;
    }

    getSnapshot() {
        return this.lastSnapshot;
    }
}

module.exports = { SpatialPerception };
