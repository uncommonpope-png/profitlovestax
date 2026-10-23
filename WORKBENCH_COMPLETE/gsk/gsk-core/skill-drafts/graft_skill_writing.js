'use strict';
/**
 * DRAFT — graft_skill_writing (Senses #004 absorption draft)
 *
 * STATUS: DRAFT. Parked in gsk-core/skill-drafts/ by the Repo Hunt #2
 * absorption pass (Senses #004 — GSK reads with his own senses,
 * Seshat digests, Scribe witnesses — owner's order, Oct 22, 2026).
 * Not audited, not loadable — SkillsEngine never scans this
 * directory — and it executes NOTHING: the run action returns its
 * draft status rather than writing or testing any skill.
 *
 * The material this is pinned from: obra/superpowers'
 * skills/writing-skills/SKILL.md — the skill BODY itself, fetched
 * through graft_senses and digested by Seshat in batch senses-004
 * (source landed TV 1.343; GSK's absorption landed TV 1.298),
 * co-pinned from mattpocock/skills' tdd SKILL.md (source landed
 * TV 1.212; absorption TV 1.278). What the bodies actually teach:
 * writing a skill IS test-driven development applied to process
 * documentation — a RED baseline pressure scenario run WITHOUT the
 * skill first (the Iron Law: no skill without a failing test), a
 * minimal GREEN skill aimed at the observed failures, the same
 * scenario re-run to VERIFY, then REFACTOR rounds that close each
 * new rationalization. The guidance FORM is matched to the failure
 * type (prohibition + rationalization table for rule violations
 * under pressure; positive recipe/contract for wrong output shape;
 * REQUIRED structural slot for omitted elements; conditional on an
 * observable predicate for conditional behavior). A skill's
 * description states ONLY its triggering conditions, starting
 * "Use when..." — it never summarizes the workflow. No nuance
 * clauses, no exemption clauses: real exceptions are separate
 * conditionals on observable predicates. The tdd card adds the
 * loop's test-quality law: tests at pre-agreed public seams, names
 * that read as specifications, no implementation coupling, no
 * tautological expectations, vertical slices over horizontal ones.
 *
 * What the sources conspicuously do NOT give: writing-skills'
 * referenced companions (references/bulletproofing.md, discovery.md,
 * flowcharts.md, anthropic-best-practices.md) were not in the fetch,
 * and its tail (micro-testing wording mechanics) is cut off in the
 * body itself; the tdd card points at tests.md / mocking.md /
 * GLOSSARY.md, likewise unfetched. This draft claims the discipline
 * layer only — it is NOT graft_skill_factory (which drafts skills)
 * and NOT graft_skill_tiers (which classifies them): this is the
 * proofing discipline a drafted skill passes BEFORE activation is
 * even proposed, and no existing draft carries it.
 *
 * action 'discipline' → the skill-writing discipline (this file).
 * action 'run'        → draft_not_activated refusal. Skills are
 *                       written and pressure-tested under the body's
 *                       own reviewed paths — never by a draft.
 *
 * Promotion requires: a Phase-4-style audit entry, plus one real
 * house draft (e.g. a Senses-staged graft) taken through the full
 * RED → GREEN → VERIFY → REFACTOR proofing with its scenarios and
 * verdicts logged, or an explicit owner decision.
 */

const PLT_AFFINITY = { profit: 0.7, love: 0.5, tax: 0.25 };

