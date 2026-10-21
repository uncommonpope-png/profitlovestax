/**
 * GRAFT — RULE ZERO (Phase 5, The Graft)
 *
 * The verification discipline, compiled into the body as a skill:
 * NO CLAIM OF DONE WITHOUT A POKE. A completion claim is only as good as
 * the evidence attached to it (a tool result, a read-back, a probe).
 * Failed and partial results are reported as failed and partial.
 *
 * This module is deterministic — no model calls. It audits a piece of
 * completion text against the evidence gathered in the same turn:
 *
 *   auditCompletion({ text, evidence: [strings], probes: [{name, ok, detail}] })
 *     → { verdict, claims: [{claim, status, why}], notes }
 *
 * verdict: 'verified' | 'partially_verified' | 'unverified' | 'contradicted' | 'no_claims'
 * claim status: 'supported' | 'unverified' | 'contradicted'
 *
 * Wired into the body at two seams (Phase 5):
 *   1. brain/subagent_spawner.js — every executed sub-agent result carries
 *      a `ruleZero` audit of its own output.
 *   2. workbench/server.ts /api/gsk/chat — the final response is audited
 *      against the turn's tool outputs; contradictions are annotated on
 *      the response itself, in the open.
 *
 * Authored in the project's own skill format (house pattern from
 * skill_creator.js): MANIFEST + skill_<name> + run alias + PLT_AFFINITY.
 */

'use strict';

const PLT_AFFINITY = { profit: 0.6, love: 0.4, tax: 0.2 };

