'use strict';
/**
 * STANDING BENCHMARK SUITE (Steal List #3, 2026-10-23 — OpenHands /
 * SWE-agent practice: published, reproducible evals instead of
 * episodic hand-run exams).
 *
 * The Oct 23 capability exam was run once, by hand. This suite
 * freezes it as versioned fixtures (benchmarks/exam-v1.json) so
 * "is he better?" becomes a number with a history:
 *
 *   node benchmarks/run-benchmarks.cjs           → run + print + diff
 *   node benchmarks/run-benchmarks.cjs --json    → machine output
 *   skill graft_benchmark {action:'run'}         → the same, in-body
 *
 * Every run writes a diffable JSON report to
 * .seshat-brain/benchmarks/report-<ts>.json and refreshes
 * latest.json; the report carries a `diff` section against the
 * previous run (per-check status flips + metric deltas).
 * REGRESSION = a check that passed last run and fails now →
 * process exit 1.
 *
 * Discipline (from the graft_eval_harness draft, senses-008):
 * deterministic graders first. Seat-dependent checks (the live
 * judge verdict T2b, synthesis T5) are declared in the fixtures
 * and reported SKIPPED with their reason — never silently passed,
 * never silently dropped. The live exam remains their runner.
 *
 * Note: T3 runs the real harness, which PLT-scores its outcome
 * into the body ledger exactly as the Oct 23 exam's T3 did — the
 * suite measures the body by using it, and says so.
 */

const fs = require('fs');
const path = require('path');

const FIXTURES_PATH = path.join(__dirname, 'exam-v1.json');
const BRAIN_DIR = path.resolve(__dirname, '..', '..', '..', 'workbench', '.seshat-brain');
const BENCH_DIR = path.join(BRAIN_DIR, 'benchmarks');
const SCRATCH_DIR = path.join(BENCH_DIR, 'scratch');
const DEEP_MEMORY = path.resolve(__dirname, '..', '..', '..', 'workbench', 'deep-memory', 'deep-memory.cjs');

function nowStamp() { return new Date().toISOString().replace(/[:.]/g, '-'); }

async function runCheck(check) {
    const t0 = Date.now();
    const base = { id: check.id, kind: check.kind };
    try {
        if (check.kind === 'recall' || check.kind === 'recall_control') {
            delete require.cache[require.resolve(DEEP_MEMORY)];
            const dm = require(DEEP_MEMORY);
            const hits = dm.search(check.query, 6, {});
            const top = hits && hits.length ? hits[0].score : 0;
            const metric = { topScore: Number(Number(top).toFixed(2)), hits: hits ? hits.length : 0, topTitle: hits && hits[0] ? String(hits[0].title || '').slice(0, 80) : null };
            if (check.kind === 'recall') {
                return { ...base, status: top >= check.minTopScore ? 'pass' : 'fail', metric, bar: `topScore >= ${check.minTopScore}`, ms: Date.now() - t0 };
            }
            return { ...base, status: top <= check.maxTopScore ? 'pass' : 'fail', metric, bar: `topScore <= ${check.maxTopScore}`, ms: Date.now() - t0 };
        }
        if (check.kind === 'vapor_screen') {
            const { vaporScreen } = require('../brain/vapor_check.js');
            const s = vaporScreen(check.text);
            return { ...base, status: s.degenerate === check.expectDegenerate ? 'pass' : 'fail', metric: { degenerate: s.degenerate, flags: s.flags, mode: s.mode }, bar: `degenerate == ${check.expectDegenerate}`, ms: Date.now() - t0 };
        }
        if (check.kind === 'harness_build') {
            const harness = require('../skills/graft_tool_harness.js');
            fs.mkdirSync(SCRATCH_DIR, { recursive: true });
            const target = path.join(SCRATCH_DIR, check.fileName);
            const r = await harness._runHarness({
                task: `benchmark T3 build probe (${check.id})`,
                steps: [{ skill: 'file_system', input: { action: 'write_file', path: target, content: check.content } }],
                pltImpact: { profitImpact: 0.1, loveImpact: 0.1, taxImpact: 0.05 },
            }, null, null);
            const probesOk = (r.verification || []).length > 0 && r.verification.every(p => p.ok);
            return { ...base, status: r.status === 'completed' && probesOk ? 'pass' : 'fail', metric: { harnessStatus: r.status, probes: (r.verification || []).map(p => ({ name: p.name, ok: p.ok })), runId: r.runId }, bar: 'harness status completed + all read-back probes ok', ms: Date.now() - t0 };
        }
        if (check.kind === 'fetch') {
            const senses = require('../skills/graft_senses.js');
            const fn = senses.skill_graft_senses || senses.run;
            const r = await fn({ action: 'web_fetch', url: check.url }, null, null);
            const text = (r && r.text) || '';
            const found = text.includes(check.contains);
            return { ...base, status: r && r.success && found ? 'pass' : 'fail', metric: { success: !!(r && r.success), title: r && r.title ? String(r.title).slice(0, 80) : null, chars: text.length, contains: found }, bar: `fetch ok + text contains ${JSON.stringify(check.contains)}`, ms: Date.now() - t0 };
        }
        if (check.seatRequired) {
            return { ...base, status: 'skipped', metric: {}, bar: 'seat-required', detail: check.skipReason || 'seat-required check', ms: Date.now() - t0 };
        }
        return { ...base, status: 'fail', metric: {}, bar: 'unknown check kind', detail: `unknown kind: ${check.kind}`, ms: Date.now() - t0 };
    } catch (e) {
        return { ...base, status: 'fail', metric: {}, bar: check.bar || '', detail: `check threw: ${String(e && e.message || e).slice(0, 240)}`, ms: Date.now() - t0 };
    }
}