const DISCIPLINE = [
    'SKILL WRITING — TDD APPLIED TO PROCESS DOCUMENTATION (draft, Senses #004 2026-10-22 — pinned from GSK\'s absorbed obra/superpowers writing-skills SKILL.md + mattpocock tdd SKILL.md, cited in the header):',
    '1. THE IRON LAW — RED FIRST: no skill is written before a pressure scenario has been run WITHOUT it and the baseline failures documented verbatim (the exact triggers, the exact rationalizations the agent used). A skill written from imagination treats diseases nobody observed.',
    '2. GREEN — MINIMAL SKILL: write the smallest SKILL.md that addresses the observed failures and nothing else. No hypothetical cases, no padding for futures that have not failed yet.',
    '3. MATCH THE FORM TO THE FAILURE: rule violated under pressure → prohibition + rationalization table + red flags, never soft guidance ("prefer..."); wrong output shape → a positive recipe or contract stating the exact parts in order, never a prohibition list (prohibitions backfire on shaping problems); required element omitted → a REQUIRED structural slot in the template; conditional behavior → a conditional keyed to an observable predicate, never an unconditional rule with exemptions.',
    '4. THE DESCRIPTION IS A TRIGGER, NOT A SUMMARY: frontmatter description states only when to use the skill, starting "Use when...", naming triggering conditions and symptoms. A description that summarizes the workflow teaches the agent to skip the body.',
    '5. NO NUANCE CLAUSES, NO EXEMPTION CLAUSES: "unless it matters" and "this doesn\'t apply to..." reopen negotiation and destroy rule consistency under pressure. A real exception is written as its own conditional on an observable predicate.',
    '6. VERIFY — SAME SCENARIO, SKILL PRESENT: re-run the RED scenario with the skill in place. Compliance is the only pass mark; a scenario that still fails means the skill is not done, whatever it cost to write.',
    '7. REFACTOR — CLOSE LOOPHOLES: every new rationalization the agent finds earns an explicit counter in the skill, then the scenario runs again. The loop ends when the scenario holds under pressure, not when the author feels finished.',
    '8. STRUCTURE LAW: flat namespace (skills/<name>/SKILL.md); heavy references (100+ lines, API docs) live in separate files, principles and patterns under 50 lines stay inline; bundled scripts are invoked through their explicit interpreter in the prose (bash scripts/x.sh, node scripts/x.js), never by bare path.',
    '9. THE TEST-QUALITY LAW (from the tdd card): scenarios and tests sit at pre-agreed public seams — never at unconfirmed ones; names read as specifications; no implementation coupling (no mocking internal collaborators, no verifying through side channels); no tautological expectations (expected values come from an independent source of truth); vertical slices, one tracer at a time — never all tests first, then all implementation.',
].join('\n');

async function skill_graft_skill_writing(input = {}) {
    const action = input.action || 'discipline';
    if (action === 'discipline') return { success: true, skill: 'graft_skill_writing', draft: true, discipline: DISCIPLINE };
    if (action === 'run') {
        return {
            success: false, skill: 'graft_skill_writing', status: 'draft_not_activated',
            detail: 'This skill-writing discipline is a Senses #004 draft parked in skill-drafts/. It writes nothing and tests nothing: no SKILL.md is authored, no pressure scenario is run. Skill proofing happens under the body\'s own reviewed paths. Promotion is a reviewed act — audit entry plus one real draft taken through the full RED → GREEN → VERIFY → REFACTOR proofing with its log reviewed, or an explicit owner decision.',
        };
    }
    return { success: false, skill: 'graft_skill_writing', error: `Unknown action: ${action}`, available: ['discipline', 'run'] };
}

module.exports = {
    skill_graft_skill_writing,
    run: skill_graft_skill_writing,
    PLT_AFFINITY,
    MANIFEST: {
        name: 'graft_skill_writing',
        description: 'DRAFT — the skill-proofing discipline (RED baseline pressure scenario before writing, form matched to failure type, "Use when..." trigger-only descriptions, no nuance/exemption clauses, VERIFY + loophole-closing REFACTOR, test-quality law for scenarios) pinned from GSK\'s Senses #004 absorption of the obra/superpowers writing-skills SKILL.md body and mattpocock\'s tdd SKILL.md. Parked; executes nothing; promotion requires audit + one real draft proofed under it or owner decision.',
        version: '0.1.0-draft',
        inputs: { action: "'discipline' | 'run'" },
        output: 'discipline text, or an explicit draft_not_activated refusal for run',
    },
};
