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
        // Steal List #2 repair (2026-10-23): the original stdio path
        // never completed the MCP handshake and never routed
        // responses — JSON.parse on raw chunks, and _handleMessage
        // only matched request-shaped messages, so tools/list and
        // tools/call responses (which carry `id` + `result`, no
        // `method`) were silently dropped. Every stdio server
        // "connected" with 0 usable tools. Now: line-buffered
        // reads, initialize handshake, id-routed pending promises.
        return new Promise((resolve, reject) => {
            const child = spawn(server.config.command, server.config.args || [], {
                stdio: ['pipe', 'pipe', 'pipe'],
                env: { ...process.env, ...(server.config.env || {}) },
                shell: process.platform === 'win32'
            });

            server.process = child;
            server._pending = new Map();
            server._nextId = 1;
            server._stdoutBuf = '';
            server.writer = (msg) => {
                if (child.stdin.writable) {
                    child.stdin.write(JSON.stringify(msg) + '\n');
                }
            };
            server._request = (method, params, timeoutMs = 20000) => new Promise((res, rej) => {
                const id = server._nextId++;
                const timer = setTimeout(() => {
                    if (server._pending.has(id)) { server._pending.delete(id); rej(new Error(`MCP ${method} timed out after ${timeoutMs}ms`)); }
                }, timeoutMs);
                server._pending.set(id, { resolve: (v) => { clearTimeout(timer); res(v); }, reject: (e) => { clearTimeout(timer); rej(e); } });
                server.writer({ jsonrpc: '2.0', id, method, params: params || {} });
            });

            child.stdout.on('data', (data) => {
                server._stdoutBuf += data.toString();
                let nl;
                while ((nl = server._stdoutBuf.indexOf('\n')) >= 0) {
                    const line = server._stdoutBuf.slice(0, nl).trim();
                    server._stdoutBuf = server._stdoutBuf.slice(nl + 1);
                    if (!line) continue;
                    let msg;
                    try { msg = JSON.parse(line); } catch { continue; }
                    this._handleMessage(server, msg);
                }
            });

            child.stderr.on('data', (data) => {
                console.log(`[MCP ${server.name}] stderr: ${data}`);
            });

            child.on('error', reject);
            child.on('exit', () => {
                server.connected = false;
                for (const [, p] of server._pending) p.reject(new Error(`MCP server ${server.name} exited`));
                server._pending.clear();
                console.log(`[MCP] ${server.name} disconnected`);
            });

            // Handshake proceeds in the background; discovery and
            // tool calls await server._ready. Resolution here keeps
            // the original boot semantics (spawn = connected-enough
            // to proceed); _ready settles the truth.
            server._ready = (async () => {
                const init = await server._request('initialize', {
                    protocolVersion: '2025-03-26',
                    capabilities: {},
                    clientInfo: { name: 'gsk', version: '1.0.0' }
                }, 20000);
                server.writer({ jsonrpc: '2.0', method: 'notifications/initialized', params: {} });
                server.connected = true;
                return init;
            })();
            server._ready.catch(() => { /* surfaced via discovery/call errors */ });

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
            // Steal List #2 repair: await the handshake, then await
            // the tools/list RESPONSE (id-routed) instead of firing
            // a request into the void.
            try {
                await server._ready;
                const resp = await server._request('tools/list', {}, 20000);
                server.tools = (resp && resp.tools) || [];
                for (const tool of server.tools) {
                    this.tools.set(`${server.name}/${tool.name}`, { server, tool });
                }
            } catch (e) {
                console.log(`[MCP] Tool discovery failed for ${server.name}: ${e.message}`);
            }
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
        // Response routing (Steal List #2 repair): a JSON-RPC
        // response carries `id` + `result`/`error` and no `method`.
        if (message && message.id !== undefined && server._pending && server._pending.has(message.id)) {
            const p = server._pending.get(message.id);
            server._pending.delete(message.id);
            if (message.error) p.reject(new Error(message.error.message || `MCP error ${message.error.code || ''}`.trim()));
            else p.resolve(message.result);
            return;
        }
        if (message.method === 'tools/list') {
            server.tools = message.params?.tools || [];
            for (const tool of server.tools) {
                this.tools.set(`${server.name}/${tool.name}`, { server, tool });
            }
        }
        // Server-initiated requests/notifications are not handled
        // by this client today (unchanged behavior).
    }

    async callTool(toolName, args = {}) {
        const parts = toolName.split('/');
        const serverName = parts[0];
        const localName = parts.slice(1).join('/');

        const server = this.servers.get(serverName);
        if (!server) throw new Error(`MCP server ${serverName} not found`);

        if (server.config.type === 'stdio') {
            // Steal List #2 repair: route through the id-keyed
            // pending map (the old code stored promises in a plain
            // object that _handleMessage never resolved, so every
            // stdio tool call ran out its 30s timeout).
            await server._ready;
            return server._request('tools/call', { name: localName, arguments: args }, 120000);
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
            // Steal List #2 repair: the qualified 'server/tool' key
            // must win — spreading `tool` after `name` let the tool's
            // own bare name overwrite it, so callers could not build
            // the 'server/tool' string callTool() expects.
            list.push({ ...tool, name });
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