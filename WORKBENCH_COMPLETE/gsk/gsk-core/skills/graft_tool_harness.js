/**
 * GRAFT — TOOL HARNESS DISCIPLINE (Phase 5, The Graft)
 *
 * The body's working loop, compiled as a first-class skill:
 *
 *     PLAN → PLT-GATE → ACT (via audited-real skills only) → READ BACK
 *          → PLT-SCORE → REPORT HONESTLY
 *
 * Built entirely on the Phase 4 substrate:
 *   - the canonical PLT engine (gsk-core/plt-engine.js) gates the task
 *     before any tool runs and scores the outcome after;
 *   - only skills the Phase 4 audit classified "real"
 *     (WORKBENCH_COMPLETE/gsk/skills-audit-phase4.json) may be invoked —
 *     stubs and repaired fakes are refused by name;
 *   - every step result passes the same honesty guard class as
 *     SkillsEngine/UTB (Phase 4): undefined/null, literal "Completed",
 *     fake-execute and "keys configured" readiness strings are converted
 *     into explicit not_implemented results, never successes;
 *   - file writes are automatically READ BACK and byte-compared
 *     (the verification step is part of the loop, not an afterthought);
 *   - the final report carries a visible VERIFICATION section and a
 *     status that is "completed" ONLY when every step succeeded AND
 *     every probe passed. Anything else is failed / verification_failed
 *     / plt_blocked — reported as such (graft_rule_zero).
 *
 * No new framework. The executor mirrors the UTB's proven semantics:
 * fresh require, prefer the skill_<name> export, stub-run detection.
 */

'use strict';

const fs = require('fs');
const path = require('path');
const { PLTEngine } = require('../plt-engine.js');

const PLT_AFFINITY = { profit: 0.7, love: 0.3, tax: 0.3 };
const SKILLS_DIR = __dirname;
const AUDIT_PATH = path.resolve(__dirname, '..', '..', 'skills-audit-phase4.json');
const PLT_DATA_DIR = path.resolve(__dirname, '..', '..', 'data', 'plt');
// The Phase 5 graft set itself: authored this phase, exercised by the
// Phase 5 acceptance runs; callable through the harness (except the
// harness itself — no recursion).
const GRAFT_CALLABLE = new Set(['graft_rule_zero', 'graft_memory_hygiene', 'graft_delegation', 'graft_digestion', 'graft_senses', 'graft_digestion_judge']); // + Phase 6 grafts (digestion, senses) + Self-Growth Cycle #1 (digestion judge)

// ── Allowlist: Phase 4 audit, file → class ─────────────────────────────
function loadAudit() {
    try {
        const entries = JSON.parse(fs.readFileSync(AUDIT_PATH, 'utf8'));
        const byFile = new Map();
        for (const e of entries) if (e && e.file) byFile.set(e.file, e);
        return byFile;
    } catch { return new Map(); }
}

function resolveSkillFile(skillName) {
    const candidates = [`${skillName}.js`, `${skillName.replace(/_/g, '-')}.js`, `${skillName.replace(/-/g, '_')}.js`];
    for (const c of candidates) {
        const p = path.join(SKILLS_DIR, c);
        if (fs.existsSync(p)) return { file: c, fullPath: p };
    }
    return null;
}

function auditClassFor(skillName, file) {
    if (GRAFT_CALLABLE.has(skillName)) return 'real (graft, Phase 5)';
    const audit = loadAudit();
    const entry = audit.get(file);
    return entry ? entry.class : 'unaudited';
}

// ── Executor: UTB semantics (fresh require, skill_<name> preferred) ──
function loadSkillFn(fullPath, skillName) {
    delete require.cache[require.resolve(fullPath)];
    const mod = require(fullPath);
    const fn = mod[`skill_${skillName}`] || mod[`skill_${skillName.replace(/-/g, '_')}`] || mod[`skill_${skillName.replace(/_/g, '-')}`] || (typeof mod.run === 'function' ? mod.run : null) || (typeof mod === 'function' ? mod : null);
    if (typeof fn !== 'function') return { fn: null, reason: 'no_callable_export' };
    const src = fn.toString().replace(/\s+/g, ' ').trim();
    const bodyMatch = src.match(/\{([\s\S]*)\}$/);
    const body = bodyMatch ? bodyMatch[1].trim() : '';
    const isStub = body === '' || /^\s*return\s+(undefined|null|Promise\.resolve\(\))\s*;?$/.test(body) ||
        /not implemented|not_implemented|placeholder/i.test(src) && body.length < 200;
    if (isStub) return { fn: null, reason: 'stub_export' };
    return { fn };
}

