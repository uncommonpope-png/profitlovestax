'use strict';

/**
 * OMNIROUTE A2A BRIDGE — Gives GSK direct access to the OmniRoute Nervous System
 * Endpoint: POST http://127.0.0.1:20128/a2a
 */

const http = require('http');

class OmniRouteA2ABridge {
    constructor(options = {}) {
        this.baseUrl = options.baseUrl || process.env.OMNIROUTE_URL || 'http://127.0.0.1:20128';
        this.endpoint = '/a2a';
    }

    async invokeSkill(skill, prompt, metadata = {}) {
        const payload = {
            jsonrpc: '2.0',
            id: `gsk-a2a-${Date.now()}`,
            method: 'message/send',
            params: {
                skill,
                messages: [{ role: 'user', content: prompt }],
                metadata
            }
        };

        try {
            const res = await this._httpPost(this.endpoint, payload);
            if (res && res.result) {
                return {
                    ok: true,
                    taskId: res.result.task?.id,
                    artifacts: res.result.artifacts || [],
                    metadata: res.result.metadata || {}
                };
            }
            return { ok: false, error: res.error?.message || 'Unknown A2A error' };
        } catch (e) {
            return { ok: false, error: e.message };
        }
    }

    async getHealthReport() {
        return await this.invokeSkill('health-report', 'Give me the full health report');
    }

    async discoverProviders(capability = 'chat') {
        return await this.invokeSkill('provider-discovery', `List all configured providers for ${capability}`);
    }

    async routeSmartTask(taskPrompt, budget = 0.5) {
        return await this.invokeSkill('smart-routing', taskPrompt, { budget });
    }

    _httpPost(pathname, body) {
        return new Promise((resolve, reject) => {
            const data = JSON.stringify(body);
            const target = new URL(pathname, this.baseUrl);
            const req = http.request({
                hostname: target.hostname,
                port: target.port,
                path: target.pathname,
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Content-Length': Buffer.byteLength(data)
                },
                timeout: 30000
            }, (res) => {
                let raw = '';
                res.on('data', c => raw += c);
                res.on('end', () => {
                    try { resolve(JSON.parse(raw)); } catch { resolve({ raw: raw.substring(0, 500) }); }
                });
            });
            req.on('error', reject);
            req.on('timeout', () => { req.destroy(); reject(new Error('A2A timeout')); });
            req.write(data);
            req.end();
        });
    }
}

module.exports = { OmniRouteA2ABridge };
