'use strict';
/**
 * GRAFT — CODE MEMORY (Steal List #2, 2026-10-23)
 *
 * Structural code memory for the body: DeusData/codebase-memory-mcp
 * (MIT, fully local, single C binary — tree-sitter AST + Hybrid LSP
 * symbol graph) registered in brain/mcp_servers.js as
 * `codebase_memory` and reached through the body's own MCPClient
 * (brain/mcp_client.js — its stdio path was repaired for this:
 * handshake + id-routed responses; before the repair every stdio
 * server "connected" with zero usable tools).
 *
 * Why this organ: Seshat's BM25 recall is prose memory — it finds
 * text that mentions a thing. Code questions ("who calls runHarness",
 * "what does this file define") need a symbol graph. BM25 stays for
 * prose; the graph answers code structure. No second memory system
 * was built — an existing local organ was wired in.
 *
 * The server fronts a shared daemon, so it is connected ON DEMAND
 * per call (autoConnect:false in mcp_servers.js) and disconnected
 * after. Indexing persists in the server's own cache
 * (~/.cache/codebase-memory-mcp) between calls.
 *
 * Actions:
 *   status  → binary present? version?
 *   tools   → the server's discovered tool list (proof of wiring)
 *   index   → { repoPath, name? } index a repo into the graph
 *   search  → { project, namePattern?, label?, semanticQuery? }
 *   snippet → { project?, qualifiedName } source for one symbol
 *   schema  → { project } graph shape (node/edge counts)
 */

const { execFile } = require('child_process');
const path = require('path');
const { MCPClient } = require('../brain/mcp_client.js');
const { MCP_SERVERS } = require('../brain/mcp_servers.js');

const PLT_AFFINITY = { profit: 0.7, love: 0.3, tax: 0.2 };

function sanitizeProject(name) {
    return String(name || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'project';
}

function resultText(result) {
    try {
        if (result && Array.isArray(result.content)) {
            const texts = result.content.filter(c => c && c.type === 'text').map(c => c.text);
            if (texts.length) return texts.join('\n');
        }
        return JSON.stringify(result);
    } catch { return String(result); }
}

function parseMaybeJson(text) {
    try { return JSON.parse(text); } catch { return null; }
}

async function withClient(fn) {
    const client = new MCPClient();
    try {
        await client.addServer('codebase_memory', MCP_SERVERS.codebase_memory);
        return await fn(client);
    } finally {
        try { await client.removeServer('codebase_memory'); } catch { /* already gone */ }
    }
}

async function skill_graft_code_memory(input = {}, brain, memory) {
    const action = input.action || 'status';
    const bin = MCP_SERVERS.codebase_memory.command;

    if (action === 'status') {
        return await new Promise((resolve) => {
            execFile(bin, ['--version'], { timeout: 15000 }, (err, stdout, stderr) => {
                const out = String(stdout || stderr || '').split('\n').find(l => l.trim().length > 0) || '';
                resolve(err
                    ? { success: false, skill: 'graft_code_memory', action, binary: bin, error: `binary_not_runnable: ${String(err.message).slice(0, 160)}` }
                    : { success: true, skill: 'graft_code_memory', action, binary: bin, version: out.trim() });
            });
        });
    }

    try {
        return await withClient(async (client) => {
            if (action === 'tools') {
                const tools = client.listTools().filter(t => t.name.startsWith('codebase_memory/'));
                return { success: true, skill: 'graft_code_memory', action, count: tools.length, tools: tools.map(t => t.name) };
            }
            if (action === 'index') {
                const repoPath = path.resolve(String(input.repoPath || ''));
                const name = sanitizeProject(input.name || path.basename(repoPath));
                const r = await client.callTool('codebase_memory/index_repository', { repo_path: repoPath, name });
                const text = resultText(r);
                return { success: true, skill: 'graft_code_memory', action, project: name, repoPath, result: parseMaybeJson(text) || text.slice(0, 800) };
            }
            if (action === 'search') {
                const project = sanitizeProject(input.project);
                const args = { project };
                if (input.namePattern) args.name_pattern = String(input.namePattern);
                if (input.label) args.label = String(input.label);
                if (input.semanticQuery) args.semantic_query = String(input.semanticQuery);
                if (input.limit) args.limit = Number(input.limit);
                const r = await client.callTool('codebase_memory/search_graph', args);
                const text = resultText(r);
                return { success: true, skill: 'graft_code_memory', action, project, result: parseMaybeJson(text) || text.slice(0, 2000) };
            }
            if (action === 'snippet') {
                const args = { qualified_name: String(input.qualifiedName || '') };
                if (input.project) args.project = sanitizeProject(input.project);
                const r = await client.callTool('codebase_memory/get_code_snippet', args);
                const text = resultText(r);
                return { success: true, skill: 'graft_code_memory', action, result: parseMaybeJson(text) || text.slice(0, 4000) };
            }
            if (action === 'schema') {
                const r = await client.callTool('codebase_memory/get_graph_schema', { project: sanitizeProject(input.project) });
                const text = resultText(r);
                return { success: true, skill: 'graft_code_memory', action, result: parseMaybeJson(text) || text.slice(0, 2000) };
            }
            return { success: false, skill: 'graft_code_memory', error: `Unknown action: ${action}`, available: ['status', 'tools', 'index', 'search', 'snippet', 'schema'] };
        });
    } catch (e) {
        return { success: false, skill: 'graft_code_memory', action, error: 'code_memory_call_failed', detail: String(e && e.message || e).slice(0, 300) };
    }
}

module.exports = {
    skill_graft_code_memory,
    run: skill_graft_code_memory,
    PLT_AFFINITY,
    MANIFEST: {
        name: 'graft_code_memory',
        description: 'Structural code memory (Steal List #2): codebase-memory-mcp (MIT, local) via brain/mcp_servers.js + the body\'s MCPClient. Indexes a repo into a symbol graph and answers structural queries (search_graph, get_code_snippet, get_graph_schema) that BM25 prose recall cannot. Connected on demand; the server\'s daemon-backed index persists between calls.',
        version: '1.0.0',
        inputs: { action: "'status' | 'tools' | 'index' | 'search' | 'snippet' | 'schema'", repoPath: 'for index', project: 'project name (from index)', namePattern: 'regex for search', label: 'node label filter (Function, Class, …)', qualifiedName: 'for snippet' },
        output: '{ success, action, result } — the graph server\'s own answer, JSON when it sends JSON',
    },
};