function diffReports(prev, curr) {
    if (!prev) return { baseline: true, note: 'no previous report — this run is the baseline', changes: [], regressions: [] };
    const pmap = new Map((prev.results || []).map(r => [r.id, r]));
    const changes = [], regressions = [];
    for (const r of curr.results) {
        const p = pmap.get(r.id);
        if (!p) { changes.push({ id: r.id, change: 'new_check', to: r.status }); continue; }
        if (p.status !== r.status) {
            changes.push({ id: r.id, change: `${p.status} -> ${r.status}` });
            if (p.status === 'pass' && r.status === 'fail') regressions.push(r.id);
        }
    }
    for (const p of prev.results || []) {
        if (!curr.results.find(r => r.id === p.id)) changes.push({ id: p.id, change: 'removed_check' });
    }
    return { baseline: false, previousRanAt: prev.ranAt, changes, regressions };
}

async function runBenchmarks(opts = {}) {
    const fixtures = JSON.parse(fs.readFileSync(FIXTURES_PATH, 'utf8'));
    const results = [];
    for (const check of fixtures.checks) results.push(await runCheck(check));
    const summary = {
        pass: results.filter(r => r.status === 'pass').length,
        fail: results.filter(r => r.status === 'fail').length,
        skipped: results.filter(r => r.status === 'skipped').length,
    };
    let prev = null;
    try { prev = JSON.parse(fs.readFileSync(path.join(BENCH_DIR, 'latest.json'), 'utf8')); } catch { prev = null; }
    const report = {
        suite: fixtures.suite, version: fixtures.version, ranAt: new Date().toISOString(),
        results, summary,
    };
    report.diff = diffReports(prev, report);
    if (!opts.noWrite) {
        fs.mkdirSync(BENCH_DIR, { recursive: true });
        const file = path.join(BENCH_DIR, `report-${nowStamp()}.json`);
        fs.writeFileSync(file, JSON.stringify(report, null, 2), 'utf8');
        fs.writeFileSync(path.join(BENCH_DIR, 'latest.json'), JSON.stringify(report, null, 2), 'utf8');
        report.file = file;
    }
    return report;
}

if (require.main === module) {
    (async () => {
        const report = await runBenchmarks();
        if (process.argv.includes('--json')) {
            console.log(JSON.stringify(report, null, 2));
        } else {
            console.log(`BENCHMARK ${report.suite} v${report.version} — ${report.ranAt}`);
            for (const r of report.results) {
                console.log(`  ${r.status.toUpperCase().padEnd(7)} ${r.id}  [${JSON.stringify(r.metric)}]${r.detail ? ` — ${r.detail}` : ''}`);
            }
            console.log(`  summary: ${report.summary.pass} pass / ${report.summary.fail} fail / ${report.summary.skipped} skipped`);
            console.log(`  diff: ${report.diff.baseline ? 'baseline run' : `${report.diff.changes.length} change(s), regressions: ${report.diff.regressions.join(', ') || 'none'}`}`);
            console.log(`  report: ${report.file}`);
        }
        process.exit(report.summary.fail > 0 || (report.diff.regressions || []).length > 0 ? 1 : 0);
    })().catch(e => { console.error(`benchmark runner failed: ${e.message}`); process.exit(2); });
}

module.exports = { runBenchmarks, _runCheck: runCheck, _diffReports: diffReports, FIXTURES_PATH, BENCH_DIR };
