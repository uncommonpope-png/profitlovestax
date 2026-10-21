const path = require('path');
const fs = require('fs');
const { MCPClient } = require('../brain/mcp_client.js');

class MCPManager {
    constructor(options = {}) {
        this.client = new MCPClient();
        this.kernelSkills = null;
        this.chambers = null;
        this.memory = null;
        this.configPath = options.configPath || path.join(__dirname, '..', '..', 'mcp_config.json');
        this.servers = {};
        this.connections = {};
        this.totalTools = 0;
        this.cycleCount = 0;
        this.stats = {
            connectionsAttempted: 0,
            connectionsSuccessful: 0,
            connectionsFailed: 0,
            toolsDiscovered: 0,
            toolsRegisteredAsSkills: 0,
            lastHealthCheck: null,
            lastToolCall: null,
            toolCalls: 0,
            toolErrors: 0
        };
    }

    linkKernel(kernelSkills, chambers, memory) {
        this.kernelSkills = kernelSkills;
        this.chambers = chambers;
        this.memory = memory;
    }

    loadConfig() {
        if (fs.existsSync(this.configPath)) {
            const raw = fs.readFileSync(this.configPath, 'utf8');
            const config = JSON.parse(raw);
            this.servers = config.servers || {};
            const count = Object.keys(this.servers).length;
            console.log(`[MCP_MANAGER] Loaded ${count} integration definitions from config`);
            return count;
        }
        console.warn('[MCP_MANAGER] No mcp_config.json found at', this.configPath);
        return 0;
    }

    async connect(serverName) {
        const config = this.servers[serverName];
        if (!config) throw new Error(`Unknown MCP server: ${serverName}`);
        
        this.stats.connectionsAttempted++;
        try {
            const mcpConfig = {
                type: config.type || 'stdio',
                command: config.command,
                args: config.args || [],
                url: config.url,
                env: config.env || {}
            };
            
            await this.client.addServer(serverName, mcpConfig);
            
            this.connections[serverName] = {
                connected: true,
                tools: this.client.listTools().filter(t => t.name.startsWith(serverName + '/')),
                lastConnected: Date.now(),
                health: 'ok'
            };
            
            this.stats.connectionsSuccessful++;
            this._updateToolCount();
            
            await this._registerToolsAsSkills(serverName);
            
            if (this.memory) {
                await this.memory.witness({
                    type: 'mcp_connection',
                    weight: 0.6,
                    tags: ['mcp', 'connection', serverName],
                    content: `Connected to MCP server: ${serverName} (${(this.connections[serverName]?.tools?.length || 0)} tools)`
                }).catch(() => {});
            }
            
            return { server: serverName, tools: this.connections[serverName]?.tools?.length || 0 };
        } catch (e) {
            this.stats.connectionsFailed++;
            this.connections[serverName] = { connected: false, error: e.message, lastAttempt: Date.now(), tools: [] };
            console.warn(`[MCP_MANAGER] Failed to connect ${serverName}: ${e.message}`);
            throw e;
        }
    }

    async connectAll(serverNames) {
        const results = { connected: [], failed: [] };
        for (const name of serverNames) {
            try {
                const r = await this.connect(name);
                results.connected.push(r);
            } catch (e) {
                results.failed.push({ server: name, error: e.message });
            }
        }
        return results;
    }

    async autoConnect() {
        const toConnect = [];
        for (const [name, config] of Object.entries(this.servers)) {
            if (config.autoConnect) {
                toConnect.push(name);
                continue;
            }
            const required = config.requiresEnv || [];
            const allSet = required.every(envVar => process.env[envVar]);
            if (allSet) {
                toConnect.push(name);
            }
        }
        if (toConnect.length === 0) {
            console.log('[MCP_MANAGER] No servers with auto-connect or configured env vars');
            return { connected: [], failed: [] };
        }
        console.log(`[MCP_MANAGER] Auto-connecting to ${toConnect.length} servers...`);
        return this.connectAll(toConnect);
    }

    async _registerToolsAsSkills(serverName) {
        if (!this.kernelSkills) return;
        
        const tools = this.client.listTools().filter(t => t.name.startsWith(serverName + '/'));
        let registered = 0;
        
        for (const tool of tools) {
            const skillName = `mcp_${tool.name.replace(/[^a-zA-Z0-9]/g, '_')}`;
            const description = tool.description || `MCP tool: ${tool.name}`;
            const affinity = this._getPLTAffinity(serverName, tool);
            
            try {
                this.kernelSkills.registerExternalSkill(skillName, {
                    name: skillName,
                    description: `[MCP] ${description}`,
                    pl_affinity: affinity,
                    handler: async (input) => {
                        this.stats.toolCalls++;
                        try {
                            const args = this._mapInputToArgs(tool, input);
                            const result = await this.client.callTool(tool.name, args);
                            this.stats.lastToolCall = Date.now();
                            return result;
                        } catch (e) {
                            this.stats.toolErrors++;
                            throw e;
                        }
                    }
                });
                registered++;
            } catch (e) {
            }
        }
        
        this.stats.toolsRegisteredAsSkills += registered;
        if (registered > 0) {
            console.log(`[MCP_MANAGER] Registered ${registered} MCP tools as skills from ${serverName}`);
        }
    }

