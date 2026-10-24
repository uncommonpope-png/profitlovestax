'use strict';
/**
 * GRAFT — BENCHMARK (Steal List #3, 2026-10-23)
 *
 * The in-body handle on the standing benchmark suite
 * (gsk-core/benchmarks/run-benchmarks.cjs + exam-v1.json — the
 * Oct 23 capability exam frozen as versioned fixtures). The suite
 * itself is a plain node runner so it can also run from cron/CLI
 * without the body; this graft is how the harness runs it as a
 * step and reads the last report.
 *
 * Actions:
 *   run   → run the suite; returns per-check verdicts, summary,
 *           and the diff against the previous run (regressions
 *           named). Seat-required checks report SKIPPED, never pass.
 *   last  → the most recent report without re-running.
 */

const fs = require('fs');
const path = require('path');

const PLT_AFFINITY = { profit: 0.7, love: 0.4, tax: 0.15 };
const BENCH_DIR = path.resolve(__dirname, '..', '..', '..', 'workbench', '.seshat-brain', 'benchmarks');

async function skill_graft_benchmark(input = {}, brain, memory) {
    const action = input.action || 'run';
    if (action === 'last') {
        try {
            const report = JSON.parse(fs.readFileSync(path.join(BENCH_DIR, 'latest.json'), 'utf8'));
            return { success: true, skill: 'graft_benchmark', action, report };
        } catch {
            return { success: false, skill: 'graft_benchmark', action, error: 'no_report_yet', detail: 'no benchmark report exists yet — run the suite first (action run)' };
        }
    }
    if (action === 'run') {
        try {
            const runner = require('../benchmarks/run-benchmarks.cjs');
            const report = await runner.runBenchmarks();
            return {
                success: report.summary.fail === 0,
                skill: 'graft_benchmark', action,
                summary: report.summary,
                regressions: report.diff ? report.diff.regressions : [],
                results: report.results.map(r => ({ id: r.id, status: r.status, metric: r.metric })),
                reportFile: report.file || null,
            };
        } catch (e) {
            return { success: false, skill: 'graft_benchmark', action, error: 'suite_failed_to_run', detail: String(e && e.message || e).slice(0, 300) };
        }
    }
    return { success: false, skill: 'graft_benchmark', error: `Unknown action: ${action}`, available: ['run', 'last'] };
}

module.exports = {
    skill_graft_benchmark,
    run: skill_graft_benchmark,
    PLT_AFFINITY,
    MANIFEST: {
        name: 'graft_benchmark',
        description: 'Standing benchmark suite (Steal List #3): the Oct 23 capability exam frozen as versioned fixtures (benchmarks/exam-v1.json), runnable on demand via benchmarks/run-benchmarks.cjs or this graft; every run writes a diffable report under .seshat-brain/benchmarks/ and diffs against the previous run — regressions are named, seat-required checks are skipped honestly, never passed silently.',
        version: '1.0.0',
        inputs: { action: "'run' (default) | 'last'" },
        output: '{ success, summary {pass, fail, skipped}, regressions[], results[], reportFile }',
    },
};
