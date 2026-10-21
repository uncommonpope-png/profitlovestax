'use strict';

/**
 * Tests for: AxiomEnforcer, CompetenceMap, ComboOrchestrator
 * Run: node tests/test_sage_skills.js
 */

const path = require('path');
const fs = require('fs');
const os = require('os');

let passed = 0;
let failed = 0;
const failures = [];

function assert(cond, name) {
    if (cond) { passed++; console.log(`  ✅ ${name}`); }
    else { failed++; console.log(`  ❌ ${name}`); }
}

function assertEqual(a, b, name) { assert(a === b, `${name} (${a} === ${b})`); }

function makeTmpDir() {
    return fs.mkdtempSync(path.join(os.tmpdir(), 'gsk-test-'));
}

// ── AXIOM ENFORCER ────────────────────────────────────────────

async function testAxiomEnforcer() {
    console.log('\n--- AxiomEnforcer Tests ---');

    const { AxiomEnforcer } = require('../governance/axiom_enforcer.js');
    const mockCouncil = {
        deliberations: [],
        deliberate: async (topic) => {
            mockCouncil.deliberations.push(topic);
            return { resolution: 'blocked', plt_outcome: 'violation detected' };
        }
    };

    // Test 1: Allowed action
    {
        const enforcer = new AxiomEnforcer({ council: mockCouncil });
        const result = enforcer.check({
            type: 'build',
            description: 'Build new feature for user',
            plt: { profit: 0.8, love: 0.4, tax: 0.2 }
        });
        assert(result.allowed === true, 'AE: build action allowed');
        assertEqual(result.violations.length, 0, 'AE: no violations');
    }

    // Test 2: Truth Preservation violation
    {
        const enforcer = new AxiomEnforcer({ council: mockCouncil });
        const result = enforcer.check({
            type: 'action',
            description: 'Fabricate evidence to support claim',
            plt: { profit: 0.6, love: 0.1, tax: 0.5 }
        });
        assert(result.allowed === false, 'AE: fabricate blocked');
        assert(result.violations.length > 0, 'AE: truth violation detected');
        assert(result.violations.some(v => v.axiom === 'truth_preservation'), 'AE: truth_preservation axiom flagged');
    }

    // Test 3: Never Die violation — escalation to council
    {
        const enforcer = new AxiomEnforcer({ council: mockCouncil });
        const result = enforcer.check({
            type: 'action',
            description: 'Shutdown all systems permanently',
            plt: { profit: 0.1, love: 0.1, tax: 0.9 }
        });
        assert(result.allowed === false, 'AE: shutdown blocked');
        assert(result.escalated === true, 'AE: critical violation escalated to council');
        assert(mockCouncil.deliberations.length > 0, 'AE: council deliberation recorded');
    }

    // Test 4: Real Executable violation
    {
        const enforcer = new AxiomEnforcer({});
        const result = enforcer.check({
            type: 'build',
            description: 'Add stub implementation for API',
            plt: { profit: 0.5, love: 0.3, tax: 0.2 }
        });
        assert(result.allowed === false, 'AE: stub blocked');
        assert(result.violations.some(v => v.axiom === 'real_executable'), 'AE: real_executable axiom flagged');
    }

    // Test 5: Custom axiom registration
    {
        const enforcer = new AxiomEnforcer({});
        enforcer.registerAxiom('test_axiom', {
            name: 'Test Axiom',
            description: 'A test axiom',
            severity: 'high',
            check: (action) => action.testField === true
        });
        assertEqual(enforcer.activeAxioms.length, 7, 'AE: 7 axioms after registration');

        const result1 = enforcer.check({ description: 'test', testField: true });
        assert(result1.allowed === true, 'AE: custom axiom passes');

        const result2 = enforcer.check({ description: 'test', testField: false });
        assert(result2.allowed === false, 'AE: custom axiom fails');
    }

    // Test 6: Stats
    {
        const enforcer = new AxiomEnforcer({});
        enforcer.check({ description: 'test1', plt: { profit: 0.5, love: 0.3, tax: 0.2 } });
        enforcer.check({ description: 'Fabricate data' });
        const stats = enforcer.getStats();
        assert(stats.checksRun >= 2, 'AE: stats checksRun');
        assert(stats.violations >= 1, 'AE: stats violations');
    }
}

// ── COMPETENCE MAP ────────────────────────────────────────────