// ── Honesty guard (Phase 4 pattern, incl. the readiness repair) ───────
function honestyGuard(result, skillName) {
    if (result === undefined || result === null) {
        return { status: 'not_implemented', skill: skillName, reason: 'skill returned no result (undefined/null) — treated as not implemented, not success', _honestyGuard: true };
    }
    if (typeof result === 'string') {
        const t = result.trim();
        if (t === 'Completed' || t === 'completed') {
            return { status: 'not_implemented', skill: skillName, reason: 'skill returned the literal string "Completed" with no evidence payload — not accepted as success', _honestyGuard: true };
        }
        if (/^(fake-?execute|simulated|mock)\b/i.test(t)) {
            return { status: 'not_implemented', skill: skillName, reason: `skill returned a simulated-execution string: "${t.slice(0, 120)}"`, _honestyGuard: true };
        }
        if (/^\[UNEXECUTED/i.test(t)) {
            return { status: 'not_implemented', skill: skillName, reason: 'skill returned an UNEXECUTED placeholder', _honestyGuard: true, output: t.slice(0, 300) };
        }
    }
    if (typeof result === 'object' && result.success === true && typeof result.message === 'string' &&
        /skill ready/i.test(result.message) && /keys? configured/i.test(result.message) &&
        !result.data && !result.result && !result.output && result.verified !== true) {
        return { status: 'not_implemented', skill: skillName, reason: `readiness string, not an execution: "${result.message.slice(0, 140)}"`, _honestyGuard: true };
    }
    return result;
}

function stepSucceeded(result) {
    if (!result || typeof result !== 'object') return typeof result === 'string' && result.trim().length > 0;
    if (result._honestyGuard) return false;
    if (result.success === false) return false;
    if (result.error) return false;
    if (result.status === 'error' || result.status === 'not_implemented' || result.status === 'failed') return false;
    if (result.executionStatus && result.executionStatus !== 'executed') return false;
    if (result.executed === false) return false;
    return true;
}

function summarize(result) {
    try {
        const s = JSON.stringify(result);
        return s.length > 400 ? s.slice(0, 400) + '…' : s;
    } catch { return String(result).slice(0, 400); }
}

async function callSkill(skillName, input, brain, memory, timeoutMs = 30000) {
    const resolved = resolveSkillFile(skillName);
    if (!resolved) return { ok: false, error: 'skill_file_not_found', skill: skillName };
    const cls = auditClassFor(skillName, resolved.file);
    if (cls !== 'real' && cls !== 'real (graft, Phase 5)') {
        return { ok: false, error: 'skill_not_audited_real', skill: skillName, auditClass: cls, detail: `Phase 4 audit class for ${resolved.file} is "${cls}" — the harness only runs audited-real skills` };
    }
    const { fn, reason } = loadSkillFn(resolved.fullPath, skillName);
    if (!fn) return { ok: false, error: reason || 'not_callable', skill: skillName };
    let raw;
    try {
        raw = await Promise.race([
            Promise.resolve().then(() => fn(input || {}, brain, memory)),
            new Promise((_, rej) => setTimeout(() => rej(new Error(`skill timed out after ${timeoutMs}ms`)), timeoutMs)),
        ]);
    } catch (e) {
        return { ok: false, error: 'skill_threw', skill: skillName, detail: String(e && e.message || e).slice(0, 300) };
    }
    const guarded = honestyGuard(raw, skillName);
    return { ok: stepSucceeded(guarded), skill: skillName, auditClass: cls, result: guarded };
}

// ── Probes (read-back) ─────────────────────────────────────────────────
async function runProbes(step, stepOutcome, brain, memory) {
    const probes = [];
    const input = step.input || {};
    // Automatic read-back for file writes: the result is not trusted
    // until the file is read back and byte-compared.
    if (step.skill === 'file_system' && input.action === 'write_file' && typeof input.content === 'string' && stepOutcome.ok && step.autoVerify !== false) {
        const rb = await callSkill('file_system', { action: 'read_file', path: input.path }, brain, memory);
        const ok = !!(rb.ok && rb.result && rb.result.content === input.content);
        probes.push({
            name: `read_back:${input.path}`,
            ok,
            detail: ok
                ? `read back ${rb.result.size} bytes; content byte-identical to what was written (first 80 chars: ${JSON.stringify((rb.result.content || '').slice(0, 80))})`
                : `read-back MISMATCH or failure: ${summarize(rb.result || rb)}`,
        });
    }
    if (step.verify && typeof step.verify === 'object') {
        if (typeof step.verify.contains === 'string') {
            const hay = (() => { try { return JSON.stringify(stepOutcome.result); } catch { return ''; } })();
            probes.push({ name: `contains:${step.verify.contains.slice(0, 60)}`, ok: hay.includes(step.verify.contains), detail: `step result ${hay.includes(step.verify.contains) ? 'contains' : 'does NOT contain'} ${JSON.stringify(step.verify.contains.slice(0, 80))}` });
        }
        if (step.verify.skill) {
            const pr = await callSkill(step.verify.skill, step.verify.input || {}, brain, memory, step.timeoutMs);
            let ok = pr.ok;
            let detail = `probe skill ${step.verify.skill}: ${summarize(pr.result || pr)}`;
            if (ok && typeof step.verify.contains === 'string') {
                const hay = (() => { try { return JSON.stringify(pr.result); } catch { return ''; } })();
                ok = hay.includes(step.verify.contains);
                detail += ` | contains ${JSON.stringify(step.verify.contains.slice(0, 60))}: ${ok}`;
            }
            probes.push({ name: `probe:${step.verify.skill}`, ok, detail });
        }
    }
    return probes;
}

// ── The harness loop ───────────────────────────────────────────────────
async function runHarness(input, brain, memory) {
    const task = input.task || 'unnamed task';
    const steps = Array.isArray(input.steps) ? input.steps : [];
    const lines = [];
    lines.push(`TASK: ${task}`);

    // PLT GATE — before any tool runs.
    let plt = null, gate = null;
    try {
        plt = new PLTEngine({ soulId: 'gsk', archetype: 'ARCHITECT', dataDir: PLT_DATA_DIR });
        gate = plt.gate(`graft_harness: ${task}`, input.plt || undefined);
    } catch (e) {
        lines.push(`PLT GATE: engine error — ${String(e && e.message || e).slice(0, 200)} (fail-closed: task NOT run)`);
        return { success: false, status: 'plt_engine_error', task, report: lines.join('\n'), steps: [], verification: [] };
    }
    lines.push(`PLT GATE: ${gate.allowed ? 'ALLOWED' : 'BLOCKED'} — ${gate.reason}${gate.trueValue !== undefined && gate.trueValue !== null ? ` (trueValue=${Number(gate.trueValue).toFixed(4)})` : ''}`);
    if (!gate.allowed) {
        lines.push('STATUS: plt_blocked — no tool was run. Reported as blocked, not completed.');
        return { success: false, status: 'plt_blocked', task, gate, report: lines.join('\n'), steps: [], verification: [] };
    }
    if (steps.length === 0) {
        lines.push('STATUS: failed — no steps were provided; a plan with no steps completes nothing.');
        return { success: false, status: 'failed', task, gate, report: lines.join('\n'), steps: [], verification: [] };
    }

    const stepReports = [];
    const allProbes = [];
    let failedAt = null;
    for (let i = 0; i < steps.length; i++) {
        const step = steps[i];
        const outcome = await callSkill(step.skill, step.input || {}, brain, memory, step.timeoutMs);
        const probes = outcome.ok ? await runProbes(step, outcome, brain, memory) : [];
        allProbes.push(...probes);
        const probesOk = probes.every(p => p.ok);
        const stepOk = outcome.ok && probesOk;
        stepReports.push({ step: i + 1, skill: step.skill, ok: stepOk, outcome: outcome.ok ? summarize(outcome.result) : (outcome.detail || outcome.error || 'failed'), probes });
        lines.push(`STEP ${i + 1}/${steps.length} ${step.skill}: ${stepOk ? 'OK' : 'FAILED'} — ${stepOk ? summarize(outcome.result) : (outcome.detail || outcome.error || summarize(outcome.result))}`);
        if (!stepOk) { failedAt = i + 1; if (!step.continueOnError) break; }
    }

    const allStepsOk = stepReports.every(s => s.ok) && stepReports.length === steps.length;
    const allProbesOk = allProbes.every(p => p.ok);
    let status;
    if (!allStepsOk) status = 'failed';
    else if (!allProbesOk) status = 'verification_failed';
    else status = 'completed';

    lines.push('VERIFICATION:');
    if (allProbes.length === 0) lines.push('  (no probes ran — nothing was read back; treat any success below with suspicion)');
    for (const p of allProbes) lines.push(`  ${p.ok ? '✓' : '✗'} ${p.name} — ${p.detail}`);

    // PLT SCORE — the outcome is written into the body's own ledger.
    // (Canonical engine: score() returns {profit, love, tax, score};
    // the ledger counters live on getState().)
    let pltScore = null;
    try {
        const impacts = input.pltImpact || (status === 'completed'
            ? { profitImpact: 0.3, loveImpact: 0.2, taxImpact: 0.1 }
            : { profitImpact: 0, loveImpact: 0, taxImpact: 0.5 });
        const scored = plt.score(`graft_harness: ${task}`, impacts);
        const st = plt.getState();
        pltScore = { trueValue: scored.score, profit: scored.profit, love: scored.love, tax: scored.tax, totalActions: st.totalActions };
        lines.push(`PLT SCORE: trueValue=${Number(scored.score).toFixed(4)} (P=${Number(scored.profit).toFixed(3)} L=${Number(scored.love).toFixed(3)} T=${Number(scored.tax).toFixed(3)}, impacts ${JSON.stringify(impacts)}) → body ledger totalActions=${st.totalActions}`);
    } catch (e) {
        lines.push(`PLT SCORE: failed to write ledger — ${String(e && e.message || e).slice(0, 160)}`);
    }

    lines.push(status === 'completed'
        ? 'STATUS: completed — every step ran and every read-back probe passed.'
        : status === 'verification_failed'
            ? 'STATUS: verification_failed — the steps ran but a read-back probe disagreed. NOT reported as completed.'
            : `STATUS: failed — stopped at step ${failedAt}. NOT reported as completed.`);

    return {
        success: status === 'completed',
        status,
        task,
        gate: { allowed: gate.allowed, reason: gate.reason, trueValue: gate.trueValue },
        steps: stepReports,
        verification: allProbes,
        pltScore: pltScore ? { trueValue: pltScore.trueValue, totalActions: pltScore.totalActions } : null,        report: lines.join('\n'),
    };
}

const DISCIPLINE = [
    'TOOL HARNESS DISCIPLINE — how this body works a task:',
    'PLAN: name the task and the exact steps before touching a tool.',
    'GATE: the canonical PLT engine judges the task first. Blocked means blocked — report it, do not route around it.',
    'ACT: one audited-real skill per step. Stubs, fakes and readiness strings are not execution.',
    'READ BACK: every effect is verified by reading the world again (file contents, state, exit codes) — never by trusting the write call.',
    'SCORE: the outcome is written into the PLT ledger, success or failure.',
    'REPORT: "completed" only when every step ran AND every probe passed. Anything else is reported as what it is.',
].join('\n');

async function skill_graft_tool_harness(input = {}, brain, memory) {
    const action = input.action || 'run';
    if (action === 'discipline') return { success: true, skill: 'graft_tool_harness', discipline: DISCIPLINE };
    if (action === 'plan') {
        return { success: true, skill: 'graft_tool_harness', plan: { task: input.task || null, steps: (input.steps || []).map((s, i) => ({ step: i + 1, skill: s.skill, auditClass: (() => { const r = resolveSkillFile(s.skill); return r ? auditClassFor(s.skill, r.file) : 'file_not_found'; })() })) }, note: 'plan only — nothing executed' };
    }
    if (action === 'run') return runHarness(input, brain, memory);
    return { success: false, skill: 'graft_tool_harness', error: `Unknown action: ${action}`, available: ['run', 'plan', 'discipline'] };
}

module.exports = {
    skill_graft_tool_harness,
    run: skill_graft_tool_harness,
    _runHarness: runHarness,
    _callSkill: callSkill,
    PLT_AFFINITY,
    MANIFEST: {
        name: 'graft_tool_harness',
        description: 'Tool harness discipline (Phase 5 graft): plan → canonical-PLT gate → act via Phase-4-audited-real skills only (honesty guard on every result) → automatic read-back probes → PLT-score → honest report. Status is "completed" only when every step and every probe passes.',
        version: '1.0.0',
        inputs: { action: "'run' (default) | 'plan' | 'discipline'", task: 'task name', steps: '[{skill, input, verify?, autoVerify?, continueOnError?, timeoutMs?}]', plt: 'optional {profit, love, tax} values for the gate', pltImpact: 'optional score impacts' },
        output: '{ success, status: completed|failed|verification_failed|plt_blocked, gate, steps, verification: [probes], pltScore, report }',
    },
};
