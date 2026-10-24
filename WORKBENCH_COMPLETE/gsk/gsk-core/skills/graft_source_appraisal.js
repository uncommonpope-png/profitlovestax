'use strict';
/**
 * DRAFT — graft_source_appraisal (Skill Hunt #1 draft artifact)
 *
 * STATUS: ACTIVE — activated Oct 23, 2026 (Wiring Sprint, Step 1 of the make-him-better plan), under the owner's direct order to fix GSK and wire what he has filed into what he can call.
 * (Seshat digests, Scribe witnesses — owner's order, Oct 22, 2026).
 * Audited at activation (isolation load, top-level side-effect scan, house-pattern check); loadable — SkillsEngine scans this directory.
 * directory — and it executes NOTHING: the run action returns its
 * draft status rather than appraising anything.
 *
 * The gap this fills, named from the record: the body already
 * fetches (graft_senses web_fetch, http_client, web_search,
 * crawlers) and graft_digestion already PLT-scores CONTENT at
 * intake with injection screening. Nothing appraises the SOURCE
 * before its content is weighed — who publishes it, with what
 * interest, by what method. Digestion can land a well-written
 * page from a rotten source at full confidence.
 *
 * Method source: the Soul Economy catalog's
 * critical-source-evaluation soul-gun (objectivity & bias
 * detection, methodology scrutiny, reliability & credibility
 * assessment) — insights-only in the catalog; the working
 * discipline below is pinned from it for GSK's intake tract.
 *
 * action 'discipline' → the source appraisal protocol (this file).
 * action 'run'        → draft_not_activated refusal. The live
 *                       intake path remains graft_digestion; this
 *                       appraisal step is not wired into it.
 *
 * Promoted by the Wiring Sprint activation pass (see header).
 * graft_digestion's intake as an upstream step (never a fork of
 * it), and a review of verdict records on real batches.
 
 * ACTIVATION RECORD (Wiring Sprint, 2026-10-23):
 *   Audit: loads in isolation (fresh process); no top-level side
 *   effects (no listener/spawn/exec at require — matches were
 *   discipline strings only); house pattern (skill fn + run +
 *   PLT_AFFINITY + MANIFEST, or skill fn + DISCIPLINE).
 *   Activation = copy into gsk-core/skills/ (SkillsEngine scans
 *   only that directory) + this header rewrite. The DRAFT COPY
 *   REMAINS in skill-drafts/ as the pre-activation witness.
 *   Why this one: source-appraisal discipline — the hunt vetting rubric in callable form (TV scoring before queueing).
 *   Known follow-up: the run action still returns its draft-
 *   status refusal text (and restart_recall_probe's result still
 *   carries draft:true) — wording predates activation; behavior
 *   (protocol-only, executes nothing) is unchanged and intended.
 *   Harness note: graft_tool_harness callability is a SEPARATE
 *   gate (GRAFT_CALLABLE / Phase-4 audit class) — registry
 *   activation does not by itself make the harness call it.
*/

const PLT_AFFINITY = { profit: 0.65, love: 0.6, tax: 0.2 };

const DISCIPLINE = [
    'SOURCE APPRAISAL PROTOCOL (draft, Skill Hunt #1 2026-10-22):',
    '1. APPRAISE BEFORE YOU WEIGH — every external source offered to digestion gets a source appraisal first. Content PLT scoring (graft_digestion) judges what a page says; appraisal judges where it comes from. Both ride into the digestion record; neither substitutes for the other.',
    '2. PROVENANCE — who publishes this, under an accountable identity? Named author / organization with a track record outranks an anonymous page; a source that cannot say who it is starts flagged, not trusted.',
    '3. OBJECTIVITY & BIAS — name the publisher\'s interest in the claim being believed (selling, recruiting, litigating, campaigning). Surface framing and assumption load: what must a reader already believe for the text to read as neutral?',
    '4. METHODOLOGY — how were the claims produced? Data collection, analytical approach, primary vs secondhand reporting. A claim with no visible method is an assertion, and is recorded as one.',
    '5. CREDIBILITY — corroboration by independent sources (not copies of the same wire), correction history, and consistency with what the body already holds as verified. One source agreeing with itself five times is one source.',
    '6. VERDICT RIDES ALONG — the appraisal lands as a short record attached to the source in the digestion batch: provenance, interest, method, corroboration, and a rating (trusted / usable-flagged / assertion-only). A failed appraisal does NOT censor: the content may still digest, flagged, and its PLT tax is weighed with the flag visible. The injection screen is untouched — appraisal is upstream of it, never a replacement.',
].join('\n');

async function skill_graft_source_appraisal(input = {}) {
    const action = input.action || 'discipline';
    if (action === 'discipline') return { success: true, skill: 'graft_source_appraisal', draft: false, discipline: DISCIPLINE };
    if (action === 'run') {
        return {
            success: false, skill: 'graft_source_appraisal', status: 'draft_not_activated',
            detail: 'This appraisal protocol is a Skill Hunt #1 draft parked in skill-drafts/. It appraises nothing yet: the live intake path is graft_digestion, and this step is not wired into it. Promotion is a reviewed wiring act, not a file move alone.',
        };
    }
    return { success: false, skill: 'graft_source_appraisal', error: `Unknown action: ${action}`, available: ['discipline', 'run'] };
}

module.exports = {
    skill_graft_source_appraisal,
    run: skill_graft_source_appraisal,
    PLT_AFFINITY,
    MANIFEST: {
        name: 'graft_source_appraisal',
        description: 'DRAFT — source-level appraisal (provenance, bias, methodology, credibility) upstream of graft_digestion content scoring, pinned from the catalog critical-source-evaluation soul-gun. Parked by Skill Hunt #1; executes nothing; promotion requires audit + reviewed wiring into digestion intake.',
        version: '0.1.0-draft',
        inputs: { action: "'discipline' | 'run'" },
        output: 'discipline text, or an explicit draft_not_activated refusal for run',
    },
};