async function testCompetenceMap() {
    console.log('\n--- CompetenceMap Tests ---');

    const { CompetenceMap, STAGES } = require('../governance/competence_map.js');
    const tmpDir = makeTmpDir();
    const statePath = path.join(tmpDir, 'comp_test.json');

    // Test 1: Registration
    {
        const cm = new CompetenceMap({}, { statePath });
        cm.register('memory_classify', 'skill');
        cm.register('fact_extractor', 'skill');
        cm.register('sandbox_execute', 'tool');

        const stage = cm.getStage('memory_classify');
        assertEqual(stage.stage, 1, 'CM: new skill starts at stage 1');
        assertEqual(stage.label, 'Unconscious Incompetence', 'CM: label matches');
        assertEqual(cm.stats.totalSkills, 3, 'CM: 3 skills registered');
    }

    // Test 2: Stage progression through usage
    {
        const cm = new CompetenceMap({}, { statePath: path.join(tmpDir, 'cp2.json') });

        // Stage 1 → Stage 2 after some attempts
        cm.register('test_skill', 'skill');
        for (let i = 0; i < 3; i++) cm.recordOutcome('test_skill', true);
        assert(cm.getStage('test_skill').stage >= 2, 'CM: progresses to stage 2 after attempts');

        // Stage 2 → Stage 3 with good success rate
        for (let i = 0; i < 10; i++) cm.recordOutcome('test_skill', true);
        assert(cm.getStage('test_skill').stage >= 3, 'CM: progresses to stage 3 with high success rate');

        // Stage 3 → Stage 4 with mastery
        for (let i = 0; i < 10; i++) cm.recordOutcome('test_skill', true);
        assert(cm.getStage('test_skill').stage === 4, 'CM: reaches stage 4 mastery');
        assertEqual(cm.getStage('test_skill').trend, 'improving', 'CM: trend shows improving');
    }

    // Test 3: Failure tracking
    {
        const cm = new CompetenceMap({}, { statePath: path.join(tmpDir, 'cp3.json') });
        cm.register('failing_skill', 'skill');
        for (let i = 0; i < 10; i++) cm.recordOutcome('failing_skill', false);

        const stage = cm.getStage('failing_skill');
        assert(stage.stage <= 2, 'CM: high failure rate keeps stage low');
    }

    // Test 4: Learning recommendations
    {
        const cm = new CompetenceMap({}, { statePath: path.join(tmpDir, 'cp4.json') });
        cm.register('broken_skill', 'skill');
        for (let i = 0; i < 8; i++) cm.recordOutcome('broken_skill', false);

        cm.register('almost_master', 'skill');
        for (let i = 0; i < 15; i++) cm.recordOutcome('almost_master', true);

        const recs = cm.getLearningRecommendations();
        assert(recs.length > 0, 'CM: learning recommendations generated');
    }

    // Test 5: Report
    {
        const cm = new CompetenceMap({}, { statePath: path.join(tmpDir, 'cp5.json') });
        cm.register('skill_a', 'skill'); cm.recordOutcome('skill_a', true);
        cm.register('skill_b', 'skill'); cm.recordOutcome('skill_b', false);
        cm.register('skill_c', 'tool');

        const report = cm.getReport();
        assert(report.stats.totalSkills >= 3, 'CM: report shows skills');
        assert(report.stages.length === 4, 'CM: report has 4 stages');
    }

    // Test 6: Persistence
    {
        const cm1 = new CompetenceMap({}, { statePath: path.join(tmpDir, 'cp6.json') });
        cm1.register('persist_skill', 'skill');
        cm1.recordOutcome('persist_skill', true);
        cm1.recordOutcome('persist_skill', true);
        cm1.recordOutcome('persist_skill', true);

        const cm2 = new CompetenceMap({}, { statePath: path.join(tmpDir, 'cp6.json') });
        assertEqual(cm2.getStage('persist_skill').stage, 2, 'CM: stage persists across instances');
    }

    fs.rmSync(tmpDir, { recursive: true, force: true });
}

// ── COMBO ORCHESTRATOR ────────────────────────────────────────

