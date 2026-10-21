'use strict';

const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { PlanningEngine, Plan } = require('../brain/planning_engine.js');
const { DeepToolUse } = require('../brain/deep_tool_use.js');

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
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'gsk-dtu-'));
    const targetFile = path.join(dir, 'output.txt');

    // ── Alias resolution: bridge/TDD tool names → DeepToolUse tools ─
    await test('alias resolution maps bridge names onto DeepToolUse tools', () => {
        const planning = new PlanningEngine({ deepToolUse: new DeepToolUse({}) });
        assert.strictEqual(planning._resolveDeepToolUseTool('write_file'), 'file_write');
        assert.strictEqual(planning._resolveDeepToolUseTool('read_file'), 'file_read');
        assert.strictEqual(planning._resolveDeepToolUseTool('list_files'), 'file_list');
        assert.strictEqual(planning._resolveDeepToolUseTool('shell'), 'shell_exec');
        assert.strictEqual(planning._resolveDeepToolUseTool('run_command'), 'shell_exec');
        assert.strictEqual(planning._resolveDeepToolUseTool('run_safe_command'), 'shell_exec');
        assert.strictEqual(planning._resolveDeepToolUseTool('git_ops'), 'git_ops');
        assert.strictEqual(planning._resolveDeepToolUseTool('web_search'), 'web_search');
        assert.strictEqual(planning._resolveDeepToolUseTool('edit_file'), null);
        assert.strictEqual(planning._resolveDeepToolUseTool(null), null);
    });

    // ── (a) spec-gate steps route through DeepToolUse ──────────────
    await test('plan step with write_file executes via DeepToolUse', async () => {
        const dtu = new DeepToolUse({});
        const planning = new PlanningEngine({ deepToolUse: dtu });
        const plan = new Plan('Write a greeting file');
        plan.addStep('Write the greeting', [], 1, {
            tool: 'write_file',
            args: { path: targetFile, content: 'hello from deep tool use' },
            acceptanceCriteria: 'File is written'
        });
        const result = await planning.executePlan(plan);
        assert.strictEqual(result.success, true);
        assert.strictEqual(plan.status, 'completed');
        assert.strictEqual(plan.steps[0].executedBy, 'deepToolUse');
        assert.strictEqual(plan.steps[0].result.success, true);
        assert.strictEqual(fs.readFileSync(targetFile, 'utf8'), 'hello from deep tool use');
        // Landed in DeepToolUse execution history
        assert.ok(dtu.executionHistory.some(e => e.tool === 'file_write' && e.success), 'file_write should be in executionHistory');
    });

    await test('native tool names pass through unchanged', async () => {
        const planning = new PlanningEngine({ deepToolUse: new DeepToolUse({}) });
        const plan = new Plan('Read the greeting back');
        plan.addStep('Read the file', [], 1, {
            tool: 'file_read',
            args: { path: targetFile },
            acceptanceCriteria: 'Content is returned'
        });
        const result = await planning.executePlan(plan);
        assert.strictEqual(result.success, true);
        assert.strictEqual(plan.steps[0].executedBy, 'deepToolUse');
        assert.strictEqual(plan.steps[0].result.content, 'hello from deep tool use');
    });

    // ── (b) acceptance criteria verified after DeepToolUse execution ──
    await test('acceptance criteria verified after DeepToolUse execution', async () => {
        const planning = new PlanningEngine({ deepToolUse: new DeepToolUse({}) });
        const plan = new Plan('Verify file write');
        plan.addStep('Write verified content', [], 1, {
            tool: 'file_write',
            args: { path: path.join(dir, 'verify.txt'), content: 'verified' },
            acceptanceCriteria: 'File is written'
        });
        const result = await planning.executePlan(plan);
        assert.strictEqual(result.success, true);
        assert.strictEqual(plan.steps[0].verificationStatus, 'passed');
    });

    // ── (c) graceful failure ───────────────────────────────────────
    await test('failing tool step fails gracefully with clear error', async () => {
        const planning = new PlanningEngine({ deepToolUse: new DeepToolUse({}) });
        const plan = new Plan('Read a missing file');
        plan.addStep('Read nonexistent', [], 1, {
            tool: 'file_read',
            args: { path: path.join(dir, 'does-not-exist.txt') },
            acceptanceCriteria: 'Content is returned'
        });
        const result = await planning.executePlan(plan);
        assert.strictEqual(result.success, false);
        assert.strictEqual(plan.steps[0].status, 'failed');
        assert.ok(plan.steps[0].error, 'step should carry an error message');
        assert.ok(plan.steps[0].error.includes('Failed to read'), `error should be descriptive, got: ${plan.steps[0].error}`);
    });

    // ── unknown tools fall back to generic dispatch ────────────────
    await test('unknown tool falls back to generic dispatch', async () => {
        let dispatched = 0;
        const planning = new PlanningEngine({
            deepToolUse: new DeepToolUse({}),
            dispatch: async ({ description }) => {
                dispatched++;
                return { output: `dispatched: ${description}` };
            }
        });
        const plan = new Plan('Edit a file with a bridge-only tool');
        plan.addStep('Edit the config', [], 1, {
            tool: 'edit_file',
            args: { path: path.join(dir, 'config.json'), edit: 'x' },
            acceptanceCriteria: 'Edit applied'
        });
        const result = await planning.executePlan(plan);
        assert.strictEqual(result.success, true);
        assert.strictEqual(dispatched, 1);
        assert.strictEqual(plan.steps[0].result.output, 'dispatched: Edit the config');
    });

    // ── executor path still takes priority over DeepToolUse ────────
    await test('approved executor path still takes priority over DeepToolUse', async () => {
        const dtu = new DeepToolUse({});
        const planning = new PlanningEngine({ deepToolUse: dtu });
        let executorCalls = 0;
        planning.setExecutor({
            async executeStep(step) {
                executorCalls++;
                step.status = 'completed';
                step.result = { status: 'success', output: 'via executor' };
                return { status: 'completed' };
            }
        });
        const plan = new Plan('Write via executor');
        plan.addStep('Write the file', [], 1, {
            tool: 'write_file',
            args: { path: path.join(dir, 'executor.txt'), content: 'x' },
            acceptanceCriteria: 'File is written'
        });
        const result = await planning.executePlan(plan);
        assert.strictEqual(result.success, true);
        assert.strictEqual(executorCalls, 1);
        assert.strictEqual(plan.steps[0].result.output, 'via executor');
        assert.strictEqual(dtu.executionHistory.length, 0, 'DeepToolUse should not run when executor is present');
    });

    // ── kernel resolution ──────────────────────────────────────────
    await test('_getDeepToolUse resolves via direct kernel reference', () => {
        const dtu = new DeepToolUse({});
        const planning = new PlanningEngine({ deepToolUse: dtu });
        assert.strictEqual(planning._getDeepToolUse(), dtu);
    });

    await test('_getDeepToolUse resolves via fusion systems backdoor', () => {
        const dtu = new DeepToolUse({});
        const planning = new PlanningEngine({ fusion: { systems: { deepToolUse: dtu } } });
        assert.strictEqual(planning._getDeepToolUse(), dtu);
    });

    console.log(`\nDeepToolUse Integration: ${passed} passed, ${failed} failed`);
    process.exit(failed ? 1 : 0);
})();
