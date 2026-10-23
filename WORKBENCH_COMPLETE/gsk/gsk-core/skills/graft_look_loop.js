'use strict';
/**
 * GRAFT — LOOK LOOP (Make-Him-Better Front 1)
 *
 * The harness's eyes. Until this graft, an HTML build was "verified"
 * by byte read-back alone: the file on disk matched the file the seat
 * meant to write, and that was called done — while the Soul Keeper
 * game shipped keyboard-only against a phone commission, because
 * nobody in the loop had ever SEEN it. This graft closes that hole:
 *
 *     RENDER (phone 360×800 touch + desktop, with tap/drag probes)
 *       → JUDGE (vision seat vs a written rubric: renders /
 *         interaction / fidelity / polish, each 0–1 with reasons)
 *       → REVISE (critique back into the text chain; complete-file
 *         revisions only) → RENDER → JUDGE … (cap 3 revisions)
 *
 * The engine lives in ../brain/look_loop.js; this skill is its
 * harness-facing wrapper. The harness (graft_tool_harness) invokes it
 * automatically for every HTML file a build writes, and a build may
 * report "completed" only when the loop returns passed WITH final
 * screenshots + scores attached. If the renderer or the vision seat
 * is unavailable the loop reports UNSEEN — never a silent pass.
 */

const { lookLoop, BAR } = require('../brain/look_loop.js');

const PLT_AFFINITY = { profit: 0.8, love: 0.5, tax: 0.3 };

function formatReport(v) {
    const lines = [];
    if (!v.seen) {
        lines.push(`LOOK LOOP: UNSEEN — ${v.error}: ${v.detail || ''}`.trim());
        return lines.join('\n');
    }
    lines.push(`LOOK LOOP: ${v.status.toUpperCase()} after ${v.revisionsUsed} revision(s) — bar ${JSON.stringify(BAR)}`);
    for (const r of v.rounds) {
        if (r.scores) {
            lines.push(`  round ${r.label}: renders=${r.scores.renders} interaction=${r.scores.interaction} fidelity=${r.scores.fidelity} polish=${r.scores.polish}${r.passed ? ' — PASSED' : ` — below bar: ${r.belowBar.join(', ')}`} (judge: ${r.judgeProvider}/${r.judgeModel})`);
            for (const c of (r.critique || [])) lines.push(`    critique: ${c}`);
        }
        if (r.revisionError) lines.push(`  revision failed: ${r.revisionError}`);
        if (r.revision) lines.push(`  revision applied by ${r.revision.provider}/${r.revision.model} — ${r.revision.bytes} bytes, sha256 ${r.revision.newSha256.slice(0, 12)}…`);
    }
    if (v.screenshots) {
        lines.push('  final screenshots:');
        for (const [k, p] of Object.entries(v.screenshots)) lines.push(`    ${k}: ${p}`);
    }
    return lines.join('\n');
}

async function skill_graft_look_loop(input = {}, brain, memory) {
    const action = input.action || 'run';
    if (action === 'discipline') {
        return {
            success: true, skill: 'graft_look_loop',
            discipline: [
                'LOOK LOOP — an HTML artifact is not done until it has been SEEN:',
                '1. RENDER IT: phone (touch) and desktop viewports, with a tap and a drag — a screenshot of the start screen alone proves nothing.',
                '2. JUDGE THE FRAMES, NOT THE BYTES: renders / interaction / fidelity / polish, each scored against the commission brief by the vision seat.',
                '3. BELOW THE BAR MEANS REVISE: the judge\'s specific critiques go back to the build seat; a revision must be a complete file or it does not land.',
                '4. UNSEEN IS A VERDICT, NOT A PASS: no renderer or no vision seat → the build is reported UNSEEN, never silently completed.',
                `5. THE BAR: renders ≥ ${BAR.renders}, interaction ≥ ${BAR.interaction}, fidelity ≥ ${BAR.fidelity}, polish ≥ ${BAR.polish} — on the final frames, with the screenshots attached to the report.`,
            ].join('\n'),
        };
    }
    if (action === 'run') {
        const v = await lookLoop({
            htmlPath: input.htmlPath || input.path,
            brief: input.brief || input.task || '',
            outDir: input.outDir,
            maxRevisions: input.maxRevisions,
        });
        return {
            success: v.success === true,
            skill: 'graft_look_loop',
            status: v.status, // passed | below_bar | unseen
            seen: v.seen,
            error: v.error,
            detail: v.detail,
            artifactPath: v.artifactPath,
            artifactSha256: v.artifactSha256,
            revisionsUsed: v.revisionsUsed,
            finalScores: v.finalScores,
            finalReasons: v.finalReasons,
            finalCritique: v.finalCritique,
            screenshots: v.screenshots,
            rounds: v.rounds,
            report: formatReport(v),
        };
    }
    return { success: false, skill: 'graft_look_loop', error: `Unknown action: ${action}`, available: ['run', 'discipline'] };
}

module.exports = {
    skill_graft_look_loop,
    run: skill_graft_look_loop,
    _formatReport: formatReport,
    PLT_AFFINITY,
    MANIFEST: {
        name: 'graft_look_loop',
        description: 'Look loop (Make-Him-Better Front 1 graft): renders an HTML artifact headlessly at phone (360×800, touch, with tap+drag probes) and desktop viewports, has the vision seat score the frames against the commission brief (renders/interaction/fidelity/polish, 0–1 each with reasons + specific critiques), feeds failing critiques into up to 3 complete-file revisions, and returns passed ONLY with final screenshots + scores attached. No renderer or no vision seat → status "unseen", never a silent pass. Engine: brain/look_loop.js.',
        version: '1.0.0',
        inputs: { action: "'run' (default) | 'discipline'", htmlPath: 'path to the HTML artifact', brief: 'the commission brief the artifact is judged against', outDir: 'where screenshots/contact sheets land (default: <artifact dir>/look-loop)', maxRevisions: '0–3 (default 3)' },
        output: '{ success (true only when passed), status: passed|below_bar|unseen, seen, finalScores, finalReasons, finalCritique, screenshots, rounds, artifactSha256, report }',
    },
};
