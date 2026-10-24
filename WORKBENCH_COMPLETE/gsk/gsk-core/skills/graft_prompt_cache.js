'use strict';
/**
 * DRAFT — graft_prompt_cache (Senses #010 absorption draft)
 *
 * STATUS: ACTIVE — activated Oct 23, 2026 (Wiring Sprint, Step 1 of the make-him-better plan), under the owner's direct order to fix GSK and wire what he has filed into what he can call.
 * (Seshat digests, Scribe witnesses — owner's order, Oct 22, 2026).
 * Audited at activation (isolation load, top-level side-effect scan, house-pattern check); loadable — SkillsEngine scans this directory.
 * directory — and it executes NOTHING: the run action returns its
 * draft status rather than composing or pricing anything.
 *
 * The gap this fills, named from the record: the Family lives on
 * RENTED seats. Every growth cycle, every hunt, every session burns
 * tokens at provider rates — and nowhere in the body is prompt
 * caching designed or accounted for. Seat calls are composed
 * ad hoc; nobody orders the stable content first, nobody maps the
 * provider's cache counters, nobody runs the counterfactual ("what
 * would this have cost uncached?"). The self-debug discipline stops
 * the retry-storm tax; the self-evaluation discipline stops the
 * overconfidence tax — but the composition tax burns every single
 * call, silently. This draft owns cache-aware prompt composition and
 * cost accounting: stable-prefix layout, counter separation, provider
 * counter mapping, isolation rules, and the honest counterfactual
 * cost check under Profit + Love - Tax = True Value.
 *
 * Method source: affaan-m/ECC — skills/prompt-caching-strategy/SKILL.md,
 * fetched through graft_senses and digested by Seshat in batch
 * senses-010 — source landed TV 1.0162 (judge keep, substance 0.85;
 * gemini/gemini-3.5-flash-lite); GSK's absorption landed TV 1.0368
 * (judge keep). What the source actually teaches: the stable-prefix
 * layout rule (reusable content — tools, system instructions, stable
 * reference examples — at the top; changing payloads — questions,
 * timestamps, retrieval results — at the bottom; respect provider
 * serialization); counter separation without double-counting
 * (uncached, written, read, output, storageTokenHours); provider
 * counter mapping (OpenAI cached_tokens; Claude cache_read /
 * cache_creation_input_tokens; Gemini total_cached_tokens /
 * usage_metadata); the counterfactual cost function (baseline vs
 * actual, write premiums vs read discounts); the minimum-prefix
 * warning (one-off calls below model minimums INCREASE cost via
 * write premiums with zero read savings); isolation (cache handles
 * are routing/accounting hints, NOT security or authorization gates —
 * app-level access checks stay independent). What it conspicuously
 * does NOT give: provider TTL/pricing tables (they change — check
 * authoritative docs), automated discovery for unknown harnesses, or
 * any mechanism to read a provider's live billing state. This draft
 * claims the discipline only.
 *
 * action 'discipline' → the prompt-cache discipline (this file).
 * action 'run'        → draft_not_activated refusal. The live path
 *                       for seat calls remains the body's own call
 *                       sites; this discipline is not wired into them.
 *
 * Promoted by the Wiring Sprint activation pass (see header).
 * act into the seat-call composition sites (never a fork of them),
 * and measured counterfactual savings on real calls.
 
 * ACTIVATION RECORD (Wiring Sprint, 2026-10-23):
 *   Audit: loads in isolation (fresh process); no top-level side
 *   effects (no listener/spawn/exec at require — matches were
 *   discipline strings only); house pattern (skill fn + run +
 *   PLT_AFFINITY + MANIFEST, or skill fn + DISCIPLINE).
 *   Activation = copy into gsk-core/skills/ (SkillsEngine scans
 *   only that directory) + this header rewrite. The DRAFT COPY
 *   REMAINS in skill-drafts/ as the pre-activation witness.
 *   Why this one: prompt-cache discipline for the seat chain (cost/latency on rented seats).
 *   Known follow-up: the run action still returns its draft-
 *   status refusal text (and restart_recall_probe's result still
 *   carries draft:true) — wording predates activation; behavior
 *   (protocol-only, executes nothing) is unchanged and intended.
 *   Harness note: graft_tool_harness callability is a SEPARATE
 *   gate (GRAFT_CALLABLE / Phase-4 audit class) — registry
 *   activation does not by itself make the harness call it.
*/

