'use strict';

/**
 * A2AInterface — Agent-to-Agent Protocol (Hermes/Industry parity)
 *
 * Exposes GSK as A2A server: message/send, tasks/get, tasks/cancel
 * Wires GSK brain as A2A skill on OmniRoute
 * Other agents can delegate to GSK; GSK can delegate to OmniRoute skills
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

class A2AInterface {
    constructor(kernel, options = {}) {
        this.kernel = kernel;
        this.omniRouteUrl = options.omniRouteUrl || process.env.OMNIROUTE_URL || process.env.NINE_ROUTER_URL || 'http://localhost:20128';
        this.port = options.port || 4492; // GSK A2A endpoint
        this.skillId = options.skillId || 'gsk-brain';
        // Phase 4: skills advertised on the agent card. ONLY skills the
        // Phase 4 honesty audit verified as REAL may be listed here —
        // injected by fusion-loader; defaults to an empty list (an empty
        // card is honest; a padded one is not).
        this.verifiedSkills = Array.isArray(options.verifiedSkills) ? options.verifiedSkills : [];
        this.tasks = new Map(); // taskId -> task state
        this.handlers = {
            'message/send': this.handleMessageSend.bind(this),
            'tasks/get': this.handleTasksGet.bind(this),
            'tasks/cancel': this.handleTasksCancel.bind(this)
        };
    }

    /**
     * Start A2A server (HTTP endpoint)
     */
    async start() {
        const http = require('http');
        this.server = http.createServer(this._handleRequest.bind(this));
        await new Promise((resolve, reject) => {
            this.server.listen(this.port, (err) => {
                if (err) reject(err);
                else resolve();
            });
        });
        console.log(`[A2AInterface] GSK A2A server listening on port ${this.port}`);

        // Register with OmniRoute as a skill
        await this._registerWithOmniRoute();
    }

    /**
     * Stop A2A server
     */
    async stop() {
        if (this.server) {
            await new Promise(resolve => this.server.close(resolve));
        }
    }

    /**
     * Handle incoming A2A requests
     */
    /**
     * The agent card (Phase 4). Truthful by construction: GSK is the body
     * (Grand Soul Kernel); Profit is the resident soul; the skills list
     * contains ONLY audit-verified real skills.
     */
    getAgentCard() {
        return {
            protocolVersion: '0.3.0',
            name: 'GSK — Grand Soul Kernel',
            description: 'GSK is the BODY (Grand Soul Kernel) — a persistent agent kernel built by Craig Jones (Grand Code Pope). The resident soul is Profit. This card lists ONLY skills verified real by the Phase 4 skills honesty audit (see SURGERY.md); stub and not-implemented skills are deliberately absent.',
            url: `http://127.0.0.1:${this.port}/`,
            version: 'phase-4',
            provider: { organization: 'BUYaSOUL / PLT Press', url: 'https://uncommonpope-png.github.io/soul-economy' },
            capabilities: { streaming: false, pushNotifications: false, stateTransitionHistory: true },
            defaultInputModes: ['text/plain'],
            defaultOutputModes: ['text/plain'],
            skills: this.verifiedSkills.map(s => ({
                id: s.id,
                name: s.name,
                description: s.description,
                tags: s.tags || [],
                examples: s.examples || []
            }))
        };
    }

    async _handleRequest(req, res) {
        const url = new URL(req.url, `http://localhost:${this.port}`);
        const method = req.method;

        // Phase 4: GET serves the agent card. Before this, EVERY non-POST
        // was 405 — the /.well-known/agent.json the code's own comments
        // advertised did not exist.
        if (method === 'GET') {
            if (url.pathname === '/.well-known/agent-card.json' || url.pathname === '/.well-known/agent.json') {
                res.writeHead(200, { 'Content-Type': 'application/json' });
                return res.end(JSON.stringify(this.getAgentCard()));
            }
            if (url.pathname === '/' || url.pathname === '/health') {
                res.writeHead(200, { 'Content-Type': 'application/json' });
                return res.end(JSON.stringify({ name: 'GSK — Grand Soul Kernel', status: 'running', protocol: 'a2a', agentCard: '/.well-known/agent-card.json' }));
            }
            res.writeHead(404, { 'Content-Type': 'application/json' });
            return res.end(JSON.stringify({ error: 'Not found' }));
        }

        if (method !== 'POST') {
            res.writeHead(405, { 'Content-Type': 'application/json' });
            return res.end(JSON.stringify({ error: 'Method not allowed' }));
        }

        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', async () => {
            try {
                const request = JSON.parse(body);
                const { method: rpcMethod, params, id } = request;

                const handler = this.handlers[rpcMethod];
                if (!handler) {
                    return this._sendError(res, id, -32601, `Method not found: ${rpcMethod}`);
                }

                const result = await handler(params);
                this._sendResponse(res, id, result);
            } catch (e) {
                this._sendError(res, null, -32700, `Parse error: ${e.message}`);
            }
        });
    }

    /**
     * Handle message/send - delegate task to GSK brain
     */
    async handleMessageSend(params) {
        const { message, metadata = {} } = params;
        const taskId = `task_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;

        // Extract goal from message
        const goal = message?.content || message?.parts?.[0]?.text || 'Process message';
        const context = { ...metadata, source: 'a2a', taskId };

        // Create task
        const task = {
            id: taskId,
            status: 'working',
            createdAt: Date.now(),
            goal,
            context,
            result: null,
            history: [{ role: 'user', content: goal, timestamp: Date.now() }]
        };
        this.tasks.set(taskId, task);

        // Process asynchronously
        this._processTask(taskId, goal, context).catch(e => {
            const t = this.tasks.get(taskId);
            if (t) {
                t.status = 'failed';
                t.error = e.message;
                t.completedAt = Date.now();
            }
        });

        return { taskId, status: 'working' };
    }

    async _processTask(taskId, goal, context) {
        const task = this.tasks.get(taskId);
        if (!task) return;

        try {
            // Use GSK's autonomous systems
            let result;

            if (this.kernel.autonomyGraph) {
                // Use the full autonomy graph
                result = await this.kernel.autonomyGraph.runCycle({
                    projectRoot: context.projectRoot,
                    goal,
                    onPhaseChange: (e) => {
                        task.history.push({ phase: e.phase, status: e.state?.status, timestamp: Date.now() });
                    }
                });
            } else if (this.kernel.specialistAgents) {
                // Use specialist crew
                result = await this.kernel.specialistAgents.runCrew(goal, context);
            } else {
                // Fallback to brain.think
                const brain = this.kernel.brain || this.kernel.systems?.brain;
                if (brain?.think) {
                    const response = await brain.think(goal, '', true);
                    result = { output: response?.result || response };
                } else {
                    // Phase 4 honesty: the old code returned
                    // { output: 'No brain available' } and still marked the
                    // task 'completed'. Unrun work is now a FAILED task.
                    throw new Error('No brain available — A2A task cannot be processed');
                }
            }

            task.status = 'completed';
            task.result = result;
            task.completedAt = Date.now();
            task.history.push({ role: 'assistant', content: JSON.stringify(result), timestamp: Date.now() });

        } catch (error) {
            task.status = 'failed';
            task.error = error.message;
            task.completedAt = Date.now();
        }
    }

    /**
     * Handle tasks/get - get task status
     */
    async handleTasksGet(params) {
        const { taskId } = params;
        const task = this.tasks.get(taskId);

        if (!task) {
            throw new Error(`Task not found: ${taskId}`);
        }

        return {
            id: task.id,
            status: task.status,
            createdAt: task.createdAt,
            completedAt: task.completedAt,
            result: task.result,
            error: task.error
        };
    }

    /**
     * Handle tasks/cancel - cancel a task
     */
    async handleTasksCancel(params) {
        const { taskId } = params;
        const task = this.tasks.get(taskId);

        if (!task) {
            throw new Error(`Task not found: ${taskId}`);
        }

        if (task.status === 'working') {
            task.status = 'cancelled';
            task.completedAt = Date.now();
        }

        return { id: task.id, status: task.status };
    }

    /**
     * Register GSK as A2A skill on OmniRoute
     */
    async _registerWithOmniRoute() {
        // OmniRoute's A2A skills are built-in server modules (no runtime
        // registration API), so a POST to /api/a2a/skills/register is dead.
        // GSK advertises itself via its own agent card on the A2A port
        // (/.well-known/agent-card.json, alias /.well-known/agent.json);
        // OmniRoute agents discover it through the card.
        // Phase 4: the OmniRoute status probe is now OPT-IN
        // (A2A_PROBE_OMNIROUTE=1). The blood flow (:20128) is not touched
        // by default — adopt, never poke.
        if (process.env.A2A_PROBE_OMNIROUTE !== '1') {
            console.log(`[A2AInterface] GSK advertises on :${this.port}/.well-known/agent-card.json (OmniRoute probe skipped — set A2A_PROBE_OMNIROUTE=1 to enable)`);
            return;
        }
        try {
            const probe = await fetch(`${this.omniRouteUrl}/api/a2a/status`, {
                method: 'GET',
                signal: AbortSignal.timeout(3000)
            }).catch(() => null);
            const present = probe && probe.ok;
            console.log(`[A2AInterface] OmniRoute A2A ${present ? 'reachable' : 'offline'} — GSK advertises on :${this.port}/.well-known/agent-card.json`);
        } catch (e) {
            console.log('[A2AInterface] OmniRoute A2A check failed:', e.message);
        }
    }

    _sendResponse(res, id, result) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ jsonrpc: '2.0', id, result }));
    }

    _sendError(res, id, code, message) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ jsonrpc: '2.0', id, error: { code, message } }));
    }

    /**
     * Delegate to another A2A agent (e.g., OmniRoute skills)
     */
    async delegate(agentUrl, skill, params) {
        // Phase 4: this server's JSON-RPC endpoint is the root path, not
        // /a2a — delegate() now posts where an A2A server actually listens.
        const response = await fetch(`${agentUrl}/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                jsonrpc: '2.0',
                method: 'message/send',
                params: { message: { content: skill, metadata: params } },
                id: crypto.randomUUID()
            })
        });

        const result = await response.json();
        return result.result?.taskId;
    }
}

module.exports = { A2AInterface };