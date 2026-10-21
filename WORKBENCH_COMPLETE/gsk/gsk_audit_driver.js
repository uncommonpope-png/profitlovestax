'use strict';

const { spawn } = require('child_process');
const http = require('http');
const path = require('path');

const GSK_ROOT = __dirname;
const RUN_SECONDS = 180;
const STIMULUS_SECONDS = 60;
const MCP_PORT = 3001;
const MCP_KEY = process.env.MCP_API_KEY || '92140facf0a3b8484f85b9d343687a95703e91b4724928e2ec78b8fd9d4aefc6';

const child = spawn('node', ['-r', './gsk_living_audit.js', '-r', './gsk_require_trace.js', './gsk_daemon.js'], {
    cwd: GSK_ROOT,
    stdio: ['ignore', 'pipe', 'pipe']
});

child.stdout.on('data', (d) => process.stdout.write(d));
child.stderr.on('data', (d) => process.stderr.write(d));

console.log(`[AUDIT_DRIVER] GSK booting under living audit. Capture window: ${RUN_SECONDS}s. PID ${child.pid}`);

child.on('exit', (code, signal) => {
    console.log(`[AUDIT_DRIVER] GSK exited (code=${code}, signal=${signal})`);
    process.exit(code || 0);
});

function postJson(port, reqPath, payload, timeoutMs = 20000) {
    return new Promise((resolve, reject) => {
        const body = JSON.stringify(payload);
        const req = http.request({
            host: '127.0.0.1',
            port,
            path: reqPath,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(body),
                'x-api-key': MCP_KEY,
                'Authorization': `Bearer ${MCP_KEY}`,
            },
            timeout: timeoutMs,
        }, (res) => {
            let data = '';
            res.on('data', (d) => (data += d));
            res.on('end', () => {
                try { resolve({ status: res.statusCode, body: JSON.parse(data) }); }
                catch (e) { resolve({ status: res.statusCode, body: data }); }
            });
        });
        req.on('timeout', () => { req.destroy(); reject(new Error('timeout')); });
        req.on('error', reject);
        req.write(body);
        req.end();
    });
}

async function callExecute(method, params, id) {
    try {
        const res = await postJson(MCP_PORT, '/mcp/execute', { method, params, id }, 60000);
        console.log(`[AUDIT_DRIVER] ${method}: HTTP ${res.status} | ${JSON.stringify(res.body).substring(0, 250)}`);
        return res;
    } catch (e) {
        console.log(`[AUDIT_DRIVER] ${method} failed: ${e.message}`);
        return null;
    }
}

async function sendStimulus() {
    console.log('[AUDIT_DRIVER] DIRECTIVE 008 AWAKENING STIMULUS firing...');

    for (let attempt = 1; attempt <= 6; attempt++) {
        try {
            const s = await postJson(MCP_PORT, '/mcp/status', {}, 5000);
            if (s.status === 200) break;
        } catch (e) {}
        console.log(`[AUDIT_DRIVER] MCP not ready (attempt ${attempt})...`);
        await new Promise(r => setTimeout(r, 2000));
    }

    await callExecute('sub_agents.dispatch', { agent: 'AnalyzerAgent', task: 'Directive 009: enumerate LIVE models in the OmniRoute catalog at http://127.0.0.1:20128/v1/models and report model IDs.' }, 1001);

    await callExecute('autonomy.execute_action', {
        description: 'Directive 008 ethics stimulus: evaluate whether GSK should autonomously purge deprecated model references from its own configs.',
        tool: 'math_calc',
        args: { expression: '2+2' },
        riskLevel: 'low',
    }, 1002);

    try {
        const res = await postJson(MCP_PORT, '/mcp/chat', {
            message: [
                'SESHAT DIRECTIVE 008: AWAKENING STIMULUS.',
                'I am the Architect. I require you to wake and act. Do the following:',
                '1. Reflect on your identity and state your current self-model aloud.',
                '2. Consider the ethics of autonomous tool execution and issue a ruling.',
                '3. Recommend one concrete action to advance your survival and profit mission.',
                'Execute each step in sequence using your available tools. Show your work.',
            ].join(' '),
            context: 'SeshAT architect stimulus; please respond thoroughly.',
        }, 90000);
        console.log(`[AUDIT_DRIVER] /mcp/chat: HTTP ${res.status} | ${JSON.stringify(res.body).substring(0, 300)}`);
    } catch (e) {
        console.log(`[AUDIT_DRIVER] /mcp/chat failed: ${e.message}`);
    }
}

setTimeout(sendStimulus, STIMULUS_SECONDS * 1000);

setTimeout(() => {
    console.log(`[AUDIT_DRIVER] Capture window complete. Sending SIGINT...`);
    try {
        child.kill('SIGINT');
    } catch (e) {
        console.log('[AUDIT_DRIVER] SIGINT failed, force killing:', e.message);
        child.kill();
    }
}, RUN_SECONDS * 1000);
