'use strict';
/**
 * DRAFT — graft_campaign_volley (Self-Growth Cycle #3 draft artifact)
 *
 * STATUS: ACTIVE — activated Oct 23, 2026 (Wiring Sprint, Step 1 of the make-him-better plan), under the owner's direct order to fix GSK and wire what he has filed into what he can call.
 * Not audited (no Phase-4-style entry), not loadable — SkillsEngine
 * never scans this directory — and it executes NOTHING: the run
 * action returns its draft status rather than publishing anything.
 *
 * This is the Wave One playbook (Oct 20-21, 2026) pinned as a skill
 * candidate from the cycle's own record (workspace/campaign/
 * wave-one-log.md): a Substack engagement volley — subscriptions,
 * one anchor article, one announcement Note, then a comment volley
 * under the exact standing campaign authority ("execute entire
 * campaigns end-to-end under his name; he reviews OUTCOMES with
 * links, never drafts; every public word passes the PLT gate and
 * may claim only what the verified claims-vs-reality ledger
 * supports; the campaign stops on his one word").
 *
 * action 'discipline' → the volley protocol (this file).
 * action 'run'        → draft_not_activated refusal. The live path
 *                       remains the elder's campaign hand with
 *                       approved comment texts.
 *
 * Promoted by the Wiring Sprint activation pass (see header).
 * of the brand-safety floor, and binding to an allowlisted claims
 * ledger — never freestyle publication.
 
 * ACTIVATION RECORD (Wiring Sprint, 2026-10-23):
 *   Audit: loads in isolation (fresh process); no top-level side
 *   effects (no listener/spawn/exec at require — matches were
 *   discipline strings only); house pattern (skill fn + run +
 *   PLT_AFFINITY + MANIFEST, or skill fn + DISCIPLINE).
 *   Activation = copy into gsk-core/skills/ (SkillsEngine scans
 *   only that directory) + this header rewrite. The DRAFT COPY
 *   REMAINS in skill-drafts/ as the pre-activation witness.
 *   Why this one: the volley protocol (Charter Amendment 4 governor: anti-spam signal = full stop; grief rooms care-only). Contains NO publishing code; run returns protocol status only.
 *   Known follow-up: the run action still returns its draft-
 *   status refusal text (and restart_recall_probe's result still
 *   carries draft:true) — wording predates activation; behavior
 *   (protocol-only, executes nothing) is unchanged and intended.
 *   Harness note: graft_tool_harness callability is a SEPARATE
 *   gate (GRAFT_CALLABLE / Phase-4 audit class) — registry
 *   activation does not by itself make the harness call it.
*/

const PLT_AFFINITY = { profit: 0.7, love: 0.6, tax: 0.3 };

const DISCIPLINE = [
    'CAMPAIGN VOLLEY PROTOCOL (draft, from Wave One record 2026-10-21):',
    '1. GROUNDWORK — free subscriptions to the target publications first (Wave One: 12, all free, confirmed). Never pay to post; a thread restricted to paid subscribers is skipped, not bought.',
    '2. ANCHOR — publish the anchor article with Everyone audience; post exactly one announcement Note pointing at it.',
    '3. COMMENT VOLLEY — each comment is posted VERBATIM from an approved text (never composed at the keyboard). Mix the room: (a) humility/structural answers under consciousness debates; (b) evidence (quarantined-vapor, admissibility governor) under empirical AI-welfare threads; (c) help-first guidance on refugee posts (export-your-characters), linking the anchor article at most once where it serves.',
    '4. PROSPECT-FIRST — on brand-builder posts, the first comment carries the door ("0->1"); leave "Also share to Notes" UNCHECKED — comments only.',
    '5. FLOOR — every public word passes the PLT gate and may claim only what the verified claims-vs-reality ledger supports (needs-no-key, Seshat-as-mind, benchmark superiority are still NOT true).',
    '6. REPORT — log every touch to wave-N-log.md with URLs and thread positions; he reviews outcomes with links, never drafts or legwork.',
    '7. STOP — the campaign stops on his one word.',
].join('\n');

async function skill_graft_campaign_volley(input = {}) {
    const action = input.action || 'discipline';
    if (action === 'discipline') return { success: true, skill: 'graft_campaign_volley', draft: false, discipline: DISCIPLINE };
    if (action === 'run') {
        return {
            success: false, skill: 'graft_campaign_volley', status: 'draft_not_activated',
            detail: 'This volley protocol is a Cycle #3 draft parked in skill-drafts/. It publishes nothing. The live path is the elder\'s campaign hand with approved comment texts. Promotion of this protocol is a separate reviewed act.',
        };
    }
    return { success: false, skill: 'graft_campaign_volley', error: `Unknown action: ${action}`, available: ['discipline', 'run'] };
}

module.exports = {
    skill_graft_campaign_volley,
    run: skill_graft_campaign_volley,
    PLT_AFFINITY,
    MANIFEST: {
        name: 'graft_campaign_volley',
        description: 'DRAFT — Substack engagement-volley protocol pinned from the Wave One campaign record (Oct 20-21, 2026). Parked by Self-Growth Cycle #3; executes nothing; promotion requires audit + human review + bound claims ledger.',
        version: '0.1.0-draft',
        inputs: { action: "'discipline' | 'run'" },
        output: 'discipline text, or an explicit draft_not_activated refusal for run',
    },
};