    _mapInputToArgs(tool, input) {
        const args = {};
        if (tool.inputSchema && tool.inputSchema.properties) {
            for (const [key, schema] of Object.entries(tool.inputSchema.properties)) {
                if (typeof input === 'object' && input[key] !== undefined) {
                    args[key] = input[key];
                } else if (schema.default !== undefined) {
                    args[key] = schema.default;
                }
            }
        } else if (typeof input === 'string') {
            args.input = input;
        } else if (typeof input === 'object') {
            Object.assign(args, input);
        }
        return args;
    }

    _getPLTAffinity(serverName, tool) {
        const toolName = (tool.name || '').toLowerCase();
        const server = serverName.toLowerCase();
        
        if (/github|gitlab|code|build|compile|analyse|optimize|cloud|aws|vercel|deploy/.test(server + toolName)) {
            return { profit: 0.7, love: 0.15, tax: 0.15 };
        }
        if (/slack|discord|email|notify|message|communication|social|calendar/.test(server + toolName)) {
            return { profit: 0.2, love: 0.7, tax: 0.1 };
        }
        if (/filesystem|memory|database|sql|storage|search/.test(server + toolName)) {
            return { profit: 0.5, love: 0.3, tax: 0.2 };
        }
        return { profit: 0.4, love: 0.35, tax: 0.25 };
    }

    async healthCheck() {
        const results = {};
        for (const [name, conn] of Object.entries(this.connections)) {
            if (conn.connected) {
                try {
                    const tools = this.client.listTools().filter(t => t.name.startsWith(name + '/'));
                    results[name] = { connected: true, toolCount: tools.length };
                    conn.health = 'ok';
                    conn.lastCheck = Date.now();
                } catch (e) {
                    results[name] = { connected: false, error: e.message };
                    conn.health = 'error';
                }
            } else {
                results[name] = { connected: false, error: conn.error || 'not connected' };
            }
        }
        this.stats.lastHealthCheck = Date.now();
        return results;
    }

    async disconnect(serverName) {
        await this.client.removeServer(serverName);
        delete this.connections[serverName];
        this._updateToolCount();
        if (this.memory) {
            await this.memory.witness({
                type: 'mcp_disconnection',
                weight: 0.4,
                tags: ['mcp', 'disconnect', serverName],
                content: `Disconnected from MCP server: ${serverName}`
            }).catch(() => {});
        }
    }

    async disconnectAll() {
        const names = Object.keys(this.connections);
        for (const name of names) {
            await this.disconnect(name).catch(() => {});
        }
    }

    async callTool(fullToolName, args = {}) {
        this.stats.toolCalls++;
        try {
            const result = await this.client.callTool(fullToolName, args);
            this.stats.lastToolCall = Date.now();
            return result;
        } catch (e) {
            this.stats.toolErrors++;
            throw e;
        }
    }

    async nextCycle() {
        this.cycleCount++;
        if (this.cycleCount % 50 === 0) {
            await this.healthCheck();
        }
        if (this.cycleCount % 200 === 0) {
            for (const [name, conn] of Object.entries(this.connections)) {
                if (!conn.connected && (Date.now() - (conn.lastAttempt || 0)) > 120000) {
                    console.log(`[MCP_MANAGER] Attempting reconnect to ${name}...`);
                    this.connect(name).catch(() => {});
                }
            }
        }
    }

    listAllTools() {
        return this.client.listTools();
    }

    getStatus() {
        const connected = Object.values(this.connections).filter(c => c.connected).length;
        const total = Object.keys(this.servers).length;
        return {
            configs: total,
            connected,
            totalTools: this.totalTools,
            servers: Object.fromEntries(
                Object.entries(this.connections).map(([k, v]) => [k, {
                    connected: v.connected,
                    tools: v.tools?.length || 0,
                    health: v.health || 'unknown',
                    error: v.error || null
                }])
            ),
            stats: { ...this.stats }
        };
    }

    _updateToolCount() {
        this.totalTools = this.client.listTools().length;
    }
}

module.exports = { MCPManager };
