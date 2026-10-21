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

class MCPServer {
    constructor(kernelSystems = {}, options = {}) {
        this.port = options.port || 3001;
        this.apiKey = options.apiKey || process.env.MCP_API_KEY || 'gsk-mcp-key-dev';
        this.host = options.host || '0.0.0.0';
        this.server = null;
        this._running = false;
        this._requestId = 0;
        this._startTime = Date.now();

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

        // CORS headers
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-API-Key');
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
        if (pathname === '/mcp/health') {
            this._sendJSON(res, 200, {
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

                case '/mcp/chat':
                    this._handleChat(req, res);
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
        const { method, params, id } = body;

        if (!method || !params) {
            this._sendJSONRPCError(res, 400, -32600, 'Invalid Request: method and params required', id);
            return;
        }

        try {
            const result = await this._executeMethod(method, params);
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
            if (this.brain && typeof this.brain.think === 'function') {
                const soulCtx = context || (this.chambers ? this.chambers.getSoulContext() : '');
                response = await this.brain.think(message, soulCtx);

                if (this.memory && typeof this.memory.witness === 'function') {
                    await this.memory.witness({
                        type: 'mcp_chat',
                        weight: 0.6,
                        tags: ['mcp', 'chat', 'external'],
                        content: `MCP chat: ${message.slice(0, 200)} → ${response.slice(0, 200)}`,
                    });
                }
            } else {
                response = `[soul] Brain not available. You said: ${message.slice(0, 200)}`;
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

        // Skill tools
        if (this.skills) {
            const skillList = this.skills.listSkills ? this.skills.listSkills() : [];
            for (const skill of skillList) {
                tools.push({
                    name: `skill.${skill.name}`,
                    description: skill.description || `Invoke skill: ${skill.name}`,
                    inputSchema: {
                        type: 'object',
                        properties: {
                            input: { type: ['string', 'object'], description: 'Input for the skill' },
                        },
                        required: ['input'],
                    },
                    category: 'skills',
                    plt_affinity: skill.plt_affinity || null,
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

        // System tools
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

    async _executeMethod(method, params) {
        const parts = method.split('.');
        const namespace = parts[0];
        const action = parts.slice(1).join('.');

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

            default:
                throw new Error(`Unknown tool namespace: ${namespace}. Available: consciousness, brain, memory, chambers, skill, council, sub_agents, living_memory, knowledge_graph, soul_entity, system`);
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
            const response = await this.brain.thinkSmart(params.prompt, soulCtx);
            return { response, model: this.brain.model || 'unknown' };
        }

        throw new Error(`Unknown brain action: ${action}`);
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
                return { agents: this.subAgents.listAgents() };

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

            default:
                throw new Error(`Unknown system action: ${action}`);
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

        // Brain status
        if (this.brain) {
            status.systems.brain = {
                available: this.brain._groq_available || this.brain._gemini_available || this.brain._local_available,
                groq: this.brain._groq_available || false,
                gemini: this.brain._gemini_available || false,
                local: this.brain._local_available || false,
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
                    groq: this.brain ? this.brain._groq_available : false,
                    gemini: this.brain ? this.brain._gemini_available : false,
                    local: this.brain ? this.brain._local_available : false,
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

    _readBody(req) {
        return new Promise((resolve) => {
            let body = '';
            req.on('data', (chunk) => { body += chunk; });
            req.on('end', () => {
                try {
                    resolve(JSON.parse(body));
                } catch {
                    resolve({});
                }
            });
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
