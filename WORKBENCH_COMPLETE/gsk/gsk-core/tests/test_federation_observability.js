'use strict';

const http = require('http');
const { AgentComms } = require('../brain/agent_comms.js');
const { MCPServer } = require('../mcp/mcp_server.js');
const { ApprovedToolExecutor } = require('../governance/approved_tool_executor.js');

let passed = 0;
let failed = 0;

function assert(condition, name) {
    if (condition) { passed++; console.log('  PASS ' + name); }
    else { failed++; console.log('  FAIL ' + name); }
}

function request(port, pathname, headers = {}) {
    return new Promise((resolve, reject) => {
        const req = http.get({ hostname: '127.0.0.1', port, path: pathname, headers }, res => {
            let raw = '';
            res.on('data', chunk => { raw += chunk; });
            res.on('end', () => {
                let body = raw;
                try { body = JSON.parse(raw); } catch {}
                resolve({ status: res.statusCode, body, headers: res.headers });
            });
        });
        req.on('error', reject);
    });
}

(async () => {
    const witnessed = [];
    const toolCalls = [];
    const kernel = {
        systems: {
            toolBridge: { invoke: async (tool, args) => { toolCalls.push({ tool, args }); return { status: 'success', state: 'visible' }; } },
            selfGovernance: { ethicalCheck: async () => ({ allowed: true }) }
        },
        memory: { witness: async event => witnessed.push(event) },
        chambers: { agentic_will: { will: { execute_action() {} } } },
        core: { plt: { score() { return { score: 1 }; } } }
    };
    const executor = new ApprovedToolExecutor(kernel, { requireApprovalAt: 'medium' });
    kernel.approvedToolExecutor = executor;
    kernel.systems.approvedToolExecutor = executor;

    let deepReceived = null;
    const deepServer = http.createServer((req, res) => {
        let raw = '';
        req.on('data', chunk => { raw += chunk; });
        req.on('end', () => {
            deepReceived = JSON.parse(raw);
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({
                envelope: {
                    id: 'deep_action_1',
                    from: 'deep',
                    to: 'gsk',
                    type: 'action_request',
                    subject: 'Inspect the CPL',
                    body: 'Read the live world state',
                    action: { tool: 'world_get_state', args: {} },
                    timestamp: Date.now()
                }
            }));
        });
    });
    await new Promise(resolve => deepServer.listen(0, '127.0.0.1', resolve));
    const deepPort = deepServer.address().port;
    const comms = new AgentComms(kernel, { agents: { deep: { url: `http://127.0.0.1:${deepPort}/mcp/agent/message`, key: 'deep-test' } } });
    kernel.systems.agentComms = comms;
    const roundTrip = await comms.send('deep', 'P11 federation proof', 'Return one governed action');
    assert(deepReceived?.from === 'gsk' && deepReceived?.to === 'deep', 'P11 GSK sends a structured message to Agent Deep');
    assert(roundTrip.actionResult?.status === 'completed', 'P11 Agent Deep response triggers a governed action');
    assert(toolCalls.some(call => call.tool === 'world_get_state'), 'P11 federation action reaches the tool bridge');
    assert(witnessed.filter(event => event.type === 'agent_message').length >= 2, 'P11 both message directions are witnessed');
    await new Promise(resolve => deepServer.close(resolve));

    const systems = {
        brain: { _groq_available: true, model: 'test-model' },
        autonomyExecutor: executor,
        agentComms: comms,
        sanctumClient: { getStats: () => ({ isConnected: true, selfPositionKnown: true }) },
        scribeBridge: { getStats: () => ({ isAlive: true, eventsForwarded: 8 }) },
        plt: { getState: () => ({ profit: 0.8, love: 0.7, tax: 0.2 }) },
        sovereignAutonomyLoop: { getStats: () => ({ currentStreak: 10, cyclesCompleted: 10 }) },
        voiceEngine: { getStatus: () => ({ available: true }) },
        personaKernel: { getStatus: () => ({ stable: true, bibleFingerprint: 'abc' }) },
        telemetryEngine: { getReport: () => ({ aggregatedStats: {}, recentEvents: [] }) }
    };
    const mcp = new MCPServer(systems, { port: 0, host: '127.0.0.1', apiKey: 'test-key', allowedOrigins: 'https://uncommonpope-png.github.io' });
    await mcp.start();
    const port = mcp.server.address().port;
    const observable = await request(port, '/mcp/observability', { 'X-API-Key': 'test-key', Origin: 'https://uncommonpope-png.github.io' });
    assert(observable.status === 200, 'P12 observability endpoint is authenticated and reachable');
    const report = observable.body.result;
    assert(report.brain.available && report.sanctum.isConnected && report.scribe.isAlive, 'P12 exposes brain, Sanctum, and SCRIBE health');
    assert(report.plt.profit === 0.8 && report.autonomy.currentStreak === 10, 'P12 exposes PLT and autonomy streak');
    assert(report.approvals.pendingApprovals === 0 && report.federation.messages >= 2, 'P12 exposes approval and federation state');
    const blocked = await request(port, '/mcp/observability', { 'X-API-Key': 'test-key', Origin: 'https://evil.example' });
    assert(blocked.status === 403, 'P12 rejects unapproved browser origins');
    await mcp.stop();

    console.log(`\nRESULTS: ${passed} passed, ${failed} failed`);
    process.exit(failed ? 1 : 0);
})().catch(error => {
    console.error(error);
    process.exit(1);
});
