'use strict';

const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { GraphEvolver } = require('../brain/graph_evolver.js');
const { PersistentMemoryLoop } = require('../brain/persistent_memory_loop.js');
const { HitlGate } = require('../governance/hitl_gate.js');
const shadcnComponent = require('../skills/shadcn_component.js');
const { CurriculumIngestion } = require('../brain/curriculum_ingestion.js');

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

const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'gsk-module-tests-'));

(async () => {
    // ── GraphEvolver ─────────────────────────────────────────────────
    const evolver = new GraphEvolver({}, { maxEvolutions: 3 });

    await test('GraphEvolver: evolves "manifest Heavens 2.0" → concrete UI component', async () => {
        const result = await evolver.evolveGoal('I desire to manifest a self-evolving, trans-dimensional Heavens 2.0 layer');
        assert.ok(result.evolvedGoal);
        assert.ok(result.evolvedGoal.includes('Build a concrete UI component'));
    });

    await test('GraphEvolver: evolves "living stone" → JavaScript function', async () => {
        const result = await evolver.evolveGoal('Manifest the living stone of the project');
        assert.ok(result.evolvedGoal);
        assert.ok(result.evolvedGoal.includes('JavaScript function') || result.evolvedGoal.includes('verifiable artifact'));
    });

    await test('GraphEvolver: evolves "cosmic pyramid" → JSON schema', async () => {
        const result = await evolver.evolveGoal('Manifest the cosmic pyramid library structure');
        assert.ok(result.evolvedGoal);
        assert.ok(result.evolvedGoal.includes('JSON schema'));
    });

    await test('GraphEvolver: applies multiple ladder stages', async () => {
        const result = await evolver.evolveGoal('Manifest the transcendent Heavens 2.0');
        assert.ok(result.evolutionStep >= 1);
    });

    await test('GraphEvolver: returns null when maxEvolutions reached', async () => {
        const e = new GraphEvolver({}, { maxEvolutions: 2 });
        await e.evolveGoal('manifest Heavens 2.0');
        await e.evolveGoal('manifest Heavens 2.0');
        const result = await e.evolveGoal('manifest Heavens 2.0');
        assert.strictEqual(result.evolvedGoal, null);
        assert.strictEqual(result.reason, 'max_evolutions_reached');
    });

    await test('GraphEvolver: records evolution in history', async () => {
        const goal = 'manifest the cosmic pyramid';
        const result = await evolver.evolveGoal(goal);
        const history = evolver._getGoalHistory(goal);
        assert.strictEqual(history.length, 1);
        assert.strictEqual(history[0].originalGoal, goal);
        assert.strictEqual(history[0].evolvedGoal, result.evolvedGoal);
    });

    await test('GraphEvolver: history is case-insensitive normalized', async () => {
        await evolver.evolveGoal('Manifest Heavens');
        const history = evolver._getGoalHistory('manifest heavens');
        assert.ok(history.length >= 1);
    });

    await test('GraphEvolver: shouldEvolve returns false for completed status', () => {
        assert.strictEqual(evolver.shouldEvolve('some goal', 'completed', 0), false);
    });

    await test('GraphEvolver: shouldEvolve returns false for null goal', () => {
        assert.strictEqual(evolver.shouldEvolve(null, 'failed', 1), false);
    });

    await test('GraphEvolver: shouldEvolve returns true for failed with history', async () => {
        const e = new GraphEvolver({}, { maxEvolutions: 5 });
        await e.evolveGoal('manifest the living stone');
        assert.strictEqual(e.shouldEvolve('manifest the living stone', 'failed', 1), true);
    });

    await test('GraphEvolver: shouldEvolve returns false when at maxEvolutions', async () => {
        const e = new GraphEvolver({}, { maxEvolutions: 1 });
        await e.evolveGoal('manifest cosmic pyramid');
        assert.strictEqual(e.shouldEvolve('manifest cosmic pyramid', 'failed', 1), false);
    });

    await test('GraphEvolver: _getGoalHistory returns empty for unknown goal', () => {
        assert.deepStrictEqual(evolver._getGoalHistory('unknown goal xyz'), []);
    });

    // ── PersistentMemoryLoop ─────────────────────────────────────────
    const memDir = path.join(tmpDir, 'pml');
    const pml = new PersistentMemoryLoop({}, { dataPath: memDir, rebuildInterval: 0 });

    await test('PersistentMemoryLoop: buildSummary handles empty dataDir', async () => {
        fs.mkdirSync(memDir, { recursive: true });
        const summary = await pml.buildSummary();
        assert.strictEqual(summary, '');
    });

    await test('PersistentMemoryLoop: buildSummary reads goals.json', async () => {
        const goalsPath = path.join(memDir, 'goals.json');
        fs.mkdirSync(memDir, { recursive: true });
        fs.writeFileSync(goalsPath, JSON.stringify([
            { title: 'Completed goal', status: 'completed' },
            { title: 'Failed goal', status: 'failed' },
            { title: 'Needs brain goal', status: 'needs_brain' },
        ]));
        // Reset cache
        pml.cache = { summary: '', timestamp: 0 };
        const summary = await pml.buildSummary();
        assert.ok(summary.includes('Completed goal'));
        assert.ok(summary.includes('Failed goal'));
        assert.ok(summary.includes('Needs brain goal'));
    });

    await test('PersistentMemoryLoop: buildSummary reads knowledge.jsonl', async () => {
        const knowledgePath = path.join(memDir, 'knowledge.jsonl');
        fs.writeFileSync(knowledgePath, [
            JSON.stringify({ topic: 'Web Stack', verified: true }),
            JSON.stringify({ topic: 'AI Agents', source: 'steward' }),
        ].join('\n'));
        pml.cache = { summary: '', timestamp: 0 };
        const summary = await pml.buildSummary();
        assert.ok(summary.includes('Web Stack'));
        assert.ok(summary.includes('AI Agents'));
    });

    await test('PersistentMemoryLoop: buildSummary reads journal.json', async () => {
        const journalPath = path.join(memDir, 'journal.json');
        fs.writeFileSync(journalPath, JSON.stringify({ title: 'Learned about Vite', topic: 'build tooling' }));
        pml.cache = { summary: '', timestamp: 0 };
        const summary = await pml.buildSummary();
        assert.ok(summary.includes('Learned about Vite'));
    });

    await test('PersistentMemoryLoop: buildSummary reads compiled_lessons.jsonl', async () => {
        const lessonsPath = path.join(memDir, 'compiled_lessons.jsonl');
        fs.writeFileSync(lessonsPath, JSON.stringify({ lesson: 'Always validate inputs' }));
        pml.cache = { summary: '', timestamp: 0 };
        const summary = await pml.buildSummary();
        assert.ok(summary.includes('Always validate inputs'));
    });

    await test('PersistentMemoryLoop: buildSummary caches result', async () => {
        pml.cache = { summary: 'cached content', timestamp: Date.now() };
        const summary = await pml.buildSummary();
        assert.strictEqual(summary, 'cached content');
    });

    await test('PersistentMemoryLoop: offloadOutput returns short strings unchanged', async () => {
        const result = await pml.offloadOutput('read_file', 'short output');
        assert.strictEqual(result, 'short output');
    });

    await test('PersistentMemoryLoop: offloadOutput stores long outputs to disk', async () => {
        const longOutput = 'A'.repeat(3000);
        const result = await pml.offloadOutput('shell', longOutput);
        assert.ok(result.includes('offloaded'));
        assert.ok(result.includes('3000'));
        // Verify file was written
        const offloadedDir = path.join(memDir, 'offloaded');
        const files = fs.readdirSync(offloadedDir);
        assert.ok(files.length > 0);
    });

    await test('PersistentMemoryLoop: offloadOutput handles JSON output', async () => {
        const result = await pml.offloadOutput('tool', { key: 'A'.repeat(2000) });
        assert.ok(result.includes('offloaded') || result.length > 0);
    });

    await test('PersistentMemoryLoop: _readJsonl handles missing file', () => {
        const results = pml._readJsonl(path.join(tmpDir, 'nonexistent.jsonl'));
        assert.deepStrictEqual(results, []);
    });

    await test('PersistentMemoryLoop: _readJsonlLines handles missing file', () => {
        const results = pml._readJsonlLines(path.join(tmpDir, 'nonexistent_lines.json'));
        assert.deepStrictEqual(results, []);
    });

    await test('PersistentMemoryLoop: _hash produces consistent output', () => {
        const hash1 = pml._hash('test string');
        const hash2 = pml._hash('test string');
        assert.strictEqual(hash1, hash2);
        assert.ok(hash1.length > 0);
    });

    // ── HitlGate ─────────────────────────────────────────────────────
    const hitlDir = path.join(tmpDir, 'hitl');
    const hitl = new HitlGate({}, { dataPath: hitlDir, timeoutMs: 1000 });

    await test('HitlGate: _assessRisk returns high for rejected spec', () => {
        const risk = hitl._assessRisk({ specStatus: 'rejected', steps: [], review: { score: 1.0 } });
        assert.strictEqual(risk, 'high');
    });

    await test('HitlGate: _assessRisk returns high for low review score', () => {
        const risk = hitl._assessRisk({ specStatus: 'passed', steps: [{ tool: 'read_file' }], review: { score: 0.2 } });
        assert.strictEqual(risk, 'high');
    });

    await test('HitlGate: _assessRisk returns high for risky tools', () => {
        const risk = hitl._assessRisk({ specStatus: 'passed', steps: [{ tool: 'write_file' }], review: { score: 0.9 } });
        assert.strictEqual(risk, 'high');
    });

    await test('HitlGate: _assessRisk returns high for shell_exec', () => {
        const risk = hitl._assessRisk({ specStatus: 'passed', steps: [{ tool: 'shell_exec' }], review: { score: 0.9 } });
        assert.strictEqual(risk, 'high');
    });

    await test('HitlGate: _assessRisk returns low for safe tools and good review', () => {
        const risk = hitl._assessRisk({ specStatus: 'passed', steps: [{ tool: 'list_files' }], review: { score: 0.9 } });
        assert.strictEqual(risk, 'low');
    });

    await test('HitlGate: _assessRisk returns medium for moderate review', () => {
        const risk = hitl._assessRisk({ specStatus: 'passed', steps: [{ tool: 'list_files' }], review: { score: 0.4 } });
        assert.strictEqual(risk, 'medium');
    });

    await test('HitlGate: _assessRisk handles missing review', () => {
        const risk = hitl._assessRisk({ specStatus: 'passed', steps: [{ tool: 'list_files' }] });
        assert.strictEqual(risk, 'high');
    });

    await test('HitlGate: requestApproval creates unique request IDs', async () => {
        const plan = {
            id: 'plan-1', goal: 'Test goal', steps: [{ description: 'Step 1', tool: 'read_file', args: {}, acceptanceCriteria: 'ok' }],
            specStatus: 'passed', review: { score: 0.9, status: 'approved' }
        };
        const id1 = await hitl.requestApproval(plan, { context: 'test' });
        const id2 = await hitl.requestApproval(plan, { context: 'test' });
        assert.ok(id1.startsWith('hitl_'));
        assert.ok(id1 !== id2);
    });

    await test('HitlGate: resolve updates request status', async () => {
        const plan = {
            id: 'plan-2', goal: 'Test goal 2', steps: [{ description: 'Step', tool: 'list_files', acceptanceCriteria: 'ok' }],
            specStatus: 'passed', review: { score: 0.9, status: 'approved' }
        };
        const requestId = await hitl.requestApproval(plan, {});
        const result = hitl.resolve(requestId, 'approved', { reason: 'test' });
        assert.strictEqual(result.decision, 'approved');
    });

    await test('HitlGate: resolve returns null for unknown request', () => {
        const result = hitl.resolve('hitl_nonexistent', 'approved', {});
        assert.strictEqual(result, null);
    });

    await test('HitlGate: waitForDecision resolves on resolve() call', async () => {
        const plan = {
            id: 'plan-3', goal: 'Test goal 3', steps: [{ description: 'Step', tool: 'list_files', acceptanceCriteria: 'ok' }],
            specStatus: 'passed', review: { score: 0.9, status: 'approved' }
        };
        const requestId = await hitl.requestApproval(plan, {});
        const waitPromise = hitl.waitForDecision(requestId);
        hitl.resolve(requestId, 'approved');
        const decision = await waitPromise;
        assert.strictEqual(decision.decision, 'approved');
    });

    await test('HitlGate: waitForDecision rejects on timeout', async () => {
        const plan = {
            id: 'plan-4', goal: 'Test goal 4', steps: [{ description: 'Step', tool: 'list_files', acceptanceCriteria: 'ok' }],
            specStatus: 'passed', review: { score: 0.9, status: 'approved' }
        };
        const requestId = await hitl.requestApproval(plan, {});
        const waitPromise = hitl.waitForDecision(requestId);
        try {
            await waitPromise;
            assert.fail('should have timed out');
        } catch (e) {
            // expected
        }
    });

    await test('HitlGate: enqueue/persist round-trips through queue file', () => {
        const req = { id: 'hitl_test1', planId: 'p1', goal: 'test', status: 'pending' };
        hitl._enqueue(req);
        const queue = hitl._readQueue();
        assert.ok(queue.find(r => r.id === 'hitl_test1'));
    });

    await test('HitlGate: auto-approves low-risk after timeout', async () => {
        const plan = {
            id: 'plan-5', goal: 'Read config', steps: [{ description: 'Read config', tool: 'read_file', acceptanceCriteria: 'ok' }],
            specStatus: 'passed', review: { score: 0.9, status: 'approved' }
        };
        // Use a very short timeout for this test
        const fastHitl = new HitlGate({}, { dataPath: path.join(tmpDir, 'hitl-fast'), timeoutMs: 100 });
        const requestId = await fastHitl.requestApproval(plan, {});
        // Wait for auto-approve
        await new Promise(r => setTimeout(r, 200));
        // The request should have been resolved
        const result = fastHitl.resolve(requestId, 'approved');
        // After timeout auto-approve, the entry should be removed from queue
        assert.strictEqual(result, null); // already resolved by auto-approve
    });

    // ── shadcn_component Skill ───────────────────────────────────────
    await test('shadcn_component: generates Button component files', async () => {
        const componentDir = path.join(tmpDir, 'shadcn-button');
        const result = await shadcnComponent.run({ component: 'Button', projectRoot: componentDir });
        assert.strictEqual(result.status, 'ok');
        assert.strictEqual(result.component, 'Button');
        assert.ok(result.paths.component);
        assert.ok(result.paths.test);
        assert.ok(fs.existsSync(result.paths.component));
        assert.ok(fs.existsSync(result.paths.test));
    });

    await test('shadcn_component: Button template has CVA variants', async () => {
        const componentDir = path.join(tmpDir, 'shadcn-button2');
        const result = await shadcnComponent.run({ component: 'Button', projectRoot: componentDir });
        const content = fs.readFileSync(result.paths.component, 'utf-8');
        assert.ok(content.includes('buttonVariants'));
        assert.ok(content.includes('cva'));
        assert.ok(content.includes('default'));
        assert.ok(content.includes('destructive'));
    });

    await test('shadcn_component: Button template has Radix Slot', async () => {
        const content = fs.readFileSync(path.join(tmpDir, 'shadcn-button/src/components/ui/button.tsx'), 'utf-8');
        assert.ok(content.includes('Slot'));
        assert.ok(content.includes('asChild'));
    });

    await test('shadcn_component: Button template uses cn() utility', async () => {
        const content = fs.readFileSync(path.join(tmpDir, 'shadcn-button/src/components/ui/button.tsx'), 'utf-8');
        assert.ok(content.includes('cn('));
    });

    await test('shadcn_component: generates Card component files', async () => {
        const componentDir = path.join(tmpDir, 'shadcn-card');
        const result = await shadcnComponent.run({ component: 'Card', projectRoot: componentDir });
        assert.strictEqual(result.status, 'ok');
        assert.strictEqual(result.component, 'Card');
        assert.ok(fs.existsSync(result.paths.component));
        assert.ok(fs.existsSync(result.paths.test));
    });

    await test('shadcn_component: Card template has Card, CardHeader, CardContent', async () => {
        const content = fs.readFileSync(path.join(tmpDir, 'shadcn-card/src/components/ui/card.tsx'), 'utf-8');
        assert.ok(content.includes('Card'));
        assert.ok(content.includes('CardHeader'));
        assert.ok(content.includes('CardContent'));
    });

    await test('shadcn_component: creates Vite project structure', async () => {
        const componentDir = path.join(tmpDir, 'shadcn-vite');
        await shadcnComponent.run({ component: 'Button', projectRoot: componentDir });
        assert.ok(fs.existsSync(path.join(componentDir, 'src/components/ui')));
        assert.ok(fs.existsSync(path.join(componentDir, 'src/lib')));
        assert.ok(fs.existsSync(path.join(componentDir, 'src/lib/utils.ts')));
        assert.ok(fs.existsSync(path.join(componentDir, 'package.json')));
        assert.ok(fs.existsSync(path.join(componentDir, 'tsconfig.json')));
    });

    await test('shadcn_component: package.json has correct dependencies', async () => {
        const pkg = JSON.parse(fs.readFileSync(path.join(tmpDir, 'shadcn-vite/package.json'), 'utf-8'));
        assert.strictEqual(pkg.name, 'gsk-shadcn-app');
        assert.ok(pkg.dependencies.react);
        assert.ok(pkg.devDependencies.vitest);
        assert.ok(pkg.devDependencies.tailwindcss);
    });

    await test('shadcn_component: utils.ts has cn() function', async () => {
        const utilsPath = path.join(tmpDir, 'shadcn-vite/src/lib/utils.ts');
        const content = fs.readFileSync(utilsPath, 'utf-8');
        assert.ok(content.includes('clsx'));
        assert.ok(content.includes('twMerge'));
        assert.ok(content.includes('cn('));
    });

    await test('shadcn_component: tsconfig has strict mode', async () => {
        const tsConfig = JSON.parse(fs.readFileSync(path.join(tmpDir, 'shadcn-vite/tsconfig.json'), 'utf-8'));
        assert.strictEqual(tsConfig.compilerOptions.strict, true);
    });

    await test('shadcn_component: returns error for unknown component', async () => {
        const result = await shadcnComponent.run({ component: 'NonExistent', projectRoot: path.join(tmpDir, 'unknown') });
        assert.strictEqual(result.status, 'error');
        assert.ok(result.error.includes('Unknown component'));
    });

    await test('shadcn_component: skips test file when includeTest is false', async () => {
        const componentDir = path.join(tmpDir, 'shadcn-no-test');
        const result = await shadcnComponent.run({ component: 'Button', projectRoot: componentDir, includeTest: false });
        assert.strictEqual(result.status, 'ok');
        assert.strictEqual(result.paths.test, null);
        assert.ok(fs.existsSync(result.paths.component));
    });

    await test('shadcn_component: test file imports testing-library', async () => {
        const testContent = fs.readFileSync(path.join(tmpDir, 'shadcn-button/src/__tests__/components/button.test.tsx'), 'utf-8');
        assert.ok(testContent.includes('testing-library'));
        assert.ok(testContent.includes('render'));
    });

    await test('shadcn_component: MANIFEST is properly exported', () => {
        assert.ok(shadcnComponent.MANIFEST);
        assert.strictEqual(shadcnComponent.MANIFEST.name, 'shadcn_component');
        assert.ok(shadcnComponent.MANIFEST.inputs.component);
        assert.ok(shadcnComponent.MANIFEST.plt_affinity);
    });

    await test('shadcn_component: PLT_AFFINITY included in results', async () => {
        const result = await shadcnComponent.run({ component: 'Button', projectRoot: path.join(tmpDir, 'shadcn-plt') });
        assert.ok(result.plt_affinity);
        assert.strictEqual(result.plt_affinity.total, 1.6);
    });

    // ── CurriculumIngestion ─────────────────────────────────────────
    const curriculumDir = path.join(tmpDir, 'curriculum');
    const ci = new CurriculumIngestion(curriculumDir);

    await test('CurriculumIngestion: _parseMkdocsNav handles top-level modules', () => {
        const yaml = `
nav:
  - 前言: "index.md"
  - 如何使用这本书: "guide.md"
`;
        const nav = ci._parseMkdocsNav(yaml);
        assert.strictEqual(nav.modules.length, 2);
        assert.strictEqual(nav.modules[0].name, '前言');
        assert.strictEqual(nav.modules[0].courses[0].path, 'index.md');
    });

    await test('CurriculumIngestion: _parseMkdocsNav handles submodules', () => {
        const yaml = `
nav:
  - 编程入门:
      - Python 语言:
          - UCB CS61A: "python/cs61a.md"
          - CS50P: "python/cs50p.md"
`;
        const nav = ci._parseMkdocsNav(yaml);
        assert.strictEqual(nav.modules.length, 1);
        assert.strictEqual(nav.modules[0].name, '编程入门');
        assert.strictEqual(nav.modules[0].submodules.length, 1);
        assert.strictEqual(nav.modules[0].submodules[0].name, 'Python 语言');
        assert.strictEqual(nav.modules[0].submodules[0].courses.length, 2);
    });

    await test('CurriculumIngestion: _parseMkdocsNav handles module with both courses and submodules', () => {
        const yaml = `
nav:
  - Web开发:
      - Full Stack: "web/fullstack.md"
      - React 进阶:
          - React Hooks: "web/hooks.md"
`;
        const nav = ci._parseMkdocsNav(yaml);
        assert.strictEqual(nav.modules.length, 1);
        assert.strictEqual(nav.modules[0].courses.length, 1);
        assert.strictEqual(nav.modules[0].submodules.length, 1);
        assert.strictEqual(nav.modules[0].submodules[0].courses.length, 1);
    });

    await test('CurriculumIngestion: getTopicsForModule returns filtered topics', () => {
        const yaml = `
nav:
  - Web Development:
      - Full Stack open: "web/fullstack.md"
      - Node.js: "web/node.md"
  - Artificial Intelligence:
      - CS50 AI: "ai/cs50.md"
`;
        // Write curriculum file
        const curriculum = { nav: ci._parseMkdocsNav(yaml) };
        fs.mkdirSync(curriculumDir, { recursive: true });
        fs.writeFileSync(path.join(curriculumDir, 'cs_curriculum.json'), JSON.stringify(curriculum));

        const topics = ci.getTopicsForModule('Web');
        assert.ok(topics.length >= 2);
        assert.ok(topics.some(t => t.includes('Full Stack')));
    });

    await test('CurriculumIngestion: getAllTopics returns all topics', () => {
        const topics = ci.getAllTopics();
        assert.ok(topics.length >= 3);
    });

    await test('CurriculumIngestion: getAllTopics filters by interests', () => {
        const aiTopics = ci.getAllTopics(['AI', 'Intelligence']);
        assert.ok(aiTopics.length > 0);
        assert.ok(aiTopics.some(t => t.includes('CS50 AI')));
    });

    await test('CurriculumIngestion: getAllTopics returns filtered subset', () => {
        const all = ci.getAllTopics();
        const ai = ci.getAllTopics(['Intelligence']);
        assert.ok(ai.length < all.length);
    });

    await test('CurriculumIngestion: _extractModules handles array nav', () => {
        const arrNav = [{ name: 'Module A', courses: [], submodules: [] }];
        assert.deepStrictEqual(ci._extractModules(arrNav), arrNav);
    });

    await test('CurriculumIngestion: _extractModules handles object nav', () => {
        const objNav = { modules: [{ name: 'Module B', courses: [], submodules: [] }] };
        assert.strictEqual(ci._extractModules(objNav).length, 1);
    });

    await test('CurriculumIngestion: _extractModules handles null nav', () => {
        assert.deepStrictEqual(ci._extractModules(null), []);
    });

    await test('CurriculumIngestion: _courseToTopic normalizes course names', () => {
        assert.strictEqual(
            ci._courseToTopic('UCB CS61B: Data Structures and Algorithms'),
            'UCB CS61B'
        );
        assert.strictEqual(
            ci._courseToTopic('MIT 6.006 (Intro to Algorithms)'),
            'MIT 6.006'
        );
    });

    await test('CurriculumIngestion: _countTopics counts courses + submodule courses', () => {
        const nav = { modules: [
            { courses: [{}, {}], submodules: [{ courses: [{}, {}] }] }
        ] };
        assert.strictEqual(ci._countTopics(nav), 4);
    });

    await test('CurriculumIngestion: _countTopics handles empty modules', () => {
        const nav = { modules: [] };
        assert.strictEqual(ci._countTopics(nav), 0);
    });

    await test('CurriculumIngestion: _loadCurriculum returns null for missing file', () => {
        const ci2 = new CurriculumIngestion(path.join(tmpDir, 'empty-curriculum'));
        assert.strictEqual(ci2._loadCurriculum(), null);
    });

    await test('CurriculumIngestion: refreshCurriculum handles fetch failure gracefully', async () => {
        const ci3 = new CurriculumIngestion(path.join(tmpDir, 'no-network'));
        // Mock _rawFetch to always fail
        ci3._rawFetch = async () => ({ ok: false, error: 'mock_failure' });
        const result = await ci3.refreshCurriculum(null);
        assert.strictEqual(result.status, 'error');
    });

    let ci4;
    await test('CurriculumIngestion: refreshCurriculum uses fetchProvider fallback', async () => {
        ci4 = new CurriculumIngestion(path.join(tmpDir, 'with-fallback'));
        // Mock _rawFetch to fail so fetchProvider is used
        ci4._rawFetch = async () => ({ ok: false, error: 'mock_failure' });
        const result = await ci4.refreshCurriculum(async (url) => {
            if (url.includes('mkdocs.yml')) {
                return { ok: true, text: 'site_name: Test\nnav:\n  - Test Module:\n      - Test Course: "test.md"\n' };
            }
            return { ok: false };
        });
        assert.strictEqual(result.status, 'success');
        assert.ok(result.modules >= 1);
    });

    await test('CurriculumIngestion: getAllTopics works after refreshCurriculum with fetchProvider', async () => {
        const topics = ci4.getAllTopics();
        assert.ok(topics.length > 0);
        assert.ok(topics.some(t => t.includes('Test Course')));
    });

    await test('CurriculumIngestion: navUrl points to correct GitHub source', () => {
        assert.ok(ci.navUrl.includes('PKUFlyingPig'));
        assert.ok(ci.navUrl.includes('cs-self-learning'));
        assert.ok(ci.navUrl.includes('mkdocs.yml'));
    });

    // ── Cross-module Integration: GraphEvolver → shadcn_component ─────────────────
    await test('Integration: GraphEvolves abstract goal, shadcn builds component', async () => {
        const evolved = await evolver.evolveGoal('Create a beautiful button component');
        assert.ok(evolved.evolvedGoal);
        // The evolved goal should mention "component" or "button"
        const componentName = evolved.evolvedGoal.includes('Button') ? 'Button' :
                              evolved.evolvedGoal.includes('Card') ? 'Card' : 'Button';
        const result = await shadcnComponent.run({ component: componentName, projectRoot: path.join(tmpDir, 'integration') });
        assert.strictEqual(result.status, 'ok');
        assert.ok(fs.existsSync(result.paths.component));
    });

    // Cleanup
    fs.rmSync(tmpDir, { recursive: true, force: true });

    console.log(`\nRESULTS: ${passed} passed, ${failed} failed`);
    process.exit(failed ? 1 : 0);
})();
