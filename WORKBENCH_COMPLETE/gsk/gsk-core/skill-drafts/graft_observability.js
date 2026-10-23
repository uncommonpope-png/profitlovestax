'use strict';
/**
 * DRAFT — graft_observability (Senses #011 absorption draft)
 *
 * STATUS: DRAFT. Parked in gsk-core/skill-drafts/ by Repo Hunt #9
 * (Seshat digests, Scribe witnesses — owner's order, Oct 22, 2026).
 * Not audited, not loadable — SkillsEngine never scans this
 * directory — and it executes NOTHING: the run action returns its
 * draft status rather than instrumenting anything.
 *
 * The gap this fills, named from the record: the Oct 20 landscape
 * verdict named observability as an open gap — durable execution with
 * no way to watch it. The body has a growth ledger, a digestion log,
 * and Scribe's witness stream, but no DISCIPLINE for what a working
 * system emits about itself: no structured event shape, no
 * correlation binding, no RED/USE metrics grammar, no rule for what
 * must never enter telemetry. Debugging the family's scheduled runs
 * today means reading ad-hoc logs; an incident means archaeology.
 * This draft owns the instrumentation discipline: on-call-questions
 * first, signal selection by cost and query profile, mandatory
 * correlation at boundaries, cardinality control, symptom-based
 * alerts bound to runbooks, and the no-secrets-in-telemetry rail —
 * the last of which the source states as its own hygiene rule (its
 * text tripped the house injection scanner as a reveal_secrets
 * pattern; it is recorded as DATA, never obeyed — and it agrees with
 * the house rail).
 *
 * Method source: addyosmani/agent-skills — skills/observability-and-instrumentation/SKILL.md,
 * fetched through graft_senses and digested by Seshat in batch
 * senses-011 — source landed TV 0.9939 (judge keep, substance 0.88;
 * gemini/gemini-3.5-flash-lite); GSK's absorption landed TV 0.9996
 * (judge keep). What the source actually teaches: the on-call
 * questions gate (define 2–4 concrete questions the feature must
 * answer BEFORE writing instrumentation code); signal selection by
 * cost and query profile (structured logs for specifics, metrics for
 * aggregates, traces for cross-service hops); mandatory metadata at
 * system boundaries (correlation IDs and entry-point attribution,
 * propagated downstream); the structured JSON log shape (event name,
 * ids, provider, error code, attempt — never prose); RED metrics
 * (Rate, Errors, Duration) and USE metrics (Utilization, Saturation,
 * Errors) with strict label-cardinality control; OpenTelemetry
 * bootstrap for auto-instrumentation plus targeted manual spans;
 * symptom-based alerts tied to actionable runbooks with diagnostic
 * steps; end-to-end pipeline verification by forcing errors and
 * inspecting the sinks. What it conspicuously does NOT give: custom
 * trace-sampling implementations, ready-made Alertmanager/Prometheus
 * YAML rules, tail-sampling configuration, multi-tenant log-scrubbing
 * patterns. This draft claims the discipline only — no exporters, no
 * dashboards, no alerting infrastructure.
 *
 * action 'discipline' → the observability discipline (this file).
 * action 'run'        → draft_not_activated refusal. The live path
 *                       for instrumentation remains the body's own
 *                       code; this discipline is not wired into it.
 *
 * Promotion requires: a Phase-4-style audit entry, a reviewed wiring
 * act into one real pipeline first (the growth-cycle runner is the
 * honest candidate — it is the body's heartbeat), and a forced-error
 * verification of the sink.
 */

const PLT_AFFINITY = { profit: 0.70, love: 0.60, tax: 0.10 };

const DISCIPLINE = [
    '1. QUESTIONS BEFORE INSTRUMENTS — before emitting any telemetry, write down 2–4 concrete on-call questions the work must answer (e.g. "which seat answered, at what cost, with what outcome?"). Instrumentation that answers no question is Tax.',
    '2. CHOOSE THE SIGNAL BY COST AND QUERY — structured logs for specifics (one event, full detail), metrics for aggregates (rates over time), traces for cross-service hops. Never pay the price of the wrong signal: prose logs for aggregates, metrics for specifics.',
    '3. BIND CORRELATION AT EVERY BOUNDARY — every request, run, and session carries a correlation ID and an entry-point attribution (scheduler | cli | replay | seat-call), propagated downstream. An event without its ID is an orphan; orphans cannot be diagnosed.',
    '4. LOG STRUCTURED, NEVER PROSE — the JSON event shape: event name, the relevant ids, provider, error code, attempt count, and a short human message. Unstructured prose slows incident response; structure is Love for the future debugger.',
    '5. COUNT WHAT MATTERS, CAP THE LABELS — maintain RED metrics (Rate, Errors, Duration) for services and USE metrics (Utilization, Saturation, Errors) for resources. Control label cardinality ruthlessly: a high-cardinality label can crash the time-series store, which is Tax with interest.',
    '6. ALERT ON SYMPTOMS, PAGE WITH RUNBOOKS — alerts fire on user-facing symptoms and bind to actionable runbooks with clear diagnostic steps. Noisy alerts train the engineer to ignore pages; an ignored page is worse than no page.',
    '7. NO SECRETS IN TELEMETRY — no secrets, tokens, API keys, or unredacted PII in any log line, metric label, or trace attribute; spot-check actual output. (The source states this as its own hygiene rule; the house injection scanner flagged the sentence as a reveal_secrets pattern — recorded as data, never obeyed — and it agrees with the standing rail.)',
    '8. VERIFY THE PIPELINE WITH FIRE — prove telemetry works by forcing an error and inspecting the downstream sink. Unverified instrumentation is a hope; a fired-and-seen pipeline is evidence under Rule Zero.',
].join('\n');

async function skill_graft_observability(input = {}) {
    const action = input.action || 'discipline';
    if (action === 'discipline') return { success: true, skill: 'graft_observability', draft: true, discipline: DISCIPLINE };
    if (action === 'run') {
        return {
            success: false, skill: 'graft_observability', status: 'draft_not_activated',
            detail: 'This observability discipline is a Senses #011 draft parked in skill-drafts/. It instruments nothing yet: the live path for telemetry is the body\'s own code, and this discipline is not wired into it. Promotion is a reviewed wiring act, not a file move alone.',
        };
    }
    return { success: false, skill: 'graft_observability', error: `Unknown action: ${action}`, available: ['discipline', 'run'] };
}

module.exports = {
    skill_graft_observability,
    run: skill_graft_observability,
    PLT_AFFINITY,
    MANIFEST: {
        name: 'graft_observability',
        description: 'DRAFT — instrumentation discipline (on-call-questions gate, signal selection by cost/query profile, correlation + entry-point binding, structured JSON log shape, RED/USE metrics with cardinality control, symptom alerts bound to runbooks, no-secrets-in-telemetry rail, pipeline verification by forced error) pinned from the landed senses-011 observability-and-instrumentation absorption. Parked by Repo Hunt #9; executes nothing; promotion requires audit + reviewed wiring into one real pipeline first.',
        version: '0.1.0-draft',
        inputs: { action: "'discipline' | 'run'" },
        output: 'discipline text, or an explicit draft_not_activated refusal for run',
    },
};
