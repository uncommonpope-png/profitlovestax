'use strict';

const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { Brain } = require('../brain/mega_brain.js');
const { PerpetualConsciousness } = require('../brain/perpetual_consciousness.js');
const { PlanningEngine } = require('../brain/planning_engine.js');
const { GoalEngine } = require('../brain/goal_engine.js');

let passed = 0;
let failed = 0;

async function test(name, fn) {
    try {
        await fn();
        passed++;
        console.log(`  PASS ${name}`);
    } catch (error) {
        failed++;
        console.log(`  FAIL ${name}: ${error.message}`);
    }
}

(async () => {
    await test('brain makes one request for a complete response', async () => {
        const brain = new Brain({ maxModelAttempts: 1 });
        let requests = 0;
        brain._request = async () => {
            requests++;
            return JSON.stringify({ choices: [{ message: { content: 'OK' }, finish_reason: 'stop' }] });
        };
        const response = await brain._nineRouter('test');
        assert.strictEqual(response, 'OK');
        assert.strictEqual(requests, 1);
    });

    await test('brain marks canned fallback as unavailable', async () => {
        const brain = new Brain({ maxModelAttempts: 1 });
        let requests = 0;
        brain._request = async () => { requests++; throw new Error('offline'); };
        const response = await brain.think('test');
        assert.strictEqual(response, null);
        assert.strictEqual(brain._lastThinkUsedFallback, true);
        assert.strictEqual(await brain.think('test again'), null);
        assert.strictEqual(requests, 1);
    });

    await test('perpetual cooldown survives local fallback cycles', async () => {
        let calls = 0;
        const brain = {
            _lastThinkUsedFallback: false,
            async think() {
                calls++;
                this._lastThinkUsedFallback = true;
                return '[soul] fallback';
            }
        };
        const pc = new PerpetualConsciousness({ brain, memory: null, chambers: null }, { thoughtFrequency: 5000 });
        await pc._generateThought();
        assert.strictEqual(pc._consecutiveBrainFailures, 1);
        pc._brainCooldownUntil = Date.now() + 60000;
        await pc._generateThought();
        assert.strictEqual(calls, 1);
        assert.strictEqual(pc._consecutiveBrainFailures, 1);
        pc.isRunning = true;
        await pc.updateState();
        assert.strictEqual(calls, 1);
    });

    await test('planner creates executable tool steps from JSON', async () => {
        const catalog = {
            compileForPrompt: () => 'read_file - Read a file',
            describe: name => name === 'read_file' ? { name } : null
        };
        const kernel = {
            toolCatalog: catalog,
            prompt: async () => JSON.stringify([{ description: 'Read package', tool: 'read_file', args: { path: 'package.json' }, acceptanceCriteria: 'File returned' }])
        };
        const executor = {
            async executeStep(step) {
                step.status = 'completed';
                step.result = { status: 'success' };
                return { status: 'completed' };
            }
        };
        const planning = new PlanningEngine(kernel, { executor });
        const plan = await planning.createPlan('Inspect package');
        assert.strictEqual(plan.steps[0].tool, 'read_file');
        const result = await planning.executePlan(plan);
        assert.strictEqual(result.success, true);
        assert.strictEqual(plan.status, 'completed');
    });

    await test('planner falls back to bounded project inspection', async () => {
        const planning = new PlanningEngine({ prompt: async () => '[soul] unavailable' });
        const plan = await planning.createPlan('Inspect project', { projectRoot: 'C:\\project' });
        assert.deepStrictEqual(plan.steps.map(step => step.tool), ['list_files', 'search_code']);
    });

    await test('goal engine persists and deduplicates autonomous goals', async () => {
        const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'gsk-goal-test-'));
        try {
            const engine = new GoalEngine({ goalsPath: path.join(dir, 'goals.json') });
            const first = engine.create('Inspect GSK', 'self_scan', { projectRoot: process.cwd() });
            const second = engine.create('Inspect GSK', 'self_scan');
            assert.strictEqual(first.id, second.id);
            engine.update(first.id, 'completed', { planId: 'plan-1' });
            assert.strictEqual(engine.list()[0].planId, 'plan-1');
        } finally {
            fs.rmSync(dir, { recursive: true, force: true });
        }
    });

    console.log(`\nRESULTS: ${passed} passed, ${failed} failed`);
    process.exit(failed ? 1 : 0);
})();
