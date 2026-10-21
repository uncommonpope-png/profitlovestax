'use strict';

const WebSocket = require('ws');
const { SceneGraphManager } = require('../skills/scene_graph_manager.js');
const { SanctumClient } = require('../brain/sanctum_client.js');
const { WorldModelSimulation } = require('../brain/world_model_simulation.js');
const { UniversalToolBridge } = require('../tools/universal_tool_bridge.js');
const { ApprovedToolExecutor } = require('../governance/approved_tool_executor.js');

let passed = 0;
let failed = 0;

function assert(condition, name) {
    if (condition) { passed++; console.log('  PASS ' + name); }
    else { failed++; console.log('  FAIL ' + name); }
}

function waitFor(predicate, timeoutMs = 2000) {
    const startedAt = Date.now();
    return new Promise((resolve, reject) => {
        const check = () => {
            if (predicate()) return resolve();
            if (Date.now() - startedAt >= timeoutMs) return reject(new Error('waitFor timeout'));
            setTimeout(check, 10);
        };
        check();
    });
}

(async () => {
    const received = [];
    const witnessed = [];
    const server = new WebSocket.Server({ port: 0 });
    await new Promise(resolve => server.once('listening', resolve));
    const port = server.address().port;

    server.on('connection', socket => {
        socket.on('message', raw => {
            const message = JSON.parse(raw.toString());
            received.push(message);
            if (message.type === 'GetState') {
                socket.send(JSON.stringify({
                    type: 'WorldStateMessage',
                    data: {
                        tick: 42,
                        description: 'P1 test world',
                        resources: { profit: 900, love: 700, tax: 100 },
                        entities: [
                            { id: 'gsk', type: 'gsk', state: { pos: [5, 2, -3], role: 'gsk' }, visual: { theme: 'gold' } },
                            { id: 'north_spire', type: 'building', state: { pos: [5, 0, 7], lit: false }, visual: { theme: 'dark' } },
                            { id: 'scribe_npc', type: 'npc', state: { pos: [8, 0, -3] }, visual: { archetype: 'scribe' } }
                        ]
                    }
                }));
            }
        });
    });

    const kernel = {
        systems: {},
        memory: { witness: async entry => witnessed.push(entry) },
        chambers: { agentic_will: { will: { execute_action() {} } } },
        core: { plt: { score() { return { score: 1 }; } } },
        behaviorAttacher: {
            registerBehavior() {},
            attachBehavior() {},
            updateEntityBehaviors() {}
        },
        sceneGraphManager: new SceneGraphManager()
    };
    kernel.fusion = kernel;

    const sanctum = new SanctumClient(kernel, {
        wsUrl: `ws://127.0.0.1:${port}`,
        selfEntityId: 'gsk',
        reconnectIntervalMs: 10,
        maxReconnectAttempts: 0
    });
    kernel.sanctumClient = sanctum;
    kernel.systems.sanctumClient = sanctum;
    sanctum.connect();
    await waitFor(() => sanctum.getWorldState().tick === 42);

    const state = sanctum.getWorldState();
    assert(state.self_position.x === 5 && state.self_position.y === 2 && state.self_position.z === -3, 'P1 self-scan reports GSK coordinates');
    assert(state.visible_objects.length === 2, 'P1 self-scan reports visible objects');
    assert(Math.abs(state.visible_objects.find(object => object.id === 'north_spire').distance - Math.sqrt(104)) < 0.001, 'P1 visible object includes spatial distance');
    assert(state.buildings.some(building => building.id === 'north_spire'), 'P1 entity schema populates buildings');
    assert(state.souls.some(soul => soul.id === 'scribe_npc'), 'P1 entity schema populates citizens');
    assert(kernel.sceneGraphManager.getNode('north_spire').properties.position.z === 7, 'P1 live entities enter the scene graph');

    const bridge = new UniversalToolBridge(kernel);
    bridge._callScribe = async () => ({ ok: true });
    kernel.toolBridge = bridge;
    kernel.systems.toolBridge = bridge;
    const executor = new ApprovedToolExecutor(kernel, { requireApprovalAt: 'medium', maxSteps: 5, maxTax: 2, maxToolCalls: 5 });
    kernel.approvedToolExecutor = executor;
    kernel.systems.approvedToolExecutor = executor;

    const readPlan = { id: 'p1_read', goal: 'scan the live world', status: 'running' };
    const readStep = { id: 'p1_read_step', description: 'read Sanctum state', tool: 'world_get_state', args: {}, status: 'pending' };
    const read = await executor.executeStep(readStep, { plan: readPlan });
    assert(read.status === 'completed', 'P1 world read executes without approval');
    assert(read.result.self_position.x === 5, 'P1 governed read returns self-position');

    const buildPlan = { id: 'p2_build', goal: 'repair the north spire', status: 'running' };
    const buildStep = {
        id: 'p2_build_step',
        description: 'place the approved proof spire',
        tool: 'world_place_building',
        args: { name: 'Proof Spire', type: 'monument', x: 0, z: 0 },
        status: 'pending'
    };
    const pending = await executor.executeStep(buildStep, { plan: buildPlan });
    assert(pending.status === 'approval_required', 'P2 mutating world action pauses for architect');
    assert(!received.some(message => message.data?.PlaceBuilding?.name === 'Proof Spire'), 'P2 no world mutation occurs before approval');
    assert(executor.approveRequest(pending.approvalId, 'PLT222').ok, 'P2 architect approves with PLT222');
    const built = await executor.executeApproved(pending.approvalId);
    await waitFor(() => received.some(message => message.data?.PlaceBuilding?.name === 'Proof Spire'));
    const command = received.find(message => message.data?.PlaceBuilding?.name === 'Proof Spire');
    assert(built.status === 'completed', 'P2 approved action executes');
    assert(command.type === 'Command', 'P2 emits Sanctum Command message');
    assert(command.data.PlaceBuilding.x === 0 && command.data.PlaceBuilding.z === 0, 'P2 preserves exact world coordinates');
    assert(witnessed.some(entry => entry.type === 'approved_action_result' && entry.tags.includes('world_place_building')), 'P2 result is witnessed to memory');

    const worldSim = new WorldModelSimulation(kernel);
    const queued = await worldSim.executeInWorld({
        goal: 'build safely',
        plan: { action: 'Build "Autonomy Spire"' },
        bestPath: { hypothesis: 'governed build' },
        simulationTime: Date.now()
    });
    assert(queued.actions[0].status === 'approval_required', 'P2 autonomous simulation cannot bypass approval');
    assert(!received.some(message => message.data?.PlaceBuilding?.name === 'Autonomy Spire'), 'P2 autonomous mutation remains queued');

    sanctum.disconnect();
    await new Promise(resolve => server.close(resolve));

    console.log(`\nRESULTS: ${passed} passed, ${failed} failed`);
    process.exit(failed ? 1 : 0);
})().catch(error => {
    console.error(error);
    process.exit(1);
});
