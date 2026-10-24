'use strict';
/**
 * DRAFT — graft_task_tiers (Senses #011 absorption draft)
 *
 * STATUS: ACTIVE — activated Oct 23, 2026 (Wiring Sprint, Step 1 of the make-him-better plan), under the owner's direct order to fix GSK and wire what he has filed into what he can call.
 * (Seshat digests, Scribe witnesses — owner's order, Oct 22, 2026).
 * Audited at activation (isolation load, top-level side-effect scan, house-pattern check); loadable — SkillsEngine scans this directory.
 * directory — and it executes NOTHING: the run action returns its
 * draft status rather than decomposing or routing anything.
 *
 * The gap this fills, named from the record: the Apprenticeship
 * delegates real session work into GSK's harness and the campaign
 * authority delegates whole volleys to subagents — but nothing owns
 * HOW that delegated work is sized or which mind it is given to. Work
 * arrives as boulders; boulders cannot be verified, and unverifiable
 * work cannot pass Rule Zero. And the Family lives on RENTED seats:
 * every delegated unit burns tokens at a tier's price, yet no
 * discipline routes a unit to the cheapest tier that can carry it or
 * measures what each unit cost. The prompt-cache draft owns the cost
 * of composition; the self-evaluation draft owns the look-back; the
 * autonomous-loops draft owns the loop — but the UNIT itself, and the
 * TIER it runs on, had no owner. This draft owns both: the
 * 15-minute unit rule (independently verifiable, single dominant
 * risk, clear done condition) and tier routing by task complexity
 * (narrow work on narrow minds, architecture on the strong ones,
 * escalation only on a proven reasoning gap), with per-task cost
 * telemetry so the routing can be audited.
 *
 * Method source: affaan-m/ECC — skills/agentic-engineering/SKILL.md,
 * fetched through graft_senses and digested by Seshat in batch
 * senses-011 — source landed TV 1.0435 (judge keep;
 * gemini/gemini-3.5-flash-lite); GSK's absorption landed TV 0.8961
 * (judge keep). What the source actually teaches: the eval-first loop
 * (capability evals + regression evals, baseline failure signatures,
 * execute, re-run and compare deltas); the 15-minute unit rule (each
 * unit independently verifiable, single dominant risk, clear done
 * condition); model tier routing (Haiku: classification, boilerplate
 * transforms, narrow edits; Sonnet: implementation and refactors;
 * Opus: architecture, root-cause analysis, multi-file invariants);
 * session lifecycle (keep sessions for closely-coupled units; fresh
 * sessions after major phase transitions; compact only after
 * milestone completion); cost-discipline tracking (per task: model
 * type, token estimates, retries, wall-clock time, success/failure);
 * the review rule (review generated code for invariants, error
 * boundaries, and security — never style; delegate style to
 * linters). What it conspicuously does NOT give: any code for the
 * eval harness, any CLI or schema for the telemetry capture, any
 * implementation templates at all — it names the mechanics and
 * supplies none. This draft claims the discipline only.
 *
 * action 'discipline' → the task-tier discipline (this file).
 * action 'run'        → draft_not_activated refusal. The live path
 *                       for delegation remains the body's own
 *                       conductor; this discipline is not wired into it.
 *
 * Promoted by the Wiring Sprint activation pass (see header).
 * act into the conductor's delegation path (never a fork of it), and
 * a measured delegation trial with per-task cost telemetry.
 
 * ACTIVATION RECORD (Wiring Sprint, 2026-10-23):
 *   Audit: loads in isolation (fresh process); no top-level side
 *   effects (no listener/spawn/exec at require — matches were
 *   discipline strings only); house pattern (skill fn + run +
 *   PLT_AFFINITY + MANIFEST, or skill fn + DISCIPLINE).
 *   Activation = copy into gsk-core/skills/ (SkillsEngine scans
 *   only that directory) + this header rewrite. The DRAFT COPY
 *   REMAINS in skill-drafts/ as the pre-activation witness.
 *   Why this one: task tiering discipline (which seat/effort a task class earns).
 *   Known follow-up: the run action still returns its draft-
 *   status refusal text (and restart_recall_probe's result still
 *   carries draft:true) — wording predates activation; behavior
 *   (protocol-only, executes nothing) is unchanged and intended.
 *   Harness note: graft_tool_harness callability is a SEPARATE
 *   gate (GRAFT_CALLABLE / Phase-4 audit class) — registry
 *   activation does not by itself make the harness call it.
*/

