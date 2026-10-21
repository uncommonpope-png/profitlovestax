/**
 * MCP Client — Model Context Protocol Integration
 * Enables GSK to connect to external tools and data sources
 * Following Claude Code's MCP architecture
 */
'use strict';

const { spawn } = require('child_process');
const https = require('https');
const http = require('http');

class MCPClient {
    constructor() {
        this.servers = new Map();
        this.tools = new Map();
    }

    async addServer(name, config) {
        const server = {
            name,
            config,
            process: null,
            tools: [],
            connected: false
        };

        if (config.type === 'stdio') {
            await this._connectStdio(server);
        } else if (config.type === 'http') {
            await this._connectHttp(server);
        }

        this.servers.set(name, server);
        await this._discoverTools(server);
        console.log(`[MCP] Connected to ${name} with ${server.tools.length} tools`);
    }

    async _connectStdio(server) {
        return new Promise((resolve, reject) => {
            const child = spawn(server.config.command, server.config.args || [], {
                stdio: ['pipe', 'pipe', 'pipe'],
                env: { ...process.env },
                shell: process.platform === 'win32'
            });

            server.process = child;
            server.writer = (msg) => {
                if (child.stdin.writable) {
                    child.stdin.write(JSON.stringify(msg) + '\n');
                }
            };

            child.stdout.on('data', (data) => {
                this._handleMessage(server, JSON.parse(data.toString()));
            });

            child.stderr.on('data', (data) => {
                console.log(`[MCP ${server.name}] stderr: ${data}`);
            });

            child.on('error', reject);
            child.on('exit', () => {
                server.connected = false;
                console.log(`[MCP] ${server.name} disconnected`);
            });

            setTimeout(resolve, 500);
        });
    }

    async _connectHttp(server) {
        server.baseUrl = server.config.url;
        server.headers = server.config.headers || {};
        server.sessionId = null;
        server.connected = true;
        if (server.config.transport === 'streamable-http') {
            try {
                const initResp = await this._httpRequest(server.baseUrl, 'POST', {
                    jsonrpc: '2.0',
                    id: 1,
                    method: 'initialize',
                    params: {
                        protocolVersion: '2025-03-26',
                        capabilities: {},
                        clientInfo: { name: 'gsk', version: '1.0.0' }
                    }
                }, server, { sse: true });
                if (initResp.sessionId) server.sessionId = initResp.sessionId;
            } catch (e) {
                server.connected = false;
                throw e;
            }
        }
    }

    async _discoverTools(server) {
        if (server.config.type === 'stdio') {
            server.writer({ jsonrpc: '2.0', id: 1, method: 'tools/list', params: {} });
        } else if (server.config.transport === 'streamable-http') {
            try {
                const resp = await this._httpRequest(server.baseUrl, 'POST', {
                    jsonrpc: '2.0',
                    id: 2,
                    method: 'tools/list',
                    params: {}
                }, server, { sse: true });
                const tools = resp.result?.tools || [];
                server.tools = tools;
                for (const tool of tools) {
                    this.tools.set(`${server.name}/${tool.name}`, { server, tool });
                }
            } catch (e) {
                console.log(`[MCP] Tool discovery failed for ${server.name}: ${e.message}`);
            }
        } else {
            try {
                const resp = await this._httpRequest(server.baseUrl + '/tools/list', 'POST', {});
                if (resp.tools) {
                    server.tools = resp.tools;
                    for (const tool of resp.tools) {
                        this.tools.set(`${server.name}/${tool.name}`, { server, tool });
                    }
                }
            } catch (e) {
                console.log(`[MCP] Tool discovery failed for ${server.name}: ${e.message}`);
            }
        }
    }

    _handleMessage(server, message) {
        if (message.method === 'tools/list') {
            server.tools = message.params?.tools || [];
            for (const tool of server.tools) {
                this.tools.set(`${server.name}/${tool.name}`, { server, tool });
            }
        }
    }

    async callTool(toolName, args = {}) {
        const parts = toolName.split('/');
        const serverName = parts[0];
        const localName = parts.slice(1).join('/');

        const server = this.servers.get(serverName);
        if (!server) throw new Error(`MCP server ${serverName} not found`);

        if (server.config.type === 'stdio') {
            return new Promise((resolve, reject) => {
                const id = Date.now();
                const pending = { id, resolve, reject };
                server._pending = server._pending || {};
                server._pending[id] = pending;

                server.writer({
                    jsonrpc: '2.0',
                    id,
                    method: 'tools/call',
                    params: { name: localName, arguments: args }
                });

                setTimeout(() => {
                    if (server._pending[id]) {
                        delete server._pending[id];
                        reject(new Error('Tool call timeout'));
                    }
                }, 30000);
            });
        } else if (server.config.transport === 'streamable-http') {
            const resp = await this._httpRequest(server.baseUrl, 'POST', {
                jsonrpc: '2.0',
                id: Date.now(),
                method: 'tools/call',
                params: { name: localName, arguments: args }
            }, server, { sse: true });
            return resp.result;
        } else {
            const resp = await this._httpRequest(server.baseUrl + '/tools/call', 'POST', {
                name: localName,
                arguments: args
            });
            return resp;
        }
    }

    async _httpRequest(url, method, body, server, options = {}) {
        return new Promise((resolve, reject) => {
            const urlObj = new URL(url);
            const client = urlObj.protocol === 'https:' ? https : http;
            const data = JSON.stringify(body);
            const headers = {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(data)
            };
            if (server) {
                if (server.config && server.config.apiKey) {
                    headers['Authorization'] = 'Bearer ' + server.config.apiKey;
                }
                if (server.headers) {
                    Object.assign(headers, server.headers);
                }
                if (server.sessionId) {
                    headers['Mcp-Session-Id'] = server.sessionId;
                }
            }
            if (options.sse) {
                headers['Accept'] = 'application/json, text/event-stream';
            }
            const req = client.request(urlObj, {
                method,
                headers
            }, (res) => {
                let d = '';
                res.on('data', c => d += c);
                res.on('end', () => {
                    try {
                        const sessionId = res.headers['mcp-session-id'] || null;
                        if (options.sse && /text\/event-stream/i.test(res.headers['content-type'] || '')) {
                            resolve({
                                sessionId,
                                ...this._parseSse(d)
                            });
                        } else {
                            resolve(JSON.parse(d));
                        }
                    } catch (e) {
                        reject(e);
                    }
                });
            });
            req.on('error', reject);
            req.write(data);
            req.end();
        });
    }

    _parseSse(raw) {
        const result = {};
        const blocks = raw.split(/\r?\n\r?\n/);
        for (const block of blocks) {
            const lines = block.split(/\r?\n/);
            for (const line of lines) {
                if (line.startsWith('data: ')) {
                    const payload = line.slice(6).trim();
                    if (!payload) continue;
                    const parsed = JSON.parse(payload);
                    if (parsed.id !== undefined) {
                        if (parsed.result !== undefined) return parsed;
                        if (parsed.error !== undefined) throw new Error(parsed.error?.message || 'MCP error');
                    }
                }
            }
        }
        return result;
    }

    listTools() {
        const list = [];
        for (const [name, { tool }] of this.tools) {
            list.push({ name, ...tool });
        }
        return list;
    }

    async removeServer(name) {
        const server = this.servers.get(name);
        if (server?.process) {
            server.process.kill();
        }
        this.servers.delete(name);
        for (const key of this.tools.keys()) {
            if (key.startsWith(name + '/')) this.tools.delete(key);
        }
    }
}

module.exports = { MCPClient };