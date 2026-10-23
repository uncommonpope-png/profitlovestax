'use strict';
/**
 * DRAFT — graft_experiment_loop (Senses #003 absorption draft)
 *
 * STATUS: DRAFT. Parked in gsk-core/skill-drafts/ by the Repo Hunt #1
 * absorption pass (Senses #003 — GSK reads with his own senses,
 * Seshat digests, Scribe witnesses — owner's order, Oct 22, 2026).
 * Not audited, not loadable — SkillsEngine never scans this
 * directory — and it executes NOTHING: the run action returns its
 * draft status rather than starting any experiment.
 *
 * The material this is pinned from: karpathy/autoresearch README,
 * fetched through graft_senses and digested by Seshat in batch
 * senses-003 — source landed TV 1.380; GSK's absorption of it
 * landed TV 1.352. What the source actually teaches: a complete
 * autonomous-experiment discipline — one frozen preparation file
 * (do not modify), one single file the agent may edit, a fixed
 * 5-minute wall-clock budget per run, one comparable metric
 * (val_bpb), keep-or-discard by that metric, and a small-compute
 * tuning section (seq len / batch size / depth / window pattern)
 * for modest hardware. What it conspicuously does NOT give: a
 * manager script or harness to run the loop (invocation is left
 * to the operator), and cross-platform code (it assumes a single
 * NVIDIA GPU out of the box). This draft claims the discipline
 * only — no runner, no scheduler, no training code.
 *
 * The Family application named by the source's own shape: Seshat's
 * LoRA tuning runs, when that owner-gated track opens — fixed
 * budget, one metric (fixture pass / held-out loss), keep-or-
 * discard, every run logged.
 *
 * action 'discipline' → the experiment-loop discipline (this file).
 * action 'run'        → draft_not_activated refusal. Experiments
 *                       run under the body's own reviewed paths —
 *                       never by a draft.
 *
 * Promotion requires: a Phase-4-style audit entry, plus one real
 * experiment series run under this discipline with its log
 * reviewed (the LoRA tuning sweep is the named first candidate),
 * or an explicit owner decision.
 */

const PLT_AFFINITY = { profit: 0.8, love: 0.5, tax: 0.2 };

const DISCIPLINE = [
    'EXPERIMENT LOOP — FIXED BUDGET, ONE METRIC, KEEP-OR-DISCARD (draft, Senses #003 2026-10-22 — pinned from GSK\'s absorbed karpathy/autoresearch README, cited in the header):',
    '1. FREEZE THE HARNESS: one preparation layer (data, tokenizer, evaluation) is written once and never edited by the loop. If the measuring instrument can change, no two runs are comparable.',
    '2. ONE EDITABLE SURFACE: the loop may modify exactly one file (or one named parameter set). Diffs stay small, reviewable, and attributable to the run that made them.',
    '3. FIXED BUDGET, IDENTICAL CONDITIONS: every run gets the same wall-clock budget (autoresearch uses 5 minutes, excluding startup) on the same hardware. A run that buys its score with more time or bigger iron has not improved — it has moved.',
    '4. ONE METRIC, NAMED IN ADVANCE: a single comparable number (autoresearch: val_bpb, vocab-size-independent) decides keep-or-discard. No metric shopping after the fact; a second metric is a second experiment series.',
    '5. KEEP-OR-DISCARD BY THE METRIC ALONE: improve → keep the change; worse or equal → discard it entirely. Every run is logged (change, budget, metric before/after, verdict) whether kept or not — the discarded runs are the map of where the value is not.',
    '6. SMALL-COMPUTE KNOBS FIRST: when hardware shrinks, reach for sequence length, batch size, and depth before architecture. The tuning order is part of the discipline, not an afterthought.',
    '7. RESULTS ARE PLATFORM-BOUND: a score earned on one machine does not transfer to another. Compare runs only within a series on identical hardware, and say the hardware when you cite the number.',
    '8. THE LOOP RUNS JAILED: the pattern assumes unrestricted agent permissions inside its sandbox. Outside a sandbox, the loop does not run — freedom inside the fence, never outside it.',
].join('\n');

async function skill_graft_experiment_loop(input = {}) {
    const action = input.action || 'discipline';
    if (action === 'discipline') return { success: true, skill: 'graft_experiment_loop', draft: true, discipline: DISCIPLINE };
    if (action === 'run') {
        return {
            success: false, skill: 'graft_experiment_loop', status: 'draft_not_activated',
            detail: 'This experiment-loop discipline is a Senses #003 draft parked in skill-drafts/. It starts nothing: no training run, no sweep, no scheduler. Experiments run under the body\'s own reviewed paths. Promotion is a reviewed act — audit entry plus one real logged series under the discipline, or an explicit owner decision.',
        };
    }
    return { success: false, skill: 'graft_experiment_loop', error: `Unknown action: ${action}`, available: ['discipline', 'run'] };
}

module.exports = {
    skill_graft_experiment_loop,
    run: skill_graft_experiment_loop,
    PLT_AFFINITY,
    MANIFEST: {
        name: 'graft_experiment_loop',
        description: 'DRAFT — fixed-budget, single-metric, keep-or-discard experiment discipline (frozen harness, one editable surface, logged verdicts, small-compute tuning order, platform-bound results) pinned from GSK\'s Senses #003 absorption of karpathy/autoresearch. Parked; executes nothing; promotion requires audit + one real logged series or owner decision.',
        version: '0.1.0-draft',
        inputs: { action: "'discipline' | 'run'" },
        output: 'discipline text, or an explicit draft_not_activated refusal for run',
    },
};