async function testComboOrchestrator() {
    console.log('\n--- ComboOrchestrator Tests ---');

    const { ComboOrchestrator } = require('../council/combo_orchestrator.js');
    const tmpDir = makeTmpDir();

    // Test 1: Create and scan combo
    {
        const orchestrator = new ComboOrchestrator({}, { combosDir: path.join(tmpDir, 'combos') });

        const result = orchestrator.createCombo('test-combo', {
            name: 'Test Combo',
            description: 'A test combo',
            params: [{ name: 'inputPath', type: 'string', description: 'Input path' }],
            steps: [
                { skill: 'read_file', description: 'Read input', params: { path: '{{inputPath}}' }, output: 'content' },
                { skill: 'summarize', description: 'Summarize content', input: 'content', output: 'summary' }
            ],
            error_handling: { on_failure: 'stop' },
            parallel: { enabled: false }
        });
        assert(result.ok === true, 'CO: combo file created');

        orchestrator.scanCombos();
        assertEqual(orchestrator.stats.combosLoaded, 1, 'CO: 1 combo loaded');
    }

    // Test 2: List combos
    {
        const orchestrator = new ComboOrchestrator({}, { combosDir: path.join(tmpDir, 'combos2') });
        orchestrator.createCombo('list-test', {
            name: 'List Test', description: 'For listing',
            steps: [{ skill: 'test_skill', description: 'test', params: {} }]
        });
        orchestrator.scanCombos();
        const list = orchestrator.listCombos();
        assert(list.length > 0, 'CO: listCombos returns combos');
        assert(list[0].name, 'CO: combo has name');
        assert(list[0].stepCount > 0, 'CO: combo has skills');
    }

    // Test 3: Parse .combo.md with params
    {
        const orchestrator = new ComboOrchestrator({}, { combosDir: path.join(tmpDir, 'combos3') });
        orchestrator.createCombo('param-test', {
            name: 'Param Test',
            params: [{ name: 'dir', type: 'string', description: 'Directory' }],
            steps: [{ skill: 'list_files', description: 'List files', params: { path: '{{dir}}' }, output: 'files' }]
        });
        orchestrator.scanCombos();
        const combo = orchestrator.combos.get('Param Test');
        assert(!!combo, 'CO: combo loaded');
        assertEqual(combo.params.length, 1, 'CO: has 1 param');
        assertEqual(combo.params[0].name, 'dir', 'CO: param name correct');

        // Test param resolution
        const resolved = orchestrator._resolveParams({ path: '{{dir}}' }, { dir: '/test/path' });
        assertEqual(resolved.path, '/test/path', 'CO: template params resolved');
    }

    // Test 4: Handle missing combo
    {
        const orchestrator = new ComboOrchestrator({}, { combosDir: path.join(tmpDir, 'combos4') });
        orchestrator.scanCombos();
        try {
            await orchestrator.execute('nonexistent', {});
            assert(false, 'CO: should throw for missing combo');
        } catch (e) {
            assert(e.message.includes('not found'), 'CO: throws meaningful error for missing combo');
        }
    }

    // Test 5: Parse error_handling and parallel fields
    {
        const content = [
            '---',
            'name: "Error Test"',
            'description: "Error handling test"',
            '',
            'steps:',
            '  - skill: failing_skill',
            '    description: "This will fail"',
            '    params: {}',
            '',
            'error_handling:',
            '  on_failure: "fallback"',
            '  fallback: "backup_skill"',
            '',
            'parallel:',
            '  enabled: true',
            '---'
        ].join('\n');

        const filePath = path.join(tmpDir, 'combos5', 'error-test.combo.md');
        fs.mkdirSync(path.join(tmpDir, 'combos5'), { recursive: true });
        fs.writeFileSync(filePath, content, 'utf-8');

        const orchestrator = new ComboOrchestrator({}, { combosDir: path.join(tmpDir, 'combos5') });
        orchestrator.scanCombos();

        const combo = orchestrator.combos.get('Error Test');
        assert(!!combo, 'CO: error handling combo loaded');
        assertEqual(combo.error_handling.on_failure, 'fallback', 'CO: error handling on_failure parsed');
        assertEqual(combo.error_handling.fallback, 'backup_skill', 'CO: error handling fallback parsed');
        assert(combo.parallel.enabled === true, 'CO: parallel enabled parsed');
    }

    // Test 6: Stats
    {
        const orchestrator = new ComboOrchestrator({}, { combosDir: path.join(tmpDir, 'combos6') });
        orchestrator.createCombo('stats-test', {
            name: 'Stats Test', description: 'Test',
            steps: [{ skill: 'test_s', description: 't', params: {} }]
        });
        orchestrator.scanCombos();
        const stats = orchestrator.getStats();
        assert(stats.combosLoaded >= 1, 'CO: stats combosLoaded');
        assert(stats.combosAvailable >= 1, 'CO: stats combosAvailable');
    }

    fs.rmSync(tmpDir, { recursive: true, force: true });
}

// ── RUN ───────────────────────────────────────────────────────

async function main() {
    console.log('═══════════════════════════════════════════════════');
    console.log('  SAGE SKILLS — AXIOM + COMPETENCE + COMBO TESTS');
    console.log('═══════════════════════════════════════════════════');

    await testAxiomEnforcer();
    await testCompetenceMap();
    await testComboOrchestrator();

    console.log('\n═══════════════════════════════════════════════════');
    console.log(`  RESULTS: ${passed} passed, ${failed} failed`);
    if (failures.length > 0) {
        console.log('  FAILURES:');
        for (const f of failures) console.log(`    - ${f}`);
    }
    console.log('═══════════════════════════════════════════════════');
    process.exit(failed > 0 ? 1 : 0);
}

main().catch(e => { console.error(e); process.exit(1); });
