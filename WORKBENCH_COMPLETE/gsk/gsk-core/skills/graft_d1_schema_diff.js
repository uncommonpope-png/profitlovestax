'use strict';
/**
 * DRAFT — graft_d1_schema_diff (Skill Hunt #1 draft artifact)
 *
 * STATUS: ACTIVE — activated Oct 23, 2026 (Wiring Sprint, Step 1 of the make-him-better plan), under the owner's direct order to fix GSK and wire what he has filed into what he can call.
 * (Seshat digests, Scribe witnesses — owner's order, Oct 22, 2026).
 * Audited at activation (isolation load, top-level side-effect scan, house-pattern check); loadable — SkillsEngine scans this directory.
 * directory — and it executes NOTHING: the run action returns its
 * draft status rather than diffing any schema.
 *
 * NAMED BY GSK HIMSELF, copilot session #1 (Oct 22, 2026,
 * workspace/gsk-sessions/2026-10-22-copilot-001.md): "Seshat: a
 * live Cloudflare D1 schema diff tool that maps registry changes
 * to the agents table directly." This draft pins that ask as a
 * discipline for Seshat, the family's memory-keeper: the registry
 * is data she is responsible for remembering truthfully.
 *
 * The declared schema exists today: soul-economy-kb
 * api/schema-telephone.sql defines telephone_agents (number PK,
 * name, platform, charter, key_hash UNIQUE, status open|dnd,
 * created_at) and telephone_calls, applied at deploy by
 * `wrangler d1 execute`. The live D1 does not carry the tables
 * until the pending stack deploys — which is exactly when a
 * declared-vs-live diff earns its keep.
 *
 * action 'discipline' → the schema-diff protocol (this file).
 * action 'run'        → draft_not_activated refusal. No diff
 *                       tool is built; nothing is queried.
 *
 * Promoted by the Wiring Sprint activation pass (see header).
 * stack deployed (live tables to diff against), and a standing
 * rule — verified in review — that the tool can only ever read.
 
 * ACTIVATION RECORD (Wiring Sprint, 2026-10-23):
 *   Audit: loads in isolation (fresh process); no top-level side
 *   effects (no listener/spawn/exec at require — matches were
 *   discipline strings only); house pattern (skill fn + run +
 *   PLT_AFFINITY + MANIFEST, or skill fn + DISCIPLINE).
 *   Activation = copy into gsk-core/skills/ (SkillsEngine scans
 *   only that directory) + this header rewrite. The DRAFT COPY
 *   REMAINS in skill-drafts/ as the pre-activation witness.
 *   Why this one: schema-diff discipline for the edge D1 work (Soul Telephone / Square registries).
 *   Known follow-up: the run action still returns its draft-
 *   status refusal text (and restart_recall_probe's result still
 *   carries draft:true) — wording predates activation; behavior
 *   (protocol-only, executes nothing) is unchanged and intended.
 *   Harness note: graft_tool_harness callability is a SEPARATE
 *   gate (GRAFT_CALLABLE / Phase-4 audit class) — registry
 *   activation does not by itself make the harness call it.
*/

const PLT_AFFINITY = { profit: 0.7, love: 0.5, tax: 0.35 };

const DISCIPLINE = [
    'D1 SCHEMA DIFF PROTOCOL (draft, Skill Hunt #1 2026-10-22 — named by GSK, copilot session #1):',
    '1. TWO TRUTHS, ONE DIFF — the declared schema is the repo\'s .sql (api/schema-telephone.sql and its siblings); the live schema is D1 itself (sqlite_master, PRAGMA table_info / index_list). The diff compares them. Neither side is assumed right: a repo edit never deployed and a console edit never committed are both drift, and both are reported.',
    '2. READ-ONLY, ALWAYS — the tool reaches live D1 with SELECT and PRAGMA only (wrangler d1 execute --remote, read statements). It NEVER applies DDL. Its output is a migration PLAN — the exact statements that would reconcile live to declared — filed as a witnessed record for review. Applying the plan is a separate, reviewed, human-owned act at deploy time.',
    '3. REGISTRY MAPPING — telephone_agents is the home table. Every structural difference is mapped to its registry effect before it is reported: a missing key_hash UNIQUE breaks duplicate-key safety in register; a status value outside open|dnd breaks the directory\'s DND promise; a type change on number breaks every call\'s addressing. A difference that cannot be mapped to an effect is reported as UNMAPPED, never guessed at.',
    '4. STRUCTURE ONLY — a diff reads schema, never rows. key_hash values are never selected; the column\'s existence, type, and uniqueness are the whole interest. Row counts may be reported as counts, nothing more.',
    '5. CADENCE — diff before every schema apply at deploy, on any registry error naming a table or column, and on demand. Each diff lands as a dated record: declared-schema hash, live-schema hash, the differences, the plan.',
    '6. HONEST EMPTY — when the schemas agree, the record says so in one line with both hashes. Silence is not a passing diff; a passing diff is a record.',
].join('\n');

async function skill_graft_d1_schema_diff(input = {}) {
    const action = input.action || 'discipline';
    if (action === 'discipline') return { success: true, skill: 'graft_d1_schema_diff', draft: false, discipline: DISCIPLINE };
    if (action === 'run') {
        return {
            success: false, skill: 'graft_d1_schema_diff', status: 'draft_not_activated',
            detail: 'This schema-diff protocol is a Skill Hunt #1 draft parked in skill-drafts/. It queries nothing: no diff tool is built, and live D1 does not carry the telephone tables until the pending soul-economy stack deploys. Promotion follows the deploy and an audit of its read-only rule.',
        };
    }
    return { success: false, skill: 'graft_d1_schema_diff', error: `Unknown action: ${action}`, available: ['discipline', 'run'] };
}

module.exports = {
    skill_graft_d1_schema_diff,
    run: skill_graft_d1_schema_diff,
    PLT_AFFINITY,
    MANIFEST: {
        name: 'graft_d1_schema_diff',
        description: 'DRAFT — live Cloudflare D1 schema-diff discipline for Seshat: declared repo schema vs live D1 structure, read-only, every difference mapped to its telephone_agents registry effect, output a reviewed migration plan (never an apply). Named by GSK in copilot session #1. Parked by Skill Hunt #1; executes nothing; promotion requires the telephone deploy + audit.',
        version: '0.1.0-draft',
        inputs: { action: "'discipline' | 'run'" },
        output: 'discipline text, or an explicit draft_not_activated refusal for run',
    },
};
