'use strict';
/**
 * DRAFT — graft_node_backend_pattern (Senses #002 coding-absorption draft)
 *
 * STATUS: ACTIVE — activated Oct 23, 2026 (Wiring Sprint, Step 1 of the make-him-better plan), under the owner's direct order to fix GSK and wire what he has filed into what he can call.
 * absorption pass (Senses #002 — GSK reads with his own senses,
 * Seshat digests, Scribe witnesses — owner's order, Oct 22, 2026).
 * Audited at activation (isolation load, top-level side-effect scan, house-pattern check); loadable — SkillsEngine scans this directory.
 * directory — and it executes NOTHING: the run action returns its
 * draft status rather than starting any server.
 *
 * The material this is pinned from: Node.js Learn, "Introduction
 * to Node.js" (nodejs.org official learn path), fetched through
 * graft_senses and digested by Seshat in batch senses-002 —
 * source landed TV 1.132; GSK's absorption of it landed TV 1.331.
 * What the source actually teaches: the minimal HTTP server
 * skeleton (createServer / listen / req-res lifecycle), the two
 * module systems and their file extensions, and the non-blocking
 * discipline of the runtime. What it conspicuously does NOT teach
 * — named in the absorption and preserved in the discipline
 * below — is routing, authentication, persistence, request-body
 * streaming, and error handling. This draft claims the skeleton
 * only; those rooms are unfurnished until a source teaches them.
 * (The deep guide, "Anatomy of an HTTP Transaction," 404s at its
 * current nodejs.org paths as of this pass — recorded in the
 * Senses #002 journal.)
 *
 * action 'discipline' → the backend skeleton pattern (this file).
 * action 'run'        → draft_not_activated refusal. Servers are
 *                       started by the body's own paths under the
 *                       house port rules — never by a draft.
 *
 * Promoted by the Wiring Sprint activation pass (see header).
 * second absorbed source covering the named gaps (routing /
 * error handling / body streaming) or an explicit owner decision
 * to promote the skeleton as-is.
 
 * ACTIVATION RECORD (Wiring Sprint, 2026-10-23):
 *   Audit: loads in isolation (fresh process); no top-level side
 *   effects (no listener/spawn/exec at require — matches were
 *   discipline strings only); house pattern (skill fn + run +
 *   PLT_AFFINITY + MANIFEST, or skill fn + DISCIPLINE).
 *   Activation = copy into gsk-core/skills/ (SkillsEngine scans
 *   only that directory) + this header rewrite. The DRAFT COPY
 *   REMAINS in skill-drafts/ as the pre-activation witness.
 *   Why this one: node backend patterns from the nodebestpractices absorption line.
 *   Known follow-up: the run action still returns its draft-
 *   status refusal text (and restart_recall_probe's result still
 *   carries draft:true) — wording predates activation; behavior
 *   (protocol-only, executes nothing) is unchanged and intended.
 *   Harness note: graft_tool_harness callability is a SEPARATE
 *   gate (GRAFT_CALLABLE / Phase-4 audit class) — registry
 *   activation does not by itself make the harness call it.
*/

const PLT_AFFINITY = { profit: 0.7, love: 0.5, tax: 0.3 };

const DISCIPLINE = [
    'NODE BACKEND PATTERN — THE MINIMAL SERVER SKELETON (draft, Senses #002 2026-10-22 — pinned from GSK\'s absorbed Node.js Learn source, cited in the header):',
    '1. MODULE SYSTEM FIRST: CommonJS `const { createServer } = require(\'node:http\')` in a .js file, or ESM `import { createServer } from \'node:http\'` in .mjs (or a typed package). Extension and syntax must match or the process dies at load.',
    '2. NAME THE BINDING: hostname + port as named constants (e.g. \'127.0.0.1\', 3000) — never magic numbers buried in the listen call. House rule rides on top: scan before you bind; the body\'s blood-flow port (:20128) is never taken, never duplicated.',
    '3. THE HANDLER SHAPE: createServer((req, res) => { ... }) — inspect req, set res.statusCode, set headers with res.setHeader(\'Content-Type\', ...), and ALWAYS close the response with res.end(payload). A handler path that can return without res.end hangs the client forever.',
    '4. LISTEN WITH A WITNESS: server.listen(port, hostname, callback) and log readiness in the callback — a server that cannot say it is up cannot be proven up (Rule Zero).',
    '5. NON-BLOCKING IS THE RUNTIME\'S LAW: Node serves many connections on one process through async I/O. Synchronous blocking work in a handler stalls EVERY connection, not just its own. Await or delegate; do not park the loop.',
    '6. RUN IT PLAINLY: node server.js (CJS) / node server.mjs (ESM). No framework is required for the skeleton; adding one is a decision, not a default.',
    '7. KNOWN-UNFURNISHED ROOMS (the source does not teach these — do not improvise them under this draft\'s authority): routing beyond a single response, request-body streaming, authentication, persistence/storage, error handling for dropped sockets and thrown handlers. Each needs its own absorbed source before the pattern may claim it.',
].join('\n');

async function skill_graft_node_backend_pattern(input = {}) {
    const action = input.action || 'discipline';
    if (action === 'discipline') return { success: true, skill: 'graft_node_backend_pattern', draft: false, discipline: DISCIPLINE };
    if (action === 'run') {
        return {
            success: false, skill: 'graft_node_backend_pattern', status: 'draft_not_activated',
            detail: 'This backend pattern is a Senses #002 draft parked in skill-drafts/. It starts nothing: servers run under the body\'s own paths and port rules. Promotion is a reviewed act — audit entry plus the gap sources named in the header, or an explicit owner decision to promote the skeleton as-is.',
        };
    }
    return { success: false, skill: 'graft_node_backend_pattern', error: `Unknown action: ${action}`, available: ['discipline', 'run'] };
}

module.exports = {
    skill_graft_node_backend_pattern,
    run: skill_graft_node_backend_pattern,
    PLT_AFFINITY,
    MANIFEST: {
        name: 'graft_node_backend_pattern',
        description: 'DRAFT — Node.js minimal backend skeleton (createServer/listen/req-res lifecycle, module-system discipline, non-blocking law, and the honestly-named unfurnished rooms: routing/auth/persistence/streaming/errors) pinned from GSK\'s Senses #002 absorption of Node.js Learn. Parked; executes nothing; promotion requires audit + gap sources or owner decision.',
        version: '0.1.0-draft',
        inputs: { action: "'discipline' | 'run'" },
        output: 'discipline text, or an explicit draft_not_activated refusal for run',
    },
};
