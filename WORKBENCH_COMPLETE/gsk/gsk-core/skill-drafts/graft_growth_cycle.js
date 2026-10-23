'use strict';
/**
 * DRAFT — graft_growth_cycle (Self-Growth Cycle #1 draft artifact)
 *
 * STATUS: DRAFT. Parked in gsk-core/skill-drafts/ by growth cycle #1.
 * Not audited (no Phase-4-style entry), not loadable — SkillsEngine
 * never scans this directory — and it executes NOTHING: the run
 * action returns its draft status rather than spawning the cycle.
 *
 * Intended shape, for the reviewed promotion decision: a thin skill
 * facade over the growth runner so the resident can invoke a cycle
 * through the same dispatch surface as every other capability:
 *
 *   action 'discipline' → the growth discipline (this file).
 *   action 'run'        → spawn `node deep-memory/growth-runner.cjs
 *                         run --spec <spec>` as a child process and
 *                         return its cycle record verbatim.
 *
 * Promotion requires: a Phase-4-style audit entry, a spec-allowlist
 * (the facade must never accept an arbitrary spec path from chat),
 * and a human review of cycle records. Until then this file is a
 * design pinned to the shelf — evidence the cycle drafted from its
 * own record, not a capability.
 */

const PLT_AFFINITY = { profit: 0.5, love: 0.6, tax: 0.3 };

const DISCIPLINE = [
    'GROWTH CYCLE DISCIPLINE (draft facade):',
    '1. A cycle ingests only named sources, digests them under PLT with the borderline judge, builds one real thing through the harness, drafts at most one skill candidate to the drafts shelf, and writes its own outcome back with evidence.',
    '2. Nothing a cycle produces activates itself. Drafts stay drafts until a reviewed promotion.',
    '3. Every cycle is one command with a clean exit code and a JSON record; a cycle that cannot prove a stage says so in the record.',
].join('\n');

async function skill_graft_growth_cycle(input = {}) {
    const action = input.action || 'discipline';
    if (action === 'discipline') return { success: true, skill: 'graft_growth_cycle', draft: true, discipline: DISCIPLINE };
    if (action === 'run') {
        return {
            success: false, skill: 'graft_growth_cycle', status: 'draft_not_activated',
            detail: 'This facade is a Cycle #1 draft parked in skill-drafts/. It runs nothing. The live path is the runner: node workbench/deep-memory/growth-runner.cjs run --spec <spec.cjs>. Promotion of this facade is a separate reviewed act.',
        };
    }
    return { success: false, skill: 'graft_growth_cycle', error: `Unknown action: ${action}`, available: ['discipline', 'run'] };
}

module.exports = {
    skill_graft_growth_cycle,
    run: skill_graft_growth_cycle,
    PLT_AFFINITY,
    MANIFEST: {
        name: 'graft_growth_cycle',
        description: 'DRAFT — proposed skill facade over the Seshat growth cycle (runner + spec). Parked by Self-Growth Cycle #1; executes nothing; promotion requires audit + spec allowlist + human review.',
        version: '0.1.0-draft',
        inputs: { action: "'discipline' | 'run'" },
        output: 'discipline text, or an explicit draft_not_activated refusal for run',
    },
};
