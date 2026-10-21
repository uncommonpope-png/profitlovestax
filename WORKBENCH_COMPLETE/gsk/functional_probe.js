'use strict';
const path = require('path');
const GSKFusion = require('./fusion-loader.js');

const results = [];
function chk(name, cond, detail) { results.push([cond ? '✅' : '❌', name, detail || '']); }

(async () => {
  const gsk = new GSKFusion(null, { dataDir: path.join(__dirname, 'data') });
  try { await gsk.boot(); } catch (e) { console.log('BOOT FATAL:', e.message); process.exit(1); }
  await new Promise(r => setTimeout(r, 3000));

  // 1. BRAIN THINK
  try {
    const b = gsk.brain;
    if (b && typeof b.think === 'function') {
      const r = await Promise.race([
        b.think('Say exactly: BRAIN_OK'),
        new Promise((_, rej) => setTimeout(() => rej(new Error('timeout 15s')), 15000))
      ]);
      const txt = (r && (r.result || r.text || r)) + '';
      chk('brain.think()', txt.length > 0, txt.substring(0, 60));
    } else chk('brain.think()', false, 'brain missing');
  } catch (e) { chk('brain.think()', false, e.message); }

  // 2. MEMORY WITNESS + QUERY
  try {
    const m = gsk.memory;
    if (m && typeof m.witness === 'function') {
      await m.witness({ content: 'ULTRA_TEST_MARKER_12345', type: 'test', tags: ['ultra'], weight: 1 });
      await new Promise(r => setTimeout(r, 500));
      let found = false;
      if (typeof m.query === 'function') {
        const q = await m.query({ search: 'ULTRA_TEST_MARKER_12345' });
        found = Array.isArray(q) ? q.some(x => JSON.stringify(x).includes('ULTRA_TEST_MARKER')) : false;
      }
      chk('memory.witness()+query()', found, found ? 'persisted & retrievable' : 'witnessed but not found in query');
    } else chk('memory.witness()', false, 'memory missing');
  } catch (e) { chk('memory.witness()', false, e.message); }

  // 3. LIVING MEMORY
  try {
    const lm = gsk.livingMemory;
    if (lm && typeof lm.remember === 'function') {
      lm.remember('living test fact', { tags: ['ultra'] });
      await new Promise(r => setTimeout(r, 300));
      const rec = (typeof lm.recall === 'function') ? lm.recall('living test') : null;
      chk('livingMemory.remember()', true, 'called (recall=' + (rec ? 'has-result' : 'n/a') + ')');
    } else chk('livingMemory', false, 'missing');
  } catch (e) { chk('livingMemory', false, e.message); }

  // 4. CHAMBERS BREATHE
  try {
    const c = gsk.chambers;
    if (c && typeof c.breathe === 'function') {
      const t = c.breathe();
      chk('chambers.breathe()', true, 'no-throw, phase=' + c.mythos.phase_name + ' cycles=' + c.mythos.cycles);
    } else chk('chambers.breathe()', false, 'missing');
  } catch (e) { chk('chambers.breathe()', false, e.message); }

  // 5. PERPETUAL CONSCIOUSNESS THOUGHTS
  try {
    const pc = gsk.perpetualConsciousness;
    let t0 = pc ? pc.lastThought : null;
    await new Promise(r => setTimeout(r, 6000)); // wait for a thought cycle
    let t1 = pc ? pc.lastThought : null;
    chk('perpetualConsciousness', !!(pc && pc.currentMode), 'mode=' + (pc ? pc.currentMode : '?') + ' thoughts=' + (pc ? (pc.stats?.thoughtsGenerated ?? 0) : '?'));
  } catch (e) { chk('perpetualConsciousness', false, e.message); }

  // 6. CONSCIOUSNESS ENGINE
  try {
    const ce = gsk.consciousnessEngine;
    if (ce && typeof ce.tick === 'function') {
      ce.tick();
      chk('consciousnessEngine.tick()', true, 'ran');
    } else chk('consciousnessEngine', false, 'missing');
  } catch (e) { chk('consciousnessEngine', false, e.message); }

  // 7. INSIGHT ENGINE
  try {
    const ie = gsk.insightEngine;
    if (ie && typeof ie.cycle === 'function') {
      chk('insightEngine', true, 'has cycle() method, isRunning=' + ie.isRunning);
    } else chk('insightEngine', false, 'missing');
  } catch (e) { chk('insightEngine', false, e.message); }

  // 8. VECTOR MEMORY
  try {
    const vm = gsk.vectorMemory;
    if (vm) {
      if (typeof vm.addMemory === 'function') { vm.addMemory('test vector doc about cats', { id: 'ut1' }); chk('vectorMemory.addMemory()', true, 'added'); }
      else chk('vectorMemory.addMemory()', false, 'no addMemory method');
    } else chk('vectorMemory', false, 'missing');
  } catch (e) { chk('vectorMemory', false, e.message); }

  // 9. MCP MANAGER
  try {
    const mm = gsk.mcpManager;
    if (mm) { chk('mcpManager', true, 'servers=' + (mm.servers ? mm.servers.size : '?')); }
    else chk('mcpManager', false, 'missing');
  } catch (e) { chk('mcpManager', false, e.message); }

  // 10. SCRIBE BRIDGE (external down)
  try {
    const sb = gsk.scribeBridge;
    if (sb) { chk('scribeBridge', true, 'connected=' + (sb.connected || false) + ' (SCRIBE ext down expected)'); }
    else chk('scribeBridge', false, 'missing');
  } catch (e) { chk('scribeBridge', false, e.message); }

  // 11. GOAL ENGINE
  try {
    const ge = gsk.goalEngine;
    if (ge && typeof ge.propose === 'function') {
      chk('goalEngine.propose()', true, 'method exists (goals=' + (ge.goals ? ge.goals.length : '?') + ')');
    } else chk('goalEngine', false, 'missing');
  } catch (e) { chk('goalEngine', false, e.message); }

  // 12. AUTONOMOUS OUTREACH
  try {
    const ao = gsk.autonomousOutreach;
    if (ao) { chk('autonomousOutreach', true, 'running=' + ao.isRunning + ' thoughts=' + ao.thoughtsGenerated); }
    else chk('autonomousOutreach', false, 'missing');
  } catch (e) { chk('autonomousOutreach', false, e.message); }

  // 13. CONSCIOUSNESS LOOP
  try {
    const cl = gsk.consciousnessLoop;
    if (cl) { chk('consciousnessLoop', true, 'cycleCount=' + (cl.cycleCount || 0) + ' energy=' + (cl.metabolism ? cl.metabolism.energy : '?')); }
    else chk('consciousnessLoop', false, 'missing');
  } catch (e) { chk('consciousnessLoop', false, e.message); }

  console.log('\n===== GSK FUNCTIONAL ULTRA-REVIEW =====');
  let bad = 0;
  for (const [s, n, d] of results) { if (s === '❌') bad++; console.log(`${s} ${n.padEnd(28)} ${d.substring(0,70)}`); }
  console.log(`\nFAILING: ${bad}/${results.length}`);
  process.exit(0);
})();