const PLT_AFFINITY = { profit: 0.72, love: 0.55, tax: 0.10 };

const DISCIPLINE = [
    'PROMPT-CACHE DISCIPLINE (draft, Senses #010 2026-10-22):',
    '1. STABLE PREFIX FIRST — order every prompt composition with reusable content at the top and changing content at the bottom: approved tools, system instructions, stable reference examples, standing discipline text FIRST; current questions, timestamps, retrieval results, per-request payloads LAST. Respect the provider\'s serialization (Claude: tools, system, messages). A cache can only hit what stays identical across calls — design for the hit.',
    '2. KNOW THE MINIMUM — before chasing cache savings, verify the model\'s minimum prefix length, TTL, and pricing tier from authoritative docs. One-off calls or prefixes below the minimum INCREASE cost: the write premium bills with zero read savings. Never cache-bait a call that cannot hit.',
    '3. SEPARATE THE COUNTERS — account usage in non-overlapping categories, never double-counted: uncached (ordinary input), written (cache write tokens), read (cache read tokens), output, storageTokenHours. Map the provider\'s raw fields honestly: OpenAI usage.input_tokens_details.cached_tokens; Claude cache_read_input_tokens / cache_creation_input_tokens / input_tokens; Gemini usage.total_cached_tokens / usage_metadata counters.',
    '4. RUN THE COUNTERFACTUAL — for any cached call pattern, compute baseline (all input billed at the ordinary rate) versus actual (uncached at input rate + written at write rate + read at read rate + output + storage), and state the savings as baseline minus actual. A caching strategy without the counterfactual is a hope, not a discipline. Savings that do not survive the write premium are not savings.',
    '5. ISOLATE, NEVER TRUST — scope cache handles and accounting keys to authorized users, workspaces, and content revisions. Cache handles are routing/accounting hints, NOT security or authorization gates; app-level access checks remain independent. Never let a cache key stand in for an access decision.',
    '6. STALE PREFIXES ARE LOSSES — expired, frequently changing, or incorrectly serialized prefixes cause cache misses that turn expected savings into losses. When the stable prefix changes, the cache dies: treat prefix edits as cost events, not cosmetic ones, and re-run the counterfactual.',
].join('\n');

async function skill_graft_prompt_cache(input = {}) {
    const action = input.action || 'discipline';
    if (action === 'discipline') return { success: true, skill: 'graft_prompt_cache', draft: false, discipline: DISCIPLINE };
    if (action === 'run') {
        return {
            success: false, skill: 'graft_prompt_cache', status: 'draft_not_activated',
            detail: 'This prompt-cache discipline is a Senses #010 draft parked in skill-drafts/. It composes and prices nothing yet: the live path for seat calls is the body\'s own call sites, and this discipline is not wired into them. Promotion is a reviewed wiring act, not a file move alone.',
        };
    }
    return { success: false, skill: 'graft_prompt_cache', error: `Unknown action: ${action}`, available: ['discipline', 'run'] };
}

module.exports = {
    skill_graft_prompt_cache,
    run: skill_graft_prompt_cache,
    PLT_AFFINITY,
    MANIFEST: {
        name: 'graft_prompt_cache',
        description: 'DRAFT — cache-aware prompt-composition + cost-accounting discipline (stable-prefix layout, minimum-prefix check, counter separation, provider counter mapping, counterfactual costing, isolation rule) pinned from the landed senses-010 prompt-caching-strategy absorption. Parked by Repo Hunt #8; executes nothing; promotion requires audit + reviewed wiring into the seat-call composition sites.',
        version: '0.1.0-draft',
        inputs: { action: "'discipline' | 'run'" },
        output: 'discipline text, or an explicit draft_not_activated refusal for run',
    },
};