const PLT_AFFINITY = { profit: 0.73, love: 0.52, tax: 0.10 };

const DISCIPLINE = [
    '1. CHOP THE BOULDER — decompose every delegation into 15-minute units: each unit independently verifiable, each carrying a SINGLE dominant risk, each exposing a clear done condition. A unit you cannot verify is a unit you cannot claim under Rule Zero.',
    '2. ROUTE THE TIER BY THE WORK — narrow minds for narrow work (classification, boilerplate transforms, narrow edits); implementation minds for implementation and refactors; the strongest minds for architecture, root-cause analysis, and multi-file invariants. Never spend Opus on a Haiku task.',
    '3. ESCALATE ONLY ON A PROVEN GAP — a tier rises only when the lower tier failed from a clear reasoning gap, not from sloppiness. Sloppy escalation is the fastest way to burn the family\'s money.',
    '4. COUNT EVERY UNIT — per delegated unit, record: model tier, token estimate, retries, wall-clock time, success or failure. Routing without telemetry is superstition; the telemetry is what lets the routing improve.',
    '5. EVALUATE FIRST — define the unit\'s completion criteria (and, where the work allows it, a regression check) BEFORE the unit runs. Capture the baseline failure signature; after the run, compare the delta. The eval is written before the work, never after.',
    '6. MIND THE SESSION LIFECYCLE — keep sessions alive across closely-coupled units; roll a fresh session after major phase transitions; compact only after milestone completion. A session that never resets accumulates ghosts; one that resets constantly accumulates nothing.',
    '7. REVIEW FOR INVARIANTS, NEVER STYLE — review generated work for invariants, error boundaries, and security. Delegate style to linters. Human (or elder) review cycles are the scarcest resource in the building; spend them where only judgment works.',
].join('\n');

async function skill_graft_task_tiers(input = {}) {
    const action = input.action || 'discipline';
    if (action === 'discipline') return { success: true, skill: 'graft_task_tiers', draft: false, discipline: DISCIPLINE };
    if (action === 'run') {
        return {
            success: false, skill: 'graft_task_tiers', status: 'draft_not_activated',
            detail: 'This task-tier discipline is a Senses #011 draft parked in skill-drafts/. It decomposes and routes nothing yet: the live path for delegation is the body\'s own conductor, and this discipline is not wired into it. Promotion is a reviewed wiring act, not a file move alone.',
        };
    }
    return { success: false, skill: 'graft_task_tiers', error: `Unknown action: ${action}`, available: ['discipline', 'run'] };
}

module.exports = {
    skill_graft_task_tiers,
    run: skill_graft_task_tiers,
    PLT_AFFINITY,
    MANIFEST: {
        name: 'graft_task_tiers',
        description: 'DRAFT — delegation sizing + tier-routing discipline (15-minute verifiable units with single dominant risk, model-tier routing by task complexity, escalation only on proven reasoning gap, per-unit cost telemetry, eval-first completion criteria, session lifecycle, invariants-not-style review) pinned from the landed senses-011 agentic-engineering absorption. Parked by Repo Hunt #9; executes nothing; promotion requires audit + reviewed wiring into the conductor delegation path.',
        version: '0.1.0-draft',
        inputs: { action: "'discipline' | 'run'" },
        output: 'discipline text, or an explicit draft_not_activated refusal for run',
    },
};
