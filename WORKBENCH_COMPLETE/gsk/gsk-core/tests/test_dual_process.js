'use strict';

/**
 * Tests for Dual-Process Diagnostic Engine
 * Run: node tests/test_dual_process.js
 */

const path = require('path');
const fs = require('fs');
const os = require('os');

let passed = 0;
let failed = 0;
const failures = [];

function assert(condition, name) {
    if (condition) {
        passed++;
        console.log(`  PASS: ${name}`);
    } else {
        failed++;
        failures.push(name);
        console.log(`  FAIL: ${name}`);
    }
}

function assertEqual(actual, expected, name) {
    assert(actual === expected, `${name} (got: ${actual}, expected: ${expected})`);
}

function assertInRange(value, min, max, name) {
    assert(value >= min && value <= max, `${name} (got: ${value}, expected ${min}-${max})`);
}

function makeTmpDir() {
    return fs.mkdtempSync(path.join(os.tmpdir(), 'gsk-dp-test-'));
}

function makeMockBrain(responses) {
    const calls = [];
    return {
        think: async (prompt) => {
            calls.push(prompt);
            if (typeof responses === 'function') return responses(prompt, calls.length);
            if (Array.isArray(responses)) return responses[Math.min(calls.length - 1, responses.length - 1)];
            return responses || 'No response';
        },
        calls
    };
}

function makeMockFusion(tmpDir, brain) {
    return {
        brain: brain || makeMockBrain('H1: Mode switching logic is broken\nH2: External API rate limit\nH3: Data file is missing'),
        perpetualConsciousness: {
            currentMode: 'wondering',
            stats: { thoughtsGenerated: 100, dreamsHad: 0, actionsTaken: 5 }
        },
        symbolicMemory: {
            getSymbolicSummary: () => ({
                totalDreams: 0,
                dominantMotifs: [],
                topPatterns: []
            })
        },
        identityKernel: {
            getWorking: () => ({ mood: 'determined', focusArea: '' }),
            getStatus: () => ({ version: 13 })
        },
        competenceMap: {
            stats: { totalSkills: 10, stageCounts: { 1: 3, 2: 4, 3: 2, 4: 1 } }
        }
    };
}

