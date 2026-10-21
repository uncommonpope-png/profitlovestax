'use strict';

const { SecureShellSandbox, RISK_LEVELS } = require('../security/secure_sandbox.js');
const { ApprovedToolExecutor, RISK_TAX } = require('../governance/approved_tool_executor.js');
const { Plan } = require('../brain/planning_engine.js');
const { DeepToolUse } = require('../brain/deep_tool_use.js');

let passed = 0;
let failed = 0;
function assert(condition, name) {
    if (condition) { passed++; console.log('  PASS ' + name); }
    else { failed++; console.log('  FAIL ' + name); }
}

(async () => {
    // --- Test 1: SecureShellSandbox classification ---
    const sandbox = new SecureShellSandbox({});
    assert(sandbox.classify('ls -la') === RISK_LEVELS.SAFE, 'classify ls as SAFE');
    assert(sandbox.classify('rm -f somefile') === RISK_LEVELS.HIGH, 'classify rm as HIGH');
    assert(sandbox.classify('shutdown now') === RISK_LEVELS.CRITICAL, 'classify shutdown as CRITICAL');
    assert(sandbox.classify('ls; rm somefile') === RISK_LEVELS.HIGH, 'chained commands classified as HIGH');
    assert(sandbox.classify('ls | grep root') === RISK_LEVELS.HIGH, 'piped commands classified as HIGH');

    // --- Test 2: SecureShellSandbox array execution ---
    const result = await sandbox.executeArray('node', ['-e', 'console.log("safe-exec")'], { riskLevel: 'safe' });
    assert(result.exitCode === 0, 'executeArray runs node directly');
    assert(result.stdout.includes('safe-exec'), 'executeArray captures stdout');

    // Array args prevent shell metachar injection
    const injectionResult = await sandbox.executeArray('node', ['-e', 'var x = "no;rm -rf /"'], { riskLevel: 'safe' });
    assert(injectionResult.exitCode === 0, 'array args prevent command injection');

    // --- Test 3: DeepToolUse uses secure sandbox ---
    const kernel = {
        systems: {
            secureSandbox: sandbox,
            toolBridge: { invoke: async () => ({ status: 'success' }) },
        }
    };
    const dtu = new DeepToolUse(kernel);
    assert(dtu._getSandbox() instanceof SecureShellSandbox, '_getSandbox returns a SecureShellSandbox');

    const codeResult = await dtu.executeTool('code_exec', { code: 'console.log(42 + 1)', language: 'javascript' });
    assert(codeResult.output === '43', 'code_exec runs code via secure sandbox');

    const gitResult = await dtu.executeTool('git_ops', { command: 'status' });
    assert(typeof gitResult === 'object', 'git_ops runs via secure sandbox');

    // --- Test 4: ApprovedToolExecutor AbortController cancellation ---
    const kernel2 = {
        systems: {
            secureSandbox: sandbox,
            selfGovernance: { ethicalCheck: async () => ({ allowed: true }) },
            toolBridge: {
                invoke: async (tool, args) => {
                    const signal = args?._abortSignal;
                    return new Promise((resolve, reject) => {
                        if (signal && signal.aborted) {
                            return reject(new Error('Action timed out'));
                        }
                        const timeout = setTimeout(() => resolve({ status: 'success' }), 100);
                        if (signal) {
                            signal.addEventListener('abort', () => {
                                clearTimeout(timeout);
                                reject(new Error('Action timed out'));
                            }, { once: true });
                        }
                    });
                }
            },
            competenceMap: { recordOutcome: () => {} },
            autonomousLearning: { addTopic: () => {} },
        },
        memory: { witness: async () => {} },
        core: { plt: { score: () => ({ score: 1 }) } }
    };

    const executor = new ApprovedToolExecutor(kernel2, {
        maxSteps: 5, maxTax: 10, maxToolCalls: 5, stepTimeoutMs: 30, requireApprovalAt: 'high'
    });

    const timeoutPlan = new Plan('timeout test');
    const timeoutStep = timeoutPlan.addStep('long running task');
    timeoutStep.tool = 'some_tool';
    timeoutStep.riskLevel = 'safe';
    timeoutStep.args = { data: 'test' };
    timeoutPlan.status = 'running';

    const timeoutResult = await executor.executeStep(timeoutStep, { plan: timeoutPlan });
    assert(timeoutResult.status === 'failed', 'step times out and is marked failed');
    assert(timeoutResult.error && timeoutResult.error.includes('timed out'), 'timeout error message propagated');
    assert(timeoutStep.status === 'failed', 'step status reflects failure');

    // --- Test 5: EventBus error isolation ---
    const { EventBus } = require('../brain/event_bus.js');
    const bus = new EventBus();
    let goodSubscriberCalled = false;
    let afterErrorSubscriberCalled = false;

    bus.subscribe('test.event', () => { goodSubscriberCalled = true; });
    bus.subscribe('test.event', () => { throw new Error('boom'); });
    bus.subscribe('test.event', () => { afterErrorSubscriberCalled = true; });

    bus.publish('test.event', { data: 'test' });
    await new Promise(r => setTimeout(r, 20));

    assert(goodSubscriberCalled, 'subscriber before error still called');
    assert(afterErrorSubscriberCalled, 'subscriber after bad one still executes');

    // --- Test 6: LiveFeed async write stream ---
    const { LiveFeed } = require('../brain/live_feed.js');
    const os = require('os');
    const path = require('path');
    const fs = require('fs');
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'gsk-test-'));
    const mockMemory = { dataDir: tmpDir, witness: async () => {} };
    const mockChambers = { mythos: { cycles: 0 }, affect: { mood: 'neutral', arousal: 0.5, valence: 0.5 } };
    const feed = new LiveFeed(null, mockMemory, mockChambers);

    await feed.captureInteraction('test input', 'test output', { plt_scores: { total: 0.8 } });
    assert(feed.getStats().interactions_captured === 1, 'LiveFeed captures interaction');

    await feed.close();
    const trainingContent = fs.readFileSync(path.join(tmpDir, 'training_data.jsonl'), 'utf8');
    assert(trainingContent.trim().length > 0, 'LiveFeed write stream flushes to file');

    fs.rmSync(tmpDir, { recursive: true, force: true });

    console.log(`\nRESULTS: ${passed} passed, ${failed} failed`);
    process.exit(failed ? 1 : 0);
})().catch(error => {
    console.error('Test suite error:', error);
    process.exit(1);
});
