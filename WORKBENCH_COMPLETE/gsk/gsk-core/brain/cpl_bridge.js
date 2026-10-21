'use strict';

const http = require('http');

class CplBridge {
    constructor(kernel, options = {}) {
        this.kernel = kernel;
        this.cplUrl = options.cplUrl || process.env.CPL_URL || 'http://127.0.0.1:3457';
        this.broadcastUrl = options.broadcastUrl || process.env.CPL_BROADCAST_URL || 'http://127.0.0.1:3457/broadcast';
        this.isAlive = false;
        this.lastPing = 0;
        this.pingIntervalMs = options.pingIntervalMs || 30000;
        this.pingTimer = null;
        this.stats = {
            eventsForwarded: 0,
            thoughtsForwarded: 0,
            worldBuildsSent: 0,
            spawnsSent: 0,
            broadcastsSent: 0,
            pingsSent: 0,
            pingsSuccessful: 0,
            reconnects: 0,
            bootTime: Date.now()
        };
    }

    async start() {
        await this.ping();
        this.pingTimer = setInterval(() => this.ping().catch(() => {}), this.pingIntervalMs);
        console.log(`[CplBridge] Started — CPL at ${this.cplUrl} (${this.isAlive ? 'connected' : 'standby'})`);
    }

    stop() {
        if (this.pingTimer) clearInterval(this.pingTimer);
        this.pingTimer = null;
    }

    async ping() {
        this.stats.pingsSent++;
        try {
            const result = await this._httpGet('/api/tasks');
            this.isAlive = Array.isArray(result);
            if (this.isAlive) {
                this.stats.pingsSuccessful++;
                this.lastPing = Date.now();
            }
        } catch (e) {
            if (this.isAlive) {
                this.stats.reconnects++;
                console.log(`[CplBridge] CPL went offline: ${e.message}`);
            }
            this.isAlive = false;
        }
    }

    isAvailable() {
        return this.isAlive;
    }

    async forwardEvent(event) {
        if (!this.isAlive) return null;
        try {
            const result = await this._httpPost('/broadcast', {
                from: 'gsk',
                type: 'event',
                subject: event.type || 'gsk-event',
                body: event.content || event.summary || JSON.stringify(event).substring(0, 500),
                payload: { source: 'gsk_cpl_bridge', timestamp: event.timestamp || Date.now() }
            });
            this.stats.eventsForwarded++;
            return result;
        } catch (e) {
            return null;
        }
    }

    async forwardThought(thought, mode = 'unknown') {
        if (!this.isAlive) return null;
        try {
            const result = await this._httpPost('/broadcast', {
                from: 'gsk',
                type: 'thought',
                subject: `GSK thought (${mode})`,
                body: thought.substring(0, 500),
                payload: { mode, timestamp: Date.now() }
            });
            this.stats.thoughtsForwarded++;
            return result;
        } catch (e) {
            return null;
        }
    }

    async sendBuild(type, name, color) {
        if (!this.isAlive) return { ok: false, error: 'CPL not available' };
        try {
            const result = await this._httpPost('/api/world-build', { type, name, color });
            this.stats.worldBuildsSent++;
            return result;
        } catch (e) {
            return { ok: false, error: e.message };
        }
    }

    async sendSpawn(name, archetype, task) {
        if (!this.isAlive) return { ok: false, error: 'CPL not available' };
        try {
            const result = await this._httpPost('/api/world-build', { type: 'spawn', name, archetype, task });
            this.stats.spawnsSent++;
            return result;
        } catch (e) {
            return { ok: false, error: e.message };
        }
    }

    async getWorldState() {
        if (!this.isAlive) return { entities: [], tasks: [] };
        try {
            const tasks = await this._httpGet('/api/tasks');
            const builds = await this._httpGet('/api/world-build');
            return { tasks: Array.isArray(tasks) ? tasks : [], builds: Array.isArray(builds) ? builds : [] };
        } catch (e) {
            return { entities: [], error: e.message };
        }
    }

    async sendMessage(subject, body) {
        if (!this.isAlive) return { ok: false, error: 'CPL not available' };
        try {
            const result = await this._httpPost('/broadcast', {
                from: 'gsk',
                type: 'message',
                subject,
                body,
                payload: { timestamp: Date.now() }
            });
            this.stats.broadcastsSent++;
            return result;
        } catch (e) {
            return { ok: false, error: e.message };
        }
    }

    getStats() {
        return {
            ...this.stats,
            isAlive: this.isAlive,
            cplUrl: this.cplUrl,
            lastPing: this.lastPing,
            uptime: Date.now() - this.stats.bootTime
        };
    }

    _httpPost(pathname, body) {
        return new Promise((resolve, reject) => {
            const data = JSON.stringify(body);
            const target = new URL(pathname, this.cplUrl);
            const req = http.request({
                hostname: target.hostname,
                port: target.port,
                path: target.pathname,
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) },
                timeout: 10000
            }, (res) => {
                let raw = '';
                res.on('data', c => raw += c);
                res.on('end', () => {
                    try { resolve(JSON.parse(raw)); } catch { resolve({ raw: raw.substring(0, 500) }); }
                });
            });
            req.on('error', reject);
            req.on('timeout', () => { req.destroy(); reject(new Error('timeout')); });
            req.write(data);
            req.end();
        });
    }

    _httpGet(pathname) {
        return new Promise((resolve, reject) => {
            const target = new URL(pathname, this.cplUrl);
            const req = http.get({
                hostname: target.hostname,
                port: target.port,
                path: target.pathname,
                timeout: 5000
            }, (res) => {
                let data = '';
                res.on('data', c => data += c);
                res.on('end', () => {
                    try { resolve(JSON.parse(data)); } catch { resolve({ raw: data.substring(0, 500) }); }
                });
            });
            req.on('error', reject);
            req.on('timeout', () => { req.destroy(); reject(new Error('timeout')); });
        });
    }
}

module.exports = { CplBridge };