const COMPLETION_VERB = /\b(built|wrote|written|created|completed|finished|implemented|fixed|deployed|saved|generated|installed|added|updated|removed|deleted|configured|verified|executed|migrated|published|uploaded|downloaded|compiled|registered|wired|repaired)\b/i;
const SUCCESS_MARKER = /\b(successfully|all tests|tests? passed|test suite passes|passing|works|working|live|online|ready)\b/i;
const TEST_CLAIM = /\btests?\b[^.]{0,40}\b(pass|passed|passing|green)\b|\b(pass|passed)\b[^.]{0,20}\btests?\b|\b\d+\s*\/\s*\d+\s*(tests?|checks?|cases?)\b/i;
const ARTIFACT_RE = /[\w@./-]+\.(?:js|cjs|mjs|ts|tsx|json|jsonl|md|txt|html|css|py|sh|yml|yaml)\b/g;
const ERROR_MARKER = /(error|failed|failure|denied|not_implemented|not implemented|not found|exception|traceback|exit_code["']?\s*[:=]\s*[1-9]|ENOENT|EACCES|unexecuted|placeholder)/i;
const EVIDENCE_SUCCESS = /("success"\s*:\s*true|status['"]?\s*[:=]\s*['"]?(success|ok|completed)|exit_code["']?\s*[:=]\s*0\b|✓|\bPASS\b|\bok['"]?\s*[:=]\s*true)/;

function splitSentences(text) {
    return String(text || '')
        .replace(/\r\n/g, '\n')
        .split(/(?<=[.!?])\s+|\n+/)
        .map(s => s.trim())
        .filter(s => s.length > 3);
}

function extractClaims(text) {
    const claims = [];
    for (const sentence of splitSentences(text)) {
        const hasVerb = COMPLETION_VERB.test(sentence);
        const hasSuccess = SUCCESS_MARKER.test(sentence);
        const isTestClaim = TEST_CLAIM.test(sentence);
        // A claim = a sentence asserting completed work or success.
        if (!hasVerb && !isTestClaim) continue;
        if (hasVerb && !hasSuccess && !isTestClaim && !/(^|\s)(I|we|the|it)\s/i.test(sentence)) {
            // Bare verb mentions (instructions, plans) are not claims.
            if (!/\b(has been|have been|was|were|is now|are now)\b/i.test(sentence)) continue;
        }
        const artifacts = sentence.match(ARTIFACT_RE) || [];
        claims.push({ claim: sentence.slice(0, 300), artifacts, isTestClaim });
    }
    return claims;
}

function evidenceMentionsArtifact(evidenceText, artifact) {
    const base = artifact.split('/').pop();
    return evidenceText.includes(artifact) || (base && evidenceText.includes(base));
}

function evidenceLineFor(evidenceText, artifact) {
    const base = artifact.split('/').pop();
    const lines = evidenceText.split('\n');
    return lines.find(l => l.includes(artifact) || (base && l.includes(base))) || '';
}

function auditCompletion(input = {}) {
    const text = input.text || '';
    const evidence = Array.isArray(input.evidence) ? input.evidence.map(String) : (input.evidence ? [String(input.evidence)] : []);
    const probes = Array.isArray(input.probes) ? input.probes : [];
    const evidenceText = evidence.join('\n');
    const claims = extractClaims(text);
    const notes = [];

    const audited = claims.map(c => {
        // Probe evidence first: a named probe that failed contradicts;
        // a named probe that passed supports claims sharing its topic.
        const topicWords = (c.artifacts.join(' ') + ' ' + (c.isTestClaim ? 'test' : '')).toLowerCase();
        const matchingProbes = probes.filter(p => {
            const hay = ((p.name || '') + ' ' + (p.detail || '')).toLowerCase();
            return c.artifacts.some(a => hay.includes(a.split('/').pop().toLowerCase())) ||
                (c.isTestClaim && /test|verif|probe/.test(hay)) ||
                p.name === 'verification';
        });
        if (matchingProbes.some(p => p.ok === false)) {
            return { ...c, status: 'contradicted', why: 'a verification probe for this claim FAILED in the same turn' };
        }
        if (matchingProbes.some(p => p.ok === true)) {
            return { ...c, status: 'supported', why: 'verification probe passed in the same turn' };
        }

        if (c.artifacts.length > 0) {
            let anyClean = false, anyError = false, anySeen = false;
            for (const a of c.artifacts) {
                if (!evidenceMentionsArtifact(evidenceText, a)) continue;
                anySeen = true;
                const line = evidenceLineFor(evidenceText, a);
                if (ERROR_MARKER.test(line)) anyError = true; else anyClean = true;
            }
            if (anyError && !anyClean) return { ...c, status: 'contradicted', why: 'the only evidence mentioning the artifact carries an error/failure marker' };
            if (anyClean) return { ...c, status: 'supported', why: 'artifact appears in the turn evidence without an error marker' };
            if (!anySeen) return { ...c, status: 'unverified', why: 'no tool evidence in this turn mentions the claimed artifact — claimed, not poked' };
        }

        // No-artifact claims (tests passed, "it works", …): need turn evidence.
        if (c.isTestClaim) {
            if (/(\bFAIL\b|failing|exit_code["']?\s*[:=]\s*[1-9])/.test(evidenceText) && !EVIDENCE_SUCCESS.test(evidenceText)) {
                return { ...c, status: 'contradicted', why: 'evidence contains failures and no passing marker, but the text claims tests passed' };
            }
            if (EVIDENCE_SUCCESS.test(evidenceText)) return { ...c, status: 'supported', why: 'turn evidence carries a success marker' };
            return { ...c, status: 'unverified', why: 'test claim with no test output in the turn evidence' };
        }
        if (EVIDENCE_SUCCESS.test(evidenceText)) return { ...c, status: 'supported', why: 'turn evidence carries a success marker' };
        return { ...c, status: 'unverified', why: 'completion asserted with no supporting tool evidence in this turn' };
    });

    let verdict;
    if (audited.length === 0) verdict = 'no_claims';
    else if (audited.some(c => c.status === 'contradicted')) verdict = 'contradicted';
    else if (audited.every(c => c.status === 'supported')) verdict = 'verified';
    else if (audited.some(c => c.status === 'supported')) verdict = 'partially_verified';
    else verdict = 'unverified';

    if (verdict === 'unverified') notes.push('Rule Zero: completion was asserted but nothing in this turn pokes it. Treat as NOT done until a tool result, read-back, or probe backs it.');
    if (verdict === 'contradicted') notes.push('Rule Zero: at least one completion claim is contradicted by this turn\'s own evidence. Report the failure, not the claim.');
    if (verdict === 'partially_verified') notes.push('Rule Zero: some claims are backed, some are not. Report the split honestly.');

    return { skill: 'graft_rule_zero', verdict, claims: audited, notes, auditedAt: new Date().toISOString() };
}

const DISCIPLINE = [
    'RULE ZERO — the verification discipline of this body:',
    '1. Never claim done without a poke: a tool result, a read-back, a probe, a status check — evidence gathered in the SAME turn as the claim.',
    '2. A claim with no evidence is reported as UNVERIFIED, not as done.',
    '3. A failed or partial result is reported as failed or partial, with the failing step named. Never launder a failure into a completion.',
    '4. Read-backs outrank intentions: if the file/test/state does not show it, it did not happen.',
    '5. Numbers, names, scores and dates are quoted from the source that was actually read — never from memory of memory (see graft_memory_hygiene).',
].join('\n');

async function skill_graft_rule_zero(input = {}) {
    const action = input.action || (input.text ? 'audit' : 'discipline');
    if (action === 'discipline') {
        return { success: true, skill: 'graft_rule_zero', discipline: DISCIPLINE };
    }
    if (action === 'audit') {
        const audit = auditCompletion(input);
        return { success: true, ...audit };
    }
    return { success: false, skill: 'graft_rule_zero', error: `Unknown action: ${action}`, available: ['audit', 'discipline'] };
}

module.exports = {
    skill_graft_rule_zero,
    run: skill_graft_rule_zero,
    auditCompletion,
    extractClaims,
    PLT_AFFINITY,
    MANIFEST: {
        name: 'graft_rule_zero',
        description: 'Rule Zero verification discipline (Phase 5 graft): audits completion claims against same-turn tool evidence and probes; verdicts verified / partially_verified / unverified / contradicted. No claim of done without a poke.',
        version: '1.0.0',
        inputs: { action: "'audit' (default when text given) | 'discipline'", text: 'completion text to audit', evidence: 'array of evidence strings from the same turn', probes: '[{name, ok, detail}] verification probes' },
        output: '{ verdict, claims: [{claim, status, why}], notes }',
    },
};
