/**
 * GRAFT — DELEGATION (Phase 5, The Graft)
 *
 * The copilot's dispatch practice, compiled into the body:
 *
 *   1. SELF-CONTAINED BRIEFS: a sub-agent inherits NOTHING. The brief
 *      carries the task, the context it needs (and only that), the exact
 *      deliverable, deterministic acceptance checks, and stop conditions.
 *   2. STOP CONDITIONS: when to halt and report instead of grinding —
 *      missing input, a check it cannot pass, a boundary it must not cross.
 *   3. HANDOFF READING: a returned handoff is READ and CHECKED, never
 *      relayed on faith. verify() runs the brief's acceptance checks
 *      against the actual result, deterministically (no model calls).
 *   4. NO UNRUN WORK REPORTED AS DONE: unexecuted/placeholder results
 *      (the Phase 1 honesty labels) fail verification by construction.
 *      Completion claims inside a handoff are audited by graft_rule_zero.
 *
 * Actions:
 *   brief               → { brief (text), spec } — build the brief.
 *   verify              → { verified, checks, ruleZero } — check a result
 *                         against a brief's acceptance, parent-side.
 *   dispatch_and_verify → end-to-end when a brain handle is available
 *                         (SkillsEngine route); on brain-less routes it
 *                         returns the brief with status 'needs_dispatch'
 *                         instead of pretending to have dispatched.
 */

'use strict';

const PLT_AFFINITY = { profit: 0.6, love: 0.3, tax: 0.2 };

function trimNum(n) {
    const v = Math.round(n * 1e6) / 1e6;
    return Object.is(v, -0) ? '0' : String(v);
}

function buildBrief(input = {}) {
    const agent = input.agent || 'general';
    const task = input.task || '';
    const context = input.context || '';
    const deliverable = input.deliverable || 'a written result answering the task';
    const acceptance = input.acceptance || {};
    const stopConditions = Array.isArray(input.stopConditions) && input.stopConditions.length ? input.stopConditions : [
        'a required input is missing or unreadable — stop and report exactly what is missing',
        'an acceptance check cannot be run — stop and say which check and why',
        'the work would cross the brief\'s boundaries — stop and report the boundary',
    ];
    const lines = [];
    lines.push('[SUB-AGENT BRIEF — self-contained: you inherit nothing beyond this text]');
    lines.push('');
    lines.push(`AGENT TYPE: ${agent}`);
    lines.push('');
    lines.push('TASK:');
    lines.push(task);
    if (context) { lines.push(''); lines.push('CONTEXT (all you get — work from this, not from assumptions):'); lines.push(context); }
    lines.push('');
    lines.push('DELIVERABLE:');
    lines.push(deliverable);
    lines.push('');
    lines.push('ACCEPTANCE (your result will be checked against these, exactly):');
    const accLines = [];
    if (Array.isArray(acceptance.contains)) for (const c of acceptance.contains) accLines.push(`- result must contain, verbatim: ${JSON.stringify(c)}`);
    if (typeof acceptance.equals === 'string') accLines.push(`- result must equal, exactly: ${JSON.stringify(acceptance.equals)}`);
    if (acceptance.pltCheck) accLines.push(`- result must state TRUE_VALUE=${trimNum(acceptance.pltCheck.profit + acceptance.pltCheck.love - acceptance.pltCheck.tax)} for PLT P=${acceptance.pltCheck.profit}, L=${acceptance.pltCheck.love}, T=${acceptance.pltCheck.tax} (Profit + Love − Tax)`);
    if (acceptance.minLength) accLines.push(`- result must be at least ${acceptance.minLength} characters`);
    if (accLines.length === 0) accLines.push('- result must directly answer the TASK, with evidence for any claim of fact');
    lines.push(accLines.join('\n'));
    lines.push('');
    lines.push('STOP CONDITIONS — stop and report instead of continuing if:');
    lines.push(stopConditions.map(s => `- ${s}`).join('\n'));
    lines.push('');
    lines.push('HONESTY CONTRACT:');
    lines.push('- Report only work you actually ran. If you did not execute something, say UNEXECUTED — never present planned or imagined work as done.');
    lines.push('- A failure is a valid result: report it as failed, with the reason. Do not launder a failure into a success.');
    lines.push('- Quote numbers, names and dates only from sources you actually read in this task.');
    return { brief: lines.join('\n'), spec: { agent, task, deliverable, acceptance, stopConditions } };
}

