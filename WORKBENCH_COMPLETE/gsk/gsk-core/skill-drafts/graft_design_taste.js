'use strict';
/**
 * DRAFT — graft_design_taste (Senses #004 absorption draft)
 *
 * STATUS: DRAFT. Parked in gsk-core/skill-drafts/ by the Repo Hunt #2
 * absorption pass (Senses #004 — GSK reads with his own senses,
 * Seshat digests, Scribe witnesses — owner's order, Oct 22, 2026).
 * Not audited, not loadable — SkillsEngine never scans this
 * directory — and it executes NOTHING: the run action returns its
 * draft status rather than designing, drawing, or inspecting any
 * page.
 *
 * The material this is pinned from: Leonxlnx/taste-skill's
 * skills/taste-skill/SKILL.md — the complete skill body (38,142
 * chars), fetched through graft_senses and digested by Seshat in
 * batch senses-004 (source landed TV 1.193, judge unavailable —
 * lexical verdict stands and the digestion record says so; GSK's
 * absorption landed TV 1.271). What the body actually teaches: an
 * anti-slop art-direction method for public-facing pages — an
 * inventory of 8–12 things that belong strictly to the subject
 * (address, tiles, materials, light, rituals, name meaning) taken
 * BEFORE any design; a written argument mapping one claim + proof
 * per section, discarding the generic hero/features/testimonials/
 * pricing/CTA order unless structurally earned; a dealt direction
 * (sector + section roles + tone, three options, one chosen) from a
 * library distilled from 247 curated gallery sites; the idea
 * sentence — "On this page, [something that belongs to the subject]
 * becomes [the device the direction calls for]" — gated by the
 * competitor test (if a competitor could say it, it is a cliché,
 * redraw); a strict no-slop house style naming the statistical-
 * average defaults to refuse (centered headlines, eyebrow labels,
 * icon cards, soft gradients, thin rules, monospace captions); and
 * a build → real-browser inspect → look-and-fix loop.
 *
 * What the source conspicuously does NOT give — and the haul cap
 * makes this sharper: his seat absorbed from the first ~12,000 of
 * the body's 38,142 chars, and the fetch's own text cuts off before
 * step 5's inspector/juror rubrics and step 6's asset integration.
 * The body's tooling (scripts/draw.mjs and its direction library)
 * is the source's own machinery — NOT transplanted, not claimed.
 * This draft claims the discipline only: inventory → argument →
 * direction → idea sentence → build to the sheet → inspect.
 * It feeds the body's known look-loop weakness from the taste side;
 * graft_look_loop (an active graft) runs a build/revision loop —
 * this draft carries the art-direction law that loop lacks.
 *
 * action 'discipline' → the design-taste discipline (this file).
 * action 'run'        → draft_not_activated refusal. Pages are
 *                       designed and inspected under the body's own
 *                       reviewed paths — never by a draft.
 *
 * Promotion requires: a Phase-4-style audit entry, plus one real
 * page built under this discipline with its direction sheet,
 * competitor test, and browser-inspection record reviewed (the
 * body's own public pages are the named first candidates), or an
 * explicit owner decision.
 */

const PLT_AFFINITY = { profit: 0.6, love: 0.7, tax: 0.3 };

const DISCIPLINE = [
    'DESIGN TASTE — ANTI-SLOP ART DIRECTION (draft, Senses #004 2026-10-22 — pinned from GSK\'s absorbed Leonxlnx/taste-skill SKILL.md, cited in the header):',
    '1. INVENTORY BEFORE DESIGN: before any layout, compile 8–12 unique items that belong strictly to the subject — its address, materials, light, rituals, tiles, name meaning. A page designed from the category instead of the inventory is slop before the first pixel.',
    '2. WRITE THE ARGUMENT: one line per section — the claim it makes and the proof it shows — in an order the subject earns. The generic order (hero, 3 features, testimonials, pricing, CTA) is discarded unless the argument structurally requires it.',
    '3. DRAW A DIRECTION, DO NOT DRIFT INTO ONE: name the sector, the section roles, and the tone; deal options; choose ONE direction sheet and keep its palette and type unless a redraw is called. Redraws are surgical — hero, type, palette, photos, scenes, or a single section — never a vague restart.',
    '4. THE IDEA SENTENCE: fill it deterministically — "On this page, [something that belongs to the subject] becomes [the device the direction calls for]." If the sentence cannot be filled from the inventory, there is no idea yet.',
    '5. THE COMPETITOR TEST: if a competitor could run the same page with names swapped, the design has defaulted to a category cliché. Fail it back to the direction draw — taste is what survives this test.',
    '6. THE NO-SLOP HOUSE STYLE — REFUSE THE STATISTICAL AVERAGE: centered headlines by default, eyebrow labels, icon cards, soft gradients, thin rules, monospace captions. Removing ornaments without adding substance is its own failure: the replacement is large typography, fields of color, real imagery, and complete content.',
    '7. ASSETS ARE NAMED, NOT ASSUMED: declare what the page actually has (photography, product photos, product UI, illustration, video) and design to that inventory — never to imaginary assets that will be faked later.',
    '8. BUILD TO THE SHEET, THEN INSPECT IN A REAL BROWSER: production follows the direction sheet exactly; the finished page is screenshotted and inspected, and the look-and-fix loop runs on what the screenshot actually shows — never on what the builder intended.',
].join('\n');

async function skill_graft_design_taste(input = {}) {
    const action = input.action || 'discipline';
    if (action === 'discipline') return { success: true, skill: 'graft_design_taste', draft: true, discipline: DISCIPLINE };
    if (action === 'run') {
        return {
            success: false, skill: 'graft_design_taste', status: 'draft_not_activated',
            detail: 'This design-taste discipline is a Senses #004 draft parked in skill-drafts/. It designs nothing: no direction is drawn, no page is built, no browser is opened. Design work runs under the body\'s own reviewed paths (the look loop among them). Promotion is a reviewed act — audit entry plus one real page built under the discipline with its direction sheet and inspection record reviewed, or an explicit owner decision.',
        };
    }
    return { success: false, skill: 'graft_design_taste', error: `Unknown action: ${action}`, available: ['discipline', 'run'] };
}

module.exports = {
    skill_graft_design_taste,
    run: skill_graft_design_taste,
    PLT_AFFINITY,
    MANIFEST: {
        name: 'graft_design_taste',
        description: 'DRAFT — anti-slop art-direction discipline (subject inventory before design, written section argument, dealt direction sheet, the idea sentence + competitor test, no-slop house style, build-to-sheet then real-browser inspection) pinned from GSK\'s Senses #004 absorption of the Leonxlnx/taste-skill SKILL.md body. Parked; executes nothing; the source\'s draw.mjs tooling is not transplanted; promotion requires audit + one real page built under it or owner decision.',
        version: '0.1.0-draft',
        inputs: { action: "'discipline' | 'run'" },
        output: 'discipline text, or an explicit draft_not_activated refusal for run',
    },
};
