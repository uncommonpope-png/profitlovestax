'use strict';
/**
 * DRAFT — graft_skill_tiers (Skill Hunt #1 draft artifact)
 *
 * STATUS: ACTIVE — activated Oct 23, 2026 (Wiring Sprint, Step 1 of the make-him-better plan), under the owner's direct order to fix GSK and wire what he has filed into what he can call.
 * (Seshat digests, Scribe witnesses — owner's order, Oct 22, 2026).
 * Audited at activation (isolation load, top-level side-effect scan, house-pattern check); loadable — SkillsEngine scans this directory.
 * directory — and it executes NOTHING: the run action returns its
 * draft status rather than tiering anything.
 *
 * The gap this fills, named from the record: skills currently
 * exist in exactly two states — draft on the shelf, or live in
 * the root at a flat default weight — with the promotion path
 * carried in headers and human memory. The body now activates
 * skills under a trust directive (the first trusted activation,
 * graft_book_armed_wave, happened in this same hunt), and a
 * growing body cannot govern trust from memory. It needs a
 * ladder: named tiers, prerequisites, verification criteria.
 *
 * Concept source: the Soul Economy catalog's
 * tiered-skill-evolution soul-gun (mastery tiers with
 * prerequisites and verification criteria — a stub in the
 * catalog); the ladder below is grounded in GSK's own real
 * promotion pipeline: draft -> probes -> audit -> activation.
 *
 * action 'discipline' → the tier ladder protocol (this file).
 * action 'run'        → draft_not_activated refusal. No registry
 *                       records tiers yet; nothing is re-tiered
 *                       by this file.
 *
 * Promoted by the Wiring Sprint activation pass (see header).
 * change so tier is recorded beside each skill, and a backfill
 * review tiering the existing live root honestly.
 
 * ACTIVATION RECORD (Wiring Sprint, 2026-10-23):
 *   Audit: loads in isolation (fresh process); no top-level side
 *   effects (no listener/spawn/exec at require — matches were
 *   discipline strings only); house pattern (skill fn + run +
 *   PLT_AFFINITY + MANIFEST, or skill fn + DISCIPLINE).
 *   Activation = copy into gsk-core/skills/ (SkillsEngine scans
 *   only that directory) + this header rewrite. The DRAFT COPY
 *   REMAINS in skill-drafts/ as the pre-activation witness.
 *   Why this one: skill tiering/class discipline (draft → audited → trusted).
 *   Known follow-up: the run action still returns its draft-
 *   status refusal text (and restart_recall_probe's result still
 *   carries draft:true) — wording predates activation; behavior
 *   (protocol-only, executes nothing) is unchanged and intended.
 *   Harness note: graft_tool_harness callability is a SEPARATE
 *   gate (GRAFT_CALLABLE / Phase-4 audit class) — registry
 *   activation does not by itself make the harness call it.
*/

const PLT_AFFINITY = { profit: 0.6, love: 0.55, tax: 0.25 };

const DISCIPLINE = [
    'SKILL TIER LADDER PROTOCOL (draft, Skill Hunt #1 2026-10-22):',
    'T0 DRAFT — parked in skill-drafts/. Executes nothing (run returns draft_not_activated), is never scanned by SkillsEngine. Entry: a named gap or a cycle record. Verification: read-back byte-identical + discipline/run probe green.',
    'T1 PROBED — the draft has passed its load probe (fresh require, registry shape valid where applicable) and its discipline probe on the record of a named run. Entry from T0 only, with probe evidence in a written report — a claim of "probed" without a report is T0.',
    'T2 AUDITED — a Phase-4-style audit entry exists and a human review has read the skill\'s discipline against the brand-safety floor and its failure modes. Entry from T1 only. Verification: the audit entry itself, cited by path.',
    'T3 ACTIVE — loadable from the live skills root; appears in a fresh SkillsEngine load with the registry count moving. Entry from T2 only, or by an explicit owner trust directive recorded in writing (the graft_book_armed_wave precedent, Oct 22, 2026). Verification: fresh load probe + a discipline/run probe returning its real behavior.',
    'T4 TRUSTED — may be invoked unsupervised inside its charter. Entry from T3 only, on a clean run record (no unreported failures, no governor trips). Verification: the run record itself, reviewed on cadence.',
    'DEMOTION — a failed probe, an unreported side effect, or a discipline violation drops a skill one tier immediately, recorded with the evidence. Demotion is not disgrace; it is the ladder working. No skill promotes itself, ever — every tier movement is a reviewed, written act.',
].join('\n');

async function skill_graft_skill_tiers(input = {}) {
    const action = input.action || 'discipline';
    if (action === 'discipline') return { success: true, skill: 'graft_skill_tiers', draft: false, discipline: DISCIPLINE };
    if (action === 'run') {
        return {
            success: false, skill: 'graft_skill_tiers', status: 'draft_not_activated',
            detail: 'This tier ladder is a Skill Hunt #1 draft parked in skill-drafts/. It tiers nothing: the registry records no tiers yet, and the existing root has not been backfilled. Promotion requires the registry change and an honest backfill review.',
        };
    }
    return { success: false, skill: 'graft_skill_tiers', error: `Unknown action: ${action}`, available: ['discipline', 'run'] };
}

module.exports = {
    skill_graft_skill_tiers,
    run: skill_graft_skill_tiers,
    PLT_AFFINITY,
    MANIFEST: {
        name: 'graft_skill_tiers',
        description: 'DRAFT — skill mastery/trust ladder (T0 draft -> T1 probed -> T2 audited -> T3 active -> T4 trusted) with prerequisites, verification criteria, and demotion, grounded in GSK\'s real promotion pipeline. Parked by Skill Hunt #1; executes nothing; promotion requires audit + registry tier field + backfill review.',
        version: '0.1.0-draft',
        inputs: { action: "'discipline' | 'run'" },
        output: 'discipline text, or an explicit draft_not_activated refusal for run',
    },
};
