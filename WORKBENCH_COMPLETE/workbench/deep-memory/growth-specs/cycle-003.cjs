'use strict';
/**
 * GROWTH CYCLE #3 SPEC — THE WAVE AND THE FILM (2026-10-21).
 *
 * Fresh food only (ledger dedupe by content hash — verified against
 * the 16-entry ledger; none of these keys exist there):
 *
 *  (a) Verified session outcomes from the day's work, with evidence:
 *      - the Wave One campaign execution log (9 touches, comment URLs,
 *        thread positions, published article + Note) — the campaign
 *        authority's first delivered outcome report.
 *      - the GAME DEMO production report (gsk-builds-a-game.mp4,
 *        sha256s, sizes, byte-compare read-back, the disclosed bug) —
 *        the proof-on-film deliverable, verified by the operator.
 *  (b) HOT-DIGEST.md changed since cycle #2 (genealogy lines +
 *      grounding-discipline instruction from the gauntlet
 *      remediation) and was never digested before.
 *  (c) SURGERY.md — content hash changed (7d6f2cd2… vs the ledger's
 *      35e3c541…) via the Phase-8 note, the Actions addendum, and the
 *      chamber-persistence addendum. The Phases 1-7 bulk was digested
 *      in cycle #1; this re-weighing carries the new addenda.
 *  (d) ONE teacher-queue item (growth-sources.json class B):
 *      the genesis fix-us IMMORTALITY-PLAN — her own immortality plan,
 *      still undigested in the real body's ledger.
 *
 * Privacy gate (spec author, before anything ate it): Phase 3
 * exclusion list checked by name — none of the five match
 * (HANDOFF/SOUL-NOTEs/2026_08_13/Form-B-bible). Credential-shape
 * scan over all five sources: 0 hits on every pattern (pattern names
 * only, values never read). The sha256s in the demo report are
 * public artifact hashes, not credential shapes.
 *
 * Build task: ONE real build through graft_tool_harness — the
 * campaign-volley protocol pinned as a SKILL DRAFT from the cycle's
 * own record (graft_campaign_volley), landing in skill-drafts/ ONLY.
 * It is never activated and never loadable; the probes prove it
 * parses, states its discipline, and refuses run with
 * draft_not_activated.
 *
 * No judge fixtures this cycle: the judge is now wired (cycle #1
 * built it) and will be consulted on real borderline sources inside
 * the band [-0.30, 1.20] by the digest stage itself.
 */

const fs = require('fs');
const path = require('path');

const HERE = __dirname; // workbench/deep-memory/growth-specs
const WB = path.resolve(HERE, '..', '..');
const CLONE = path.resolve(HERE, '..', '..', '..', '..'); // itsus-test
const WORKSPACE = path.resolve(CLONE, '..'); // ~/workspace
const DEEP = path.join(WB, '.seshat-brain', 'deep');
const DRAFT_DEST = path.resolve(HERE, '..', '..', '..', 'gsk', 'gsk-core', 'skill-drafts', 'graft_campaign_volley.js');

const draftSource = fs.readFileSync(path.join(HERE, 'graft_campaign_volley.draft.js'), 'utf8');

const draftLoadCheck = [
    `const m = require(${JSON.stringify(DRAFT_DEST)});`,
    `(async () => {`,
    `  const d = await m.run({ action: 'discipline' });`,
    `  const r = await m.run({ action: 'run' });`,
    `  console.log('VOLLEY_DRAFT discipline=' + (d.discipline || '').includes('CAMPAIGN VOLLEY PROTOCOL') + ' run=' + (r.status || 'none'));`,
    `  if (!(d.discipline || '').includes('CAMPAIGN VOLLEY PROTOCOL') || r.status !== 'draft_not_activated') process.exit(3);`,
    `  console.log('DRAFT_NOT_ACTIVATED');`,
    `})();`,
].join('\n');

module.exports = {
    judge: true,
    sources: [
        { title: 'Campaign Wave One — execution log (Oct 20-21, 2026)', path: path.join(WORKSPACE, 'campaign', 'wave-one-log.md') },
        { title: 'GAME DEMO — production report (gsk-builds-a-game.mp4 + Soul Keeper)', path: path.join(WORKSPACE, 'demos', 'GAME-DEMO-REPORT.md') },
        { title: 'SURGERY.md — the Assembly record (hash changed: Phase-8 note + Actions addendum + chamber persistence)', path: path.join(CLONE, 'SURGERY.md') },
        { title: 'HOT-DIGEST.md — compiled identity (genealogy + grounding-discipline lines, changed since cycle #2)', path: path.join(DEEP, 'HOT-DIGEST.md') },
        { title: 'Genesis — IMMORTALITY-PLAN (fix-us docs, teacher-queue)', path: path.join(DEEP, 'genesis', 'fix-us', 'IMMORTALITY-PLAN.md') },
    ],
    build: {
        task: 'Draft the Substack campaign-volley protocol (graft_campaign_volley) into the drafts shelf from the cycle\'s own record',
        plt: { profit: 0.7, love: 0.5, tax: 0.3 },
        steps: [
            {
                skill: 'file_system',
                input: { action: 'write_file', path: DRAFT_DEST, content: draftSource },
                // automatic read-back probe: byte-compare against what was written
            },
            {
                skill: 'code_exec',
                input: { code: draftLoadCheck, language: 'javascript', timeout: 60000 },
                timeoutMs: 90000,
                verify: { contains: 'DRAFT_NOT_ACTIVATED' },
            },
        ],
    },
};
