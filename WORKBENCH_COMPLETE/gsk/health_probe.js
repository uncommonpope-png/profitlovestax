'use strict';
const path = require('path');
const GSKFusion = require('./fusion-loader.js');

const PROBE_METHODS = ['getStatus','getState','status','health','tick','stats','recordRebirth','list','getAll','getRecent','check','scanCombos','start'];

(async () => {
  const gsk = new GSKFusion(null, { dataDir: path.join(__dirname, 'data') });
  const report = [];
  try {
    await gsk.boot();
  } catch (e) {
    report.push(['__BOOT__', 'FATAL', e.message]);
  }

  // give async inits time
  await new Promise(r => setTimeout(r, 4000));

  const sys = gsk.systems || {};
  for (const [name, obj] of Object.entries(sys)) {
    if (!obj || typeof obj !== 'object') { report.push([name, 'NULL', 'not an object']); continue; }
    const cls = obj.constructor ? obj.constructor.name : '?';
    const probes = [];
    let error = null;
    for (const m of PROBE_METHODS) {
      if (typeof obj[m] === 'function') {
        try {
          const r = obj[m](Date.now());
          if (r && typeof r.then === 'function') {
            // skip async for probe speed, just note it exists
            probes.push(`${m}()`);
          } else {
            probes.push(`${m}()✓`);
          }
        } catch (e) {
          probes.push(`${m}()✗`);
          if (!error) error = `${m}: ${e.message}`;
        }
      }
    }
    report.push([name, cls, error || (probes.join(' ') || 'no-probe-methods')]);
  }

  console.log('\n===== GSK ULTRA HEALTH MATRIX =====');
  console.log(`Total systems: ${report.length}`);
  let bad = 0;
  for (const [name, cls, info] of report) {
    const isBad = info.includes('✗') || info === 'NULL' || info.startsWith('FATAL') || info.includes('not an object');
    if (isBad) bad++;
    console.log(`${isBad ? '❌' : '✅'} ${name.padEnd(24)} ${cls.padEnd(22)} ${info.substring(0,90)}`);
  }
  console.log(`\nFAILING: ${bad}/${report.length}`);
  process.exit(0);
})();
