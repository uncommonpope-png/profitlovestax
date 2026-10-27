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
const GRAFT_CALLABLE = new Set(['graft_rule_zero', 'graft_memory_hygiene', 'graft_delegation', 'graft_digestion', 'graft_senses', 'graft_digestion_judge', 'graft_look_loop', 'graft_look_squeeze', 'graft_browser', 'graft_scrape', 'graft_code_memory', 'graft_benchmark', 'graft_council']); // + GSK fix sprint 2026-10-26 (graft_council — explicit council caller, Tier-1 #13; seats action verified via harness, live council sit blocked at 1 seat in sprint context — see sprint report) // + Phase 6 grafts (digestion, senses) + Self-Growth Cycle #1 (digestion judge) + Make-Him-Better Front 1 (look loop) + look squeeze (quality-per-judge-call) + Wiring Sprint 2026-10-23 (graft_browser — the browser organ, audited + probe-verified in the sprint) + Internet-Organs Repair 2026-10-23 (graft_scrape — structured extraction, isolation-audited + probe-verified on live GitHub Trending before admission) + Steal List 2026-10-23 (graft_code_memory — codebase-memory-mcp structural code memory via brain/mcp_servers.js; graft_benchmark — the standing exam suite in gsk-core/benchmarks/; both probe-verified in gsk-sessions/2026-10-23-steal-list-build.md before admission)

// ── Unified event trace (Steal List #5) ────────────────────────────────
// The harness is a founding emitter on the body's ONE trace stream
// (brain/event_trace.js). Guarded: telemetry is a witness, never a
// gate — a trace failure must not change harness behavior.
let _trace = null;
try { _trace = require('../brain/event_trace.js').trace; } catch { _trace = null; }
function emitTrace(event, data, runId) {
    if (!_trace) return;
    try { _trace('harness', event, data || {}, { runId: runId || null }); } catch { /* witness, never a gate */ }
}

// ── Checkpointed runs (Steal List #1, 2026-10-23 — LangGraph's
// checkpointer pattern, landed on machinery this body already
// trusts: the chamber store's atomic tmp+rename discipline).
// Chamber STATE already survived a kill; task EXECUTION did not —
// a killed run was a lost run. Now every run persists a step
// ledger (gate verdict, per-step outcome, probe results) under
// .seshat-brain/runs/<runId>.json, checkpointed after the gate and
// after EVERY step. The 'resume' action re-enters a run in a fresh
// process: the PLT gate is re-checked (fail-closed — a resume
// never inherits a stale ALLOWED), steps whose probes already
// passed are skipped, and the run finishes through the same
// look/score/report tail as a fresh run. PLT is scored exactly
// once, at final completion. ─────────────────────────────────────
const RUNS_DIR = path.resolve(__dirname, '..', '..', '..', 'workbench', '.seshat-brain', 'runs');
function runFileFor(runId) { return path.join(RUNS_DIR, `${String(runId).replace(/[^a-zA-Z0-9._-]/g, '_')}.json`); }
function newRunId() { return `run-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`; }
function writeCheckpoint(run) {
    try {
        fs.mkdirSync(RUNS_DIR, { recursive: true });
        const file = runFileFor(run.runId);
        const tmp = `${file}.tmp-${process.pid}`;
        run.updatedAt = new Date().toISOString();
        fs.writeFileSync(tmp, JSON.stringify(run, null, 2), 'utf8');
        fs.renameSync(tmp, file);
        return file;
    } catch { return null; /* a checkpoint failure must not kill the run it describes */ }
}
function readCheckpoint(runId) {
    try { return JSON.parse(fs.readFileSync(runFileFor(runId), 'utf8')); } catch { return null; }
}

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

