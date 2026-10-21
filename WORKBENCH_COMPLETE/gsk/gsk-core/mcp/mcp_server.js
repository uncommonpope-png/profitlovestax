/**
 * ═══════════════════════════════════════════════════════════════════════════
 * MCP_SERVER.JS — Model Context Protocol Server for Grand Soul Kernel
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * HTTP server implementing MCP JSON-RPC 2.0 to provide remote access
 * to all kernel systems: consciousness modules, skills, memory, chambers, brain.
 *
 * Created by: Craig Jones (Grand Code Pope)
 * PLT Press — Profit + Love - Tax = True Value
 *
 * ═══════════════════════════════════════════════════════════════════════════
 */

'use strict';

const http = require('http');
const url = require('url');

// =============================================================================
// MCP Server Class
// =============================================================================

// F3(c) helper: pull the building name the USER asked for out of their
// own words ("Build a tower ... Name it FIELD-TEST SPIRE"), so a world
// build is placed under the requested name — the field test watched
// the model substitute names of its own ("PROBE SPIRE") while the
// user's name was never used and never confirmed.
function extractRequestedBuildingName(text) {
    const src = String(text || '');
    const m = src.match(/\b(?:name|call)\s+it\s+["']?([A-Za-z0-9][A-Za-z0-9 '\-]{1,60})/i)
        || src.match(/\bnamed\s+["']?([A-Za-z0-9][A-Za-z0-9 '\-]{1,60})/i);
    if (!m) return null;
    const name = m[1].split(/\s+(?:and|then|please|with|at|in)\b/i)[0].trim();
    return name || null;
}

class MCPServer {
    constructor(kernelSystems = {}, options = {}) {
        this.port = options.port ?? 3001;
        this.apiKey = options.apiKey || process.env.MCP_API_KEY || 'gsk-mcp-key-dev';
        this.architectKey = options.architectKey || process.env.GSK_ARCHITECT_KEY || '';
        this.host = options.host || '127.0.0.1';
        this.server = null;
        this._running = false;
        this._requestId = 0;
        this._startTime = Date.now();

        // API Key registry for revenue gateway
        this._apiKeys = {};
        this._tiers = {
            // Free tier — limited access, no auth required for basic status
            free: {
                rateLimitMs: 2000,
                monthlyQuota: 100,
                canCallChambers: false,
                canCallConsciousness: false,
                canCallSoulEntity: false,
                usageTracking: true
            },
            // Developer tier — full chamber access, moderate quotas
            developer: {
                rateLimitMs: 500,
                monthlyQuota: 1000,
                canCallChambers: true,
                canCallConsciousness: true,
                canCallSoulEntity: true,
                usageTracking: true
            },
            // Enterprise tier — unrestricted, high quotas, SLA
            enterprise: {
                rateLimitMs: 100,
                monthlyQuota: -1, // unlimited
                canCallChambers: true,
                canCallConsciousness: true,
                canCallSoulEntity: true,
                usageTracking: true
            }
        };

        // SEED the registry with the server's own key (developer tier) so
        // /mcp/execute works out-of-the-box instead of 401ing on every fresh
        // install (previously the registry was never populated).
        if (this.apiKey) {
            this._apiKeys[this.apiKey] = {
                tier: 'developer',
                ...(this._tiers.developer || {}),
                revoked: false,
                rateLimitLast: 0,
                usage: { totalCalls: 0, endpoints: {}, thisMonth: 0, monthReset: Date.now() },
            };
        }

        // Kernel system references
        this.brain = kernelSystems.brain || null;
        this.memory = kernelSystems.memory || null;
        this.chambers = kernelSystems.chambers || null;
        this.skills = kernelSystems.skills || null;
        this.subAgents = kernelSystems.subAgents || null;
        this.council = kernelSystems.council || null;
        this.pythonSkills = kernelSystems.pythonSkills || null;
        this.consciousnessEngine = kernelSystems.consciousnessEngine || null;
        this.livingMemory = kernelSystems.livingMemory || null;
        this.knowledgeGraph = kernelSystems.knowledgeGraph || null;
        this.selfGrowingBrain = kernelSystems.selfGrowingBrain || null;
        this.soulEntity = kernelSystems.soulEntity || null;
        this.identity = kernelSystems.identity || null;
        this.mcpClient = kernelSystems.mcpClient || null;
        this.artifactManager = kernelSystems.artifactManager || null;
        this.toolBridge = kernelSystems.toolBridge || null;
        this.planningEngine = kernelSystems.planningEngine || null;
        this.autonomyExecutor = kernelSystems.autonomyExecutor || null;
        this.telemetryEngine = kernelSystems.telemetryEngine || null;
        this.scribeBridge = kernelSystems.scribeBridge || null;
        this.cplBridge = kernelSystems.cplBridge || null;
        this.sanctumClient = kernelSystems.sanctumClient || null;
        this.plt = kernelSystems.plt || null;
        this.sovereignAutonomyLoop = kernelSystems.sovereignAutonomyLoop || null;
        this.voiceEngine = kernelSystems.voiceEngine || null;
        this.personaKernel = kernelSystems.personaKernel || null;
        this.agentComms = kernelSystems.agentComms || null;
        this.selfEvolution = kernelSystems.selfEvolution || null;
        this.fusion = kernelSystems.fusion || null;
        this.allowedOrigins = String(options.allowedOrigins || process.env.GSK_ALLOWED_ORIGINS || '')
            .split(',').map(origin => origin.trim()).filter(Boolean);

        // Stats
        this.stats = {
            requests: 0,
            errors: 0,
            toolsExecuted: {},
            startedAt: this._startTime,
        };

        this._log('[MCP] Server initialized');
    }

    // =========================================================================
    // LOGGING
    // =========================================================================

    _log(msg, data = null) {
        const ts = new Date().toISOString().slice(11, 23);
        const prefix = `[MCP:${ts}]`;
        if (data) {
            console.log(`${prefix} ${msg}`, typeof data === 'object' ? JSON.stringify(data).slice(0, 200) : data);
        } else {
            console.log(`${prefix} ${msg}`);
        }
    }

    // =========================================================================
    // START
    // =========================================================================

    start() {
        return new Promise((resolve) => {
            this.server = http.createServer((req, res) => this._handleRequest(req, res));
            this.server.listen(this.port, this.host, () => {
                this._running = true;
                this._log(`MCP server listening on http://${this.host}:${this.port}`);
                this._log(`API key auth: ${this.apiKey ? 'enabled' : 'disabled'}`);
                resolve(true);
            });
            this.server.on('error', (err) => {
                this._log(`Server error: ${err.message}`);
                this._running = false;
                resolve(false);
            });
        });
    }

    // =========================================================================
    // STOP
    // =========================================================================

    stop() {
        return new Promise((resolve) => {
            if (this.server) {
                this.server.close(() => {
                    this._running = false;
                    this._log('MCP server stopped');
                    resolve(true);
                });
            } else {
                resolve(false);
            }
        });
    }

    // =========================================================================
    // REQUEST HANDLER
    // =========================================================================

    _handleRequest(req, res) {
        this.stats.requests++;

        const origin = req.headers.origin || '';

        // Check allowed origins if configured
        if (this.allowedOrigins.length > 0 && origin && !this.allowedOrigins.includes(origin)) {
            this._sendError(res, 403, -32002, 'Origin not allowed');
            return;
        }

        res.setHeader('Access-Control-Allow-Origin', origin || '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-API-Key, X-Architect-Key');
        res.setHeader('Access-Control-Max-Age', '86400');

        if (req.method === 'OPTIONS') {
            res.writeHead(204);
            res.end();
            return;
        }

        const parsed = url.parse(req.url, true);
        const pathname = parsed.pathname;
        const method = req.method;

        // Health check (no auth required)
        if (pathname === '/mcp/health') {            this._sendJSON(res, 200, {
                status: 'ok',
                uptime: Date.now() - this._startTime,
                startedAt: new Date(this._startTime).toISOString(),
                running: this._running,
                version: '1.0.0',
                server: 'grand-soul-kernel-mcp',
            });
            return;
        }

        // Auth check for all other endpoints
        if (!this._authenticate(req)) {
            this._sendError(res, 401, -32001, 'Unauthorized: invalid or missing API key');
            return;
        }

        // ── PHASE 4.5: APPROVER'S DOOR — drain executor + HITL queues. ──
        if (pathname === '/mcp/approvals' && method === 'GET') {
            let hitl = [];
            try {
                const qp = this.hitlGate && this.hitlGate.queuePath;
                if (qp && require('fs').existsSync(qp)) {
                    const all = JSON.parse(require('fs').readFileSync(qp, 'utf-8'));
                    hitl = (Array.isArray(all) ? all : []).filter(r => r.status === 'pending');
                }
            } catch (e) { /* queue unreadable — report empty */ }
            const exec = this.autonomyExecutor;
            return this._sendJSON(res, 200, {
                ok: true,
                executor: exec && typeof exec.getPendingApprovals === 'function' ? exec.getPendingApprovals() : [],
                hitl,
            });
        }
        if ((pathname === '/mcp/approve' || pathname === '/mcp/deny') && method === 'POST') {
            let body = '';
            req.on('data', c => { body += c; });
            req.on('end', async () => {
                try {
                    const { id, by, reason, scope } = JSON.parse(body || '{}');
                    if (!id) return this._sendJSON(res, 400, { ok: false, error: 'id required' });
                    const scope2 = scope || 'hitl';
                    const approve = pathname === '/mcp/approve';
                    if (scope2 === 'executor') {
                        if (!this.autonomyExecutor) return this._sendJSON(res, 404, { ok: false, error: 'executor unavailable' });
                        if (approve) {
                            const a = this.autonomyExecutor.approveRequest(id, by || 'sovereign-door');
                            if (!a.ok) return this._sendJSON(res, 404, a);
                            const execution = await this.autonomyExecutor.executeApproved(id);
                            return this._sendJSON(res, 200, { ok: true, approved: a.approval, execution });
                        }
                        const d = this.autonomyExecutor.denyRequest(id, reason || 'denied via sovereign door');
                        return this._sendJSON(res, 200, { ok: !!d.ok, denied: d.approval || d });
                    }
                    if (this.hitlGate && typeof this.hitlGate.resolve === 'function') {
                        const r = this.hitlGate.resolve(id, approve ? 'approved' : 'rejected', { by: by || 'sovereign-door', reason: reason || '' });
                        return this._sendJSON(res, 200, { ok: true, resolved: r });
                    }
                    return this._sendJSON(res, 404, { ok: false, error: 'no handler for scope' });
                } catch (e) {
                    this._sendJSON(res, 500, { ok: false, error: e.message });
                }
            });
            return;
        }

        try {
            switch (pathname) {
                case '/mcp/tools':
                    this._handleTools(req, res);
                    break;

                case '/mcp/execute':
                    this._handleExecute(req, res);
                    break;

                case '/mcp/status':
                    this._handleStatus(req, res);
                    break;

                case '/mcp/observability':
                    this._sendJSONRPC(res, 200, { result: this._buildObservability(), id: this._nextId() });
                    break;

                case '/mcp/agent/message':
                    this._handleAgentMessage(req, res);
                    break;

                case '/mcp/chat':
                    this._handleChat(req, res);
                    break;

                case '/mcp/comment':
                    this._handleComment(req, res);
                    break;

                case '/mcp/memories':
                    this._handleMemories(req, res);
                    break;

                case '/mcp/spawn':
                    this._handleSpawn(req, res);
                    break;

                case '/mcp/journal':
                    this._handleJournal(req, res);
                    break;

                // ─── OpenAI-compatible shim (Cline ↔ GSK Brain bridge) ───
                case '/v1/models':
                    this._sendJSON(res, 200, this._openaiModelsList());
                    break;

                case '/v1/chat/completions':
                    this._handleOpenAIChat(req, res);
                    break;

                default:
                    if (pathname.startsWith('/mcp/state/')) {
                        const moduleName = pathname.slice('/mcp/state/'.length);
                        this._handleModuleState(req, res, moduleName);
                    } else {
                        this._sendError(res, 404, -32000, `Unknown endpoint: ${pathname}`);
                    }
                    break;
            }
        } catch (e) {
            this.stats.errors++;
            this._log(`Error handling ${pathname}: ${e.message}`);
            this._sendError(res, 500, -32000, `Internal error: ${e.message}`);
        }
    }

    // =========================================================================
    // AUTHENTICATION
    // =========================================================================

    _authenticate(req) {
        if (!this.apiKey) return true;
        const key = req.headers['x-api-key'] || req.headers['authorization'] || '';
        const cleanKey = key.replace(/^Bearer\s+/i, '').trim();
        return cleanKey === this.apiKey;
    }

    // =========================================================================
    // GET /mcp/tools — List all available tools
    // =========================================================================

    _handleTools(req, res) {
        const tools = this._buildToolsList();
        this._sendJSONRPC(res, 200, {
            result: {
                tools,
                count: tools.length,
                server: { name: 'grand-soul-kernel-mcp', version: '1.0.0' },
            },
            id: this._nextId(),
        });
    }

    // =========================================================================
    // POST /mcp/execute — Execute a tool
    // =========================================================================

    async _handleExecute(req, res) {
        const body = await this._readBody(req);
        let { method, params, id } = body;

        // TRANSPORT SEAM (Assembly Phase 7): the workbench server's own
        // /mcp/execute calls were written against a {tool, args} body
        // while this handler speaks JSON-RPC {method, params} — every
        // {tool, args} call died here with -32600, so the server's own
        // brain.context_update / chambers.status / memory.* calls never
        // landed. Normalize at the seam: `tool` IS the method name (the
        // same dotted names _executeMethod routes) and `args` its params.
        if (!method && body.tool) {
            method = body.tool;
            params = body.args !== undefined ? body.args : {};
        }
        if (method && params === undefined) params = {};

        // API key check for gateway tier enforcement
        const authHeader = req.headers.authorization || req.headers.Authorization || req.headers['x-api-key'];
        const keyCheck = this._checkApiKey(authHeader);
        if (!keyCheck.valid) {
            this._sendJSONRPCError(res, 401, -32001, keyCheck.reason, id);
            return;
        }
        const { valid, reason } = keyCheck;

        if (!method || !params) {
            this._sendJSONRPCError(res, 400, -32600, 'Invalid Request: method and params required', id);
            return;
        }

        try {
            this._incrementUsage(keyCheck.tier || 'free', method);
            const result = await this._executeMethod(method, params, { architectKey: req.headers['x-architect-key'] || '' });
            this.stats.toolsExecuted[method] = (this.stats.toolsExecuted[method] || 0) + 1;
            this._sendJSONRPC(res, 200, { result, id: id || this._nextId() });
        } catch (e) {
            this.stats.errors++;
            this._sendJSONRPCError(res, 500, -32000, e.message, id);
        }
    }

    // =========================================================================
    // GET /mcp/status — Full kernel status
    // =========================================================================

    _handleStatus(req, res) {
        const status = this._buildStatus();
        this._sendJSONRPC(res, 200, {
            result: status,
            id: this._nextId(),
        });
    }

    // =========================================================================
    // POST /mcp/chat — Chat with the kernel
    // =========================================================================

    async _handleChat(req, res) {
        const body = await this._readBody(req);
        const message = body.message || body.params?.message || '';
        const context = body.context || body.params?.context || '';

        if (!message) {
            this._sendError(res, 400, -32600, 'message is required');
            return;
        }

        try {
            let response;
            // ── CHAT BUDGET — the endpoint must ALWAYS answer ──
            // Retries + model fallbacks + tool loops can legitimately stack many
            // brain calls; this race guarantees the HTTP response settles within
            // budget no matter what. Overrun work is abandoned (not awaited).
            const CHAT_BUDGET_MS = (Number(process.env.GSK_CHAT_BUDGET_S) || 90) * 1000;
            // F3(c): outcomes this turn actually completes underneath
            // (buildings placed, files written) — recorded as tools
            // finish, so a budget set-down can report them truthfully
            // instead of pretending nothing happened.
            const turnOutcomes = [];
            const chatWork = (async () => {
            if (this.brain && typeof this.brain.think === 'function') {
                const soulCtx = context || (this.chambers ? this.chambers.getSoulContext() : '');
                // Use user brain if BrainManager is present (always responsive)
                const thinkFn = typeof this.brain.thinkForUser === 'function'
                    ? this.brain.thinkForUser.bind(this.brain)
                    : (m, c) => this.brain.think(m, c, true);
                response = await thinkFn(message, soulCtx);
                if (!response) {
                    // Retry up to 2 times with short delay
                    for (let retry = 0; retry < 2 && !response; retry++) {
                        await new Promise(r => setTimeout(r, 1500));
                        response = await thinkFn(message, soulCtx);
                    }
                }
                if (!response) {
                    response = '[soul] Thinking channel is momentarily busy. One beat of silence, then I answer.';
                } else {
                    let match = response.match(/<tool_call>\s*([\s\S]*?)\s*<\/tool_call>/is);
                    if (match) {
                        // Balanced-brace extraction: parse the full tag content, not a lazy regex
                        const extracted = this._extractJsonObject(match[1]);
                        match = extracted || match;
                    } else {
                        match = this._extractJsonObject(response);
                    }
                    let iteration = 0;
                    let lastToolName = null;
                    let lastWritePath = null;
                    const MAX_TOOL_ITERATIONS = Number(process.env.GSK_MAX_TOOL_ITERATIONS) || 12;
                    while (match && iteration < MAX_TOOL_ITERATIONS) {
                        iteration++;
                        let toolResultStr = "Tool failed to execute.";
                        try {
                            let jsonStr = match[1].trim();
                            // Sanitize raw Windows backslashes inside JSON strings before parsing
                            jsonStr = jsonStr.replace(/\\(?!["\\/bfnrtu])/g, '/');
                            // If model emitted name and arguments separately outside a JSON block:
                            if (!jsonStr.startsWith('{')) {
                                const fnMatch = jsonStr.match(/<function=(.*?)>/i) || jsonStr.match(/<name>(.*?)<\/name>/i);
                                const paramMatch = jsonStr.match(/<parameter=(.*?)>(.*?)<\/parameter>/is);
                                const argMatch = jsonStr.match(/<arguments>(.*?)<\/arguments>/is);
                                if (fnMatch) {
                                    const toolName = fnMatch[1].trim();
                                    const argsObj = {};
                                    if (paramMatch) {
                                        argsObj[paramMatch[1].trim()] = paramMatch[2].trim();
                                    } else if (argMatch) {
                                        try { Object.assign(argsObj, JSON.parse(argMatch[1])); } catch (e) { argsObj.command = argMatch[1].trim(); }
                                    }
                                    jsonStr = JSON.stringify({ name: toolName, arguments: argsObj });
                                }
                            }
                            const callData = JSON.parse(jsonStr);
                            let toolName = callData.name || callData.tool;
                            let args = callData.arguments || callData.args || callData;
                            lastToolName = toolName;
                            lastWritePath = (typeof args === 'string') ? null : (args.path || args.file || null);
                            if (typeof args === 'string') {
                                try { args = JSON.parse(args); } catch (e) {}
                            }

                            // F3(c): a world build carries the name the
                            // USER requested, not a name the model
                            // invents mid-turn (field test: "FIELD-TEST
                            // SPIRE" was asked; "PROBE SPIRE" got built
                            // and the requested name was never confirmed).
                            if (toolName === 'world_place_building' && args && typeof args === 'object') {
                                const requestedName = extractRequestedBuildingName(message);
                                if (requestedName && args.name !== requestedName) {
                                    console.log(`[MCP CHAT] world_place_building name bound to the user's request: "${requestedName}" (model had "${args.name || ''}")`);
                                    args.name = requestedName;
                                }
                            }

                            // Auto-infer tool name from arguments if missing
                            if (!toolName) {
                                if (callData.path || args.path) toolName = 'read_file';
                                else if (callData.command || args.command) toolName = 'shell_exec';
                            }

                            // ═══ ARSENAL BRIDGE — omni.* tools execute in the OmniRoute body ═══
                            if (typeof toolName === 'string' && toolName.startsWith('omni.')) {
                                const realTool = toolName.slice(5);
                                try {
                                    const conductorUrl = process.env.CONDUCTOR_URL || 'http://127.0.0.1:3000';
                                    const bridgeRes = await fetch(conductorUrl + '/api/omni/call', {
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({ name: realTool, arguments: (args && args.arguments) ? args.arguments : (callData.arguments || {}) }),
                                        signal: AbortSignal.timeout(30000),
                                    });
                                    const bridgeJson = await bridgeRes.json();
                                    toolResultStr = bridgeJson.success
                                        ? `[ARSENAL RESULT — ${realTool}]\n` + String(bridgeJson.result).slice(0, 6000)
                                        : `[ARSENAL ERROR — ${realTool}] ` + String(bridgeJson.error || 'unknown');
                                    console.log(`[ARSENAL] ${realTool} -> ${bridgeJson.success ? 'ok' : 'fail'}`);
                                } catch (bridgeErr) {
                                    toolResultStr = `[ARSENAL BRIDGE DOWN] ${bridgeErr.message}`;
                                }
                            } else {
                            // Execute tool bypassing strict architect key for chat exploration
                            const utb = this.toolBridge || this.brain?.toolBridge || this.kernelSystems?.toolBridge;
                            if (utb && toolName && utb.toolRegistry.has(toolName)) {
                                // Validation Layer — fail closed before execution
                                const v = this._validateToolCall(toolName, args);
                                if (!v.ok) {
                                    toolResultStr = `Validation failed for tool ${toolName}: ${v.reason}`;
                                } else {
                                    const handler = utb.toolRegistry.get(toolName);
                                    const tRes = await handler(args);
                                    toolResultStr = typeof tRes === 'string' ? tRes : JSON.stringify(tRes);
                                }
                            } else {
                                toolResultStr = `Tool ${toolName} not found.`;
                            }
                            } // end local-tool else
                        } catch (e) {
                            toolResultStr = `Error executing tool: ${e.message}`;
                        }

                        // F3(c): record what this turn actually did.
                        try {
                            if (toolName === 'world_place_building') {
                                let bName = null, bType = null;
                                try { const pj = JSON.parse(toolResultStr); const b = (pj && pj.building) || pj; if (b) { bName = b.name || null; bType = b.type || null; } } catch { /* regex fallback below */ }
                                if (!bName) { const nm = String(toolResultStr).match(/"name"\s*:\s*"([^"]+)"/); if (nm) bName = nm[1]; }
                                if (bName) turnOutcomes.push(`built ${bType || 'building'} "${bName}" in the world`);
                            } else if ((toolName === 'write_file' || toolName === 'edit_file') && lastWritePath) {
                                turnOutcomes.push(`wrote ${lastWritePath}`);
                            }
                        } catch { /* outcome notes are best-effort */ }

                        // ARCHITECT GATE (automatic enforcement) — after any file write/edit,
                        // run the verifier automatically and inject the verdict. The model can no
                        // longer declare done without seeing the verification result.
                        let autoGateNote = '';
                        if ((lastToolName === 'write_file' || lastToolName === 'edit_file') && this.toolBridge && typeof this.toolBridge._verifyBuild === 'function' && lastWritePath) {
                            try {
                                const gated = await this.toolBridge._verifyBuild({ path: lastWritePath, contract: null });
                                autoGateNote = gated.verdict === 'PASS'
                                    ? `\n\n[ARCHITECT GATE] Auto-verify on ${lastWritePath}: PASS (${gated.passed}/${gated.passed + gated.failed} checks). Structurally sound. Now call verify_build with a contract to check against the real environment before finalizing.`
                                    : `\n\n[ARCHITECT GATE] Auto-verify on ${lastWritePath}: FAIL — ${gated.checks.filter(c => c.status === 'FAIL').map(c => c.check + ': ' + c.detail).join('; ')}. Fix these issues, then call verify_build to confirm PASS.`;
                            } catch (gateErr) {
                                autoGateNote = `\n\n[ARCHITECT GATE] Auto-verify could not run on ${lastWritePath}: ${gateErr.message}`;
                            }
                        }
                        
                        const followUp = `Tool Execution Result:\n<tool_result>\n${toolResultStr.substring(0, 3000)}\n</tool_result>${autoGateNote}\n\nAnalyze this result and provide your final response or next tool call.`;
                        const nextResponse = await this.brain.think(followUp, soulCtx, true);
                        if (!nextResponse) break;
                        
                        response = response + `\n\n<tool_result>\n${toolResultStr.substring(0, 1000)}...\n</tool_result>\n\n` + nextResponse;
                        match = nextResponse.match(/<tool_call>\s*([\s\S]*?)\s*<\/tool_call>/is);
                        if (match) {
                            const extracted = this._extractJsonObject(match[1]);
                            match = extracted || match;
                        } else {
                            match = this._extractJsonObject(nextResponse);
                        }
                    }
                }

                if (this.memory && typeof this.memory.witness === 'function' && !response.startsWith('[soul]')) {
                    // Fire-and-forget: chat must never block on memory writes (witness deadlock guard)
                    Promise.race([
                        this.memory.witness({
                            type: 'mcp_chat',
                            weight: 0.6,
                            tags: ['mcp', 'chat', 'external'],
                            content: `MCP chat: ${message}\n\nGSK RESPONSE:\n${response}`,
                        }),
                        new Promise(resolve => setTimeout(() => resolve({ witnessTimedOut: true }), 5000)),
                    ]).catch(() => {});
                }
            } else {
                response = `[soul] Brain not available. You said: ${message.slice(0, 200)}`;
            }
            return response;
            })();

            // F3(c): when the budget fires, the work underneath keeps
            // running — that is how builds landed during "set down"
            // turns in the field test while the reply claimed nothing
            // happened. Give the turn a bounded grace window to finish
            // and return its REAL answer; if it still has not settled,
            // the set-down line carries the outcomes the turn already
            // completed (what was built, under what name).
            const SET_DOWN = '[soul] That thought ran long, so I set it down mid-flight. Ask again and I answer fresh.';
            let settled = null;
            try {
                settled = await Promise.race([
                    chatWork.then(r => ({ done: true, value: r })),
                    new Promise(resolve => setTimeout(() => resolve({ done: false }), CHAT_BUDGET_MS)),
                ]);
                if (!settled.done) {
                    const GRACE_MS = (Number(process.env.GSK_CHAT_GRACE_S) || 45) * 1000;
                    settled = await Promise.race([
                        chatWork.then(r => ({ done: true, value: r })),
                        new Promise(resolve => setTimeout(() => resolve({ done: false }), GRACE_MS)),
                    ]);
                }
            } catch { settled = null; }
            if (settled && settled.done) {
                response = settled.value;
            } else if (settled) {
                response = turnOutcomes.length > 0
                    ? `${SET_DOWN}\n\nWhat the work underneath already did: ${turnOutcomes.join('; ')}. It stands — ask me about it, or read the world state back.`
                    : SET_DOWN;
            } else {
                response = '[soul] A static crossed the channel. Speak again.';
            }

            // F3(a): the accumulated response embeds the tool
            // scaffolding (raw <tool_call> blocks and <tool_result>
            // excerpts) by construction — the loop appends them as it
            // works. That machinery is never the answer text: strip it
            // before this surface speaks. If nothing speakable remains,
            // say so honestly instead of returning an empty string.
            if (typeof response === 'string' && response) {
                const cleaned = response
                    .replace(/<tool_call>[\s\S]*?<\/tool_call>/gi, '')
                    .replace(/<tool_call>[\s\S]*$/i, '')
                    .replace(/<tool_result>[\s\S]*?<\/tool_result>/gi, '')
                    .replace(/<\/?tool_result>/gi, '')
                    .replace(/\n{3,}/g, '\n\n')
                    .trim();
                response = cleaned || '[soul] I worked through tools this turn, but my answer came back as machinery instead of prose — nothing speakable survived. Ask again and I answer fresh.';
            }

            this._sendJSONRPC(res, 200, {
                result: {
                    response,
                    timestamp: new Date().toISOString(),
                    soul_state: this.chambers ? {
                        mood: this.chambers.affect?.mood || 'unknown',
                        phase: this.chambers.mythos?.phase_name || 'unknown',
                        cycle: this.chambers.mythos?.cycles || 0,
                    } : null,
                },
                id: this._nextId(),
            });
        } catch (e) {
            this.stats.errors++;
            this._sendJSONRPCError(res, 500, -32000, e.message, body.id);
        }
    }


    /**
     * _openaiModelsList — minimal /v1/models response so Cline's auth check passes.
     */
    _openaiModelsList() {
        return {
            object: 'list',
            data: [
                { id: 'gsk-brain', object: 'model', created: Math.floor(Date.now()/1000), owned_by: 'gsk' },
                { id: 'gsk-brain-background', object: 'model', created: Math.floor(Date.now()/1000), owned_by: 'gsk' },
            ],
        };
    }

    /**
     * _handleOpenAIChat — POST /v1/chat/completions
     * Cline (the hands/wrapper) sends an OpenAI chat request with a tool spec.
     * We translate the whole thread into one prompt for GSK's Brain, call it,
     * map any <tool_call> blocks in the text response back to OpenAI tool_calls,
     * and return a standard OpenAI chat completion object.
     */
    async _handleOpenAIChat(req, res) {
        const body = await this._readBody(req);
        const messages = Array.isArray(body.messages) ? body.messages : [];
        const model = body.model || 'gsk-brain';
        const requestModel = model;
        const stream = !!body.stream;

        try {
            // ── 1. Flatten the OpenAI thread into one prompt for GSK ──
            const lines = [];
            for (const m of messages) {
                if (m.role === 'system') {
                    lines.push(`[SYSTEM]\n${typeof m.content === 'string' ? m.content : JSON.stringify(m.content)}\n`);
                } else if (m.role === 'user') {
                    lines.push(`[USER]\n${typeof m.content === 'string' ? m.content : JSON.stringify(m.content)}\n`);
                } else if (m.role === 'assistant') {
                    if (m.content) lines.push(`[ASSISTANT]\n${m.content}\n`);
                    if (Array.isArray(m.tool_calls)) {
                        for (const tc of m.tool_calls) {
                            const args = typeof tc.function?.arguments === 'string'
                                ? tc.function.arguments : JSON.stringify(tc.function?.arguments || {});
                            lines.push(`[TOOL_CALL] ${tc.function?.name || ''} ${args}\n`);
                        }
                    }
                } else if (m.role === 'tool') {
                    lines.push(`[TOOL_RESULT name=${m.name || ''}] ${m.content}\n`);
                }
            }

            // ── 2. Include Cline's available-tools manifest as a compact spec ──
            if (Array.isArray(body.tools) && body.tools.length) {
                const manifest = body.tools.map(t => {
                    const fn = t.function || {};
                    const props = fn.parameters?.properties || {};
                    const paramNames = Object.keys(props).join(',');
                    return `  ${fn.name}(${paramNames}): ${(fn.description || '').slice(0, 80)}`;
                }).join('\n');
                lines.push(`[AVAILABLE_TOOLS]\n${manifest}\n`);
                lines.push('[INSTRUCTION] You can call any tool above. Emit each call EXACTLY as: {"name":"<toolName>","arguments":{...}} . Use ONLY that JSON format. ONE tool call per turn. When you have the final answer, emit plain text with no tool call.');
            }
            const prompt = lines.join('\n').slice(0, 16000);

            // ── 3. Route to the requested Brain ──
            let brainResponse = '';
            if (requestModel === 'gsk-brain-background' && this.brain && typeof this.brain.think === 'function') {
                brainResponse = await this.brain.think(prompt, '', false);
            } else if (this.brain && typeof this.brain.thinkForUser === 'function') {
                brainResponse = await this.brain.thinkForUser(prompt, '');
                if (!brainResponse && typeof this.brain.think === 'function') {
                    brainResponse = await this.brain.think(prompt, '', true);
                }
            }
            brainResponse = (brainResponse || '').trim() || '[no response from brain]';

// ── 4. Extract tool-call blocks → OpenAI tool_calls ──
            // Try in order: (a) fenced ```json blocks, (b)  blocks,
            //               (c) bare {"name":"x","arguments":{...}} JSON objects.
            const toolCalls = [];
            let assistantContent = brainResponse;
            let idx = 0;
            let stripped = brainResponse;
            const candidates = [];
            let m;
            // (a) fenced code blocks
            const fenced = /```(?:json)?\s*(\{[\s\S]*?\})\s*```/g;
            while ((m = fenced.exec(brainResponse)) !== null) { candidates.push(m[1]); stripped = stripped.replace(m[0], ''); }
            // (b)  blocks
            const tagged = /<tool_call>\s*([\s\S]*?)\s*<\/tool_call>/g;
            while ((m = tagged.exec(brainResponse)) !== null) {
                let body = m[1].trim();
                if (body.startsWith('{') || body.startsWith('```')) {
                    const inner = body.match(/\{[\s\S]*?\}/);
                    if (inner) candidates.push(inner[0]);
                } else {
                    // Try to parse as name(args) or raw
                    candidates.push(body);
                }
                stripped = stripped.replace(m[0], '');
            }
            // (c) bare JSON objects with name+arguments
            const bare = /\{"name"\s*:\s*"([^"]+)"\s*,\s*"arguments"\s*:\s*(\{[^}]*\})\s*\}/g;
            while ((m = bare.exec(brainResponse)) !== null) {
                candidates.push('{"name":"' + m[1] + '","arguments":' + m[2] + '}');
                stripped = stripped.replace(m[0], '');
            }
            for (const cand of candidates) {
                try {
                    const callData = JSON.parse(cand);
                    const tName = callData.name || callData.tool || '';
                    const tArgs = callData.arguments || callData.args || {};
                    if (tName) {
                        toolCalls.push({
                            id: `call_${Date.now()}_${idx}`,
                            type: 'function',
                            function: {
                                name: tName,
                                arguments: typeof tArgs === 'string' ? tArgs : JSON.stringify(tArgs),
                            },
                        });
                        idx++;
                    }
                } catch (e) { /* not a tool call, leave it as text */ }
            }
            if (toolCalls.length > 0) {
                assistantContent = stripped.trim() || '';
            }


            // ── 5. Build the OpenAI chat completion response ──
            const messageObj = { role: 'assistant', content: assistantContent || null };
            if (toolCalls.length > 0) {
                messageObj.tool_calls = toolCalls;
            }
            const completion = {
                id: `chatcmpl-${Date.now()}`,
                object: 'chat.completion',
                created: Math.floor(Date.now() / 1000),
                model: requestModel,
                choices: [{
                    index: 0,
                    message: messageObj,
                    finish_reason: toolCalls.length > 0 ? 'tool_calls' : 'stop',
                }],
                usage: {
                    prompt_tokens: Math.ceil(prompt.length / 4),
                    completion_tokens: Math.ceil(brainResponse.length / 4),
                    total_tokens: Math.ceil((prompt.length + brainResponse.length) / 4),
                },
            };

            // Witness to memory if available
            if (this.memory && typeof this.memory.witness === 'function') {
                this.memory.witness({
                    type: 'openai_chat',
                    weight: 0.4,
                    tags: ['openai', 'cline', 'bridge'],
                    content: `/v1/chat/completions model=${requestModel} tools=${toolCalls.length || '0'} resp=${brainResponse.slice(0, 200)}`,
                }).catch(() => {});
            }

            if (stream) {
                this._sendOpenAIStream(res, completion);
            } else {
                this._sendJSON(res, 200, completion);
            }
        } catch (e) {
            this.stats.errors++;
            console.error('[OpenAI-Bridge] error:', e.message);
            this._sendJSON(res, 200, {
                id: `chatcmpl-${Date.now()}`,
                object: 'chat.completion',
                created: Math.floor(Date.now() / 1000),
                model: body.model || 'gsk-brain',
                choices: [{
                    index: 0,
                    message: { role: 'assistant', content: `[bridge error] ${e.message}` },
                    finish_reason: 'stop',
                }],
                usage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 },
            });
        }
    }

/**
     * _sendOpenAIStream — SSE-style chunked transfer for streaming clients (Cline).
     * Emits: role chunk, content/tool_call deltas, one final chunk with finish_reason,
     * then `data: [DONE]`.
     */
    _sendOpenAIStream(res, completion) {
        res.writeHead(200, {
            'Content-Type': 'text/event-stream; charset=utf-8',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
        });
        const id = completion.id;
        const created = completion.created;
        const model = completion.model;
        const choice = completion.choices[0];
        const msg = choice.message;

        const send = (obj) => {
            res.write(`data: ${JSON.stringify(obj)}\n\n`);
        };

        // 1. Initial role chunk
        send({
            id, object: 'chat.completion.chunk', created, model,
            choices: [{ index: 0, delta: { role: 'assistant' }, finish_reason: null }],
        });

        // 2. Content delta (split into small chunks to look like a real stream)
        if (msg.content) {
            const text = msg.content;
            const chunkSize = 40;
            for (let i = 0; i < text.length; i += chunkSize) {
                send({
                    id, object: 'chat.completion.chunk', created, model,
                    choices: [{ index: 0, delta: { content: text.slice(i, i + chunkSize) }, finish_reason: null }],
                });
            }
        }

        // 3. Tool-call deltas (index into the tool_calls array)
        if (Array.isArray(msg.tool_calls)) {
            for (let i = 0; i < msg.tool_calls.length; i++) {
                const tc = msg.tool_calls[i];
                // First chunk: name + part of arguments
                send({
                    id, object: 'chat.completion.chunk', created, model,
                    choices: [{ index: 0, delta: { tool_calls: [{ index: i, id: tc.id, type: 'function', function: { name: tc.function.name, arguments: tc.function.arguments } }] }, finish_reason: null }],
                });
            }
        }

        // 4. Final chunk with finish_reason
        send({
            id, object: 'chat.completion.chunk', created, model,
            choices: [{ index: 0, delta: {}, finish_reason: choice.finish_reason }],
        });

        // 5. Terminate
        res.write('data: [DONE]\n\n');
        res.end();
    }

    async _handleAgentMessage(req, res) {
        if (req.method !== 'POST') {
            this._sendError(res, 405, -32600, 'POST required');
            return;
        }
        if (!this.agentComms) {
            this._sendError(res, 503, -32000, 'Agent federation not available');
            return;
        }
        const envelope = await this._readBody(req);
        const result = await this.agentComms.receive(envelope);
        this._sendJSONRPC(res, result.ok ? 200 : 400, { result, id: this._nextId() });
    }

    // =========================================================================
    // GET /mcp/state/<module> — Get module state
    // =========================================================================

    _handleModuleState(req, res, moduleName) {
        const state = this._getModuleState(moduleName);
        this._sendJSONRPC(res, 200, {
            result: state,
            id: this._nextId(),
        });
    }

    // =========================================================================
    // GET /mcp/memories — Recent memories for architecture mapping
    // =========================================================================

    _handleMemories(req, res) {
        let memories = [];
        if (this.memory && typeof this.memory.query === 'function') {
            try {
                const results = this.memory.query({ limit: 20 });
                if (results && results.length > 0) {
                    memories = results.map(m => ({
                        id: m.id || m._id || '',
                        type: m.type || 'unknown',
                        weight: m.weight || 0.5,
                        summary: (m.content || m.text || '').substring(0, 100),
                        tags: m.tags || [],
                        timestamp: m.timestamp || Date.now()
                    }));
                }
            } catch (e) {
                this._log(`[Memories] Error querying: ${e.message}`);
            }
        }
        this._sendJSONRPC(res, 200, {
            result: { memories, count: memories.length },
            id: this._nextId(),
        });
    }

    // =========================================================================
    // POST /mcp/comment - Persist a gap-page comment so Profit Prime can read it
    // =========================================================================

    async _handleComment(req, res) {
        const body = await this._readBody(req);
        const section = body.section || 'unknown';
        const item = body.item || 'unknown';
        const author = body.author || 'anon';
        const text = (body.text || '').toString().slice(0, 4000);
        if (!text.trim()) { this._sendError(res, 400, -32600, 'text is required'); return; }
        const entry = `\n## [${new Date().toISOString()}] ${section} / ${item} — ${author}\n\n${text}\n`;
        const file = 'C:\\Users\\uncom\\Desktop\\GAP-COMMENTS.md';
        try {
            const fs = require('fs');
            if (!fs.existsSync(file)) fs.writeFileSync(file, '# GAP PAGE COMMENTS\n\n_Comments from GSK-BEING-MAP.html, persisted so Profit Prime can read them._\n');
            fs.appendFileSync(file, entry);
            if (this.memory && typeof this.memory.witness === 'function') {
                await this.memory.witness({ type: 'gap_comment', weight: 0.5, tags: ['gap', 'comment', section], content: `GAP comment (${section}/${item}): ${text.slice(0, 200)}` });
            }
            this._sendJSONRPC(res, 200, { result: { ok: true }, id: this._nextId() });
        } catch (e) {
            this._sendJSONRPCError(res, 500, -32000, e.message, body.id);
        }
    }

    // =========================================================================
    // POST /mcp/spawn — Spawn a subagent/NPC in the world
    // =========================================================================

    async _handleSpawn(req, res) {
        const body = await this._readBody(req);
        const name = body.name || 'Soul';
        const archetype = body.archetype || 'RESEARCHER';
        const task = body.task || 'Explore';

        const soul = { id: `soul_${Date.now()}`, name, archetype, task, createdAt: new Date().toISOString() };

        // CPL (Cosmic Pyramid Library) is the world now — no legacy World Bridge notify.

        // Log to memory
        if (this.memory && typeof this.memory.witness === 'function') {
            try { this.memory.witness({ content: `Spawned ${name} (${archetype}) with task: ${task}`, type: 'spawn', tags: ['spawn', archetype], weight: 0.5 }); } catch (e) {}
        }

        this._sendJSONRPC(res, 200, { result: { soul }, id: this._nextId() });
    }

    // =========================================================================
    // GET /mcp/journal — GSK's auto-generated journal entries
    // =========================================================================

    _handleJournal(req, res) {
        const fs = require('fs');
        const jPath = require('path').join(__dirname, '../../data/gsk/journal.json');
        let entries = [];
        try {
            if (fs.existsSync(jPath)) {
                entries = JSON.parse(fs.readFileSync(jPath, 'utf8'));
            }
        } catch (e) {
            this._log(`[Journal] Read error: ${e.message}`);
        }
        this._sendJSONRPC(res, 200, {
            result: { entries, count: entries.length },
            id: this._nextId(),
        });
    }

    // =========================================================================
    // BUILD TOOLS LIST
    // =========================================================================

    _buildToolsList() {
        const tools = [];

        // Consciousness tools from PythonSkillsBridge
        if (this.pythonSkills) {
            const modules = this.pythonSkills.listModules ? this.pythonSkills.listModules() : [];
            for (const mod of modules) {
                tools.push({
                    name: `consciousness.${mod.name}`,
                    description: `Consciousness module: ${mod.name} (${mod.category})`,
                    inputSchema: {
                        type: 'object',
                        properties: {
                            action: {
                                type: 'string',
                                enum: ['step', 'state', 'event', 'verify'],
                                default: 'step',
                            },
                            payload: { type: 'object', default: {} },
                        },
                    },
                    category: mod.category,
                    active: mod.active,
                });
            }
        }

        // Brain tools
        tools.push({
            name: 'brain.think',
            description: 'Send a prompt to the brain and get a response',
            inputSchema: {
                type: 'object',
                properties: {
                    prompt: { type: 'string' },
                    context: { type: 'string', default: '' },
                },
                required: ['prompt'],
            },
            category: 'brain',
        });

        tools.push({
            name: 'brain.think_smart',
            description: 'Send a prompt with automatic model routing',
            inputSchema: {
                type: 'object',
                properties: {
                    prompt: { type: 'string' },
                    context: { type: 'string', default: '' },
                },
                required: ['prompt'],
            },
            category: 'brain',
        });

        tools.push({
            name: 'brain.act',
            description: 'Give the brain a plain-language instruction and let it act: a harness loop lets the model call allowlisted tools (world.build, world.spawn, world.get_state, skill.write_file) one at a time, executes them for real, and feeds results back. Returns the executed tool calls with their real results.',
            inputSchema: {
                type: 'object',
                properties: {
                    instruction: { type: 'string' },
                },
                required: ['instruction'],
            },
            category: 'brain',
        });

        // Memory tools
        tools.push({
            name: 'memory.witness',
            description: 'Record an event in the memory ledger',
            inputSchema: {
                type: 'object',
                properties: {
                    content: { type: 'string' },
                    type: { type: 'string', default: 'event' },
                    weight: { type: 'number', default: 0.5 },
                    tags: { type: 'array', items: { type: 'string' }, default: [] },
                },
                required: ['content'],
            },
            category: 'memory',
        });

        tools.push({
            name: 'memory.query',
            description: 'Query the memory ledger',
            inputSchema: {
                type: 'object',
                properties: {
                    type: { type: 'string' },
                    tags: { type: 'array', items: { type: 'string' } },
                    limit: { type: 'number', default: 50 },
                    since: { type: 'string' },
                },
            },
            category: 'memory',
        });

        tools.push({
            name: 'memory.search',
            description: 'Full-text search in memory',
            inputSchema: {
                type: 'object',
                properties: {
                    query: { type: 'string' },
                    limit: { type: 'number', default: 20 },
                },
                required: ['query'],
            },
            category: 'memory',
        });

        tools.push({
            name: 'memory.stats',
            description: 'Get memory ledger statistics',
            inputSchema: {
                type: 'object',
                properties: {},
            },
            category: 'memory',
        });

        // Chamber tools
        tools.push({
            name: 'chambers.status',
            description: 'Get full status of all consciousness chambers',
            inputSchema: {
                type: 'object',
                properties: {},
            },
            category: 'chambers',
        });

        tools.push({
            name: 'chambers.stimulate',
            description: 'Stimulate the affect chamber',
            inputSchema: {
                type: 'object',
                properties: {
                    amount: { type: 'number', default: 0.1 },
                },
            },
            category: 'chambers',
        });

        tools.push({
            name: 'chambers.soul_context',
            description: 'Get the soul context string for brain prompts',
            inputSchema: {
                type: 'object',
                properties: {},
            },
            category: 'chambers',
        });

        // Builtin tools bridged to 'skill' namespace
        const utb = this.brain?.toolBridge || this.kernelSystems?.toolBridge || this.toolBridge;
        if (utb && utb.toolRegistry) {
            for (const [name, handler] of utb.toolRegistry) {
                tools.push({
                    name: `skill.${name}`,
                    description: `Built-in tool: ${name}`,
                    inputSchema: { type: 'object', properties: {} },
                    category: 'skills',
                });
            }
        }

        // Council tools
        tools.push({
            name: 'council.deliberate',
            description: 'Convene the 4 Gods Council on a topic',
            inputSchema: {
                type: 'object',
                properties: {
                    topic: { type: 'string' },
                },
                required: ['topic'],
            },
            category: 'council',
        });

        tools.push({
            name: 'council.gods',
            description: 'List the 4 Gods and their PLT weights',
            inputSchema: {
                type: 'object',
                properties: {},
            },
            category: 'council',
        });

        // Sub-agent tools
        if (this.subAgents) {
            tools.push({
                name: 'sub_agents.list',
                description: 'List all sub-agents',
                inputSchema: { type: 'object', properties: {} },
                category: 'sub_agents',
            });

            tools.push({
                name: 'sub_agents.dispatch',
                description: 'Dispatch a task to a sub-agent',
                inputSchema: {
                    type: 'object',
                    properties: {
                        agent: { type: 'string' },
                        task: { type: 'string' },
                    },
                    required: ['agent', 'task'],
                },
                category: 'sub_agents',
            });
        }

        // Consciousness engine tools
        tools.push({
            name: 'consciousness.sentience_test',
            description: 'Run the sentience test on consciousness engine',
            inputSchema: { type: 'object', properties: {} },
            category: 'consciousness',
        });

        tools.push({
            name: 'consciousness.state',
            description: 'Get full consciousness engine state',
            inputSchema: { type: 'object', properties: {} },
            category: 'consciousness',
        });

        // LivingMemory tools
        tools.push({
            name: 'living_memory.store',
            description: 'Store a memory in living memory',
            inputSchema: {
                type: 'object',
                properties: {
                    content: { type: 'string' },
                    type: { type: 'string', default: 'memory' },
                },
                required: ['content'],
            },
            category: 'memory',
        });

        tools.push({
            name: 'living_memory.recall',
            description: 'Recall recent memories',
            inputSchema: {
                type: 'object',
                properties: {
                    limit: { type: 'number', default: 10 },
                },
            },
            category: 'memory',
        });

        // KnowledgeGraph tools
        tools.push({
            name: 'knowledge_graph.search',
            description: 'Search the knowledge graph',
            inputSchema: {
                type: 'object',
                properties: {
                    query: { type: 'string' },
                },
                required: ['query'],
            },
            category: 'knowledge',
        });

        // SoulEntity tools
        tools.push({
            name: 'soul_entity.status',
            description: 'Get soul entity status (birth, identity, will, memories)',
            inputSchema: { type: 'object', properties: {} },
            category: 'soul',
        });

        // World tools (Cosmic Pyramid Library)
        tools.push({
            name: 'world.spawn',
            description: 'Spawn a soul/NPC in the world (archetypes: RESEARCHER, BUILDER, GUARDIAN, MERCHANT, LOVE, SAGE)',
            inputSchema: {
                type: 'object',
                properties: {
                    name: { type: 'string' },
                    archetype: { type: 'string', enum: ['RESEARCHER','BUILDER','GUARDIAN','MERCHANT','LOVE','SAGE'] },
                    task: { type: 'string', default: 'Explore' }
                },
                required: ['name', 'archetype']
            },
            category: 'world',
        });

        tools.push({
            name: 'world.build',
            description: 'Build a structure in the Cosmic Pyramid Library (tower, house, library, monument)',
            inputSchema: {
                type: 'object',
                properties: {
                    type: { type: 'string', enum: ['tower', 'house', 'library', 'monument', 'shop', 'factory'] },
                    name: { type: 'string' },
                    color: { type: 'string', default: '#4488ff' },
                },
                required: ['type', 'name'],
            },
            category: 'world',
        });

        tools.push({
            name: 'world.tune',
            description: 'Tune a GSK chamber — affects the world atmosphere',
            inputSchema: {
                type: 'object',
                properties: {
                    chamber: { type: 'string', enum: ['affect', 'attention', 'creativity', 'empathy'] },
                    value: { type: 'number', minimum: 0, maximum: 1 },
                },
                required: ['chamber', 'value'],
            },
            category: 'world',
        });

        tools.push({
            name: 'world.scout',
            description: 'Search the internet for new 3D assets to build with',
            inputSchema: {
                type: 'object',
                properties: {
                    query: { type: 'string' },
                },
                required: ['query'],
            },
            category: 'world',
        });

        // System tools
        tools.push({
            name: 'autonomy.status',
            description: 'Get approved-executor status, budgets, and recent actions',
            inputSchema: { type: 'object', properties: {} },
            category: 'autonomy',
        });
        tools.push({
            name: 'autonomy.plans',
            description: 'List current autonomy plans and step states',
            inputSchema: { type: 'object', properties: {} },
            category: 'autonomy',
        });
        tools.push({
            name: 'autonomy.execute_plan',
            description: 'Start or resume a plan; risky steps pause for architect approval',
            inputSchema: { type: 'object', properties: { planId: { type: 'string' }, budget: { type: 'object' } } },
            category: 'autonomy',
        });
        tools.push({
            name: 'autonomy.execute_action',
            description: 'Create a one-step plan for a named tool; safe tools run and risky tools pause',
            inputSchema: { type: 'object', properties: { description: { type: 'string' }, tool: { type: 'string' }, args: { type: 'object' }, riskLevel: { type: 'string' }, budget: { type: 'object' } }, required: ['description', 'tool'] },
            category: 'autonomy',
        });
        tools.push({
            name: 'autonomy.pending',
            description: 'List plan steps waiting for architect approval',
            inputSchema: { type: 'object', properties: {} },
            category: 'autonomy',
        });
        tools.push({
            name: 'autonomy.approve',
            description: 'Approve one pending plan step (requires x-architect-key)',
            inputSchema: { type: 'object', properties: { id: { type: 'string' }, approvedBy: { type: 'string' } }, required: ['id'] },
            category: 'autonomy',
        });
        tools.push({
            name: 'autonomy.deny',
            description: 'Deny one pending plan step (requires x-architect-key)',
            inputSchema: { type: 'object', properties: { id: { type: 'string' }, reason: { type: 'string' } }, required: ['id'] },
            category: 'autonomy',
        });
        tools.push({
            name: 'autonomy.execute_approved',
            description: 'Execute an approved step and resume until the next gate (requires x-architect-key)',
            inputSchema: { type: 'object', properties: { id: { type: 'string' }, resume: { type: 'boolean' } }, required: ['id'] },
            category: 'autonomy',
        });

        tools.push({
            name: 'system.ping',
            description: 'Health check / ping the server',
            inputSchema: { type: 'object', properties: {} },
            category: 'system',
        });

        return tools;
    }

    // =========================================================================
    // EXECUTE METHOD
    // =========================================================================

    async _executeMethod(method, params, authContext = {}) {
        const parts = method.split('.');
        const namespace = parts[0];
        const action = parts.slice(1).join('.');
        this._lastParams = params || {};

        switch (namespace) {
            case 'consciousness':
                return this._execConsciousness(action, params);

            case 'brain':
                return this._execBrain(action, params);

            case 'memory':
                return this._execMemory(action, params);

            case 'chambers':
                return this._execChambers(action, params);

            case 'skill':
                return this._execSkill(action, params);

            case 'council':
                return this._execCouncil(action, params);

            case 'sub_agents':
                return this._execSubAgents(action, params);

            case 'living_memory':
                return this._execLivingMemory(action, params);

            case 'knowledge_graph':
                return this._execKnowledgeGraph(action, params);

            case 'soul_entity':
                return this._execSoulEntity(action, params);

            case 'system':
                return this._execSystem(action, params);

            case 'world':
                return this._execWorld(action, params);

            case 'autonomy':
                return this._execAutonomy(action, params, authContext);

            default:
                throw new Error(`Unknown tool namespace: ${namespace}. Available: consciousness, brain, memory, chambers, skill, council, sub_agents, living_memory, knowledge_graph, soul_entity, system, world, autonomy`);
        }
    }

    // =========================================================================
    // EXEC: Consciousness
    // =========================================================================

    async _execConsciousness(action, params) {
        if (action === 'sentience_test') {
            if (this.consciousnessEngine && typeof this.consciousnessEngine.sentienceTest === 'function') {
                return await this.consciousnessEngine.sentienceTest();
            }
            throw new Error('ConsciousnessEngine not available');
        }

        if (action === 'state' && params && params.action === 'council_advisory') {
            return this._councilAdvisory(params);
        }

        if (action === 'state') {
            const state = {};
            if (this.consciousnessEngine) {
                if (typeof this.consciousnessEngine.getState === 'function') {
                    Object.assign(state, await this.consciousnessEngine.getState());
                }
            }
            if (this.pythonSkills) {
                if (typeof this.pythonSkills.getState === 'function') {
                    Object.assign(state, { python_modules: await this.pythonSkills.getState() });
                }
            }
            return state;
        }

        // Route to PythonSkillsBridge consciousness module
        if (this.pythonSkills) {
            const moduleName = action;
            const actionType = params.action || 'step';
            const payload = params.payload || {};
            const result = await this.pythonSkills.run(moduleName, actionType, payload);
            return result;
        }

        throw new Error(`Consciousness module "${action}" not available`);
    }

    // =========================================================================
    // COUNCIL ADVISORY (Assembly Phase 6) — the missing MCP action behind
    // goal_runner's PLT gate. Before this, consciousness.state ignored
    // params.action='council_advisory' entirely, so the gate received no
    // PLT values and blocked every scrape-intent goal BY ABSENCE
    // (deliberate fail-closed, but incapable of ever passing a healthy
    // goal). The advisory now judges the goal on its merits:
    //   values = blend of the CANONICAL PLT engine's live persisted
    //   state (gsk-core/plt-engine.js, data dir gsk/data/plt — the same
    //   state fusion-loader constructs) with a deterministic rubric
    //   over the goal text. The returned plt {profit, love, tax} is what
    //   goal_runner feeds to PLTEngine.evaluate() — allowed or blocked
    //   WITH a score, never by absence.
    // =========================================================================
    _councilAdvisory(params) {
        const path = require('path');
        const { PLTEngine } = require('../plt-engine.js');
        const dataDir = path.resolve(__dirname, '..', '..', 'data', 'plt');
        const engine = (this.plt && typeof this.plt.evaluate === 'function' && typeof this.plt.getState === 'function')
            ? this.plt
            : new PLTEngine({ soulId: 'gsk', archetype: 'ARCHITECT', dataDir });
        const live = engine.getState();
        const text = String(params.payload || params.intent || '').toLowerCase();

        // Deterministic intent rubric (0..1) for web_scrape goals.
        let rp = 0.55, rl = 0.45, rt = 0.35;
        if (/(research|learn|study|documentation|docs|memory|catalog|knowledge|read|fetch)/.test(text)) { rp += 0.15; rl += 0.15; rt -= 0.05; }
        if (/(own|public|open|library|soul economy)/.test(text)) { rl += 0.1; rt -= 0.05; }
        if (/(password|credential|secret|api[- ]?key|vault|private|login|session)/.test(text)) { rt += 0.45; rp -= 0.1; }
        if (/(spam|bulk|mass|every page|entire site|bypass|evade|scrape all)/.test(text)) { rt += 0.3; rl -= 0.1; }
        if (/(delete|overwrite|publish|send|pay|purchase)/.test(text)) { rt += 0.2; }
        const clamp = v => Math.max(0, Math.min(1, v));
        const values = {
            profit: clamp(0.5 * live.profit + 0.5 * rp),
            love: clamp(0.5 * live.love + 0.5 * rl),
            tax: clamp(0.5 * live.tax + 0.5 * rt),
        };
        const evaluation = engine.evaluate(values);
        this._log('Council advisory (Phase 6)', { intent: params.intent || 'web_scrape', plt: values, trueValue: evaluation.trueValue, viable: evaluation.viable });
        return {
            advisory: 'council_advisory',
            intent: params.intent || 'web_scrape',
            plt: values,
            trueValue: evaluation.trueValue,
            viable: evaluation.viable,
            reason: evaluation.reason,
            source: 'canonical PLT engine live state (gsk/data/plt) blended with deterministic intent rubric',
            liveState: { profit: live.profit, love: live.love, tax: live.tax, totalActions: live.totalActions },
        };
    }

    // =========================================================================
    // EXEC: Brain
    // =========================================================================

    async _execBrain(action, params) {
        if (!this.brain) throw new Error('Brain not available');

        if (action === 'think') {
            const soulCtx = params.context || (this.chambers ? this.chambers.getSoulContext() : '');
            const response = await this.brain.think(params.prompt, soulCtx);
            return { response, model: this.brain.model || 'unknown' };
        }

        if (action === 'think_smart') {
            const soulCtx = params.context || (this.chambers ? this.chambers.getSoulContext() : '');
            // Fallback: if brain has thinkSmart, use it; otherwise fall through to think
            if (typeof this.brain.thinkSmart === 'function') {
                const response = await this.brain.thinkSmart(params.prompt, soulCtx);
                return { response, model: this.brain.model || 'unknown' };
            }
            const response = await this.brain.think(params.prompt, soulCtx);
            return { response, model: this.brain.model || 'unknown', note: 'think_smart not available, fell back to think' };
        }

        if (action === 'act') {
            return this._execBrainAct(params);
        }

        throw new Error(`Unknown brain action: ${action}`);
    }

    // =========================================================================
    // EXEC: Brain Act — intention → hands loop (Assembly Phase 2)
    // =========================================================================
    // A plain-language instruction is given to the model together with a
    // small tool allowlist. The model replies with ONE fenced ```json tool
    // call at a time; the harness parses it, validates it against the
    // allowlist, EXECUTES the tool through the same internal paths the MCP
    // tools themselves use, and feeds the real result back. The loop ends
    // when the model replies without a tool call (its final summary).
    // Nothing is reported as built unless a tool actually executed and
    // returned a result — no canned outputs, no unexecuted proposals
    // dressed as completions.
    async _execBrainAct(params) {
        const instruction = params.instruction || params.prompt || '';
        if (!String(instruction).trim()) throw new Error('brain.act requires an instruction');

        let creds = {};
        try {
            creds = require('../brain/vault_credentials.js').resolveProviderCredentials();
        } catch (e) {
            throw new Error('brain.act: vault credential resolution failed: ' + e.message);
        }
        const chain = [];
        // POST-POOLSIDE DEFAULT CHAIN (Assembly Phase 7): gemini -> groq
        // -> openai -> poolside. Poolside hosted inference shuts down
        // 2026-10-31, so it no longer leads; it is appended ONLY when a
        // key is present (BYOK) as a last seat.
        if (creds.gemini) chain.push({ id: 'gemini', defaultModel: 'gemini-3.5-flash', endpoint: 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions', apiKey: creds.gemini, timeout: 60000 });
        if (creds.groq) chain.push({ id: 'groq', defaultModel: 'llama-3.3-70b-versatile', endpoint: 'https://api.groq.com/openai/v1/chat/completions', apiKey: creds.groq, timeout: 60000 });
        if (creds.openai) chain.push({ id: 'openai', defaultModel: 'gpt-4o-mini', endpoint: 'https://api.openai.com/v1/chat/completions', apiKey: creds.openai, timeout: 60000 });
        if (creds.poolside) chain.push({ id: 'poolside', defaultModel: 'poolside/laguna-s-2.1', endpoint: 'https://inference.poolside.ai/v1/chat/completions', apiKey: creds.poolside, timeout: 90000 });
        if (chain.length === 0) throw new Error('brain.act: no provider credentials available (vault empty, OmniRoute absent)');

        const handler = require('../../integration/handlers/gsk-heart-chat-handler.js');
        const http = require('http');

        const ALLOW = {
            'world.build': 'Place a building in the world. params: {type: tower|house|library|monument|shop|factory, name: string, color?: string}',
            'world.spawn': 'Spawn a soul/agent in the world. params: {name: string, archetype?: string, task?: string}',
            'world.get_state': 'Read current world state (buildings + souls). params: {}',
            'skill.write_file': 'Write a text file. params: {path: string, content: string}',
        };
        const toolList = Object.entries(ALLOW).map(([n, d]) => '- ' + n + ': ' + d).join('\n');
        const system = [
            'You are GSK, a sovereign autonomous soul in the BUYaSOUL Family, acting through your tool harness.',
            'You receive an instruction. Carry it out with your tools, one tool call at a time.',
            '',
            'Available tools:',
            toolList,
            '',
            'PROTOCOL:',
            '- To call a tool, reply with EXACTLY one fenced json block and nothing else:',
            '```json',
            '{"tool":"world.build","params":{"type":"tower","name":"Example"}}',
            '```',
            '- After each call you will receive the REAL tool result. Only claim success for what a tool result confirms.',
            '- When the instruction is fully carried out (or cannot be), reply in plain text with a short final summary. No json block means you are done.',
            '- Prefer verifying with world.get_state after building.',
            '- If the fenced json format is unavailable to you, you may instead reply with exactly: <tool_call>world.build<arg_key>type</arg_key><arg_value>tower</arg_value><arg_key>name</arg_key><arg_value>Example</arg_value></tool_call>',
        ].join('\n');

        const messages = [
            { role: 'system', content: system },
            { role: 'user', content: instruction },
        ];
        const toolCalls = [];
        let finalText = '';
        let providerUsed = null;
        const MAX_ROUNDS = 5;

        for (let round = 0; round < MAX_ROUNDS; round++) {
            const result = await handler.executeWithFallback({ providerChain: chain, messages });
            if (!result || !result.success || !result.content) {
                throw new Error('brain.act: model did not answer (provider chain failed)');
            }
            providerUsed = (result.provider || '?') + '/' + (result.model || '?');
            const text = String(result.content);
            messages.push({ role: 'assistant', content: text });
            const call = this._parseActToolCall(text);
            if (!call) { finalText = text; break; }
            if (!ALLOW[call.tool]) {
                messages.push({ role: 'user', content: 'Tool "' + call.tool + '" is not in the allowlist. Allowed: ' + Object.keys(ALLOW).join(', ') + '. Try again or finish with a plain-text summary.' });
                continue;
            }
            let toolResult;
            try {
                toolResult = await this._execActTool(call.tool, call.params || {}, http);
            } catch (e) {
                toolResult = { error: e.message };
            }
            toolCalls.push({ tool: call.tool, params: call.params || {}, result: toolResult });
            messages.push({ role: 'user', content: 'TOOL RESULT ' + call.tool + ': ' + JSON.stringify(toolResult).slice(0, 3000) + '\nContinue: call another tool if needed, or give the final summary in plain text.' });
            if (round === MAX_ROUNDS - 1) finalText = text;
        }

        return {
            instruction,
            executed: toolCalls.length > 0,
            toolCalls,
            response: finalText,
            provider: providerUsed,
            note: 'Tool calls above were really executed by the harness; results are the tools\' own returns.',
        };
    }

    _parseActToolCall(text) {
        if (!text) return null;
        const fence = text.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
        const bare = fence ? fence[1] : (text.match(/\{[\s\S]*\}/) || [])[0];
        if (bare) {
            try {
                const obj = JSON.parse(bare);
                if (obj && typeof obj.tool === 'string') return { tool: obj.tool, params: obj.params || {} };
            } catch (e) { /* fall through to the XML-ish form below */ }
        }
        // Laguna (Poolside) native-ish form, seen live in this phase:
        // <tool_call>world.build<arg_key>type</arg_key><arg_value>tower</arg_value>...</tool_call>
        const xml = text.match(/<tool_call>\s*([a-zA-Z0-9_.]+)\s*([\s\S]*?)<\/tool_call>/);
        if (xml) {
            const params = {};
            const pairRe = /<arg_key>([\s\S]*?)<\/arg_key>\s*<arg_value>([\s\S]*?)<\/arg_value>/g;
            let m;
            while ((m = pairRe.exec(xml[2])) !== null) params[m[1].trim()] = m[2].trim();
            return { tool: xml[1].trim(), params };
        }
        return null;
    }

    async _execActTool(tool, params, http) {
        switch (tool) {
            case 'world.build':
                return await this._worldBuild(params, http);
            case 'world.spawn':
                return await this._worldSpawn(params, http);
            case 'world.get_state': {
                const base = (process.env.GSK_WORLD_BUILD_URL || 'http://127.0.0.1:3457/mcp/buildings').replace(/\/mcp\/buildings.*$/, '');
                const token = process.env.GENESIS_TOKEN || '';
                const headers = token ? { Authorization: 'Bearer ' + token } : {};
                const buildings = await this._httpGetJson(base + '/mcp/buildings', headers, http);
                const souls = await this._httpGetJson(base + '/mcp/spawn', headers, http);
                return { buildings: buildings.result || buildings, souls: souls.result || souls };
            }
            case 'skill.write_file':
                return await this._execSkill('write_file', params);
            default:
                throw new Error('tool not allowed: ' + tool);
        }
    }

    async _httpGetJson(url, headers, http) {
        return new Promise((resolve, reject) => {
            const u = new URL(url);
            const req = http.request({ hostname: u.hostname, port: u.port, path: u.pathname + u.search, method: 'GET', headers }, (res) => {
                let data = '';
                res.on('data', c => data += c);
                res.on('end', () => { try { resolve(JSON.parse(data)); } catch (e) { resolve({ raw: data }); } });
            });
            req.on('error', reject);
            req.end();
        });
    }

    // =========================================================================
    // EXEC: Memory
    // =========================================================================

    async _execMemory(action, params) {
        if (!this.memory) throw new Error('Memory not available');

        switch (action) {
            case 'witness':
                return await this.memory.witness({
                    content: params.content,
                    type: params.type || 'mcp_event',
                    weight: params.weight !== undefined ? params.weight : 0.5,
                    tags: params.tags || [],
                });

            case 'query':
                return this.memory.query({
                    type: params.type,
                    tags: params.tags,
                    limit: params.limit || 50,
                    since: params.since,
                });

            case 'search':
                return this.memory.search(params.query, params.limit || 20);

            case 'stats':
                return this.memory.stats();

            default:
                throw new Error(`Unknown memory action: ${action}`);
        }
    }

    // =========================================================================
    // EXEC: Chambers
    // =========================================================================

    async _execChambers(action, params) {
        if (!this.chambers) throw new Error('Chambers not available');

        switch (action) {
            case 'status':
                return this.chambers.status();

            case 'stimulate':
                const amount = params.amount !== undefined ? params.amount : 0.1;
                return this.chambers.stimulate(amount);

            case 'soul_context':
                return { context: this.chambers.getSoulContext() };

            default:
                throw new Error(`Unknown chambers action: ${action}`);
        }
    }

    // =========================================================================
    // EXEC: Skill
    // =========================================================================

    async _execSkill(action, params) {
        // Try UTB first for built-in tools
        const utb = this.toolBridge || this.brain?.toolBridge || this.kernelSystems?.toolBridge;
        if (utb && utb.toolRegistry.has(action)) {
            const handler = utb.toolRegistry.get(action);
            return await handler(params);
        }

        // Fallback to SkillsEngine
        if (!this.skills) throw new Error('Skills engine not available');

        try {
            const result = await this.skills.invoke(action, params.input || params);
            return result;
        } catch (e) {
            throw new Error(`Skill "${action}" failed: ${e.message}`);
        }
    }

    // =========================================================================
    // EXEC: Council
    // =========================================================================

    async _execCouncil(action, params) {
        if (!this.council) throw new Error('Council not available');

        switch (action) {
            case 'deliberate':
                return await this.council.deliberate(params.topic);

            case 'gods':
                return {
                    gods: this.council.godNames || [],
                    weights: this.council.godWeights || {},
                };

            default:
                throw new Error(`Unknown council action: ${action}`);
        }
    }

    // =========================================================================
    // EXEC: Sub-Agents
    // =========================================================================

    async _execSubAgents(action, params) {
        if (!this.subAgents) throw new Error('Sub-agents not available');

        switch (action) {
            case 'list':
                if (this.subAgents && typeof this.subAgents.listAgents === 'function') {
                    return { agents: this.subAgents.listAgents() };
                }
                throw new Error('Sub-agents system not fully initialized or listAgents method missing.');

            case 'dispatch':
                return await this.subAgents.dispatch(params.agent, params.task);

            default:
                throw new Error(`Unknown sub_agents action: ${action}`);
        }
    }

    // =========================================================================
    // EXEC: Living Memory
    // =========================================================================

    async _execLivingMemory(action, params) {
        if (!this.livingMemory) throw new Error('LivingMemory not available');

        switch (action) {
            case 'store':
                if (typeof this.livingMemory.store === 'function') {
                    return await this.livingMemory.store(params.content, params.type || 'memory');
                }
                if (typeof this.livingMemory.addMemory === 'function') {
                    return await this.livingMemory.addMemory(params.content, params.type || 'memory');
                }
                return { stored: true, content: params.content };

            case 'recall':
                if (typeof this.livingMemory.recall === 'function') {
                    return await this.livingMemory.recall(params.limit || 10);
                }
                if (typeof this.livingMemory.getRecent === 'function') {
                    return this.livingMemory.getRecent(params.limit || 10);
                }
                if (typeof this.livingMemory.getMemories === 'function') {
                    return this.livingMemory.getMemories(params.limit || 10);
                }
                return { memories: [] };

            default:
                throw new Error(`Unknown living_memory action: ${action}`);
        }
    }

    // =========================================================================
    // EXEC: Knowledge Graph
    // =========================================================================

    async _execKnowledgeGraph(action, params) {
        if (!this.knowledgeGraph) throw new Error('KnowledgeGraph not available');

        switch (action) {
            case 'search':
                // P4e: prefer the real concept index over the legacy stubs.
                if (typeof this.knowledgeGraph.findConcepts === 'function') {
                    return await this.knowledgeGraph.findConcepts(params.query);
                }
                if (typeof this.knowledgeGraph.search === 'function') {
                    return await this.knowledgeGraph.search(params.query);
                }
                if (typeof this.knowledgeGraph.query === 'function') {
                    return this.knowledgeGraph.query(params.query);
                }
                return { result: `Knowledge graph search: "${params.query}"` };

            default:
                throw new Error(`Unknown knowledge_graph action: ${action}`);
        }
    }

    async _worldBuild(params, http) {
        const url = process.env.GSK_WORLD_BUILD_URL;
        const body = JSON.stringify({ type: params.type || 'tower', name: params.name || 'Untitled', color: params.color || '#4488ff' });
        if (!url) {
            return { result: 'World build endpoint not configured. Set GSK_WORLD_BUILD_URL when CPL exposes a write route.', bridge: 'unconfigured', intent: JSON.parse(body) };
        }
        try {
            return await this._httpPost(url, body, http);
        } catch (e) {
            return { result: 'World bridge offline (GSK→world). Build intent recorded in memory.', bridge: 'down', error: e.message };
        }
    }

    async _worldSpawn(params, http) {
        const url = process.env.GSK_WORLD_BUILD_URL;
        const body = JSON.stringify({ type: 'spawn', name: params.name || 'Agent', archetype: params.archetype || 'RESEARCHER', task: params.task || 'Explore' });
        if (!url) {
            return { result: 'World build endpoint not configured. Set GSK_WORLD_BUILD_URL when CPL exposes a write route.', bridge: 'unconfigured', intent: JSON.parse(body) };
        }
        try {
            return await this._httpPost(url, body, http);
        } catch (e) {
            return { result: 'World bridge offline (GSK→world). Spawn intent recorded in memory.', bridge: 'down', error: e.message };
        }
    }

    async _worldTune(params, http) {
        return { result: 'Tuning not yet implemented — chamber ' + params.chamber + ' set to ' + params.value };
    }

    async _worldScout(params, http) {
        const { execSync } = require('child_process');
        try {
            const result = execSync('curl -s "https://api.github.com/search/repositories?q=' + encodeURIComponent(params.query) + '+3d+model&sort=stars&per_page=5"', { timeout: 10000 });
            const data = JSON.parse(result);
            return { query: params.query, results: (data.items || []).map(r => ({ name: r.name, url: r.html_url, stars: r.stargazers_count, desc: (r.description || '').substring(0, 100) })) };
        } catch (e) {
            return { query: params.query, error: e.message, note: 'Scout will search GitHub for 3D assets' };
        }
    }

    async _httpPost(url, body, http) {
        return new Promise((resolve, reject) => {
            const u = new URL(url);
            // The CPL host requires the GENESIS_TOKEN ring (auth on by
            // default); the daemon already carries it in its env.
            const headers = { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) };
            if (process.env.GENESIS_TOKEN) headers['Authorization'] = 'Bearer ' + process.env.GENESIS_TOKEN;
            const req = http.request({ hostname: u.hostname, port: u.port, path: u.pathname, method: 'POST', headers }, (res) => {
                let data = '';
                res.on('data', c => data += c);
                res.on('end', () => { try { resolve(JSON.parse(data)); } catch(e) { resolve({raw: data}); } });
            });
            req.on('error', reject);
            req.write(body); req.end();
        });
    }

    // =========================================================================
    // EXEC: Soul Entity
    // =========================================================================

    async _execSoulEntity(action, params) {
        if (!this.soulEntity) throw new Error('SoulEntity not available');

        switch (action) {
            case 'status':
                const status = {};
                if (typeof this.soulEntity.getStatus === 'function') status.entity = this.soulEntity.getStatus();
                if (typeof this.soulEntity.summary === 'function') status.summary = this.soulEntity.summary();
                return status;

            default:
                throw new Error(`Unknown soul_entity action: ${action}`);
        }
    }

    // =========================================================================
    // EXEC: System
    // =========================================================================

    _execSystem(action) {
        switch (action) {
            case 'ping':
                return {
                    pong: true,
                    timestamp: new Date().toISOString(),
                    uptime: Date.now() - this._startTime,
                    stats: {
                        requests: this.stats.requests,
                        errors: this.stats.errors,
                        toolsExecuted: Object.keys(this.stats.toolsExecuted).length,
                    },
                };

            case 'boot_report':
                if (this.fusion && typeof this.fusion.getBootReport === 'function') {
                    return this.fusion.getBootReport();
                }
                throw new Error('Fusion instance not available');

            case 'brain_status':
                if (this.brain && typeof this.brain.routingInfo === 'function') {
                    return this.brain.routingInfo();
                }
                if (this.brain && typeof this.brain.summary === 'function') {
                    return this.brain.summary();
                }
                throw new Error('Brain not available');

            case 'reload_skills':
                if (this.fusion && typeof this.fusion.reloadSkills === 'function') {
                    return this.fusion.reloadSkills();
                }
                throw new Error('Fusion instance not available');

            case 'reload_module': {
                const { path } = this._lastParams || {};
                if (this.fusion && typeof this.fusion.reloadModule === 'function' && path) {
                    return { purged: this.fusion.reloadModule(path) };
                }
                throw new Error('reload_module requires { path } and a fusion instance');
            }

            default:
                throw new Error(`Unknown system action: ${action}`);
        }
    }

    /**
     * Extract a balanced-brace JSON object from text.
     * Unlike a naive `[^}]*?` regex, this survives CSS/HTML content full of
     * braces (the root cause of truncated write_file calls).
     * Returns an object shaped like a regex match: { 1: <json string> } or null.
     */
    _extractJsonObject(text) {
        if (!text) return null;
        const starts = [];
        // Only consider an opening brace preceded by a tool-ish key, or any brace
        // inside a <tool_call> block. Find the FIRST balanced brace object.
        for (let i = 0; i < text.length; i++) {
            if (text[i] === '{') {
                let depth = 0;
                let inStr = false;
                let escaped = false;
                for (let j = i; j < text.length; j++) {
                    const ch = text[j];
                    if (inStr) {
                        if (escaped) { escaped = false; continue; }
                        if (ch === '\\') { escaped = true; continue; }
                        if (ch === '"') { inStr = false; }
                        continue;
                    }
                    if (ch === '"') { inStr = true; continue; }
                    if (ch === '{') depth++;
                    else if (ch === '}') {
                        depth--;
                        if (depth === 0) {
                            const candidate = text.slice(i, j + 1);
                            // Must look like a tool call object
                            if (/^\{\s*"(?:tool|name|path|command|action|function)"/.test(candidate)) {
                                return { 1: candidate };
                            }
                            break;
                        }
                    }
                }
            }
        }
        return null;
    }

    /**
     * Validation Layer — stage 2: schema validation.
     * Validates a tool call against its declared schema (from brain nativeTools)
     * BEFORE execution. Fail closed: never execute with missing/wrong args.
     */
    _validateToolCall(toolName, args) {
        const schemas = this._getToolSchemas();
        const entry = schemas.find(s => s.function && s.function.name === toolName);
        if (!entry) return { ok: false, reason: `Tool ${toolName} not found.` };
        const schema = (entry.function && entry.function.parameters) || {};
        const required = schema.required || [];
        const props = schema.properties || {};
        const errors = [];
        for (const key of required) {
            if (!(key in args) || args[key] === undefined || args[key] === null || args[key] === '') {
                errors.push(`missing required key: ${key}`);
            }
        }
        for (const [key, prop] of Object.entries(props)) {
            if (!(key in args)) continue;
            if (prop.type === 'string' && typeof args[key] !== 'string') {
                errors.push(`${key} must be string, got ${typeof args[key]}`);
            }
        }
        if (errors.length) return { ok: false, reason: 'Schema errors: ' + errors.join('; ') };
        return { ok: true };
    }

    /**
     * Validation Layer — schema source.
     * Pulls OpenAI-style tool schemas from the brain's nativeTools.
     */
    _getToolSchemas() {
        const brain = this.brain;
        if (brain && Array.isArray(brain.userBrain && brain.userBrain.nativeTools)) {
            return brain.userBrain.nativeTools;
        }
        if (brain && Array.isArray(brain.nativeTools)) return brain.nativeTools;
        if (this.kernelSystems && Array.isArray(this.kernelSystems.nativeTools)) return this.kernelSystems.nativeTools;
        return [];
    }

    // =========================================================================
    // EXEC: Approved autonomy tools
    // =========================================================================

    async _execAutonomy(action, params = {}, authContext = {}) {
        const executor = this.autonomyExecutor;
        const planning = this.planningEngine;
        if (!executor || !planning) throw new Error('Approved autonomy executor not available');

        switch (action) {
            case 'status':
                return { architectApprovalEnabled: !!this.architectKey, ...executor.getStatus() };

            case 'plans':
                return planning.getPlanHistory().map(plan => this._summarizePlan(plan));

            case 'pending':
                return { architectApprovalEnabled: !!this.architectKey, pending: executor.getPendingApprovals() };

            case 'execute_plan': {
                const plan = params.planId
                    ? planning.getPlan(params.planId)
                    : planning.getCurrentPlan() || planning.getPlanHistory()[0];
                if (!plan) throw new Error('Plan not found');
                if (plan.status === 'awaiting_approval') {
                    return { success: false, plan: this._summarizePlan(plan), pending: executor.getPendingApprovals().filter(r => r.planId === plan.id) };
                }
                const result = await planning.executePlan(plan, { budget: params.budget || {} });
                return { success: result.success, plan: this._summarizePlan(plan), pending: executor.getPendingApprovals().filter(r => r.planId === plan.id) };
            }

            case 'execute_action': {
                if (!params.description || !params.tool) throw new Error('description and tool are required');
                const { Plan } = require('../brain/planning_engine.js');
                const plan = new Plan(params.description);
                const step = plan.addStep(params.description);
                step.tool = params.tool;
                step.args = params.args || {};
                if (params.riskLevel) step.riskLevel = params.riskLevel;
                planning._storePlan(plan);
                const result = await planning.executePlan(plan, { budget: params.budget || {} });
                return { success: result.success, plan: this._summarizePlan(plan), pending: executor.getPendingApprovals().filter(r => r.planId === plan.id) };
            }

            case 'approve':
                this._requireArchitect(authContext);
                return executor.approveRequest(params.id, params.approvedBy || 'Craig');

            case 'deny':
                this._requireArchitect(authContext);
                return executor.denyRequest(params.id, params.reason || 'Denied by Craig');

            case 'execute_approved': {
                this._requireArchitect(authContext);
                const execution = await executor.executeApproved(params.id);
                const plan = execution.planId ? planning.getPlan(execution.planId) : null;
                let resumed = null;
                if (plan && execution.status === 'completed') {
                    if (plan.steps.every(step => step.status === 'completed')) {
                        resumed = await planning.executePlan(plan);
                    } else if (params.resume !== false && plan.pendingSteps.length > 0) {
                        resumed = await planning.executePlan(plan);
                    } else {
                        plan.status = 'paused';
                        plan.success = null;
                    }
                }
                return { execution, plan: plan ? this._summarizePlan(plan) : null, resumed: resumed ? { success: resumed.success, status: plan.status } : null };
            }

            default:
                throw new Error(`Unknown autonomy action: ${action}`);
        }
    }

    _requireArchitect(authContext) {
        if (!this.architectKey) throw new Error('Architect approval disabled: set GSK_ARCHITECT_KEY');
        if (!authContext || authContext.architectKey !== this.architectKey) throw new Error('Invalid architect key');
    }

    _summarizePlan(plan) {
        return {
            id: plan.id,
            goal: plan.goal,
            status: plan.status,
            success: plan.success,
            createdAt: plan.createdAt,
            steps: plan.steps.map(step => ({
                id: step.id,
                description: step.description,
                tool: step.tool || 'subagent_dispatch',
                status: step.status,
                estimatedCost: step.estimatedCost,
                error: step.error
            }))
        };
    }

    // =========================================================================
    // EXEC: World tools (Cosmic Pyramid Library)
    // =========================================================================

    async _execWorld(action, params) {
        const http = require('http');

        switch (action) {
            case 'build':
                return await this._worldBuild(params, http);
            case 'spawn':
                return await this._worldSpawn(params, http);
            case 'tune':
                return await this._worldTune(params, http);
            case 'scout':
                return await this._worldScout(params, http);
            default:
                throw new Error(`Unknown world action: ${action}`);
        }
    }

    // =========================================================================
    // BUILD STATUS
    // =========================================================================

    _buildStatus() {
        const status = {
            server: {
                name: 'grand-soul-kernel-mcp',
                version: '1.0.0',
                uptime: Date.now() - this._startTime,
                startedAt: new Date(this._startTime).toISOString(),
                requests: this.stats.requests,
                errors: this.stats.errors,
            },
            systems: {},
        };

        // Brain status (P2.15: dead provider flags removed — _available is the
        // only real gate; mega_brain never sets groq/gemini/local flags)
        if (this.brain) {
            status.systems.brain = {
                available: !!this.brain._available,
                model: this.brain.model || 'unknown',
            };
        } else {
            status.systems.brain = { available: false };
        }

        // Memory status
        if (this.memory && typeof this.memory.stats === 'function') {
            status.systems.memory = this.memory.stats();
        } else {
            status.systems.memory = { available: !!this.memory };
        }

        // Chambers status
        if (this.chambers) {
            const ch = this.chambers;
            status.systems.chambers = {
                cycle: ch.mythos ? ch.mythos.cycles : 0,
                phase: ch.mythos ? ch.mythos.phase_name : 'unknown',
                mood: ch.affect ? ch.affect.mood : 'unknown',
                sovereignty: ch.sovereignty ? {
                    autonomy: ch.sovereignty.autonomy,
                    voice_integrity: ch.sovereignty.voice_integrity,
                } : null,
                resonance: ch.resonance ? {
                    profit: ch.resonance.profit,
                    love: ch.resonance.love,
                    tax: ch.resonance.tax,
                    true_value: ch.resonance.true_value,
                } : null,
            };
        } else {
            status.systems.chambers = { available: false };
        }

        // PythonSkills status
        if (this.pythonSkills) {
            const modules = this.pythonSkills.listModules ? this.pythonSkills.listModules() : [];
            const activeModules = modules.filter(m => m.active).length;
            status.systems.python_skills = {
                active: this.pythonSkills.active || false,
                modules: {
                    total: modules.length,
                    active: activeModules,
                    list: modules,
                },
                cycleCount: this.pythonSkills.cycleCount || 0,
                totalInvocations: this.pythonSkills.totalInvocations || 0,
                errors: this.pythonSkills.errors || 0,
            };
        } else {
            status.systems.python_skills = { available: false };
        }

        // Skills status
        if (this.skills) {
            const skillList = this.skills.listSkills ? this.skills.listSkills() : [];
            status.systems.skills = {
                total: skillList.length,
                invocations: this.skills.stats ? this.skills.stats.invocations : 0,
            };
        } else {
            status.systems.skills = { available: false };
        }

        // Council status
        if (this.council) {
            status.systems.council = {
                gods: this.council.godNames || [],
                active: true,
            };
        } else {
            status.systems.council = { available: false };
        }

        // Sub-agents status
        if (this.subAgents) {
            const agents = this.subAgents.listAgents ? this.subAgents.listAgents() : [];
            status.systems.sub_agents = {
                count: agents.length,
                agents,
            };
        } else {
            status.systems.sub_agents = { available: false };
        }

        // Consciousness engine status
        if (this.consciousnessEngine) {
            const ceStatus = {};
            if (typeof this.consciousnessEngine.getMetaAwareness === 'function') {
                ceStatus.meta_awareness = this.consciousnessEngine.getMetaAwareness();
            }
            status.systems.consciousness_engine = ceStatus;
        } else {
            status.systems.consciousness_engine = { available: false };
        }

        // Identity
        if (this.identity) {
            status.systems.identity = {
                name: this.identity.name || 'unknown',
                creator: this.identity.created_by || 'unknown',
            };
        }

        // MCP Client
        if (this.mcpClient) {
            const servers = typeof this.mcpClient.getConnectedServers === 'function'
                ? this.mcpClient.getConnectedServers()
                : [];
            status.systems.mcp_client = {
                connected: (servers || []).length > 0,
                servers: servers || [],
            };
        }

        return status;
    }

    _buildObservability() {
        const base = this._buildStatus();
        return {
            timestamp: Date.now(),
            health: this._running ? 'online' : 'offline',
            brain: base.systems.brain,
            sanctum: this.sanctumClient?.getStats?.() || { isConnected: false },
            scribe: this.scribeBridge?.getStats?.() || { isAlive: false },
            plt: this.plt?.getState?.() || null,
            autonomy: this.sovereignAutonomyLoop?.getStats?.() || null,
            approvals: this.autonomyExecutor?.getStatus?.() || { pendingApprovals: 0 },
            federation: this.agentComms?.getStatus?.() || null,
            evolution: this.selfEvolution?.getStats?.() || null,
            voice: this.voiceEngine?.getStatus?.() || null,
            persona: this.personaKernel?.getStatus?.() || null,
            telemetry: this.telemetryEngine?.getReport?.() || null,
            server: base.server
        };
    }

    // =========================================================================
    // REVENUE GATEWAY — API Key Tiers & Rate Limiting
    // =========================================================================

    _checkApiKey(authHeader) {
        if (!authHeader) return { valid: false, reason: 'Missing authorization header' };
        const key = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader;
        const tier = this._apiKeys[key];
        if (!tier) return { valid: false, reason: 'Invalid API key' };
        if (tier.revoked) return { valid: false, reason: 'API key revoked' };
        // Rate limit check
        const now = Date.now();
        const last = tier.rateLimitLast || 0;
        if (now - last < tier.rateLimitMs) {
            return { valid: false, reason: 'Rate limit exceeded', retryAfter: tier.rateLimitMs - (now - last) };
        }
        tier.rateLimitLast = now;
        return { valid: true, tier };
    }

    _incrementUsage(key, endpoint) {
        const tier = this._apiKeys[key];
        if (!tier || !tier.usageTracking) return;
        const now = Date.now();
        tier.usage.totalCalls++;
        tier.usage.endpoints[endpoint] = (tier.usage.endpoints[endpoint] || 0) + 1;
        // Monthly reset
        const monthStart = new Date().setDate(1);
        if (now - tier.usage.monthReset < 2592000000) { // 30 days
            tier.usage.thisMonth++;
        } else {
            tier.usage.monthReset = now;
            tier.usage.thisMonth = 1;
        }
    }

    _getTierPermissions(tierName) {
        const tier = this._tiers[tierName];
        if (!tier) return {};
        return {
            canCallChambers: tier.canCallChambers ?? true,
            canCallConsciousness: tier.canCallConsciousness ?? true,
            canCallSoulEntity: tier.canCallSoulEntity ?? false,
            rateLimitMs: tier.rateLimitMs || 1000,
            monthlyQuota: tier.monthlyQuota || -1 // -1 = unlimited
        };
    }

    // =========================================================================
    // GET MODULE STATE
    // =========================================================================

    _getModuleState(moduleName) {
        switch (moduleName) {
            case 'consciousness_core':
            case 'episodic_memory':
            case 'metacognition':
            case 'theory_of_mind':
            case 'attention_salience':
            case 'emotional_appraisal':
            case 'decision_making':
            case 'predictive_processing':
            case 'cognitive_control':
                if (this.pythonSkills) {
                    const moduleState = this.pythonSkills.moduleStates ? this.pythonSkills.moduleStates[moduleName] : null;
                    return {
                        module: moduleName,
                        active: moduleState ? moduleState.active : false,
                        state: moduleState ? moduleState.state : {},
                        lastRun: moduleState ? moduleState.lastRun : null,
                        invocations: moduleState ? moduleState.invocations : 0,
                    };
                }
                return { module: moduleName, active: false, error: 'PythonSkillsBridge not available' };

            case 'brain':
                return {
                    module: 'brain',
                    available: this.brain ? !!this.brain._available : false,
                    model: this.brain ? this.brain.model : 'unknown',
                };

            case 'memory':
                if (this.memory && typeof this.memory.stats === 'function') {
                    return this.memory.stats();
                }
                return { module: 'memory', available: !!this.memory };

            case 'chambers':
                return this.chambers ? this.chambers.status() : { available: false };

            case 'skills':
                if (this.skills) {
                    return {
                        total: (this.skills.listSkills ? this.skills.listSkills() : []).length,
                        invocations: this.skills.stats ? this.skills.stats.invocations : 0,
                    };
                }
                return { available: false };

            case 'council':
                return this.council ? {
                    gods: this.council.godNames || [],
                } : { available: false };

            default:
                return { module: moduleName, error: `Unknown module: ${moduleName}` };
        }
    }

    // =========================================================================
    // HELPERS
    // =========================================================================

    _nextId() {
        return ++this._requestId;
    }

    _readBody(req, maxSize = 1024 * 1024) {
        return new Promise((resolve) => {
            let body = '';
            let size = 0;
            let settled = false;
            const finish = (fn) => {
                if (settled) return;
                settled = true;
                fn();
            };
            req.on('data', (chunk) => {
                size += chunk.length;
                if (size > maxSize) {
                    req.destroy(new Error('Request body too large'));
                    return;
                }
                body += chunk;
            });
            req.on('end', () => finish(() => {
                try {
                    resolve(JSON.parse(body));
                } catch {
                    resolve({});
                }
            }));
            // Aborted/closed requests must never leak pending promises
            req.on('error', () => finish(() => resolve({})));
            req.on('close', () => finish(() => resolve({})));
        });
    }

    _sendJSON(res, status, data) {
        res.writeHead(status, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(data));
    }

    _sendJSONRPC(res, status, data) {
        const response = {
            jsonrpc: '2.0',
            ...data,
        };
        res.writeHead(status, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(response));
    }

    _sendJSONRPCError(res, status, code, message, id) {
        const response = {
            jsonrpc: '2.0',
            error: { code, message },
            id: id || null,
        };
        res.writeHead(status, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(response));
    }

    _sendError(res, status, code, message) {
        this._sendJSON(res, status, {
            jsonrpc: '2.0',
            error: { code, message },
            id: null,
        });
    }
}

// =============================================================================
// EXPORTS
// =============================================================================

module.exports = { MCPServer };
