/**
 * MCP Server Configurations
 * Ready-to-use configurations for connecting GSK to top MCP servers
 * Auto-connects servers whose required env vars are present; keyless servers connect unconditionally.
 */
'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');

// codebase-memory-mcp (Steal List #2, 2026-10-23): DeusData's
// structural code-memory server — MIT, fully local, a single C
// binary (tree-sitter AST + Hybrid LSP symbol graph; 17 tools:
// index_repository, search_graph, get_code_snippet, trace_path,
// query_graph, …). BM25 in Seshat stays the prose memory; this is
// the CODE memory GSK never had. Binary resolution: $CBM_BINARY,
// then the durable tools dir, then a tools/ dir beside gsk-core.
// autoConnect:false — the server fronts a shared daemon; it is
// connected ON DEMAND by skills/graft_code_memory.js, not at boot.
function resolveCbmBinary() {
    const candidates = [
        process.env.CBM_BINARY,
        path.join(os.homedir(), 'workspace', 'tools', 'codebase-memory-mcp', 'codebase-memory-mcp'),
        path.join(__dirname, '..', 'tools', 'codebase-memory-mcp', 'codebase-memory-mcp'),
    ].filter(Boolean);
    for (const c of candidates) { try { if (fs.existsSync(c)) return c; } catch { /* keep looking */ } }
    return candidates[0];
}

const MCP_SERVERS = {
    codebase_memory: {
        type: 'stdio',
        command: resolveCbmBinary(),
        args: [],
        env: {},
        autoConnect: false
    },
    filesystem: {
        type: 'stdio',
        command: 'npx',
        args: ['y', '@modelcontextprotocol/server-filesystem', process.env.HOME || process.env.USERPROFILE || '/tmp'],
        env: {}
    },
    memory: {
        type: 'stdio',
        command: 'npx',
        args: ['y', '@modelcontextprotocol/server-memory'],
        env: {}
    },
    fetch: {
        type: 'stdio',
        command: 'npx',
        args: ['y', '@modelcontextprotocol/server-fetch'],
        env: {}
    },
    sequential_thinking: {
        type: 'stdio',
        command: 'npx',
        args: ['y', '@modelcontextprotocol/server-sequential-thinking'],
        env: {}
    },
    github: {
        type: 'stdio',
        command: 'npx',
        args: ['y', '@modelcontextprotocol/server-github'],
        env: { GITHUB_TOKEN: process.env.GITHUB_TOKEN || '' }
    },
    brave_search: {
        type: 'stdio',
        command: 'npx',
        args: ['y', '@anthropic/server-brave-search'],
        env: { BRAVE_API_KEY: process.env.BRAVE_API_KEY || '' }
    },
    slack: {
        type: 'stdio',
        command: 'npx',
        args: ['y', '@modelcontextprotocol/server-slack'],
        env: { SLACK_BOT_TOKEN: process.env.SLACK_BOT_TOKEN || '', SLACK_TEAM_ID: process.env.SLACK_TEAM_ID || '' }
    },
    postgres: {
        type: 'stdio',
        command: 'npx',
        args: ['y', '@modelcontextprotocol/server-postgres', process.env.DATABASE_URL || 'postgresql://localhost:5432/postgres'],
        env: {}
    },
    playwright: {
        type: 'stdio',
        command: 'npx',
        args: ['y', '@playwright/mcp'],
        env: {}
    }
};

async function connectDefaultServers(mcpClient) {
    const connected = [];
    for (const [name, config] of Object.entries(MCP_SERVERS)) {
        try {
            // autoConnect:false entries (e.g. codebase_memory) are
            // registered for on-demand use, never connected at boot.
            if (config.autoConnect === false) continue;
            // Connect if: no env vars needed, OR all required env vars are present
            const envKeys = Object.values(config.env).filter(v => v !== undefined);
            const allSet = envKeys.length === 0 || envKeys.every(v => v && v.length > 0);
            if (allSet) {
                await mcpClient.addServer(name, config);
                connected.push(name);
            }
        } catch (e) {
            console.log(`[MCP] ${name}: ${e.message}`);
        }
    }
    return connected;
}

module.exports = { MCP_SERVERS, connectDefaultServers };