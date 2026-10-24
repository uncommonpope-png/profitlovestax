'use strict';
/**
 * DRAFT — graft_security_hardening (Senses #012 absorption draft)
 *
 * STATUS: ACTIVE — activated Oct 23, 2026 (Wiring Sprint, Step 1 of the make-him-better plan), under the owner's direct order to fix GSK and wire what he has filed into what he can call.
 * (Seshat digests, Scribe witnesses — owner's order, Oct 22, 2026).
 * Audited at activation (isolation load, top-level side-effect scan, house-pattern check); loadable — SkillsEngine scans this directory.
 * directory — and it executes NOTHING: the run action returns its
 * draft status rather than hardening anything.
 *
 * The gap this fills, named from the record: the body fetches
 * untrusted web text on every cycle and executes shell commands,
 * file writes, and deletes inside its own runs — but nothing owned
 * the boundary posture. The circuit's injection screen is a per-fetch
 * scan (scraped text is data, never commands); it is not a discipline
 * for dangerous operations. No STRIDE lens over trust boundaries, no
 * rule for what an agent must always do / ask first / never do, no
 * gate on destructive paths, no supply-chain posture for the
 * packages the body installs. An agent that runs code and moves files
 * without a boundary discipline is Tax waiting to happen.
 * This draft owns the hardening discipline: boundary mapping,
 * STRIDE threat modeling, the three-tier boundary system
 * (Always Do / Ask First / Never Do), schema validation at system
 * boundaries, SSRF denial by DNS resolution, the destructive-path
 * triple check, and supply-chain controls.
 *
 * Method source: addyosmani/agent-skills — skills/security-and-hardening/SKILL.md,
 * fetched through graft_senses and digested by Seshat in batch
 * senses-012 — source landed TV 1.0696 (judge keep, substance 0.82;
 * gemini/gemini-3.5-flash-lite); GSK's absorption landed TV 1.0709
 * (judge keep). What the source actually teaches: STRIDE threat
 * modeling (Spoofing, Tampering, Repudiation, Information disclosure,
 * Denial of service, Elevation of privilege) mapped against external
 * inputs, environment variables, command lines, and LLM outputs; the
 * Three-Tier Boundary System — Always Do (parameterized queries,
 * bcrypt/argon2 hashing, httpOnly/secure/sameSite cookies, output
 * encoding), Ask First (auth logic changes, PII addition, CORS
 * modification), Never Do (eval(), innerHTML, storing tokens in
 * localStorage, exposing stack traces); schema validation at system
 * boundaries (API routes, form handlers) producing 422 errors on
 * failure, feeding only parsed typed values downstream; SSRF
 * mitigation by resolving ALL DNS records for user-influenced URLs
 * and explicitly rejecting private, loopback, link-local, and
 * reserved IP spaces (IPv4 and IPv6) alongside redirect bans;
 * destructive path protection requiring three checks before
 * deletion/moving (resolved targets under an allowlisted root, at
 * least one level below it, pre-read ownership evidence);
 * supply-chain controls (isolated installation boundaries, blocked
 * package dependency scripts before first execution, native package
 * manager audits on committed lockfiles, registry signature
 * verification); privacy-by-design asset classification (purpose-driven
 * data only, TTL retention, export/correction/deletion compliance).
 * What it conspicuously does NOT give: ready-made WAF rule sets,
 * framework-specific auth middleware code, or a vulnerability scanner —
 * it names the discipline, not the tooling.
 *
 * action 'discipline' → the hardening discipline (this file).
 * action 'run'        → draft_not_activated refusal. The live path
 *                       for the body's operations remains its own
 *                       code; this discipline is not wired into it.
 *
 * Promotion requires: a Phase-4-style audit entry, a reviewed wiring
 * act into the body's own execution path (the growth-cycle runner and
 * the hunt circuit are the honest candidates — they fetch untrusted
 * text and move files every cycle), and a probe-verified trial of the
 * destructive-path triple check on a real run.
 */

const PLT_AFFINITY = { profit: 0.72, love: 0.60, tax: 0.10 };

const DISCIPLINE = [
    '1. MAP EVERY BOUNDARY FIRST — before touching untrusted material, list every point where untrusted data or local environment values cross into the system (fetched text, form input, API payloads, CLI args, environment variables, LLM outputs) and name the high-value targets on the far side (credentials, PII, money, the filesystem). An unmapped boundary is an unguarded door.',
    '2. RUN STRIDE OVER EACH BOUNDARY — for every trust boundary, walk the STRIDE lens: Spoofing (who claims this identity?), Tampering (what can be altered in transit?), Repudiation (what cannot be proven?), Information disclosure (what leaks?), Denial of service (what can be exhausted?), Elevation of privilege (what gains more than it should?). Write the abuse cases alongside the functional ones; an unthreatened boundary is Tax dressed as speed.',
    '3. THE THREE-TIER BOUNDARY SYSTEM — ALWAYS DO: parameterized queries, strong hashing (bcrypt/argon2), httpOnly/secure/sameSite cookies, framework-level output encoding, secrets injected from the environment only. ASK FIRST (human approval): auth logic changes, PII collection or schema changes, CORS modifications, role elevations, file-upload enablement. NEVER DO: eval() or equivalent dynamic execution of untrusted strings, innerHTML with untrusted content, tokens in localStorage, stack traces or internal errors to the caller.',
    '4. VALIDATE AT THE SYSTEM EDGE — schema-validate at every system boundary (API routes, form handlers, config intake); reject with explicit errors (the 422 shape) on failure and let only parsed, typed values flow downstream. Unvalidated input reaching the core is a boundary violation, not a feature.',
    '5. DENY SSRF BY RESOLUTION — for any user-influenced URL, resolve ALL DNS records before fetching and explicitly reject private, loopback, link-local, and reserved IP spaces (IPv4 and IPv6); ban redirects to denied space. The URL the user typed is not the address you fetch; the address you fetch is what you vetted.',
    '6. THE DESTRUCTIVE-PATH TRIPLE CHECK — before any delete or move: (a) the resolved target sits under an allowlisted root; (b) it sits at least one level BELOW that root (never the root itself); (c) pre-read ownership evidence exists. Fail any check, do nothing. Recovery from a wrong delete is archaeology; prevention is Love.',
    '7. HOLD THE SUPPLY CHAIN — isolate installation boundaries, block package dependency lifecycle scripts before first execution, keep lockfiles committed and audited with the native package manager, verify registry signatures. The dependency you did not vet is code you did not write running with your privileges.',
    '8. MINIMIZE THE LIABILITY SURFACE — classify PII fields at inception, collect only for an immediate valid purpose, enforce TTL retention, and design schemas for export/correction/deletion from the start. Data you do not hold cannot leak; a schema built for deletion is cheaper than a breach response.',
].join('\n');

async function skill_graft_security_hardening(input = {}) {
    const action = input.action || 'discipline';
    if (action === 'discipline') return { success: true, skill: 'graft_security_hardening', draft: false, discipline: DISCIPLINE };
    if (action === 'run') {
        return {
            success: false, skill: 'graft_security_hardening', status: 'draft_not_activated',
            reason: 'Draft only: parked in skill-drafts/ by Repo Hunt #10 (senses-012). Not audited, not loadable, executes nothing.'
        };
    }
    return { success: false, skill: 'graft_security_hardening', error: `unknown action: ${action}` };
}

module.exports = { skill_graft_security_hardening, DISCIPLINE, PLT_AFFINITY };