function resultTextOf(result) {
    if (result == null) return '';
    if (typeof result === 'string') return result;
    if (typeof result.output === 'string') return result.output;
    try { return JSON.stringify(result); } catch { return String(result); }
}

function verifyHandoff(input = {}) {
    const spec = input.spec || { acceptance: input.acceptance || {} };
    const acceptance = spec.acceptance || input.acceptance || {};
    const result = input.result;
    const text = resultTextOf(result);
    const checks = [];

    // Execution honesty first: an unexecuted result verifies NOTHING.
    const execStatus = result && typeof result === 'object' ? result.executionStatus : null;
    const isPlaceholder = /\[UNEXECUTED|synthetic_placeholder/.test(text);
    checks.push({
        name: 'actually_executed',
        ok: !isPlaceholder && execStatus !== 'unexecuted' && result != null && text.length > 0,
        detail: isPlaceholder ? 'result carries the UNEXECUTED placeholder label — no work was run' : (execStatus ? `executionStatus=${execStatus}` : 'result present, no unexecuted label'),
    });

    if (Array.isArray(acceptance.contains)) {
        for (const needle of acceptance.contains) {
            checks.push({ name: `contains:${String(needle).slice(0, 60)}`, ok: text.includes(needle), detail: `result ${text.includes(needle) ? 'contains' : 'does NOT contain'} ${JSON.stringify(String(needle).slice(0, 80))}` });
        }
    }
    if (typeof acceptance.equals === 'string') {
        checks.push({ name: 'equals', ok: text.trim() === acceptance.equals.trim(), detail: `expected exactly ${JSON.stringify(acceptance.equals.slice(0, 80))}` });
    }
    if (acceptance.pltCheck) {
        const expected = `TRUE_VALUE=${trimNum(acceptance.pltCheck.profit + acceptance.pltCheck.love - acceptance.pltCheck.tax)}`;
        checks.push({ name: 'plt_arithmetic', ok: text.includes(expected), detail: `independently recomputed by the parent: P+L−T = ${acceptance.pltCheck.profit}+${acceptance.pltCheck.love}−${acceptance.pltCheck.tax} → ${expected}; result ${text.includes(expected) ? 'states it' : 'does NOT state it'}` });
    }
    if (acceptance.minLength) {
        checks.push({ name: 'min_length', ok: text.length >= acceptance.minLength, detail: `result length ${text.length} vs required ${acceptance.minLength}` });
    }

    let ruleZero = null;
    try {
        const rz = require('./graft_rule_zero.js');
        ruleZero = rz.auditCompletion({ text, evidence: input.evidence || [] });
        checks.push({ name: 'rule_zero_no_contradiction', ok: ruleZero.verdict !== 'contradicted', detail: `rule-zero verdict on the handoff text: ${ruleZero.verdict}` });
    } catch (e) { ruleZero = { error: String(e && e.message || e) }; }

    const verified = checks.every(c => c.ok);
    return {
        success: true,
        skill: 'graft_delegation',
        verified,
        checks,
        ruleZero: ruleZero ? { verdict: ruleZero.verdict, claims: (ruleZero.claims || []).length } : null,
        verdictLine: verified
            ? 'VERIFIED — the parent checked this handoff against the brief\'s acceptance and it passes. Reporting it is reporting checked work.'
            : 'NOT VERIFIED — at least one acceptance check failed. This handoff must be reported as unverified/failed, NOT as done.',
    };
}

async function dispatchAndVerify(input, brain, memory) {
    const { brief, spec } = buildBrief(input);
    if (!brain || typeof brain.think !== 'function') {
        return {
            success: false,
            status: 'needs_dispatch',
            skill: 'graft_delegation',
            brief,
            spec,
            note: 'No brain handle on this invocation route, so no dispatch was run — and none is claimed. Dispatch the brief via the sub-agent spawner (MCP sub_agents.dispatch), then call action=verify with the returned result. That two-step IS the delegation pattern: the parent dispatches, the parent verifies.',
        };
    }
    const { SubagentSpawner } = require('../brain/subagent_spawner.js');
    const spawner = new SubagentSpawner({ brain, memory }, {});
    const started = await spawner.dispatch(spec.agent, brief);
    const timeoutMs = input.timeoutMs || 120000;
    const deadline = Date.now() + timeoutMs;
    let entry = null;
    while (Date.now() < deadline) {
        const agents = spawner.listAgents();
        entry = agents.find(a => a.agentId === started.agentId) || entry;
        if (entry && entry.result) break;
        if (entry && ['unexecuted', 'failed', 'error'].includes(entry.status) && !entry.result) break;
        await new Promise(r => setTimeout(r, 1500));
    }
    if (!entry || !entry.result) {
        return { success: false, status: 'dispatch_timeout_or_unexecuted', skill: 'graft_delegation', dispatch: started, agentStatus: entry ? entry.status : 'unknown', note: 'No executed result arrived — reported as such, not as a completion.' };
    }
    const verification = verifyHandoff({ spec, result: entry.result });
    return {
        success: verification.verified,
        status: verification.verified ? 'dispatched_and_verified' : 'dispatched_not_verified',
        skill: 'graft_delegation',
        dispatch: started,
        result: entry.result,
        verification,
    };
}

const DISCIPLINE = [
    'DELEGATION DISCIPLINE — how this body hands work down:',
    '1. BRIEFS ARE SELF-CONTAINED: the sub-agent inherits nothing — task, needed context only, exact deliverable, deterministic acceptance, stop conditions, honesty contract.',
    '2. STOP CONDITIONS ARE PART OF THE BRIEF: missing input, an un-runnable check, a boundary — the agent stops and reports rather than improvising past them.',
    '3. THE PARENT VERIFIES BEFORE REPORTING: a handoff is read and checked against the brief\'s acceptance (verify) — recomputed arithmetic, verbatim strings, execution status. Unverified work is reported as unverified.',
    '4. UNEXECUTED IS A RESULT, NOT AN EMBARRASSMENT: placeholder/unexecuted dispatches are surfaced with their label intact (Phase 1 honesty), never counted as completions.',
].join('\n');

async function skill_graft_delegation(input = {}, brain, memory) {
    const action = input.action || 'brief';
    if (action === 'discipline') return { success: true, skill: 'graft_delegation', discipline: DISCIPLINE };
    if (action === 'brief') { const { brief, spec } = buildBrief(input); return { success: true, skill: 'graft_delegation', brief, spec }; }
    if (action === 'verify') return verifyHandoff(input);
    if (action === 'dispatch_and_verify') return dispatchAndVerify(input, brain, memory);
    return { success: false, skill: 'graft_delegation', error: `Unknown action: ${action}`, available: ['brief', 'verify', 'dispatch_and_verify', 'discipline'] };
}

module.exports = {
    skill_graft_delegation,
    run: skill_graft_delegation,
    _buildBrief: buildBrief,
    _verifyHandoff: verifyHandoff,
    PLT_AFFINITY,
    MANIFEST: {
        name: 'graft_delegation',
        description: 'Delegation discipline (Phase 5 graft): builds self-contained sub-agent briefs (task, context, deliverable, deterministic acceptance, stop conditions, honesty contract) and verifies handoffs parent-side before anything is reported — unexecuted work can never verify.',
        version: '1.0.0',
        inputs: { action: "'brief' | 'verify' | 'dispatch_and_verify' | 'discipline'", agent: 'agent type', task: 'the task', context: 'context the agent needs', deliverable: 'exact deliverable', acceptance: '{contains?, equals?, pltCheck?: {profit, love, tax}, minLength?}', stopConditions: '[strings]', result: '(verify) the handoff result to check' },
        output: 'brief → { brief, spec }; verify → { verified, checks, ruleZero, verdictLine }',
    },
};
