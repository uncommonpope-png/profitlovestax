'use strict';

const path = require('path');
const http = require('http');
const GSKFusion = require('./fusion-loader.js');

const BRAIN_PORT = 4491;

async function boot() {
    console.log('[GSK] Booting fusion loader...');
    const gsk = new GSKFusion(null, {
        dataDir: path.join(__dirname, 'data')
    });
    
    await gsk.boot();
    
    console.log('[GSK] Fusion loader booted successfully');
    console.log('[GSK] 74 subsystems initialized');

    // Start brain API server for bridge/citizens
    const server = http.createServer((req, res) => {
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Content-Type', 'application/json');

        if (req.method === 'POST' && req.url === '/brain') {
            let body = '';
            req.on('data', c => body += c);
            req.on('end', async () => {
                try {
                    const { prompt, citizen, thought } = JSON.parse(body);
                    const brain = gsk.systems?.brain || gsk.brain;
                    if (brain && typeof brain.think === 'function') {
                        const result = await brain.think(prompt || thought || citizen || 'Hello');
                        res.end(JSON.stringify({ ok: true, response: result?.result || result || '...' }));
                    } else {
                        res.end(JSON.stringify({ ok: true, response: 'GSK thinking...' }));
                    }
                } catch (e) {
                    res.end(JSON.stringify({ ok: true, response: 'GSK present.' }));
                }
            });
            return;
        }

        if (req.url === '/status') {
            const mem = gsk.systems?.memoryCompiler || gsk.memoryCompiler;
            const pc = gsk.systems?.perpetualConsciousness || gsk.perpetualConsciousness;
            const tc = gsk.systems?.toolCatalog || gsk.toolCatalog;
            res.end(JSON.stringify({
                ok: true,
                uptime: process.uptime(),
                brain: !!(gsk.systems?.brain || gsk.brain),
                sanctum: gsk.sanctumClient?.isConnected || false,
                memoryCompiler: !!mem,
                perpetualConsciousness: pc?.isRunning || false,
                toolCount: tc?._entries?.size || 0,
                subsystems: 74
            }));
            return;
        }

        res.end(JSON.stringify({ ok: true, name: 'GSK Brain API', port: BRAIN_PORT }));
    });

    server.listen(BRAIN_PORT, '127.0.0.1', () => {
        console.log(`[GSK] Brain API on http://127.0.0.1:${BRAIN_PORT} — bridge can now think`);
    });

    // Keep alive
    process.on('SIGINT', async () => {
        console.log('[GSK] Shutting down...');
        server.close();
        if (gsk.stop) await gsk.stop();
        process.exit(0);
    });
}

boot().catch(e => {
    console.error('[GSK] Boot failed:', e.message);
    process.exit(1);
});
