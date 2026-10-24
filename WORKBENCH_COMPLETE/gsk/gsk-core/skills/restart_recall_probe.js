'use strict';
/**
 * DRAFT SKILL CANDIDATE — restart_recall_probe (Phase 6 growth-by-record)
 * STATUS: ACTIVE — activated Oct 23, 2026 (Wiring Sprint, Step 1 of the make-him-better plan), under the owner's direct order to fix GSK and wire what he has filed into what he can call.
 * SkillsEngine loads only gsk-core/skills/, so nothing in the body
 * can call this yet. Promoted by the Wiring Sprint activation pass (see header).
 *
 * Mined from the session-outcomes shelf: Phase 5's acceptance (c) and
 * Phase 6's digestion/cadence runs all reduce to the same move —
 * "after a restart, prove a written marker is recallable before
 * claiming persistence." This candidate compiles that move into a
 * skill: given a marker (or query), search Seshat's deep index in a
 * fresh module load and report found/not-found with the source.
 
 * ACTIVATION RECORD (Wiring Sprint, 2026-10-23):
 *   Audit: loads in isolation (fresh process); no top-level side
 *   effects (no listener/spawn/exec at require — matches were
 *   discipline strings only); house pattern (skill fn + run +
 *   PLT_AFFINITY + MANIFEST, or skill fn + DISCIPLINE).
 *   Activation = copy into gsk-core/skills/ (SkillsEngine scans
 *   only that directory) + this header rewrite. The DRAFT COPY
 *   REMAINS in skill-drafts/ as the pre-activation witness.
 *   Why this one: post-restart persistence probe: searches Seshat's deep index in a fresh module load and reports found/not-found with source (Phase 6 mined candidate). Registered via its skill_ export.
 *   Known follow-up: the run action still returns its draft-
 *   status refusal text (and restart_recall_probe's result still
 *   carries draft:true) — wording predates activation; behavior
 *   (protocol-only, executes nothing) is unchanged and intended.
 *   Harness note: graft_tool_harness callability is a SEPARATE
 *   gate (GRAFT_CALLABLE / Phase-4 audit class) — registry
 *   activation does not by itself make the harness call it.
*/
const path = require('path');
const PLT_AFFINITY = { profit: 0.4, love: 0.5, tax: 0.2 };
async function skill_restart_recall_probe(input = {}) {
    const marker = String(input.marker || input.query || '');
    if (!marker) return { success: false, skill: 'restart_recall_probe', error: 'marker required' };
    const dmPath = path.resolve(__dirname, '..', '..', '..', 'workbench', 'deep-memory', 'deep-memory.cjs');
    delete require.cache[require.resolve(dmPath)];
    const dm = require(dmPath);
    const hits = dm.search(marker, 6, { perSourceCap: 10 });
    const hit = (hits || []).find(h => (h.text || '').includes(marker) || (h.title || '').includes(marker));
    return {
        success: !!hit, skill: 'restart_recall_probe', draft: true,
        found: !!hit, marker,
        source: hit ? hit.source : null, shelf: hit ? hit.shelf : null, score: hit ? hit.score : null,
        note: hit ? 'marker is recallable from the deep index in a fresh load' : 'marker NOT recallable — persistence not proven',
    };
}
module.exports = { skill_restart_recall_probe, PLT_AFFINITY, MANIFEST: { name: 'restart_recall_probe', description: 'DRAFT: prove a written marker is recallable from Seshat deep memory in a fresh load (post-restart persistence probe).', version: '0.1.0-draft', inputs: { marker: 'string' }, output: '{ found, source, shelf, score }' } };
