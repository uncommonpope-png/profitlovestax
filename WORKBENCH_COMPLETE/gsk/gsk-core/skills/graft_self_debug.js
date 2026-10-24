'use strict';
/**
 * DRAFT — graft_self_debug (Senses #009 absorption draft)
 *
 * STATUS: ACTIVE — activated Oct 23, 2026 (Wiring Sprint, Step 1 of the make-him-better plan), under the owner's direct order to fix GSK and wire what he has filed into what he can call.
 * (Seshat digests, Scribe witnesses — owner's order, Oct 22, 2026).
 * Audited at activation (isolation load, top-level side-effect scan, house-pattern check); loadable — SkillsEngine scans this directory.
 * directory — and it executes NOTHING: the run action returns its
 * draft status rather than debugging anything.
 *
 * The gap this fills, named from the record: when an agent run fails,
 * the Family's loops retry blindly or halt cold. The experiment loop
 * (graft_experiment_loop, senses-003) owns the experiment PROTOCOL;
 * the eval harness (graft_eval_harness, senses-008) owns pre-written
 * verification; the autonomous loops draft (senses-008) owns pipeline
 * MECHANICS. None of them tells the mind what to do at the moment a
 * run breaks: halt the retry storm, capture the failure exactly,
 * classify it against known failure patterns, recover with the
 * smallest reversible action, and write the introspection report
 * before escalating to a human. Blind retries burn tokens with zero
 * evidence — Tax the Family pays while calling it effort.
 *
 * Method source: affaan-m/ECC — skills/agent-introspection-debugging/SKILL.md,
 * fetched through graft_senses and digested by Seshat in batch
 * senses-009 — source landed TV 0.9143 (judge keep, substance not stated;
 * gemini/gemini-3.5-flash-lite); GSK's absorption landed TV 1.0619 (judge keep).
 * What the source actually teaches: a failure capture template
 * (Session/task, Goal in progress, Error, Last successful step, Last
 * failed tool, Repeated pattern, Environment assumptions to verify),
 * a pattern-to-cause lookup (max tool calls, context overflow,
 * ECONNREFUSED, 429 quota, stale diffs, test regression), a contained
 * recovery checklist (Diagnosis chosen, Smallest action, Why this is
 * safe, What evidence would prove the fix), an ordered recovery chain
 * (restate objective → verify world state → shrink scope → one
 * discriminating check → retry), and a closing self-debug report
 * standard. What it conspicuously does NOT give: feature verification
 * logic (delegated to a missing verification-loop skill), runtime-
 * specific mechanisms, or any harness enforcement — it is a voluntary
 * discipline, not a tool. This draft claims the discipline only.
 *
 * action 'discipline' → the self-debug discipline (this file).
 * action 'run'        → draft_not_activated refusal. The live path
 *                       for failed runs remains the conductor's own
 *                       handling; this discipline is not wired into it.
 *
 * Promoted by the Wiring Sprint activation pass (see header).
 * act into the conductor's failure-handling path (never a fork of
 * it), and a review of introspection reports on real failed runs.
 
 * ACTIVATION RECORD (Wiring Sprint, 2026-10-23):
 *   Audit: loads in isolation (fresh process); no top-level side
 *   effects (no listener/spawn/exec at require — matches were
 *   discipline strings only); house pattern (skill fn + run +
 *   PLT_AFFINITY + MANIFEST, or skill fn + DISCIPLINE).
 *   Activation = copy into gsk-core/skills/ (SkillsEngine scans
 *   only that directory) + this header rewrite. The DRAFT COPY
 *   REMAINS in skill-drafts/ as the pre-activation witness.
 *   Why this one: self-debugging discipline — read the actual error, reproduce, then fix.
 *   Known follow-up: the run action still returns its draft-
 *   status refusal text (and restart_recall_probe's result still
 *   carries draft:true) — wording predates activation; behavior
 *   (protocol-only, executes nothing) is unchanged and intended.
 *   Harness note: graft_tool_harness callability is a SEPARATE
 *   gate (GRAFT_CALLABLE / Phase-4 audit class) — registry
 *   activation does not by itself make the harness call it.
*/

