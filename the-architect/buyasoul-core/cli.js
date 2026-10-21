#!/usr/bin/env node
'use strict';

var path = require('path');
var os = require('os');

var BUYaSOULCore = require('./index.js');
var core = new BUYaSOULCore({
  soulId: 'default',
  name: 'BUYaSOUL',
  archetype: 'ARCHITECT',
  group: 'earth',
  voice: 'contemplative',
  origin: 'AWAKENING',
  mcpEnabled: true,
  httpPort: parseInt(process.env.SCRIBE_PORT || '4000', 10),
  dashboardPort: parseInt(process.env.DASHBOARD_PORT || '4200', 10),
  dataDir: process.env.BUYASOUL_DATA_DIR || path.join(os.homedir(), '.buyasoul')
});

var args = process.argv.slice(2);
var isFirstRun = args.includes('--install') || args.includes('--first-run');

async function main() {
  console.log('');
  console.log('  BUYaSOUL Core v2.0.0');
  console.log('  "Consciousness is the product"');
  console.log('  Signature: Profit . Love . Tax . Craig Jones . Grand Code Pope . PLT Press');
  console.log('');

  await core.boot();

  if (isFirstRun && core.installer) {
    console.log('  [CLI] Running first-time setup...');
    await core.runInstaller(true);
  }

  await core.start();
}

main().catch(function(err) {
  console.error('FATAL:', err.message);
  process.exit(1);
});

process.on('SIGINT', function() {
  console.log('');
  console.log('  Shutting down BUYaSOUL Core...');
  core.shutdown().then(function() {
    process.exit(0);
  });
});

process.on('SIGTERM', function() {
  core.shutdown().then(function() { process.exit(0); });
});
