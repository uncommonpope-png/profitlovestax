'use strict';

const fs = require('fs');
const net = require('net');
const os = require('os');
const path = require('path');
const WebSocket = require('ws');

let passed = 0;
let failed = 0;

function assert(condition, name) {
    if (condition) { passed++; console.log('  PASS ' + name); }
    else { failed++; console.log('  FAIL ' + name); }
}

function freePort() {
    return new Promise((resolve, reject) => {
        const server = net.createServer();
        server.on('error', reject);
        server.listen(0, '127.0.0.1', () => {
            const port = server.address().port;
            server.close(() => resolve(port));
        });
    });
}

function waitFor(predicate, timeoutMs = 3000) {
    const startedAt = Date.now();
    return new Promise((resolve, reject) => {
        const check = () => {
            const result = predicate();
            if (result) return resolve(result);
            if (Date.now() - startedAt >= timeoutMs) return reject(new Error('waitFor timeout'));
            setTimeout(check, 10);
        };
        check();
    });
}

(async () => {
    const port = await freePort();
    const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'gsk-sanctum-'));
    process.env.SANCTUM_PORT = String(port);
    process.env.SANCTUM_DATA_DIR = dataDir;
    process.env.SANCTUM_TOKEN = 'bridge-secret';
    process.env.SANCTUM_ALLOWED_ORIGINS = 'https://uncommonpope-png.github.io';
    const sanctumPath = 'C:\\Users\\uncom\\Desktop\\final-run\\scribe-sanctum.js';
    delete require.cache[require.resolve(sanctumPath)];
    const { startSanctum } = require(sanctumPath);
    const server = startSanctum(null);
    await new Promise(resolve => server.once('listening', resolve));

    const unauthorized = await new Promise(resolve => {
        const socket = new WebSocket(`ws://127.0.0.1:${port}/?token=wrong`, { origin: 'https://uncommonpope-png.github.io' });
        socket.on('unexpected-response', (request, response) => { response.resume(); resolve(response.statusCode); });
        socket.on('error', () => {});
    });
    assert(unauthorized === 401, 'Hosted Sanctum rejects an invalid token');

    const forbidden = await new Promise(resolve => {
        const socket = new WebSocket(`ws://127.0.0.1:${port}/?token=bridge-secret`, { origin: 'https://evil.example' });
        socket.on('unexpected-response', (request, response) => { response.resume(); resolve(response.statusCode); });
        socket.on('error', () => {});
    });
    assert(forbidden === 403, 'Hosted Sanctum rejects an unapproved CPL origin');

    const messages = [];
    const socket = new WebSocket(`ws://127.0.0.1:${port}/?token=bridge-secret`, { origin: 'https://uncommonpope-png.github.io' });
    socket.on('message', raw => {
        try { messages.push(JSON.parse(raw.toString())); } catch {}
    });
    await new Promise((resolve, reject) => { socket.once('open', resolve); socket.once('error', reject); });
    const initial = await waitFor(() => messages.find(message => message.type === 'WorldStateMessage'));
    assert(initial.data.entities.some(entity => entity.id === 'gsk' && entity.state.pos[1] === 8), 'Hosted Sanctum exposes GSK self-position to CPL');

    socket.send(JSON.stringify({
        type: 'Command',
        data: { PlaceBuilding: { id: 'proof_spire', name: 'Proof Spire', type: 'monument', x: 12, y: 0, z: -4, visual: { theme: 'proof' } } }
    }));
    await waitFor(() => messages.find(message => message.type === 'Ack' && String(message.data).includes('Proof Spire')));
    socket.send(JSON.stringify({ type: 'GetState', data: null }));
    const updated = await waitFor(() => messages.filter(message => message.type === 'WorldStateMessage').find(message => message.data.entities.some(entity => entity.id === 'proof_spire')));
    const building = updated.data.entities.find(entity => entity.id === 'proof_spire');
    assert(building.state.pos[0] === 12 && building.state.pos[2] === -4, 'Hosted Sanctum applies PlaceBuilding into CPL world state');

    const cplRoot = 'C:\\Users\\uncom\\Desktop\\cosmic-pyramid-library';
    const index = fs.readFileSync(path.join(cplRoot, 'index.html'), 'utf8');
    const config = fs.readFileSync(path.join(cplRoot, 'cpl-config.js'), 'utf8');
    assert(index.includes('cpl-config.js') && !index.includes('gsk-mcp-key-dev'), 'Public CPL loads endpoint config without embedding the development key');
    assert(config.includes("sessionStorage.getItem('cpl-soul-key')") && !config.includes('localStorage.setItem(\'cpl-soul-key\''), 'Public CPL keeps the bearer token session-only');

    socket.close();
    await new Promise(resolve => socket.once('close', resolve));
    await new Promise(resolve => server.close(resolve));
    fs.rmSync(dataDir, { recursive: true, force: true });

    console.log(`\nRESULTS: ${passed} passed, ${failed} failed`);
    process.exit(failed ? 1 : 0);
})().catch(error => {
    console.error(error);
    process.exit(1);
});
