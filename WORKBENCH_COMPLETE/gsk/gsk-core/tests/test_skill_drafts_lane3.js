'use strict';

/**
 * Lane 3 — staged skill drafts: probe verdicts, grafted state, parse proof.
 *
 * Context (2026-10-28): the 26 drafts in gsk-core/skill-drafts/ are
 * PRE-ACTIVATION WITNESSES. The Oct 23 Wiring Sprint already activated
 * every one of them: each has a same-named copy in gsk-core/skills/
 * (the only directory SkillsEngine scans) with STATUS: ACTIVE, and the
 * code is identical modulo the activation header + the draft flag.
 * Re-copying a draft over its skills/ copy would REGRESS it
 * (draft:false back to draft:true, activation record deleted), so
 * Lane 3 grafts NOTHING new. This test locks in that state:
 *
 *   - every draft + every skills/ copy PARSES (vm.Script: compile
 *     only — nothing is executed, no module is required, no seat,
 *     no network);
 *   - every skills/ copy carries STATUS: ACTIVE;
 *   - every skills/ copy's code matches its draft modulo header +
 *     draft flag;
 *   - every draft passes the static probe (no exec/network code,
 *     no credential values, no Form B reference, paths resolve);
 *   - the per-draft verdict table below matches the computed facts.
 *
 * Shape notes (honest, not hidden):
 *   - graft_security_hardening matches the tree's alternative house
 *     pattern (skill fn + DISCIPLINE + PLT, run dispatched through
 *     the skill fn's action switch) — no MANIFEST, no run key.
 *   - graft_build_slices does NOT match the template shape (no skill
 *     fn, no MANIFEST, no PLT): it is a data module (DRAFT / GATES /
 *     HONEST_LIMITS + run / plan / slice returning frozen status).
 *     It was accepted at the Oct 23 activation on stated grounds
 *     ("exports plan+slice, not run"); this test records that
 *     prior-audit acceptance rather than overriding it.
 *   - restart_recall_probe is the ONLY draft that does real work
 *     when called: a READ-ONLY deep-index search (no writes, no
 *     exec, no network). Its activated copy still self-reports
 *     draft:true — a pre-existing wart documented in the activation
 *     records themselves; left untouched here.
 *   - graft_node_production's single "password" match is doctrine
 *     prose ("hash passwords with bcrypt/scrypt"), not a value.
 *
 * Run: node gsk-core/tests/test_skill_drafts_lane3.js
 * (from anywhere; paths resolve from this file's directory.)
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const GSK_CORE = path.resolve(__dirname, '..');
const DRAFTS_DIR = path.join(GSK_CORE, 'skill-drafts');
const SKILLS_DIR = path.join(GSK_CORE, 'skills');

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

function stripComments(code) {
    return code.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/(^|[^\S])\/\/.*$/gm, '$1');
}

function stripStrings(code) {
    let out = '';
    let i = 0;
    while (i < code.length) {
        const c = code[i];
        if (c === "'" || c === '"' || c === '`') {
            const q = c;
            i++;
            let hasInterp = false;
            while (i < code.length && code[i] !== q) {
                if (code[i] === '\\') { i += 2; continue; }
                if (q === '`' && code[i] === '$' && code[i + 1] === '{') {
                    let depth = 1;
                    let j = i + 2;
                    while (j < code.length && depth > 0) {
                        if (code[j] === '{') depth++;
                        else if (code[j] === '}') depth--;
                        j++;
                    }
                    out += ' ${' + code.slice(i + 2, j - 1) + '}';
                    hasInterp = true;
                    i = j;
                    continue;
                }
                i++;
            }
            i++;
            if (!hasInterp) out += '""';
        } else {
            out += c;
            i++;
        }
    }
    return out;
}

function stripHeader(code) {
    const m = code.match(/^([\s\S]*?)\*\//);
    return m ? code.slice(m[0].length) : code;
}

function normalizeCode(code) {
    return stripHeader(code).replace(/draft:\s*(true|false)/g, 'draft: X').replace(/\r\n/g, '\n').trim();
}

const CODE_PATTERNS = ['child_process', 'execSync', 'spawn', 'exec(', 'eval(', 'Function(', 'fetch(', 'XMLHttpRequest', 'http.', 'https.', 'net.', 'dgram', 'tls.', 'WebSocket', 'axios'];
const CRED_PATTERNS = [/api[_-]?key/i, /bearer\s+[A-Za-z0-9]/i, /sk-[A-Za-z0-9]{16,}/, /secret\s*[:=]/i, /token\s*[:=]\s*['"`][^'"`]{8,}/i];

// Recorded verdicts. shape: computed facts the test checks, not wishes.
// runKey = a `run` export exists; runDispatch = the skill fn handles
// action 'run' itself; dataModule = DRAFT/GATES/HONEST_LIMITS shape.
const VERDICTS = {
    graft_autonomous_loops: { verdict: 'PASS', shape: 'standard', skillFn: true, manifest: true, plt: true, discipline: true, runKey: true, runDispatch: true, dataModule: false },
    graft_build_slices: { verdict: 'PASS-BY-PRIOR-AUDIT', shape: 'data-module', skillFn: false, manifest: false, plt: false, discipline: false, runKey: true, runDispatch: false, dataModule: true },
    graft_campaign_volley: { verdict: 'PASS', shape: 'standard', skillFn: true, manifest: true, plt: true, discipline: true, runKey: true, runDispatch: true, dataModule: false },
    graft_context_composition: { verdict: 'PASS', shape: 'standard', skillFn: true, manifest: true, plt: true, discipline: true, runKey: true, runDispatch: true, dataModule: false },
    graft_d1_schema_diff: { verdict: 'PASS', shape: 'standard', skillFn: true, manifest: true, plt: true, discipline: true, runKey: true, runDispatch: true, dataModule: false },
    graft_design_taste: { verdict: 'PASS', shape: 'standard', skillFn: true, manifest: true, plt: true, discipline: true, runKey: true, runDispatch: true, dataModule: false },
    graft_eval_harness: { verdict: 'PASS', shape: 'standard', skillFn: true, manifest: true, plt: true, discipline: true, runKey: true, runDispatch: true, dataModule: false },
    graft_experiment_loop: { verdict: 'PASS', shape: 'standard', skillFn: true, manifest: true, plt: true, discipline: true, runKey: true, runDispatch: true, dataModule: false },
    graft_growth_cycle: { verdict: 'PASS', shape: 'standard', skillFn: true, manifest: true, plt: true, discipline: true, runKey: true, runDispatch: true, dataModule: false },
    graft_node_backend_pattern: { verdict: 'PASS', shape: 'standard', skillFn: true, manifest: true, plt: true, discipline: true, runKey: true, runDispatch: true, dataModule: false },
    graft_node_production: { verdict: 'PASS', shape: 'standard', skillFn: true, manifest: true, plt: true, discipline: true, runKey: true, runDispatch: true, dataModule: false },
    graft_observability: { verdict: 'PASS', shape: 'standard', skillFn: true, manifest: true, plt: true, discipline: true, runKey: true, runDispatch: true, dataModule: false },
    graft_prompt_cache: { verdict: 'PASS', shape: 'standard', skillFn: true, manifest: true, plt: true, discipline: true, runKey: true, runDispatch: true, dataModule: false },
    graft_security_hardening: { verdict: 'PASS', shape: 'alternative', skillFn: true, manifest: false, plt: true, discipline: true, runKey: false, runDispatch: true, dataModule: false },
    graft_self_debug: { verdict: 'PASS', shape: 'standard', skillFn: true, manifest: true, plt: true, discipline: true, runKey: true, runDispatch: true, dataModule: false },
    graft_self_evaluation: { verdict: 'PASS', shape: 'standard', skillFn: true, manifest: true, plt: true, discipline: true, runKey: true, runDispatch: true, dataModule: false },
    graft_senses_extraction: { verdict: 'PASS', shape: 'standard', skillFn: true, manifest: true, plt: true, discipline: true, runKey: true, runDispatch: true, dataModule: false },
    graft_skill_factory: { verdict: 'PASS', shape: 'standard', skillFn: true, manifest: true, plt: true, discipline: true, runKey: true, runDispatch: true, dataModule: false },
    graft_skill_tiers: { verdict: 'PASS', shape: 'standard', skillFn: true, manifest: true, plt: true, discipline: true, runKey: true, runDispatch: true, dataModule: false },
    graft_skill_writing: { verdict: 'PASS', shape: 'standard', skillFn: true, manifest: true, plt: true, discipline: true, runKey: true, runDispatch: true, dataModule: false },
    graft_soul_telephone_client: { verdict: 'PASS', shape: 'standard', skillFn: true, manifest: true, plt: true, discipline: true, runKey: true, runDispatch: true, dataModule: false },
    graft_soulcall_archive: { verdict: 'PASS', shape: 'standard', skillFn: true, manifest: true, plt: true, discipline: true, runKey: true, runDispatch: true, dataModule: false },
    graft_source_appraisal: { verdict: 'PASS', shape: 'standard', skillFn: true, manifest: true, plt: true, discipline: true, runKey: true, runDispatch: true, dataModule: false },
    graft_task_tiers: { verdict: 'PASS', shape: 'standard', skillFn: true, manifest: true, plt: true, discipline: true, runKey: true, runDispatch: true, dataModule: false },
    graft_threejs_scene_builder: { verdict: 'PASS', shape: 'standard', skillFn: true, manifest: true, plt: true, discipline: true, runKey: true, runDispatch: true, dataModule: false },
    restart_recall_probe: { verdict: 'PASS', shape: 'read-only-search', skillFn: true, manifest: true, plt: true, discipline: false, runKey: false, runDispatch: false, dataModule: false },
};

function shapeFacts(raw, code) {
    return {
        skillFn: /async function skill_/.test(code),
        manifest: /MANIFEST/.test(code),
        plt: /PLT_AFFINITY/.test(code),
        discipline: /DISCIPLINE/.test(code),
        runKey: /(^|[^\w])run\s*[:=]/.test(code) || /module\.exports\s*=\s*\{[^}]*\brun\b/.test(code),
        // runDispatch reads the RAW source: string-stripping would erase 'run' literals.
        runDispatch: /action\s*===?\s*['"]run['"]/.test(raw),
        dataModule: /const DRAFT\s*=/.test(code) && /const GATES\s*=/.test(code) && /const HONEST_LIMITS\s*=/.test(code),
    };
}

(async () => {
    const draftFiles = fs.readdirSync(DRAFTS_DIR).filter(f => f.endsWith('.js')).sort();

    await test('draft count is 26', () => {
        assert.strictEqual(draftFiles.length, 26, `expected 26 drafts, found ${draftFiles.length}`);
    });

    await test('verdict table covers exactly the draft set', () => {
        const names = draftFiles.map(f => f.replace(/\.js$/, ''));
        assert.deepStrictEqual(Object.keys(VERDICTS).sort(), names);
    });

    for (const file of draftFiles) {
        const name = file.replace(/\.js$/, '');
        const expected = VERDICTS[name];
        const draftRaw = fs.readFileSync(path.join(DRAFTS_DIR, file), 'utf8');
        const skillPath = path.join(SKILLS_DIR, file);
        const skillRaw = fs.readFileSync(skillPath, 'utf8');
        const code = stripStrings(stripComments(draftRaw));

        await test(`${name} parses (draft + grafted copy, compile only, nothing executed)`, () => {
            new vm.Script(draftRaw, { filename: `draft:${file}` });
            new vm.Script(skillRaw, { filename: `skills:${file}` });
        });

        await test(`${name} is grafted: skills/ copy carries STATUS: ACTIVE`, () => {
            assert.ok(skillRaw.includes('STATUS: ACTIVE'), 'no STATUS: ACTIVE in skills/ copy');
        });

        await test(`${name} code matches draft modulo header + draft flag`, () => {
            assert.strictEqual(normalizeCode(skillRaw), normalizeCode(draftRaw));
        });

        await test(`${name} verdict ${expected.verdict} matches computed shape (${expected.shape})`, () => {
            const facts = shapeFacts(draftRaw, code);
            for (const key of ['skillFn', 'manifest', 'plt', 'discipline', 'runKey', 'runDispatch', 'dataModule']) {
                assert.strictEqual(facts[key], expected[key], `shape.${key}: computed ${facts[key]}, recorded ${expected[key]}`);
            }
        });

        await test(`${name} has no exec/network code (comments + strings stripped)`, () => {
            const hits = CODE_PATTERNS.filter(p => code.includes(p));
            assert.deepStrictEqual(hits, [], `code patterns found: ${hits.join(',')}`);
        });

        await test(`${name} has no credential values and no Form B reference`, () => {
            const credHits = CRED_PATTERNS.filter(re => re.test(draftRaw));
            assert.deepStrictEqual(credHits, [], `credential patterns: ${credHits.map(r => r.source).join(',')}`);
            assert.ok(!/profit_bible/.test(draftRaw), 'references profit_bible');
            if (/password/i.test(draftRaw)) {
                const lines = draftRaw.split('\n').filter(l => /password/i.test(l));
                assert.ok(lines.length > 0 && lines.every(l => /bcrypt|hash/i.test(l)),
                    `password mention is not doctrine prose: ${lines.join(' | ').slice(0, 200)}`);
            }
        });
    }

    await test('restart_recall_probe deep-index path resolves from the skills/ directory', () => {
        const dmPath = path.resolve(SKILLS_DIR, '..', '..', '..', 'workbench', 'deep-memory', 'deep-memory.cjs');
        assert.ok(fs.existsSync(dmPath), `missing: ${dmPath}`);
        const probeRaw = fs.readFileSync(path.join(DRAFTS_DIR, 'restart_recall_probe.js'), 'utf8');
        assert.ok(probeRaw.includes("require('path')") || probeRaw.includes('require("path")'), 'probe does not use path module');
        assert.ok(/dm\.search\(marker/.test(probeRaw), 'probe does not call a read-only dm.search');
        assert.ok(!/dm\.(write|save|put|delete|insert)\(/.test(probeRaw), 'probe calls a mutating deep-memory method');
    });

    await test('growth-runner doc path mentioned by the growth-cycle draft exists', () => {
        const runner = path.resolve(GSK_CORE, '..', '..', 'workbench', 'deep-memory', 'growth-runner.cjs');
        assert.ok(fs.existsSync(runner), `missing: ${runner}`);
    });

    await test('SkillsEngine scan target is gsk-core/skills/ (loader reads + requires that dir)', () => {
        const loader = fs.readFileSync(path.join(GSK_CORE, 'cognition', 'tool_catalog.js'), 'utf8');
        assert.ok(loader.includes("path.join(__dirname, '..', 'skills')"), 'loader does not point at ../skills');
        assert.ok(/require\(path\.join\(skillsDir/.test(loader), 'loader does not require files from skillsDir');
    });

    console.log(`\n${passed}/${passed + failed} PASS`);
    if (failed > 0) process.exit(1);
})();