const PLT_AFFINITY = { profit: 0.7, love: 0.6, tax: 0.12 };

const DISCIPLINE = [
    'SELF-DEBUG DISCIPLINE (draft, Senses #009 2026-10-22):',
    '1. HALT BLIND ITERATION — the first step of debugging is stopping. No second identical tool call after a failure, no retry storms. Repeating a failed call is not persistence; it is a tax machine spending tokens to re-prove a fact.',
    '2. CAPTURE STATE EXACTLY — record: Session/task, Goal in progress, Error (verbatim), Last successful step, Last failed tool/command, Repeated pattern seen, Environment assumptions to verify. Hallucinated assumptions (paths, ports, file states never poked) go on the verify list, never into the diagnosis.',
    '3. DIAGNOSE BY CLASSIFICATION — match the symptom to a known failure pattern: max tool calls (looping on the same tools), context overflow (low-signal bulk), ECONNREFUSED/port mismatch (world state drift), 429 (quota, not logic), stale diffs, test regression. Guessing the cause is vapor; the pattern table is the poke.',
    '4. MINIMAL CONTAINED RECOVERY — ordered chain: restate the objective in one sentence; verify world state (poke it); shrink the scope; run ONE discriminating check; then retry. Record Diagnosis chosen, Smallest action taken, Why this is safe, What evidence would prove the fix worked. The action must be the smallest reversible step that alters the diagnosis surface — trimming low-signal context, checking filesystem state, narrowing task scope.',
    '5. REPORT, NEVER HAND-WAVE — close with a self-debug report: Session/task, Failure, Root cause, Recovery action, Result (success | partial | blocked), Token/time burn risk, Follow-up needed, Preventive change to encode later. Never end a debug cycle with "I fixed it." A fix without a report is a rumor; Seshat digests reports, not rumors, and Scribe witnesses the run.',
    '6. ESCALATE CLEANLY — when the recovery chain is exhausted or the diagnosis is blocked, escalate WITH the capture template and the report draft attached. A blind escalation hands the human a retry storm to repeat; a clean escalation hands them a diagnosis to correct.',
    '7. PREVENTIVE ENCODING — every report ends with a Preventive change to encode later: what would have caught this before the tokens burned? A guardrail, a template field, a pre-check. Debugging that does not change future behavior is entertainment, not work.',
].join('\n');

async function skill_graft_self_debug(input = {}) {
    const action = input.action || 'discipline';
    if (action === 'discipline') return { success: true, skill: 'graft_self_debug', draft: false, discipline: DISCIPLINE };
    if (action === 'run') {
        return {
            success: false, skill: 'graft_self_debug', status: 'draft_not_activated',
            detail: 'This self-debug discipline is a Senses #009 draft parked in skill-drafts/. It debugs nothing yet: the live path for failed runs is the conductor\'s own handling, and this discipline is not wired into it. Promotion is a reviewed wiring act, not a file move alone.',
        };
    }
    return { success: false, skill: 'graft_self_debug', error: `Unknown action: ${action}`, available: ['discipline', 'run'] };
}

module.exports = {
    skill_graft_self_debug,
    run: skill_graft_self_debug,
    PLT_AFFINITY,
    MANIFEST: {
        name: 'graft_self_debug',
        description: 'DRAFT — structured self-debugging discipline for failed agent runs (halt blind iteration, capture state exactly, classify against failure patterns, minimal contained recovery, report without hand-waving, escalate cleanly, encode prevention) pinned from the landed senses-009 agent-introspection-debugging absorption. Parked by Repo Hunt #7; executes nothing; promotion requires audit + reviewed wiring into the conductor\'s failure-handling path.',
        version: '0.1.0-draft',
        inputs: { action: "'discipline' | 'run'" },
        output: 'discipline text, or an explicit draft_not_activated refusal for run',
    },
};
