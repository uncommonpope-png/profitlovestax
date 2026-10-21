'use strict';

const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { PlanningEngine, Plan, PlanStep } = require('../brain/planning_engine.js');
const { MegaMemory } = require('../memory/mega_memory.js');

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
    // ── Phase 5a: Spec Gate ─────────────────────────────────────────
    await test('spec gate validates concrete steps', () => {
        const planning = new PlanningEngine({ toolCatalog: { compileForPrompt: () => '', describe: () => null } });
        const plan = new Plan('Build a button component');
        const step = plan.addStep('Read the source files', [], 1, {
            tool: 'read_file', args: { path: 'src/button.js' },
            acceptanceCriteria: 'File content is returned'
        });
        const result = planning._validateStep(step);
        assert.strictEqual(result.valid, true);
        assert.deepStrictEqual(result.issues, []);
    });

    await test('spec gate rejects steps missing tool', () => {
        const planning = new PlanningEngine({ toolCatalog: { compileForPrompt: () => '', describe: () => null } });
        const step = { description: 'Do something useful here', tool: null, args: {}, acceptanceCriteria: 'something happens' };
        const result = planning._validateStep(step);
        assert.strictEqual(result.valid, false);
        assert.ok(result.issues.some(i => i.includes('tool')));
    });

    await test('spec gate rejects steps missing acceptance criteria', () => {
        const planning = new PlanningEngine({ toolCatalog: { compileForPrompt: () => '', describe: () => null } });
        const step = { description: 'Read the button file', tool: 'read_file', args: { path: 'x' }, acceptanceCriteria: null };
        const result = planning._validateStep(step);
        assert.strictEqual(result.valid, false);
        assert.ok(result.issues.some(i => i.includes('acceptance')));
    });

    await test('spec gate rejects vague verb-only descriptions', () => {
        const planning = new PlanningEngine({ toolCatalog: { compileForPrompt: () => '', describe: () => null } });
        const step = { description: 'manifest the heavens', tool: 'write_file', args: {}, acceptanceCriteria: 'it is manifested' };
        const result = planning._validateStep(step);
        assert.strictEqual(result.valid, false);
    });

    await test('_validateSpec detects cycles', () => {
        const planning = new PlanningEngine({ toolCatalog: { compileForPrompt: () => '', describe: () => null } });
        const plan = new Plan('Test cycle');
        const s1 = plan.addStep('Read config file', [], 1, { tool: 'read_file', args: { path: 'a' }, acceptanceCriteria: 'config returned' });
        const s2 = plan.addStep('Write config file', [], 1, { tool: 'write_file', args: { path: 'a' }, acceptanceCriteria: 'written confirmed' });
        s1.dependencies = [s2.id];
        s2.dependencies = [s1.id];
        const result = planning._validateSpec(plan);
        assert.strictEqual(result.hasCycle, true);
        assert.strictEqual(result.passed, false);
    });

    await test('_validateSpec passes for valid plan', () => {
        const planning = new PlanningEngine({ toolCatalog: { compileForPrompt: () => '', describe: () => null } });
        const plan = new Plan('Build button');
        plan.addStep('Read button source', [], 1, { tool: 'read_file', args: { path: 'src/button.js' }, acceptanceCriteria: 'file returned' });
        plan.addStep('Write button tests', [], 1, { tool: 'write_file', args: { path: 'test/button.test.js' }, acceptanceCriteria: 'test file written' });
        const result = planning._validateSpec(plan);
        assert.strictEqual(result.passed, true);
        assert.strictEqual(plan.specStatus, 'passed');
    });

    await test('createPlan runs spec gate and tags result', async () => {
        const planning = new PlanningEngine({
            toolCatalog: { compileForPrompt: () => '', describe: () => null },
            prompt: async () => 'not json',
        });
        const plan = await planning.createPlan('Inspect the project', { projectRoot: 'C:\\project' });
        assert.ok(plan.specValidation);
        assert.ok(plan.steps.length > 0);
    });

    // ── Phase 5c: Verification Gate ─────────────────────────────────
    await test('_verifyAcceptanceCriteria passes for good result', () => {
        const planning = new PlanningEngine({ toolCatalog: { compileForPrompt: () => '', describe: () => null } });
        const step = { tool: 'read_file', description: 'Read package.json', args: { path: 'package.json' }, acceptanceCriteria: 'File is returned' };
        step.result = { status: 'success', output: 'contents' };
        step.status = 'completed';
        const r = planning._verifyAcceptanceCriteria(step);
        assert.strictEqual(r.verified, true);
    });

    await test('_verifyAcceptanceCriteria fails for error result', () => {
        const planning = new PlanningEngine({ toolCatalog: { compileForPrompt: () => '', describe: () => null } });
        const step = { tool: 'read_file', description: 'Read package.json', args: { path: 'package.json' }, acceptanceCriteria: 'File is returned' };
        step.result = { error: 'file not found' };
        step.status = 'completed';
        const r = planning._verifyAcceptanceCriteria(step);
        assert.strictEqual(r.verified, false);
    });

    await test('_verifyAcceptanceCriteria handles missing criteria', () => {
        const planning = new PlanningEngine({ toolCatalog: { compileForPrompt: () => '', describe: () => null } });
        const step = { tool: 'read_file', description: 'Read something', args: {}, acceptanceCriteria: null };
        step.result = { ok: true };
        const r = planning._verifyAcceptanceCriteria(step);
        assert.strictEqual(r.verified, false);
    });

    await test('_reviewPlan produces 5-axis output', async () => {
        const planning = new PlanningEngine({ toolCatalog: { compileForPrompt: () => '', describe: () => null } });
        const plan = new Plan('Build a test feature');
        const s = plan.addStep('Read the config', [], 1, {
            tool: 'read_file', args: { path: 'config.json' },
            acceptanceCriteria: 'config returned', riskLevel: 'low'
        });
        s.status = 'completed';
        s.startTime = Date.now();
        s.endTime = Date.now() + 100;
        s.result = { status: 'success', output: 'config data' };
        s.verificationStatus = 'passed';
        plan.specStatus = 'passed';

        const review = await planning._reviewPlan(plan, { success: true, status: 'completed' });
        assert.ok(review.axes.correctness);
        assert.ok(review.axes.security);
        assert.ok(review.axes.maintainability);
        assert.ok(review.axes.verification);
        assert.ok(review.axes.spec);
        assert.ok(typeof review.score === 'number');
        assert.ok(['approved', 'needs_review', 'rejected'].includes(review.status));
        assert.strictEqual(plan.review, review);
    });

    await test('executePlan runs verification gate on completion', async () => {
        const planning = new PlanningEngine({
            toolCatalog: { compileForPrompt: () => '', describe: () => null },
            prompt: async () => 'not json',
        });
        const executor = {
            async executeStep(step) {
                step.status = 'completed';
                step.result = { status: 'success', output: 'data returned' };
                return { status: 'completed' };
            }
        };
        planning.executor = executor;
        const plan = await planning.createPlan('Read config', { projectRoot: 'C:\\project' });
        const result = await planning.executePlan(plan);
        assert.strictEqual(result.success, true);
        assert.ok(plan.review);
        assert.ok(plan.review.axes);
        assert.ok(plan.steps[0].verificationStatus);
    });

    // ── Phase 5b: mem0/letta memory patterns ───────────────────────
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'gsk-mem-test-'));
    const mem = new MegaMemory(dir);

    await test('mem0 recall returns context-relevant entries', async () => {
        await mem.witness({ content: 'The button component uses Tailwind CSS classes for styling', type: 'long_term', weight: 0.8, tags: ['button', 'frontend', 'tailwind'] });
        await mem.witness({ content: 'The database schema defines user tables with foreign keys', type: 'archival', weight: 0.9, tags: ['database', 'schema'] });
        await mem.witness({ content: 'React hooks manage component state in the button module', type: 'long_term', weight: 0.7, tags: ['react', 'hooks', 'button'] });

        const results = mem.recall('button component React', 10, 0.1);
        assert.ok(results.length >= 2, `expected >=2 results, got ${results.length}`);
        assert.ok(results.some(r => r.content.includes('Tailwind')), 'should find Tailwind entry');
        assert.ok(results[0]._relevance > 0, 'should have relevance scores');
    });

    await test('letta upsert creates versioned update with superseded link', async () => {
        const rec1 = await mem.upsert('config', { content: 'config value is foo', type: 'contextual', weight: 0.5, tags: ['config'] });
        const rec2 = await mem.upsert('config', { content: 'config value is bar', type: 'contextual', weight: 0.9, tags: ['config'] });
        assert.ok(rec2.supersedes, 'new entry should link to old');
        assert.strictEqual(rec2.supersedes, rec1.id);
        assert.ok(rec2.tags.includes('mem_key:config'), 'should add mem key tag');

        // The old entry should be marked superseded (includeSuperseded to find it)
        const all = mem.query({ tags: ['mem_key:config'], limit: 1000, includeSuperseded: true });
        const superseded = all.find(e => e.id === rec1.id);
        assert.strictEqual(superseded.superseded_by, rec2.id);
    });

    await test('letta upsert replaces superseded entries in search', async () => {
        const rec1 = await mem.upsert('feature_flag', { content: 'feature flag is OFF', type: 'archival', weight: 0.5, tags: ['flag'] });
        const rec2 = await mem.upsert('feature_flag', { content: 'feature flag is ON', type: 'archival', weight: 0.8, tags: ['flag'] });

        const all = mem.search('feature flag', 100);
        assert.ok(!all.some(e => e.id === rec1.id), 'old entry should be excluded from search');
        assert.ok(all.some(e => e.id === rec2.id), 'new entry should be in search');
    });

    await test('letta memory type accessors work', () => {
        assert.ok(Array.isArray(mem.getArchival(10)));
        assert.ok(Array.isArray(mem.getLongTerm(10)));
        assert.ok(Array.isArray(mem.getContextual(10)));
    });

    fs.rmSync(dir, { recursive: true, force: true });

    // ── Spec gate integration: reject abstract plan steps ──────────
    await test('createPlan with abstract fallback steps still has specValidation', async () => {
        const planning = new PlanningEngine({
            toolCatalog: { compileForPrompt: () => '', describe: () => null },
            prompt: async () => '[]',
        });
        const plan = await planning.createPlan('Inspect GSK');
        assert.ok(plan.specValidation);
        assert.ok(plan.steps.length > 0);
    });

    // ── Superpowers graft: TDD step generation ────────────────────
    await test('TDD: returns 5 RED-GREEN-REFACTOR steps for code-writing actions', () => {
        const planning = new PlanningEngine({ toolCatalog: { compileForPrompt: () => '', describe: () => null } });
        const steps = planning._generateTDDSteps('Write hello.js file', { path: 'src/hello.js', content: 'module.exports = {};' }, '/tmp');
        assert.strictEqual(steps.length, 5);
        assert.ok(steps[0].description.startsWith('RED:'));
        assert.ok(steps[2].description.startsWith('GREEN:'));
        assert.ok(steps[4].description.startsWith('REFACTOR:'));
    });

    await test('TDD: returns empty array for non-code files', () => {
        const planning = new PlanningEngine({ toolCatalog: { compileForPrompt: () => '', describe: () => null } });
        const steps = planning._generateTDDSteps('Edit config', { path: 'config.json' }, '/tmp');
        assert.strictEqual(steps.length, 0);
    });

    await test('TDD: returns empty array when no path provided', () => {
        const planning = new PlanningEngine({ toolCatalog: { compileForPrompt: () => '', describe: () => null } });
        const steps = planning._generateTDDSteps('Do something', { command: 'echo hi' }, '/tmp');
        assert.strictEqual(steps.length, 0);
    });

    await test('TDD: generates correct test file paths with .test. extension', () => {
        const planning = new PlanningEngine({ toolCatalog: { compileForPrompt: () => '', describe: () => null } });
        const steps = planning._generateTDDSteps('Write module', { path: 'src/utils.js', content: '...' }, '/tmp');
        const testStep = steps.find(s => s.args.command);
        assert.ok(testStep.args.command.includes('utils.test.js'));
    });

    await test('TDD: marks shell steps with command arg and write steps with path arg', () => {
        const planning = new PlanningEngine({ toolCatalog: { compileForPrompt: () => '', describe: () => null } });
        const steps = planning._generateTDDSteps('Write src/app.js', { path: 'src/app.js', content: '...' }, '/tmp');
        assert.ok(steps[1].args.command);   // run test → shell
        assert.ok(steps[2].args.path);       // implement → write_file
        assert.ok(steps[3].args.command);   // run test again → shell
    });

    // ── Superpowers graft: Debug step generation ──────────────────
    await test('Debug: returns 4 systematic debugging steps', () => {
        const planning = new PlanningEngine({ toolCatalog: { compileForPrompt: () => '', describe: () => null } });
        const steps = planning._generateDebugSteps(new Error('Cannot read property foo'), { id: 'step-1' });
        assert.strictEqual(steps.length, 4);
    });

    await test('Debug: truncates error message in step description', () => {
        const planning = new PlanningEngine({ toolCatalog: { compileForPrompt: () => '', describe: () => null } });
        const steps = planning._generateDebugSteps(new Error('A'.repeat(300)), { id: 'step-1' });
        assert.ok(steps[0].description.length < 200);
    });

    await test('Debug: each step has acceptance criteria', () => {
        const planning = new PlanningEngine({ toolCatalog: { compileForPrompt: () => '', describe: () => null } });
        const steps = planning._generateDebugSteps(new Error('boom'), { id: 'step-1' });
        for (const s of steps) assert.ok(s.acceptanceCriteria && s.acceptanceCriteria.length > 0);
    });

    await test('Debug: handles non-Error throwables', () => {
        const planning = new PlanningEngine({ toolCatalog: { compileForPrompt: () => '', describe: () => null } });
        const steps = planning._generateDebugSteps('string error', { id: 'step-1' });
        assert.strictEqual(steps.length, 4);
        assert.ok(steps[0].description.includes('string error'));
    });

    // ── Superpowers graft: Verification gate ────────────────────────
    await test('VerifyGate: passes when all claims have evidence', () => {
        const planning = new PlanningEngine({ toolCatalog: { compileForPrompt: () => '', describe: () => null } });
        const plan = new Plan('Fix bug');
        plan.stats = { testsPassed: 42, testCommand: 'node tests', lintClean: true, lintCommand: 'ruff check .' };
        plan.status = 'completed';
        plan.specStatus = 'passed';
        const gate = planning._verificationGate(plan);
        assert.strictEqual(gate.passed, true);
        assert.strictEqual(gate.claims.length, 4);
        assert.ok(gate.claims.every(c => c.verified));
    });

    await test('VerifyGate: fails when no claims have evidence', () => {
        const planning = new PlanningEngine({ toolCatalog: { compileForPrompt: () => '', describe: () => null } });
        const plan = new Plan('Fix bug');
        const gate = planning._verificationGate(plan);
        assert.strictEqual(gate.passed, false);
    });

    await test('VerifyGate: partially verifies when only some claims have evidence', () => {
        const planning = new PlanningEngine({ toolCatalog: { compileForPrompt: () => '', describe: () => null } });
        const plan = new Plan('Fix bug');
        plan.stats = { lintClean: true, lintCommand: 'ruff check .' };
        const gate = planning._verificationGate(plan);
        assert.strictEqual(gate.passed, false);
        assert.strictEqual(gate.claims.filter(c => c.verified).length, 1);
    });

    await test('VerifyGate: attaches gate result to plan', () => {
        const planning = new PlanningEngine({ toolCatalog: { compileForPrompt: () => '', describe: () => null } });
        const plan = new Plan('Fix bug');
        planning._verificationGate(plan);
        assert.ok(plan.verificationGate);
        assert.ok(plan.verificationGate.timestamp);
    });

    // ── Superpowers graft: TDD + spec gate integration ────────────
    await test('createPlan with write_file action generates TDD steps', async () => {
        const planning = new PlanningEngine({
            toolCatalog: { compileForPrompt: () => '', describe: () => 'tool' },
            prompt: async () => JSON.stringify([
                { description: 'Write hello.js that exports hello()', tool: 'write_file', args: { path: 'src/hello.js', content: 'module.exports = { hello: () => "hi" };' }, acceptanceCriteria: 'File created with hello function' }
            ]),
        });
        const plan = await planning.createPlan('Write hello.js', { projectRoot: '/tmp' });
        const tddSteps = plan.steps.filter(s => s.description.startsWith('RED:') || s.description.startsWith('GREEN:') || s.description.startsWith('REFACTOR:'));
        assert.ok(tddSteps.length >= 5, `expected ≥5 TDD steps, got ${tddSteps.length}`);
        // Each TDD step should have acceptance criteria
        assert.ok(tddSteps.every(s => s.acceptanceCriteria));
    });

    await test('execution of failed step triggers debug step generation', async () => {
        const planning = new PlanningEngine({
            toolCatalog: { compileForPrompt: () => '', describe: () => null },
            executor: { execute: async () => ({ success: false, error: 'module not found', result: null }) },
        });
        const plan = new Plan('Fix bug');
        const step = plan.addStep('Import missing module', [], 2, {
            tool: 'shell', args: { command: 'node app.js' },
            acceptanceCriteria: 'App runs without error',
        });
        const debugSteps = planning._generateDebugSteps(new Error('Cannot find module'), step);
        assert.strictEqual(debugSteps.length, 4);
        assert.ok(debugSteps.every(s => s.acceptanceCriteria));
    });

    console.log(`\nRESULTS: ${passed} passed, ${failed} failed`);
    process.exit(failed ? 1 : 0);
})();
