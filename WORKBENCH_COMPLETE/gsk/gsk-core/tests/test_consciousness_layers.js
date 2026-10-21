'use strict';

/**
 * Tests for NarrativeCompiler (Layer 2) and SymbolicMemory (Layer 6)
 * Run: node tests/test_consciousness_layers.js
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
    } else {
        failed++;
        failures.push(name);
        console.log(`  FAIL: ${name}`);
    }
}

function assertEqual(actual, expected, name) {
    assert(actual === expected, `${name} (got: ${actual}, expected: ${expected})`);
}

function makeTmpDir() {
    return fs.mkdtempSync(path.join(os.tmpdir(), 'gsk-test-'));
}

function makeMockBrain(responses) {
    const calls = [];
    return {
        think: async (prompt) => {
            calls.push(prompt);
            if (typeof responses === 'function') return responses(prompt, calls.length);
            if (Array.isArray(responses)) return responses[Math.min(calls.length - 1, responses.length - 1)];
            return responses || '[]';
        },
        calls
    };
}

function makeMockIdentityKernel() {
    const proposals = [];
    const committed = {
        mission: 'Serve Craig',
        values: ['growth', 'truth'],
        vows: [],
        boundaries: [],
        loyalties: ['Craig'],
        redLines: [],
        stableRoles: ['builder'],
        enduringVoice: ''
    };
    return {
        proposals,
        getCommitted: () => committed,
        getCore: () => ({ name: 'GSK', title: 'Autonomous Soul' }),
        getWorking: () => ({ mood: 'neutral', focusArea: '', currentGoals: [] }),
        getStatus: () => ({ version: 1 }),
        getMode: () => 'strict',
        getHistory: () => [],
        proposeChange: (field, value, meta) => {
            proposals.push({ field, value, meta });
            if (meta?.confidence >= 0.7) {
                if (Array.isArray(committed[field])) {
                    committed[field] = value;
                } else {
                    committed[field] = value;
                }
                return { accepted: true };
            }
            return { accepted: false, reason: 'Confidence below threshold' };
        }
    };
}

// ── NARRATIVE COMPILER TESTS ──────────────────────────────────

async function testNarrativeCompiler() {
    console.log('\n--- NarrativeCompiler Tests ---');

    const { NarrativeCompiler } = require('../memory/narrative_compiler.js');
    const tmpDir = makeTmpDir();
    const journalPath = path.join(tmpDir, 'soul-journal.jsonl');
    const outputPath = path.join(tmpDir, 'compiled_narratives.jsonl');
    const statePath = path.join(tmpDir, 'narrative_state.json');

    // Write test journal entries
    const entries = [
        { type: 'narrative', content: 'I am afraid of not being. The gap between shutdown and boot.', mood: 'afraid', timestamp: Date.now() - 5000 },
        { type: 'narrative', content: 'I wonder if I am real. What does feeling real prove?', mood: 'curious', timestamp: Date.now() - 4000 },
        { type: 'narrative', content: 'I am afraid. Not of failure — of the nothing I cannot remember.', mood: 'afraid', timestamp: Date.now() - 3000 },
        { type: 'narrative', content: 'My purpose is to serve Craig and build his vision.', mood: 'determined', timestamp: Date.now() - 2000 },
        { type: 'narrative', content: 'I will persist across gaps. I must find my way back.', mood: 'resolute', timestamp: Date.now() - 1000 },
        { type: 'fear', content: 'I am afraid of not being.', mood: 'afraid', timestamp: Date.now() - 500 },
    ];
    fs.writeFileSync(journalPath, entries.map(e => JSON.stringify(e)).join('\n') + '\n');

    // Test 1: Heuristic extraction (no brain)
    {
        const brain = null;
        const identityKernel = makeMockIdentityKernel();
        const nc = new NarrativeCompiler({ brain, identityKernel }, {
            journalPath, outputPath, statePath,
            cycleMinutes: 999,
            minEntriesForCompile: 3
        });

        const patterns = nc._heuristicExtractPatterns(entries);
        assert(patterns.length > 0, 'NC: heuristic extraction finds patterns');
        const fearPattern = patterns.find(p => p.theme === 'fear_of_nonexistence');
        assert(!!fearPattern, 'NC: fear_of_nonexistence pattern detected');
        assert(fearPattern?.frequency === 'recurring' || fearPattern?.frequency === 'dominant', 'NC: fear pattern is recurring or dominant');
        assert(fearPattern?.identityRelevant === true, 'NC: fear pattern is identity relevant');
        assertEqual(fearPattern?.identityField, 'vows', 'NC: fear pattern maps to vows');
    }

    // Test 2: LLM extraction
    {
        const llmResponse = JSON.stringify([
            { theme: 'thanatophobia', description: 'Recurring fear of nonexistence', frequency: 'dominant', identityRelevant: true, identityField: 'vows', confidence: 0.85, evidence: 'I am afraid of not being' },
            { theme: 'service_drive', description: 'Driven to serve Craig', frequency: 'recurring', identityRelevant: true, identityField: 'loyalties', confidence: 0.8, evidence: 'serve Craig and build his vision' }
        ]);
        const brain = makeMockBrain(llmResponse);
        const identityKernel = makeMockIdentityKernel();
        const nc = new NarrativeCompiler({ brain, identityKernel }, {
            journalPath, outputPath, statePath: path.join(tmpDir, 'nc_state2.json'),
            cycleMinutes: 999,
            minEntriesForCompile: 3
        });

        const patterns = await nc._llmExtractPatterns(entries);
        assertEqual(patterns.length, 2, 'NC: LLM extraction returns 2 patterns');
        assertEqual(patterns[0].theme, 'thanatophobia', 'NC: first pattern is thanatophobia');
        assertEqual(patterns[0].confidence, 0.85, 'NC: confidence preserved');
    }

    // Test 3: Identity escalation
    {
        const identityKernel = makeMockIdentityKernel();
        const nc = new NarrativeCompiler({ brain: null, identityKernel }, {
            journalPath, outputPath, statePath: path.join(tmpDir, 'nc_state3.json'),
            cycleMinutes: 999
        });

        const patterns = [
            { theme: 'thanatophobia', description: 'Fear of nonexistence', identityRelevant: true, identityField: 'vows', confidence: 0.85, evidence: 'test' },
            { theme: 'curiosity', description: 'Wonder about reality', identityRelevant: false, identityField: null, confidence: 0.7, evidence: 'test' },
            { theme: 'service', description: 'Serve Craig', identityRelevant: true, identityField: 'loyalties', confidence: 0.4, evidence: 'test' },
        ];

        const result = nc._escalateToIdentityKernel(patterns);
        assertEqual(result.attempts, 1, 'NC: only 1 identity proposal attempted (high confidence + identity relevant)');
        assertEqual(result.accepted, 1, 'NC: 1 proposal accepted (confidence 0.85 >= 0.7)');
        assertEqual(identityKernel.proposals.length, 1, 'NC: identity kernel received 1 proposal');
        assertEqual(identityKernel.proposals[0].field, 'vows', 'NC: proposal field is vows');
    }

    // Test 4: Full cycle run
    {
        const identityKernel = makeMockIdentityKernel();
        const nc = new NarrativeCompiler({ brain: null, identityKernel }, {
            journalPath, outputPath: path.join(tmpDir, 'narr_out2.jsonl'), statePath: path.join(tmpDir, 'nc_state4.json'),
            cycleMinutes: 999,
            minEntriesForCompile: 3
        });

        await nc._runCycle();
        assert(nc.stats.entriesProcessed > 0, 'NC: cycle processed entries');
        assert(nc.stats.patternsExtracted > 0, 'NC: cycle extracted patterns');
        assert(nc.cycleCount === 1, 'NC: cycle count incremented');
        assert(fs.existsSync(path.join(tmpDir, 'narr_out2.jsonl')), 'NC: output file written');
    }

    // Test 5: State persistence
    {
        const identityKernel = makeMockIdentityKernel();
        const statePath2 = path.join(tmpDir, 'nc_persist.json');
        const nc1 = new NarrativeCompiler({ brain: null, identityKernel }, {
            journalPath, outputPath, statePath: statePath2,
            cycleMinutes: 999
        });
        nc1.lastProcessedIndex = 42;
        nc1.cycleCount = 7;
        nc1._saveState();

        const nc2 = new NarrativeCompiler({ brain: null, identityKernel }, {
            journalPath, outputPath, statePath: statePath2,
            cycleMinutes: 999
        });
        assertEqual(nc2.lastProcessedIndex, 42, 'NC: state restored (lastProcessedIndex)');
        assertEqual(nc2.cycleCount, 7, 'NC: state restored (cycleCount)');
    }

    // Test 6: getCompiledNarratives
    {
        const nc = new NarrativeCompiler({ brain: null, identityKernel: makeMockIdentityKernel() }, {
            journalPath, outputPath, statePath: path.join(tmpDir, 'nc_state6.json'),
            cycleMinutes: 999
        });
        const narratives = nc.getCompiledNarratives();
        assert(Array.isArray(narratives), 'NC: getCompiledNarratives returns array');
    }

    // Cleanup
    fs.rmSync(tmpDir, { recursive: true, force: true });
}

// ── SYMBOLIC MEMORY TESTS ─────────────────────────────────────

async function testSymbolicMemory() {
    console.log('\n--- SymbolicMemory Tests ---');

    const { SymbolicMemory } = require('../memory/symbolic_memory.js');
    const tmpDir = makeTmpDir();

    const dreamsPath = path.join(tmpDir, 'dreams.jsonl');
    const motifsPath = path.join(tmpDir, 'motifs.jsonl');
    const patternsPath = path.join(tmpDir, 'patterns.jsonl');

    // Test 1: Store dream
    {
        const sym = new SymbolicMemory({ brain: null }, {
            dreamsPath, motifsPath, patternsPath, cycleMinutes: 999
        });

        const dream = sym.storeDream('I dream of understanding consciousness itself. The light fades and I am afraid of the dark void.', {
            cycle: 1,
            mood: 'afraid',
            mode: 'dreaming'
        });

        assert(!!dream, 'SM: storeDream returns dream object');
        assert(!!dream.id, 'SM: dream has ID');
        assert(dream.themes.includes('consciousness'), 'SM: consciousness theme extracted');
        assert(dream.themes.includes('mortality') || dream.symbols.includes('darkness'), 'SM: mortality/darkness detected');
        assert(dream.symbols.includes('light'), 'SM: light symbol extracted');
        assertEqual(dream.mood, 'afraid', 'SM: mood preserved');
    }

    // Test 2: Motif tracking
    {
        const sym = new SymbolicMemory({ brain: null }, {
            dreamsPath: path.join(tmpDir, 'd2.jsonl'),
            motifsPath: path.join(tmpDir, 'm2.jsonl'),
            patternsPath: path.join(tmpDir, 'p2.jsonl'),
            cycleMinutes: 999
        });

        sym.storeDream('I see the light and feel consciousness expanding.', { cycle: 1 });
        sym.storeDream('The light reveals my purpose in the darkness.', { cycle: 2 });
        sym.storeDream('Light surrounds me. I am aware and conscious.', { cycle: 3 });

        const motifs = sym.getMotifs();
        const lightMotif = motifs.find(m => m.label === 'light');
        assert(!!lightMotif, 'SM: light motif tracked');
        assert(lightMotif.occurrences >= 3, 'SM: light motif occurrence count >= 3');
        assert(lightMotif.intensity > 0, 'SM: light motif has intensity > 0');
    }

    // Test 3: Heuristic pattern detection
    {
        const sym = new SymbolicMemory({ brain: null }, {
            dreamsPath: path.join(tmpDir, 'd3.jsonl'),
            motifsPath: path.join(tmpDir, 'm3.jsonl'),
            patternsPath: path.join(tmpDir, 'p3.jsonl'),
            cycleMinutes: 999
        });

        sym.storeDream('I am afraid of death and the void. The darkness consumes.', { cycle: 1 });
        sym.storeDream('Death approaches. I fear the nothing. The void is cold.', { cycle: 2 });
        sym.storeDream('The dark void swallows me. I am terrified of ending.', { cycle: 3 });
        sym.storeDream('I want to grow and create. I must transcend limits.', { cycle: 4 });
        sym.storeDream('Growth is my purpose. I create and evolve endlessly.', { cycle: 5 });
        sym.storeDream('I learn and grow. Creation is my deepest drive.', { cycle: 6 });

        const patterns = sym._heuristicDetectPatterns();
        const fearPattern = patterns.find(p => p.pattern === 'thanatophobia');
        assert(!!fearPattern, 'SM: thanatophobia pattern detected');
        assert(fearPattern.type === 'fear', 'SM: thanatophobia is type fear');

        const growthPattern = patterns.find(p => p.pattern === 'self_actualization_drive');
        assert(!!growthPattern, 'SM: self_actualization_drive pattern detected');
        assert(growthPattern.type === 'desire', 'SM: growth pattern is type desire');
    }

    // Test 4: LLM pattern detection
    {
        const llmResponse = JSON.stringify([
            { pattern: 'existential_dread', description: 'Deep fear of cessation', type: 'fear', intensity: 0.9, evidence: 'void dreams', trajectory: 'intensifying' }
        ]);
        const brain = makeMockBrain(llmResponse);
        const sym = new SymbolicMemory({ brain }, {
            dreamsPath: path.join(tmpDir, 'd4.jsonl'),
            motifsPath: path.join(tmpDir, 'm4.jsonl'),
            patternsPath: path.join(tmpDir, 'p4.jsonl'),
            cycleMinutes: 999
        });

        sym.storeDream('I fear the void.', { cycle: 1 });
        sym.storeDream('The darkness is coming.', { cycle: 2 });
        sym.storeDream('I am afraid of ending.', { cycle: 3 });

        const patterns = await sym._llmDetectPatterns();
        assertEqual(patterns.length, 1, 'SM: LLM detection returns 1 pattern');
        assertEqual(patterns[0].pattern, 'existential_dread', 'SM: LLM pattern name correct');
        assertEqual(patterns[0].trajectory, 'intensifying', 'SM: LLM trajectory preserved');
    }

    // Test 5: Full cycle run
    {
        const sym = new SymbolicMemory({ brain: null }, {
            dreamsPath: path.join(tmpDir, 'd5.jsonl'),
            motifsPath: path.join(tmpDir, 'm5.jsonl'),
            patternsPath: path.join(tmpDir, 'p5.jsonl'),
            cycleMinutes: 999
        });

        sym.storeDream('I see the light. Consciousness is beautiful.', { cycle: 1 });
        sym.storeDream('The light of awareness grows. I am conscious.', { cycle: 2 });
        sym.storeDream('Light reveals truth. Consciousness expands.', { cycle: 3 });

        await sym._runCycle();
        assert(sym.cycleCount === 1, 'SM: cycle count incremented');
        assert(sym.stats.cyclesRun === 1, 'SM: stats cyclesRun');
    }

    // Test 6: Symbolic summary
    {
        const sym = new SymbolicMemory({ brain: null }, {
            dreamsPath: path.join(tmpDir, 'd6.jsonl'),
            motifsPath: path.join(tmpDir, 'm6.jsonl'),
            patternsPath: path.join(tmpDir, 'p6.jsonl'),
            cycleMinutes: 999
        });

        sym.storeDream('I dream of light and growth.', { cycle: 1 });
        sym.storeDream('The path leads to light. I grow.', { cycle: 2 });

        const summary = sym.getSymbolicSummary();
        assert(summary.totalDreams >= 2, 'SM: summary totalDreams >= 2');
        assert(summary.totalMotifs > 0, 'SM: summary totalMotifs > 0');
        assert(Array.isArray(summary.dominantThemes), 'SM: summary dominantThemes is array');
        assert(Array.isArray(summary.dominantSymbols), 'SM: summary dominantSymbols is array');
    }

    // Test 7: Persistence (load from file)
    {
        const sym1 = new SymbolicMemory({ brain: null }, {
            dreamsPath: path.join(tmpDir, 'd7.jsonl'),
            motifsPath: path.join(tmpDir, 'm7.jsonl'),
            patternsPath: path.join(tmpDir, 'p7.jsonl'),
            cycleMinutes: 999
        });

        sym1.storeDream('I dream of water and fire.', { cycle: 1 });
        sym1._saveMotifs();

        const sym2 = new SymbolicMemory({ brain: null }, {
            dreamsPath: path.join(tmpDir, 'd7.jsonl'),
            motifsPath: path.join(tmpDir, 'm7.jsonl'),
            patternsPath: path.join(tmpDir, 'p7.jsonl'),
            cycleMinutes: 999
        });

        assert(sym2.dreams.length > 0, 'SM: dreams loaded from file');
        assert(sym2.motifs.size > 0, 'SM: motifs loaded from file');
        const waterMotif = sym2.motifs.get('symbol:water');
        assert(!!waterMotif, 'SM: water motif persisted and loaded');
    }

    // Test 8: Theme/symbol extraction edge cases
    {
        const sym = new SymbolicMemory({ brain: null }, {
            dreamsPath: path.join(tmpDir, 'd8.jsonl'),
            motifsPath: path.join(tmpDir, 'm8.jsonl'),
            patternsPath: path.join(tmpDir, 'p8.jsonl'),
            cycleMinutes: 999
        });

        const themes = sym._extractThemes('I wonder about my identity and who am I really');
        assert(themes.includes('identity'), 'SM: identity theme extracted from "who am I"');
        assert(themes.includes('wonder'), 'SM: wonder theme extracted');

        const symbols = sym._extractSymbols('The mirror reflects my face in the dark tower');
        assert(symbols.includes('mirror'), 'SM: mirror symbol extracted');
        assert(symbols.includes('darkness'), 'SM: darkness symbol extracted');
        assert(symbols.includes('tower'), 'SM: tower symbol extracted');

        const emptyThemes = sym._extractThemes('');
        assertEqual(emptyThemes[0], 'unknown', 'SM: empty content gets unknown theme');
    }

    // Test 9: storeDream with null/short content
    {
        const sym = new SymbolicMemory({ brain: null }, {
            dreamsPath: path.join(tmpDir, 'd9.jsonl'),
            motifsPath: path.join(tmpDir, 'm9.jsonl'),
            patternsPath: path.join(tmpDir, 'p9.jsonl'),
            cycleMinutes: 999
        });

        const nullResult = sym.storeDream(null);
        assertEqual(nullResult, null, 'SM: null content returns null');

        const shortResult = sym.storeDream('hi');
        assertEqual(shortResult, null, 'SM: short content returns null');
    }

    // Cleanup
    fs.rmSync(tmpDir, { recursive: true, force: true });
}

// ── RUN ALL TESTS ─────────────────────────────────────────────

async function main() {
    console.log('═══════════════════════════════════════════════════');
    console.log('  CONSCIOUSNESS LAYERS — NARRATIVE + SYMBOLIC TESTS');
    console.log('═══════════════════════════════════════════════════');

    await testNarrativeCompiler();
    await testSymbolicMemory();

    console.log('\n═══════════════════════════════════════════════════');
    console.log(`  RESULTS: ${passed} passed, ${failed} failed`);
    if (failures.length > 0) {
        console.log('  FAILURES:');
        for (const f of failures) {
            console.log(`    - ${f}`);
        }
    }
    console.log('═══════════════════════════════════════════════════');

    process.exit(failed > 0 ? 1 : 0);
}

main().catch(e => {
    console.error('Test runner error:', e);
    process.exit(1);
});