async function runTests() {
    console.log('');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('  DUAL-PROCESS DIAGNOSTIC ENGINE — TEST SUITE');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('');

    const tmpDir = makeTmpDir();
    const statePath = path.join(tmpDir, 'dual_process_state.json');
    const lessonPath = path.join(tmpDir, 'compiled_lessons.jsonl');
    const factsPath = path.join(tmpDir, 'compiled_facts.jsonl');

    // ── TEST 1: Engine initializes correctly ──────────────────────
    console.log('TEST 1: Initialization');
    {
        const { DualProcessEngine } = require('../brain/dual_process_engine.js');
        const fusion = makeMockFusion(tmpDir);
        const engine = new DualProcessEngine(fusion, { statePath, lessonPath });

        assert(engine !== null, 'Engine is created');
        assert(engine.brain !== null, 'Brain is wired');
        assert(engine.stats.system1Hits === 0, 'System 1 hits start at 0');
        assert(engine.stats.system2Cycles === 0, 'System 2 cycles start at 0');
        assert(engine.stats.lessonsExtracted === 0, 'Lessons extracted start at 0');
    }

    // ── TEST 2: System 1 pattern matching ─────────────────────────
    console.log('\nTEST 2: System 1 pattern matching');
    {
        const { DualProcessEngine } = require('../brain/dual_process_engine.js');

        // Create a facts file with a high-confidence fact
        fs.writeFileSync(factsPath, JSON.stringify({
            type: 'extracted_fact',
            subject: 'brain',
            predicate: 'uses',
            object: 'OmniRoute LLM proxy',
            confidence: 0.95,
            status: 'active'
        }) + '\n');

        const fusion = makeMockFusion(tmpDir);
        const engine = new DualProcessEngine(fusion, { statePath, lessonPath, factsPath });

        const result = engine.system1('brain uses OmniRoute LLM proxy for thinking');
        assert(result !== null, 'System 1 returns a match for known pattern');
        assert(result.system === 1, 'Result is labeled System 1');
        assert(result.fast === true, 'Result is marked fast');
        assertInRange(result.confidence, 0, 1, 'Confidence is in valid range');

        const noMatch = engine.system1('quantum entanglement in particle physics');
        assert(noMatch === null, 'System 1 returns null for unknown pattern');
    }

    // ── TEST 3: System 2 hypothetico-deductive loop ───────────────
    console.log('\nTEST 3: System 2 hypothetico-deductive loop');
    {
        const { DualProcessEngine } = require('../brain/dual_process_engine.js');
        const brain = makeMockBrain(
            'H1: Mode switching logic is broken — arousal is always 0.5\n' +
            'H2: External API rate limit prevents brain.think() from working\n' +
            'H3: Data file is missing — compiled_lessons.jsonl does not exist'
        );
        const fusion = makeMockFusion(tmpDir, brain);
        const engine = new DualProcessEngine(fusion, { statePath, lessonPath });

        const result = await engine.system2('0 dreams despite 100 thoughts', { module: 'perpetual_consciousness' });

        assert(result.system === 2, 'Result is labeled System 2');
        assert(result.diagnosis !== null, 'Diagnosis is not null');
        assert(result.hypotheses.length > 0, 'Hypotheses were generated');
        assert(result.hypotheses.length <= 3, 'At most 3 hypotheses');
        assertInRange(result.confidence, 0, 1, 'Confidence is in valid range');
        assert(result.cues.length > 0, 'Cues were acquired');
        assert(brain.calls.length > 0, 'Brain.think() was called for hypothesis generation');
    }

    // ── TEST 4: Bayesian confidence scoring ───────────────────────
    console.log('\nTEST 4: Bayesian confidence scoring');
    {
        const { DualProcessEngine } = require('../brain/dual_process_engine.js');
        const fusion = makeMockFusion(tmpDir);
        const engine = new DualProcessEngine(fusion, { statePath, lessonPath });

        // Test with mock hypotheses
        const hypotheses = [
            { hypothesis: 'rate limit is the cause', prior: 0.5, evidence: [], posterior: 0.5 },
            { hypothesis: 'code bug is the cause', prior: 0.3, evidence: [], posterior: 0.3 }
        ];
        const cues = [
            { type: 'error', content: 'HTTP 429 rate limit exceeded', weight: 0.9 },
            { type: 'module', content: 'mega_brain OmniRoute', weight: 0.7 },
            { type: 'problem', content: '0 dreams despite thoughts', weight: 1.0 }
        ];

        const interpreted = engine._interpretCues(cues, hypotheses);
        assert(interpreted.length === 2, 'Both hypotheses were interpreted');
        assert(interpreted[0].evidence !== undefined, 'Evidence array exists');

        const evaluated = engine._evaluateHypotheses(interpreted, cues);
        assert(evaluated.length === 2, 'Both hypotheses were evaluated');
        assertInRange(evaluated[0].posterior, 0, 1, 'Posterior is valid probability');
        assertInRange(evaluated[1].posterior, 0, 1, 'Second posterior is valid probability');
        assert(evaluated[0].likelihood !== undefined, 'Likelihood was computed');
        assert(engine.stats.bayesianUpdates >= 2, 'Bayesian updates were counted');
    }

    // ── TEST 5: Cognitive bias mitigation ─────────────────────────
    console.log('\nTEST 5: Cognitive bias mitigation');
    {
        const { DualProcessEngine } = require('../brain/dual_process_engine.js');
        const fusion = makeMockFusion(tmpDir);
        const engine = new DualProcessEngine(fusion, { statePath, lessonPath });

        // Single hypothesis → premature closure
        const singleHypothesis = [
            { hypothesis: 'only one idea', prior: 0.5, evidence: [{ cue: 'test', relevance: 0.5 }], contradictionCount: 0, evidenceCount: 1 }
        ];
        const biases1 = engine._checkBiases(singleHypothesis, singleHypothesis);
        const prematureClosure = biases1.find(b => b.type === 'premature_closure');
        assert(prematureClosure !== undefined, 'Premature closure detected for single hypothesis');
        assert(prematureClosure.severity === 'high', 'Premature closure is high severity');

        // No contradictions → confirmation bias
        const multipleHypotheses = [
            { hypothesis: 'idea A', prior: 0.4, evidence: [{ cue: 'x', relevance: 0.5 }], contradictionCount: 0, evidenceCount: 1 },
            { hypothesis: 'idea B', prior: 0.3, evidence: [{ cue: 'y', relevance: 0.4 }], contradictionCount: 0, evidenceCount: 1 }
        ];
        const biases2 = engine._checkBiases(multipleHypotheses, multipleHypotheses);
        const confirmationBias = biases2.find(b => b.type === 'confirmation_bias');
        assert(confirmationBias !== undefined, 'Confirmation bias detected when no contradictions examined');
    }

    // ── TEST 6: Mode switching logic ──────────────────────────────
    console.log('\nTEST 6: Mode switching logic');
    {
        const { DualProcessEngine } = require('../brain/dual_process_engine.js');
        const fusion = makeMockFusion(tmpDir);
        const engine = new DualProcessEngine(fusion, { statePath, lessonPath });

        // User active → active mode
        assertEqual(engine.decideMode({ hasUser: true }), 'active', 'User active → active');

        // High dormancy → dreaming
        assertEqual(engine.decideMode({ dormancyLevel: 0.6, thoughtsGenerated: 10, dreamsHad: 0 }), 'dreaming', 'High dormancy → dreaming');

        // Medium dormancy → consolidating
        assertEqual(engine.decideMode({ dormancyLevel: 0.4, thoughtsGenerated: 10, dreamsHad: 0 }), 'consolidating', 'Medium dormancy → consolidating');

        // Every 7th thought, no dreams yet → dreaming
        assertEqual(engine.decideMode({ thoughtsGenerated: 7, dreamsHad: 0, dormancyLevel: 0 }), 'dreaming', '7th thought with 0 dreams → dreaming');

        // Every 14th thought → consolidating
        assertEqual(engine.decideMode({ thoughtsGenerated: 14, dreamsHad: 2, dormancyLevel: 0 }), 'consolidating', '14th thought → consolidating');

        // Default → wondering
        assertEqual(engine.decideMode({ thoughtsGenerated: 3, dreamsHad: 0, dormancyLevel: 0 }), 'wondering', 'Default → wondering');

        // Problems detected → dreaming (System 2 deep processing)
        assertEqual(engine.decideMode({ problemsDetected: 1, thoughtsGenerated: 5, dormancyLevel: 0 }), 'dreaming', 'Problems detected → dreaming');
    }

    // ── TEST 7: Lesson extraction ─────────────────────────────────
    console.log('\nTEST 7: Lesson extraction');
    {
        const { DualProcessEngine } = require('../brain/dual_process_engine.js');
        const fusion = makeMockFusion(tmpDir);
        const engine = new DualProcessEngine(fusion, { statePath, lessonPath });

        const hypothesis = {
            hypothesis: 'Mode switching is broken because arousal is always 0.5',
            posterior: 0.75,
            evidenceCount: 3
        };
        const cues = [
            { type: 'problem', content: '0 dreams', weight: 1.0 },
            { type: 'module', content: 'perpetual_consciousness', weight: 0.7 }
        ];

        engine._extractLesson('0 dreams despite thoughts', hypothesis, cues);

        const lessons = engine._readLessons();
        assert(lessons.length > 0, 'Lesson was written');
        assert(lessons[0].type === 'diagnostic_lesson', 'Lesson type is diagnostic_lesson');
        assert(lessons[0].status === 'candidate', 'Lesson status is candidate');
        assert(lessons[0].extractedBy === 'dual_process_engine', 'Lesson has correct extractor');
        assertInRange(lessons[0].confidence, 0, 1, 'Lesson confidence is valid');
        assertEqual(engine.stats.lessonsExtracted, 1, 'Lessons extracted counter incremented');
    }

    // ── TEST 8: Heuristic hypotheses (no brain) ───────────────────
    console.log('\nTEST 8: Heuristic hypothesis generation');
    {
        const { DualProcessEngine } = require('../brain/dual_process_engine.js');
        const fusion = makeMockFusion(tmpDir, null); // No brain
        const engine = new DualProcessEngine(fusion, { statePath, lessonPath });

        const cues = [{ type: 'problem', content: '0 dreams', weight: 1.0 }];
        const hypotheses = engine._heuristicHypotheses('0 dreams despite many thoughts', cues);
        assert(hypotheses.length > 0, 'Heuristic hypotheses generated without brain');
        assert(hypotheses.some(h => h.hypothesis.includes('Mode switching')), 'Heuristic detects mode switching pattern');

        const rateHypotheses = engine._heuristicHypotheses('API rate limit 429', cues);
        assert(rateHypotheses.some(h => h.hypothesis.includes('rate limit')), 'Heuristic detects rate limit pattern');

        const socialHypotheses = engine._heuristicHypotheses('outreach posting fails', cues);
        assert(socialHypotheses.some(h => h.hypothesis.toLowerCase().includes('tool bridge')), 'Heuristic detects tool bridge pattern');
    }

    // ── TEST 9: Full diagnose() entry point ───────────────────────
    console.log('\nTEST 9: Full diagnose() entry point');
    {
        const { DualProcessEngine } = require('../brain/dual_process_engine.js');
        const brain = makeMockBrain('H1: The cause is X\nH2: The cause is Y\nH3: The cause is Z');
        const fusion = makeMockFusion(tmpDir, brain);
        const engine = new DualProcessEngine(fusion, { statePath, lessonPath });

        const result = await engine.diagnose('unknown novel problem that has no pattern match', { module: 'test' });
        assert(result !== null, 'diagnose() returns a result');
        assert(result.system === 1 || result.system === 2, 'Result is from System 1 or 2');
    }

    // ── TEST 10: State persistence ────────────────────────────────
    console.log('\nTEST 10: State persistence');
    {
        const { DualProcessEngine } = require('../brain/dual_process_engine.js');
        const fusion = makeMockFusion(tmpDir);
        const engine1 = new DualProcessEngine(fusion, { statePath, lessonPath });
        engine1.stats.system1Hits = 42;
        engine1.stats.system2Cycles = 17;
        engine1._save();

        const engine2 = new DualProcessEngine(fusion, { statePath, lessonPath });
        assertEqual(engine2.stats.system1Hits, 42, 'System 1 hits persisted');
        assertEqual(engine2.stats.system2Cycles, 17, 'System 2 cycles persisted');
    }

    // ── TEST 11: Self-diagnosis detects known faults ──────────────
    console.log('\nTEST 11: Self-diagnosis fault detection');
    {
        const { DualProcessEngine } = require('../brain/dual_process_engine.js');
        const fusion = makeMockFusion(tmpDir);
        fusion.perpetualConsciousness.stats.thoughtsGenerated = 200;
        fusion.perpetualConsciousness.stats.dreamsHad = 0;
        fusion.perpetualConsciousness.stats.actionsTaken = 0;

        const engine = new DualProcessEngine(fusion, { statePath, lessonPath });
        const problems = engine._detectSelfProblems();
        assert(problems.length > 0, 'Self-diagnosis detects problems');
        assert(problems.some(p => p.description.includes('0 dreams')), 'Detects 0 dreams fault');
        assert(problems.some(p => p.description.includes('0 actions')), 'Detects 0 actions fault');
    }

    // ── Cleanup ───────────────────────────────────────────────────
    try { fs.rmSync(tmpDir, { recursive: true }); } catch {}

    // ── Results ───────────────────────────────────────────────────
    console.log('');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log(`  RESULTS: ${passed} passed, ${failed} failed`);
    if (failures.length > 0) {
        console.log('  FAILURES:');
        for (const f of failures) {
            console.log(`    - ${f}`);
        }
    }
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('');

    process.exit(failed > 0 ? 1 : 0);
}

runTests().catch(e => {
    console.error('Test runner error:', e);
    process.exit(1);
});
