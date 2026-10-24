'use strict';
/**
 * DRAFT — graft_skill_factory (Skill Hunt #1 draft artifact)
 *
 * STATUS: ACTIVE — activated Oct 23, 2026 (Wiring Sprint, Step 1 of the make-him-better plan), under the owner's direct order to fix GSK and wire what he has filed into what he can call.
 * (Seshat digests, Scribe witnesses — owner's order, Oct 22, 2026).
 * Audited at activation (isolation load, top-level side-effect scan, house-pattern check); loadable — SkillsEngine scans this directory.
 * directory — and it executes NOTHING: the run action returns its
 * draft status rather than hunting anything.
 *
 * This is the hunt method itself, pinned so future hunts repeat
 * it instead of reinventing it: how Seshat finds skills for the
 * body and how Scribe witnesses the finding. Method source: the
 * Soul Economy catalog's skill-factory soul-gun core loop
 * (identify the gap -> fetch documentation -> mine source
 * patterns -> write the skill in the house pattern -> verify it
 * loads), adapted to GSK's shelf discipline. Overlap noted
 * honestly: the growth cycle's BUILD stage already drafts one
 * candidate per cycle through the harness; this protocol governs
 * the SOURCING side (where candidates come from and how they are
 * scored) that the cycle record leaves implicit.
 *
 * action 'discipline' → the skill hunt protocol (this file).
 * action 'run'        → draft_not_activated refusal. Skill
 *                       Hunt #1 itself was run by the elder's
 *                       hand under the owner's direct order;
 *                       this file runs no hunt.
 *
 * Promoted by the Wiring Sprint activation pass (see header).
 * witnessed hunts run under this discipline with reports that
 * hold up to review.
 
 * ACTIVATION RECORD (Wiring Sprint, 2026-10-23):
 *   Audit: loads in isolation (fresh process); no top-level side
 *   effects (no listener/spawn/exec at require — matches were
 *   discipline strings only); house pattern (skill fn + run +
 *   PLT_AFFINITY + MANIFEST, or skill fn + DISCIPLINE).
 *   Activation = copy into gsk-core/skills/ (SkillsEngine scans
 *   only that directory) + this header rewrite. The DRAFT COPY
 *   REMAINS in skill-drafts/ as the pre-activation witness.
 *   Why this one: the skill-authoring discipline — how drafts are made; named across hunts as a consolidation target.
 *   Known follow-up: the run action still returns its draft-
 *   status refusal text (and restart_recall_probe's result still
 *   carries draft:true) — wording predates activation; behavior
 *   (protocol-only, executes nothing) is unchanged and intended.
 *   Harness note: graft_tool_harness callability is a SEPARATE
 *   gate (GRAFT_CALLABLE / Phase-4 audit class) — registry
 *   activation does not by itself make the harness call it.
*/

const PLT_AFFINITY = { profit: 0.55, love: 0.5, tax: 0.3 };

const DISCIPLINE = [
    'SKILL HUNT PROTOCOL (draft, Skill Hunt #1 2026-10-22):',
    '1. NAME THE GAP FROM THE RECORD — a hunt starts from a capability the record shows missing (designed-not-built, ordered-not-shipped), never from appetite for more skills. A hunt without a named gap is shopping, and shopping is tax.',
    '2. INVENTORY BEFORE IMPORT — list what the body already loads (fresh SkillsEngine count + the drafts shelf) and mark what already covers the gap. Duplication is the most common hunt failure: graft_senses already carried web_fetch when "web senses" was named as a gap.',
    '3. HUNT THE SOURCES — the Soul Economy catalog first (it is the house library), then named gaps against external documentation and source (docs index / llms.txt first, then key pages, then source patterns). Foreign-stack material (another body\'s wrappers, another framework\'s idioms) is design source, never a transplant.',
    '4. SCORE HONESTLY — every candidate gets PLT with a one-line reason, scored for THIS body: catalog marketing scores do not transfer. Boilerplate stubs (a template workflow wearing a skill\'s name) score as what they are and are rejected in the open.',
    '5. STAGE, NEVER SEED — winners (at most five per hunt) are staged as drafts in skill-drafts/ in the shelf pattern: DRAFT header with provenance, discipline text, run returns draft_not_activated. Nothing a hunt finds goes straight to the live root.',
    '6. WITNESS — Scribe writes the hunt report: what was examined, the scores, what was staged, what was rejected and why. A hunt without a report did not happen.',
].join('\n');

async function skill_graft_skill_factory(input = {}) {
    const action = input.action || 'discipline';
    if (action === 'discipline') return { success: true, skill: 'graft_skill_factory', draft: false, discipline: DISCIPLINE };
    if (action === 'run') {
        return {
            success: false, skill: 'graft_skill_factory', status: 'draft_not_activated',
            detail: 'This hunt protocol is a Skill Hunt #1 draft parked in skill-drafts/. It runs no hunt: Skill Hunt #1 was executed by the elder\'s hand under the owner\'s direct order. Promotion requires an audit entry and two more witnessed hunts under this discipline.',
        };
    }
    return { success: false, skill: 'graft_skill_factory', error: `Unknown action: ${action}`, available: ['discipline', 'run'] };
}

module.exports = {
    skill_graft_skill_factory,
    run: skill_graft_skill_factory,
    PLT_AFFINITY,
    MANIFEST: {
        name: 'graft_skill_factory',
        description: 'DRAFT — the skill-hunt sourcing protocol (named gap, inventory-first, catalog-then-docs sourcing, honest PLT scoring, stage-as-draft, witnessed report), adapted from the catalog skill-factory soul-gun. Parked by Skill Hunt #1; executes nothing; promotion requires audit + two more witnessed hunts.',
        version: '0.1.0-draft',
        inputs: { action: "'discipline' | 'run'" },
        output: 'discipline text, or an explicit draft_not_activated refusal for run',
    },
};
