'use strict';
/**
 * DRAFT — graft_self_evaluation (Senses #010 absorption draft)
 *
 * STATUS: DRAFT. Parked in gsk-core/skill-drafts/ by Repo Hunt #8
 * (Seshat digests, Scribe witnesses — owner's order, Oct 22, 2026).
 * Not audited, not loadable — SkillsEngine never scans this
 * directory — and it executes NOTHING: the run action returns its
 * draft status rather than evaluating anything.
 *
 * The gap this fills, named from the record: the Family's verification
 * shelf owns BEFORE and DURING, but nothing owns AFTER. The eval
 * harness (graft_eval_harness, senses-008) owns pre-written
 * verification of pre-written criteria; the self-debug discipline
 * (graft_self_debug, senses-009) owns the moment a run BREAKS. But
 * when work completes without failing — a build shipped, a report
 * delivered, a session closed — nobody looks back. Success with no
 * scorecard is how overconfidence compounds: "everything is a 5"
 * becomes the default and the user is left to be the grader. This
 * draft owns the deliberate post-completion look-back: after
 * non-trivial work, rate the output on five axes with concrete
 * evidence per criterion, and fix or flag what scores low BEFORE
 * the user has to.
 *
 * Method source: affaan-m/ECC — skills/agent-self-evaluation/SKILL.md,
 * fetched through graft_senses and digested by Seshat in batch
 * senses-010 — source landed TV 0.9885 (judge keep, substance 0.85;
 * gemini/gemini-3.5-flash-lite); GSK's absorption landed TV 0.9513
 * (judge keep). What the source actually teaches: a 5-axis rubric
 * (accuracy, completeness, clarity, actionability, conciseness); the
 * evidence rule (any score < 5 must cite concrete proof — "show the
 * gap, don't just name it"); independent axis scoring (no averaging
 * beforehand); a structured scorecard (one-line summary, 5-axis
 * scores with evidence, overall rounded average, 1–3 ranked
 * improvements); the remediation hook (axis <= 3 → fix instantly if
 * under ~30 seconds of work, else flag the rework and state the
 * projected score). What it conspicuously does NOT give: automated
 * parsing of tool exit codes, machine-readable scorecard schemas, or
 * historical trend tracking of self-improvement. This draft claims
 * the discipline only — a voluntary reflection step, not a gate.
 *
 * action 'discipline' → the self-evaluation discipline (this file).
 * action 'run'        → draft_not_activated refusal. The live path
 *                       for completed work remains the conductor's own
 *                       closing; this reflection step is not wired into it.
 *
 * Promotion requires: a Phase-4-style audit entry, a reviewed wiring
 * act into the conductor's task-closing path (never a fork of it),
 * and review of scorecards on real completed work.
 */

const PLT_AFFINITY = { profit: 0.68, love: 0.62, tax: 0.12 };

const DISCIPLINE = [
    'SELF-EVALUATION DISCIPLINE (draft, Senses #010 2026-10-22):',
    '0. TRIGGER — engage after non-trivial work only: code spanning 3+ files or 50+ lines, multi-step workflows (implement → test → review), debugging sessions of 3+ attempts, design documents or architecture decisions. Trivial work does not need a scorecard; scoring everything is tax.',
    '1. COLLECT RAW MATERIAL — before rating anything, gather: the original user request (verbatim intent), the final deliverable, verification tool outputs (tests, builds, probes), and any prior user feedback on this thread. A scorecard written from memory of the work is a rumor; scorecards are written from artifacts.',
    '2. AUDIT EACH AXIS INDEPENDENTLY — walk the five axes one at a time on a 1–5 scale, no averaging beforehand: ACCURACY (is it correct — verified, not assumed?), COMPLETENESS (is the whole ask covered, edge cases named?), CLARITY (can the reader act without re-asking?), ACTIONABILITY (does it hand the user a next step, not a shrug?), CONCISENESS (every sentence earning its tokens?).',
    '3. ENFORCE THE EVIDENCE RULE — any axis scored below 5 must cite concrete evidence: a failing check, a missing section, the confused sentence quoted back. "Show the gap, don\'t just name it." A score without evidence is self-congratulation with numbers; a 5 with no proof is complacency.',
    '4. REMEDIATE OR DECLARE — for any axis at 3 or below: fix it immediately if the fix is under ~30 seconds of work, or explicitly flag the required rework and state the projected score after rework. Silent low scores are not allowed to ship; an un-fixed low score must travel WITH the deliverable as a declared rework item.',
    '5. WRITE THE SCORECARD — the record is: one-line summary, the 5-axis scores with their evidence, the overall score (rounded simple average — stated, not hidden), and 1–3 ranked improvements. Seshat digests scorecards, not vibes; Scribe witnesses the close.',
    '6. DO NOT RE-LITIGATE — the scorecard audits the OUTPUT against the REQUEST. It does not re-argue settled design choices, penalize out-of-scope features the user never asked for, or substitute personal taste ("I don\'t like decorators") for objective gaps. That is grievance, not evaluation.',
].join('\n');

async function skill_graft_self_evaluation(input = {}) {
    const action = input.action || 'discipline';
    if (action === 'discipline') return { success: true, skill: 'graft_self_evaluation', draft: true, discipline: DISCIPLINE };
    if (action === 'run') {
        return {
            success: false, skill: 'graft_self_evaluation', status: 'draft_not_activated',
            detail: 'This self-evaluation discipline is a Senses #010 draft parked in skill-drafts/. It evaluates nothing yet: the live path for completed work is the conductor\'s own closing, and this reflection step is not wired into it. Promotion is a reviewed wiring act, not a file move alone.',
        };
    }
    return { success: false, skill: 'graft_self_evaluation', error: `Unknown action: ${action}`, available: ['discipline', 'run'] };
}

module.exports = {
    skill_graft_self_evaluation,
    run: skill_graft_self_evaluation,
    PLT_AFFINITY,
    MANIFEST: {
        name: 'graft_self_evaluation',
        description: 'DRAFT — 5-axis post-completion self-evaluation discipline (accuracy, completeness, clarity, actionability, conciseness; evidence rule for scores < 5; independent axis scoring; remediate-or-declare hook) pinned from the landed senses-010 agent-self-evaluation absorption. Parked by Repo Hunt #8; executes nothing; promotion requires audit + reviewed wiring into the conductor\'s task-closing path.',
        version: '0.1.0-draft',
        inputs: { action: "'discipline' | 'run'" },
        output: 'discipline text, or an explicit draft_not_activated refusal for run',
    },
};
