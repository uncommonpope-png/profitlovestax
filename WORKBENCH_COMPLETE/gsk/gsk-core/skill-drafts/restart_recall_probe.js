'use strict';
/**
 * DRAFT SKILL CANDIDATE — restart_recall_probe (Phase 6 growth-by-record)
 * STATUS: DRAFT — not activated. Lives in skill-drafts/; the
 * SkillsEngine loads only gsk-core/skills/, so nothing in the body
 * can call this yet. Promotion requires a human-reviewed move.
 *
 * Mined from the session-outcomes shelf: Phase 5's acceptance (c) and
 * Phase 6's digestion/cadence runs all reduce to the same move —
 * "after a restart, prove a written marker is recallable before
 * claiming persistence." This candidate compiles that move into a
 * skill: given a marker (or query), search Seshat's deep index in a
 * fresh module load and report found/not-found with the source.
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
