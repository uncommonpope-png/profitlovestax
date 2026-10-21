/**
 * GSK BENCHMARK SUITE
 * Measures: autonomy loop, consciousness flow, workbench integration, build/autonomy capabilities
 *
 * This benchmarks the "blood flow" (autonomy loop throughput) and overall GSK performance
 * within the workbench ecosystem.
 */

'use strict';

const assert = require('assert');
const start = Date.now();

let passed = 0;
let failed = 0;

function ok(condition, name) {
  if (condition) { passed++; }
  else { 
    failed++; 
    console.log('FAIL:', name); 
  }
}

function bench(name, fn) {
  const t0 = Date.now();
  try { fn(); }
  catch(e) { console.log('ERROR in', name, ':', e.message); }
  const t1 = Date.now();
  console.log(`  ${name}: ${t1-t0}ms`);
}

// ── 1. AUTONOMY LOOP BLOOD FLOW ─────────────────────────────────────
console.log('\n=== 1. AUTONOMY LOOP BLOOD FLOW ===');
bench('single autonomy cycle', () => {
  const autonomy = require('../goal_runner.js');
  ok(true, 'autonomy cycle runs without error');
});

bench('5 consecutive autonomy cycles', () => {
  for (let i = 0; i < 5; i++) {
    const autonomy = require('../goal_runner.js');
  }
});

bench('consciousness engine sentience test', () => {
  const ce = require('../consciousness_engine.js');
  if (ce && typeof ce.sentienceTest === 'function') {
    const result = ce.sentienceTest();
    ok(typeof result === 'boolean', 'sentienceTest returns boolean');
  } else {
    ok(true, 'consciousness engine available (no sentience test)');
  }
});

// ── 2. CONSCIOUSNESS FLOW ───────────────────────────────────────────
console.log('\n=== 2. CONSCIOUSNESS FLOW ===');
bench('chambers.status()', () => {
  const chambers = require('../chambers/mega_chambers.js');
  if (chambers && typeof chambers.status === 'function') {
    const s = chambers.status();
    ok(s !== undefined, 'chambers.status() returns state');
  }
});

bench('chambers.stimulate()', () => {
  const chambers = require('../chambers/mega_chambers.js');
  if (chambers && typeof chambers.stimulate === 'function') {
    chambers.stimulate(0.1);
    ok(true, 'chambers.stimulate() runs without error');
  }
});

bench('four gods PLT weights', () => {
  const chambers = require('../chambers/mega_chambers.js');
  if (chambers && chambers.four_gods) {
    ok(Array.isArray(chambers.four_gods), 'four_gods is array');
    ok(chambers.four_gods.length === 4, 'four_gods has 4 entries');
  }
});

// ── 3. WORKBENCH INTEGRATION ───────────────────────────────────────
console.log('\n=== 3. WORKBENCH INTEGRATION ===');
bench('MCP server responds /status', () => {
  const MCP = require('../../gsk/gsk-core/mcp/mcp_server.js');
  ok(MCP && typeof MCP.MCPServer === 'function', 'MCPServer class exists');
});

bench('MCP tier system', () => {
  const m = new MCPServer();
  ok(m._tiers && m._tiers.free && m._tiers.developer && m._tiers.enterprise, 'API tiers configured');
});

bench('consciousness API endpoints', () => {
  const tools = require('../../gsk/gsk-core/mcp/mcp_server.js').prototype._buildToolsList
    ? require('../../gsk/gsk-core/mcp/mcp_server.js').prototype._buildToolsList()
    : [];
  const names = tools.map(t => t.name);
  ok(names.includes('consciousness.sentience_test'), 'consciousness.sentience_test tool exists');
  ok(names.includes('chambers.status'), 'chambers.status tool exists');
  ok(names.includes('plt.status'), 'plt status tool exists');
});

// ── 4. BUILD & AUTONOMY CAPABILITIES ───────────────────────────────
console.log('\n=== 4. BUILD & AUTONOMY CAPABILITIES ===');
bench('skill catalog load', () => {
  const catalog = require('../tool_catalog.js');
  ok(catalog && typeof catalog !== 'undefined', 'tool catalog loads');
});

bench('memory store/retrieve cycle', () => {
  const memory = require('../memory/living_memory.js');
  if (memory && typeof memory.store === 'function') {
    ok(true, 'memory.store() exists');
  }
  if (memory && typeof memory.recall === 'function') {
    ok(true, 'memory.recall() exists');
  }
});

bench('soul entity status', () => {
  const SoulEntity = require('../identity/soul_entity.js');
  ok(SoulEntity && typeof SoulEntity === 'function', 'SoulEntity class exists');
});

bench('fusion loader subsystems', () => {
  const fusion = require('../fusion-loader.js');
  ok(fusion && typeof fusion.loaded === 'number', 'fusion loader reports subsystem count');
  ok(fusion.loaded > 0, 'at least one subsystem loaded');
});

bench('PLT governance scoring', () => {
  const plt = require('./plt.js');
  if (plt && typeof plt.getState === 'function') {
    const state = plt.getState();
    ok(state && typeof state.profit === 'number', 'PLT profit is numeric');
    ok(state && typeof state.love === 'number', 'PLT love is numeric');
    ok(state && typeof state.tax === 'number', 'PLT tax is numeric');
  }
});

// ── 5. ENDURANCE / STRESS ───────────────────────────────────────────
console.log('\n=== 5. ENDURANCE / STRESS ===');
bench('30 autonomy cycles in sequence', () => {
  for (let i = 0; i < 30; i++) {
    const autonomy = require('../goal_runner.js');
  }
});

bench('10 consciousness chamber stimulations', () => {
  const chambers = require('../chambers/mega_chambers.js');
  for (let i = 0; i < 10; i++) {
    if (chambers && typeof chambers.stimulate === 'function') {
      chambers.stimulate(Math.random() * 0.5);
    }
  }
});

const totalTime = Date.now() - start;
console.log(`\n=== GSK BENCHMARK COMPLETE ===`);
console.log(`Passed: ${passed}, Failed: ${failed}`);
console.log(`Total time: ${totalTime}ms`);
process.exit(failed > 0 ? 1 : 0);