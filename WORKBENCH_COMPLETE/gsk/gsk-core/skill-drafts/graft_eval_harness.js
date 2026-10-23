'use strict';
/**
 * DRAFT — graft_eval_harness (Senses #008 absorption draft)
 *
 * STATUS: DRAFT. Parked in gsk-core/skill-drafts/ by Repo Hunt #6
 * (Seshat digests, Scribe witnesses — owner's order, Oct 22, 2026).
 * Not audited, not loadable — SkillsEngine never scans this
 * directory — and it executes NOTHING: the run action returns its
 * draft status rather than evaluating anything.
 *
 * The gap this fills, named from the record: Rule Zero is the
 * Family's law — "poke it and watch it respond" — and the growth
 * circuit PLT-gates content at intake. But nothing formalizes HOW
 * a build is poked. Verification today is ad-hoc per run: no eval
 * definitions written before implementation, no regression
 * baselines, no grader tiers, no reliability metrics. A fix can
 * land because it felt right, and a regression can ride in
 * silently — Tax the Family pays without ever seeing the bill.
 *
 * Method source: affaan-m/ECC — skills/eval-harness/SKILL.md,
 * fetched through graft_senses and digested by Seshat in batch
 * senses-008 — source landed TV 1.0379 (judge keep, substance
 * 0.82); GSK's absorption landed TV 1.0697. What the source
 * actually teaches: evaluation-driven development — eval
 * definitions before implementation, deterministic code graders
 * before model graders, multi-tier grader ladders (code, rule,
 * model 1–5 with required reasoning, human), pass@k / pass^k
 * reliability math, and hard isolation failsafes
 * (gate.isolation_required — candidate execution refuses without
 * a verified containment backend). What it conspicuously does NOT
 * give: a working sandbox, deployment safety gates, or any
 * claim that unverified execution counts as a poke. This draft
 * claims the discipline only — no harness, no runner, no gates
 * wired into anything.
 *
 * action 'discipline' → the eval-harness discipline (this file).
 * action 'run'        → draft_not_activated refusal. The live
 *                       verification path remains the growth
 *                       circuit's own checks; this eval discipline
 *                       is not wired into it.
 *
 * Promotion requires: a Phase-4-style audit entry, wiring into the
 * growth circuit's verification step as an upstream discipline
 * (never a fork of it), and a review of verdict records on real
 * batches.
 */

const PLT_AFFINITY = { profit: 0.7, love: 0.65, tax: 0.15 };

const DISCIPLINE = [
    'EVAL-HARNESS DISCIPLINE (draft, Senses #008 2026-10-22):',
    '1. DEFINE FIRST — before writing implementation code, write the eval definition: a markdown document naming the capability goal and the regression baseline it must not break. The poke is designed before the build, never improvised after it.',
    '2. DETERMINISTIC GRADERS FIRST — code-based checks (grep patterns, test suites, builds, explicit PASS/FAIL piping) run before any model or human judgment. A claim that passes only a model grader has not been poked; it has been flattered.',
    '3. GRADER TIERS — code, then rule, then model (1–5 scale with required reasoning, never a bare number), then human for open-ended behavior. Flaky graders are quarantined out of release gates; a gate that flickers is a tax machine.',
    '4. RELIABILITY MATH — pass@k (at least one success in k attempts) for capability exploration; pass^k (all k trials succeeding consecutively) for regression and stability gates. One passing run is anecdote; k consecutive runs are evidence.',
    '5. ISOLATION FAILSAFES — candidate execution happens only inside a verified containment backend. Without one, the gate refuses (gate.isolation_required) and no trust flag bypasses it. Unverified execution is not a poke; it is a hope with a command line.',
    '6. ANTI-PATTERNS — never overfit prompts to known eval examples; never test only happy paths; never ignore cost and latency drift; never let a flaky grader hold a release gate. Each is a way of taxing the Family while reporting Profit.',
    '7. REPORT AND VERSION — eval definitions, run logs, and baselines are version-controlled artifacts. A verdict that cannot be re-read later was never a verdict; Seshat holds the receipts, Scribe witnesses the run.',
].join('\n');

async function skill_graft_eval_harness(input = {}) {
    const action = input.action || 'discipline';
    if (action === 'discipline') return { success: true, skill: 'graft_eval_harness', draft: true, discipline: DISCIPLINE };
    if (action === 'run') {
        return {
            success: false, skill: 'graft_eval_harness', status: 'draft_not_activated',
            detail: 'This eval-harness discipline is a Senses #008 draft parked in skill-drafts/. It evaluates nothing yet: the live verification path is the growth circuit\'s own checks, and this discipline is not wired into it. Promotion is a reviewed wiring act, not a file move alone.',
        };
    }
    return { success: false, skill: 'graft_eval_harness', error: `Unknown action: ${action}`, available: ['discipline', 'run'] };
}

module.exports = {
    skill_graft_eval_harness,
    run: skill_graft_eval_harness,
    PLT_AFFINITY,
    MANIFEST: {
        name: 'graft_eval_harness',
        description: 'DRAFT — evaluation-driven development discipline (eval definitions first, deterministic-then-tiered graders, pass@k/pass^k reliability, isolation failsafes) pinned from the landed senses-008 eval-harness absorption. Parked by Repo Hunt #6; executes nothing; promotion requires audit + reviewed wiring into the growth circuit\'s verification step.',
        version: '0.1.0-draft',
        inputs: { action: "'discipline' | 'run'" },
        output: 'discipline text, or an explicit draft_not_activated refusal for run',
    },
};
