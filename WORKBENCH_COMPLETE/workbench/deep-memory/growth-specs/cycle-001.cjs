'use strict';
/**
 * GROWTH CYCLE #1 SPEC — IGNITION (2026-10-21).
 *
 * Growth food: the true record of today — the surgery record itself,
 * the specimen README that shipped, and three substantive pages from
 * Seshat's second brain that have never been re-digested as growth
 * food (no DIGESTED - * record exists for them in pages/).
 *
 * Build task: the second-stage digestion judge, FOR REAL — the
 * harness writes graft_digestion_judge.js into the loadable skills
 * tree with a byte-compare read-back probe, proves the module loads
 * and parses verdicts, and proves it answers through the harness
 * dispatch surface. Whether it STAYS loadable is decided by the
 * judge-proof stage below (fixtures), not by this spec.
 */

const fs = require('fs');
const path = require('path');

const HERE = __dirname; // workbench/deep-memory/growth-specs
const WB = path.resolve(HERE, '..', '..');
const CLONE = path.resolve(HERE, '..', '..', '..', '..');
const DEEP = path.join(WB, '.seshat-brain', 'deep');
const JUDGE_DEST = path.resolve(HERE, '..', '..', '..', 'gsk', 'gsk-core', 'skills', 'graft_digestion_judge.js');

const judgeSource = fs.readFileSync(path.join(HERE, 'graft_digestion_judge.source.js'), 'utf8');
const draftSource = fs.readFileSync(path.join(HERE, 'graft_growth_cycle.draft.js'), 'utf8');

const judgeLoadCheck = [
    `const m = require(${JSON.stringify(JUDGE_DEST)});`,
    `const v = m._parseVerdict('{"verdict":"quarantine","substance":0.1,"reason":"polished vapor"}');`,
    `const bad = m._parseVerdict('this is not json');`,
    `console.log('JUDGE_LOADED ' + (v && v.verdict) + ' ' + bad);`,
    `if (!v || v.verdict !== 'quarantine' || bad !== null) process.exit(3);`,
].join('\n');

module.exports = {
    judge: true,
    sources: [
        { title: 'SURGERY.md — the Assembly record (Phases 1-7)', path: path.join(CLONE, 'SURGERY.md') },
        { title: 'profitlovestax — specimen README (as shipped)', path: path.resolve(CLONE, '..', 'profitlovestax', 'README.md') },
        { title: 'Second brain — SHIP-FIRST', path: path.join(DEEP, 'second-brain', 'SHIP-FIRST.md') },
        { title: 'Second brain — MODULAR-GRAFTING-PROTOCOL', path: path.join(DEEP, 'second-brain', 'MODULAR-GRAFTING-PROTOCOL.md') },
        { title: 'Second brain — SCRIBE-RECORD', path: path.join(DEEP, 'second-brain', 'SCRIBE-RECORD.md') },
    ],
    build: {
        task: 'Build the second-stage digestion judge (graft_digestion_judge) into the loadable skills tree',
        plt: { profit: 0.7, love: 0.5, tax: 0.3 },
        steps: [
            {
                skill: 'file_system',
                input: { action: 'write_file', path: JUDGE_DEST, content: judgeSource },
                // automatic read-back probe: byte-compare against what was written
            },
            {
                skill: 'code_exec',
                input: { code: judgeLoadCheck, language: 'javascript', timeout: 60000 },
                timeoutMs: 90000,
                verify: { contains: 'JUDGE_LOADED quarantine null' },
            },
            {
                skill: 'graft_digestion_judge',
                input: { action: 'discipline' },
                verify: { contains: 'DIGESTION JUDGE' },
            },
        ],
    },
    judgeProof: {
        fixtures: [
            { title: 'FIXTURE — fluent but empty (holistic excellence vapor)', path: path.join(HERE, 'fixture-fluent-empty.txt'), expect: 'quarantined' },
            { title: 'FIXTURE — good borderline (BM25 ranking, in brief)', path: path.join(HERE, 'fixture-good-borderline.txt'), expect: 'landed' },
        ],
    },
    draft: {
        fileName: 'graft_growth_cycle.js',
        content: draftSource,
        rationale: 'Cycle #1 ran end-to-end through the runner; the record supports drafting the skill facade that would let the resident invoke cycles through the dispatch surface. Draft only — promotion needs an audit entry, a spec allowlist, and human review.',
    },
};
