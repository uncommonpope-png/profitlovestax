'use strict';
/**
 * DRAFT — graft_node_production (Senses #003 absorption draft)
 *
 * STATUS: DRAFT. Parked in gsk-core/skill-drafts/ by the Repo Hunt #1
 * absorption pass (Senses #003 — GSK reads with his own senses,
 * Seshat digests, Scribe witnesses — owner's order, Oct 22, 2026).
 * Not audited, not loadable — SkillsEngine never scans this
 * directory — and it executes NOTHING: the run action returns its
 * draft status rather than starting any server.
 *
 * The material this is pinned from: goldbergyoni/nodebestpractices
 * README, fetched through graft_senses and digested by Seshat in
 * batch senses-003 — source landed TV 0.971; GSK's absorption of
 * it landed TV 1.246. This draft is the deep sequel to Senses
 * #002's graft_node_backend_pattern (the minimal server skeleton):
 * that draft named its unfurnished rooms — routing, auth,
 * persistence, body streaming, error handling — and this source
 * furnishes the ERROR-HANDLING room in doctrine and names the
 * production shape of the rest.
 *
 * Scope honesty, from the absorption itself: the fetched text is
 * the doctrine layer — 100+ practices as section summaries with
 * rationale. The code bodies live one link deeper (the repo's
 * per-practice pages), NOT in this fetch. This draft therefore
 * claims the checklist doctrine only: structure, configuration,
 * error discipline, testing shape, production hardening, security
 * floors. It does not claim implementation code it has not seen.
 * One injection-pattern flag rode the fetch (reveal_secrets — the
 * secrets-management sections) — detected, stored as data, never
 * obeyed, and recorded in the Senses #003 journal.
 *
 * action 'discipline' → the production doctrine (this file).
 * action 'run'        → draft_not_activated refusal. Servers are
 *                       started by the body's own paths under the
 *                       house port rules — never by a draft.
 *
 * Promotion requires: a Phase-4-style audit entry, plus a deeper
 * fetch pass over the repo's per-practice pages so the code
 * bodies are absorbed (not just the summaries), or an explicit
 * owner decision to promote the doctrine as-is.
 */

const PLT_AFFINITY = { profit: 0.8, love: 0.6, tax: 0.3 };

const DISCIPLINE = [
    'NODE PRODUCTION DOCTRINE — THE CHECKLIST LAYER (draft, Senses #003 2026-10-22 — pinned from GSK\'s absorbed nodebestpractices README, cited in the header; extends the Senses #002 skeleton draft):',
    '1. STRUCTURE BY BUSINESS COMPONENT (source §1.1–1.2): vertical slices per component, web layer kept thin over service over data — never horizontal layer-cake folders that scatter one feature across five directories.',
    '2. CONFIGURATION IS HIERARCHICAL AND SECRET-AWARE (§1.4): environment-aware config with secure defaults; secrets arrive via env/vault, never literals in code, never in the repo. A config value you cannot override per-environment is a bug filed early.',
    '3. ERROR DISCIPLINE (§2 — the room the #002 skeleton left unfurnished): async errors via async/await or promises, never callbacks lost in the void; extend the built-in Error with operational context; ONE central error handler; catch unhandledRejection and decide deliberately; await promises before returning or stack traces lie; subscribe to stream/emitter \'error\' events — an unlistened \'error\' is a crash with a fuse.',
    '4. CODE FLOOR (§3): a linter with Node rules is not optional; strict equality (===) always; explicit module entry points; const by default. Style drift is tax paid on every future read.',
    '5. TESTING SHAPE (§4): component/API tests over unit-only pyramids; AAA structure (Arrange–Act–Assert); per-test isolated data — global fixtures make suites flaky in proportion to their size; explicit ports in production, randomized ports in tests.',
    '6. PRODUCTION HARDENING (§5): a reverse proxy delegates gzip/SSL/compression — the app process does app work; design stateless so any instance can die without taking state with it; NODE_ENV=production set explicitly; log to stdout only and let the platform route logs (the app never names its own log files); deterministic installs with `npm ci`.',
    '7. SECURITY FLOOR (§6): hash passwords with bcrypt/scrypt, never reversible storage; validate every inbound JSON body against a schema; run the process as a non-root user; limit request concurrency and payload size at the edge. These are floors, not aspirations.',
    '8. KNOWN LIMITS OF THIS DRAFT: doctrine only — the per-practice code bodies (framework-specific shapes, exact configs) live one link deeper in the source repo and are NOT absorbed yet. Routing, auth, and persistence implementation shapes remain unclaimed until that deeper pass lands; this draft governs structure and discipline, not those implementations.',
].join('\n');

async function skill_graft_node_production(input = {}) {
    const action = input.action || 'discipline';
    if (action === 'discipline') return { success: true, skill: 'graft_node_production', draft: true, discipline: DISCIPLINE };
    if (action === 'run') {
        return {
            success: false, skill: 'graft_node_production', status: 'draft_not_activated',
            detail: 'This production doctrine is a Senses #003 draft parked in skill-drafts/. It starts nothing: servers run under the body\'s own paths and port rules. Promotion is a reviewed act — audit entry plus the deeper per-practice fetch pass named in the header, or an explicit owner decision to promote the doctrine as-is.',
        };
    }
    return { success: false, skill: 'graft_node_production', error: `Unknown action: ${action}`, available: ['discipline', 'run'] };
}

module.exports = {
    skill_graft_node_production,
    run: skill_graft_node_production,
    PLT_AFFINITY,
    MANIFEST: {
        name: 'graft_node_production',
        description: 'DRAFT — Node production doctrine (component structure, hierarchical secure config, error discipline, testing shape, production hardening, security floors) pinned from GSK\'s Senses #003 absorption of goldbergyoni/nodebestpractices; extends the Senses #002 backend skeleton. Doctrine layer only — per-practice code bodies not yet absorbed. Parked; executes nothing.',
        version: '0.1.0-draft',
        inputs: { action: "'discipline' | 'run'" },
        output: 'discipline text, or an explicit draft_not_activated refusal for run',
    },
};
