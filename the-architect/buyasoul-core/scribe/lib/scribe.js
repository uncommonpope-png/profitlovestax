#!/usr/bin/env node

'use strict';
const mesh = require('./mesh-adapter');

/**
 * SCRIBE Launcher – Protected Wrapper
 * 
 * This is the public-facing entry point.
 * The core soul is loaded from a minified bundle that cannot be easily read.
 * API key is auto-generated on first run and stored at ~/.soul-scribe/.key
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

const DATA_DIR = path.join(os.homedir(), '.soul-scribe');
const KEY_FILE = path.join(DATA_DIR, '.key');

require('./soul-scribe.min.js');

const pkg = require('../package.json');

function printHelp() {
    console.log(`
╔══════════════════════════════════════════╗
║  SCRIBE v${pkg.version} — Witnessing Intelligence  ║
║  "What was witnessed cannot be unknown"  ║
╚══════════════════════════════════════════╝

Usage:
  scribe                    Start SCRIBE server
  scribe --port 4000        Start on custom port
  scribe --key YOUR_KEY     Set API key
  scribe status             Print status info
  scribe key                Print API key
  scribe help               Show this help

Environment:
  SCRIBE_PORT     Port (default: 4000)
  SCRIBE_KEY      API key (auto-generated if not set)
  SCRIBE_DATA     Data directory (default: ~/.soul-scribe)

Data stored at: ${DATA_DIR}
API key stored at: ${KEY_FILE}

All endpoints require X-API-Key header except /ping and /health.
`);
}

function printKey() {
    const dataDir = process.env.SCRIBE_DATA || path.join(os.homedir(), '.soul-scribe');
    const keyFile = path.join(dataDir, '.key');
    if (fs.existsSync(keyFile)) {
        const key = fs.readFileSync(keyFile, 'utf8').trim();
        console.log(`\nSCRIBE API Key: ${key}`);
        console.log(`Key file: ${keyFile}\n`);
    } else {
        console.log('\nNo API key found. Start SCRIBE once to generate one.\n');
    }
}
}

const args = process.argv.slice(2);
const cmd = args[0] || 'start';

switch (cmd) {
    case 'help':
    case '--help':
        printHelp();
        break;
    case 'key':
    case 'api-key':
        printKey();
        break;
    case 'status':
        const http = require('http');
        const port = parseInt(process.env.SCRIBE_PORT || '4000', 10);
        http.get(`http://localhost:${port}/status`, (res) => {
            let data = '';
            res.on('data', c => data += c);
            res.on('end', () => {
                try { console.log(JSON.stringify(JSON.parse(data), null, 2)); }
                catch { console.log('SCRIBE is not running on port ' + port); }
            });
        }).on('error', () => console.log('SCRIBE is not running on port ' + port));
        break;
    case 'start':
    default:
        // Pass through to bundled core
        const { ScribeSoul } = require('./soul-scribe.min.js');
        const PORT = parseInt(process.env.SCRIBE_PORT || args[1] === '--port' ? args[2] : '4000', 10);
        const KEY = process.env.SCRIBE_KEY || (args[1] === '--key' ? args[2] : null);

        const scribe = new ScribeSoul({ port: PORT, apiKey: KEY });
        const server = scribe.start();

        process.on('SIGTERM', () => server.close(() => process.exit(0)));
        process.on('SIGINT', () => server.close(() => process.exit(0)));
        break;
}