// READ-BACK SCREENING (parent repair, 2026-10-23 —
// gsk-sessions/2026-10-23-readback-screen-fix.md): a file read-back
// is the file itself, not prose the body produced. The vapor fix
// made think/output screening code-aware, but callSkill screened
// read_file results as PROSE — a raw unfenced .js file's content
// carries no code fences, so a byte-identical read-back of real
// code was flagged repetition_salad, the read-back probe reported
// MISMATCH, and a successful build was scored as a failure. The
// rule here follows the vapor fix's positive-evidence principle:
// a read-back is screened as code ONLY when the file's extension
// is positive evidence of code. Prose files (.md, .txt, …) and
// unknown extensions keep the full prose screen — fail-closed.
const CODE_FILE_EXTS = new Set([
    'js', 'cjs', 'mjs', 'ts', 'tsx', 'jsx', 'json',
    'py', 'rb', 'go', 'rs', 'java', 'c', 'h', 'cpp', 'hpp', 'cs', 'php',
    'sh', 'bash', 'css', 'scss', 'html', 'htm', 'xml', 'yml', 'yaml', 'toml', 'sql',
]);

function _screenOptsFor(input, result) {
    const readPath =
        (input && input.action === 'read_file' && typeof input.path === 'string') ? input.path :
        (result && typeof result === 'object' && result.action === 'read_file' && typeof result.path === 'string') ? result.path :
        null;
    if (!readPath) return undefined;
    const ext = path.extname(readPath).slice(1).toLowerCase();
    return CODE_FILE_EXTS.has(ext) ? { expectCode: true } : undefined;
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
    // VAPOR CHECK (Wiring Sprint Phase 2, 2026-10-23): the digestion
    // judge's degenerate-output catch, generalized to step results.
    // A step whose TEXT output is degenerate (empty / too-short
    // non-reply / fake-completion / repetition salad — brain/
    // vapor_check.js layer 1) FAILS the step: vapor can never ride
    // into a "completed" report. Structured results are screened on
    // their longest prose field (report/content/text/output) when it
    // is long enough to be prose; short structured data is not prose
    // and is not screened as prose. File READ-BACKS are the one
    // declared-type case: _screenOptsFor passes { expectCode: true }
    // when the file being read back is positively a code file, so
    // the bytes are judged by the code-shaped rules they would have
    // faced as output — never by the prose salad rule.
    try {
        const { vaporScreen } = require('../brain/vapor_check.js');
        let textToScreen = null;
        if (typeof guarded === 'string') textToScreen = guarded;
        else if (guarded && typeof guarded === 'object') {
            for (const k of ['report', 'content', 'text', 'output', 'discipline']) {
                if (typeof guarded[k] === 'string' && guarded[k].length >= 200) { textToScreen = guarded[k]; break; }
            }
        }
        if (textToScreen) {
            const screen = vaporScreen(textToScreen, _screenOptsFor(input, guarded));
            if (screen.degenerate) {
                return { ok: false, error: 'vapor_output', skill: skillName, auditClass: cls, detail: `vapor check caught degenerate step output (${screen.flags.join(', ')}) — step failed, never delivered`, result: guarded };
            }
        }
    } catch (e) { /* the screen never breaks the harness */ }
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
// resumeState (Steal List #1): a checkpoint record loaded by the
// 'resume' action. When present, task/steps/plt come from the
// record, steps already ok (probes passed) are skipped, and the
// gate is re-checked fresh — fail-closed, never inherited.
async function runHarness(input, brain, memory, resumeState = null) {
    const runId = (resumeState && resumeState.runId) || input.runId || newRunId();
    const task = (resumeState && resumeState.task) || input.task || 'unnamed task';
    const steps = (resumeState && Array.isArray(resumeState.steps)) ? resumeState.steps : (Array.isArray(input.steps) ? input.steps : []);
    const gateInput = resumeState ? (resumeState.plt || undefined) : (input.plt || undefined);
    const lines = [];
    lines.push(`TASK: ${task}`);
    if (resumeState) lines.push(`RESUME: re-entering run ${runId} (checkpoint created ${resumeState.createdAt}; ${resumeState.stepReports ? resumeState.stepReports.filter(s => s.ok).length : 0} step(s) already passed and will be skipped)`);
    emitTrace('run_start', { task, steps: steps.length, resumed: !!resumeState }, runId);

    // The durable run record — checkpointed after the gate and
    // after every step (writeCheckpoint above).
    const run = {
        runId,
        task,
        steps,
        plt: gateInput || null,
        pltImpact: (resumeState && resumeState.pltImpact) || input.pltImpact || null,
        createdAt: (resumeState && resumeState.createdAt) || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        status: 'started',
        gate: null,
        stepReports: [],
        resumedCount: resumeState ? (resumeState.resumedCount || 0) + 1 : 0,
    };

    // PLT GATE — before any tool runs.
    let plt = null, gate = null;
    try {
        plt = new PLTEngine({ soulId: 'gsk', archetype: 'ARCHITECT', dataDir: PLT_DATA_DIR });
        gate = plt.gate(`graft_harness: ${task}`, gateInput);
    } catch (e) {
        lines.push(`PLT GATE: engine error — ${String(e && e.message || e).slice(0, 200)} (fail-closed: task NOT run)`);
        run.status = 'plt_engine_error'; writeCheckpoint(run);
        emitTrace('run_end', { status: 'plt_engine_error' }, runId);
        return { success: false, status: 'plt_engine_error', task, runId, report: lines.join('\n'), steps: [], verification: [] };
    }
    lines.push(`PLT GATE: ${gate.allowed ? 'ALLOWED' : 'BLOCKED'} — ${gate.reason}${gate.trueValue !== undefined && gate.trueValue !== null ? ` (trueValue=${Number(gate.trueValue).toFixed(4)})` : ''}`);
    run.gate = { allowed: gate.allowed, reason: gate.reason, trueValue: gate.trueValue };
    emitTrace('gate', { allowed: gate.allowed, reason: String(gate.reason || '').slice(0, 200), trueValue: gate.trueValue }, runId);
    if (!gate.allowed) {
        lines.push('STATUS: plt_blocked — no tool was run. Reported as blocked, not completed.');
        run.status = 'plt_blocked'; writeCheckpoint(run);
        emitTrace('run_end', { status: 'plt_blocked' }, runId);
        return { success: false, status: 'plt_blocked', task, runId, gate, report: lines.join('\n'), steps: [], verification: [] };
    }
    if (steps.length === 0) {
        lines.push('STATUS: failed — no steps were provided; a plan with no steps completes nothing.');
        run.status = 'failed'; writeCheckpoint(run);
        emitTrace('run_end', { status: 'failed', reason: 'no_steps' }, runId);
        return { success: false, status: 'failed', task, runId, gate, report: lines.join('\n'), steps: [], verification: [] };
    }
    run.status = 'running'; writeCheckpoint(run);

    const stepReports = [];
    const allProbes = [];
    const htmlArtifacts = [];
    let failedAt = null;
    // Resume: pre-seed the reports of steps that already passed
    // (outcome + probes) so the final accounting covers the whole
    // run, and skip re-executing them.
    const priorOk = new Map();
    if (resumeState && Array.isArray(resumeState.stepReports)) {
        for (const sr of resumeState.stepReports) if (sr && sr.ok) priorOk.set(sr.step, sr);
    }
    for (let i = 0; i < steps.length; i++) {
        const step = steps[i];
        if (priorOk.has(i + 1)) {
            const sr = priorOk.get(i + 1);
            stepReports.push(sr);
            allProbes.push(...(sr.probes || []));
            lines.push(`STEP ${i + 1}/${steps.length} ${step.skill}: SKIPPED (resume) — passed in the earlier attempt; checkpoint stands`);
            emitTrace('step_skipped', { step: i + 1, skill: step.skill }, runId);
            if (step.skill === 'file_system' && step.input && step.input.action === 'write_file' && typeof step.input.path === 'string' && /\.html?$/i.test(step.input.path)) htmlArtifacts.push(step.input.path);
            continue;
        }
        const outcome = await callSkill(step.skill, step.input || {}, brain, memory, step.timeoutMs);
        const probes = outcome.ok ? await runProbes(step, outcome, brain, memory) : [];
        allProbes.push(...probes);
        const probesOk = probes.every(p => p.ok);
        const stepOk = outcome.ok && probesOk;
        stepReports.push({ step: i + 1, skill: step.skill, ok: stepOk, outcome: outcome.ok ? summarize(outcome.result) : (outcome.detail || outcome.error || 'failed'), probes });
        run.stepReports = stepReports.slice();
        run.status = stepOk ? 'running' : 'failed';
        writeCheckpoint(run);
        emitTrace('step', { step: i + 1, skill: step.skill, ok: stepOk, probes: probes.map(p => ({ name: p.name, ok: p.ok })) }, runId);
        lines.push(`STEP ${i + 1}/${steps.length} ${step.skill}: ${stepOk ? 'OK' : 'FAILED'} — ${stepOk ? summarize(outcome.result) : (outcome.detail || outcome.error || summarize(outcome.result))}`);
        // HTML artifacts are collected for the LOOK stage below: a
        // written .html file is not done when its bytes read back —
        // it is done when it has been SEEN (Front 1, look loop).
        if (stepOk && step.skill === 'file_system' && step.input && step.input.action === 'write_file' && typeof step.input.path === 'string' && /\.html?$/i.test(step.input.path)) {
            htmlArtifacts.push(step.input.path);
        }
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

    // LOOK STAGE (Make-Him-Better Front 1) — byte read-back verifies
    // the FILE, not the BUILD. Every HTML artifact this run wrote is
    // rendered (phone touch + desktop), judged by the vision seat
    // against the brief, and revised under the judge's critiques
    // (cap 3) before "completed" may be claimed. The loop's verdict
    // rides in the return as `lookLoop` WITH final screenshots +
    // scores. UNSEEN (no renderer / no vision seat) or below-bar
    // both demote the run to verification_failed — never a silent pass.
    const lookResults = [];
    if (status === 'completed' && htmlArtifacts.length > 0 && input.lookLoop !== false) {
        lines.push('LOOK LOOP:');
        for (const htmlPath of htmlArtifacts) {
            const lr = await callSkill('graft_look_loop', {
                action: 'run',
                htmlPath,
                brief: input.brief || task,
                outDir: input.lookOutDir || undefined,
                maxRevisions: input.maxRevisions,
            }, brain, memory, 900000);
            const v = lr.ok || lr.result ? (lr.result || {}) : { status: 'unseen', seen: false, error: lr.error || 'look loop call failed', detail: lr.detail };
            lookResults.push(v);
            if (v.report) for (const l of String(v.report).split('\n')) lines.push(`  ${l}`);
            else lines.push(`  ${htmlPath}: ${v.status || 'unknown'} — ${v.error || ''} ${v.detail || ''}`.trim());
            if (v.status !== 'passed') {
                status = 'verification_failed';
                lines.push(`  → ${htmlPath} did NOT pass the look loop (status: ${v.status}); this run is NOT completed. ${v.status === 'unseen' ? 'The artifact was never seen — no visual claim may be made for it.' : 'Final scores are attached in lookLoop; the critiques say what to fix.'}`);
            }
        }
    }

    // PLT SCORE — the outcome is written into the body's own ledger.
    // (Canonical engine: score() returns {profit, love, tax, score};
    // the ledger counters live on getState().)
    let pltScore = null;
    try {
        const impacts = run.pltImpact || (status === 'completed'
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

    // Final checkpoint: the run record lands with its terminal
    // status so a later process can see exactly where it ended —
    // and a completed run's checkpoint is what 'resume' refuses to
    // redo (it reports already_completed instead).
    run.status = status;
    run.stepReports = stepReports;
    run.pltScore = pltScore ? { trueValue: pltScore.trueValue, totalActions: pltScore.totalActions } : null;
    const checkpointFile = writeCheckpoint(run);
    if (pltScore) emitTrace('plt_score', { trueValue: pltScore.trueValue, totalActions: pltScore.totalActions }, runId);
    emitTrace('run_end', { status, steps: stepReports.length, probes: allProbes.length }, runId);

    return {
        success: status === 'completed',
        status,
        task,
        runId,
        checkpoint: checkpointFile,
        gate: { allowed: gate.allowed, reason: gate.reason, trueValue: gate.trueValue },
        steps: stepReports,
        verification: allProbes,
        lookLoop: lookResults,
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
    'LOOK: an HTML artifact is rendered and SEEN before it is done — phone (touch) and desktop frames judged by the vision seat against the brief (graft_look_loop). Below the bar → revised under the judge\'s critiques (cap 3). UNSEEN is a verdict, never a pass.',
    'REPORT: "completed" only when every step ran AND every probe passed AND every HTML artifact passed the look loop with screenshots + scores attached. Anything else is reported as what it is.',
    'RESUME: every run checkpoints its step ledger under .seshat-brain/runs/ after the gate and after each step. A killed or failed run is re-entered with action "resume" + its runId in a fresh process: the gate is re-checked (never inherited), passed steps are skipped, the rest finish through the same tail. PLT is scored once, at final completion.',
].join('\n');

async function resumeRun(input = {}, brain, memory) {
    const runId = input.runId;
    if (!runId) return { success: false, skill: 'graft_tool_harness', status: 'resume_failed', error: 'runId_required', detail: 'resume needs the runId of the interrupted run (returned by the original run and named in its checkpoint file under .seshat-brain/runs/)' };
    const prior = readCheckpoint(runId);
    if (!prior) return { success: false, skill: 'graft_tool_harness', status: 'resume_failed', error: 'checkpoint_not_found', detail: `no checkpoint at ${runFileFor(runId)} — the run either never checkpointed or its record is gone; it cannot be resumed, only re-planned` };
    if (prior.status === 'completed') {
        return { success: true, skill: 'graft_tool_harness', status: 'already_completed', runId, detail: `run ${runId} already completed (${prior.stepReports ? prior.stepReports.length : 0} steps, all probes passed) — resume is a no-op, nothing was re-executed`, steps: prior.stepReports || [] };
    }
    return runHarness({ runId }, brain, memory, prior);
}

async function skill_graft_tool_harness(input = {}, brain, memory) {
    const action = input.action || 'run';
    if (action === 'discipline') return { success: true, skill: 'graft_tool_harness', discipline: DISCIPLINE };
    if (action === 'resume') return resumeRun(input, brain, memory);
    if (action === 'plan') {
        return { success: true, skill: 'graft_tool_harness', plan: { task: input.task || null, steps: (input.steps || []).map((s, i) => ({ step: i + 1, skill: s.skill, auditClass: (() => { const r = resolveSkillFile(s.skill); return r ? auditClassFor(s.skill, r.file) : 'file_not_found'; })() })) }, note: 'plan only — nothing executed' };
    }
    if (action === 'run') return runHarness(input, brain, memory);
    return { success: false, skill: 'graft_tool_harness', error: `Unknown action: ${action}`, available: ['run', 'resume', 'plan', 'discipline'] };
}

module.exports = {
    skill_graft_tool_harness,
    run: skill_graft_tool_harness,
    _runHarness: runHarness,
    _resumeRun: resumeRun,
    _readCheckpoint: readCheckpoint,
    _runFileFor: runFileFor,
    _callSkill: callSkill,
    _auditClassFor: auditClassFor,
    PLT_AFFINITY,
    MANIFEST: {
        name: 'graft_tool_harness',
        description: 'Tool harness discipline (Phase 5 graft): plan → canonical-PLT gate → act via Phase-4-audited-real skills only (honesty guard on every result) → automatic read-back probes → PLT-score → honest report. Status is "completed" only when every step and every probe passes.',
        version: '1.0.0',
        inputs: { action: "'run' (default) | 'plan' | 'discipline'", task: 'task name', steps: '[{skill, input, verify?, autoVerify?, continueOnError?, timeoutMs?}]', plt: 'optional {profit, love, tax} values for the gate', pltImpact: 'optional score impacts' },
        output: '{ success, status: completed|failed|verification_failed|plt_blocked, gate, steps, verification: [probes], pltScore, report }',
    },
};
