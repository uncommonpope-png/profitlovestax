'use strict';

const path = require('path');
const { ToolCatalog } = require('../cognition/tool_catalog.js');

let passed = 0;
let failed = 0;
function assert(cond, name) {
    if (cond) { passed++; console.log('  ✅ ' + name); }
    else { failed++; console.log('  ❌ ' + name); }
}

// Mock kernel
const mockKernel = {
    toolBridge: {
        toolRegistry: new Map(),
        mcpServers: new Map(),
    },
    skills: {
        listSkills: () => [
            { name: 'reason_deep', description: 'Multi-step reasoning with trace', plt_affinity: { profit: 0.4, love: 0.3, tax: 0.3 }, weight: 0.9 },
            { name: 'score_idea', description: 'PLT scoring of ideas', plt_affinity: { profit: 0.6, love: 0.2, tax: 0.2 }, weight: 0.85 },
            { name: 'write_production_code', description: 'Code generation with error handling', plt_affinity: { profit: 0.7, love: 0.1, tax: 0.2 }, weight: 0.9 },
        ],
    },
    chambers: {
        skillRegistry: {
            listAllMetadata: () => ({
                chamber_test: { description: 'A test chamber skill', category: 'general', registered_at: Date.now() },
            }),
        },
    },
};

// Add mock built-in tools
mockKernel.toolBridge.toolRegistry.set('read_file', async () => {});
mockKernel.toolBridge.toolRegistry.set('write_file', async () => {});
mockKernel.toolBridge.toolRegistry.set('web_fetch', async () => {});
mockKernel.toolBridge.toolRegistry.set('social_post', async () => {});
mockKernel.toolBridge.toolRegistry.set('catalog_list', async () => {});
mockKernel.toolBridge.toolRegistry.set('catalog_describe', async () => {});
mockKernel.toolBridge.toolRegistry.set('catalog_find', async () => {});
mockKernel.toolBridge.mcpServers.set('github', { url: 'http://localhost:9090', capabilities: ['search_code', 'list_files'] });

console.log('\n--- ToolCatalog Tests ---');

const catalog = new ToolCatalog(mockKernel);
catalog.initialize();

// Test 1: listAll returns entries
const all = catalog.listAll();
assert(all.length >= 9, 'TC: listAll returns at least 9 entries (' + all.length + ')');

// Test 2: getStats has correct structure
const stats = catalog.getStats();
assert(stats.total >= 9, 'TC: getStats total >= 9');
assert(typeof stats.byBackend === 'object', 'TC: getStats has byBackend');
assert(typeof stats.byCategory === 'object', 'TC: getStats has byCategory');

// Test 3: describe finds built-in tool
const readFile = catalog.describe('read_file');
assert(readFile !== null, 'TC: describe finds read_file');
assert(readFile.description.includes('Read'), 'TC: read_file description includes Read');

// Test 4: describe finds skill
const reason = catalog.describe('reason_deep');
assert(reason !== null, 'TC: describe finds reason_deep');
assert(reason.backend === 'skill', 'TC: reason_deep backend is skill');

// Test 5: describe unknown returns null
const unknown = catalog.describe('nonexistent_tool_xyz');
assert(unknown === null, 'TC: describe unknown returns null');

// Test 6: findForTask finds relevant tools
const searchResults = catalog.findForTask('read a file');
assert(searchResults.length > 0, 'TC: findForTask finds read_file');
assert(searchResults.some(e => e.name === 'read_file'), 'TC: findForTask has read_file in results');

// Test 7: findByBackend
const builtins = catalog.findByBackend('builtin');
assert(builtins.length >= 5, 'TC: findByBackend builtin >= 5');

const skills = catalog.findByBackend('skill');
assert(skills.length >= 3, 'TC: findByBackend skill >= 3');

// Test 8: findByCategory
const social = catalog.findByCategory('social');
assert(social.length >= 1, 'TC: findByCategory social >= 1');

// Test 9: compileForPrompt returns string
const prompt = catalog.compileForPrompt(500);
assert(typeof prompt === 'string' && prompt.length > 50, 'TC: compileForPrompt returns meaningful text');

// Test 10: MCP servers included
const mcp = catalog.findByBackend('mcp');
assert(mcp.some(e => e.name.includes('github')), 'TC: MCP github server found');

// Test 11: Chamber skills included
const chamber = catalog.findByBackend('chamber');
assert(chamber.some(e => e.name === 'chamber_test'), 'TC: chamber skill found');

// Test 12: catalog_list, catalog_describe, catalog_find in results
const catList = catalog.describe('catalog_list');
assert(catList !== null, 'TC: catalog_list tool registered');
assert(catList.description.includes('List all'), 'TC: catalog_list has description');

console.log('\n═══════════════════════════════');
console.log('  RESULTS: ' + passed + ' passed, ' + failed + ' failed');
console.log('═══════════════════════════════\n');
